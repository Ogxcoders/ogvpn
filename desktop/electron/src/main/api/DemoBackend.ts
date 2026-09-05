/**
 * In-memory DEMO backend for the desktop app (Electron MAIN process).
 *
 * Mirrors backend/seed/demo.ts: the same 7-server matrix
 * (active/maintenance/offline/drain/IPv4-only), the free/premium plan
 * catalog, devices, tunnels and sessions. Every response is built from the
 * shared/ipc.ts contract types, so the renderer code paths are identical in
 * demo and real mode.
 *
 * HONEST SCOPE:
 *  - there is NO backend, NO WireGuard tunnel and NO traffic protection in
 *    demo mode — VpnController simulates the state machine and labels it;
 *  - provisioning against a maintenance/offline server fails with the same
 *    SERVER_UNAVAILABLE error the real control plane returns;
 *  - mutations (rename, revoke, checkout, cancel) mutate this dataset live.
 */
import type {
  DeviceSummary,
  PlanInfo,
  ServerInfo,
  SessionRow,
  SubscriptionInfo,
  TunnelInfo,
  UserProfile,
} from '../../../../shared/ipc';
import { isDemoMode } from '../demoState';

export const DEMO_EMAIL = 'demo@aegisvpn.local';
export const DEMO_PASSWORD = 'DemoPass123';

/** Thrown for demo error envelopes; converted to ApiError upstream. */
export class DemoHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DemoHttpError';
  }
}

/* ---------- time helpers ---------- */

const start = Date.now();
const iso = (offsetMs = 0): string => new Date(start + offsetMs).toISOString();
const minutesAgo = (m: number): string => iso(-m * 60_000);
const daysAgo = (d: number): string => iso(-d * 86_400_000);
const daysFromNow = (d: number): string => iso(d * 86_400_000);

/* ---------- dataset ---------- */

const user: UserProfile = {
  id: 'usr-demo-0001',
  email: DEMO_EMAIL,
  name: 'Demo User',
  role: 'user',
  status: 'active',
  createdAt: daysAgo(60),
};

const currentDeviceId = 'dev-demo-current';

const devices: DeviceSummary[] = [
  {
    id: currentDeviceId,
    name: 'Desktop',
    platform: 'linux',
    status: 'active',
    lastActiveAt: iso(),
    session: null,
    tunnel: null,
  },
  {
    id: 'dev-demo-pixel8',
    name: 'Pixel 8',
    platform: 'android',
    status: 'active',
    lastActiveAt: minutesAgo(150),
    session: null,
    tunnel: null,
  },
  {
    id: 'dev-demo-mbp',
    name: 'MacBook Pro',
    platform: 'macos',
    status: 'active',
    lastActiveAt: daysAgo(40),
    session: null,
    tunnel: null,
  },
];

const servers: ServerInfo[] = [
  {
    id: 'srv-nl-ams-01', code: 'nl-ams-01', name: 'Amsterdam-1',
    country: 'Netherlands', city: 'Amsterdam', host: 'ams01.demo.aegisvpn.local',
    port: 51820, publicKey: '1Xk2qL8vRtY4mN7cB3zX9wP6aS5dF0gH2jK4lQ8eIo=',
    dns: '10.13.0.1', status: 'active', loadPct: 23, capacity: 250, tunnelCount: 42,
    ipv4Prefix: '10.13.0.0/24', ipv6Prefix: 'fd00:0a11::/64', supportsDualStack: true,
    lastHeartbeatAt: minutesAgo(0),
  },
  {
    id: 'srv-de-fra-01', code: 'de-fra-01', name: 'Frankfurt-1',
    country: 'Germany', city: 'Frankfurt', host: 'fra01.demo.aegisvpn.local',
    port: 51820, publicKey: '7Rt2wZ8kQ5mC3nV9bX4yL6pJ0hF1sD8gN2vT5aW7eU=',
    dns: '10.13.0.1', status: 'active', loadPct: 41, capacity: 250, tunnelCount: 61,
    ipv4Prefix: '10.13.1.0/24', ipv6Prefix: 'fd00:0a12::/64', supportsDualStack: true,
    lastHeartbeatAt: minutesAgo(0),
  },
  {
    id: 'srv-us-nyc-01', code: 'us-nyc-01', name: 'NewYork-1',
    country: 'United States', city: 'New York', host: 'nyc01.demo.aegisvpn.local',
    port: 51820, publicKey: '3Yh8nK2mQ6vB4xZ1cL9tR5wJ7pD0fG3sH6aE8uM4iO=',
    dns: '10.13.0.1', status: 'active', loadPct: 58, capacity: 250, tunnelCount: 88,
    ipv4Prefix: '10.13.2.0/24', ipv6Prefix: 'fd00:0a13::/64', supportsDualStack: true,
    lastHeartbeatAt: minutesAgo(0),
  },
  {
    id: 'srv-sg-sin-01', code: 'sg-sin-01', name: 'Singapore-1',
    country: 'Singapore', city: 'Singapore', host: 'sin01.demo.aegisvpn.local',
    port: 51820, publicKey: '9Ws4tH7yB2kX5mQ1nV8cZ3lR6pJ0dF4gA7sE2uT9oI=',
    dns: '10.13.0.1', status: 'maintenance', loadPct: 0, capacity: 250, tunnelCount: 0,
    ipv4Prefix: '10.13.3.0/24', ipv6Prefix: 'fd00:0a14::/64', supportsDualStack: true,
    lastHeartbeatAt: minutesAgo(7),
  },
  {
    id: 'srv-jp-tyo-01', code: 'jp-tyo-01', name: 'Tokyo-1',
    country: 'Japan', city: 'Tokyo', host: 'tyo01.demo.aegisvpn.local',
    port: 51820, publicKey: '5Mn8qK3wX7zB1vC4tL9hR2yJ6pD0sF8gE5aU3iO7eQ=',
    dns: '10.13.0.1', status: 'offline', loadPct: 0, capacity: 250, tunnelCount: 0,
    ipv4Prefix: '10.13.4.0/24', ipv6Prefix: 'fd00:0a15::/64', supportsDualStack: true,
    lastHeartbeatAt: daysAgo(2),
  },
  {
    id: 'srv-uk-lon-01', code: 'uk-lon-01', name: 'London-1',
    country: 'United Kingdom', city: 'London', host: 'lon01.demo.aegisvpn.local',
    port: 51820, publicKey: '8Jc3vB6nX2mQ9wZ5kL1tR7yH4pD0fS6gA8uE3iT5oM=',
    dns: '10.13.0.1', status: 'drain', loadPct: 77, capacity: 250, tunnelCount: 12,
    ipv4Prefix: '10.13.5.0/24', ipv6Prefix: 'fd00:0a16::/64', supportsDualStack: true,
    lastHeartbeatAt: minutesAgo(0),
  },
  {
    id: 'srv-fi-hel-01', code: 'fi-hel-01', name: 'Helsinki-1',
    country: 'Finland', city: 'Helsinki', host: 'hel01.demo.aegisvpn.local',
    port: 51820, publicKey: '2Fd7sH4kQ8nX3wZ6mB9vL1cR5tJ0pG7yA4uE8iS2oW=',
    dns: '10.13.0.1', status: 'active', loadPct: 12, capacity: 60, tunnelCount: 7,
    ipv4Prefix: '10.13.6.0/24', ipv6Prefix: '::/0', supportsDualStack: false,
    lastHeartbeatAt: minutesAgo(0),
  },
];

const sessions: SessionRow[] = [
  {
    id: 'ses-demo-seed',
    state: 'connected',
    deviceId: 'dev-demo-pixel8',
    deviceName: 'Pixel 8',
    serverId: 'srv-nl-ams-01',
    serverName: 'Amsterdam-1',
    connectedAt: minutesAgo(12),
    closedAt: null,
    bytesIn: 1_284_996_112,
    bytesOut: 96_402_113,
  },
];

const plans: PlanInfo[] = [
  {
    code: 'free', name: 'Free', priceCents: 0, interval: 'month', maxDevices: 2,
    features: ['2 devices', 'All server regions', 'Kill switch', 'Unlimited data'],
  },
  {
    code: 'premium', name: 'Premium', priceCents: 700, interval: 'month', maxDevices: 10,
    features: ['10 devices', 'Priority routing', 'Dedicated IPv6', 'Kill switch'],
  },
];

let subscription: SubscriptionInfo = {
  plan: 'free',
  status: 'active',
  currentPeriodEnd: null,
  maxDevices: 2,
};

const tunnels: TunnelInfo[] = [];
let idCounter = 0;
const nextId = (prefix: string): string => `${prefix}-demo-${++idCounter}`;

/** Artificial latency so busy states stay visible in demo mode. */
function latency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 180));
}

export function demoMe() {
  const dev = devices.find((d) => d.id === currentDeviceId)!;
  return {
    user: { ...user },
    device: {
      id: dev.id,
      name: dev.name,
      platform: dev.platform,
      status: 'active' as const,
      lastActiveAt: dev.lastActiveAt,
    },
    subscription: { ...subscription },
  };
}

/** Marks the current device row as the logging-in device (name from host). */
export function demoLoginDevice(deviceName: string, platform: 'windows' | 'macos' | 'linux'): void {
  const dev = devices.find((d) => d.id === currentDeviceId)!;
  dev.name = deviceName || dev.name;
  dev.platform = platform;
  dev.lastActiveAt = iso();
}

/* ---------- request routing ---------- */

/**
 * Answers one control-plane request. `path` is contract-relative
 * (e.g. "/auth/login"). The caller passes through whatever this returns;
 * DemoHttpError is converted to ApiError by AegisApi.
 */
export async function demoApiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  if (!isDemoMode()) {
    throw new DemoHttpError(500, 'SERVER_ERROR', 'Demo backend called while demo mode is off');
  }
  await latency();

  const segs = path.replace(/^\//, '').split('/');
  const root = segs[0] ?? '';
  const action = segs[1] ?? '';

  switch (`${method} ${root}`) {
    /* ---- auth ---- */
    case 'POST auth': {
      if (action !== 'login' && action !== 'register') break;
      const req = (body ?? {}) as { email?: string; deviceName?: string; platform?: string; name?: string };
      user.email = req.email?.trim() || DEMO_EMAIL;
      if (req.name?.trim()) user.name = req.name.trim();
      const platform = req.platform === 'windows' || req.platform === 'macos' ? req.platform : 'linux';
      demoLoginDevice(req.deviceName ?? '', platform);
      return {
        user: { ...user },
        device: { ...demoMe().device },
        accessToken: `demo-access-${nextId('tok')}`,
        refreshToken: `demo-refresh-${nextId('tok')}`,
      } as T;
    }
    case 'POST auth':
      if (action !== 'logout') break;
      return undefined as T;
    case 'GET auth':
      if (action !== 'me') break;
      return demoMe() as T;

    /* ---- servers ---- */
    case 'GET servers':
      return { servers: servers.map((s) => ({ ...s })) } as T;

    /* ---- devices ---- */
    case 'GET devices':
      return { devices: devices.map((d) => ({ ...d })) } as T;
    case 'PATCH devices': {
      const req = (body ?? {}) as { name?: string };
      const dev = devices.find((d) => d.id === action);
      if (!dev) throw new DemoHttpError(404, 'NOT_FOUND', `No device '${action}' in demo data`);
      dev.name = req.name?.trim() || dev.name;
      dev.lastActiveAt = iso();
      return { device: { id: dev.id, name: dev.name, platform: dev.platform, status: 'active' as const, lastActiveAt: dev.lastActiveAt } } as T;
    }
    case 'DELETE devices': {
      if (action === currentDeviceId) {
        throw new DemoHttpError(409, 'VALIDATION_ERROR', 'Cannot revoke the device you are using');
      }
      const idx = devices.findIndex((d) => d.id === action);
      if (idx < 0) throw new DemoHttpError(404, 'NOT_FOUND', `No device '${action}' in demo data`);
      devices.splice(idx, 1);
      return undefined as T;
    }

    /* ---- sessions ---- */
    case 'GET sessions':
      return { sessions: sessions.map((s) => ({ ...s })) } as T;

    /* ---- vpn peers ---- */
    case 'POST vpn': {
      if (action !== 'peers') break;
      const req = (body ?? {}) as { deviceId?: string; serverId?: string };
      const server = servers.find((s) => s.id === req.serverId);
      if (!server) throw new DemoHttpError(404, 'NOT_FOUND', `No server '${req.serverId}' in demo data`);
      if (server.status !== 'active') {
        throw new DemoHttpError(503, 'SERVER_UNAVAILABLE', `Server is ${server.status}`);
      }
      const tunnel: TunnelInfo = {
        id: nextId('tun'),
        addressV4: `${server.ipv4Prefix?.replace('.0/24', '') ?? '10.13.0'}.2`,
        addressV6: server.supportsDualStack ? server.ipv6Prefix?.replace('::/64', '::2') ?? null : null,
        serverPublicKey: server.publicKey,
        endpointHost: server.host,
        endpointPort: server.port,
        allowedIps: ['0.0.0.0/0', '::/0'],
        dns: server.dns,
        mtu: 1420,
        keepalive: 25,
        serverId: server.id,
      };
      tunnels.push({ ...tunnel });
      sessions.push({
        id: nextId('ses'),
        state: 'connected',
        deviceId: req.deviceId ?? currentDeviceId,
        deviceName: devices.find((d) => d.id === currentDeviceId)?.name ?? 'Desktop',
        serverId: server.id,
        serverName: server.name,
        connectedAt: iso(),
        closedAt: null,
        bytesIn: 0,
        bytesOut: 0,
      });
      return { tunnel } as T;
    }
    case 'DELETE vpn': {
      if (action !== 'peers') break;
      const id = segs[2];
      const idx = tunnels.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const t = tunnels[idx]!;
        tunnels.splice(idx, 1);
        for (const s of sessions) {
          if (s.serverId === t.serverId && s.deviceId === currentDeviceId && s.state !== 'closed') {
            s.state = 'closed';
            s.closedAt = iso();
          }
        }
      }
      return undefined as T;
    }

    /* ---- subscription ---- */
    case 'GET subscription':
      if (action === 'plans') return { plans: plans.map((p) => ({ ...p })) } as T;
      return { subscription: { ...subscription } } as T;
    case 'POST subscription': {
      if (action !== 'checkout' && action !== 'cancel') break;
      if (action === 'cancel') {
        subscription = { plan: 'free', status: 'active', currentPeriodEnd: null, maxDevices: 2 };
        return { subscription: { ...subscription } } as T;
      }
      const req = (body ?? {}) as { planCode?: string };
      const plan = plans.find((p) => p.code === req.planCode);
      if (!plan) throw new DemoHttpError(404, 'NOT_FOUND', `No plan '${req.planCode}' in demo data`);
      subscription = {
        plan: plan.code === 'premium' ? 'premium' : 'free',
        status: 'active',
        currentPeriodEnd: daysFromNow(30),
        maxDevices: plan.maxDevices,
      };
      return { subscription: { ...subscription } } as T;
    }
    default:
      break;
  }
  if (root === 'admin') {
    throw new DemoHttpError(403, 'FORBIDDEN', 'Admin area is not part of the demo dataset');
  }
  throw new DemoHttpError(404, 'NOT_FOUND', `No demo handler for ${method} ${path}`);
}
