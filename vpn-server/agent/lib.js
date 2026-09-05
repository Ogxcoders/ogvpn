/**
 * AegisVPN server agent — pure logic helpers.
 *
 * Zero dependencies, side-effect free, importable from both the runtime
 * (agent.js) and the unit-test suite (agent.test.ts). Everything that must
 * be trusted before a process is spawned lives here so it can be tested:
 *
 *   - parseWgDump(text, now)      → peer stats parsed from `wg show <if> dump`
 *   - buildAllowedIps(v4, v6)     → "a.b.c.d/32[,x::y/128]" value for wg set
 *   - isValidWgKey(v)             → strict WireGuard base64 key check
 *   - isValidIpv4(v) / isValidIpv6(v)
 *   - computeCpuPct(prev, next)   → busy % from two /proc/stat samples
 *   - computeRamPct(meminfo)      → used % from raw /proc/meminfo text
 *   - opToCommand(type, payload)  → {file, args} argv for execFile (throws
 *                                   on ANY value that fails validation)
 *   - parseProcStat(text)         → {idle, total} sample from /proc/stat
 *
 * Security note: op payloads arrive from the control plane (over the
 * network). They are never passed to a shell — the command builder emits an
 * argv array for child_process.execFile and throws on values that do not
 * match strict validators, so an injected string like "x; rm -rf /" can
 * never reach exec.
 */

/** Strict WireGuard public key: 44-char base64 of a 32-byte Curve25519 point. */
export const WG_KEY_RE = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/;

/** Linux interface names: max 15 chars, no whitespace/slashes. */
export const IFACE_RE = /^[A-Za-z0-9._-]{1,15}$/;

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const HEX_GROUP_RE = /^[0-9A-Fa-f]{1,4}$/;

export function isValidWgKey(value) {
  return typeof value === "string" && WG_KEY_RE.test(value);
}

export function isValidIpv4(value) {
  return typeof value === "string" && IPV4_RE.test(value);
}

/**
 * Validates an IPv6 address (plain or with one "::" compression, optionally
 * with an embedded IPv4 tail like "::ffff:192.0.2.1"). Rejects zone ids
 * ("fe80::1%eth0") — they are never valid in WireGuard allowed-ips.
 */
export function isValidIpv6(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 45) {
    return false;
  }
  if (value.includes("%")) return false; // zone identifier, not an address

  const doubleColons = value.split("::");
  if (doubleColons.length > 2) return false; // at most one "::"
  const compressed = doubleColons.length === 2;
  const head = doubleColons[0];
  const tail = compressed ? doubleColons[1] : null;

  const headGroups = head === "" ? [] : head.split(":");
  const tailGroups = tail === null || tail === "" ? [] : tail.split(":");
  const groups = [...headGroups, ...tailGroups];

  let count = 0;
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g.includes(".")) {
      // Embedded IPv4 must be the final component and counts as 2 groups.
      if (i !== groups.length - 1 || !isValidIpv4(g)) return false;
      count += 2;
    } else {
      if (!HEX_GROUP_RE.test(g)) return false;
      count += 1;
    }
  }

  if (compressed) return count <= 7; // "::" must stand for at least one zero group
  return count === 8;
}

/**
 * Parses `wg show <iface> dump` output into peer stats.
 * Line 0 is the interface line; peer lines are tab-separated with 8 fields:
 * public-key, preshared-key, endpoint, allowed-ips, latest-handshake (unix
 * seconds), rx bytes, tx bytes, persistent-keepalive. Peers that never
 * handshaked (handshake epoch 0) are skipped — they carry no session state.
 *
 * @param {string} text raw dump output
 * @param {number} [now] epoch milliseconds (defaults to Date.now())
 * @returns {Array<{publicKey: string, bytesIn: number, bytesOut: number, handshakeAgoSec: number}>}
 */
export function parseWgDump(text, now = Date.now()) {
  if (typeof text !== "string") return [];
  const lines = text.split("\n");
  const peers = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const f = line.split("\t");
    if (f.length < 7) continue;

    const publicKey = (f[0] || "").trim();
    if (!isValidWgKey(publicKey)) continue;

    const handshake = Number.parseInt(f[4], 10);
    if (!Number.isFinite(handshake) || handshake <= 0) continue; // never handshaked

    const rx = Number.parseInt(f[5], 10);
    const tx = Number.parseInt(f[6], 10);
    const handshakeAgoSec = Math.max(0, Math.floor(now / 1000 - handshake));
    peers.push({
      publicKey,
      bytesIn: Number.isFinite(rx) && rx > 0 ? rx : 0,
      bytesOut: Number.isFinite(tx) && tx > 0 ? tx : 0,
      handshakeAgoSec,
    });
  }
  return peers;
}

/**
 * Builds the allowed-ips value for `wg set <if> peer <key> allowed-ips <v>`.
 * Accepts bare addresses ("10.66.66.2") or host addresses that already carry
 * the exact host prefix ("10.66.66.2/32"); anything else throws.
 *
 * @returns {string} "a.b.c.d/32" or "a.b.c.d/32,xxxx::y/128" (v6 appended only
 *                   when a non-empty addressV6 is provided — dual-stack is optional)
 */
export function buildAllowedIps(addressV4, addressV6) {
  const v4 = splitHost(addressV4, "32", "IPv4");
  const parts = [`${v4}/32`];
  if (addressV6 !== undefined && addressV6 !== null && String(addressV6).trim() !== "") {
    const v6 = splitHost(addressV6, "128", "IPv6");
    parts.push(`${v6}/128`);
  }
  return parts.join(",");
}

/** Splits "addr/prefix" or "addr", validating both halves strictly. */
function splitHost(value, expectedPrefix, family) {
  const raw = String(value ?? "").trim();
  const slash = raw.indexOf("/");
  const addr = slash === -1 ? raw : raw.slice(0, slash);
  const prefix = slash === -1 ? expectedPrefix : raw.slice(slash + 1);
  const valid =
    family === "IPv4" ? isValidIpv4(addr) : isValidIpv6(addr);
  if (!valid) {
    throw new Error(`${family} address failed validation (refused: ${preview(raw)})`);
  }
  if (prefix !== expectedPrefix) {
    throw new Error(
      `${family} address must carry /${expectedPrefix}, got ${preview(raw)}`,
    );
  }
  return addr;
}

/** Bounded preview of untrusted values for error text — never executed. */
function preview(value) {
  const s = typeof value === "string" ? value : String(value);
  return s.length > 64 ? `${s.slice(0, 64)}…` : JSON.stringify(s);
}

/**
 * Turns a control-plane op into an exact argv array for execFile.
 * Throws on unknown op types, malformed payloads, or any value failing the
 * strict key/address/interface validators — the caller can never exec with
 * unvalidated data.
 *
 * @param {"add_peer"|"remove_peer"} type
 * @param {{publicKey: string, addressV4: string, addressV6?: string}} payload
 * @param {string} [wgInterface] defaults to "wg0"
 * @returns {{file: string, args: string[]}}
 */
export function opToCommand(type, payload, wgInterface = "wg0") {
  if (typeof wgInterface !== "string" || !IFACE_RE.test(wgInterface)) {
    throw new Error(`invalid WireGuard interface name (refused: ${preview(wgInterface)})`);
  }
  if (type !== "add_peer" && type !== "remove_peer") {
    throw new Error(`unsupported op type (refused: ${preview(type)})`);
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("op payload must be a JSON object");
  }

  const publicKey = typeof payload.publicKey === "string" ? payload.publicKey.trim() : "";
  if (!isValidWgKey(publicKey)) {
    throw new Error(`op payload publicKey is not a valid WireGuard key (refused: ${preview(publicKey)})`);
  }

  if (type === "remove_peer") {
    return { file: "wg", args: ["set", wgInterface, "peer", publicKey, "remove"] };
  }

  const addressV4 = typeof payload.addressV4 === "string" ? payload.addressV4.trim() : "";
  const addressV6 = typeof payload.addressV6 === "string" ? payload.addressV6.trim() : "";
  const allowedIps = buildAllowedIps(addressV4, addressV6);
  return {
    file: "wg",
    args: ["set", wgInterface, "peer", publicKey, "allowed-ips", allowedIps],
  };
}

/**
 * Parses the first "cpu" line of /proc/stat into {idle, total}.
 * idle = idle + iowait; total = sum of all jiffie counters.
 */
export function parseProcStat(text) {
  const line = String(text ?? "").split("\n", 1)[0] ?? "";
  if (!line.startsWith("cpu")) {
    throw new Error("unexpected /proc/stat layout (no cpu line)");
  }
  const fields = line.trim().split(/\s+/).slice(1).map(Number);
  const idle = (Number.isFinite(fields[3]) ? fields[3] : 0) +
    (Number.isFinite(fields[4]) ? fields[4] : 0);
  let total = 0;
  for (const v of fields) if (Number.isFinite(v) && v > 0) total += v;
  return { idle, total };
}

/**
 * Busy CPU percentage between two {idle, total} samples, clamped to 0..100.
 * Returns 0 when there is no measurable delta (e.g. identical samples).
 */
export function computeCpuPct(prevStat, nextStat) {
  if (!prevStat || !nextStat) return 0;
  const dTotal = (nextStat.total ?? 0) - (prevStat.total ?? 0);
  if (!Number.isFinite(dTotal) || dTotal <= 0) return 0;
  const dIdle = (nextStat.idle ?? 0) - (prevStat.idle ?? 0);
  const busyPct = ((dTotal - dIdle) / dTotal) * 100;
  return clampPct(Number.isFinite(busyPct) ? busyPct : 0);
}

/**
 * Used RAM percentage from raw /proc/meminfo text.
 * Prefers MemAvailable; falls back to MemFree on ancient kernels.
 * Throws when MemTotal is missing (text truncated / not meminfo).
 */
export function computeRamPct(meminfo) {
  const text = String(meminfo ?? "");
  const total = matchKb(text, /^MemTotal:\s+(\d+)\s*kB$/m);
  if (total === null) throw new Error("MemTotal not found in meminfo text");
  const available =
    matchKb(text, /^MemAvailable:\s+(\d+)\s*kB$/m) ??
    matchKb(text, /^MemFree:\s+(\d+)\s*kB$/m);
  if (available === null) throw new Error("MemAvailable/MemFree not found in meminfo text");
  if (available >= total) return 0;
  return clampPct(((total - available) / total) * 100);
}

function matchKb(text, re) {
  const m = text.match(re);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function clampPct(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}
