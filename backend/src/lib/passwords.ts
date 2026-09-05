import crypto from "node:crypto";

/**
 * Password hashing with scrypt (Node built-in, memory-hard, FIPS-friendly).
 * Format: scrypt$N$r$p$salt_b64$hash_b64
 */
const N = 16384; // 2^14 — OWASP-recommended minimum for interactive logins
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number.parseInt(parts[1] ?? "", 10);
  const r = Number.parseInt(parts[2] ?? "", 10);
  const p = Number.parseInt(parts[3] ?? "", 10);
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }
  try {
    const salt = Buffer.from(parts[4] ?? "", "base64");
    const expected = Buffer.from(parts[5] ?? "", "base64");
    const actual = crypto.scryptSync(password, salt, expected.length, {
      N: n,
      r,
      p,
    });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function passwordPolicyErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push("at least 10 characters");
  if (!/[a-zA-Z]/.test(password)) errors.push("at least one letter");
  if (!/[0-9]/.test(password)) errors.push("at least one digit");
  return errors;
}
