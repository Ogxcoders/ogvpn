import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  SESSION_EXPIRED_EVENT,
  api,
  baseURL,
  clearTokens,
  getTokens,
  setTokens,
} from '../api/client';
import {
  normaliseDevice,
  type AuthSuccessResponse,
  type Device,
  type MeResponse,
  type SubscriptionInfo,
  type User,
} from '../api/types';
import { invalidate } from '../lib/bus';
import { deviceUid, webDeviceName } from '../lib/device';
import { useToast } from '../components/ToastProvider';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  deviceName: string;
}

interface AuthContextValue {
  user: User | null;
  subscription: SubscriptionInfo | null;
  device: Device | null;
  status: AuthStatus;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const reset = useCallback(() => {
    setUser(null);
    setSubscription(null);
    setDevice(null);
    setStatus('anonymous');
  }, []);

  const refreshMe = useCallback(async () => {
    // A 401 here triggers the client's refresh flow automatically; if the
    // refresh also fails the SESSION_EXPIRED_EVENT handler resets below.
    const data = await api.get<MeResponse>('/auth/me');
    setUser(data.user);
    setSubscription(data.subscription);
    setDevice(normaliseDevice(data.device));
    setStatus('authenticated');
  }, []);

  // Bootstrap: with stored tokens, hydrate the session from GET /auth/me.
  useEffect(() => {
    if (!getTokens()) {
      setStatus('anonymous');
      return;
    }
    let cancelled = false;
    refreshMe().catch(() => {
      if (!cancelled) reset();
    });
    return () => {
      cancelled = true;
    };
  }, [refreshMe, reset]);

  // The api client logs out locally when a refresh fails; mirror that here.
  useEffect(() => {
    const onExpired = () => reset();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [reset]);

  const login = useCallback(
    async (input: LoginInput) => {
      const data = await api.post<AuthSuccessResponse>(
        '/auth/login',
        {
          email: input.email.trim(),
          password: input.password,
          deviceName: webDeviceName(),
          platform: 'web',
          deviceUid: deviceUid(),
        },
        { auth: false },
      );
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setUser(data.user);
      setDevice(normaliseDevice(data.device));
      setStatus('authenticated');
      // Best-effort subscription hydration; login already succeeded.
      await refreshMe().catch(() => undefined);
    },
    [refreshMe],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await api.post<AuthSuccessResponse>(
        '/auth/register',
        {
          email: input.email.trim(),
          password: input.password,
          name: input.name.trim(),
          deviceName: input.deviceName.trim() || webDeviceName(),
          platform: 'web',
          deviceUid: deviceUid(),
        },
        { auth: false },
      );
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setUser(data.user);
      setDevice(normaliseDevice(data.device));
      setStatus('authenticated');
      await refreshMe().catch(() => undefined);
    },
    [refreshMe],
  );

  const logout = useCallback(async () => {
    const tokens = getTokens();
    try {
      // Server-side revocation of the refresh token family. Best-effort:
      // clearing local state must succeed even if the network is down.
      if (tokens) await api.post('/auth/logout', { refreshToken: tokens.refreshToken });
    } catch {
      /* ignore — local logout proceeds */
    }
    clearTokens();
    reset();
  }, [reset]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, subscription, device, status, login, register, logout, refreshMe }),
    [user, subscription, device, status, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* SSE event stream — invalidates data + toasts, logs out on disable.  */
/* ------------------------------------------------------------------ */

const WATCHED_EVENTS = [
  'device.revoked',
  'session.force-disconnect',
  'subscription.changed',
  'server.changed',
  'config.updated',
  'account.disabled',
] as const;

type WatchedEvent = (typeof WATCHED_EVENTS)[number];

const MAX_BACKOFF_MS = 30_000;

/**
 * Connects to GET /api/v1/events?access_token=… while authenticated.
 *
 * Reconnect policy: the connection is closed on error and re-established
 * with exponential backoff (1s → 2s → 4s … capped at 30s). Before each
 * reconnect the session is re-validated via refreshMe(), which rotates the
 * access token through the normal refresh flow, so the SSE handshake always
 * carries a fresh JWT. Missed events are not replayed by design — every
 * event handler refetches the affected resource (events are notifications,
 * not a source of truth).
 */
export function useEvents(): void {
  const { status, refreshMe, logout } = useAuth();
  const { toast } = useToast();

  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (typeof EventSource === 'undefined') return; // environment without SSE (e.g. tests)

    let source: EventSource | null = null;
    let attempts = 0;
    let reconnectTimer: number | undefined;
    let disposed = false;

    const handle = (evt: Event): void => {
      const message = evt as MessageEvent;
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(String(message.data)) as Record<string, unknown>;
      } catch {
        /* malformed payload — still handle the event type */
      }
      switch (message.type as WatchedEvent) {
        case 'device.revoked':
          invalidate('devices');
          invalidate('sessions');
          toast('A device was revoked — its VPN session will disconnect.', 'warn');
          break;
        case 'session.force-disconnect':
          invalidate('sessions');
          invalidate('devices');
          toast('A session was force-disconnected.', 'warn');
          break;
        case 'subscription.changed':
          void refreshMe();
          invalidate('subscription');
          toast(
            `Your subscription changed (${String(data.plan ?? 'updated')}).`,
            'info',
          );
          break;
        case 'server.changed':
          invalidate('servers');
          toast('Server availability changed — refreshing server list.', 'info');
          break;
        case 'config.updated':
          invalidate('devices');
          break;
        case 'account.disabled':
          toast('Your account has been disabled. Signing out.', 'error');
          void logout();
          break;
        default:
          // 'ping' keepalives and unknown types are ignored.
          break;
      }
    };

    const connect = (): void => {
      if (disposed || statusRef.current !== 'authenticated') return;
      const tokens = getTokens();
      if (!tokens) {
        void logout();
        return;
      }
      source = new EventSource(
        `${baseURL}/api/v1/events?access_token=${encodeURIComponent(tokens.accessToken)}`,
      );
      source.onopen = () => {
        attempts = 0;
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (disposed || statusRef.current !== 'authenticated') return;
        const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts);
        attempts += 1;
        reconnectTimer = window.setTimeout(() => {
          if (disposed) return;
          // Re-validate (rotating the access token) before reconnecting.
          refreshMe()
            .then(() => {
              if (!disposed) connect();
            })
            .catch(() => {
              /* refresh failed: tokens cleared + session-expired event fired */
            });
        }, delay);
      };
      for (const type of WATCHED_EVENTS) {
        source.addEventListener(type, handle);
      }
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [status, refreshMe, logout, toast]);
}

/** Mounts the SSE listener inside the authenticated app shell. */
export function EventBridge(): null {
  useEvents();
  return null;
}
