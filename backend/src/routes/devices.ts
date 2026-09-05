import crypto from "node:crypto";
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import type { DB } from "../db.js";
import { query, queryOne, run } from "../db.js";
import { ApiError } from "../lib/errors.js";
import { audit } from "../services/audit.js";
import { nowIso } from "../lib/util.js";
import { requireAuth } from "../middleware/auth.js";
import type { EventBus } from "../events.js";
import type { Config } from "../config.js";

interface DeviceRow {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  device_uid: string;
  status: string;
  last_active_at: string | null;
  created_at: string;
}

export function devicesRoutes(cfg: Config, db: DB, bus: EventBus): Router {
  const r = Router();
  r.use(requireAuth(cfg, db));

  r.get("/", (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = query<DeviceRow & { session_id: string | null; session_state: string | null; tunnel_id: string | null; server_id: string | null }>(
        db,
        `SELECT d.*, s.id AS session_id, s.state AS session_state, t.id AS tunnel_id, t.server_id
           FROM devices d
           LEFT JOIN sessions s ON s.device_id = d.id AND s.state IN ('connected','reconnecting')
           LEFT JOIN tunnels t ON t.id = s.tunnel_id
          WHERE d.user_id = ? AND d.status = 'active'
          ORDER BY d.created_at ASC`,
        req.auth!.userId,
      );
      res.json({
        devices: rows.map((d) => ({
          id: d.id,
          name: d.name,
          platform: d.platform,
          status: d.status,
          lastActiveAt: d.last_active_at,
          createdAt: d.created_at,
          session: d.session_id
            ? { id: d.session_id, state: d.session_state, tunnelId: d.tunnel_id, serverId: d.server_id }
            : null,
        })),
      });
    } catch (e) {
      next(e);
    }
  });

  r.patch("/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z.object({ name: z.string().trim().min(1).max(80) }).parse(req.body);
      const device = queryOne<DeviceRow>(
        db,
        "SELECT * FROM devices WHERE id = ? AND user_id = ? AND status = 'active'",
        req.params.id,
        req.auth!.userId,
      );
      if (!device) throw ApiError.notFound("Device not found");
      run(db, "UPDATE devices SET name = ? WHERE id = ?", body.name, device.id);
      audit(db, "device.rename", {
        actorUserId: req.auth!.userId,
        targetType: "device",
        targetId: device.id,
      });
      res.json({ device: { ...device, name: body.name } });
    } catch (e) {
      next(e);
    }
  });

  r.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = queryOne<DeviceRow>(
        db,
        "SELECT * FROM devices WHERE id = ? AND user_id = ? AND status = 'active'",
        req.params.id,
        req.auth!.userId,
      );
      if (!device) throw ApiError.notFound("Device not found");
      run(
        db,
        "UPDATE devices SET status = 'revoked' WHERE id = ?",
        device.id,
      );
      // Close open sessions + queue peer removal so the VPN actually drops.
      const open = query<{ id: string; tunnel_id: string }>(
        db,
        "SELECT id, tunnel_id FROM sessions WHERE device_id = ? AND state IN ('connected','reconnecting')",
        device.id,
      );
      for (const s of open) {
        run(
          db,
          "UPDATE sessions SET state = 'closed', closed_at = ? WHERE id = ?",
          nowIso(),
          s.id,
        );
        const tunnel = queryOne<{ public_key: string; server_id: string }>(
          db,
          "SELECT public_key, server_id FROM tunnels WHERE id = ?",
          s.tunnel_id,
        );
        if (tunnel) {
          run(
            db,
            "INSERT INTO server_ops (id, server_id, type, payload, status, attempts, created_at) VALUES (?, ?, 'remove_peer', ?, 'pending', 0, ?)",
            crypto.randomUUID(),
            tunnel.server_id,
            JSON.stringify({ publicKey: tunnel.public_key }),
            nowIso(),
          );
          run(
            db,
            "UPDATE tunnels SET status = 'revoked', revoked_at = ? WHERE id = ?",
            nowIso(),
            s.tunnel_id,
          );
        }
      }
      // Kill the device's refresh tokens too.
      run(
        db,
        "UPDATE refresh_tokens SET revoked_at = ? WHERE device_id = ? AND revoked_at IS NULL",
        nowIso(),
        device.id,
      );
      bus.publish(
        device.user_id,
        "device.revoked",
        { deviceId: device.id },
        { title: "Device revoked", body: `"${device.name}" was removed from your account.` },
      );
      audit(db, "device.revoke", {
        actorUserId: req.auth!.userId,
        targetType: "device",
        targetId: device.id,
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return r;
}
