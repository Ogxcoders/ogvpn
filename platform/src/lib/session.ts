// Session authentication: DB-backed sessions, httpOnly cookies, rolling
// expiration, revocation, logout-all, stale-session detection.
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { ApiError } from "@/lib/api";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "aegis_session";
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000; // 7 days
const SESSION_REFRESH_THRESHOLD_MS = 24 * 3600 * 1000;

export type AuthedUser = User & { sessionId: string; sessionTrusted: boolean };

export function sessionCookie(token: string, maxAgeSec: number): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function createSession(
  user: User,
  meta: { ip: string; userAgent: string; deviceLabel?: string; platform?: string; trusted?: boolean }
): Promise<{ token: string; session: { id: string; expiresAt: Date } }> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      ip: meta.ip,
      userAgent: meta.userAgent?.slice(0, 400),
      deviceLabel: meta.deviceLabel || deriveDeviceLabel(meta.userAgent),
      platform: meta.platform || "web",
      trusted: meta.trusted ?? false,
      expiresAt,
    },
  });
  return { token, session: { id: session.id, expiresAt } };
}

function deriveDeviceLabel(ua: string): string {
  const u = ua || "";
  if (/android/i.test(u)) return "Android device";
  if (/iphone|ipad/i.test(u)) return "iOS device";
  if (/windows/i.test(u)) return "Windows device";
  if (/mac os/i.test(u)) return "macOS device";
  if (/linux/i.test(u)) return "Linux device";
  if (/chrome/i.test(u)) return "Chrome browser";
  return "Web browser";
}

export async function getSessionUser(req: Request): Promise<AuthedUser | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const m = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!m) return null;
  const token = decodeURIComponent(m[1]);
  if (!token || token.length < 20) return null;
  const tokenHash = sha256(token);
  const session = await db.session.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!session) return null;
  if (session.revokedAt) throw new ApiError(401, "stale_session", "This session was revoked. Please sign in again.");
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.update({ where: { id: session.id }, data: { revokedAt: new Date(), revokedReason: "expired" } }).catch(() => {});
    throw new ApiError(401, "stale_session", "Your session has expired. Please sign in again.");
  }
  if (session.user.status === "deleted") return null;
  if (session.user.status === "suspended") {
    throw new ApiError(403, "account_suspended", session.user.statusReason || "This account is suspended.");
  }
  // rolling refresh
  const now = Date.now();
  const shouldRefresh = session.expiresAt.getTime() - now < SESSION_REFRESH_THRESHOLD_MS;
  const expiredSession = session.expiresAt.getTime() < now;
  await db.session.update({
    where: { id: session.id },
    data: {
      lastSeenAt: new Date(),
      ...(shouldRefresh && !expiredSession ? { expiresAt: new Date(now + SESSION_TTL_MS) } : {}),
    },
  }).catch(() => {});
  return { ...session.user, sessionId: session.id, sessionTrusted: session.trusted };
}

export async function requireUser(req: Request): Promise<AuthedUser> {
  const user = await getSessionUser(req);
  if (!user) throw new ApiError(401, "authentication_required", "You must be signed in to do that.");
  return user;
}

export async function requireAdmin(req: Request): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (user.role !== "admin") throw new ApiError(403, "permission_denied", "Administrator access is required for this action.");
  return user;
}

export async function revokeSession(sessionId: string, reason: string) {
  await db.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date(), revokedReason: reason },
  }).catch(() => {});
}

export async function revokeAllSessions(userId: string, reason: string, exceptSessionId?: string) {
  const sessions = await db.session.findMany({
    where: { userId, revokedAt: null, id: exceptSessionId ? { not: exceptSessionId } : undefined },
    select: { id: true },
  });
  for (const s of sessions) {
    await db.session.update({ where: { id: s.id }, data: { revokedAt: new Date(), revokedReason: reason } }).catch(() => {});
  }
  return sessions.length;
}
