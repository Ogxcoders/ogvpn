/**
 * AegisVPN — shared IPC contract between the Electron main process and the
 * sandboxed renderer. This file is the single source of truth for the shapes
 * crossing the contextBridge. Field names mirror docs/API-CONTRACT.md v1
 * exactly (accessToken/refreshToken never cross this boundary — the renderer
 * is unprivileged and never sees tokens or private keys).
 */

export type ClientPlatform = 'android' | 'windows' | 'macos' | 'linux' | 'web';

/** VPN state machine states — mirror the backend contract state vocabulary. */
export type VpnState =
  | 'IDLE'
  | 'PREPARING'
  | 'CONNECTING'
  | 'HANDSHAKING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTING'
  | 'DISCONNECTED'
  | 'ERROR'
  | 'OFFLINE'
  | 'AUTH_REQUIRED'
  | 'VPN_PERMISSION_REQUIRED'
  | 'SERVER_UNAVAILABLE'
  | 'CONFIGURATION_ERROR';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'disabled' | 'deleted';
  createdAt: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  platform: ClientPlatform;
  lastActiveAt: string;
  status: string;
}

export interface SubscriptionInfo {
  plan: string;
  status: 'active' | 'canceled' | 'expired' | 'past_due' | 'free';
  currentPeriodEnd: string | null;
  maxDevices: number;
}

export interface PlanInfo {
  code: string;
  name: string;
  priceCents: number;
  interval: string;
  maxDevices: number;
  features: string[];
}

export interface ServerInfo {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  host: string;
  port: number;
  publicKey: string;
  dns: string | null;
  status: 'active' | 'maintenance' | 'drain' | 'offline';
  loadPct: number;
  capacity: number;
  tunnelCount?: number;
  ipv4Prefix: string | null;
  ipv6Prefix: string | null;
  supportsDualStack: boolean;
  lastHeartbeatAt: string | null;
}

/** WireGuard tunnel as provisioned by POST /vpn/peers (client-side private key). */
export interface TunnelInfo {
  id: string;
  addressV4: string;
  addressV6: string | null;
  serverPublicKey: string;
  endpointHost: string;
  endpointPort: number;
  allowedIps: string[];
  dns: string | null;
  mtu: number;
  keepalive: number;
  serverId: string;
}

/** GET /devices rows — device plus optional active session + tunnel summary. */
export interface DeviceSummary extends DeviceInfo {
  session: {
    id: string;
    state: string;
    serverId: string | null;
    serverName: string | null;
    connectedAt: string | null;
  } | null;
  tunnel: {
    id: string;
    serverId: string | null;
    serverName: string | null;
  } | null;
}

export interface SessionRow {
  id: string;
  state: 'connected' | 'reconnecting' | 'closed' | 'failed';
  deviceId: string;
  deviceName: string;
  serverId: string;
  serverName: string;
  connectedAt: string;
  closedAt: string | null;
  bytesIn: number;
  bytesOut: number;
}

export interface VpnStatusSnapshot {
  state: VpnState;
  serverId: string | null;
  serverName: string | null;
  tunnelId: string | null;
  addressV4: string | null;
  addressV6: string | null;
  handshakeAgoSec: number | null;
  rxBytes: number;
  txBytes: number;
  connectedSince: string | null;
  lastError: string | null;
  killSwitchActive: boolean;
}

export type AppEvent =
  | { type: 'vpn-state'; snapshot: VpnStatusSnapshot }
  | { type: 'entitlements'; subscription: SubscriptionInfo | null }
  | { type: 'auth-changed'; authenticated: boolean }
  | { type: 'notice'; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'force-logout'; reason: string };

export type SettingKey =
  | 'killSwitch'
  | 'autoLaunch'
  | 'autoConnect'
  | 'closeToTray'
  | 'apiBaseUrl';

export interface SettingsMap {
  killSwitch: boolean;
  autoLaunch: boolean;
  autoConnect: boolean;
  closeToTray: boolean;
  apiBaseUrl: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceName?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  deviceName?: string;
}

export interface LoginResult {
  user: UserProfile;
  device: DeviceInfo;
  subscription: SubscriptionInfo | null;
}

export interface AuthIdentity {
  user: UserProfile;
  device: DeviceInfo;
  subscription: SubscriptionInfo | null;
}

export interface CreatePeerResult {
  tunnel: TunnelInfo;
}

export interface DiagnosticsReport {
  appVersion: string;
  platform: string;
  apiBaseUrl: string;
  state: VpnState;
  wg: {
    available: boolean;
    interfaceName: string;
    dumpSanitized: string | null;
  };
  killSwitchActive: boolean;
  recentErrors: { at: string; message: string }[];
}

export type Unsubscribe = () => void;

/**
 * The complete surface exposed to the renderer as `window.aegis` via
 * contextBridge. Every method is implemented in the main process with an
 * ipcMain.handle handler; no renderer code can reach Node/Electron APIs.
 */
export interface AegisBridge {
  login(req: LoginRequest): Promise<LoginResult>;
  register(req: RegisterRequest): Promise<LoginResult>;
  logout(): Promise<void>;
  me(): Promise<AuthIdentity | null>;
  listServers(): Promise<ServerInfo[]>;
  createPeer(serverId: string): Promise<CreatePeerResult>;
  connect(serverId: string): Promise<void>;
  disconnect(): Promise<void>;
  status(): Promise<VpnStatusSnapshot>;
  /** Clear an ERROR/OFFLINE/... resting failure state back to IDLE. */
  resetError(): Promise<VpnStatusSnapshot>;
  onEvent(cb: (e: AppEvent) => void): Unsubscribe;
  onNavigate(cb: (route: string) => void): Unsubscribe;
  listDevices(): Promise<DeviceSummary[]>;
  renameDevice(deviceId: string, name: string): Promise<DeviceInfo>;
  revokeDevice(deviceId: string): Promise<void>;
  getSubscription(): Promise<SubscriptionInfo>;
  checkout(planCode: string): Promise<SubscriptionInfo>;
  setSetting(key: SettingKey, value: boolean | string): Promise<SettingsMap>;
  getSetting(key: SettingKey): Promise<boolean | string | null>;
  getAllSettings(): Promise<SettingsMap>;
  /** Offline demo mode: label honestly, no real tunnel behind it. */
  demoEnable(): Promise<boolean>;
  demoDisable(): Promise<boolean>;
  demoStatus(): Promise<boolean>;
  getDiagnostics(): Promise<DiagnosticsReport>;
}

export const BRIDGE_NAME = 'aegis';

export const IPC_CHANNELS = {
  authLogin: 'auth:login',
  authRegister: 'auth:register',
  authLogout: 'auth:logout',
  authMe: 'auth:me',
  serversList: 'servers:list',
  vpnCreatePeer: 'vpn:createPeer',
  vpnConnect: 'vpn:connect',
  vpnDisconnect: 'vpn:disconnect',
  vpnStatus: 'vpn:status',
  vpnResetError: 'vpn:resetError',
  devicesList: 'devices:list',
  devicesRename: 'devices:rename',
  devicesRevoke: 'devices:revoke',
  subscriptionGet: 'subscription:get',
  subscriptionCheckout: 'subscription:checkout',
  settingsSet: 'settings:set',
  settingsGet: 'settings:get',
  settingsAll: 'settings:all',
  demoEnable: 'demo:enable',
  demoDisable: 'demo:disable',
  demoStatus: 'demo:status',
  diagnosticsGet: 'diagnostics:get'
} as const;

/** Channel used to fan main-process AppEvents out to the renderer. */
export const IPC_EVENT_CHANNEL = 'aegis:event';
/** Channel used by the app menu to ask the renderer to navigate. */
export const IPC_NAVIGATE_CHANNEL = 'aegis:navigate';
