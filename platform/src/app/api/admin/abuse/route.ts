// Admin abuse & fraud review (AK): auth attempts, suspicious logins, lockouts,
// appeals queue, security-event escalation.
import { db } from "@/lib/db";
import { ok, route, readJson, requireString, sanitizeText, ApiError, getClientIp } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { audit, notify } from "@/lib/audit";

export const GET = route(async (req) => {
  await requireAdmin(req);
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "suspicious";
  const since = new Date(Date.now() - 7 * 86400e3);
  const where = filter === "all"
    ? { createdAt: { gte: since } }
    : filter === "suspicious"
      ? { createdAt: { gte: since }, suspicious: true }
      : { createdAt: { gte: since }, success: false };
  const attempts = await db.authAttempt.findMany({
    where, orderBy: { createdAt: "desc" }, take: 100,
  });
  const lockedUsers = await db.user.findMany({
    where: { lockedUntil: { gt: new Date() } },
    select: { id: true, email: true, lockedUntil: true, failedLoginCount: true, status: true },
  });
  const suspended = await db.user.findMany({
    where: { status: "suspended" },
    select: { id: true, email: true, statusReason: true, updatedAt: true },
  });
  const stats = await db.authAttempt.groupBy({
    by: ["reason"], where: { createdAt: { gte: since }, success: false }, _count: true,
  });
  return ok({ attempts, lockedUsers, suspended, failureBreakdown: stats });
}, { name: "admin.abuse" });

export const POST = route(async (req) => {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const action = sanitizeText(body.action, 20);

  if (action === "escalate") {
    const attemptId = requireString(body, "attemptId", 40);
    const attempt = await db.authAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new ApiError(404, "not_found", "Attempt not found.");
    if (attempt.userId) {
      await notify({
        userId: attempt.userId, category: "security", type: "suspicious_activity", priority: "critical",
        title: "Unusual sign-in activity detected",
        body: "We blocked a sign-in attempt that looked suspicious. We recommend changing your password and enabling MFA.",
      });
    }
    await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.abuse_escalated", targetType: "auth_attempt", targetId: attempt.id, ip: getClientIp(req), severity: "warning" });
    return ok({ escalated: true });
  }

  if (action === "dismiss") {
    const attemptId = requireString(body, "attemptId", 40);
    await db.authAttempt.update({ where: { id: attemptId }, data: { suspicious: false } }).catch(() => {});
    await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.abuse_dismissed", targetType: "auth_attempt", targetId: attemptId, ip: getClientIp(req) });
    return ok({ dismissed: true });
  }

  throw new ApiError(400, "invalid_input", `Unknown abuse action "${action}".`);
}, { name: "admin.abuse.post" });
