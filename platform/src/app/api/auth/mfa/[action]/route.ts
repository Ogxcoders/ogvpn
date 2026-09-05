// Multi-factor authentication (Section G): TOTP enrollment, verification,
// backup codes, regeneration, recovery, disable, audit events.
import { db } from "@/lib/db";
import {
  generateTotpSecret, totpUri, verifyTotp, generateBackupCodes, hashCodeList,
  consumeBackupCode, verifyPassword,
} from "@/lib/crypto";
import { ApiError, ok, route, readJson, readJsonSafe, requireString, rateLimit, rateLimitResponse, getClientIp } from "@/lib/api";
import { requireUser, revokeAllSessions } from "@/lib/session";
import { audit, notify } from "@/lib/audit";

export const POST = route(async (req, ctx) => {
  const params = ctx?.params ? await ctx.params : {};
  const action = params.action;
  const body = await readJsonSafe(req);
  const ip = getClientIp(req);
  const auth = await requireUser(req);

  switch (action) {
    case "enroll": {
      if (auth.mfaEnabled) throw new ApiError(409, "conflict", "MFA is already enabled on this account.");
      const rl = rateLimit(`mfa-enroll:${auth.id}`, 5, 3600_000);
      if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);
      const secret = generateTotpSecret();
      await db.user.update({ where: { id: auth.id }, data: { totpSecret: secret, mfaEnabled: false } });
      return ok({ secret, otpauthUri: totpUri(auth.email, secret) });
    }

    case "activate": {
      const code = requireString(body, "code", 10);
      const user = await db.user.findUniqueOrThrow({ where: { id: auth.id } });
      if (!user.totpSecret) throw new ApiError(400, "invalid_input", "Start enrollment first.");
      if (!verifyTotp(user.totpSecret, code)) {
        throw new ApiError(401, "mfa_invalid", "That code is incorrect. Make sure your clock is correct and try the next code.");
      }
      const codes = generateBackupCodes(10);
      await db.user.update({
        where: { id: auth.id },
        data: { mfaEnabled: true, totpEnrolledAt: new Date(), backupCodes: hashCodeList(codes) },
      });
      await audit({ actorId: auth.id, actorEmail: auth.email, action: "mfa.enabled", ip, severity: "warning" });
      await notify({ userId: auth.id, category: "security", type: "mfa_enabled", title: "MFA enabled", body: "Two-factor authentication is now protecting your account. Store your backup codes somewhere safe.", priority: "important", email: false });
      return ok({ enabled: true, backupCodes: codes });
    }

    case "backup-codes": {
      const user = await db.user.findUniqueOrThrow({ where: { id: auth.id } });
      if (!user.mfaEnabled) throw new ApiError(400, "invalid_input", "Enable MFA before generating backup codes.");
      const password = requireString(body, "password", 128);
      if (!verifyPassword(password, user.passwordHash)) {
        throw new ApiError(401, "invalid_credentials", "Password confirmation failed.");
      }
      const codes = generateBackupCodes(10);
      await db.user.update({ where: { id: auth.id }, data: { backupCodes: hashCodeList(codes) } });
      await audit({ actorId: auth.id, actorEmail: auth.email, action: "mfa.backup_regenerated", ip, severity: "warning" });
      return ok({ backupCodes: codes });
    }

    case "recover": {
      // MFA recovery: consume a backup code outside the login challenge flow
      const user = await db.user.findUniqueOrThrow({ where: { id: auth.id } });
      if (!user.backupCodes) throw new ApiError(400, "invalid_input", "No backup codes configured.");
      const code = requireString(body, "code", 20);
      const remaining = consumeBackupCode(code, user.backupCodes);
      if (!remaining) throw new ApiError(401, "mfa_invalid", "That backup code is not valid.");
      await db.user.update({ where: { id: auth.id }, data: { backupCodes: remaining } });
      await audit({ actorId: auth.id, actorEmail: auth.email, action: "mfa.recovery_code_used", ip, severity: "warning" });
      return ok({ valid: true, remainingCodes: JSON.parse(remaining).length });
    }

    case "disable": {
      const user = await db.user.findUniqueOrThrow({ where: { id: auth.id } });
      if (!user.mfaEnabled) throw new ApiError(400, "invalid_input", "MFA is not enabled.");
      const password = requireString(body, "password", 128);
      if (!verifyPassword(password, user.passwordHash)) {
        throw new ApiError(401, "invalid_credentials", "Password confirmation failed.");
      }
      const code = body.code ? requireString(body, "code", 20) : null;
      if (code && user.totpSecret && !verifyTotp(user.totpSecret, code)) {
        throw new ApiError(401, "mfa_invalid", "That code is incorrect.");
      }
      await db.user.update({ where: { id: auth.id }, data: { mfaEnabled: false, totpSecret: null, totpEnrolledAt: null, backupCodes: null } });
      await revokeAllSessions(auth.id, "mfa_disabled", auth.sessionId);
      await audit({ actorId: auth.id, actorEmail: auth.email, action: "mfa.disabled", ip, severity: "warning" });
      await notify({ userId: auth.id, category: "security", type: "mfa_disabled", title: "MFA disabled", body: "Two-factor authentication was removed from your account. Other devices were signed out.", priority: "critical" });
      return ok({ disabled: true });
    }

    default:
      throw new ApiError(404, "not_found", `Unknown MFA action "${action}".`);
  }
}, { name: "auth.mfa" });
