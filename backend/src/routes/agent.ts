import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import type { DB } from "../db.js";
import { queryOne, run } from "../db.js";
import { ApiError } from "../lib/errors.js";
import { agentAuth } from "../middleware/auth.js";
import { takePendingOps, ackOp, applyPeerStats } from "../services/controlPlane.js";
import { audit } from "../services/audit.js";
import { nowIso } from "../lib/util.js";

const WG_KEY_RE = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/;

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  code: z.string().trim().regex(/^[a-z0-9-]{2,24}$/, "lowercase letters, digits, dashes"),
  country: z.string().trim().min(2).max(56),
  city: z.string().trim().min(1).max(80),
  host: z.string().trim().min(3).max(253),
  port: z.number().int().min(1).max(65535),
  publicKey: z.string().regex(WG_KEY_RE),
  capacity: z.number().int().min(1).max(65534).default(250),
  ipv4Prefix: z.string().regex(/^\d+\.\d+\.\d+\.0\/24$/),
  ipv6Prefix: z.string().min(3).max(50),
  dns: z.string().trim().min(3).max(253),
});

const heartbeatSchema = z.object({
  cpuPct: z.number().min(0).max(100),
  ramPct: z.number().min(0).max(100),
  diskPct: z.number().min(0).max(100).default(0),
  tunnelCount: z.number().int().min(0),
  bandwidthIn: z.number().min(0).default(0),
  bandwidthOut: z.number().min(0).default(0),
  uptimeSec: z.number().min(0),
  wgInterface: z.string().trim().min(1).max(15),
  peers: z
    .array(
      z.object({
        publicKey: z.string().regex(WG_KEY_RE),
        bytesIn: z.number().min(0),
        bytesOut: z.number().min(0),
        handshakeAgoSec: z.number().min(0),
      }),
    )
    .max(10000)
    .optional(),
});

export function agentRoutes(db: DB): Router {
  const r = Router();
  r.use(agentAuth(db));

  r.post("/register", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = registerSchema.parse(req.body);
      // The agent token maps 1:1 to a pre-provisioned server row created by
      // an admin (agent_token_hash set at creation). Register fills in details.
      const server = queryOne<{ id: string; code: string }>(
        db,
        "SELECT id, code FROM servers WHERE id = ?",
        req.serverId,
      );
      if (!server) {
        throw ApiError.forbidden("Server not pre-provisioned; ask an admin to create it first");
      }
      run(
        db,
        `UPDATE servers SET name = ?, code = ?, country = ?, city = ?, host = ?, port = ?,
           public_key = ?, ipv4_prefix = ?, ipv6_prefix = ?, dns = ?, capacity = ?, status = 'active', updated_at = ?
         WHERE id = ?`,
        body.name,
        body.code,
        body.country,
        body.city,
        body.host,
        body.port,
        body.publicKey,
        body.ipv4Prefix,
        body.ipv6Prefix,
        body.dns,
        body.capacity,
        nowIso(),
        server.id,
      );
      audit(db, "agent.register", { targetType: "server", targetId: server.id });
      res.status(201).json({ serverId: server.id });
    } catch (e) {
      next(e);
    }
  });

  r.post("/heartbeat", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = heartbeatSchema.parse(req.body);
      run(
        db,
        `UPDATE servers SET last_heartbeat_at = ?, updated_at = ? WHERE id = ?`,
        nowIso(),
        nowIso(),
        req.serverId,
      );
      if (body.peers && body.peers.length > 0) {
        applyPeerStats(db, req.serverId!, body.peers);
      }
      const ops = takePendingOps(db, req.serverId!);
      res.json({ ops });
    } catch (e) {
      next(e);
    }
  });

  r.post("/ops/:id/ack", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({ success: z.boolean(), error: z.string().max(500).optional() })
        .parse(req.body);
      const ok = ackOp(db, req.serverId!, req.params.id, body.success, body.error);
      if (!ok) throw ApiError.notFound("Op not found for this server");
      if (!body.success) {
        audit(db, "agent.op_failed", {
          targetType: "server_op",
          targetId: req.params.id,
          meta: { error: body.error },
        });
      }
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  return r;
}
