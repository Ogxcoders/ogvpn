/*
 * Demo-backend contract tests: the offline demo must behave like the real
 * control plane for every route the UI exercises — success AND failure paths.
 * These tests run without any server (the demo backend is the SUT).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_EMAIL,
  DemoError,
  demoRequest,
  disableDemoMode,
  enableDemoMode,
  isDemoMode,
} from '../api/demoMode';
import type {
  AuthSuccessResponse,
  DevicesResponse,
  MeResponse,
  PlansResponse,
  ServersResponse,
  SessionsResponse,
  SubscriptionResponse,
} from '../api/types';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  disableDemoMode();
});

describe('demo mode flag', () => {
  it('starts disabled and persists enable/disable', () => {
    expect(isDemoMode()).toBe(false);
    enableDemoMode();
    expect(isDemoMode()).toBe(true);
    disableDemoMode();
    expect(isDemoMode()).toBe(false);
  });
});

describe('demo auth', () => {
  it('logs in with the fixture identity and returns tokens', async () => {
    const res = await demoRequest<AuthSuccessResponse>('POST', '/auth/login', {
      email: DEMO_EMAIL,
      password: 'DemoPass123',
    });
    expect(res.user.email).toBe(DEMO_EMAIL);
    expect(res.user.status).toBe('active');
    expect(res.accessToken).toMatch(/^demo-access-/);
    expect(res.refreshToken).toMatch(/^demo-refresh-/);
    expect(res.device.platform).toBe('web');
  });

  it('me() returns user + subscription + device after login', async () => {
    await demoRequest('POST', '/auth/login', { email: DEMO_EMAIL, password: 'x'.repeat(12) });
    const me = await demoRequest<MeResponse>('GET', '/auth/me');
    expect(me.user.email).toBe(DEMO_EMAIL);
    expect(me.subscription.plan).toBe('free');
    expect(me.device.id).toBe('dev-demo-current');
  });

  it('logout returns 204-style undefined', async () => {
    const res = await demoRequest('POST', '/auth/logout', { refreshToken: 'demo-refresh-x' });
    expect(res).toBeUndefined();
  });
});

describe('demo server matrix mirrors backend/seed/demo.ts', () => {
  it('lists 7 servers incl. maintenance, offline, drain and IPv4-only', async () => {
    const res = await demoRequest<ServersResponse>('GET', '/servers');
    expect(res.servers).toHaveLength(7);
    const statuses = res.servers.map((s) => s.status);
    expect(statuses).toContain('maintenance');
    expect(statuses).toContain('offline');
    expect(statuses).toContain('drain');
    const hel = res.servers.find((s) => s.code === 'fi-hel-01')!;
    expect(hel.supportsDualStack).toBe(false);
    expect(hel.ipv6Prefix).toBe('::/0');
  });
});

describe('demo devices', () => {
  it('renames a device and reflects it in the list', async () => {
    await demoRequest('PATCH', '/devices/dev-demo-pixel8', { name: 'Pixel 9' });
    const list = await demoRequest<DevicesResponse>('GET', '/devices');
    expect(list.devices.find((d) => d.id === 'dev-demo-pixel8')?.name).toBe('Pixel 9');
  });

  it('refuses to revoke the current device (409 VALIDATION_ERROR)', async () => {
    await expect(
      demoRequest('DELETE', '/devices/dev-demo-current'),
    ).rejects.toMatchObject({ status: 409, code: 'VALIDATION_ERROR' });
  });

  it('revokes another device and removes it', async () => {
    await demoRequest('DELETE', '/devices/dev-demo-mbp');
    const list = await demoRequest<DevicesResponse>('GET', '/devices');
    expect(list.devices.find((d) => d.id === 'dev-demo-mbp')).toBeUndefined();
  });

  it('404s for unknown devices', async () => {
    await expect(
      demoRequest('PATCH', '/devices/nope', { name: 'x' }),
    ).rejects.toBeInstanceOf(DemoError);
  });
});

describe('demo sessions', () => {
  it('seeds one connected session and can force-disconnect it', async () => {
    const list = await demoRequest<SessionsResponse>('GET', '/sessions');
    expect(list.sessions).toHaveLength(1);
    expect(list.sessions[0]!.state).toBe('connected');
    await demoRequest('DELETE', `/sessions/${list.sessions[0]!.id}`);
    const after = await demoRequest<SessionsResponse>('GET', '/sessions');
    expect(after.sessions[0]!.state).toBe('closed');
    expect(after.sessions[0]!.closedAt).toBeTruthy();
  });
});

describe('demo subscription', () => {
  it('checkouts premium with an explicitly simulated payment', async () => {
    const res = await demoRequest<SubscriptionResponse>('POST', '/subscription/checkout', {
      planCode: 'premium',
    });
    expect(res.subscription.plan).toBe('premium');
    expect(res.subscription.maxDevices).toBe(10);
    expect(res.subscription.simulatedPayment).toBe(true);
  });

  it('cancels back to free', async () => {
    await demoRequest('POST', '/subscription/checkout', { planCode: 'premium' });
    const res = await demoRequest<SubscriptionResponse>('POST', '/subscription/cancel');
    expect(res.subscription.plan).toBe('free');
    expect(res.subscription.maxDevices).toBe(2);
  });

  it('lists the free/premium plan catalog', async () => {
    const res = await demoRequest<PlansResponse>('GET', '/subscription/plans');
    expect(res.plans.map((p) => p.code).sort()).toEqual(['free', 'premium']);
  });
});

describe('demo honesty rules', () => {
  it('forbids the admin area with the contract error envelope (403)', async () => {
    await expect(demoRequest('GET', '/admin/stats')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('404s unknown routes', async () => {
    await expect(demoRequest('GET', '/definitely-not-a-route')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});
