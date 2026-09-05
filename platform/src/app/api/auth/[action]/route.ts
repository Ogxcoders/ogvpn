// Authentication service (Sections E/F/G/AB): register, login with MFA challenge,
// lockout, brute-force protection, CAPTCHA-after-failures, email verification,
// password reset/change, email change, logout, logout-all.
import { db } from "@/lib/db";
import {
  hashPassword, verifyPassword, randomToken, sha256, verifyTotp,
  generateBackupCodes, hashCodeList, consumeBackupCode, hmacSign,
} from "@/lib/crypto";
import {
  ApiError, ok, route, readJson, readJsonSafe, requireEmail, requireString, rateLimit, rateLimitResponse,
  getClientIp, getUserAgent, validatePassword, sanitizeText, metricCounter,
} from "@/lib/api";
import { createSession, sessionCookie, clearSessionCookie, revokeAllSessions, requireUser } from "@/lib/session";
import { audit, notify, ensureNotificationPrefs } from "@/lib/audit";

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || "aegis-captcha-hmac-dev";
const CAPTCHA_THRESHOLD = 3;

// MFA login challenges (in-memory, short TTL)
const mfaChallenges = new Map<string, { userId: string; expires: number; ip: string }>();
function issueChallenge(userId: string, ip: string): string {
  const token = randomToken(24);
  mfaChallenges.set(token, { userId, expires: Date.now() + 5 * 60_000, ip });
  return token;
}
function takeChallenge(token: string): string {
  const c = mfaChallenges.get(token);
  if (!c || c.expires < Date.now()) throw new ApiError(401, "mfa_required", "This sign-in challenge expired. Start again.");
  mfaChallenges.delete(token);
  return c.userId;
}

// CAPTCHA-equivalent abuse protection: math challenge (req 116)
const captchaStore = new Map<string, { answer: number; expires: number }>();
function makeCaptcha(): { id: string; question: string } {
  const a = 2 + Math.floor(Math.random() * 9);
  const b = 2 + Math.floor(Math.random() * 9);
  const id = randomToken(12);
  captchaStore.set(id, { answer: a + b, expires: Date.now() + 10 * 60_000 });
  return { id, question: `${a} + ${b}` };
}
function verifyCaptcha(id: unknown, answer: unknown): boolean {
  if (typeof id !== "string" || typeof answer !== "string") return false;
  const c = captchaStore.get(id);
  captchaStore.delete(id);
  if (!c || c.expires < Date.now()) return false;
  return String(c.answer) === answer.trim();
}

async function recordAttempt(email: string, userId: string | null, success: boolean, reason?: string, ip?: string, ua?: string, suspicious = false) {
  await db.authAttempt.create({ data: { email, userId, success, reason, ip, userAgent: ua?.slice(0, 300), suspicious } }).catch(() => {});
}

async function previousSessionIps(userId: string): Promise<string[]> {
  const s = await db.session.findMany({ where: { userId, revokedAt: null }, select: { ip: true }, orderBy: { createdAt: "desc" }, take: 10 });
  return s.map((x) => x.ip || "");
}

async function revokeCurrent(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/aegis_session=([^;]+)/);
  if (m) {
    const s = await db.session.findUnique({ where: { tokenHash: sha256(decodeURIComponent(m[1])) } });
    if (s) await db.session.update({ where: { id: s.id }, data: { revokedAt: new Date(), revokedReason: "logout" } }).catch(() => {});
  }
}

async function finishLogin(user: { id: string; email: string; name: string | null; role: string; emailVerified: boolean; mfaEnabled: boolean }, meta: { ip: string; ua: string }) {
  const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  const prevIps = await previousSessionIps(user.id);
  const suspicious = prevIps.length > 0 && !prevIps.includes(meta.ip);
  const session = await createSession(dbUser, { ip: meta.ip, userAgent: meta.ua, platform: "web", trusted: !suspicious });
  await recordAttempt(user.email, user.id, true, "login", meta.ip, meta.ua, suspicious);
  await audit({ actorId: user.id, actorEmail: user.email, action: "auth.login", ip: meta.ip });
  if (suspicious) {
    await notify({
      userId: user.id, category: "security", type: "new_signin", priority: "important",
      title: "New sign-in to your account",
      body: `A sign-in from ${meta.ip} did not match your usual devices. If this wasn't you, review your sessions and rotate your password.`,
    });
    await audit({ actorId: user.id, actorEmail: user.email, action: "auth.suspicious_login", ip: meta.ip, severity: "warning" });
  }
  metricCounter("auth_login_success");
  return Response.json(
    { ok: true, data: { user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, mfaEnabled: user.mfaEnabled }, emailUnverified: !user.emailVerified } },
    { headers: { "set-cookie": sessionCookie(session.token, 7 * 24 * 3600) } }
  );
}

export const GET = route(async (req, ctx) => {
  const params = ctx?.params ? await ctx.params : {};
  const action = params.action;
  if (action === "session") {
    try {
      const user = await requireUser(req);
      return ok({
        authenticated: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, mfaEnabled: user.mfaEnabled, status: user.status, clientVersion: user.clientVersion },
        sessionId: user.sessionId,
      });
    } catch {
      return ok({ authenticated: false, user: null });
    }
  }
  if (action === "captcha") return ok(makeCaptcha());
  throw new ApiError(404, "not_found", "Unknown auth endpoint.");
}, { name: "auth.get" });

export const POST = route(async (req, ctx) => {
  const params = ctx?.params ? await ctx.params : {};
  const action = params.action;
  const body = await readJsonSafe(req);
  const ip = getClientIp(req);
  const ua = getUserAgent(req);

  switch (action) {
    case "register": {
      const rl = rateLimit(`register:${ip}`, 5, 3600_000);
      if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);
      const email = requireEmail(body);
      const password = requireString(body, "password", 128);
      const name = sanitizeText(body.name, 80);
      const pwErr = validatePassword(password);
      if (pwErr) throw new ApiError(400, "invalid_input", pwErr);
      const existing = await db.user.findUnique({ where: { email } });
      if (existing && existing.status !== "deleted") {
        await recordAttempt(email, null, false, "duplicate_register", ip, ua);
        throw new ApiError(409, "conflict", "An account with this email already exists. Try signing in or reset your password.");
      }
      if (existing) throw new ApiError(409, "conflict", "This email is reserved pending deletion. Contact support to restore it.");
      const verifyToken = randomToken(24);
      const user = await db.user.create({
        data: {
          email, passwordHash: hashPassword(password), name: name || null,
          emailVerifyToken: sha256(verifyToken), emailVerifyExpires: new Date(Date.now() + 48 * 3600e3),
          clientVersion: sanitizeText(body.clientVersion, 12) || "1.0.0",
        },
      });
      await db.subscription.create({
        data: { userId: user.id, plan: "free", status: "active", deviceLimit: 1, bandwidthGb: 10, currentPeriodEnd: new Date(Date.now() + 3650 * 86400e3) },
      });
      await ensureNotificationPrefs(user.id);
      await recordAttempt(email, user.id, true, "register", ip, ua);
      await audit({ actorId: user.id, actorEmail: email, action: "account.created", ip, targetType: "user", targetId: user.id });
      await notify({ userId: user.id, category: "account", type: "welcome", title: "Welcome to AegisVPN", body: "Your account is ready. Connect from the dashboard to get protected.", email: false });
      const session = await createSession(user, { ip, userAgent: ua, platform: "web" });
      metricCounter("auth_register");
      return Response.json(
        { ok: true, data: { user: { id: user.id, email, name, role: user.role }, emailUnverified: true, devVerificationToken: verifyToken } },
        { headers: { "set-cookie": sessionCookie(session.token, 7 * 24 * 3600) } }
      );
    }

    case "login": {
      const rlIp = rateLimit(`login-ip:${ip}`, 20, 15 * 60_000);
      if (!rlIp.allowed) return rateLimitResponse(rlIp.retryAfterSec);
      const email = requireEmail(body);
      const password = requireString(body, "password", 128);
      const rlEmail = rateLimit(`login-email:${email}`, 8, 15 * 60_000);
      if (!rlEmail.allowed) return rateLimitResponse(rlEmail.retryAfterSec);
      const user = await db.user.findUnique({ where: { email } });
      if (!user || user.status === "deleted") {
        await recordAttempt(email, null, false, "unknown_account", ip, ua);
        throw new ApiError(401, "invalid_credentials", "Incorrect email or password.");
      }
      if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
        await recordAttempt(email, user.id, false, "locked", ip, ua, true);
        throw new ApiError(423, "account_locked", "Too many failed attempts. Try again in a few minutes.");
      }
      if (user.status === "suspended") {
        await recordAttempt(email, user.id, false, "suspended", ip, ua);
        throw new ApiError(403, "account_suspended", user.statusReason || "This account is suspended. Contact support.");
      }
      if (!verifyPassword(password, user.passwordHash)) {
        const failed = user.failedLoginCount + 1;
        const shouldLock = failed >= 5;
        const needCaptcha = failed >= CAPTCHA_THRESHOLD;
        await db.user.update({
          where: { id: user.id },
          data: { failedLoginCount: failed, lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60_000) : null },
        });
        await recordAttempt(email, user.id, false, "invalid_password", ip, ua, failed >= CAPTCHA_THRESHOLD);
        metricCounter("auth_login_failure");
        if (shouldLock) {
          await audit({ actorId: user.id, actorEmail: email, action: "account.lockout", ip, severity: "warning" });
          await notify({ userId: user.id, category: "security", type: "lockout", title: "Account temporarily locked", body: "We detected several failed sign-in attempts. Your account was locked for 15 minutes.", priority: "critical" });
        }
        throw new ApiError(401, "invalid_credentials", needCaptcha ? "Incorrect email or password. Complete the verification challenge to continue." : "Incorrect email or password.", { captchaRequired: needCaptcha });
      }
      if (user.failedLoginCount >= CAPTCHA_THRESHOLD && !verifyCaptcha(body.captchaId, body.captchaAnswer)) {
        await recordAttempt(email, user.id, false, "captcha_missing", ip, ua, true);
        throw new ApiError(400, "invalid_input", "Complete the verification challenge to continue.", { captchaRequired: true });
      }
      if (user.mfaEnabled && user.totpSecret) {
        const challengeToken = issueChallenge(user.id, ip);
        return ok({ mfaRequired: true, challengeToken, maskedEmail: email.replace(/^(.).*(@.*)$/, "$1***$2") });
      }
      return finishLogin(user, { ip, ua });
    }

    case "verify-login": {
      const challengeToken = requireString(body, "challengeToken", 64);
      const code = requireString(body, "code", 20);
      const userId = takeChallenge(challengeToken);
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.status !== "active") throw new ApiError(401, "invalid_credentials", "Sign-in could not be completed.");
      let usedBackup = false;
      let verified = user.totpSecret ? verifyTotp(user.totpSecret, code) : false;
      if (!verified && user.backupCodes) {
        const remaining = consumeBackupCode(code, user.backupCodes);
        if (remaining) {
          await db.user.update({ where: { id: user.id }, data: { backupCodes: remaining } });
          verified = true;
          usedBackup = true;
        }
      }
      if (!verified) {
        await recordAttempt(user.email, user.id, false, "mfa_invalid", ip, ua, true);
        metricCounter("auth_mfa_failure");
        throw new ApiError(401, "mfa_invalid", "That code is not valid. Check your authenticator and try again.");
      }
      if (usedBackup) {
        await audit({ actorId: user.id, actorEmail: user.email, action: "mfa.backup_used", ip, severity: "warning" });
        await notify({ userId: user.id, category: "security", type: "mfa_backup_used", title: "Backup code used", body: "A backup code was used to sign in. If this wasn't you, reset your password now.", priority: "critical" });
      }
      return finishLogin(user, { ip, ua });
    }

    case "logout": {
      const auth = await requireUser(req);
      await revokeAllSessions(auth.id, "logout", auth.sessionId);
      await revokeCurrent(req);
      await audit({ actorId: auth.id, actorEmail: auth.email, action: "auth.logout", ip });
      return Response.json({ ok: true, data: {} }, { headers: { "set-cookie": clearSessionCookie() } });
    }

    case "logout-all": {
      const auth = await requireUser(req);
      const n = await revokeAllSessions(auth.id, "logout_all");
      await audit({ actorId: auth.id, actorEmail: auth.email, action: "auth.logout_all", ip, metadata: { sessionsRevoked: n } });
      return Response.json({ ok: true, data: { revoked: n } }, { headers: { "set-cookie": clearSessionCookie() } });
    }

    case "verify-email": {
      const token = requireString(body, "token", 80);
      const user = await db.user.findFirst({ where: { emailVerifyToken: sha256(token) } });
      if (!user || !user.emailVerifyExpires || user.emailVerifyExpires.getTime() < Date.now()) {
        throw new ApiError(400, "invalid_input", "This verification link is invalid or has expired.");
      }
      await db.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null } });
      await audit({ actorId: user.id, actorEmail: user.email, action: "account.email_verified", ip: getClientIp(req) });
      return ok({ verified: true });
    }

    case "resend-verification": {
      const auth = await requireUser(req);
      if (auth.emailVerified) return ok({ alreadyVerified: true });
      const rl = rateLimit(`resend:${auth.id}`, 3, 3600_000);
      if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);
      const token = randomToken(24);
      await db.user.update({ where: { id: auth.id }, data: { emailVerifyToken: sha256(token), emailVerifyExpires: new Date(Date.now() + 48 * 3600e3) } });
      return ok({ sent: true, devVerificationToken: token });
    }

    case "password-reset-request": {
      const rl = rateLimit(`pwreset:${ip}`, 5, 3600_000);
      if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);
      const email = requireEmail(body);
      const user = await db.user.findUnique({ where: { email } });
      let devResetToken: string | undefined;
      if (user && user.status === "active") {
        const token = randomToken(24);
        await db.user.update({
          where: { id: user.id },
          data: { passwordResetToken: sha256(token), passwordResetExpires: new Date(Date.now() + 3600e3) },
        });
        devResetToken = token;
        await audit({ actorId: user.id, actorEmail: email, action: "account.password_reset_requested", ip: getClientIp(req) });
      }
      return ok({ sent: true, devResetToken });
    }

    case "password-reset-confirm": {
      const token = requireString(body, "token", 80);
      const password = requireString(body, "password", 128);
      const pwErr = validatePassword(password);
      if (pwErr) throw new ApiError(400, "invalid_input", pwErr);
      const user = await db.user.findFirst({ where: { passwordResetToken: sha256(token) } });
      if (!user || !user.passwordResetExpires || user.passwordResetExpires.getTime() < Date.now()) {
        throw new ApiError(400, "invalid_input", "This reset link is invalid or has expired. Request a new one.");
      }
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password), passwordResetToken: null, passwordResetExpires: null, failedLoginCount: 0, lockedUntil: null },
      });
      await revokeAllSessions(user.id, "password_reset");
      await audit({ actorId: user.id, actorEmail: user.email, action: "account.password_reset_completed", ip: getClientIp(req), severity: "warning" });
      await notify({ userId: user.id, category: "security", type: "password_reset", title: "Password changed", body: "Your password was reset and all sessions were signed out.", priority: "critical" });
      return ok({ reset: true });
    }

    case "password-change": {
      const auth = await requireUser(req);
      const current = requireString(body, "currentPassword", 128);
      const next = requireString(body, "newPassword", 128);
      if (!verifyPassword(current, auth.passwordHash)) {
        throw new ApiError(401, "invalid_credentials", "Your current password is incorrect.");
      }
      const pwErr = validatePassword(next);
      if (pwErr) throw new ApiError(400, "invalid_input", pwErr);
      await db.user.update({ where: { id: auth.id }, data: { passwordHash: hashPassword(next) } });
      await revokeAllSessions(auth.id, "password_change", auth.sessionId);
      await audit({ actorId: auth.id, actorEmail: auth.email, action: "account.password_changed", ip: getClientIp(req), severity: "warning" });
      await notify({ userId: auth.id, category: "security", type: "password_change", title: "Password changed", body: "Your password was changed. Other devices were signed out.", priority: "important" });
      return ok({ changed: true });
    }

    case "email-change": {
      const auth = await requireUser(req);
      const password = requireString(body, "password", 128);
      const newEmail = requireEmail(body);
      if (newEmail === auth.email) throw new ApiError(400, "invalid_input", "That is already your email address.");
      if (!verifyPassword(password, auth.passwordHash)) {
        throw new ApiError(401, "invalid_credentials", "Password confirmation failed.");
      }
      const taken = await db.user.findUnique({ where: { email: newEmail } });
      if (taken) throw new ApiError(409, "conflict", "An account already uses that email.");
      const token = randomToken(24);
      await db.user.update({
        where: { id: auth.id },
        data: { pendingEmail: newEmail, pendingEmailToken: sha256(token), pendingEmailExpires: new Date(Date.now() + 24 * 3600e3) },
      });
      return ok({ sent: true, pendingEmail: newEmail, devEmailToken: token });
    }

    case "email-change-confirm": {
      const token = requireString(body, "token", 80);
      const user = await db.user.findFirst({ where: { pendingEmailToken: sha256(token) } });
      if (!user || !user.pendingEmail || !user.pendingEmailExpires || user.pendingEmailExpires.getTime() < Date.now()) {
        throw new ApiError(400, "invalid_input", "This confirmation link is invalid or expired.");
      }
      const taken = await db.user.findUnique({ where: { email: user.pendingEmail } });
      if (taken) throw new ApiError(409, "conflict", "That email was registered by another account meanwhile.");
      await db.user.update({
        where: { id: user.id },
        data: { email: user.pendingEmail, pendingEmail: null, pendingEmailToken: null, pendingEmailExpires: null, emailVerified: true },
      });
      await audit({ actorId: user.id, actorEmail: user.email, action: "account.email_changed", ip: getClientIp(req), severity: "warning" });
      return ok({ changed: true, email: user.pendingEmail });
    }

    case "profile": {
      const auth = await requireUser(req);
      const name = sanitizeText(body.name, 80);
      await db.user.update({ where: { id: auth.id }, data: { name: name || null } });
      await audit({ actorId: auth.id, actorEmail: auth.email, action: "account.profile_updated", ip: getClientIp(req) });
      return ok({ updated: true, name: name || null });
    }

    case "oauth": {
      // Optional identity providers (Section F): defined + graceful failure handling.
      const provider = requireString(body, "provider", 20);
      const supported = ["google", "apple", "microsoft", "passkey"];
      if (!supported.includes(provider)) throw new ApiError(400, "invalid_input", "Unsupported identity provider.");
      throw new ApiError(503, "dependency_failure", `${provider} sign-in is not enabled in this environment. Use email sign-in, or configure ${provider} OAuth keys to enable it.`);
    }

    default:
      throw new ApiError(404, "not_found", `Unknown auth action "${action}".`);
  }
}, { name: "auth.post" });
