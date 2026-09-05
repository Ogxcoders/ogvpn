import type { DB } from "../db.js";
import { queryOne } from "../db.js";
import { ApiError } from "../lib/errors.js";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: "free" | "premium";
  status: "active" | "canceled" | "expired" | "past_due";
  current_period_end: string | null;
  max_devices?: number;
}

export const PLAN_LIMITS: Record<string, number> = { free: 2, premium: 10 };

/** Effective entitlement of a user right now. */
export function effectiveSubscription(
  db: DB,
  userId: string,
): { plan: "free" | "premium"; status: string; maxDevices: number; currentPeriodEnd: string | null } {
  const sub = queryOne<SubscriptionRow>(
    db,
    "SELECT * FROM subscriptions WHERE user_id = ?",
    userId,
  );
  if (!sub) {
    return { plan: "free", status: "active", maxDevices: PLAN_LIMITS.free!, currentPeriodEnd: null };
  }
  const expired =
    sub.current_period_end && Date.parse(sub.current_period_end) < Date.now();
  const status = expired ? "expired" : sub.status;
  // Canceled subs stay usable until period end; expired ones fall back to free.
  const plan = status === "expired" ? "free" : sub.plan;
  return {
    plan,
    status,
    maxDevices: PLAN_LIMITS[plan] ?? PLAN_LIMITS.free!,
    currentPeriodEnd: sub.current_period_end,
  };
}

/** Gate for provisioning a new tunnel. */
export function assertCanProvision(db: DB, userId: string): void {
  const sub = effectiveSubscription(db, userId);
  if (sub.status === "past_due") {
    throw ApiError.forbidden(
      "Subscription payment failed. Update billing to continue.",
      "SUBSCRIPTION_PAST_DUE",
    );
  }
  if (sub.status === "expired") {
    // Free tier still allowed — only premium features gated. No block.
    return;
  }
  void db; // explicit for clarity
}

export function assertDeviceLimit(
  db: DB,
  userId: string,
  activeDeviceCount: number,
): void {
  const sub = effectiveSubscription(db, userId);
  if (activeDeviceCount > sub.maxDevices) {
    throw ApiError.forbidden(
      `Plan ${sub.plan} allows ${sub.maxDevices} devices. Upgrade or revoke a device.`,
      "DEVICE_LIMIT_REACHED",
    );
  }
}
