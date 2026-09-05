import { describe, it, expect } from 'vitest';
import { buildWgQuickConf, ConfBuildError, DEFAULT_MTU } from '../electron/src/main/vpn/buildConf';
import { generateWgKeypair } from '../electron/src/main/keys';
import type { TunnelInfo } from '../shared/ipc';

function makeTunnel(overrides: Partial<TunnelInfo> = {}): TunnelInfo {
  return {
    id: 't-1',
    addressV4: '10.13.0.5',
    addressV6: 'fd00:5::5',
    serverPublicKey: generateWgKeypair().publicKey,
    endpointHost: 'ams01.demo.aegisvpn.local',
    endpointPort: 51820,
    allowedIps: ['0.0.0.0/0', '::/0'],
    dns: '10.13.0.1',
    mtu: 1420,
    keepalive: 25,
    serverId: 'srv-1',
    ...overrides,
  };
}

describe('wg-quick config builder', () => {
  it('emits a complete standard conf', () => {
    const kp = generateWgKeypair();
    const conf = buildWgQuickConf(makeTunnel(), kp.privateKey);
    expect(conf).toContain('[Interface]');
    expect(conf).toContain('[Peer]');
    expect(conf).toContain('Address = 10.13.0.5, fd00:5::5');
    expect(conf).toContain('DNS = 10.13.0.1');
    expect(conf).toContain(`MTU = ${DEFAULT_MTU}`);
    expect(conf).toContain(`PrivateKey = ${kp.privateKey}`);
    expect(conf).toContain('Endpoint = ams01.demo.aegisvpn.local:51820');
    expect(conf).toContain('AllowedIPs = 0.0.0.0/0, ::/0');
    expect(conf).toContain('PersistentKeepalive = 25');
  });

  it('keeps the private key only in the [Interface] section', () => {
    const kp = generateWgKeypair();
    const conf = buildWgQuickConf(makeTunnel(), kp.privateKey);
    const peer = conf.slice(conf.indexOf('[Peer]'));
    expect(peer).not.toContain(kp.privateKey);
  });

  it('defaults MTU/keepalive/allowedIPs when missing', () => {
    const tunnel = makeTunnel({ mtu: undefined as unknown as number, keepalive: undefined as unknown as number, allowedIps: [] });
    const conf = buildWgQuickConf(tunnel, generateWgKeypair().privateKey);
    expect(conf).toContain(`MTU = ${DEFAULT_MTU}`);
    expect(conf).toContain('PersistentKeepalive = 25');
    expect(conf).toContain('AllowedIPs = 0.0.0.0/0, ::/0');
  });

  it('omits DNS and v6 address when absent (IPv4-only servers)', () => {
    const tunnel = makeTunnel({ addressV6: null, dns: null });
    const conf = buildWgQuickConf(tunnel, generateWgKeypair().privateKey);
    expect(conf).not.toContain('DNS =');
    expect(conf).toContain('Address = 10.13.0.5');
  });

  it('throws ConfBuildError on invalid keys', () => {
    expect(() => buildWgQuickConf(makeTunnel(), 'not-a-key')).toThrow(ConfBuildError);
    const badServer = makeTunnel({ serverPublicKey: 'also-not-a-key!!!' });
    expect(() => buildWgQuickConf(badServer, generateWgKeypair().privateKey)).toThrow(ConfBuildError);
  });

  it('throws ConfBuildError on missing endpoint', () => {
    const tunnel = makeTunnel({ endpointPort: 0 });
    expect(() => buildWgQuickConf(tunnel, generateWgKeypair().privateKey)).toThrow(ConfBuildError);
  });
});
