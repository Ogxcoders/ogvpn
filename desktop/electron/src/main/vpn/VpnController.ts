import { app } from 'electron';
import { AegisApi, DEFAULT_API_BASE_URL, ApiError, platformName } from '../api/AegisApi';
import { TokenStore } from '../api/TokenStore';
import { EventStream, type StreamEvent } from '../sse/EventStream';
import { buildWgQuickConf, ConfBuildError } from './buildConf';
import { createAdapterForPlatform, type AdapterStatus, type WireGuardAdapter } from './adapters';
import { KillSwitchManager } from './killSwitch';
import { StateMachine } from './StateMachine';
import type {
  AppEvent,
  AuthIdentity,
  ServerInfo,
  SettingsMap,
  TunnelInfo,
  VpnStatusSnapshot,
} from '../../../../shared/ipc';

type TunnelWithKey = TunnelInfo & { privateKey: string };

export interface ControllerEvents {
  emit(event: AppEvent): void;
}

const HANDSHAKE_FRESH_SEC = 180;
const RECONNECT_BACKOFF_MS = [1000, 2000, 5000, 10000, 30000];

/**
 * Owns everything VPN in the main process: the state machine, the platform
 * adapter, the active tunnel + its in-memory private key, network-loss
 * detection, reconnect backoff and the kill switch. The renderer only ever
 * sees status snapshots and AppEvents — never tokens, keys or commands.
 */
export class VpnController {
  private machine = new StateMachine('IDLE');
  private adapter: WireGuardAdapter;
  private killSwitch = new KillSwitchManager();
  private events: EventStream;
  private tunnel: TunnelWithKey | null = null;
  private server: ServerInfo | null = null;
  private identity: AuthIdentity | null = null;
  private connectedSince: string | null = null;
  private lastError: string | null = null;
  private killSwitchActive = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private monitorTimer: NodeJS.Timeout | null = null;
  private recentErrors: { at: string; message: string }[] = [];
  private settings: SettingsMap = {
    killSwitch: true,
    autoLaunch: false,
    autoConnect: false,
    closeToTray: true,
    apiBaseUrl: DEFAULT_API_BASE_URL,
  };

  constructor(
    readonly api: AegisApi,
    private readonly tokens: TokenStore,
    private readonly out: ControllerEvents,
    private readonly settingsLoader: { load(): Promise<Partial<SettingsMap>>; save(map: SettingsMap): Promise<void> },
  ) {
    this.adapter = createAdapterForPlatform(process.platform);
    this.events = new EventStream(
      () => this.settings.apiBaseUrl,
      () => this.tokens.getAccessToken(),
    );
    this.events.on('event', (e: StreamEvent) => void this.onServerEvent(e));
    this.machine.onChange((_from, _to) => this.publishSnapshot());
  }

  // ---- lifecycle ----

  async init(): Promise<void> {
    const loaded = await this.settingsLoader.load();
    this.settings = { ...this.settings, ...loaded };
    if (this.settings.killSwitch === false && this.killSwitch.isActive()) {
      await this.killSwitch.remove().catch(() => undefined);
    }
    await this.restoreIdentity();
    this.startMonitor();
  }

  private async restoreIdentity(): Promise<void> {
    try {
      this.identity = await this.api.me();
      if (this.identity) {
        this.out.emit({ type: 'auth-changed', authenticated: true });
        this.out.emit({ type: 'entitlements', subscription: this.identity.subscription });
      }
    } catch {
      this.identity = null;
    }
  }

  getSnapshot(): VpnStatusSnapshot {
    return {
      state: this.machine.state,
      serverId: this.server?.id ?? null,
      serverName: this.server ? `${this.server.name} · ${this.server.city}, ${this.server.country}` : null,
      tunnelId: this.tunnel?.id ?? null,
      addressV4: this.tunnel?.addressV4 ?? null,
      addressV6: this.tunnel?.addressV6 ?? null,
      handshakeAgoSec: this.handshakeAgoSec,
      rxBytes: this.lastStatus?.rxBytes ?? 0,
      txBytes: this.lastStatus?.txBytes ?? 0,
      connectedSince: this.connectedSince,
      lastError: this.lastError,
      killSwitchActive: this.killSwitchActive,
    };
  }

  private handshakeAgoSec: number | null = null;
  private lastStatus: AdapterStatus | null = null;

  private publishSnapshot(): void {
    this.out.emit({ type: 'vpn-state', snapshot: this.getSnapshot() });
  }

  private recordError(message: string): void {
    this.lastError = message;
    this.recentErrors.unshift({ at: new Date().toISOString(), message });
    this.recentErrors = this.recentErrors.slice(0, 20);
    this.out.emit({ type: 'notice', level: 'error', message });
    this.publishSnapshot();
  }

  // ---- auth ----

  async login(email: string, password: string): Promise<LoginOut> {
    const result = await this.api.login(email, password);
    await this.postAuth(result.user.id);
    return result;
  }

  async register(email: string, password: string, name: string): Promise<LoginOut> {
    const result = await this.api.register(email, password, name);
    await this.postAuth(result.user.id);
    return result;
  }

  private async postAuth(_userId: string): Promise<void> {
    this.identity = await this.api.me().catch(() => null);
    this.out.emit({ type: 'auth-changed', authenticated: true });
    this.out.emit({ type: 'entitlements', subscription: this.identity?.subscription ?? null });
    this.startEventStream();
    if (this.settings.autoConnect) {
      await this.connectToBestServer().catch((e: unknown) => {
        this.recordError(`Auto-connect failed: ${(e as Error).message}`);
      });
    }
  }

  async logout(): Promise<void> {
    await this.disconnect('logout');
    await this.api.logout();
    this.identity = null;
    this.events.stop();
    this.out.emit({ type: 'auth-changed', authenticated: false });
  }

  async me(): Promise<AuthIdentity | null> {
    if (this.identity) return this.identity;
    await this.restoreIdentity();
    return this.identity;
  }

  // ---- connect / disconnect ----

  async connect(serverId: string): Promise<void> {
    if (!this.identity) {
      this.machine.tryTransition('AUTH_REQUIRED');
      throw new ApiError(401, 'UNAUTHORIZED', 'Sign in first');
    }
    const available = await this.adapter.isAvailable();
    if (!available) {
      this.machine.tryTransition('CONFIGURATION_ERROR');
      this.recordError('WireGuard tooling not found. Install WireGuard and see desktop/README.md.');
      return;
    }

    this.machine.tryTransition('PREPARING');
    try {
      // Reuse the active tunnel if it points at this server; else provision.
      if (!this.tunnel || this.tunnel.serverId !== serverId) {
        if (this.tunnel) await this.teardownTunnel();
        await this.provisionTunnel(serverId);
      }
      await this.bringUpTunnel();
    } catch (e) {
      this.handleConnectFailure(e);
      throw e;
    }
  }

  async connectToBestServer(): Promise<void> {
    const servers = await this.api.listServers();
    const candidates = servers
      .filter((s) => s.status === 'active')
      .sort((a, b) => a.loadPct - b.loadPct);
    if (candidates.length === 0) {
      this.machine.tryTransition('SERVER_UNAVAILABLE');
      this.recordError('No active servers available');
      return;
    }
    await this.connect(candidates[0]!.id);
  }

  private async provisionTunnel(serverId: string): Promise<void> {
    if (!this.identity) throw new ApiError(401, 'UNAUTHORIZED', 'Not signed in');
    const servers = await this.api.listServers();
    this.server = servers.find((s) => s.id === serverId) ?? null;
    if (!this.server) throw new ApiError(404, 'NOT_FOUND', 'Server not found');
    if (this.server.status !== 'active') {
      this.machine.tryTransition('SERVER_UNAVAILABLE');
      throw new ApiError(503, 'SERVER_UNAVAILABLE', `Server is ${this.server.status}`);
    }
    this.machine.tryTransition('CONNECTING');
    const { tunnel } = await this.api.createPeer(serverId, this.identity.device.id);
    this.tunnel = tunnel as TunnelWithKey;
  }

  private async bringUpTunnel(): Promise<void> {
    if (!this.tunnel) throw new Error('No tunnel provisioned');
    this.machine.tryTransition('CONNECTING');
    const conf = buildWgQuickConf(this.tunnel, this.tunnel.privateKey);
    // Fail-closed: the kill switch is enforced BEFORE the tunnel so no traffic
    // can leak during the handshake.
    if (this.settings.killSwitch) {
      await this.killSwitch
        .apply({
          interfaceName: this.adapter.interfaceName,
          endpointHost: this.tunnel.endpointHost,
          endpointPort: this.tunnel.endpointPort,
          tunnelLocalIp: this.tunnel.addressV4,
        })
        .catch((e: unknown) => {
          this.recordError(`Kill switch could not be applied: ${(e as Error).message}`);
        });
      this.killSwitchActive = this.killSwitch.isActive();
    }
    await this.adapter.up(conf);
    this.connectedSince = new Date().toISOString();
    this.reconnectAttempts = 0;
    // Handshake confirmation flips CONNECTING → HANDSHAKING → CONNECTED.
    await this.waitForHandshake();
  }

  private async waitForHandshake(): Promise<void> {
    this.machine.tryTransition('HANDSHAKING');
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const st = await this.adapter.status().catch(() => null);
      if (st && st.handshakeAgoSec !== null && st.handshakeAgoSec <= HANDSHAKE_FRESH_SEC) {
        this.lastStatus = st;
        this.handshakeAgoSec = st.handshakeAgoSec;
        this.machine.tryTransition('CONNECTED');
        this.publishSnapshot();
        return;
      }
      await sleep(1000);
    }
    // No handshake in 15s: treat as server failure.
    this.machine.tryTransition('SERVER_UNAVAILABLE');
    throw new ApiError(504, 'UPSTREAM_TIMEOUT', 'WireGuard handshake timed out');
  }

  private handleConnectFailure(e: unknown): void {
    const err = e as ApiError;
    if (err instanceof ApiError) {
      if (err.code === 'SERVER_UNAVAILABLE' || err.code === 'UPSTREAM_TIMEOUT') {
        this.machine.tryTransition('SERVER_UNAVAILABLE');
      } else if (err.code === 'UNAUTHORIZED') {
        this.machine.tryTransition('AUTH_REQUIRED');
      } else {
        this.machine.tryTransition('ERROR');
      }
    } else if (e instanceof ConfBuildError) {
      this.machine.tryTransition('CONFIGURATION_ERROR');
    } else {
      this.machine.tryTransition('ERROR');
    }
    this.recordError(err.message ?? 'Connect failed');
  }

  async disconnect(reason = 'user'): Promise<void> {
    this.stopReconnect();
    if (['IDLE', 'DISCONNECTED'].includes(this.machine.state)) return;
    this.machine.tryTransition('DISCONNECTING');
    await this.teardownTunnel();
    this.machine.tryTransition('DISCONNECTED');
    this.connectedSince = null;
    if (reason !== 'logout') this.publishSnapshot();
  }

  private async teardownTunnel(): Promise<void> {
    if (this.killSwitch.isActive()) {
      await this.killSwitch.remove().catch(() => undefined);
      this.killSwitchActive = false;
    }
    if (this.tunnel) {
      await this.adapter.down().catch(() => undefined);
      await this.api.deletePeer(this.tunnel.id).catch(() => undefined);
      this.tunnel = null;
    }
    this.handshakeAgoSec = null;
    this.lastStatus = null;
  }

  resetError(): VpnStatusSnapshot {
    if (isResting(this.machine.state)) {
      this.machine.tryTransition('IDLE');
      this.lastError = null;
      this.publishSnapshot();
    }
    return this.getSnapshot();
  }

  // ---- resilience ----

  private startMonitor(): void {
    this.monitorTimer = setInterval(() => void this.monitorOnce(), 10_000);
    this.monitorTimer.unref?.();
  }

  private async monitorOnce(): Promise<void> {
    if (this.machine.state === 'CONNECTED' && this.tunnel) {
      const st = await this.adapter.status().catch(() => null);
      if (st) {
        this.lastStatus = st;
        this.handshakeAgoSec = st.handshakeAgoSec;
        if (st.handshakeAgoSec !== null && st.handshakeAgoSec > HANDSHAKE_FRESH_SEC && st.rxBytes === (this.lastStatus?.rxBytes ?? 0)) {
          // Tunnel stale — schedule reconnect.
          this.machine.tryTransition('RECONNECTING');
          this.scheduleReconnect();
        } else {
          this.publishSnapshot();
        }
      } else {
        this.machine.tryTransition('RECONNECTING');
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.tunnel) return;
    const delay = RECONNECT_BACKOFF_MS[Math.min(this.reconnectAttempts, RECONNECT_BACKOFF_MS.length - 1)]!;
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void (async () => {
        if (!this.tunnel) return;
        const serverId = this.tunnel.serverId;
        await this.teardownTunnel();
        try {
          await this.provisionTunnel(serverId);
          await this.bringUpTunnel();
        } catch (e) {
          this.recordError(`Reconnect failed: ${(e as Error).message}`);
          this.scheduleReconnect();
        }
      })();
    }, delay);
    this.reconnectTimer.unref?.();
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  // ---- event stream ----

  private startEventStream(): void {
    this.events.stop();
    this.events = new EventStream(
      () => this.settings.apiBaseUrl,
      () => this.tokens.getAccessToken(),
    );
    this.events.on('event', (e: StreamEvent) => void this.onServerEvent(e));
    this.events.start();
  }

  private async onServerEvent(e: StreamEvent): Promise<void> {
    switch (e.event) {
      case 'device.revoked':
      case 'account.disabled': {
        await this.disconnect('revoked');
        await this.logout();
        this.out.emit({ type: 'force-logout', reason: 'This device was revoked from your account.' });
        break;
      }
      case 'session.force-disconnect': {
        await this.disconnect('forced');
        this.out.emit({ type: 'notice', level: 'warn', message: 'Your VPN session was remotely disconnected.' });
        break;
      }
      case 'server.changed': {
        const servers = await this.api.listServers().catch(() => [] as ServerInfo[]);
        const updated = servers.find((s) => s.id === (e.data as { serverId?: string }).serverId);
        if (updated && this.machine.state === 'CONNECTED' && this.tunnel?.serverId === updated.id && updated.status !== 'active') {
          // Our server left active duty — fail over.
          await this.disconnect('server-changed');
          await this.connectToBestServer().catch(() => undefined);
        }
        break;
      }
      case 'subscription.changed': {
        const sub = await this.api.getSubscription().catch(() => null);
        this.out.emit({ type: 'entitlements', subscription: sub });
        break;
      }
      case 'config.updated':
      case 'ping':
      default:
        break;
    }
  }

  // ---- settings / diagnostics ----

  async setSetting(key: keyof SettingsMap, value: boolean | string): Promise<SettingsMap> {
    if (key === 'killSwitch') {
      const on = Boolean(value);
      this.settings.killSwitch = on;
      if (!on && this.killSwitch.isActive()) {
        await this.killSwitch.remove().catch(() => undefined);
        this.killSwitchActive = false;
      }
    } else if (key === 'autoLaunch') {
      app.setLoginItemSettings({ openAtLogin: Boolean(value) });
      this.settings.autoLaunch = Boolean(value);
    } else if (key === 'apiBaseUrl') {
      this.settings.apiBaseUrl = String(value) || DEFAULT_API_BASE_URL;
    } else if (key === 'autoConnect' || key === 'closeToTray') {
      this.settings[key] = Boolean(value);
    }
    await this.settingsLoader.save(this.settings);
    this.publishSnapshot();
    return { ...this.settings };
  }

  getSettings(): SettingsMap {
    return { ...this.settings };
  }

  async diagnostics(): Promise<{
    appVersion: string;
    platform: string;
    apiBaseUrl: string;
    state: VpnStatusSnapshot['state'];
    wg: { available: boolean; interfaceName: string; dumpSanitized: string | null };
    killSwitchActive: boolean;
    recentErrors: { at: string; message: string }[];
  }> {
    const available = await this.adapter.isAvailable().catch(() => false);
    const dump = available ? await this.adapter.dumpSanitized().catch(() => null) : null;
    return {
      appVersion: app.getVersion(),
      platform: `${platformName()} (${process.platform})`,
      apiBaseUrl: this.settings.apiBaseUrl,
      state: this.machine.state,
      wg: { available, interfaceName: this.adapter.interfaceName, dumpSanitized: dump },
      killSwitchActive: this.killSwitchActive,
      recentErrors: this.recentErrors,
    };
  }
}

export type LoginOut = { user: AuthIdentity['user']; device: AuthIdentity['device']; subscription: AuthIdentity['subscription'] };

function isResting(state: VpnStatusSnapshot['state']): boolean {
  return ['ERROR', 'OFFLINE', 'SERVER_UNAVAILABLE', 'CONFIGURATION_ERROR', 'AUTH_REQUIRED', 'DISCONNECTED'].includes(state);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
