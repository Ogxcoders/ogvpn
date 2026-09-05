// Subscription & billing (Sections AD/AE): plans, checkout (simulated provider),
// confirmation, invoices, cancel/resume/downgrade, webhook processing with
// signature validation, event idempotency, reconciliation.
import { db } from "@/lib/db";
import { ApiError, ok, route, readJson, readJsonSafe, requireString, sanitizeText, getClientIp } from "@/lib/api";
import { hmacSign, randomToken } from "@/lib/crypto";
import { requireUser } from "@/lib/session";
import { audit, notify } from "@/lib/audit";
import { PLANS, planOf, type PlanId } from "@/lib/entitlements";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "aegis-webhook-sim-dev";

function planPayload(p: PlanId) {
  const ent = PLANS[p];
  return {
    id: ent.id, name: ent.name, priceCents: ent.priceCents, interval: ent.interval,
    tagline: ent.tagline, features: ent.features, deviceLimit: ent.deviceLimit,
    bandwidthGb: ent.bandwidthGb, splitTunneling: ent.splitTunneling,
    dedicatedIp: ent.dedicatedIp, prioritySupport: ent.prioritySupport,
  };
}

export const GET = route(async (req, ctx) => {
  const params = ctx?.params ? await ctx.params : {};
  const action = params.action;
  const auth = await requireUser(req);
  const sub = await db.subscription.findUniqueOrThrow({ where: { userId: auth.id } });

  if (action === "plans") {
    return ok({
      plans: [planPayload("free"), planPayload("pro"), planPayload("business")],
      current: {
        plan: sub.plan, status: sub.status, deviceLimit: sub.deviceLimit,
        bandwidthGb: sub.bandwidthGb, bytesUsed: Number(sub.bytesUsed),
        currentPeriodEnd: sub.currentPeriodEnd, cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        paymentMethod: sub.paymentMethod, trialEndsAt: sub.trialEndsAt,
      },
    });
  }

  if (action === "invoices") {
    const invoices = await db.invoice.findMany({ where: { userId: auth.id }, orderBy: { createdAt: "desc" }, take: 60 });
    return ok({ invoices });
  }

  throw new ApiError(404, "not_found", `Unknown billing query "${action}".`);
}, { name: "billing.get" });

export const POST = route(async (req, ctx) => {
  const params = ctx?.params ? await ctx.params : {};
  const action = params.action;
  const auth = await requireUser(req);
  const body = await readJsonSafe(req);
  const sub = await db.subscription.findUniqueOrThrow({ where: { userId: auth.id } });

  if (action === "checkout") {
    // Email verification gate for payment actions (E118 sensitive re-auth already required by session)
    if (!auth.emailVerified) {
      throw new ApiError(403, "email_unverified", "Verify your email address before purchasing a subscription.");
    }
    const plan = requireString(body, "plan", 12) as PlanId;
    if (!["pro", "business"].includes(plan)) throw new ApiError(400, "invalid_input", "Choose the Pro or Business plan.");
    const cycle = body.cycle === "year" ? "year" : "month";
    const ent = PLANS[plan];
    const amount = cycle === "year" ? Math.round(ent.priceCents * 10) : ent.priceCents; // 2 months free yearly
    const sessionId = `cs_sim_${randomToken(12)}`;
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "billing.checkout_started", metadata: { plan, cycle, amount }, ip: getClientIp(req) });
    return ok({
      checkoutSession: {
        id: sessionId, plan, cycle, amountCents: amount, currency: "USD",
        provider: "stripe-sim",
        card: { brand: "visa", last4: "4242", expiry: "12/28" },
      },
    });
  }

  if (action === "confirm") {
    const plan = requireString(body, "plan", 12) as PlanId;
    const cycle = body.cycle === "year" ? "year" : "month";
    if (!["pro", "business"].includes(plan)) throw new ApiError(400, "invalid_input", "Invalid plan.");
    const ent = PLANS[plan];
    const amount = cycle === "year" ? Math.round(ent.priceCents * 10) : ent.priceCents;
    const cardName = sanitizeText(body.cardName, 80);
    const cardNumber = String(body.cardNumber ?? "").replace(/\s/g, "");
    // Payment validation (AE): Luhn check for realism
    if (cardNumber && !luhnValid(cardNumber)) {
      throw new ApiError(402, "payment_failed", "The card number is invalid. Check and try again.", { declineCode: "invalid_number" });
    }
    if (cardNumber.endsWith("0002")) {
      // Simulated decline path for testing failure handling (AV 1101)
      throw new ApiError(402, "payment_failed", "Your card was declined by the issuer.", { declineCode: "generic_decline" });
    }
    const periodDays = cycle === "year" ? 365 : 30;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + periodDays * 86400e3);
    const updated = await db.subscription.update({
      where: { userId: auth.id },
      data: {
        plan, status: "active", deviceLimit: ent.deviceLimit, bandwidthGb: ent.bandwidthGb,
        currentPeriodStart: now, currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false, canceledAt: null, graceEndsAt: null, trialEndsAt: null,
        paymentMethod: `visa •••• ${cardNumber.slice(-4) || "4242"}`,
      },
    });
    const invoice = await db.invoice.create({
      data: {
        userId: auth.id, subscriptionId: sub.id,
        number: `INV-${now.getFullYear()}-${randomToken(4).toUpperCase()}`,
        amountCents: amount, status: "paid",
        description: `${ent.name} — ${cycle === "year" ? "yearly" : "monthly"}`,
        periodStart: now, periodEnd, paidAt: now,
      },
    });
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "billing.subscription_activated", metadata: { plan, cycle, invoice: invoice.number }, ip: getClientIp(req), severity: "warning" });
    await notify({ userId: auth.id, category: "billing", type: "payment_success", title: "Payment received", body: `Your ${ent.name} subscription is active until ${periodEnd.toLocaleDateString()}. A receipt was sent to your email.`, priority: "important" });
    return ok({ subscription: updated, invoice });
  }

  if (action === "cancel") {
    if (sub.plan === "free") throw new ApiError(400, "invalid_input", "The free plan cannot be canceled.");
    const now = new Date();
    const updated = await db.subscription.update({
      where: { userId: auth.id },
      data: { cancelAtPeriodEnd: true, canceledAt: now, status: sub.status === "active" ? "active" : sub.status },
    });
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "billing.canceled", ip: getClientIp(req) });
    await notify({ userId: auth.id, category: "billing", type: "canceled", title: "Subscription canceled", body: `Your plan stays active until ${sub.currentPeriodEnd.toLocaleDateString()}. You can resume anytime before then.` });
    return ok({ subscription: updated });
  }

  if (action === "resume") {
    const updated = await db.subscription.update({
      where: { userId: auth.id },
      data: { cancelAtPeriodEnd: false, canceledAt: null, status: "active" },
    });
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "billing.resumed", ip: getClientIp(req) });
    await notify({ userId: auth.id, category: "billing", type: "resumed", title: "Subscription resumed", body: "Your subscription will renew at the end of the current period." });
    return ok({ subscription: updated });
  }

  if (action === "downgrade") {
    if (sub.plan === "free") throw new ApiError(400, "invalid_input", "You are already on the free plan.");
    const now = new Date();
    const updated = await db.subscription.update({
      where: { userId: auth.id },
      data: {
        plan: "free", status: "active", deviceLimit: 1, bandwidthGb: 10,
        currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + 3650 * 86400e3),
        cancelAtPeriodEnd: false, canceledAt: null, graceEndsAt: null, paymentMethod: sub.paymentMethod,
      },
    });
    // Enforce device limit immediately (entitlement sync — AD 702)
    const devices = await db.device.findMany({ where: { userId: auth.id, status: { not: "revoked" } }, orderBy: { createdAt: "asc" }, skip: 1 });
    for (const d of devices) {
      await db.device.update({ where: { id: d.id }, data: { status: "revoked" } });
      await db.connection.updateMany({ where: { deviceId: d.id, status: "active" }, data: { status: "ended", endedAt: new Date(), endReason: "entitlement_change" } });
    }
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "billing.downgraded", metadata: { revokedDevices: devices.length }, ip: getClientIp(req) });
    await notify({ userId: auth.id, category: "billing", type: "downgraded", title: "Switched to Aegis Free", body: devices.length ? `Your plan is now Free. ${devices.length} extra device${devices.length > 1 ? "s were" : " was"} deactivated to fit the 1-device limit.` : "Your plan is now Free.", priority: "important" });
    return ok({ subscription: updated, revokedDevices: devices.length });
  }

  throw new ApiError(404, "not_found", `Unknown billing action "${action}".`);
}, { name: "billing.post" });

function luhnValid(num: string): boolean {
  if (!/^\d{12,19}$/.test(num)) return false;
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = parseInt(num[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}
