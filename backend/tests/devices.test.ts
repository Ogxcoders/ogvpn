import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import {
  createTestServer,
  closeTestServer,
  registerUser,
  auth,
  deviceUid,
  wgKey,
  type TestCtx,
  type TestUser,
} from "./setup.js";
import type { DB } from "../src/db.js";

function promoteToAdmin(db: DB, userId: string): void {
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(userId);
}

async function createActiveServer(
  t: TestCtx,
  admin: TestUser,
  opts: { code?: string; status?: string } = {},
): Promise<{ id: string; agentToken: string }> {
  const code = opts.code ?? "nl-ams-01";
  const res = await request(t.app)
    .post("/api/v1/admin/servers")
    .set(auth(admin))
    .send({
      code,
      name: `${code}-name`,
      country: "Netherlands",
      city: "Amsterdam",
      host: `${code}.test.local`,
      port: 51820,
      publicKey: wgKey(`server-${code}`),
      capacity: 2,
      ipv4Prefix: "10.77.0.0/24",
      ipv6Prefix: "fd00:77::/64",
      dns: "10.77.0.1",
    });
  expect(res.status).toBe(201);
  const serverId = res.body.server.id;
  const agentToken: string = res.body.agentToken;
  const status = opts.status ?? "active";
  if (status !== "offline") {
    const patch = await request(t.app)
      .patch(`/api/v1/admin/servers/${serverId}`)
      .set(auth(admin))
      .send({ status });
    expect(patch.status).toBe(200);
  }
  return { id: serverId, agentToken };
}

describe("devices", () => {
  let t: TestCtx;

  beforeAll(() => {
    t = createTestServer();
  });
  afterAll(() => closeTestServer(t));

  it("lists registered devices with session info", async () => {
    const u = await registerUser(t.app);
    const res = await request(t.app).get("/api/v1/devices").set(auth(u));
    expect(res.status).toBe(200);
    expect(res.body.devices).toHaveLength(1);
    expect(res.body.devices[0].platform).toBe("android");
    expect(res.body.devices[0].session).toBeNull();
  });

  it("same device uid re-login reuses the device row", async () => {
    const uid = deviceUid();
    const email = `sameuid-${uid}@test.local`;
    const pw = "Sup3rSecurePass";
    await request(t.app)
      .post("/api/v1/auth/register")
      .send({ email, password: pw, name: "S", deviceName: "A", platform: "android", deviceUid: uid });
    const second = await request(t.app)
      .post("/api/v1/auth/login")
      .send({ email, password: pw, deviceName: "A-renamed", platform: "android", deviceUid: uid });
    expect(second.status).toBe(200);
    const list = await request(t.app)
      .get("/api/v1/devices")
      .set({ Authorization: `Bearer ${second.body.accessToken}` });
    expect(list.body.devices).toHaveLength(1);
    expect(list.body.devices[0].name).toBe("A-renamed");
  });

  it("renames a device", async () => {
    const u = await registerUser(t.app);
    const res = await request(t.app)
      .patch(`/api/v1/devices/${u.deviceId}`)
      .set(auth(u))
      .send({ name: "Renamed Device" });
    expect(res.status).toBe(200);
    expect(res.body.device.name).toBe("Renamed Device");
  });

  it("cannot rename or revoke another user's device", async () => {
    const a = await registerUser(t.app);
    const b = await registerUser(t.app);
    const res = await request(t.app)
      .patch(`/api/v1/devices/${b.deviceId}`)
      .set(auth(a))
      .send({ name: "hax" });
    expect(res.status).toBe(404);
    const rev = await request(t.app)
      .delete(`/api/v1/devices/${b.deviceId}`)
      .set(auth(a));
    expect(rev.status).toBe(404);
  });

  it("revoking a device kills its refresh tokens and blocks VPN provisioning", async () => {
    const u = await registerUser(t.app);
    promoteToAdmin(t.ctx.db, u.id);
    const server = await createActiveServer(t, u);

    // Provision a tunnel on this device.
    const peer = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: server.id, publicKey: wgKey("dev-revoke") });
    expect(peer.status).toBe(201);

    // Revoke the device.
    const rev = await request(t.app)
      .delete(`/api/v1/devices/${u.deviceId}`)
      .set(auth(u));
    expect(rev.status).toBe(204);

    // Refresh token for that device is dead.
    const r = await request(t.app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: u.refreshToken });
    expect(r.status).toBe(401);

    // The device's open session is closed (verified in DB).
    const closedRow = t.ctx.db
      .prepare("SELECT state FROM sessions WHERE device_id = ?")
      .get(u.deviceId) as { state: string };
    expect(closedRow.state).toBe("closed");

    // Old access token for the revoked device is rejected (401 DEVICE_REVOKED).
    const stale = await request(t.app)
      .get("/api/v1/sessions")
      .set({ Authorization: `Bearer ${u.accessToken}` });
    expect(stale.status).toBe(401);
    expect(stale.body.error.code).toBe("DEVICE_REVOKED");
  });

  it("device limit is enforced by plan (free = 2)", async () => {
    const u = await registerUser(t.app);
    promoteToAdmin(t.ctx.db, u.id);
    const server = await createActiveServer(t, u, { code: "us-nyc-01" });

    // Device 1 is the registration device. Add a second device via login.
    const login = await request(t.app)
      .post("/api/v1/auth/login")
      .send({
        email: u.email,
        password: "Sup3rSecurePass",
        deviceName: "Second Device",
        platform: "windows",
        deviceUid: deviceUid(),
      });
    expect(login.status).toBe(200);
    const secondDeviceId = login.body.device.id;

    const p1 = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId: server.id, publicKey: wgKey("limit-1") });
    expect(p1.status).toBe(201);
    const p2 = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set({ Authorization: `Bearer ${login.body.accessToken}` })
      .send({ deviceId: secondDeviceId, serverId: server.id, publicKey: wgKey("limit-2") });
    expect(p2.status).toBe(201);

    // Third device would breach the free-plan limit of 2.
    const login3 = await request(t.app)
      .post("/api/v1/auth/login")
      .send({
        email: u.email,
        password: "Sup3rSecurePass",
        deviceName: "Third Device",
        platform: "macos",
        deviceUid: deviceUid(),
      });
    const third = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set({ Authorization: `Bearer ${login3.body.accessToken}` })
      .send({ deviceId: login3.body.device.id, serverId: server.id, publicKey: wgKey("limit-3") });
    expect(third.status).toBe(403);
    expect(third.body.error.code).toBe("DEVICE_LIMIT_REACHED");
  });
});
