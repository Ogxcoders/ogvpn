import { generateWgKeypair } from '../keys';
import type {
  AuthIdentity,
  CreatePeerResult,
  DeviceSummary,
  LoginResult,
  PlanInfo,
  ServerInfo,
  SessionRow,
  SubscriptionInfo,
  TunnelInfo,
} from '../../../../shared/ipc';
import type { TokenStore } from './TokenStore';

/**
 * Typed HTTP client for the AegisVPN backend (docs/API-CONTRACT.md v1).
 *
 * Runs in the Electron MAIN process only. Handles:
 *  - bearer injection from the TokenStore
 *  - single-flight refresh-token rotation on 401 (the backend rotates
 *    refresh tokens; parallel refreshes would trip reuse detection)
 *  - one automatic retry of the original request after refresh
 *  - machine-readable ApiError codes matching the contract envelope
 *
 * Device identity: a stable deviceUid is generated once and persisted so
 * re-logins reuse the same device row (see docs/API-CONTRACT.md).
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope {
  error?: { code: string; message: string; details?: unknown };
}

export const DEFAULT_API_BASE_URL = 'http://localhost:8080';

/** Client-side password policy mirror — exact backend rules. */
export function passwordPolicyErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push('at least 10 characters');
  if (!/[a-zA-Z]/.test(password)) errors.push('at least one letter');
  if (!/[0-9]/.test(password)) errors.push('at least one digit');
  return errors;
}

export function emailError(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
  return null;
}

export interface DeviceIdentityProvider {
  deviceName(): string;
  deviceUid(): string;
}

export class AegisApi {
  private refreshInFlight: Promise<void> | null = null;

  constructor(
    private readonly tokens: TokenStore,
    private readonly identity: DeviceIdentityProvider,
    private baseUrlProvider: () => string = () => DEFAULT_API_BASE_URL,
  ) {}

  setBaseUrlProvider(p: () => string): void {
    this.baseUrlProvider = p;
  }

  get baseUrl(): string {
    return this.baseUrlProvider().replace(/\/$/, '');
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    opts: { auth?: boolean; retried?: boolean } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.auth !== false) {
      const at = this.tokens.getAccessToken();
      if (at) headers.Authorization = `Bearer ${at}`;
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      throw new ApiError(0, 'NETWORK_ERROR', `Cannot reach ${this.baseUrl}: ${(e as Error).message}`);
    }

    if (res.status === 401 && opts.auth !== false && path !== '/auth/refresh' && path !== '/auth/login' && path !== '/auth/register') {
      if (!opts.retried && this.tokens.getRefreshToken()) {
        this.refreshInFlight ??= this.doRefresh().finally(() => {
          this.refreshInFlight = null;
        });
        try {
          await this.refreshInFlight;
        } catch {
          this.tokens.clear();
          throw await this.toApiError(res);
        }
        return this.request<T>(method, path, body, { ...opts, retried: true });
      }
      throw await this.toApiError(res);
    }

    if (!res.ok) throw await this.toApiError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  private async toApiError(res: Response): Promise<ApiError> {
    let code = `HTTP_${res.status}`;
    let message = `Request failed with status ${res.status}`;
    let details: unknown;
    try {
      const payload = (await res.json()) as Envelope;
      if (payload.error) {
        code = payload.error.code;
        message = payload.error.message;
        details = payload.error.details;
      }
    } catch {
      // non-JSON error body
    }
    return new ApiError(res.status, code, message, details);
  }

  private async doRefresh(): Promise<void> {
    const refreshToken = this.tokens.getRefreshToken();
    if (!refreshToken) throw new ApiError(401, 'UNAUTHORIZED', 'No refresh token');
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      throw new ApiError(0, 'NETWORK_ERROR', `Cannot reach ${this.baseUrl}: ${(e as Error).message}`);
    }
    if (!res.ok) {
      this.tokens.clear();
      throw await this.toApiError(res);
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    this.tokens.save(data);
  }

  // ---- auth ----

  async login(email: string, password: string): Promise<LoginResult> {
    const data = await this.request<{
      user: AuthIdentity['user'];
      device: AuthIdentity['device'];
      accessToken: string;
      refreshToken: string;
    }>('POST', '/auth/login', {
      email: email.trim(),
      password,
      deviceName: this.identity.deviceName(),
      platform: platformName(),
      deviceUid: this.identity.deviceUid(),
    }, { auth: false });
    this.tokens.save({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return { user: data.user, device: data.device, subscription: null };
  }

  async register(email: string, password: string, name: string): Promise<LoginResult> {
    const data = await this.request<{
      user: AuthIdentity['user'];
      device: AuthIdentity['device'];
      accessToken: string;
      refreshToken: string;
    }>('POST', '/auth/register', {
      email: email.trim(),
      password,
      name: name.trim(),
      deviceName: this.identity.deviceName(),
      platform: platformName(),
      deviceUid: this.identity.deviceUid(),
    }, { auth: false });
    this.tokens.save({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return { user: data.user, device: data.device, subscription: null };
  }

  async logout(): Promise<void> {
    const refreshToken = this.tokens.getRefreshToken();
    if (refreshToken) {
      await this.request('POST', '/auth/logout', { refreshToken }, { auth: false }).catch(() => undefined);
    }
    this.tokens.clear();
  }

  async me(): Promise<AuthIdentity | null> {
    if (!this.tokens.getAccessToken() && !this.tokens.getRefreshToken()) return null;
    const data = await this.request<{
      user: AuthIdentity['user'];
      subscription: SubscriptionInfo;
      device: AuthIdentity['device'];
    }>('GET', '/auth/me');
    return { user: data.user, device: data.device, subscription: data.subscription };
  }

  // ---- servers / devices / sessions ----

  listServers(): Promise<ServerInfo[]> {
    return this.request<{ servers: ServerInfo[] }>('GET', '/servers').then((r) => r.servers);
  }

  listDevices(): Promise<DeviceSummary[]> {
    return this.request<{ devices: DeviceSummary[] }>('GET', '/devices').then((r) => r.devices);
  }

  renameDevice(deviceId: string, name: string): Promise<AuthIdentity['device']> {
    return this.request<{ device: AuthIdentity['device'] }>('PATCH', `/devices/${deviceId}`, { name }).then((r) => r.device);
  }

  revokeDevice(deviceId: string): Promise<void> {
    return this.request('DELETE', `/devices/${deviceId}`);
  }

  listSessions(): Promise<SessionRow[]> {
    return this.request<{ sessions: SessionRow[] }>('GET', '/sessions').then((r) => r.sessions);
  }

  // ---- vpn ----

  async createPeer(serverId: string, deviceId: string): Promise<CreatePeerResult> {
    // The private key is generated here and NEVER leaves the device; only
    // the public key is uploaded (contract: POST /vpn/peers).
    const keypair = generateWgKeypair();
    const data = await this.request<{ tunnel: TunnelInfo }>('POST', '/vpn/peers', {
      deviceId,
      serverId,
      publicKey: keypair.publicKey,
    });
    // Attach the private key to the tunnel in memory only.
    return { tunnel: { ...data.tunnel, privateKey: keypair.privateKey } as TunnelInfo & { privateKey: string } };
  }

  deletePeer(tunnelId: string): Promise<void> {
    return this.request('DELETE', `/vpn/peers/${tunnelId}`);
  }

  // ---- subscription ----

  getSubscription(): Promise<SubscriptionInfo> {
    return this.request<{ subscription: SubscriptionInfo }>('GET', '/subscription').then((r) => r.subscription);
  }

  listPlans(): Promise<PlanInfo[]> {
    return this.request<{ plans: PlanInfo[] }>('GET', '/subscription/plans').then((r) => r.plans);
  }

  checkout(planCode: 'free' | 'premium'): Promise<SubscriptionInfo> {
    return this.request<{ subscription: SubscriptionInfo }>('POST', '/subscription/checkout', { planCode }).then((r) => r.subscription);
  }
}

export function platformName(): 'windows' | 'macos' | 'linux' {
  switch (process.platform) {
    case 'win32': return 'windows';
    case 'darwin': return 'macos';
    default: return 'linux';
  }
}
