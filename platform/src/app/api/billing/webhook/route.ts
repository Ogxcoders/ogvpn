// Payment webhook (AE 712-715): HMAC signature validation, duplicate-event
// protection, idempotent subscription reconciliation. This endpoint is
// authenticated by the x-aegis-signature header, NOT by session cookies —
// it mirrors how Stripe-class providers call production endpoints.
import { db } from "@/lib/db";
import { ApiError, ok, route, readJsonSafe, metricCounter } from "@/lib/api";
import { hmacSign, randomToken } from "@/lib/crypto";
import { audit, notify } from "@/lib/audit";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "aegis-webhook-sim-dev";

export const POST = route(async (req) => {
  const raw = await req.text();
  const signature = req.headers.get("x-aegis-signature") || "";
  const expected = hmacSign(WEBHOOK_SECRET, raw);
  if (signature !== expected) {
    await db.paymentEvent.create({
      data: { eventId: `evt_rej_${randomToken(8)}`, type: "rejected", payload: raw.slice(0, 500), signatureValid: false, status: "rejected" },
    }).catch(() => {});
    throw new ApiError(401, "invalid_input", "Invalid webhook signature.");
  }
  let parsed: Record<string, unknown> = {};
  try {
    const parsedBody: unknown = JSON.parse(raw);
    if (parsedBody && typeof parsedBody === "object") parsed = parsedBody as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "invalid_input", "Webhook payload must be JSON.");
  }
  const eventId = typeof parsed.eventId === "string" ? parsed.eventId : "";
  const type = typeof parsed.type === "string" ? parsed.type : "";
  if (!eventId || !type) throw new ApiError(400, "invalid_input", "Webhook requires eventId and type.");

  // Duplicate-webhook protection (AE 713): eventId is unique
  const dupe = await db.paymentEvent.findUnique({ where: { eventId } });
  if (dupe) {
    metricCounter("webhook_duplicate");
    return ok({ duplicate: true, eventId });
  }
  await db.paymentEvent.create({
    data: { eventId, type, payload: raw.slice(0, 4000), signatureValid: true, status: "processed", processedAt: new Date() },
  });
  metricCounter("webhook_processed");

  // Subscription reconciliation (AE 715 / AD 703-704)
  if (type === "invoice.payment_failed" && parsed.data && typeof parsed.data === "object" && "userId" in parsed.data) {
    const target = await db.subscription.findUnique({ where: { userId: String((parsed.data as { userId: unknown }).userId) } });
    if (target && target.plan !== "free") {
      const graceEnd = new Date(Date.now() + 3 * 86400e3);
      await db.subscription.update({ where: { id: target.id }, data: { status: "grace", graceEndsAt: graceEnd } });
      await notify({
        userId: target.userId, category: "billing", type: "payment_failed", priority: "critical",
        title: "Payment failed",
        body: "Your last payment failed. Update your payment method to keep premium features active. A 3-day grace period has been applied.",
      });
    }
  }
  await audit({ action: "billing.webhook_processed", targetType: "payment_event", targetId: eventId, metadata: { type }, severity: "info" });
  return ok({ processed: true, eventId });
}, { name: "billing.webhook" });
