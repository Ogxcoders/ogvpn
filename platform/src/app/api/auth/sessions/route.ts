// Active session management (Section E): list sessions, revoke one, revoke all.
import { db } from "@/lib/db";
import { ok, fail, route, ApiError, getClientIp } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";

export const GET = route(async (req) => {
  const auth = await requireUser(req);
  const sessions = await db.session.findMany({
    where: { userId: auth.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, deviceLabel: true, platform: true, ip: true, createdAt: true, lastSeenAt: true, trusted: true },
  });
  return ok({
    currentSessionId: auth.sessionId,
    sessions: sessions.map((s) => ({
      ...s,
      isCurrent: s.id === auth.sessionId,
      ip: s.ip === getClientIp(req) ? s.ip : (s.ip ? "•.•.•.•" : null),
    })),
  });
}, { name: "auth.sessions.list" });

export const DELETE = route(async (req) => {
  const auth = await requireUser(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const session = await db.session.findFirst({ where: { id, userId: auth.id, revokedAt: null } });
    if (!session) throw new ApiError(404, "not_found", "Session not found or already revoked.");
    await db.session.update({ where: { id }, data: { revokedAt: new Date(), revokedReason: "user_revoked" } });
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "session.revoked", targetType: "session", targetId: id, ip: getClientIp(req) });
    return ok({ revoked: 1 });
  }
  return fail(400, "invalid_input", "Provide ?id= to revoke a session, or use logout-all.");
}, { name: "auth.sessions.revoke" });
