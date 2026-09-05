/*
 * Demo-backend tests (desktop, main process): the offline demo must behave
 * like the real control plane for every route the renderer exercises —
 * success AND failure paths. No Electron imports; pure Node.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { demoApiRequest, DemoHttpError, demoMe } from '../electron/src/main/api/DemoBackend';
import { isDemoMode, setDemoMode } from '../electron/src/main/demoState';
import type { DeviceSummary, ServerInfo, SessionRow } from '../shared/ipc';

type ServersResponseShape = { servers: ServerInfo[] };
type DevicesResponseShape = { devices: DeviceSummary[] };
type SessionsResponseShape = { sessions: SessionRow[] };

beforeEach(() => {
  setDemoMode(true);
});

afterEach(() => {
  setDemoMode(false);
});

describe('demo mode flag', () => {
  it('defaults to off and round-trips', () => {
    setDemoMode(false);
    expect(isDemoMode()).toBe(false);
    setDemoMode(true);
    expect(isDemoMode()).toBe(true);
  });

  it('refuses demo API calls while the flag is off', async () => {
    setDemoMode(false);
    await expect(demoApiRequest('GET', '/servers')).rejects.toMatchObject({ status: 500 });
  });
});

describe('demo auth', () => {
  it('logs in and returns identity + tokens + free subscription', async () => {
    const res = await demoApiRequest<{
      user: { email: string };
      device: { platform: string };
      accessToken: string;
      refreshToken: string;
    }>('POST', '/auth/login', { email: 'demo@aegisvpn.local', password: 'DemoPass123' });
    expect(res.user.email).toBe('demo@aegisvpn.local');
    expect(res.device.platform).toBe('linux');
    expect(res.accessToken).toMatch(/^demo-access-/);
    const me = demoMe();
    expect(me.subscription.plan).toBe('free');
  });
});

describe('demo server matrix', () => {
  it('lists 7 servers incl. maintenance, offline, drain, IPv4-only', async () => {
    const res = await demoApiRequest<ServersResponseShape>('GET', '/servers');
    expect(res.servers).toHaveLength(7);
    const statuses = res.servers.map((s) => s.status);
    expect(statuses).toContain('maintenance');
    expect(statuses).toContain('offline');
    expect(statuses).toContain('drain');
    const hel = res.servers.find((s) => s.code === 'fi-hel-01')!;
    expect(hel.supportsDualStack).toBe(false);
  });
});

describe('demo vpn provisioning', () => {
  it('provisions a tunnel on an active server', async () => {
    const res = await demoApiRequest<{ tunnel: { id: string; endpointHost: string } }>('POST', '/vpn/peers', {
      deviceId: 'dev-demo-current',
      serverId: 'srv-nl-ams-01',
      publicKey: 'pubkey-of-the-day',
    });
    expect(res.tunnel.endpointHost).toBe('ams01.demo.aegisvpn.local');
    expect(res.tunnel.id).toMatch(/^tun-demo-/);
  });

  it('honestly refuses maintenance/offline servers with SERVER_UNAVAILABLE', async () => {
    await expect(
      demoApiRequest('POST', '/vpn/peers', { deviceId: 'd', serverId: 'srv-sg-sin-01' }),
    ).rejects.toMatchObject({ status: 503, code: 'SERVER_UNAVAILABLE' });
    await expect(
      demoApiRequest('POST', '/vpn/peers', { deviceId: 'd', serverId: 'srv-jp-tyo-01' }),
    ).rejects.toBeInstanceOf(DemoHttpError);
  });

  it('tearing the tunnel down closes the session', async () => {
    const created = await demoApiRequest<{ tunnel: { id: string; serverId: string } }>('POST', '/vpn/peers', {
      deviceId: 'dev-demo-current',
      serverId: 'srv-de-fra-01',
      publicKey: 'k',
    });
    await demoApiRequest('DELETE', `/vpn/peers/${created.tunnel.id}`);
    const sessions = await demoApiRequest<SessionsResponseShape>('GET', '/sessions');
    const fra = sessions.sessions.filter((s) => s.serverId === 'srv-de-fra-01');
    expect(fra.every((s) => s.state === 'closed')).toBe(true);
  });
});

describe('demo devices', () => {
  it('renames and revokes, but protects the current device', async () => {
    await demoApiRequest('PATCH', '/devices/dev-demo-pixel8', { name: 'Pixel 9' });
    const list = await demoApiRequest<DevicesResponseShape>('GET', '/devices');
    expect(list.devices.find((d) => d.id === 'dev-demo-pixel8')?.name).toBe('Pixel 9');

    await expect(
      demoApiRequest('DELETE', '/devices/dev-demo-current'),
    ).rejects.toMatchObject({ status: 409, code: 'VALIDATION_ERROR' });

    await demoApiRequest('DELETE', '/devices/dev-demo-mbp');
    const after = await demoApiRequest<DevicesResponseShape>('GET', '/devices');
    expect(after.devices.find((d) => d.id === 'dev-demo-mbp')).toBeUndefined();
  });
});

describe('demo subscription + honesty', () => {
  it('checkouts premium and cancels back to free', async () => {
    const up = await demoApiRequest<{ subscription: { plan: string; maxDevices: number } }>(
      'POST', '/subscription/checkout', { planCode: 'premium' },
    );
    expect(up.subscription.plan).toBe('premium');
    expect(up.subscription.maxDevices).toBe(10);
    const down = await demoApiRequest<{ subscription: { plan: string } }>('POST', '/subscription/cancel');
    expect(down.subscription.plan).toBe('free');
  });

  it('forbids admin routes (403) and 404s unknown ones', async () => {
    await expect(demoApiRequest('GET', '/admin/stats')).rejects.toMatchObject({ status: 403 });
    await expect(demoApiRequest('GET', '/nope')).rejects.toMatchObject({ status: 404 });
  });
});
