/**
 * Pure builder for the standard wg-quick configuration text.
 *
 * Produces the exact [Interface]/[Peer] grammar consumed by:
 *  - Linux:   /etc/wireguard/aegisvpn0.conf + `wg-quick up aegisvpn0`
 *  - macOS:   /etc/wireguard/aegisvpn0.conf + `wg-quick up aegisvpn0` (brew wireguard-tools)
 *  - Windows: %PROGRAMDATA%\AegisVPN\tunnels\aegisvpn0.conf installed through
 *             `wireguard.exe /installtunnelservice` (wireguard-nt)
 *
 * The private key appears ONLY inside the returned configuration string. It
 * is the caller's responsibility to write it to a root/SYSTEM-owned file and
 * to never log or transmit it.
 */

import type { TunnelInfo } from '../../../../shared/ipc';
import { validateWgKey } from '../keys';

export const DEFAULT_MTU = 1420;
export const DEFAULT_KEEPALIVE = 25;
export const DEFAULT_ALLOWED_IPS: readonly string[] = ['0.0.0.0/0', '::/0'];

export class ConfBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfBuildError';
  }
}

export function buildWgQuickConf(tunnel: TunnelInfo, privateKey: string): string {
  if (!validateWgKey(privateKey)) {
    throw new ConfBuildError('Invalid client private key (expected 44-char WireGuard base64)');
  }
  if (!validateWgKey(tunnel.serverPublicKey)) {
    throw new ConfBuildError('Invalid server public key (expected 44-char WireGuard base64)');
  }

  const addresses = [tunnel.addressV4, tunnel.addressV6].filter(
    (a): a is string => typeof a === 'string' && a.length > 0
  );
  if (addresses.length === 0) {
    throw new ConfBuildError('Tunnel has no interface addresses (addressV4/addressV6)');
  }
  if (!tunnel.endpointHost || !Number.isFinite(tunnel.endpointPort) || tunnel.endpointPort <= 0) {
    throw new ConfBuildError('Tunnel endpoint is missing host or port');
  }

  const allowedIps =
    tunnel.allowedIps && tunnel.allowedIps.length > 0 ? tunnel.allowedIps : DEFAULT_ALLOWED_IPS;

  const lines: string[] = [];
  lines.push('[Interface]');
  lines.push(`Address = ${addresses.join(', ')}`);
  if (tunnel.dns) {
    lines.push(`DNS = ${tunnel.dns}`);
  }
  lines.push(`MTU = ${tunnel.mtu ?? DEFAULT_MTU}`);
  lines.push(`PrivateKey = ${privateKey}`);
  lines.push('');
  lines.push('[Peer]');
  lines.push(`PublicKey = ${tunnel.serverPublicKey}`);
  lines.push(`Endpoint = ${tunnel.endpointHost}:${tunnel.endpointPort}`);
  lines.push(`AllowedIPs = ${allowedIps.join(', ')}`);
  lines.push(`PersistentKeepalive = ${tunnel.keepalive ?? DEFAULT_KEEPALIVE}`);
  return `${lines.join('\n')}\n`;
}
