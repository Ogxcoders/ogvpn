// API contract: unified envelope, error codes (Section AS), route wrapper with
// correlation IDs, deadlines, structured request logging, metrics integration.

export type ApiErrorCode =
  | "invalid_input" | "authentication_required" | "invalid_credentials" | "mfa_required"
  | "mfa_invalid" | "forbidden" | "permission_denied" | "not_found" | "conflict"
  | "rate_limited" | "account_locked" | "account_suspended" | "email_unverified"
  | "device_limit_reached" | "device_revoked" | "subscription_required" | "bandwidth_exceeded"
  | "server_unavailable" | "server_at_capacity" | "server_maintenance" | "unsupported_location"
  | "timeout" | "network_error" | "dns_error" | "handshake_error" | "config_error"
  | "payment_failed" | "update_required" | "maintenance_mode" | "stale_session"
  | "partial_completion" | "dependency_failure" | "unknown";

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  details?: unknown;
  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// BigInt-safe JSON conversion (byte counters exceed nothing else; safe in Number range)
export function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? Number(v) : v))
  );
}

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data: jsonSafe(data) }, init);
}

export function fail(status: number, code: ApiErrorCode, message: string, details?: unknown): Response {
  return Response.json({ ok: false, error: { code, message, details } }, { status });
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") || "unknown";
}

export function newCorrelationId(): string {
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

// Route wrapper: enforces request deadline, catches errors into the unified
// envelope, records metrics, and attaches a correlation id to every response.
export function route(handler: Handler, opts: { name: string; timeoutMs?: number } = { name: "api" }) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }): Promise<Response> => {
    const cid = req.headers.get("x-correlation-id") || newCorrelationId();
    const start = Date.now();
    const timeoutMs = opts.timeoutMs ?? 15000;
    try {
      const result = await Promise.race([
        handler(req, ctx),
        new Promise<Response>((_, rej) =>
          setTimeout(() => rej(new ApiError(504, "timeout", "The request took too long and was aborted.")), timeoutMs)
        ),
      ]);
      const res = new Response(result.body, result);
      res.headers.set("x-correlation-id", cid);
      res.headers.set("x-content-type-options", "nosniff");
      res.headers.set("referrer-policy", "no-referrer");
      recordApiMetric(opts.name, result.status, Date.now() - start);
      return res;
    } catch (e) {
      if (e instanceof ApiError) {
        recordApiMetric(opts.name, e.status, Date.now() - start);
        const res = fail(e.status, e.code, e.message, e.details);
        res.headers.set("x-correlation-id", cid);
        return res;
      }
      console.error(JSON.stringify({
        level: "error", service: "api", route: opts.name, correlationId: cid,
        message: e instanceof Error ? e.message : String(e), ts: new Date().toISOString(),
      }));
      recordApiMetric(opts.name, 500, Date.now() - start);
      const res = fail(500, "unknown", "An unexpected error occurred. Please try again.");
      res.headers.set("x-correlation-id", cid);
      return res;
    }
  };
}

/* ---------------- Metrics (Section AH) ---------------- */

type Counter = { count: number; errors: number; latencySum: number; latencyMax: number };
const apiCounters = new Map<string, Counter>();
const gauges = new Map<string, number>();

function recordApiMetric(name: string, status: number, latencyMs: number) {
  let c = apiCounters.get(name);
  if (!c) { c = { count: 0, errors: 0, latencySum: 0, latencyMax: 0 }; apiCounters.set(name, c); }
  c.count += 1;
  if (status >= 400) c.errors += 1;
  c.latencySum += latencyMs;
  c.latencyMax = Math.max(c.latencyMax, latencyMs);
}

export function metricCounter(name: string, delta = 1) {
  gauges.set(name, (gauges.get(name) ?? 0) + delta);
}

export function metricGauge(name: string, value: number) {
  gauges.set(name, value);
}

export function metricsSnapshot() {
  const apis: Record<string, Counter & { avgLatencyMs: number }> = {};
  for (const [k, v] of apiCounters) {
    apis[k] = { ...v, avgLatencyMs: v.count ? Math.round(v.latencySum / v.count) : 0 };
  }
  return { apis: Object.fromEntries(Object.entries(apis).slice(-120)), gauges: Object.fromEntries(gauges) };
}

/* ---------------- In-memory rate limiter (sliding window) ---------------- */

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  let arr = buckets.get(key);
  if (!arr) { arr = []; buckets.set(key, arr); }
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  if (arr.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((arr[0] + windowMs - now) / 1000));
    return { allowed: false, retryAfterSec };
  }
  arr.push(now);
  // opportunistic GC
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.length || now - v[v.length - 1] > 3600_000) buckets.delete(k);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function rateLimitResponse(retryAfterSec: number): Response {
  const res = fail(429, "rate_limited", `Too many requests. Retry in ${retryAfterSec}s.`);
  res.headers.set("retry-after", String(retryAfterSec));
  return res;
}

/* ---------------- Validation helpers ---------------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validatePassword(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters long.";
  if (pw.length > 128) return "Password must be at most 128 characters long.";
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter.";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter.";
  if (!/\d/.test(pw)) return "Password must contain a digit.";
  return null;
}

export function sanitizeText(input: unknown, maxLen = 200): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, maxLen);
}

export function isValidUrl(u: string): boolean {
  try { const url = new URL(u); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
    return {};
  } catch {
    throw new ApiError(400, "invalid_input", "Request body must be valid JSON.");
  }
}

export async function readJsonSafe(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}

export function requireString(body: Record<string, unknown>, field: string, maxLen = 200): string {
  const v = body[field];
  if (typeof v !== "string" || !v.trim()) {
    throw new ApiError(400, "invalid_input", `Field "${field}" is required.`);
  }
  return sanitizeText(v, maxLen);
}

export function requireEmail(body: Record<string, unknown>): string {
  const email = requireString(body, "email", 254).toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new ApiError(400, "invalid_input", "Please provide a valid email address.");
  }
  return email;
}
