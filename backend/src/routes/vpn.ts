import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import type { DB } from "../db.js";
import { query, queryOne, run } from "../db.js";
import type { Config } from "../config.js";
import type { EventBus } from "../events.js";
import { ApiError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { validateWireGuardPublicKey, allocateIps, ipv4At, ipv6At } from "../lib/wireguard.js";
import { queueAddPeer, queueRemovePeer } from "../services/controlPlane.js";
import { assertCanProvision, assertDeviceLimit } from "../services/entitlements.js";
import { audit } from "../services/audit.js";
import { newId, nowIso, checkIdempotency, storeIdempotentResponse } from "../lib/util.js";

interface ServerRow {
  id: string;
  code: string;
  host: string;
  port: number;
  public_key: string;
  ipv4_prefix: string;
  ipv6_prefix: string;
  dns: string;
  status: string;
  capacity: number;
}

interface TunnelRow {
  id: string;
  user_id: string;
  device_id: string;
  server_id: string;
  public_key: string;
  address_v4: string;
  address_v6: string;
  status: string;
  created_at: string;
}

function tunnelPayload(db: DB, t: TunnelRow) {
  const s = queryOne<ServerRow>(db, "SELECT * FROM servers WHERE id = ?", t.server_id)!;
  return {
    id: t.id,
    serverId: t.server_id,
    addressV4: t.address_v4,
    addressV6: t.address_v6,
    serverPublicKey: s.public_key,
    endpointHost: s.host,
    endpointPort: s.port,
    allowedIps: ["0.0.0.0/0", "::/0"],
    dns: s.dns,
    mtu: 1420,
    keepalive: 25,
    status: t.status,
  };
}

export function vpnRoutes(cfg: Config, db: DB, bus: EventBus): Router {
  const r = Router();
  r.use(requireAuth(cfg, db));

  r.post("/peers", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          deviceId: z.string().uuid(),
          serverId: z.string().uuid(),
          publicKey: z.string().min(44).max(44),
        })
        .parse(req.body);
      validateWireGuardPublicKey(body.publicKey);

      // Idempotent retry support (mobile networks love replaying connects).
      const idemKey = req.headers["idempotency-key"] as string | undefined;
      if (idemKey) {
        const replay = checkIdempotency(db, req.auth!.userId, "POST /vpn/peers", idemKey);
        if (replay?.replay) {
          res.status(201).json(replay.body);
          return;
        }
      }

      assertCanProvision(db, req.auth!.userId);

      const device = queryOne<{ id: string; status: string }>(
        db,
        "SELECT id, status FROM devices WHERE id = ? AND user_id = ?",
        body.deviceId,
        req.auth!.userId,
      );
      if (!device) throw ApiError.notFound("Device not found");
      if (device.status !== "active") {
        throw ApiError.forbidden("Device has been revoked", "DEVICE_REVOKED");
      }

      const deviceCount = queryOne<{ c: number }>(
        db,
        "SELECT COUNT(*) AS c FROM devices WHERE user_id = ? AND status = 'active'",
        req.auth!.userId,
      )!.c;
      assertDeviceLimit(db, req.auth!.userId, deviceCount);

      const server = queryOne<ServerRow>(
        db,
        "SELECT * FROM servers WHERE id = ?",
        body.serverId,
      );
      if (!server) throw ApiError.notFound("Server not found");
      if (server.status !== "active") {
        throw ApiError.serverUnavailable(
          server.status === "drain"
            ? "Server is draining and accepts no new peers"
            : `Server is ${server.status}`,
        );
      }

      const dup = queryOne<{ id: string }>(
        db,
        "SELECT id FROM tunnels WHERE public_key = ? AND status = 'active'",
        body.publicKey,
      );
      if (dup) throw ApiError.conflict("Public key already registered");

      const capacity = queryOne<{ c: number }>(
        db,
        "SELECT COUNT(*) AS c FROM tunnels WHERE server_id = ? AND status = 'active'",
        server.id,
      )!.c;
      if (capacity >= server.capacity) {
        throw ApiError.serverUnavailable("Server at capacity");
      }

      // Allocate next free host in the server's pools (gateway .1 / ::1 skipped).
      const usedRows = query<{ address_v4: string; address_v6: string }>(
        db,
        "SELECT address_v4, address_v6 FROM tunnels WHERE server_id = ? AND status = 'active'",
        server.id,
      );
      const usedV4 = new Set<number>();
      const usedV6 = new Set<number>();
      for (const row of usedRows) {
        const v4 = Number.parseInt(row.address_v4.split(".")[3] ?? "0", 10);
        usedV4.add(v4);
        const v6 = Number.parseInt(row.address_v6.split("::").pop() ?? "0", 16);
        if (Number.isFinite(v6)) usedV6.add(v6);
      }
      const { v4Host, v6Host } = allocateIps(usedV4, usedV6, server.capacity);
      const addressV4 = ipv4At(server.ipv4_prefix, v4Host);
      const addressV6 = server.ipv6_prefix === "::/0"
        ? "::"
        : ipv6At(server.ipv6_prefix, v6Host);

      const tunnelId = newId();
      run(
        db,
        "INSERT INTO tunnels (id, user_id, device_id, server_id, public_key, address_v4, address_v6, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)",
        tunnelId,
        req.auth!.userId,
        device.id,
        server.id,
        body.publicKey,
        addressV4,
        addressV6,
        nowIso(),
      );
      const sessionId = newId();
      run(
        db,
        "INSERT INTO sessions (id, user_id, device_id, server_id, tunnel_id, state, connected_at) VALUES (?, ?, ?, ?, ?, 'connected', ?)",
        sessionId,
        req.auth!.userId,
        device.id,
        server.id,
        tunnelId,
        nowIso(),
      );
      queueAddPeer(db, server.id, {
        publicKey: body.publicKey,
        addressV4,
        addressV6: addressV6 === "::" ? undefined : addressV6,
      });
      audit(db, "peer.create", {
        actorUserId: req.auth!.userId,
        targetType: "tunnel",
        targetId: tunnelId,
        meta: { serverId: server.id },
      });

      const payload = {
        tunnel: tunnelPayload(db, queryOne<TunnelRow>(db, "SELECT * FROM tunnels WHERE id = ?", tunnelId)!),
        session: { id: sessionId, state: "connected" },
      };
      if (idemKey) {
        storeIdempotentResponse(db, req.auth!.userId, "POST /vpn/peers", idemKey, 201, payload);
      }
      res.status(201).json(payload);
    } catch (e) {
      next(e);
    }
  });

  r.get("/peers", (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = query<TunnelRow>(
        db,
        "SELECT * FROM tunnels WHERE user_id = ? ORDER BY created_at DESC",
        req.auth!.userId,
      );
      res.json({ tunnels: rows.map((t) => tunnelPayload(db, t)) });
    } catch (e) {
      next(e);
    }
  });

  r.get("/peers/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
      const t = queryOne<TunnelRow>(
        db,
        "SELECT * FROM tunnels WHERE id = ? AND user_id = ?",
        req.params.id,
        req.auth!.userId,
      );
      if (!t) throw ApiError.notFound("Tunnel not found");
      const session = queryOne<{ id: string; state: string }>(
        db,
        "SELECT id, state FROM sessions WHERE tunnel_id = ? ORDER BY connected_at DESC LIMIT 1",
        t.id,
      );
      res.json({
        tunnel: tunnelPayload(db, t),
        session: session ?? null,
      });
    } catch (e) {
      next(e);
    }
  });

  r.delete("/peers/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
      const t = queryOne<TunnelRow>(
        db,
        "SELECT * FROM tunnels WHERE id = ? AND user_id = ? AND status = 'active'",
        req.params.id,
        req.auth!.userId,
      );
      if (!t) throw ApiError.notFound("Tunnel not found");
      run(db, "UPDATE tunnels SET status = 'revoked', revoked_at = ? WHERE id = ?", nowIso(), t.id);
      run(
        db,
        "UPDATE sessions SET state = 'closed', closed_at = ? WHERE tunnel_id = ? AND state != 'closed'",
        nowIso(),
        t.id,
      );
      queueRemovePeer(db, t.server_id, t.public_key);
      audit(db, "peer.delete", { actorUserId: req.auth!.userId, targetType: "tunnel", targetId: t.id });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });

  r.post("/peers/:id/rotate", (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z.object({ newPublicKey: z.string().min(44).max(44) }).parse(req.body);
      validateWireGuardPublicKey(body.newPublicKey);
      const t = queryOne<TunnelRow>(
        db,
        "SELECT * FROM tunnels WHERE id = ? AND user_id = ? AND status = 'active'",
        req.params.id,
        req.auth!.userId,
      );
      if (!t) throw ApiError.notFound("Tunnel not found");
      const dup = queryOne<{ id: string }>(
        db,
        "SELECT id FROM tunnels WHERE public_key = ? AND status = 'active'",
        body.newPublicKey,
      );
      if (dup) throw ApiError.conflict("Public key already registered");
      // Atomic swap: old peer removed from server, new one added, same address.
      run(
        db,
        "UPDATE tunnels SET status = 'rotated' WHERE id = ?",
        t.id,
      );
      const newId2 = newId();
      run(
        db,
        "INSERT INTO tunnels (id, user_id, device_id, server_id, public_key, address_v4, address_v6, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)",
        newId2,
        t.user_id,
        t.device_id,
        t.server_id,
        body.newPublicKey,
        t.address_v4,
        t.address_v6,
        nowIso(),
      );
      const session = queryOne<{ id: string }>(
        db,
        "SELECT id FROM sessions WHERE tunnel_id = ? ORDER BY connected_at DESC LIMIT 1",
        t.id,
      );
      if (session) {
        run(
          db,
          "UPDATE sessions SET tunnel_id = ? WHERE id = ?",
          newId2,
          session.id,
        );
      }
      queueRemovePeer(db, t.server_id, t.public_key);
      queueAddPeer(db, t.server_id, {
        publicKey: body.newPublicKey,
        addressV4: t.address_v4,
        addressV6: t.address_v6 === "::" ? undefined : t.address_v6,
      });
      bus.publish(req.auth!.userId, "config.updated", { tunnelId: newId2 });
      audit(db, "peer.rotate", {
        actorUserId: req.auth!.userId,
        targetType: "tunnel",
        targetId: newId2,
        meta: { previousTunnelId: t.id },
      });
      res.json({ tunnel: tunnelPayload(db, queryOne<TunnelRow>(db, "SELECT * FROM tunnels WHERE id = ?", newId2)!) });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
