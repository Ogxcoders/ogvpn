import type { Config, LogLevel } from "../config.js";

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Redaction patterns — these values must never reach the log stream. */
const SECRET_KEYS = /pass|token|secret|key|auth|cookie|credential/i;

function redact(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = SECRET_KEYS.test(k) ? "[REDACTED]" : v;
  }
  return out;
}

export interface Logger {
  debug(event: string, meta?: Record<string, unknown>): void;
  info(event: string, meta?: Record<string, unknown>): void;
  warn(event: string, meta?: Record<string, unknown>): void;
  error(event: string, meta?: Record<string, unknown>): void;
}

export function createLogger(cfg: Config): Logger {
  const min = LEVELS[cfg.logLevel];
  const emit = (level: LogLevel, event: string, meta?: Record<string, unknown>) => {
    if (LEVELS[level] < min) return;
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      event,
      ...redact(meta),
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  };
  return {
    debug: (e, m) => emit("debug", e, m),
    info: (e, m) => emit("info", e, m),
    warn: (e, m) => emit("warn", e, m),
    error: (e, m) => emit("error", e, m),
  };
}
