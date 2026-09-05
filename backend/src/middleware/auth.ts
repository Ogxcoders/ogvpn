import type { NextFunction, Request, Response } from "express";
import type { DB } from "../db.js";
import { queryOne, run } from "../db.js";
import type { Config } from "../config.js";
import { verifyAccessToken, hashToken } from "../lib/jwt.js";
import { ApiError } from "../lib/errors.js";
import type { AuthContext } from "./types.js";
import crypto from "node:crypto";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: string;
}
interface DeviceRow {
  id: string;
  name: string;
  platform: string;
  status: string;
  last_active_at: string | null;
}

const ACTIVE_THROTTLE_MS = 60_000;

export function requireAuth(cfg: Config, db: DB) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) {
        throw ApiError.unauthorized();
      }
      const claims = verifyAccessToken(cfg, header.slice(7));

      const user = queryOne<UserRow>(
        db,
        "SELECT id, email, name, role, status FROM users WHERE id = ?",
        claims.sub,
      );
      if (!user || user.status !== "active") {
        throw ApiError.unauthorized("Account is disabled or deleted");
      }
      const device = queryOne<DeviceRow>(
        db,
        "SELECT id, name, platform, status, last_active_at FROM devices WHERE id = ?",
        claims.did,
      );
      if (!device || device.status !== "active") {
        throw new ApiError(401, "DEVICE_REVOKED", "Device has been revoked");
      }

      // Throttled heartbeat so the web panel sees fresh device activity.
      const last = device.last_active_at
        ? Date.parse(device.last_active_at)
        : 0;
      if (Date.now() - last > ACTIVE_THROTTLE_MS) {
        run(
          db,
          "UPDATE devices SET last_active_at = ? WHERE id = ?",
          new Date().toISOString(),
          device.id,
        );
      }

      req.auth = {
        userId: user.id,
        deviceId: device.id,
        role: user.role,
        user,
        device,
      } satisfies AuthContext;
      next();
    } catch (e) {
      next(e);
    }
  };
}

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.auth) return next(ApiError.unauthorized());
  if (req.auth.role !== "admin") {
    return next(ApiError.forbidden("Admin privileges required"));
  }
  next();
}

interface ServerRow {
  id: string;
  agent_token_hash: string | null;
}

/** Machine-to-machine auth for VPN server agents (per-server token). */
export function agentAuth(db: DB) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) throw ApiError.unauthorized();
      const hash = hashToken(header.slice(7));
      const server = queryOne<ServerRow>(
        db,
        "SELECT id, agent_token_hash FROM servers WHERE agent_token_hash = ?",
        hash,
      );
      if (!server) throw ApiError.unauthorized("Unknown agent token");
      req.serverId = server.id;
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Issues a provisioning token for a server agent; returns it exactly once. */
export function generateAgentToken(): string {
  return `agt_${crypto.randomBytes(24).toString("base64url")}`;
}
