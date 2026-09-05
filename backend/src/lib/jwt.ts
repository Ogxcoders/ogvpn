import crypto from "node:crypto";
import type { Config } from "../config.js";
import { ApiError } from "./errors.js";

export interface AccessClaims {
  sub: string; // user id
  did: string; // device id
  role: "user" | "admin";
  typ: "access";
}

const HEADER = { alg: "HS256", typ: "JWT" } as const;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Minimal HS256 JWT implementation — auditable, zero transitive deps. */
export function signAccessToken(
  cfg: Config,
  claims: Omit<AccessClaims, "typ">,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ...claims,
    typ: "access" as const,
    iss: cfg.jwtIssuer,
    iat: now,
    exp: now + cfg.accessTokenTtlSec,
    jti: crypto.randomUUID(),
  };
  const head = b64url(JSON.stringify(HEADER));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", cfg.jwtSecret)
    .update(`${head}.${body}`)
    .digest("base64url");
  return `${head}.${body}.${sig}`;
}

export function verifyAccessToken(cfg: Config, token: string): AccessClaims {
  const parts = token.split(".");
  if (parts.length !== 3) throw ApiError.unauthorized("Malformed token");
  const [head, body, sig] = parts;
  const expected = crypto
    .createHmac("sha256", cfg.jwtSecret)
    .update(`${head}.${body}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw ApiError.unauthorized("Invalid token signature");
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw ApiError.unauthorized("Malformed token payload");
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.typ !== "access") throw ApiError.unauthorized("Wrong token type");
  if (payload.iss !== cfg.jwtIssuer)
    throw ApiError.unauthorized("Invalid token issuer");
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    throw ApiError.unauthorized("Token expired");
  }
  if (
    typeof payload.sub !== "string" ||
    typeof payload.did !== "string" ||
    (payload.role !== "user" && payload.role !== "admin")
  ) {
    throw ApiError.unauthorized("Invalid token claims");
  }
  return {
    sub: payload.sub,
    did: payload.did,
    role: payload.role,
    typ: "access",
  };
}

/** Opaque refresh token: 256 bits of entropy, only its SHA-256 is stored. */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
