import request from "supertest";
import type { Express } from "express";
import { buildApp, type AppContext } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

export interface TestCtx {
  ctx: AppContext;
  app: Express;
}

/** Fresh isolated app per test: temp sqlite db, configurable env overrides. */
export function createTestServer(
  env: Record<string, string> = {},
): TestCtx {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aegis-test-"));
  const cfg = loadConfig({
    NODE_ENV: "test",
    DATABASE_PATH: path.join(dir, "test.db"),
    JWT_SECRET: "test-secret-test-secret-test-secret-0123456789",
    RATE_AUTH_MAX: "10000",
    RATE_DEFAULT_MAX: "100000",
    PORT: "0",
    ...env,
  });
  const ctx = buildApp(cfg);
  return { ctx, app: ctx.app as unknown as Express };
}

export function closeTestServer({ ctx }: TestCtx): void {
  ctx.close();
}

export const DEMO_PASSWORD = "Sup3rSecurePass";

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

export function deviceUid(): string {
  return crypto.randomUUID();
}

export function wgKey(seed: string): string {
  return crypto.createHash("sha256").update(seed + crypto.randomUUID()).digest().toString("base64");
}

export function auth(user: TestUser): { Authorization: string } {
  return { Authorization: `Bearer ${user.accessToken}` };
}

/** Registers a fresh user and returns their auth context. */
export async function registerUser(
  app: Express,
  opts: Partial<{ email: string; password: string; name: string; platform: string; deviceName: string }> = {},
): Promise<TestUser> {
  const body = {
    email: opts.email ?? `user-${crypto.randomUUID()}@test.local`,
    password: opts.password ?? DEMO_PASSWORD,
    name: opts.name ?? "Test User",
    deviceName: opts.deviceName ?? "Test Device",
    platform: opts.platform ?? "android",
    deviceUid: deviceUid(),
  };
  const res = await request(app).post("/api/v1/auth/register").send(body);
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    id: res.body.user.id,
    email: body.email,
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    deviceId: res.body.device.id,
  };
}
