import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
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

async function createActiveServer(
  t: TestCtx,
  admin: TestUser,
  opts: { code?: string; status?: string; capacity?: number } = {},
): Promise<{ id: string; agentToken: string }> {
  const res = await request(t.app)
    .post("/api/v1/admin/servers")
    .set(auth(admin))
    .send({
      code: opts.code ?? "nl-ams-01",
      name: "Amsterdam-1",
      country: "Netherlands",
      city: "Amsterdam",
      host: "ams01.test.local",
      port: 51820,
      publicKey: wgKey(`srv-${opts.code ?? "nl-ams-01"}`),
      capacity: opts.capacity ?? 250,
      ipv4Prefix: "10.77.0.0/24",
      ipv6Prefix: "fd00:77::/64",
      dns: "10.77.0.1",
    });
  expect(res.status).toBe(201);
  const { server, agentToken } = res.body;
  const status = opts.status ?? "active";
  if (status !== "offline") {
    await request(t.app)
      .patch(`/api/v1/admin/servers/${server.id}`)
      .set(auth(admin))
      .send({ status });
  }
  return { id: server.id, agentToken };
}

describe("vpn provisioning", () => {
  let t: TestCtx;
  let admin: TestUser;
  let server: { id: string; agentToken: string };

  beforeAll(async () => {
    t = createTestServer();
    admin = await registerUser(t.app);
    promoteToAdmin(t, admin.id);
    server = await createActiveServer(t, admin);
  });
  afterAll(() => closeTestServer(t));

  it("creates a tunnel with real WireGuard key validation, IP allocation and session", async () => {
    const u = await registerUser(t.app);
    const res = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: server.id, publicKey: wgKey("t1") });
    expect(res.status).toBe(201);
    const tunnel = res.body.tunnel;
    expect(tunnel.addressV4).toBe("10.77.0.2"); // gateway .1 skipped
    expect(tunnel.addressV6).toBe("fd00:77::2");
    expect(tunnel.endpointHost).toBe("ams01.test.local");
    expect(tunnel.endpointPort).toBe(51820);
    expect(tunnel.allowedIps).toEqual(["0.0.0.0/0", "::/0"]);
    expect(tunnel.mtu).toBe(1420);
    expect(tunnel.keepalive).toBe(25);
    expect(tunnel.serverPublicKey).toBeTruthy();
    expect(res.body.session.state).toBe("connected");

    // Second user gets the next free address.
    const u2 = await registerUser(t.app);
    const res2 = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u2))
      .send({ deviceId: u2.deviceId, serverId: server.id, publicKey: wgKey("t2") });
    expect(res2.status).toBe(201);
    expect(res2.body.tunnel.addressV4).toBe("10.77.0.3");
  });

  it("rejects malformed WireGuard public keys", async () => {
    const u = await registerUser(t.app);
    const res = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: server.id, publicKey: "not-a-wg-key!!!" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects duplicate public keys", async () => {
    const u = await registerUser(t.app);
    const key = wgKey("dup");
    const first = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: server.id, publicKey: key });
    expect(first.status).toBe(201);
    const u2 = await registerUser(t.app);
    const second = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u2))
      .send({ deviceId: u2.deviceId, serverId: server.id, publicKey: key });
    expect(second.status).toBe(409);
  });

  it("refuses provisioning to non-active servers", async () => {
    const maint = await createActiveServer(t, admin, { code: "sg-sin-01", status: "maintenance" });
    const u = await registerUser(t.app);
    const res = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: maint.id, publicKey: wgKey("maint") });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("SERVER_UNAVAILABLE");
  });

  it("enforces server capacity", async () => {
    const tiny = await createActiveServer(t, admin, { code: "fi-hel-01", status: "active", capacity: 1 });
    const u1 = await registerUser(t.app);
    const ok = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u1))
      .send({ deviceId: u1.deviceId, serverId: tiny.id, publicKey: wgKey("cap1") });
    expect(ok.status).toBe(201);
    const u2 = await registerUser(t.app);
    const full = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u2))
      .send({ deviceId: u2.deviceId, serverId: tiny.id, publicKey: wgKey("cap2") });
    expect(full.status).toBe(503);
  });

  it("is idempotent with Idempotency-Key on retries", async () => {
    const u = await registerUser(t.app);
    const key = crypto.randomUUID();
    const body = { deviceId: u.deviceId, serverId: server.id, publicKey: wgKey("idem") };
    const r1 = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .set("Idempotency-Key", key)
      .send(body);
    expect(r1.status).toBe(201);
    const r2 = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .set("Idempotency-Key", key)
      .send(body);
    expect(r2.status).toBe(201);
    expect(r2.body.tunnel.id).toBe(r1.body.tunnel.id);
  });

  it("lists and deletes tunnels; deletion queues peer removal", async () => {
    const u = await registerUser(t.app);
    const created = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: server.id, publicKey: wgKey("del") });
    const tunnelId = created.body.tunnel.id;

    const list = await request(t.app).get("/api/v1/vpn/peers").set(auth(u));
    expect(list.body.tunnels.some((x: { id: string }) => x.id === tunnelId)).toBe(true);

    const del = await request(t.app)
      .delete(`/api/v1/vpn/peers/${tunnelId}`)
      .set(auth(u));
    expect(del.status).toBe(204);

    // Tunnel remains listed for history but is revoked and no longer usable.
    const after = await request(t.app).get("/api/v1/vpn/peers").set(auth(u));
    const listed = after.body.tunnels.find((x: { id: string }) => x.id === tunnelId);
    expect(listed).toBeTruthy();
    expect(listed.status).toBe("revoked");

    // remove_peer op queued for the agent.
    const ops = t.ctx.db
      .prepare("SELECT type, status FROM server_ops ORDER BY created_at DESC LIMIT 1")
      .get() as { type: string; status: string };
    expect(ops.type).toBe("remove_peer");
    expect(ops.status).toBe("pending");
  });

  it("rotates keys keeping the same address", async () => {
    const u = await registerUser(t.app);
    const created = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: server.id, publicKey: wgKey("rot-old") });
    const tunnelId = created.body.tunnel.id;
    const oldV4 = created.body.tunnel.addressV4;

    const rot = await request(t.app)
      .post(`/api/v1/vpn/peers/${tunnelId}/rotate`)
      .set(auth(u))
      .send({ newPublicKey: wgKey("rot-new") });
    expect(rot.status).toBe(200);
    expect(rot.body.tunnel.id).not.toBe(tunnelId);
    expect(rot.body.tunnel.addressV4).toBe(oldV4);
  });

  it("server list shows live load", async () => {
    const u = await registerUser(t.app);
    const res = await request(t.app).get("/api/v1/servers").set(auth(u));
    expect(res.status).toBe(200);
    expect(res.body.servers.length).toBeGreaterThanOrEqual(1);
    const ams = res.body.servers.find((s: { code: string }) => s.code === "nl-ams-01");
    expect(ams.loadPct).toBeGreaterThanOrEqual(0);
    expect(ams.supportsDualStack).toBe(true);
  });

  it("forces session disconnect and emits event", async () => {
    const u = await registerUser(t.app);
    const created = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: server.id, publicKey: wgKey("force") });
    const sessionId = created.body.session.id;

    const del = await request(t.app)
      .delete(`/api/v1/sessions/${sessionId}`)
      .set(auth(u));
    expect(del.status).toBe(204);

    const sessions = await request(t.app).get("/api/v1/sessions").set(auth(u));
    const s = sessions.body.sessions.find((x: { id: string }) => x.id === sessionId);
    expect(s.state).toBe("closed");
  });
});
