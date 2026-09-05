/** Typed API error with an HTTP status and machine-readable code. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }
  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Not allowed", code = "FORBIDDEN"): ApiError {
    return new ApiError(403, code, message);
  }
  static notFound(message = "Not found"): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message: string): ApiError {
    return new ApiError(409, "CONFLICT", message);
  }
  static rateLimited(retryAfterSec: number): ApiError {
    const e = new ApiError(429, "RATE_LIMITED", "Too many requests", {
      retryAfterSec,
    });
    (e as ApiError & { retryAfter: number }).retryAfter = retryAfterSec;
    return e;
  }
  static serverUnavailable(message = "Service unavailable"): ApiError {
    return new ApiError(503, "SERVER_UNAVAILABLE", message);
  }
}
