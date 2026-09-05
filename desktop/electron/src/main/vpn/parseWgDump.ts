/**
 * Parser for `wg show <interface> dump` output plus a sanitizer used by the
 * Diagnostics screen.
 *
 * WireGuard dump format (tab-separated):
 *   Line 1 (interface): <iface> <private-key> <public-key> <listen-port> <fwmark>
 *   Lines 2+ (peers):   <public-key> <preshared-key> <endpoint> <allowed-ips>
 *                       <latest-handshake> <rx> <tx> <persistent-keepalive>
 *
 * The private key field is "(hidden)" unless the process runs as root; peer
 * preshared keys are "(none)" when unset. Parsers must never assume the
 * private key is redacted for them.
 *
 * Pure module — no electron imports.
 */

import type { AdapterStatus } from './adapters/types';

export interface WgDumpInterfaceLine {
  name: string | null;
  privateKey: string;
  publicKey: string;
  listenPort: number | null;
}

export interface WgDumpPeer {
  publicKey: string;
  presharedKey: string;
  endpoint: string | null;
  allowedIps: string;
  latestHandshake: number;
  rxBytes: number;
  txBytes: number;
  keepalive: number | null;
}

export interface WgDump {
  interface: WgDumpInterfaceLine | null;
  peers: WgDumpPeer[];
}

function splitTabs(line: string): string[] {
  return line.split('\t');
}

function toInt(value: string | undefined): number | null {
  if (value === undefined || value.length === 0) {
    return null;
  }
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export function parseWgDump(raw: string): WgDump {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.length > 0);

  const result: WgDump = { interface: null, peers: [] };

  for (const line of lines) {
    const fields = splitTabs(line);
    if (fields.length === 5 && result.interface === null) {
      // Interface line: <name> <private> <public> <port> <fwmark>
      const [name, privateKey, publicKey, listenPort] = fields;
      result.interface = {
        name: name.length > 0 ? name : null,
        privateKey,
        publicKey,
        listenPort: toInt(listenPort)
      };
      continue;
    }
    if (fields.length === 8) {
      // Peer line: <pub> <psk> <endpoint> <allowed> <handshake> <rx> <tx> <keepalive>
      const [publicKey, presharedKey, endpoint, allowedIps, latestHandshake, rx, tx, keepalive] =
        fields;
      result.peers.push({
        publicKey,
        presharedKey,
        endpoint: endpoint && endpoint !== '(none)' ? endpoint : null,
        allowedIps,
        latestHandshake: toInt(latestHandshake) ?? 0,
        rxBytes: toInt(rx) ?? 0,
        txBytes: toInt(tx) ?? 0,
        keepalive: toInt(keepalive)
      });
    }
  }

  return result;
}

/** Derive adapter status from a `wg show <if> dump` output snapshot. */
export function statusFromDump(raw: string, nowSec: number = Math.floor(Date.now() / 1000)): AdapterStatus {
  const dump = parseWgDump(raw);
  if (dump.interface === null) {
    return { state: 'down', handshakeAgoSec: null, rxBytes: 0, txBytes: 0 };
  }
  let handshakeAgoSec: number | null = null;
  let rxBytes = 0;
  let txBytes = 0;
  for (const peer of dump.peers) {
    rxBytes += peer.rxBytes;
    txBytes += peer.txBytes;
    if (peer.latestHandshake > 0) {
      const ago = nowSec - peer.latestHandshake;
      if (handshakeAgoSec === null || ago < handshakeAgoSec) {
        handshakeAgoSec = ago;
      }
    }
  }
  return { state: 'up', handshakeAgoSec, rxBytes, txBytes };
}

const WG_KEY_RE = /[A-Za-z0-9+/]{43}=/g;

/**
 * Sanitize a wg dump for display in Diagnostics:
 *  1. structurally redact the interface private key and peer preshared keys,
 *  2. scrub ANY remaining 44-char base64 blob (defense in depth — public keys
 *     are also redacted; they are not needed for troubleshooting and this
 *     guarantees a private key can never leak through diagnostics).
 */
export function sanitizeWgDumpForDiagnostics(raw: string): string {
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const redacted = lines.map((line, index) => {
    const fields = splitTabs(line);
    const isInterfaceLine = index === 0 && fields.length === 5;
    const isPeerLine = fields.length === 8;
    if (isInterfaceLine) {
      fields[1] = '(redacted)'; // private key
      return fields.join('\t');
    }
    if (isPeerLine && fields[1] !== '(none)') {
      fields[1] = '(redacted)'; // preshared key
      return fields.join('\t');
    }
    return line;
  });
  return redacted.join('\n').replace(WG_KEY_RE, '[REDACTED]');
}
