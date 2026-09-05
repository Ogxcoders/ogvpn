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

describe("subscription & entitlements", () => {
  let t: TestCtx;
  let admin: TestUser;
  let serverId: string;

  beforeAll(async () => {
    t = createTestServer();
    admin = await registerUser(t.app);
    promoteToAdmin(t, admin.id);
    const res = await request(t.app)
      .post("/api/v1/admin/servers")
      .set(auth(admin))
      .send({
        code: "sub-test-01",
        name: "Sub Test",
        country: "Testland",
        city: "Testville",
        host: "sub.test.local",
        port: 51820,
        publicKey: wgKey("sub-test"),
        capacity: 250,
        ipv4Prefix: "10.95.0.0/24",
        ipv6Prefix: "fd00:95::/64",
        dns: "10.95.0.1",
      });
    serverId = res.body.server.id;
  });
  afterAll(() => closeTestServer(t));

  it("lists plans with device limits and features", async () => {
    const u = await registerUser(t.app);
    const res = await request(t.app).get("/api/v1/subscription/plans").set(auth(u));
    expect(res.status).toBe(200);
    const codes = res.body.plans.map((p: { code: string }) => p.code);
    expect(codes).toContain("free");
    expect(codes).toContain("premium");
    const premium = res.body.plans.find((p: { code: string }) => p.code === "premium");
    expect(premium.maxDevices).toBe(10);
    expect(premium.features).toBeInstanceOf(Array);
  });

  it("demo checkout activates premium and is labeled simulated", async () => {
    const u = await registerUser(t.app);
    const res = await request(t.app)
      .post("/api/v1/subscription/checkout")
      .set(auth(u))
      .send({ planCode: "premium" });
    expect(res.status).toBe(200);
    expect(res.body.subscription.plan).toBe("premium");
    expect(res.body.subscription.simulatedPayment).toBe(true);

    const sub = await request(t.app).get("/api/v1/subscription").set(auth(u));
    expect(sub.body.subscription.status).toBe("active");

    // Audit entry records the simulated checkout.
    const auditRow = t.ctx.db
      .prepare("SELECT action FROM audit_log WHERE actor_user_id = ? AND action LIKE 'subscription.checkout%' ORDER BY created_at DESC LIMIT 1")
      .get(u.id) as { action: string } | undefined;
    expect(auditRow?.action).toBe("subscription.checkout.simulated");
  });

  it("cancel keeps plan until period end", async () => {
    const u = await registerUser(t.app);
    await request(t.app)
      .post("/api/v1/subscription/checkout")
      .set(auth(u))
      .send({ planCode: "premium" });
    const res = await request(t.app).post("/api/v1/subscription/cancel").set(auth(u));
    expect(res.status).toBe(200);
    expect(res.body.subscription.status).toBe("canceled");
    expect(res.body.subscription.currentPeriodEnd).toBeTruthy();
  });

  it("stripe provider returns 501 instead of pretending", async () => {
    const stripe = createTestServer({ PAYMENTS_PROVIDER: "stripe" });
    try {
      const u = await registerUser(stripe.app);
      const res = await request(stripe.app)
        .post("/api/v1/subscription/checkout")
        .set(auth(u))
        .send({ planCode: "premium" });
      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe("NOT_IMPLEMENTED");
    } finally {
      closeTestServer(stripe);
    }
  });

  it("expired premium falls back to free-tier effective limits", async () => {
    const u = await registerUser(t.app);
    await request(t.app)
      .post("/api/v1/subscription/checkout")
      .set(auth(u))
      .send({ planCode: "premium" });
    // Force the period end into the past (simulates expiry).
    t.ctx.db
      .prepare("UPDATE subscriptions SET current_period_end = ? WHERE user_id = ?")
      .run(new Date(Date.now() - 3600 * 1000).toISOString(), u.id);

    const res = await request(t.app).get("/api/v1/subscription").set(auth(u));
    expect(res.body.subscription.currentPeriodEnd).toBeTruthy();
    const eff = res.body.subscription;
    // Effective plan falls back to free once expired.
    expect(eff.maxDevices).toBe(2);

    // Server status must be active for provisioning; activate it.
    await request(t.app)
      .patch(`/api/v1/admin/servers/${serverId}`)
      .set(auth(admin))
      .send({ status: "active" });
    const peer = await request(t.app)
      .post("/api/v1/vpn/peers")
      .set(auth(u))
      .send({ deviceId: u.deviceId, serverId, publicKey: wgKey(`expired-${crypto.randomUUID()}`) });
    // Expired premium users are allowed (free tier), not blocked.
    expect(peer.status).toBe(201);
  });

  it("subscription.changed event is persisted as a notification", async () => {
    const u = await registerUser(t.app);
    await request(t.app)
      .post("/api/v1/subscription/checkout")
      .set(auth(u))
      .send({ planCode: "premium" });
    const notes = await request(t.app).get("/api/v1/notifications").set(auth(u));
    expect(notes.status).toBe(200);
    expect(notes.body.notifications.some((n: { type: string }) => n.type === "subscription.changed")).toBe(true);
  });
});
