import { describe, it, expect } from 'vitest';
import { generateWgKeypair, deriveWgPublicKey, validateWgKey, isWgKeyFormat } from '../electron/src/main/keys';

describe('WireGuard key generation (x25519, @noble/curves)', () => {
  it('generates 44-char base64 keypairs', () => {
    const kp = generateWgKeypair();
    expect(kp.privateKey).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    expect(kp.publicKey).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    expect(validateWgKey(kp.privateKey)).toBe(true);
    expect(validateWgKey(kp.publicKey)).toBe(true);
  });

  it('derives the same public key deterministically', () => {
    const kp = generateWgKeypair();
    expect(deriveWgPublicKey(kp.privateKey)).toBe(kp.publicKey);
  });

  it('is random per call', () => {
    const a = generateWgKeypair();
    const b = generateWgKeypair();
    expect(a.privateKey).not.toBe(b.privateKey);
    expect(a.publicKey).not.toBe(b.publicKey);
  });

  it('rejects malformed keys', () => {
    expect(isWgKeyFormat('too-short')).toBe(false);
    expect(isWgKeyFormat('AAAA')).toBe(false);
    expect(isWgKeyFormat('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=')).toBe(false); // 43+1 but wrong padding char count
    expect(validateWgKey(undefined)).toBe(false);
    expect(validateWgKey(12345)).toBe(false);
  });
});
