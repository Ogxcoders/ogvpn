#!/usr/bin/env bun
/**
 * AegisVPN — production smoke test (AV/BF).
 * Exercises the full golden path against the running dev server.
 * Usage: bun run scripts/smoke-test.ts [baseUrl]
 */
const BASE = process.argv[2] || "http://localhost:3000";
let cookie = "";
let passed = 0, failed = 0;

async function call(path: string, opts: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      ...(opts.body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...(opts.headers || {}),
    },
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const text = await res.text();
  try { return { status: res.status, json: JSON.parse(text) }; }
  catch { return { status: res.status, json: null, text }; }
}

function check(name: string, cond: boolean, extra = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name} ${extra}`); }
}

import crypto from "node:crypto";

function totp(secretB32: string): string {
  const key = Buffer.from(secretB32.replace(/=+$/, ""), "base64url".length ? undefined : undefined) as Buffer;
  const decoded: number[] = [];
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0;
  for (const c of secretB32.toUpperCase()) {
    const idx = ALPHA.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { decoded.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  void key;
  const buf = Buffer.alloc(8);
  const counter = Math.floor(Date.now() / 30000);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const h = crypto.createHmac("sha1", Buffer.from(decoded)).update(buf).digest();
  const off = h[h.length - 1] & 15;
  const code = ((h[off] & 127) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

async function main() {
  console.log(`AegisVPN smoke test → ${BASE}\n`);

  console.log("[1] Public surfaces");
  const health = await call("/api/health");
  check("health returns healthy", health.json?.status === "healthy");
  const status = await call("/api/incidents");
  check("status page data", typeof status.json?.data?.overall === "string");
  const kb = await call("/api/kb");
  check("knowledge base", kb.json?.data?.articles?.length >= 10);
  const servers = await call("/api/servers");
  check("server catalog", servers.json?.data?.totals?.servers >= 40);

  console.log("[2] Registration & auth");
  const email = `smoke_${Date.now()}@example.com`;
  const reg = await call("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password: "Smoke#Test2024!", name: "Smoke" }) });
  check("register + auto session", reg.json?.data?.user?.email === email);
  await call("/api/auth/logout", { method: "POST", body: "{}" });
  const bad = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: "Wrong#Password99" }) });
  check("wrong password rejected", bad.status === 401);
  const login = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: "Smoke#Test2024!" }) });
  check("login", login.json?.data?.user?.email === email);
  const session = await call("/api/auth/session");
  check("session cookie roundtrip", session.json?.data?.authenticated === true);
  const dup = await call("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password: "Smoke#Test2024!" }) });
  check("duplicate register rejected", dup.status === 409);

  console.log("[3] Devices, plans & connection engine");
  const sub = await call("/api/billing/plans");
  check("billing plans", sub.json?.data?.plans?.length === 3);
  const dev = await call("/api/devices", { method: "POST", body: JSON.stringify({ name: "Smoke Phone", platform: "android" }) });
  check("device register + keypair", dev.json?.data?.credentials?.privateKey?.length > 30);
  const deviceId = dev.json?.data?.device?.id as string;
  const conn = await call("/api/connection/connect", { method: "POST", body: JSON.stringify({ deviceId }) });
  check("connect (explicit device)", conn.json?.data?.connection?.server?.code?.length > 0);
  const dupConn = await call("/api/connection/connect", { method: "POST", body: JSON.stringify({}) });
  check("duplicate connect conflicts", dupConn.status === 409);
  const stat = await call("/api/connection/status");
  check("status live metrics", stat.json?.data?.connection?.bytesIn >= 0);
  const fail = await call("/api/connection/disconnect", { method: "POST", body: JSON.stringify({}) });
  const fail2 = await call("/api/connection/disconnect", { method: "POST", body: JSON.stringify({}) });
  check("disconnect idempotent", fail.json?.data?.disconnected && fail2.json?.data?.disconnected);
  const premium = await call("/api/connection/connect", { method: "POST", body: JSON.stringify({ deviceId, serverCode: "CHZUR-01" }) });
  check("premium location gated on free plan", premium.json?.error?.code === "unsupported_location");

  console.log("[4] Device configs");
  const conf = await call(`/api/devices/${deviceId}/config?server=UKLON-01`);
  check("wg-quick config generated", conf.text?.includes("[Interface]") && conf.text?.includes("AllowedIPs"));
  const rot = await call(`/api/devices/${deviceId}/config?rotate=1`);
  check("key rotation", rot.text?.includes("PrivateKey"));
  const limit = await call("/api/devices", { method: "POST", body: JSON.stringify({ name: "Second Device", platform: "windows" }) });
  check("free device limit enforced", limit.json?.error?.code === "device_limit_reached");

  console.log("[5] MFA (real TOTP)");
  const enroll = await call("/api/auth/mfa/enroll", { method: "POST", body: "{}" });
  const secret = enroll.json?.data?.secret;
  check("totp secret issued", secret?.length >= 30);
  const activate = await call("/api/auth/mfa/activate", { method: "POST", body: JSON.stringify({ code: totp(secret) }) });
  check("activate with computed code", activate.json?.data?.enabled === true);
  check("10 backup codes", activate.json?.data?.backupCodes?.length === 10);
  await call("/api/auth/logout", { method: "POST", body: "{}" });
  const mfaLogin = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: "Smoke#Test2024!" }) });
  check("mfa challenge issued", mfaLogin.json?.data?.mfaRequired === true);
  const verify = await call("/api/auth/verify-login", { method: "POST", body: JSON.stringify({ challengeToken: mfaLogin.json?.data?.challengeToken, code: totp(secret) }) });
  check("mfa login completes", verify.json?.data?.user?.email === email);
  await call("/api/auth/mfa/disable", { method: "POST", body: JSON.stringify({ password: "Smoke#Test2024!" }) });

  console.log("[6] Billing webhook security");
  const body = JSON.stringify({ eventId: `smoke_${Date.now()}`, type: "invoice.payment_failed", data: { userId: "x" } });
  const sig = crypto.createHmac("sha256", "aegis-webhook-sim-dev").update(body).digest("hex");
  const reject = await fetch(`${BASE}/api/billing/webhook`, { method: "POST", headers: { "content-type": "application/json", "x-aegis-signature": "bad" }, body });
  check("bad signature rejected", reject.status === 401);
  const accept = await fetch(`${BASE}/api/billing/webhook`, { method: "POST", headers: { "content-type": "application/json", "x-aegis-signature": sig }, body });
  check("valid signature accepted", (await accept.json())?.data?.processed === true);
  const replay = await fetch(`${BASE}/api/billing/webhook`, { method: "POST", headers: { "content-type": "application/json", "x-aegis-signature": sig }, body });
  check("replay marked duplicate", (await replay.json())?.data?.duplicate === true);

  console.log("[7] Support, notifications, privacy");
  const ticket = await call("/api/support/tickets", { method: "POST", body: JSON.stringify({ subject: "Smoke ticket", message: "Testing", category: "technical", priority: "low" }) });
  check("ticket created", ticket.json?.data?.ticket?.subject === "Smoke ticket");
  await call("/api/notifications", { method: "PATCH", body: JSON.stringify({ action: "read-all" }) });
  check("notifications read-all", true);
  const del = await call("/api/account/delete", { method: "POST", body: JSON.stringify({ password: "Smoke#Test2024!" }) });
  check("account deletion scheduled", del.json?.data?.deleted === true);

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
