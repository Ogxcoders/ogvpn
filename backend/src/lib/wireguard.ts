import { ApiError } from "./errors.js";

const WG_KEY_RE = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/;

/**
 * Validates a WireGuard Curve25519 public key (base64, 32 bytes).
 * The trailing-char regex enforces canonical base64 encoding of a 32-byte
 * value, which filters malformed/mis-encoded keys. Full low-order-point
 * rejection happens on the VPN server itself, where the handshake fails.
 */
export function validateWireGuardPublicKey(key: string): void {
  if (typeof key !== "string" || !WG_KEY_RE.test(key)) {
    throw ApiError.validation(
      "Invalid WireGuard public key: expected 32-byte base64 value (44 chars ending '=')",
    );
  }
  const raw = Buffer.from(key, "base64");
  if (raw.length !== 32) {
    throw ApiError.validation("Invalid WireGuard public key length");
  }
}

/** IPv4 address from a /24 prefix and host octet, e.g. ("10.13.0.0", 5) → "10.13.0.5". */
export function ipv4At(prefix: string, hostOctet: number): string {
  const m = /^(\d+\.\d+\.\d+)\.0\/24$/.exec(prefix);
  if (!m || hostOctet < 1 || hostOctet > 254) {
    throw new Error(`Unsupported IPv4 prefix: ${prefix}`);
  }
  return `${m[1]}.${hostOctet}`;
}

/** IPv6 address from an fd00::/64-style prefix + host id, e.g. ("fd00:5::", 7) → "fd00:5::7". */
export function ipv6At(prefix: string, hostId: number): string {
  const base = prefix.replace(/::\/\d+$/, "::");
  if (!base.endsWith("::") || hostId < 1 || hostId > 65534) {
    throw new Error(`Unsupported IPv6 prefix: ${prefix}`);
  }
  return `${base}${hostId.toString(16)}`;
}

/**
 * Allocates the next free host address for a server, skipping the gateway
 * (.1 / ::1) and any address already used by an active tunnel.
 */
export function allocateIps(
  usedV4Hosts: Set<number>,
  usedV6Hosts: Set<number>,
  capacity: number,
): { v4Host: number; v6Host: number } {
  for (let host = 2; host <= Math.min(254, capacity + 1); host++) {
    if (!usedV4Hosts.has(host) && !usedV6Hosts.has(host)) {
      return { v4Host: host, v6Host: host };
    }
  }
  throw ApiError.serverUnavailable("Server at capacity: no free addresses");
}
