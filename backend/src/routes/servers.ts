import { Router, type Request, type Response, type NextFunction } from "express";
import type { DB } from "../db.js";
import { query, queryOne } from "../db.js";
import { ApiError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import type { Config } from "../config.js";

interface ServerRow {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  host: string;
  port: number;
  public_key: string;
  ipv4_prefix: string;
  ipv6_prefix: string;
  dns: string;
  status: string;
  capacity: number;
  last_heartbeat_at: string | null;
}

const VISIBLE = "active,maintenance,drain,offline";

function toClient(s: ServerRow, tunnelCount: number, supportsDualStack: boolean) {
  const loadPct = Math.min(100, Math.round((tunnelCount / Math.max(1, s.capacity)) * 100));
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    country: s.country,
    city: s.city,
    host: s.host,
    port: s.port,
    publicKey: s.public_key,
    dns: s.dns,
    status: s.status,
    capacity: s.capacity,
    tunnelCount,
    loadPct,
    ipv4Prefix: s.ipv4_prefix,
    ipv6Prefix: s.ipv6_prefix,
    supportsDualStack,
    lastHeartbeatAt: s.last_heartbeat_at,
  };
}

export function serversRoutes(cfg: Config, db: DB): Router {
  const r = Router();
  r.use(requireAuth(cfg, db));

  r.get("/", (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = query<ServerRow>(
        db,
        `SELECT * FROM servers WHERE status IN (${VISIBLE.split(",").map(() => "?").join(",")}) ORDER BY country, city`,
        ...VISIBLE.split(","),
      );
      const servers = rows.map((s) => {
        const t = queryOne<{ c: number }>(
          db,
          "SELECT COUNT(*) AS c FROM tunnels WHERE server_id = ? AND status = 'active'",
          s.id,
        );
        const supportsDualStack = !s.ipv6_prefix.startsWith("::");
        return toClient(s, t?.c ?? 0, supportsDualStack);
      });
      res.json({ servers });
    } catch (e) {
      next(e);
    }
  });

  r.get("/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
      const s = queryOne<ServerRow>(
        db,
        `SELECT * FROM servers WHERE id = ? AND status IN (${VISIBLE.split(",").map(() => "?").join(",")})`,
        req.params.id,
        ...VISIBLE.split(","),
      );
      if (!s) throw ApiError.notFound("Server not found");
      const t = queryOne<{ c: number }>(
        db,
        "SELECT COUNT(*) AS c FROM tunnels WHERE server_id = ? AND status = 'active'",
        s.id,
      );
      const supportsDualStack = !s.ipv6_prefix.startsWith("::");
      res.json({ server: toClient(s, t?.c ?? 0, supportsDualStack) });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
