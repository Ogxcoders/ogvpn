import { Router, type Request, type Response, type NextFunction } from "express";
import type { DB } from "../db.js";
import { query, queryOne } from "../db.js";
import type { Config } from "../config.js";
import type { EventBus } from "../events.js";
import { ApiError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { forceDisconnectSession } from "../services/controlPlane.js";
import { audit } from "../services/audit.js";

export function sessionsRoutes(cfg: Config, db: DB, bus: EventBus): Router {
  const r = Router();
  r.use(requireAuth(cfg, db));

  r.get("/", (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = query<{
        id: string;
        state: string;
        device_id: string;
        server_id: string;
        connected_at: string;
        closed_at: string | null;
        bytes_in: number;
        bytes_out: number;
        device_name: string;
        server_name: string;
      }>(
        db,
        `SELECT s.*, d.name AS device_name, sv.name AS server_name
           FROM sessions s
           JOIN devices d ON d.id = s.device_id
           JOIN servers sv ON sv.id = s.server_id
          WHERE s.user_id = ?
          ORDER BY s.connected_at DESC LIMIT 100`,
        req.auth!.userId,
      );
      res.json({
        sessions: rows.map((s) => ({
          id: s.id,
          state: s.state,
          deviceId: s.device_id,
          deviceName: s.device_name,
          serverId: s.server_id,
          serverName: s.server_name,
          connectedAt: s.connected_at,
          closedAt: s.closed_at,
          bytesIn: s.bytes_in,
          bytesOut: s.bytes_out,
        })),
      });
    } catch (e) {
      next(e);
    }
  });

  r.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
      const s = queryOne<{ id: string; user_id: string; state: string }>(
        db,
        "SELECT id, user_id, state FROM sessions WHERE id = ? AND user_id = ?",
        req.params.id,
        req.auth!.userId,
      );
      if (!s) throw ApiError.notFound("Session not found");
      if (s.state === "closed") {
        res.status(204).send();
        return;
      }
      forceDisconnectSession(db, bus, s.id);
      audit(db, "session.force_disconnect", {
        actorUserId: req.auth!.userId,
        targetType: "session",
        targetId: s.id,
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return r;
}
