import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import http from "node:http";
import {
  createTestServer,
  closeTestServer,
  registerUser,
  auth,
  type TestCtx,
  deviceUid,
} from "./setup.js";
import type { AddressInfo } from "node:net";

describe("events (SSE)", () => {
  let t: TestCtx;
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    t = createTestServer();
    server = t.app.listen(0);
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });
  afterAll(() => {
    server.close();
    closeTestServer(t);
  });

  it("streams events to the connected user's clients", async () => {
    const u = await registerUser(t.app);

    const stream = await fetch(`${baseUrl}/api/v1/events?access_token=${u.accessToken}`);
    expect(stream.status).toBe(200);
    expect(stream.headers.get("content-type")).toContain("text/event-stream");

    // Read the initial ping.
    const reader = stream.body!.getReader();
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain("event: ping");

    // Publish a durable event via a second device revocation flow:
    // register a second device, then revoke it from device one.
    const login = await request(t.app)
      .post("/api/v1/auth/login")
      .send({
        email: u.email,
        password: "Sup3rSecurePass",
        deviceName: "Second",
        platform: "linux",
        deviceUid: deviceUid(),
      });
    const secondDeviceId = login.body.device.id;
    await request(t.app).delete(`/api/v1/devices/${secondDeviceId}`).set(auth(u));

    const chunk = await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("no SSE event within 3s")), 3000),
      ),
    ]);
    const text = new TextDecoder().decode((chunk as { value: Uint8Array }).value);
    expect(text).toContain("event: device.revoked");
    expect(text).toContain(secondDeviceId);

    await reader.cancel();
  });

  it("requires a valid token", async () => {
    const res = await fetch(`${baseUrl}/api/v1/events?access_token=bogus.token.here`);
    expect(res.status).toBe(401);
  });

  it("persists durable events as notifications", async () => {
    const u = await registerUser(t.app);
    const login = await request(t.app)
      .post("/api/v1/auth/login")
      .send({
        email: u.email,
        password: "Sup3rSecurePass",
        deviceName: "Second",
        platform: "linux",
        deviceUid: deviceUid(),
      });
    await request(t.app)
      .delete(`/api/v1/devices/${login.body.device.id}`)
      .set(auth(u));
    const notes = await request(t.app).get("/api/v1/notifications").set(auth(u));
    expect(notes.body.notifications.some((n: { type: string }) => n.type === "device.revoked")).toBe(true);
  });

  it("metrics endpoint reports counters", async () => {
    const res = await request(t.app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.body.httpRequests).toBeGreaterThan(0);
    expect(res.body).toHaveProperty("dbQueryCount");
  });

  it("readiness probe checks the database", async () => {
    const res = await request(t.app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
  });
});
