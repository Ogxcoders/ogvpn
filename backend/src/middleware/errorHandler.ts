import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors.js";
import type { Logger } from "../lib/logger.js";

/** JSON error envelope per API contract. Never leaks stack traces. */
export function errorHandler(log: Logger) {
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof ApiError) {
      if (err.status === 429) {
        const retry = (err.details as { retryAfterSec?: number } | undefined)
          ?.retryAfterSec ?? 60;
        res.setHeader("Retry-After", String(retry));
      }
      res.status(err.status).json({
        error: { code: err.code, message: err.message, details: err.details },
      });
      return;
    }
    if (err instanceof ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      });
      return;
    }
    log.error("unhandled_error", {
      method: req.method,
      path: req.path,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    res
      .status(500)
      .json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  };
}

/** 404 for unknown routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `No route: ${req.method} ${req.path}` },
  });
}
