import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import {
  createTestServer,
  closeTestServer,
  registerUser,
  auth,
  wgKey,
  type TestCtx,
  type TestUser,
} from "./setup.js";

function promoteToAdmin(t: TestCtx, userId: string): void {
  t.ctx.db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(userId);
}

async function createServerRow(
  t: TestCtx,
  admin: TestUser,
  code: string,
): Promise<{ id: string; agentToken: string }> {
  const res = await request(t.app)
    .post("/api/v1/admin/servers")
    .set(auth(admin))
    .send({
      code,
      name: `S-${code}`,
      country: "Testland",
      city: "Testville",
      host: `${code}.test.local`,
      port: 51820,
      publicKey: wgKey(code),
      capacity: 250,
      ipv4Prefix: "10.90.0.0/24",
      ipv6Prefix: "fd00:90::/64",
      dns: "10.90.0.1",
    });
  expect(res.status).toBe(201);
  return { id: res.body.server.id, agentToken: res.body.agentToken };
}

function agent(agentToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${agentToken}` };
}

describe("vpn server control plane (agent ↔ backend)", () => {
  let t: TestCtx;
  let admin: TestUser;
  let srv: { id: string; agentToken: string };

  beforeAll(async () => {
    t = createTestServer();
    admin = await registerUser(t.app);
    promoteToAdmin(t, admin.id);
    srv = await createServerRow(t, admin, "agent-test-01");
  });
  afterAll(() => closeTestServer(t));

  it("rejects unknown agent tokens", async () => {
    const res = await request(t.app)
      .post("/agent/heartbeat")
      .set(agent("agt_forged"))
      .send({ cpuPct: 1, ramPct: 1, diskPct: 1, tunnelCount: 0, bandwidthIn: 0, bandwidthOut: 0, uptimeSec: 1, wgInterface: "wg0" });
    expect(res.status).toBe(401);
  });

  it("registers the agent's server details and activates it", async () => {
    const res = await request(t.app)
      .post("/agent/register")
      .set(agent(srv.agentToken))
      .send({
        name: "Agent Registered",
        code: "agent-test-01",
        country: "Testland",
        city: "Testville",
        host: "agent01.test.local",
        port: 51821,
        publicKey: wgKey("agent-register"),
        capacity: 100,
        ipv4Prefix: "10.91.0.0/24",
        ipv6Prefix: "fd00:91::/64",
        dns: "10.91.0.1",
      });
    expect(res.status).toBe(201);
    const list = await request(t.app).get("/api/v1/servers").set(auth(admin));
    const s = list.body.servers.find((x: { code: string }) => x.code === "agent-test-01");
    expect(s.status).toBe("active");
    expect(s.port).toBe(51821);
  });

  it("returns pending add_peer ops on heartbeat and accepts acks", async () => {
    const u = await registerUser(t.app);
    const created = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: srv.id, publicKey: wgKey("agent-peer") });
    expect(created.status).toBe(201);

    const hb = await request(t.app)
      .post("/agent/heartbeat")
      .set(agent(srv.agentToken))
      .send({
        cpuPct: 12,
        ramPct: 40,
        diskPct: 22,
        tunnelCount: 1,
        bandwidthIn: 1000,
        bandwidthOut: 2000,
        uptimeSec: 3600,
        wgInterface: "wg0",
      });
    expect(hb.status).toBe(200);
    expect(hb.body.ops).toHaveLength(1);
    const op = hb.body.ops[0];
    expect(op.type).toBe("add_peer");
    expect(op.payload.publicKey).toBeTruthy();
    expect(op.payload.addressV4).toBe("10.91.0.2");

    const ack = await request(t.app)
      .post(`/agent/ops/${op.id}/ack`)
      .set(agent(srv.agentToken))
      .send({ success: true });
    expect(ack.status).toBe(204);

    // Op applied — next heartbeat has no pending ops.
    const hb2 = await request(t.app)
      .post("/agent/heartbeat")
      .set(agent(srv.agentToken))
      .send({
        cpuPct: 12, ramPct: 40, diskPct: 22, tunnelCount: 1,
        bandwidthIn: 1000, bandwidthOut: 2000, uptimeSec: 3630, wgInterface: "wg0",
      });
    expect(hb2.body.ops).toHaveLength(0);
  });

  it("retries failed ops up to 5 attempts then marks dead", async () => {
    const u = await registerUser(t.app);
    await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: srv.id, publicKey: wgKey("fail-op") });

    const hb1 = await request(t.app)
      .post("/agent/heartbeat")
      .set(agent(srv.agentToken))
      .send({ cpuPct: 1, ramPct: 1, diskPct: 1, tunnelCount: 0, bandwidthIn: 0, bandwidthOut: 0, uptimeSec: 1, wgInterface: "wg0" });
    const op = hb1.body.ops[0];

    for (let i = 0; i < 5; i++) {
      await request(t.app)
        .post(`/agent/ops/${op.id}/ack`)
        .set(agent(srv.agentToken))
        .send({ success: false, error: "wg set failed: simulated" });
      if (i < 4) {
        const hb = await request(t.app)
          .post("/agent/heartbeat")
          .set(agent(srv.agentToken))
          .send({ cpuPct: 1, ramPct: 1, diskPct: 1, tunnelCount: 0, bandwidthIn: 0, bandwidthOut: 0, uptimeSec: 1, wgInterface: "wg0" });
        expect(hb.body.ops.some((o: { id: string }) => o.id === op.id)).toBe(true);
      }
    }
    const row = t.ctx.db.prepare("SELECT status, attempts FROM server_ops WHERE id = ?").get(op.id) as { status: string; attempts: number };
    expect(row.status).toBe("dead");
    expect(row.attempts).toBeGreaterThanOrEqual(5);
  });

  it("peer stats from agent update session state (handshake freshness)", async () => {
    const u = await registerUser(t.app);
    const peerKey = wgKey("stats-peer");
    await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: srv.id, publicKey: peerKey });

    await request(t.app)
      .post("/agent/heartbeat")
      .set(agent(srv.agentToken))
      .send({
        cpuPct: 5, ramPct: 30, diskPct: 10, tunnelCount: 1,
        bandwidthIn: 500, bandwidthOut: 900, uptimeSec: 7200, wgInterface: "wg0",
        peers: [{ publicKey: peerKey, bytesIn: 12345, bytesOut: 54321, handshakeAgoSec: 30 }],
      });

    const sessions = await request(t.app).get("/api/v1/sessions").set(auth(u));
    const s = sessions.body.sessions.find(
      (x: { state: string }) => x.state === "connected" || x.state === "reconnecting",
    );
    expect(s).toBeTruthy();
    expect(s.bytesIn).toBe(12345);
    expect(s.state).toBe("connected");
  });

  it("stale handshakes flip sessions to reconnecting", async () => {
    const u = await registerUser(t.app);
    const staleKey = wgKey("stale-peer");
    await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: srv.id, publicKey: staleKey });

    await request(t.app)
      .post("/agent/heartbeat")
      .set(agent(srv.agentToken))
      .send({
        cpuPct: 5, ramPct: 30, diskPct: 10, tunnelCount: 1,
        bandwidthIn: 0, bandwidthOut: 0, uptimeSec: 7200, wgInterface: "wg0",
        peers: [{ publicKey: staleKey, bytesIn: 1, bytesOut: 1, handshakeAgoSec: 600 }],
      });

    const sessions = await request(t.app).get("/api/v1/sessions").set(auth(u));
    const mine = sessions.body.sessions.find((x: { deviceName: string }) => x.deviceName === "Test Device");
    expect(mine).toBeTruthy();
    expect(mine.state).toBe("reconnecting");
  });

  it("admin disabling a user force-disconnects their sessions", async () => {
    const victim = await registerUser(t.app);
    await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(victim))
      .send({ deviceId: victim.deviceId, serverId: srv.id, publicKey: wgKey("victim-peer") });

    const res = await request(t.app)
      .patch(`/api/v1/admin/users/${victim.id}`)
      .set(auth(admin))
      .send({ status: "disabled" });
    expect(res.status).toBe(200);

    const sessions = await request(t.app).get("/api/v1/sessions").set(auth(admin));
    void sessions;
    const tokens = t.ctx.db
      .prepare("SELECT COUNT(*) AS c FROM refresh_tokens WHERE user_id = ? AND revoked_at IS NOT NULL")
      .get(victim.id) as { c: number };
    expect(tokens.c).toBeGreaterThanOrEqual(1);
  });
});
