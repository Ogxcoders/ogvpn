import path from "node:path";
import { randomBytes } from "node:crypto";
import fs from "node:fs";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Config {
  env: "development" | "production" | "test";
  port: number;
  host: string;
  corsOrigin: string;
  databasePath: string;
  jwtSecret: string;
  jwtIssuer: string;
  accessTokenTtlSec: number;
  refreshTokenTtlDays: number;
  adminEmail?: string;
  adminPassword?: string;
  paymentsProvider: "none" | "stripe";
  rateWindowSec: number;
  rateAuthMax: number;
  rateDefaultMax: number;
  logLevel: LogLevel;
  version: string;
}

function intEnv(env: NodeJS.ProcessEnv, name: string, def: number): number {
  const raw = env[name];
  if (!raw) return def;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return def;
  return n;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const nodeEnv = (env.NODE_ENV ?? "development") as Config["env"];
  const databasePath = env.DATABASE_PATH ?? "./data/aegis.db";
  if (nodeEnv !== "test") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }
  const jwtSecret =
    env.JWT_SECRET ??
    (nodeEnv === "test" ? randomBytes(32).toString("base64") : "");
  if (!jwtSecret && nodeEnv !== "test") {
    // Fail closed: refusing to boot with an insecure default secret.
    throw new Error(
      "JWT_SECRET is required. Generate one with: openssl rand -base64 48",
    );
  }
  return {
    env: nodeEnv,
    port: intEnv(env, "PORT", 8080),
    host: env.HOST ?? "0.0.0.0",
    corsOrigin: env.CORS_ORIGIN ?? "*",
    databasePath: env.DATABASE_PATH ?? "./data/aegis.db",
    jwtSecret,
    jwtIssuer: env.JWT_ISSUER ?? "aegisvpn",
    accessTokenTtlSec: intEnv(env, "ACCESS_TOKEN_TTL_SEC", 900),
    refreshTokenTtlDays: intEnv(env, "REFRESH_TOKEN_TTL_DAYS", 30),
    adminEmail: env.ADMIN_EMAIL,
    adminPassword: env.ADMIN_PASSWORD,
    paymentsProvider: (env.PAYMENTS_PROVIDER === "stripe"
      ? "stripe"
      : "none") as Config["paymentsProvider"],
    rateWindowSec: intEnv(env, "RATE_WINDOW_SEC", 60),
    rateAuthMax: intEnv(env, "RATE_AUTH_MAX", 10),
    rateDefaultMax: intEnv(env, "RATE_DEFAULT_MAX", 120),
    logLevel: (env.LOG_LEVEL as LogLevel) ?? "info",
    version: "1.0.0",
  };
}
