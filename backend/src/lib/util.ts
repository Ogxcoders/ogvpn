import type { DB } from "../db.js";
import { queryOne, run } from "../db.js";
import crypto from "node:crypto";

export interface RateLimitStore {
  hit(key: string): { allowed: boolean; retryAfterSec: number };
}

/** Fixed-window in-memory rate limiter. Single-process; a production
 *  multi-instance deployment swaps this for a shared store (Redis). */
export class MemoryRateLimiter implements RateLimitStore {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  constructor(
    private windowSec: number,
    private max: number,
  ) {}

  hit(key: string): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + this.windowSec * 1000,
      });
      return { allowed: true, retryAfterSec: 0 };
    }
    bucket.count += 1;
    if (bucket.count > this.max) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
      };
    }
    return { allowed: true, retryAfterSec: 0 };
  }

  /** Periodic cleanup to bound memory. */
  sweep(): void {
    const now = Date.now();
    for (const [k, v] of this.buckets) if (v.resetAt <= now) this.buckets.delete(k);
  }
}

/** 24h idempotency replay window for mutating client calls. */
export function checkIdempotency(
  db: DB,
  userId: string,
  endpoint: string,
  key: string | undefined,
): { replay: boolean; body?: unknown } | null {
  if (!key) return null;
  const row = queryOne<{ body: string; status: number }>(
    db,
    "SELECT body, status FROM idempotency_keys WHERE key = ? AND user_id = ? AND endpoint = ? AND created_at > ?",
    key,
    userId,
    endpoint,
    new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  );
  if (row) return { replay: true, body: JSON.parse(row.body) };
  return null;
}

export function storeIdempotentResponse(
  db: DB,
  userId: string,
  endpoint: string,
  key: string | undefined,
  status: number,
  body: unknown,
): void {
  if (!key) return;
  run(
    db,
    "INSERT OR IGNORE INTO idempotency_keys (key, user_id, endpoint, status, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    key,
    userId,
    endpoint,
    status,
    JSON.stringify(body),
    new Date().toISOString(),
  );
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
