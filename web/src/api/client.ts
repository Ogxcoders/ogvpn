/*
 * API client for the AegisVPN control plane.
 *
 * - Same-origin by default (baseURL ''), overridable with VITE_API_BASE.
 * - JSON envelope handling; errors throw ApiError {code, message, status}.
 * - Automatic refresh flow: on a 401 from any authenticated endpoint the
 *   client rotates the refresh token via POST /api/v1/auth/refresh and
 *   retries the original request exactly once. If the refresh fails the
 *   session is logged out locally and a session-expired event is emitted
 *   (AuthProvider listens and returns the app to /login).
 *
 * TOKEN STORAGE — XSS TRADEOFF (documented deliberately):
 * Access + refresh tokens are kept in localStorage (`aegis.access`,
 * `aegis.refresh`). localStorage is readable by any script running on this
 * origin, so a successful XSS would expose tokens. This is accepted for the
 * self-hosted control plane because the SPA is served from a single trusted
 * origin with no third-party scripts. Upgrade path: move tokens to
 * httpOnly + Secure + SameSite=Strict cookies set by the backend and switch
 * this module to `credentials: 'include'` (the refresh endpoint then reads
 * the cookie instead of a body field); no component code changes required —
 * only getTokens/setTokens/clearTokens and the refresh call in this file.
 */

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const ACCESS_TOKEN_KEY = 'aegis.access';
export const REFRESH_TOKEN_KEY = 'aegis.refresh';
/** Dispatched (as CustomEvent) whenever the session is logged out by the client. */
export const SESSION_EXPIRED_EVENT = 'aegis:session-expired';

/** Same origin by default; overridable at build time. */
export const baseURL: string = import.meta.env?.VITE_API_BASE ?? '';

const AUTH_FREE_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh']);

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip the Authorization header + refresh flow (login/register/refresh). */
  auth?: boolean;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  signal?: AbortSignal;
  /** Internal: guards the single retry after a successful refresh. */
  retried?: boolean;
}

/* ---------- Token storage ---------- */

export function getTokens(): Tokens | null {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

export function setTokens(tokens: Tokens): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    /* storage unavailable (private mode): session works until first reload */
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------- Internals ---------- */

function sessionExpired(): void {
  try {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  } catch {
    /* non-DOM environment */
  }
}

function defaultCode(status: number): string {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'SERVER_ERROR';
  }
}

function errorFromPayload(status: number, text: string): ApiError {
  if (text) {
    try {
      const parsed = JSON.parse(text) as {
        error?: { code?: string; message?: string; details?: unknown };
      };
      if (parsed && parsed.error) {
        return new ApiError(
          status,
          parsed.error.code ?? defaultCode(status),
          parsed.error.message ?? 'Request failed',
          parsed.error.details,
        );
      }
    } catch {
      /* body was not the error envelope — fall through */
    }
  }
  return new ApiError(status, defaultCode(status), text || `Request failed (${status})`);
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!res.ok) throw errorFromPayload(res.status, text);
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, 'SERVER_ERROR', 'Malformed JSON response from server');
  }
}

let refreshInFlight: Promise<void> | null = null;

async function doRefresh(refreshToken: string): Promise<void> {
  const res = await fetch(`${baseURL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    // Refresh rejected: invalid, expired, or reused (reuse kills the family).
    throw await parseResponse<never>(res);
  }
  const data = (await res.json()) as Partial<Tokens>;
  if (!data.accessToken || !data.refreshToken) {
    throw new ApiError(res.status, 'SERVER_ERROR', 'Malformed refresh response');
  }
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
}

/* ---------- Core request ---------- */

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth !== false) {
    const tokens = getTokens();
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  let res: Response;
  try {
    res = await fetch(`${baseURL}/api/v1${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed. Check your connection and try again.');
  }

  if (res.status === 401 && opts.auth !== false && !AUTH_FREE_PATHS.has(path)) {
    const tokens = getTokens();
    if (tokens) {
      if (!opts.retried) {
        try {
          // Single-flight: concurrent 401s share one refresh call. The backend
          // rotates refresh tokens, so parallel refreshes would trip reuse
          // detection and revoke the whole family.
          refreshInFlight ??= doRefresh(tokens.refreshToken).finally(() => {
            refreshInFlight = null;
          });
          await refreshInFlight;
        } catch {
          clearTokens();
          sessionExpired();
          throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
        }
        // Retry the original request exactly once with the new access token.
        return request<T>(path, { ...opts, retried: true });
      }
    }
    clearTokens();
    sessionExpired();
    throw await parseResponse<never>(res);
  }

  return parseResponse<T>(res);
}

/* ---------- Public API ---------- */

export const api = {
  get<T>(path: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return request<T>(path, { ...opts, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return request<T>(path, { ...opts, method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return request<T>(path, { ...opts, method: 'PATCH', body });
  },
  del<T>(path: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return request<T>(path, { ...opts, method: 'DELETE' });
  },
};
