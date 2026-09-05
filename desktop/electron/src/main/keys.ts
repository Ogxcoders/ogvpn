/**
 * WireGuard key handling. Curve25519 (x25519) keypairs are generated entirely
 * on-device with @noble/curves; only the public key ever leaves the device
 * (contract: POST /vpn/peers uploads publicKey only).
 *
 * Pure module — no electron imports, unit-testable in Node.
 */

import { x25519 } from '@noble/curves/ed25519';

export interface WgKeypair {
  publicKey: string;
  privateKey: string;
}

const WG_KEY_BASE64_RE = /^[A-Za-z0-9+/]{43}=$/;

function toWgBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function fromWgBase64(key: string): Uint8Array {
  const buf = Buffer.from(key, 'base64');
  if (buf.length !== 32) {
    throw new Error(`WireGuard keys must decode to 32 bytes, got ${buf.length}`);
  }
  return new Uint8Array(buf);
}

/** True for a WireGuard key: 44 chars, base64, decodes to 32 bytes. */
export function isWgKeyFormat(key: unknown): key is string {
  return typeof key === 'string' && key.length === 44 && WG_KEY_BASE64_RE.test(key);
}

/** Generate a fresh Curve25519 keypair in WireGuard base64 format. */
export function generateWgKeypair(): WgKeypair {
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return {
    privateKey: toWgBase64(privateKey),
    publicKey: toWgBase64(publicKey)
  };
}

/** Derive the public key for a WireGuard private key (base64, 44 chars). */
export function deriveWgPublicKey(privateKeyBase64: string): string {
  if (!isWgKeyFormat(privateKeyBase64)) {
    throw new Error('Invalid WireGuard private key format');
  }
  return toWgBase64(x25519.getPublicKey(fromWgBase64(privateKeyBase64)));
}

/** Validate any string as a well-formed WireGuard base64 key. */
export function validateWgKey(key: unknown): boolean {
  if (!isWgKeyFormat(key)) {
    return false;
  }
  try {
    fromWgBase64(key);
    return true;
  } catch {
    return false;
  }
}
