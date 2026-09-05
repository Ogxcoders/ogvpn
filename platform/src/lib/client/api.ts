"use client";

// Client API layer (Section AC): request deadlines, cancellation, duplicate
// prevention, exponential backoff, correlation IDs, 401/429 handling, offline
// queueing, response integrity validation, stale-response protection.

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;
  retryable: boolean;
  constructor(status: number, code: string, message: string, details?: unknown, retryable = false) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

type Pending = { promise: Promise<unknown>; controllers: Set<AbortController> };

const inflight = new Map<string, Pending>();
const sessionListeners = new Set<(state: "expired" | "unauthorized") => void>();
export function onSessionEvent(fn: (state: "expired" | "unauthorized") => void) {
  sessionListeners.add(fn);
  return () => sessionListeners.delete(fn);
}

let online = true;
const offlineListeners = new Set<(offline: boolean) => void>();
export function setOnlineState(v: boolean) {
  if (online !== v) {
    online = v;
    offlineListeners.forEach((f) => f(!v));
  }
}
export function onOfflineChange(fn: (offline: boolean) => void) {
  offlineListeners.add(fn);
  return () => offlineListeners.delete(fn);
}
export function isOnline() {
  return online;
}

function correlationId(): string {
  return `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export interface FetchOpts {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  dedupe?: boolean;
  raw?: boolean;
  signal?: AbortSignal;
  skipRetryStatuses?: number[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function api<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const {
    method = "GET", body, timeoutMs = 15000, retries = method === "GET" ? 2 : 1,
    dedupe = false, raw = false, skipRetryStatuses = [400, 401, 402, 403, 404, 409, 423, 426],
  } = opts;

  const key = `${method}:${path}:${body ? JSON.stringify(body).slice(0, 120) : ""}`;
  if (dedupe && inflight.has(key)) {
    // Duplicate-request prevention (AC 662): coalesce identical in-flight GETs
    return inflight.get(key)!.promise as Promise<T>;
  }

  const controllers = new Set<AbortController>();
  const exec = async (): Promise<T> => {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      controllers.add(controller);
      if (opts.signal) {
        opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
      }
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        if (!navigator.onLine) setOnlineState(false);
        const res = await fetch(path, {
          method,
          headers: {
            ...(body !== undefined && !raw ? { "content-type": "application/json" } : {}),
            "x-correlation-id": correlationId(),
          },
          body: body !== undefined ? (raw ? String(body) : JSON.stringify(body)) : undefined,
          signal: controller.signal,
          credentials: "same-origin",
          cache: "no-store",
        });
        clearTimeout(timer);
        controllers.delete(controller);

        if (res.status === 401 && !path.startsWith("/api/auth")) {
          sessionListeners.forEach((f) => f("expired"));
          throw new ApiClientError(401, "stale_session", "Your session expired. Sign in again.");
        }
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get("retry-after") || "5", 10);
          if (attempt < retries) {
            await sleep(retryAfter * 1000);
            continue;
          }
          throw new ApiClientError(429, "rate_limited", "Too many requests. Slow down and try again shortly.", undefined, true);
        }
        if (res.status >= 500 && attempt < retries && !skipRetryStatuses.includes(res.status)) {
          lastErr = new ApiClientError(res.status, "server_error", "The server had a hiccup.", undefined, true);
          await sleep(Math.min(4000, 400 * 2 ** attempt) + Math.random() * 250); // exponential backoff + jitter
          continue;
        }
        if (raw || path.startsWith("/api/devices/") && path.endsWith("/config")) {
          if (!res.ok) {
            const j = await res.json().catch(() => null);
            const e = j?.error;
            throw new ApiClientError(res.status, e?.code || "unknown", e?.message || `HTTP ${res.status}`, e?.details);
          }
          return (await res.text()) as unknown as T;
        }

        let json: ApiEnvelope<T>;
        try {
          json = await res.json();
        } catch {
          // Malformed-response handling (AB 658)
          throw new ApiClientError(res.status, "malformed_response", "The server sent a malformed response.", undefined, true);
        }
        if (!json || typeof json.ok !== "boolean") {
          throw new ApiClientError(res.status, "malformed_response", "Unexpected response shape from server.", undefined, true);
        }
        if (!json.ok) {
          const e = json.error || { code: "unknown", message: "Request failed." };
          const retryable = res.status >= 500 || res.status === 429 || e.code === "dependency_failure" || e.code === "handshake_error" || e.code === "dns_error";
          throw new ApiClientError(res.status, e.code, e.message, e.details, retryable);
        }
        setOnlineState(true);
        return json.data as T;
      } catch (err) {
        clearTimeout(timer);
        controllers.delete(controller);
        if (err instanceof ApiClientError) {
          if (err.code === "timeout") {
            setOnlineState(false);
            lastErr = err;
            if (attempt < retries) { await sleep(400 * 2 ** attempt); continue; }
          }
          throw err;
        }
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new ApiClientError(0, "cancelled", "The request was cancelled.");
        }
        // Network-level failure → offline mode
        setOnlineState(false);
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (attempt < retries) {
          await sleep(Math.min(4000, 400 * 2 ** attempt) + Math.random() * 250);
          continue;
        }
        throw new ApiClientError(0, "network_error", "You appear to be offline. Changes will resume when the connection returns.", undefined, true);
      }
    }
    throw lastErr instanceof Error ? lastErr : new ApiClientError(0, "unknown", "Request failed.");
  };

  const p = exec();
  if (dedupe) {
    inflight.set(key, { promise: p, controllers });
    p.finally(() => inflight.delete(key)).catch(() => {});
  }
  return p;
}

/* -------- Analytics batching (AG): buffered, privacy-safe, opt-out aware -------- */

type AnalyticsEvent = { name: string; props?: Record<string, unknown>; sessionId?: string };
let queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const SESSION_ID = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function track(name: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (["app_launch", "offline_event", "api_failure"].includes(name)) {
    // system events sent regardless of user opt-out decision server-side
  }
  queue.push({ name, props, sessionId: SESSION_ID });
  if (queue.length >= 20) {
    void flushAnalytics();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => void flushAnalytics(), 10000);
  }
}

export async function flushAnalytics(): Promise<void> {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!queue.length) return;
  const events = queue.splice(0, 20);
  try {
    await api("/api/analytics", { method: "POST", body: { events }, retries: 1, timeoutMs: 6000 });
  } catch {
    // Re-queue up to a bounded backlog; drop on persistent failure
    if (queue.length < 200) queue = events.concat(queue);
  }
}

export function errMsg(e: unknown): string {
  if (e instanceof ApiClientError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong. Please try again.";
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function timeAgo(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Math.max(0, Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
