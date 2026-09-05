/*
 * Offline DEMO backend for the web control plane.
 *
 * When demo mode is on, client.ts routes every request here instead of the
 * network. Responses are built from the SAME TypeScript contract types the
 * real backend responses are parsed into, so the UI code paths are identical
 * in demo and real mode.
 *
 * HONEST SCOPE (mirrors the Android demo mode):
 *  - the UI is real; there is NO backend, NO WireGuard tunnel and NO traffic
 *    protection behind it;
 *  - the dataset mirrors backend/seed/demo.ts: the same 7-server matrix
 *    (active/maintenance/offline/drain/IPv4-only), plan catalog, devices and
 *    sessions, so success AND failure paths can be exercised;
 *  - connecting to a maintenance/offline server is impossible for real, so
 *    the demo refuses it with the same SERVER_UNAVAILABLE error the real
 *    control plane returns;
 *  - every mutating action (rename, revoke, checkout, cancel) mutates the
 *    in-memory dataset live.
 * The demo flag is persisted in localStorage (`aegis.demo`) and must be
 * cleared explicitly ("Exit demo mode").
 */

import type {
  AuthSuccessResponse,
  Device,
  MeResponse,
  Plan,
  PlanCode,
  Server,
  Session,
  SubscriptionInfo,
  Ticket,
  TicketMessage,
} from './types';

export const DEMO_EMAIL = 'demo@aegisvpn.local';
export const DEMO_PASSWORD = 'DemoPass123';
const DEMO_KEY = 'aegis.demo';

export function isDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

export function enableDemoMode(): void {
  try {
    localStorage.setItem(DEMO_KEY, '1');
  } catch {
    /* storage unavailable: demo still works until first reload */
  }
}

export function disableDemoMode(): void {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------- in-memory dataset (mirrors backend/seed/demo.ts) ---------- */

const start = Date.now();
const iso = (offsetMs = 0): string => new Date(start + offsetMs).toISOString();
const minutesAgo = (m: number): string => iso(-m * 60_000);
const daysAgo = (d: number): string => iso(-d * 86_400_000);
const daysFromNow = (d: number): string => iso(d * 86_400_000);

interface DemoUser {
  email: string;
  name: string;
}

const user: DemoUser = { email: DEMO_EMAIL, name: 'Demo User' };

const currentDevice: Device = {
  id: 'dev-demo-current',
  name: 'Web browser',
  platform: 'web',
  status: 'active',
  lastActiveAt: iso(),
  createdAt: iso(),
  session: null,
};

const devices: Device[] = [
  currentDevice,
  {
    id: 'dev-demo-pixel8',
    name: 'Pixel 8',
    platform: 'android',
    status: 'active',
    lastActiveAt: minutesAgo(150),
    createdAt: daysAgo(30),
    session: null,
  },
  {
    id: 'dev-demo-mbp',
    name: 'MacBook Pro',
    platform: 'macos',
    status: 'active',
    lastActiveAt: daysAgo(40),
    createdAt: daysAgo(120),
    session: null,
  },
];

const servers: Server[] = [
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

const sessions: Session[] = [
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

const plans: Plan[] = [
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

const tickets: Ticket[] = [];
const ticketMessages: Array<TicketMessage & { ticket_id: string }> = [];
let idCounter = 0;
const nextId = (prefix: string): string => `${prefix}-demo-${++idCounter}`;

/* ---------- helpers ---------- */

export class DemoError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DemoError';
  }
}

const jsonOk = <T,>(value: T): T => value;

function userPayload() {
  return { id: 'usr-demo-0001', email: user.email, name: user.name, role: 'user' as const, status: 'active' as const, createdAt: daysAgo(60) };
}

function authDevicePayload() {
  return {
    id: currentDevice.id,
    name: currentDevice.name,
    platform: currentDevice.platform,
    status: currentDevice.status as 'active',
    lastActiveAt: currentDevice.lastActiveAt,
    createdAt: currentDevice.createdAt,
  };
}

function fakeTokens() {
  return {
    accessToken: `demo-access-${Math.random().toString(36).slice(2)}`,
    refreshToken: `demo-refresh-${Math.random().toString(36).slice(2)}`,
  };
}

/** Artificial latency so spinners/busy states stay visible in demo mode. */
function latency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 200));
}

/* ---------- routing ---------- */

/**
 * Handles one control-plane request in demo mode.
 * `path` is contract-relative (e.g. "/auth/login"). Throws DemoError for
 * error responses; returns the parsed payload otherwise (undefined = 204).
 */
export async function demoRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  await latency();

  const segs = path.replace(/^\//, '').split('/');
  const [root, second] = segs;

  try {
    switch (`${method} ${root}`) {
      /* ---- auth ---- */
      case 'POST auth/login':
      case 'POST auth/register': {
        const req = (body ?? {}) as { email?: string; password?: string; name?: string };
        // Demo accepts any well-formed input; the fixture identity is used
        // for empty fields so "Explore demo mode" can sign in directly.
        user.email = req.email?.trim() || DEMO_EMAIL;
        if (req.name?.trim()) user.name = req.name.trim();
        currentDevice.lastActiveAt = iso();
        currentDevice.name = req.name?.trim() ? `Web — ${user.name}` : currentDevice.name;
        const idx = devices.findIndex((d) => d.id === currentDevice.id);
        if (idx >= 0) devices[idx] = { ...currentDevice };
        return jsonOk({
          user: userPayload(),
          device: authDevicePayload(),
          ...fakeTokens(),
        } satisfies AuthSuccessResponse as T);
      }
      case 'GET auth/me':
        return jsonOk({
          user: userPayload(),
          subscription,
          device: authDevicePayload(),
        } satisfies MeResponse as T);
      case 'POST auth/logout':
        return undefined as T;

      /* ---- devices ---- */
      case 'GET devices':
        return jsonOk({ devices: devices.map((d) => ({ ...d })) } as T);
      case 'PATCH devices': {
        const id = segs[1];
        const req = (body ?? {}) as { name?: string };
        const device = devices.find((d) => d.id === id);
        if (!device) throw new DemoError(404, 'NOT_FOUND', `No device '${id}' in demo data`);
        device.name = req.name?.trim() || device.name;
        device.lastActiveAt = iso();
        if (id === currentDevice.id) currentDevice.name = device.name;
        return jsonOk({ device: { ...device } } as T);
      }
      case 'DELETE devices': {
        const id = segs[1];
        if (id === currentDevice.id) {
          throw new DemoError(409, 'VALIDATION_ERROR', 'Cannot revoke the device you are using');
        }
        const idx = devices.findIndex((d) => d.id === id);
        if (idx < 0) throw new DemoError(404, 'NOT_FOUND', `No device '${id}' in demo data`);
        devices.splice(idx, 1);
        return undefined as T;
      }

      /* ---- servers ---- */
      case 'GET servers':
        return jsonOk({ servers: servers.map((s) => ({ ...s })) } as T);

      /* ---- sessions ---- */
      case 'GET sessions':
        return jsonOk({ sessions: sessions.map((s) => ({ ...s })) } as T);
      case 'DELETE sessions': {
        const id = segs[1];
        const session = sessions.find((s) => s.id === id && s.state !== 'closed');
        if (session) {
          session.state = 'closed';
          session.closedAt = iso();
        }
        return undefined as T;
      }

      /* ---- subscription ---- */
      case 'GET subscription':
        return jsonOk({ subscription } as T);
      case 'GET subscription/plans':
        return jsonOk({ plans: plans.map((p) => ({ ...p })) } as T);
      case 'POST subscription/checkout': {
        const req = (body ?? {}) as { planCode?: PlanCode };
        const plan = plans.find((p) => p.code === req.planCode);
        if (!plan) throw new DemoError(404, 'NOT_FOUND', `No plan '${req.planCode}' in demo data`);
        subscription = {
          plan: plan.code,
          status: 'active',
          currentPeriodEnd: daysFromNow(30),
          maxDevices: plan.maxDevices,
          simulatedPayment: true,
        };
        return jsonOk({ subscription } as T);
      }
      case 'POST subscription/cancel':
        subscription = { plan: 'free', status: 'active', currentPeriodEnd: null, maxDevices: 2 };
        return jsonOk({ subscription } as T);

      /* ---- support ---- */
      case 'GET tickets': {
        const id = segs[1];
        if (id) {
          const ticket = tickets.find((t) => t.id === id);
          if (!ticket) return undefined as T;
          return jsonOk({
            ticket: { ...ticket },
            messages: ticketMessages.filter((m) => m.ticket_id === id),
          } as T);
        }
        return jsonOk({ tickets: tickets.map((t) => ({ ...t })) } as T);
      }
      case 'POST tickets': {
        const req = (body ?? {}) as { subject?: string; message?: string };
        const ticket: Ticket = {
          id: nextId('tkt'),
          user_id: 'usr-demo-0001',
          subject: req.subject?.trim() || 'Support request',
          status: 'open',
          created_at: iso(),
          updated_at: iso(),
        };
        tickets.push(ticket);
        return jsonOk({ ticket: { id: ticket.id } } as T);
      }
      /* ---- notifications ---- */
      case 'GET notifications':
        return jsonOk({ notifications: [] } as T);
      case 'PATCH notifications':
        return undefined as T;

      /* ---- admin (demo user is not an admin: contract-faithful 403) ---- */
      default:
        if (root === 'admin') {
          throw new DemoError(403, 'FORBIDDEN', 'Admin area is not part of the demo dataset');
        }
        throw new DemoError(404, 'NOT_FOUND', `No demo handler for ${method} ${path}`);
    }
  } catch (e) {
    if (e instanceof DemoError) throw e;
    throw new DemoError(500, 'SERVER_ERROR', `Demo backend failure: ${(e as Error).message}`);
  }
}

/** Second segment disambiguation for tickets (list vs thread) lives above. */
export type DemoTicketThread = TicketThreadLike;
interface TicketThreadLike {
  ticket: Ticket;
  messages: TicketMessage[];
}
