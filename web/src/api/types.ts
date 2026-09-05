/*
 * TypeScript types mirroring docs/API-CONTRACT.md v1 (frozen).
 * Field names MUST match the contract exactly — do not rename.
 * A few endpoints (notifications, tickets, admin lists) return raw
 * backend rows with snake_case fields; those are typed as such.
 */

export type Platform = 'android' | 'windows' | 'macos' | 'linux' | 'web';
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled' | 'deleted';
export type DeviceStatus = 'active' | 'revoked';
export type ServerStatus = 'active' | 'maintenance' | 'drain' | 'offline';
export type SessionState = 'connected' | 'reconnecting' | 'closed' | 'failed';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due' | 'free';
export type PlanCode = 'free' | 'premium';
export type TicketStatus = 'open' | 'waiting' | 'resolved';

/* ---------- Core entities (contract) ---------- */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  /** Present per contract; the backend currently omits it in /auth payloads. */
  createdAt?: string;
}

export interface DeviceSession {
  id: string;
  state: SessionState;
  tunnelId: string;
  serverId: string;
}

export interface Device {
  id: string;
  name: string;
  platform: Platform;
  status: DeviceStatus;
  lastActiveAt: string | null;
  createdAt?: string;
  session?: DeviceSession | null;
}

/** Device payload as returned by the /auth endpoints (raw row, snake_case extras). */
export interface AuthDevice {
  id: string;
  name: string;
  platform: Platform;
  status: DeviceStatus;
  lastActiveAt?: string | null;
  last_active_at?: string | null;
  createdAt?: string;
  created_at?: string;
}

/** Normalises the raw auth-device row into the canonical Device shape. */
export function normaliseDevice(raw: AuthDevice): Device {
  return {
    id: raw.id,
    name: raw.name,
    platform: raw.platform,
    status: raw.status,
    lastActiveAt: raw.lastActiveAt ?? raw.last_active_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    session: null,
  };
}

export interface Server {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  host: string;
  port: number;
  publicKey: string;
  dns: string;
  status: ServerStatus;
  loadPct: number;
  capacity: number;
  tunnelCount: number;
  ipv4Prefix: string;
  ipv6Prefix: string;
  supportsDualStack: boolean;
  lastHeartbeatAt: string | null;
}

export interface Session {
  id: string;
  state: SessionState;
  deviceId: string;
  deviceName: string;
  serverId: string;
  serverName: string;
  connectedAt: string;
  closedAt: string | null;
  bytesIn: number;
  bytesOut: number;
}

export interface SubscriptionInfo {
  plan: PlanCode;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  maxDevices?: number;
  /** Demo-mode checkout marks the payment as simulated. */
  simulatedPayment?: boolean;
}

export interface Plan {
  code: PlanCode;
  name: string;
  priceCents: number;
  interval: 'month' | 'year';
  maxDevices: number;
  features: string[];
}

/** Raw backend row for /notifications (snake_case per implementation). */
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
}

/* ---------- Admin entities (raw backend rows) ---------- */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface AdminServer {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  host: string;
  port: number;
  status: ServerStatus | 'retired';
  capacity: number;
  last_heartbeat_at: string | null;
  ipv4_prefix: string;
  ipv6_prefix: string;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: string | null;
  created_at: string;
}

export interface AdminStats {
  users: number;
  devices: number;
  activeSessions: number;
  tunnelsByServer: { server_id: string; c: number }[];
  subscriptions: { plan: string; c: number }[];
}

/* ---------- Response envelopes ---------- */

export interface AuthSuccessResponse {
  user: User;
  device: AuthDevice;
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  user: User;
  subscription: SubscriptionInfo;
  device: AuthDevice;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface DevicesResponse {
  devices: Device[];
}

export interface ServersResponse {
  servers: Server[];
}

export interface SessionsResponse {
  sessions: Session[];
}

export interface SubscriptionResponse {
  subscription: SubscriptionInfo;
}

export interface PlansResponse {
  plans: Plan[];
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface TicketsResponse {
  tickets: Ticket[];
}

export interface TicketThreadResponse {
  ticket: Ticket;
  messages: TicketMessage[];
}

export interface AdminUsersResponse {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
}

export interface AdminServersResponse {
  servers: AdminServer[];
}

export interface AdminStatsResponse extends AdminStats {}

export interface AdminAuditResponse {
  entries: AuditEntry[];
  page: number;
  limit: number;
}

/** POST /admin/servers — the plaintext agentToken is returned exactly once. */
export interface AdminCreateServerResponse {
  server: {
    id: string;
    code: string;
    name: string;
    country: string;
    city: string;
    host: string;
    port: number;
    publicKey: string;
    capacity: number;
    ipv4Prefix: string;
    ipv6Prefix: string;
    dns: string;
    status: ServerStatus | 'offline';
  };
  agentToken: string;
}
