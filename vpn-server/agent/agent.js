#!/usr/bin/env node
/**
 * AegisVPN server agent.
 *
 * Zero-dependency Node (>= 18) ESM daemon that runs on every VPN server:
 *   - registers the server with the AegisVPN backend control plane once,
 *   - heartbeats live stats (cpu/ram/disk, tunnel count, WireGuard transfer
 *     deltas, per-peer session info) on a fixed interval,
 *   - pulls pending control-plane ops (add_peer / remove_peer) returned by
 *     each heartbeat and applies them locally via `wg set`, then acks each
 *     op back to the backend,
 *   - survives network problems with exponential backoff (5 s doubling to a
 *     120 s ceiling) and never crashes on unexpected runtime errors.
 *
 * Security model:
 *   - Every op payload crossing the trust boundary is validated with strict
 *     regexes (see lib.js) BEFORE any process is spawned.
 *   - External commands run through child_process.execFile with argv arrays
 *     only — no shell, no string concatenation into a command line.
 *   - The agent token lives in the systemd EnvironmentFile and is never
 *     logged; redact() scrubs it from anything that reaches stdout.
 *
 * Configuration comes exclusively from the environment (see
 * /etc/aegisvpn/agent.env + the systemd unit); all variables are documented
 * in vpn-server/README.md.
 */

import { execFile } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import { promisify } from "node:util";

import {
  IFACE_RE,
  computeCpuPct,
  computeRamPct,
  isValidWgKey,
  opToCommand,
  parseProcStat,
  parseWgDump,
} from "./lib.js";

const execFileP = promisify(execFile);

// Maximum peers reported per heartbeat — matches the backend zod limit.
const MAX_PEERS_PER_HEARTBEAT = 10_000;
// Cap for a single exec'd command (wg is instant; anything longer is stuck).
const EXEC_TIMEOUT_MS = 10_000;
const HTTP_TIMEOUT_MS = 15_000;
// Backoff for failed heartbeats: 5 s doubling to a 120 s ceiling.
const BACKOFF_START_SEC = 5;
const BACKOFF_MAX_SEC = 120;

// ---------------------------------------------------------------------------
// Configuration (env only; set via /etc/aegisvpn/agent.env under systemd)
// ---------------------------------------------------------------------------

function intOr(value, fallback) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(value, min, max, fallback) {
  const n = intOr(value, fallback);
  return Math.min(max, Math.max(min, n));
}

const CFG = {
  backendUrl: (process.env.AEGIS_BACKEND_URL || "").trim().replace(/\/+$/, ""),
  agentToken: process.env.AEGIS_AGENT_TOKEN || "",
  wgInterface: process.env.WG_INTERFACE || "wg0",
  pollIntervalSec: clampInt(process.env.POLL_INTERVAL_SEC, 5, 3600, 30),
  serverIdHint: process.env.AEGIS_SERVER_ID || "",
  serverName: (process.env.AEGIS_SERVER_NAME || "").trim() || os.hostname(),
  serverCode: (process.env.AEGIS_SERVER_CODE || "").trim(),
  serverCountry: (process.env.AEGIS_SERVER_COUNTRY || "").trim() || "Unknown",
  serverCity: (process.env.AEGIS_SERVER_CITY || "").trim() || "Unknown",
  serverHost: (process.env.AEGIS_SERVER_HOST || "").trim() || os.hostname(),
  serverPort: intOr(process.env.AEGIS_SERVER_PORT, intOr(process.env.AEGIS_PORT, 51820)),
  serverCapacity: clampInt(process.env.AEGIS_SERVER_CAPACITY, 1, 65534, 250),
  serverPublicKey: (process.env.AEGIS_SERVER_PUBLIC_KEY || "").trim(),
  publicKeyFile: process.env.AEGIS_SERVER_PUBLIC_KEY_FILE || "/etc/wireguard/server.pub",
  ipv4Prefix: process.env.AEGIS_IPV4_PREFIX || "10.66.66.0/24",
  ipv6Prefix: process.env.AEGIS_IPV6_PREFIX || "fd42:4242::/64",
  dns: process.env.AEGIS_DNS || "1.1.1.1,1.0.0.1",
};

// ---------------------------------------------------------------------------
// Structured JSON-line logging with token redaction
// ---------------------------------------------------------------------------

const REDACT_RE = /(Bearer\s+)\S+|(agt_[A-Za-z0-9_-]+)/g;

function redact(text) {
  return String(text).replace(REDACT_RE, (_m, bearer, agt) =>
    bearer ? `${bearer}***` : "***",
  );
}

function log(level, msg, fields = {}) {
  let line;
  try {
    line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields });
  } catch {
    line = JSON.stringify({ ts: new Date().toISOString(), level, msg: "unloggable record" });
  }
  process.stdout.write(redact(line) + "\n");
}

// ---------------------------------------------------------------------------
// Backend HTTP client (node:http / node:https, JSON, Bearer agent token)
// ---------------------------------------------------------------------------

function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(CFG.backendUrl + path);
    const transport = url.protocol === "https:" ? https : http;
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body), "utf8");
    const headers = {
      Authorization: `Bearer ${CFG.agentToken}`,
      "Content-Type": "application/json",
    };
    if (payload) headers["Content-Length"] = payload.length;

    const req = transport.request(
      {
        method,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        headers,
        timeout: HTTP_TIMEOUT_MS,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch {
            // Non-JSON body: keep raw text for diagnostics.
          }
          resolve({ status: res.statusCode ?? 0, json, text });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("request timed out")));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// WireGuard + system stats collection
// ---------------------------------------------------------------------------

async function wg(args) {
  const { stdout } = await execFileP("wg", args, { timeout: EXEC_TIMEOUT_MS });
  return stdout;
}

/** Reads the server public key file — the runtime equivalent of `cat /etc/wireguard/server.pub`. */
function readServerPublicKey() {
  if (CFG.serverPublicKey) return CFG.serverPublicKey;
  try {
    return fs.readFileSync(CFG.publicKeyFile, "utf8").trim();
  } catch {
    return "";
  }
}

function readProcStat() {
  return parseProcStat(fs.readFileSync("/proc/stat", "utf8"));
}

async function diskUsagePct() {
  // Node >= 18.15 exposes fs.statfsSync; older 18.x falls back to `df -kP`.
  if (typeof fs.statfsSync === "function") {
    const s = fs.statfsSync("/");
    if (s.blocks > 0) {
      const pct = ((s.blocks - s.bavail) / s.blocks) * 100;
      return Math.min(100, Math.max(0, pct));
    }
    return 0;
  }
  const { stdout } = await execFileP("df", ["-k", "-P", "/"], { timeout: EXEC_TIMEOUT_MS });
  const cols = stdout.trim().split("\n").pop().split(/\s+/);
  const total = Number.parseInt(cols[1], 10);
  const used = Number.parseInt(cols[2], 10);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(used)) return 0;
  return Math.min(100, Math.max(0, (used / total) * 100));
}

async function wgPeerCount() {
  try {
    const out = await wg(["show", CFG.wgInterface, "peers"]);
    return out.split("\n").filter((l) => l.trim() !== "").length;
  } catch {
    return 0; // interface down / wg missing → zero tunnels is the truthful reading
  }
}

function transferTotals(text) {
  let rx = 0;
  let tx = 0;
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const f = line.split("\t");
    rx += Number.parseInt(f[1], 10) || 0;
    tx += Number.parseInt(f[2], 10) || 0;
  }
  return { rx, tx };
}

/** Sums per-peer transfer counters so the caller can diff between polls. */
async function wgTransferTotals() {
  try {
    return transferTotals(await wg(["show", CFG.wgInterface, "transfer"]));
  } catch {
    return { rx: 0, tx: 0 };
  }
}

async function collectPeers() {
  try {
    const dump = await wg(["show", CFG.wgInterface, "dump"]);
    return parseWgDump(dump).slice(0, MAX_PEERS_PER_HEARTBEAT);
  } catch (e) {
    log("warn", "failed to read WireGuard dump", { error: String(e.message) });
    return [];
  }
}

let prevCpu = null; // sampled at startup so the first heartbeat has a real delta window
let prevTransfer = { rx: 0, tx: 0 };

const round2 = (n) => Math.round(n * 100) / 100;

async function collectStats() {
  let cpuPct = 0;
  try {
    const nextCpu = readProcStat();
    if (prevCpu) cpuPct = round2(computeCpuPct(prevCpu, nextCpu));
    prevCpu = nextCpu;
  } catch (e) {
    log("warn", "failed to sample /proc/stat", { error: String(e.message) });
  }

  let ramPct = 0;
  try {
    ramPct = round2(computeRamPct(fs.readFileSync("/proc/meminfo", "utf8")));
  } catch (e) {
    log("warn", "failed to sample /proc/meminfo", { error: String(e.message) });
  }

  let diskPct = 0;
  try {
    diskPct = round2(await diskUsagePct());
  } catch (e) {
    log("warn", "failed to sample disk usage", { error: String(e.message) });
  }

  const transfer = await wgTransferTotals();
  const bandwidthIn = Math.max(0, transfer.rx - prevTransfer.rx);
  const bandwidthOut = Math.max(0, transfer.tx - prevTransfer.tx);
  prevTransfer = transfer;

  return {
    cpuPct,
    ramPct,
    diskPct,
    tunnelCount: await wgPeerCount(),
    bandwidthIn,
    bandwidthOut,
    uptimeSec: Math.max(0, Math.floor(os.uptime())),
    wgInterface: CFG.wgInterface,
    peers: await collectPeers(),
  };
}

// ---------------------------------------------------------------------------
// Registration + control-plane ops
// ---------------------------------------------------------------------------

async function registerOnce() {
  if (!CFG.serverCode) {
    log("warn", "AEGIS_SERVER_CODE not set — skipping registration (heartbeats continue; set the code and restart to register)");
    return;
  }
  const publicKey = readServerPublicKey();
  if (!isValidWgKey(publicKey)) {
    log("warn", "server public key missing or invalid — skipping registration", {
      publicKeyFile: CFG.publicKeyFile,
    });
    return;
  }

  const body = {
    name: CFG.serverName,
    code: CFG.serverCode,
    country: CFG.serverCountry,
    city: CFG.serverCity,
    host: CFG.serverHost,
    port: CFG.serverPort,
    publicKey,
    capacity: CFG.serverCapacity,
    ipv4Prefix: CFG.ipv4Prefix,
    ipv6Prefix: CFG.ipv6Prefix,
    dns: CFG.dns,
    platform: "linux",
  };
  const res = await apiRequest("POST", "/agent/register", body);
  if (res.status === 201) {
    log("info", "registered with control plane", { serverId: res.json?.serverId ?? null });
  } else if (res.status === 403) {
    log("error", "registration forbidden — server not pre-provisioned. Create the server row in the admin panel first, then restart this agent.");
  } else if (res.status === 401) {
    log("error", "registration unauthorized — AEGIS_AGENT_TOKEN rejected by backend");
  } else {
    log("error", "registration failed", { status: res.status, body: redact(res.text.slice(0, 300)) });
  }
}

async function ackOp(opId, success, error) {
  const body = success ? { success } : { success, error: String(error).slice(0, 500) };
  const res = await apiRequest("POST", `/agent/ops/${encodeURIComponent(opId)}/ack`, body);
  if (res.status !== 204) {
    log("warn", "op ack rejected by backend", { opId, status: res.status });
  }
}

async function applyOp(op) {
  // opToCommand validates type/payload/interface and returns an argv array —
  // execFile never sees a shell and never sees unvalidated data.
  const { file, args } = opToCommand(op.type, op.payload, CFG.wgInterface);
  await execFileP(file, args, { timeout: EXEC_TIMEOUT_MS });
}

async function handleOps(ops) {
  if (!Array.isArray(ops) || ops.length === 0) return;
  for (const op of ops) {
    const opId = typeof op?.id === "string" ? op.id : "?";
    try {
      await applyOp(op);
      log("info", "op applied", { opId, type: op.type });
      await ackOp(opId, true);
    } catch (e) {
      log("error", "op failed", { opId, type: op?.type ?? "?", error: String(e.message) });
      await ackOp(opId, false, redact(String(e.message)));
    }
  }
}

// ---------------------------------------------------------------------------
// Main loop (heartbeat → apply ops → ack; backoff on any failure)
// ---------------------------------------------------------------------------

let shuttingDown = false;
let wakeEarly = null;

function sleep(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    wakeEarly = () => {
      clearTimeout(timer);
      resolve();
    };
  });
}

function validateConfig() {
  const problems = [];
  try {
    const url = new URL(CFG.backendUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      problems.push("AEGIS_BACKEND_URL must use http:// or https://");
    }
  } catch {
    problems.push("AEGIS_BACKEND_URL is missing or not a valid URL");
  }
  if (!CFG.agentToken) problems.push("AEGIS_AGENT_TOKEN is missing");
  if (!IFACE_RE.test(CFG.wgInterface)) {
    problems.push(`WG_INTERFACE failed validation: ${CFG.wgInterface}`);
  }
  if (problems.length > 0) {
    for (const p of problems) log("error", `config error: ${p}`);
    log("error", "fix /etc/aegisvpn/agent.env and restart the agent");
    process.exit(78); // EX_CONFIG
  }
}

async function heartbeatTick() {
  const stats = await collectStats();
  const res = await apiRequest("POST", "/agent/heartbeat", {
    cpuPct: stats.cpuPct,
    ramPct: stats.ramPct,
    diskPct: stats.diskPct,
    tunnelCount: stats.tunnelCount,
    bandwidthIn: stats.bandwidthIn,
    bandwidthOut: stats.bandwidthOut,
    uptimeSec: stats.uptimeSec,
    wgInterface: stats.wgInterface,
    peers: stats.peers,
  });

  if (res.status === 200) {
    await handleOps(res.json?.ops ?? []);
    return true;
  }
  if (res.status === 401) {
    log("error", "heartbeat unauthorized — backend rejected the agent token");
  } else {
    log("error", "heartbeat failed", { status: res.status, body: redact(res.text.slice(0, 200)) });
  }
  return false;
}

async function main() {
  validateConfig();
  let backendHost = "unknown";
  try {
    backendHost = new URL(CFG.backendUrl).host;
  } catch {
    // validateConfig already rejected bad URLs; unreachable in practice.
  }
  log("info", "agent starting", {
    wgInterface: CFG.wgInterface,
    pollIntervalSec: CFG.pollIntervalSec,
    backendHost,
    serverIdHint: CFG.serverIdHint || null,
    pid: process.pid,
  });

  try {
    await registerOnce();
  } catch (e) {
    log("error", "registration error (continuing to heartbeat)", { error: String(e.message) });
  }

  let backoffSec = BACKOFF_START_SEC;
  while (!shuttingDown) {
    let ok = false;
    try {
      ok = await heartbeatTick();
    } catch (e) {
      log("error", "heartbeat error (will retry)", { error: redact(String(e.message)) });
    }
    const delaySec = ok ? CFG.pollIntervalSec : backoffSec;
    if (ok) {
      backoffSec = BACKOFF_START_SEC;
    } else {
      backoffSec = Math.min(BACKOFF_MAX_SEC, backoffSec * 2);
    }
    await sleep(delaySec * 1000);
  }
  log("info", "agent stopped");
  process.exit(0);
}

// Never crash: log unexpected async/sync failures and keep serving.
process.on("uncaughtException", (e) => {
  log("error", "uncaughtException (continuing)", { error: redact(String(e?.stack || e)) });
});
process.on("unhandledRejection", (e) => {
  log("error", "unhandledRejection (continuing)", { error: redact(String(e?.stack || e)) });
});
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    log("info", `${signal} received — shutting down gracefully`);
    shuttingDown = true;
    if (wakeEarly) wakeEarly();
  });
}

main().catch((e) => {
  log("error", "fatal startup error", { error: redact(String(e?.stack || e)) });
  process.exit(1);
});
