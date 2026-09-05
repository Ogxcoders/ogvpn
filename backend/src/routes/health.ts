import { Router, type Request, type Response } from "express";
import type { Config } from "../config.js";
import type { DB } from "../db.js";
import { queryOne } from "../db.js";
import { metrics } from "../db.js";

interface Counters {
  httpRequests: number;
  authAttempts: number;
  peersCreated: number;
  peersRemoved: number;
  sseClients: number;
}

export interface MetricsRegistry {
  counters: Counters;
}

export function createMetricsRegistry(): MetricsRegistry {
  return {
    counters: {
      httpRequests: 0,
      authAttempts: 0,
      peersCreated: 0,
      peersRemoved: 0,
      sseClients: 0,
    },
  };
}

export function healthRoutes(cfg: Config, db: DB, registry: MetricsRegistry): Router {
  const startedAt = Date.now();
  const r = Router();

  r.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", uptimeSec: Math.floor((Date.now() - startedAt) / 1000), version: cfg.version });
  });

  r.get("/health/ready", (_req: Request, res: Response) => {
    try {
      queryOne(db, "SELECT 1");
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "unavailable", reason: "database unreachable" });
    }
  });

  r.get("/metrics", (_req: Request, res: Response) => {
    res.json({
      ...registry.counters,
      sseClientsLive: registry.counters.sseClients,
      dbQueryCount: metrics().dbQueryCount,
    });
  });

  return r;
}
