import express from "express";
import cors from "cors";
import type { Config } from "./config.js";
import { openDatabase, closeDatabase, type DB } from "./db.js";
import { EventBus } from "./events.js";
import { createLogger } from "./lib/logger.js";
import { MemoryRateLimiter } from "./lib/util.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/auth.js";
import { devicesRoutes } from "./routes/devices.js";
import { serversRoutes } from "./routes/servers.js";
import { vpnRoutes } from "./routes/vpn.js";
import { sessionsRoutes } from "./routes/sessions.js";
import { subscriptionRoutes } from "./routes/subscription.js";
import { eventsRoutes } from "./routes/events.js";
import { agentRoutes } from "./routes/agent.js";
import {
  adminRoutes,
  notificationsRoutes,
  ticketRoutes,
} from "./routes/admin.js";
import { createMetricsRegistry, healthRoutes } from "./routes/health.js";
import type { Server } from "node:http";

export interface AppContext {
  app: express.Express;
  cfg: Config;
  db: DB;
  bus: EventBus;
  server?: Server;
  close(): void;
}

export function buildApp(cfg: Config): AppContext {
  const log = createLogger(cfg);
  const db = openDatabase(cfg.databasePath);
  const bus = new EventBus(db);
  const metricsRegistry = createMetricsRegistry();

  const authLimiter = new MemoryRateLimiter(cfg.rateWindowSec, cfg.rateAuthMax);
  const defaultLimiter = new MemoryRateLimiter(cfg.rateWindowSec, cfg.rateDefaultMax);
  const limiterSweep = setInterval(() => {
    authLimiter.sweep();
    defaultLimiter.sweep();
  }, cfg.rateWindowSec * 1000);
  limiterSweep.unref?.();

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(cors({ origin: cfg.corsOrigin, credentials: false, maxAge: 600 }));
  app.use(express.json({ limit: "256kb" }));

  // Global request counter + default rate limit.
  app.use((req, res, next) => {
    metricsRegistry.counters.httpRequests += 1;
    if (req.path.startsWith("/api/v1/auth")) {
      metricsRegistry.counters.authAttempts += 1;
    }
    if (req.path.startsWith("/api/v1")) {
      const result = defaultLimiter.hit(`${req.ip ?? "unknown"}:global`);
      if (!result.allowed) {
        res.setHeader("Retry-After", String(result.retryAfterSec));
        res.status(429).json({
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        });
        return;
      }
    }
    next();
  });

  const v1 = express.Router();
  v1.use("/auth", authRoutes(cfg, db, authLimiter));
  v1.use("/devices", devicesRoutes(cfg, db, bus));
  v1.use("/servers", serversRoutes(cfg, db));
  v1.use("/vpn", vpnRoutes(cfg, db, bus));
  v1.use("/sessions", sessionsRoutes(cfg, db, bus));
  v1.use("/subscription", subscriptionRoutes(cfg, db, bus));
  v1.use("/notifications", notificationsRoutes(cfg, db));
  v1.use("/tickets", ticketRoutes(cfg, db));
  v1.use("/events", eventsRoutes(cfg, bus));
  v1.use("/admin", adminRoutes(cfg, db, bus));
  app.use("/api/v1", v1);
  app.use("/agent", agentRoutes(db));
  app.use("/", healthRoutes(cfg, db, metricsRegistry));

  app.use(notFoundHandler);
  app.use(errorHandler(log));

  // Keep live SSE client count roughly accurate.
  const sseTimer = setInterval(() => {
    metricsRegistry.counters.sseClients = bus.clientCount;
  }, 5000);
  sseTimer.unref?.();

  return {
    app,
    cfg,
    db,
    bus,
    close() {
      clearInterval(limiterSweep);
      clearInterval(sseTimer);
      closeDatabase(db);
    },
  };
}
