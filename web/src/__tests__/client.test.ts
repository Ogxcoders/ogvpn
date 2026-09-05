import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError, getTokens, setTokens, clearTokens, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../api/client';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const okUser = { user: { id: 'u1', email: 'a@b.c', name: 'A', role: 'user', status: 'active' } };

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('parses success payloads and attaches bearer token', async () => {
    setTokens({ accessToken: 'tok-1', refreshToken: 'ref-1' });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse(200, okUser));

    const res = await api.get<typeof okUser>('/auth/me');
    expect(res.user.id).toBe('u1');
    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-1');
  });

  it('throws typed ApiError from the error envelope', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse(403, { error: { code: 'DEVICE_REVOKED', message: 'Device has been revoked' } }),
    );
    await expect(api.get('/devices')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      code: 'DEVICE_REVOKED',
      message: 'Device has been revoked',
    } satisfies Partial<ApiError>);
  });

  it('refreshes on 401 and retries the original request once', async () => {
    setTokens({ accessToken: 'stale', refreshToken: 'ref-old' });
    const f = globalThis.fetch as ReturnType<typeof vi.fn>;
    f.mockImplementation(async (path: string, init?: RequestInit) => {
      if (String(path).endsWith('/api/v1/auth/refresh')) {
        return jsonResponse(200, { accessToken: 'fresh', refreshToken: 'ref-new' });
      }
      const auth = (init?.headers as Record<string, string>)?.Authorization;
      if (auth === 'Bearer stale') {
        return jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Token expired' } });
      }
      return jsonResponse(200, { devices: [] });
    });

    const res = await api.get<{ devices: unknown[] }>('/devices');
    expect(res.devices).toEqual([]);
    expect(getTokens()).toEqual({ accessToken: 'fresh', refreshToken: 'ref-new' });
    // refresh + original x2 (stale + retry)
    expect(f.mock.calls.length).toBe(3);
  });

  it('logs out (session expired) when refresh fails', async () => {
    setTokens({ accessToken: 'stale', refreshToken: 'ref-old' });
    const f = globalThis.fetch as ReturnType<typeof vi.fn>;
    f.mockImplementation(async (path: string) => {
      if (String(path).endsWith('/api/v1/auth/refresh')) {
        return jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Refresh expired' } });
      }
      return jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Token expired' } });
    });
    const expiredSpy = vi.fn();
    window.addEventListener('aegis:session-expired', expiredSpy);

    await expect(api.get('/devices')).rejects.toBeInstanceOf(ApiError);
    expect(expiredSpy).toHaveBeenCalled();
    expect(getTokens()).toBeNull();
    window.removeEventListener('aegis:session-expired', expiredSpy);
  });

  it('stores and clears tokens', () => {
    setTokens({ accessToken: 'a', refreshToken: 'b' });
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('a');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('b');
    clearTokens();
    expect(getTokens()).toBeNull();
  });

  it('network failure maps to NETWORK_ERROR code', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError('fetch failed'));
    await expect(api.get('/servers')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
