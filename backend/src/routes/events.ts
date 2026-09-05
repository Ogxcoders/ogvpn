import { Router, type Request, type Response } from "express";
import type { Config } from "../config.js";
import type { EventBus } from "../events.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { ApiError } from "../lib/errors.js";

/** SSE stream. EventSource cannot send headers, so the short-lived access
 *  token is accepted via query param. Events are notifications only —
 *  clients re-fetch state after reconnecting. */
export function eventsRoutes(cfg: Config, bus: EventBus): Router {
  const r = Router();

  r.get("/", (req: Request, res: Response) => {
    const token = (req.query.access_token as string | undefined) ??
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);
    if (!token) throw ApiError.unauthorized();
    const claims = verifyAccessToken(cfg, token);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`event: ping\ndata: {"ok":true}\n\n`);

    const removeClient = bus.addClient(claims.sub, res);
    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        res.write(`event: ping\ndata: {"ts":"${new Date().toISOString()}"}\n\n`);
      }
    }, 25_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      removeClient();
    });
  });

  return r;
}
