import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import type { DB } from "../db.js";
import { queryOne, run } from "../db.js";
import type { Config } from "../config.js";
import { ApiError } from "../lib/errors.js";
import {
  hashToken,
  signAccessToken,
  generateRefreshToken,
} from "../lib/jwt.js";
import { hashPassword, verifyPassword, passwordPolicyErrors } from "../lib/passwords.js";
import { audit } from "../services/audit.js";
import { effectiveSubscription } from "../services/entitlements.js";
import { newId, nowIso, MemoryRateLimiter } from "../lib/util.js";
import { requireAuth } from "../middleware/auth.js";
import crypto from "node:crypto";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: string;
  password_hash: string;
}

const PLATFORMS = ["android", "windows", "macos", "linux", "web"] as const;

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
  name: z.string().trim().min(1).max(80),
  deviceName: z.string().trim().min(1).max(80),
  platform: z.enum(PLATFORMS),
  deviceUid: z.string().uuid(),
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
  deviceName: z.string().trim().min(1).max(80),
  platform: z.enum(PLATFORMS),
  deviceUid: z.string().uuid(),
});

const refreshSchema = z.object({ refreshToken: z.string().min(20).max(256) });

interface RefreshRow {
  id: string;
  user_id: string;
  device_id: string | null;
  revoked_at: string | null;
  expires_at: string;
}

function publicUser(u: UserRow) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, status: u.status };
}

/** Creates or reactivates the device for (user, deviceUid). Revoked uids stay revoked. */
function upsertDevice(
  db: DB,
  userId: string,
  deviceName: string,
  platform: string,
  deviceUid: string,
): { id: string; name: string; platform: string; status: string; lastActiveAt: string | null } {
  const existing = queryOne<{ id: string; status: string }>(
    db,
    "SELECT id, status FROM devices WHERE user_id = ? AND device_uid = ?",
    userId,
    deviceUid,
  );
  if (existing) {
    if (existing.status !== "active") {
      throw ApiError.forbidden(
        "This device was revoked. Remove it from your account devices page before re-adding.",
        "DEVICE_REVOKED",
      );
    }
    run(
      db,
      "UPDATE devices SET name = ?, last_active_at = ? WHERE id = ?",
      deviceName,
      nowIso(),
      existing.id,
    );
    return {
      id: existing.id,
      name: deviceName,
      platform,
      status: "active",
      lastActiveAt: nowIso(),
    };
  }
  const id = newId();
  run(
    db,
    "INSERT INTO devices (id, user_id, name, platform, device_uid, status, last_active_at, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)",
    id,
    userId,
    deviceName,
    platform,
    deviceUid,
    nowIso(),
    nowIso(),
  );
  return { id, name: deviceName, platform, status: "active", lastActiveAt: nowIso() };
}

function issueTokens(
  cfg: Config,
  db: DB,
  user: UserRow,
  deviceId: string,
): { accessToken: string; refreshToken: string } {
  const accessToken = signAccessToken(cfg, {
    sub: user.id,
    did: deviceId,
    role: user.role,
  });
  const { token: refreshToken, hash } = generateRefreshToken();
  const expiresAt = new Date(
    Date.now() + cfg.refreshTokenTtlDays * 24 * 3600 * 1000,
  ).toISOString();
  run(
    db,
    "INSERT INTO refresh_tokens (id, user_id, device_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    newId(),
    user.id,
    deviceId,
    hash,
    expiresAt,
    nowIso(),
  );
  return { accessToken, refreshToken };
}

function revokeTokenChain(db: DB, userId: string, tokenHash: string): void {
  // Reuse detection: a replayed (already-revoked) token nukes the whole family.
  const token = queryOne<RefreshRow>(
    db,
    "SELECT id, user_id, device_id, revoked_at, expires_at FROM refresh_tokens WHERE token_hash = ?",
    tokenHash,
  );
  if (token && token.revoked_at) {
    run(
      db,
      "UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
      nowIso(),
      userId,
    );
    audit(db, "auth.refresh_reuse_detected", {
      actorUserId: userId,
      targetType: "user",
      targetId: userId,
    });
    throw ApiError.unauthorized("Refresh token reuse detected; all sessions revoked");
  }
  run(
    db,
    "UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?",
    nowIso(),
    tokenHash,
  );
}

export function authRoutes(cfg: Config, db: DB, authLimiter: MemoryRateLimiter): Router {
  const r = Router();

  const limit = (req: Request): void => {
    const ip = (req.ip ?? "unknown").replace(/^::ffff:/, "");
    const res = authLimiter.hit(`${ip}:${req.path}`);
    if (!res.allowed) {
      throw ApiError.rateLimited(res.retryAfterSec);
    }
  };

  const createSubscription = (userId: string): void => {
    run(
      db,
      "INSERT INTO subscriptions (id, user_id, plan, status, current_period_end, created_at, updated_at) VALUES (?, ?, 'free', 'active', NULL, ?, ?)",
      newId(),
      userId,
      nowIso(),
      nowIso(),
    );
  };

  r.post("/register", (req: Request, res: Response, next: NextFunction) => {
    try {
      limit(req);
      const body = registerSchema.parse(req.body);
      const policyErrors = passwordPolicyErrors(body.password);
      if (policyErrors.length > 0) {
        throw ApiError.validation(
          `Password must contain ${policyErrors.join(", ")}`,
        );
      }
      const existing = queryOne<{ id: string }>(
        db,
        "SELECT id FROM users WHERE email = ?",
        body.email,
      );
      if (existing) throw ApiError.conflict("An account with this email already exists");

      const userId = newId();
      run(
        db,
        "INSERT INTO users (id, email, password_hash, name, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'user', 'active', ?, ?)",
        userId,
        body.email,
        hashPassword(body.password),
        body.name,
        nowIso(),
        nowIso(),
      );
      createSubscription(userId);
      const user = queryOne<UserRow>(
        db,
        "SELECT * FROM users WHERE id = ?",
        userId,
      )!;
      const device = upsertDevice(db, userId, body.deviceName, body.platform, body.deviceUid);
      const tokens = issueTokens(cfg, db, user, device.id);
      audit(db, "auth.register", { actorUserId: userId, targetType: "user", targetId: userId });
      res.status(201).json({
        user: publicUser(user),
        device,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (e) {
      next(e);
    }
  });

  r.post("/login", (req: Request, res: Response, next: NextFunction) => {
    try {
      limit(req);
      const body = loginSchema.parse(req.body);
      const user = queryOne<UserRow>(
        db,
        "SELECT * FROM users WHERE email = ?",
        body.email,
      );
      // Uniform failure message + dummy verify to blunt user-enumeration timing.
      const ok = user
        ? verifyPassword(body.password, user.password_hash)
        : verifyPassword(body.password, hashPassword("dummy-password-1"));
      if (!user || !ok) {
        audit(db, "auth.login_failed", { meta: { email: body.email } });
        throw ApiError.unauthorized("Invalid email or password");
      }
      if (user.status !== "active") {
        throw ApiError.forbidden("Account is disabled", "ACCOUNT_DISABLED");
      }
      const device = upsertDevice(db, user.id, body.deviceName, body.platform, body.deviceUid);
      const tokens = issueTokens(cfg, db, user, device.id);
      audit(db, "auth.login", {
        actorUserId: user.id,
        targetType: "device",
        targetId: device.id,
      });
      res.json({
        user: publicUser(user),
        device,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (e) {
      next(e);
    }
  });

  r.post("/refresh", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = refreshSchema.parse(req.body);
      const hash = hashToken(body.refreshToken);
      const token = queryOne<RefreshRow>(
        db,
        "SELECT id, user_id, device_id, revoked_at, expires_at FROM refresh_tokens WHERE token_hash = ?",
        hash,
      );
      if (!token) throw ApiError.unauthorized("Invalid refresh token");
      if (token.revoked_at) {
        revokeTokenChain(db, token.user_id, hash); // reuse detection
        return;
      }
      if (Date.parse(token.expires_at) < Date.now()) {
        throw ApiError.unauthorized("Refresh token expired");
      }
      const user = queryOne<UserRow>(
        db,
        "SELECT * FROM users WHERE id = ?",
        token.user_id,
      );
      if (!user || user.status !== "active") {
        throw ApiError.forbidden("Account is disabled", "ACCOUNT_DISABLED");
      }
      if (token.device_id) {
        const device = queryOne<{ status: string }>(
          db,
          "SELECT status FROM devices WHERE id = ?",
          token.device_id,
        );
        if (!device || device.status !== "active") {
          throw ApiError.unauthorized("Device has been revoked");
        }
      }
      // Rotation: old token is marked revoked and linked to its successor.
      const { token: newRefresh, hash: newHash } = generateRefreshToken();
      const expiresAt = new Date(
        Date.now() + cfg.refreshTokenTtlDays * 24 * 3600 * 1000,
      ).toISOString();
      const newIdTok = newId();
      run(
        db,
        "UPDATE refresh_tokens SET revoked_at = ?, replaced_by = ? WHERE id = ?",
        nowIso(),
        newIdTok,
        token.id,
      );
      run(
        db,
        "INSERT INTO refresh_tokens (id, user_id, device_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        newIdTok,
        user.id,
        token.device_id,
        newHash,
        expiresAt,
        nowIso(),
      );
      const accessToken = signAccessToken(cfg, {
        sub: user.id,
        did: token.device_id ?? crypto.randomUUID(),
        role: user.role,
      });
      res.json({ accessToken, refreshToken: newRefresh });
    } catch (e) {
      next(e);
    }
  });

  r.post("/logout", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = refreshSchema.parse(req.body);
      const hash = hashToken(body.refreshToken);
      const token = queryOne<{ user_id: string }>(
        db,
        "SELECT user_id FROM refresh_tokens WHERE token_hash = ?",
        hash,
      );
      if (token) {
        run(
          db,
          "UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?",
          nowIso(),
          hash,
        );
        audit(db, "auth.logout", { actorUserId: token.user_id });
      }
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  r.get("/me", requireAuth(cfg, db), (req: Request, res: Response, next: NextFunction) => {
    try {
      const eff = effectiveSubscription(db, req.auth!.userId);
      const sub = queryOne<{ plan: string; status: string; current_period_end: string | null }>(
        db,
        "SELECT plan, status, current_period_end FROM subscriptions WHERE user_id = ?",
        req.auth!.userId,
      );
      res.json({
        user: publicUser(req.auth!.user as UserRow),
        subscription: {
          plan: eff.plan,
          status: sub ? sub.status : "active",
          currentPeriodEnd: sub?.current_period_end ?? null,
          maxDevices: eff.maxDevices,
        },
        device: req.auth!.device,
      });
    } catch (e) {
      next(e);
    }
  });

  r.post("/password-change", requireAuth(cfg, db), (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw ApiError.unauthorized();
      const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(1) });
      const body = schema.parse(req.body);
      const user = queryOne<UserRow>(
        db,
        "SELECT * FROM users WHERE id = ?",
        req.auth.userId,
      )!;
      if (!verifyPassword(body.currentPassword, user.password_hash)) {
        throw ApiError.unauthorized("Current password is incorrect");
      }
      const errs = passwordPolicyErrors(body.newPassword);
      if (errs.length > 0) {
        throw ApiError.validation(`Password must contain ${errs.join(", ")}`);
      }
      run(
        db,
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        hashPassword(body.newPassword),
        nowIso(),
        user.id,
      );
      // Invalidate all sessions: a password change is a security event.
      run(
        db,
        "UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
        nowIso(),
        user.id,
      );
      audit(db, "auth.password_changed", { actorUserId: user.id, targetType: "user", targetId: user.id });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  r.post("/password-forgot", (req: Request, res: Response, next: NextFunction) => {
    try {
      limit(req);
      const body = z.object({ email: z.string().email() }).parse(req.body);
      const user = queryOne<{ id: string }>(
        db,
        "SELECT id FROM users WHERE email = ? AND status = 'active'",
        body.email,
      );
      // Always 200 to avoid account enumeration.
      if (user) {
        const token = crypto.randomBytes(32).toString("base64url");
        run(
          db,
          "INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
          newId(),
          user.id,
          hashToken(token),
          new Date(Date.now() + 3600 * 1000).toISOString(),
          nowIso(),
        );
        // Development transport: the reset link is logged, not emailed.
        console.log(
          JSON.stringify({
            ts: nowIso(),
            level: "info",
            event: "auth.password_reset_token_issued",
            note: "DEV-ONLY delivery. Wire an email provider for production.",
            userId: user.id,
            resetToken: token,
          }),
        );
      }
      res.json({ status: "ok" });
    } catch (e) {
      next(e);
    }
  });

  r.post("/password-reset", (req: Request, res: Response, next: NextFunction) => {
    try {
      limit(req);
      const body = z
        .object({ token: z.string().min(20), newPassword: z.string().min(1) })
        .parse(req.body);
      const errs = passwordPolicyErrors(body.newPassword);
      if (errs.length > 0) {
        throw ApiError.validation(`Password must contain ${errs.join(", ")}`);
      }
      const row = queryOne<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(
        db,
        "SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?",
        hashToken(body.token),
      );
      if (!row || row.used_at || Date.parse(row.expires_at) < Date.now()) {
        throw ApiError.unauthorized("Invalid or expired reset token");
      }
      run(
        db,
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        hashPassword(body.newPassword),
        nowIso(),
        row.user_id,
      );
      run(db, "UPDATE password_resets SET used_at = ? WHERE id = ?", nowIso(), row.id);
      run(
        db,
        "UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
        nowIso(),
        row.user_id,
      );
      audit(db, "auth.password_reset", { actorUserId: row.user_id, targetType: "user", targetId: row.user_id });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return r;
}

export { publicUser, issueTokens, upsertDevice };
