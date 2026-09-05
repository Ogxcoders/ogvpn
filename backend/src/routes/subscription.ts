import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import type { DB } from "../db.js";
import { query, queryOne, run } from "../db.js";
import type { Config } from "../config.js";
import type { EventBus } from "../events.js";
import { ApiError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { effectiveSubscription } from "../services/entitlements.js";
import { newId, nowIso } from "../lib/util.js";

interface PlanRow {
  code: string;
  name: string;
  price_cents: number;
  interval: string;
  max_devices: number;
  features: string;
}

interface SubRow {
  id: string;
  plan: "free" | "premium";
  status: "active" | "canceled" | "expired" | "past_due";
  current_period_end: string | null;
}

export function subscriptionRoutes(cfg: Config, db: DB, bus: EventBus): Router {
  const r = Router();
  r.use(requireAuth(cfg, db));

  r.get("/plans", (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = query<PlanRow>(db, "SELECT * FROM plans ORDER BY price_cents ASC");
      res.json({
        plans: rows.map((p) => ({
          code: p.code,
          name: p.name,
          priceCents: p.price_cents,
          interval: p.interval,
          maxDevices: p.max_devices,
          features: JSON.parse(p.features) as string[],
        })),
      });
    } catch (e) {
      next(e);
    }
  });

  r.get("/", (req: Request, res: Response, next: NextFunction) => {
    try {
      const eff = effectiveSubscription(db, req.auth!.userId);
      const sub = queryOne<SubRow>(
        db,
        "SELECT * FROM subscriptions WHERE user_id = ?",
        req.auth!.userId,
      );
      res.json({
        subscription: {
          plan: eff.plan,
          status: sub ? sub.status : "active",
          currentPeriodEnd: sub?.current_period_end ?? null,
          maxDevices: eff.maxDevices,
        },
      });
    } catch (e) {
      next(e);
    }
  });

  r.post("/checkout", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z.object({ planCode: z.enum(["free", "premium"]) }).parse(req.body);
      if (cfg.paymentsProvider === "stripe") {
        // Real integration point: create a Stripe Checkout Session here.
        // The interface is stubbed deliberately — it must not silently
        // pretend payment happened when a live provider is configured.
        throw new ApiError(501, "NOT_IMPLEMENTED", "Stripe checkout is not wired in this build; set PAYMENTS_PROVIDER=none for demo mode");
      }
      const periodEnd =
        body.planCode === "premium"
          ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
          : null;
      const existing = queryOne<SubRow>(
        db,
        "SELECT * FROM subscriptions WHERE user_id = ?",
        req.auth!.userId,
      );
      if (existing) {
        run(
          db,
          "UPDATE subscriptions SET plan = ?, status = 'active', current_period_end = ?, updated_at = ? WHERE id = ?",
          body.planCode,
          periodEnd,
          nowIso(),
          existing.id,
        );
      } else {
        run(
          db,
          "INSERT INTO subscriptions (id, user_id, plan, status, current_period_end, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?, ?)",
          newId(),
          req.auth!.userId,
          body.planCode,
          periodEnd,
          nowIso(),
          nowIso(),
        );
      }
      bus.publish(
        req.auth!.userId,
        "subscription.changed",
        { plan: body.planCode, status: "active" },
        { title: "Subscription updated", body: `Your plan is now ${body.planCode}.` },
      );
      // Demo-mode checkout is clearly labeled everywhere it appears.
      audit(db, "subscription.checkout.simulated", {
        actorUserId: req.auth!.userId,
        targetType: "subscription",
        meta: { plan: body.planCode, provider: "demo" },
      });
      res.json({
        subscription: {
          plan: body.planCode,
          status: "active",
          currentPeriodEnd: periodEnd,
          simulatedPayment: true,
        },
      });
    } catch (e) {
      next(e);
    }
  });

  r.post("/cancel", (req: Request, res: Response, next: NextFunction) => {
    try {
      const sub = queryOne<SubRow>(
        db,
        "SELECT * FROM subscriptions WHERE user_id = ?",
        req.auth!.userId,
      );
      if (!sub) throw ApiError.notFound("No subscription");
      const periodEnd = sub.current_period_end ?? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
      run(
        db,
        "UPDATE subscriptions SET status = 'canceled', current_period_end = ?, updated_at = ? WHERE id = ?",
        periodEnd,
        nowIso(),
        sub.id,
      );
      bus.publish(
        req.auth!.userId,
        "subscription.changed",
        { plan: sub.plan, status: "canceled" },
        { title: "Subscription canceled", body: "Active until the end of the billing period." },
      );
      audit(db, "subscription.cancel", { actorUserId: req.auth!.userId });
      const eff = effectiveSubscription(db, req.auth!.userId);
      res.json({
        subscription: {
          plan: sub.plan,
          status: "canceled",
          currentPeriodEnd: periodEnd,
          maxDevices: eff.maxDevices,
        },
      });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
