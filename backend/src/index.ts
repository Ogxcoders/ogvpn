import { loadConfig } from "./config.js";
import { buildApp } from "./app.js";
import { createLogger } from "./lib/logger.js";
import { queryOne, run } from "./db.js";
import { hashPassword } from "./lib/passwords.js";
import { newId, nowIso } from "./lib/util.js";

const cfg = loadConfig();
const log = createLogger(cfg);
const ctx = buildApp(cfg);

// Bootstrap admin — only when ADMIN_EMAIL/ADMIN_PASSWORD are explicitly
// provided and no admin exists. Credentials are never hardcoded.
if (cfg.adminEmail && cfg.adminPassword) {
  const existing = queryOne<{ c: number }>(
    ctx.db,
    "SELECT COUNT(*) AS c FROM users WHERE role = 'admin'",
  );
  if ((existing?.c ?? 0) === 0) {
    run(
      ctx.db,
      "INSERT INTO users (id, email, password_hash, name, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'admin', 'active', ?, ?)",
      newId(),
      cfg.adminEmail,
      hashPassword(cfg.adminPassword),
      "Administrator",
      nowIso(),
      nowIso(),
    );
    log.info("bootstrap.admin_created", { email: cfg.adminEmail });
  }
}

const server = ctx.app.listen(cfg.port, cfg.host, () => {
  log.info("server.started", {
    host: cfg.host,
    port: cfg.port,
    env: cfg.env,
    version: cfg.version,
  });
});

const shutdown = (signal: string) => {
  log.info("server.shutdown", { signal });
  ctx.close();
  server.close(() => process.exit(0));
  // Force-exit if graceful close hangs (open SSE streams).
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
