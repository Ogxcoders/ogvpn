import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import type { DB } from "../db.js";
import { query, queryOne, run } from "../db.js";
import { ApiError } from "../lib/errors.js";
import { requireAuth, requireAdmin, generateAgentToken } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { forceDisconnectSession } from "../services/controlPlane.js";
import { newId, nowIso } from "../lib/util.js";
import { hashToken } from "../lib/jwt.js";
import type { EventBus } from "../events.js";
import type { Config } from "../config.js";
import crypto from "node:crypto";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: string;
  created_at: string;
}

const WG_KEY_RE = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/;

export function adminRoutes(cfg: Config, db: DB, bus: EventBus): Router {
  const r = Router();
  r.use(requireAuth(cfg, db), requireAdmin);

  r.get("/users", (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page as string ?? "1", 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string ?? "50", 10) || 50));
      const total = queryOne<{ c: number }>(db, "SELECT COUNT(*) AS c FROM users")!.c;
      const rows = query<UserRow>(
        db,
        "SELECT id, email, name, role, status, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
        limit,
        (page - 1) * limit,
      );
      res.json({ users: rows, page, limit, total });
    } catch (e) {
      next(e);
    }
  });

  r.patch("/users/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({ status: z.enum(["active", "disabled"]).optional(), role: z.enum(["user", "admin"]).optional() })
        .parse(req.body);
      const user = queryOne<UserRow>(
        db,
        "SELECT id, email, name, role, status, created_at FROM users WHERE id = ?",
        req.params.id,
      );
      if (!user) throw ApiError.notFound("User not found");
      if (user.id === req.auth!.userId && body.status === "disabled") {
        throw ApiError.validation("You cannot disable your own account");
      }
      run(
        db,
        "UPDATE users SET status = COALESCE(?, status), role = COALESCE(?, role), updated_at = ? WHERE id = ?",
        body.status ?? null,
        body.role ?? null,
        nowIso(),
        user.id,
      );
      if (body.status === "disabled") {
        // Enforce immediately: kill tokens, close sessions, revoke tunnels.
        run(
          db,
          "UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
          nowIso(),
          user.id,
        );
        const open = query<{ id: string }>(
          db,
          "SELECT id FROM sessions WHERE user_id = ? AND state IN ('connected','reconnecting')",
          user.id,
        );
        for (const s of open) {
          forceDisconnectSession(db, bus, s.id);
        }
        bus.publish(user.id, "account.disabled", {});
      }
      audit(db, "admin.user_update", {
        actorUserId: req.auth!.userId,
        targetType: "user",
        targetId: user.id,
        meta: body,
      });
      res.json({ user: { ...user, status: body.status ?? user.status, role: body.role ?? user.role } });
    } catch (e) {
      next(e);
    }
  });

  r.get("/servers", (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = query<Record<string, unknown>>(
        db,
        "SELECT id, code, name, country, city, host, port, status, capacity, last_heartbeat_at, ipv4_prefix, ipv6_prefix, created_at FROM servers ORDER BY created_at ASC",
      );
      res.json({ servers: rows });
    } catch (e) {
      next(e);
    }
  });

  r.post("/servers", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          code: z.string().regex(/^[a-z0-9-]{2,24}$/),
          name: z.string().min(1).max(80),
          country: z.string().min(2).max(56),
          city: z.string().min(1).max(80),
          host: z.string().min(3).max(253),
          port: z.number().int().min(1).max(65535),
          publicKey: z.string().regex(WG_KEY_RE),
          capacity: z.number().int().min(1).max(65534).default(250),
          ipv4Prefix: z.string().regex(/^\d+\.\d+\.\d+\.0\/24$/),
          ipv6Prefix: z.string().min(3).max(50).default("::/0"),
          dns: z.string().min(3).max(253),
        })
        .parse(req.body);
      const dup = queryOne<{ id: string }>(db, "SELECT id FROM servers WHERE code = ?", body.code);
      if (dup) throw ApiError.conflict("Server code already exists");
      const serverId = newId();
      const agentToken = generateAgentToken();
      run(
        db,
        `INSERT INTO servers (id, code, name, country, city, host, port, public_key, ipv4_prefix, ipv6_prefix, dns, status, capacity, agent_token_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'offline', ?, ?, ?, ?)`,
        serverId,
        body.code,
        body.name,
        body.country,
        body.city,
        body.host,
        body.port,
        body.publicKey,
        body.ipv4Prefix,
        body.ipv6Prefix,
        body.dns,
        body.capacity,
        hashToken(agentToken),
        nowIso(),
        nowIso(),
      );
      audit(db, "admin.server_create", { actorUserId: req.auth!.userId, targetType: "server", targetId: serverId });
      // The plaintext agent token is shown exactly once, at creation.
      res.status(201).json({ server: { id: serverId, ...body, status: "offline" }, agentToken });
    } catch (e) {
      next(e);
    }
  });

  r.patch("/servers/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({ status: z.enum(["active", "maintenance", "drain", "retired", "offline"]) })
        .parse(req.body);
      const server = queryOne<{ id: string }>(db, "SELECT id FROM servers WHERE id = ?", req.params.id);
      if (!server) throw ApiError.notFound("Server not found");
      run(db, "UPDATE servers SET status = ?, updated_at = ? WHERE id = ?", body.status, nowIso(), server.id);
      if (body.status === "retired") {
        // Drain: force-close everything on it and remove all peers.
        const open = query<{ id: string }>(
          db,
          "SELECT id FROM sessions WHERE server_id = ? AND state IN ('connected','reconnecting')",
          server.id,
        );
        for (const s of open) {
          forceDisconnectSession(db, bus, s.id);
        }
      }
      // Notify clients connected to this server.
      const affected = query<{ user_id: string }>(
        db,
        "SELECT DISTINCT user_id FROM sessions WHERE server_id = ? AND state IN ('connected','reconnecting')",
        server.id,
      );
      bus.broadcastServerEvent("server.changed", { serverId: server.id, status: body.status }, affected.map((a) => a.user_id));
      audit(db, "admin.server_update", {
        actorUserId: req.auth!.userId,
        targetType: "server",
        targetId: server.id,
        meta: body,
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  r.get("/stats", (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = queryOne<{ c: number }>(db, "SELECT COUNT(*) AS c FROM users WHERE status = 'active'")!.c;
      const devices = queryOne<{ c: number }>(db, "SELECT COUNT(*) AS c FROM devices WHERE status = 'active'")!.c;
      const activeSessions = queryOne<{ c: number }>(db, "SELECT COUNT(*) AS c FROM sessions WHERE state = 'connected'")!.c;
      const tunnelsByServer = query<{ server_id: string; c: number }>(
        db,
        "SELECT server_id, COUNT(*) AS c FROM tunnels WHERE status = 'active' GROUP BY server_id",
      );
      const subscriptions = query<{ plan: string; c: number }>(
        db,
        "SELECT plan, COUNT(*) AS c FROM subscriptions WHERE status = 'active' GROUP BY plan",
      );
      res.json({
        users,
        devices,
        activeSessions,
        tunnelsByServer,
        subscriptions,
      });
    } catch (e) {
      next(e);
    }
  });

  r.get("/audit", (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page as string ?? "1", 10) || 1);
      const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit as string ?? "100", 10) || 100));
      const rows = query<Record<string, unknown>>(
        db,
        "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?",
        limit,
        (page - 1) * limit,
      );
      res.json({ entries: rows, page, limit });
    } catch (e) {
      next(e);
    }
  });

  r.get("/notifications/:userId", (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = query<Record<string, unknown>>(
        db,
        "SELECT id, type, title, body, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        req.params.userId,
      );
      res.json({ notifications: rows });
    } catch (e) {
      next(e);
    }
  });

  return r;
}

export function notificationsRoutes(cfg: Config, db: DB): Router {
  const r = Router();
  r.use(requireAuth(cfg, db));
  r.get("/", (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = query<Record<string, unknown>>(
        db,
        "SELECT id, type, title, body, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
        req.auth!.userId,
      );
      res.json({ notifications: rows });
    } catch (e) {
      next(e);
    }
  });
  r.patch("/read", (req: Request, res: Response, next: NextFunction) => {
    try {
      run(
        db,
        "UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL",
        nowIso(),
        req.auth!.userId,
      );
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
  return r;
}

export function ticketRoutes(cfg: Config, db: DB): Router {
  const r = Router();
  r.use(requireAuth(cfg, db));
  r.get("/", (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = query<Record<string, unknown>>(
        db,
        "SELECT * FROM tickets WHERE user_id = ? ORDER BY updated_at DESC",
        req.auth!.userId,
      );
      res.json({ tickets: rows });
    } catch (e) {
      next(e);
    }
  });
  r.post("/", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({ subject: z.string().trim().min(3).max(140), message: z.string().trim().min(1).max(4000) })
        .parse(req.body);
      const ticketId = newId();
      run(
        db,
        "INSERT INTO tickets (id, user_id, subject, status, created_at, updated_at) VALUES (?, ?, ?, 'open', ?, ?)",
        ticketId,
        req.auth!.userId,
        body.subject,
        nowIso(),
        nowIso(),
      );
      run(
        db,
        "INSERT INTO ticket_messages (id, ticket_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
        crypto.randomUUID(),
        ticketId,
        req.auth!.userId,
        body.message,
        nowIso(),
      );
      res.status(201).json({ ticket: { id: ticketId, subject: body.subject, status: "open" } });
    } catch (e) {
      next(e);
    }
  });
  r.get("/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = queryOne<Record<string, unknown>>(
        db,
        "SELECT * FROM tickets WHERE id = ? AND user_id = ?",
        req.params.id,
        req.auth!.userId,
      );
      if (!ticket) throw ApiError.notFound("Ticket not found");
      const messages = query<Record<string, unknown>>(
        db,
        "SELECT id, author_id, body, created_at FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC",
        req.params.id,
      );
      res.json({ ticket, messages });
    } catch (e) {
      next(e);
    }
  });
  return r;
}
