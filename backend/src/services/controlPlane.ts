import type { DB } from "../db.js";
import { query, queryOne, run } from "../db.js";
import { newId, nowIso } from "../lib/util.js";
import type { EventBus } from "../events.js";

/**
 * VPN server control plane.
 *
 * The backend never talks to VPN servers directly — it queues *ops* that each
 * server's agent pulls on its next heartbeat and applies locally via
 * `wg set`. This keeps outbound-only connectivity from the servers, survives
 * transient outages, and gives a durable audit trail of every peer change.
 */

export interface PeerOp {
  id: string;
  type: "add_peer" | "remove_peer";
  payload: Record<string, unknown>;
}

export function queueAddPeer(
  db: DB,
  serverId: string,
  payload: { publicKey: string; addressV4: string; addressV6?: string },
): void {
  run(
    db,
    "INSERT INTO server_ops (id, server_id, type, payload, status, attempts, created_at) VALUES (?, ?, 'add_peer', ?, 'pending', 0, ?)",
    newId(),
    serverId,
    JSON.stringify(payload),
    nowIso(),
  );
}

export function queueRemovePeer(
  db: DB,
  serverId: string,
  publicKey: string,
): void {
  run(
    db,
    "INSERT INTO server_ops (id, server_id, type, payload, status, attempts, created_at) VALUES (?, ?, 'remove_peer', ?, 'pending', 0, ?)",
    newId(),
    serverId,
    JSON.stringify({ publicKey }),
    nowIso(),
  );
}

/** Called on agent heartbeat: returns up to 50 pending ops and marks them dispatched. */
export function takePendingOps(db: DB, serverId: string): PeerOp[] {
  const rows = query<{
    id: string;
    type: "add_peer" | "remove_peer";
    payload: string;
    status: string;
    attempts: number;
  }>(
    db,
    "SELECT id, type, payload, status, attempts FROM server_ops WHERE server_id = ? AND status IN ('pending','failed') ORDER BY created_at ASC LIMIT 50",
    serverId,
  );
  for (const row of rows) {
    run(
      db,
      "UPDATE server_ops SET status = 'dispatched', attempts = attempts + 1 WHERE id = ?",
      row.id,
    );
  }
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    payload: JSON.parse(r.payload) as Record<string, unknown>,
  }));
}

export function ackOp(
  db: DB,
  serverId: string,
  opId: string,
  success: boolean,
  error?: string,
): boolean {
  const op = queryOne<{ id: string; server_id: string; attempts: number }>(
    db,
    "SELECT id, server_id, attempts FROM server_ops WHERE id = ? AND server_id = ?",
    opId,
    serverId,
  );
  if (!op) return false;
  if (success) {
    run(
      db,
      "UPDATE server_ops SET status = 'applied', applied_at = ?, last_error = NULL WHERE id = ?",
      nowIso(),
      opId,
    );
  } else if (op.attempts >= 5) {
    run(
      db,
      "UPDATE server_ops SET status = 'dead', last_error = ? WHERE id = ?",
      error ?? "unknown error",
      opId,
    );
  } else {
    run(
      db,
      "UPDATE server_ops SET status = 'failed', last_error = ? WHERE id = ?",
      error ?? "unknown error",
      opId,
    );
  }
  return true;
}

/** Force-disconnects a session: closes it, queues peer removal, notifies client. */
export function forceDisconnectSession(
  db: DB,
  bus: EventBus,
  sessionId: string,
): { userId: string; tunnelId: string } {
  const session = queryOne<{
    id: string;
    user_id: string;
    tunnel_id: string;
    state: string;
  }>(db, "SELECT id, user_id, tunnel_id, state FROM sessions WHERE id = ?", sessionId);
  if (!session) throw new Error("session not found");
  if (session.state === "closed") {
    return { userId: session.user_id, tunnelId: session.tunnel_id };
  }
  const tunnel = queryOne<{
    public_key: string;
    server_id: string;
    id: string;
  }>(db, "SELECT id, public_key, server_id FROM tunnels WHERE id = ?", session.tunnel_id);
  run(
    db,
    "UPDATE sessions SET state = 'closed', closed_at = ? WHERE id = ?",
    nowIso(),
    sessionId,
  );
  if (tunnel) {
    queueRemovePeer(db, tunnel.server_id, tunnel.public_key);
  }
  bus.publish(
    session.user_id,
    "session.force-disconnect",
    { sessionId, tunnelId: session.tunnel_id },
    {
      title: "Session disconnected",
      body: "Your VPN session was remotely disconnected.",
    },
  );
  return { userId: session.user_id, tunnelId: session.tunnel_id };
}

/** Applies agent-reported per-peer stats to open sessions (handshake freshness). */
export function applyPeerStats(
  db: DB,
  serverId: string,
  peers: Array<{ publicKey: string; bytesIn: number; bytesOut: number; handshakeAgoSec: number }>,
): void {
  const RECONNECT_AFTER_SEC = 180;
  for (const p of peers) {
    const tunnel = queryOne<{ id: string }>(
      db,
      "SELECT id FROM tunnels WHERE public_key = ? AND server_id = ? AND status = 'active'",
      p.publicKey,
      serverId,
    );
    if (!tunnel) continue;
    const handshakeAt = new Date(
      Date.now() - p.handshakeAgoSec * 1000,
    ).toISOString();
    const state =
      p.handshakeAgoSec <= RECONNECT_AFTER_SEC ? "connected" : "reconnecting";
    run(
      db,
      "UPDATE sessions SET bytes_in = ?, bytes_out = ?, last_handshake_at = ?, state = ? WHERE tunnel_id = ? AND state != 'closed'",
      p.bytesIn,
      p.bytesOut,
      handshakeAt,
      state,
      tunnel.id,
    );
  }
}
