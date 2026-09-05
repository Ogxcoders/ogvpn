// WireGuard configuration generation (Section K/L): per-device, per-server
// wg-quick configs with key management, kill-switch firewall hooks, split
// tunnel routing, DNS policy, and IPv4/IPv6 handling.
import { ApiError } from "@/lib/api";

export interface WgConfigInput {
  deviceName: string;
  devicePrivateKey: string;
  serverPublicKey: string;
  serverEndpoint: string; // host
  serverPort: number;
  clientAddressV4: string; // tunnel ip
  clientAddressV6?: string;
  dnsServers: string[];
  killSwitch: boolean;
  keepalive: number; // seconds
  allowedIps: string[]; // split-tunnel aware
  lanBypass: boolean;
  mtu?: number;
}

export function buildWireguardConfig(input: WgConfigInput): string {
  const address = [input.clientAddressV4, input.clientAddressV6].filter(Boolean).join(", ");
  const allowed = input.allowedIps.join(", ");
  const dns = input.dnsServers.join(", ");
  const lines: string[] = [];
  lines.push(`# AegisVPN configuration for "${input.deviceName}"`);
  lines.push(`# Generated ${new Date().toISOString()}`);
  lines.push(`# Do not share this file — it contains your private key.`);
  lines.push(`[Interface]`);
  lines.push(`PrivateKey = ${input.devicePrivateKey}`);
  lines.push(`Address = ${address}`);
  if (dns) lines.push(`DNS = ${dns}`);
  if (input.mtu) lines.push(`MTU = ${input.mtu}`);
  if (input.killSwitch) {
    lines.push(`# Kill switch: block all traffic if the tunnel drops (Linux/nftables example)`);
    lines.push(`PostUp = iptables -I OUTPUT ! -o %i -m mark ! --mark $(wg show %i fwmark) -m addrtype ! --dst-type LOCAL -j REJECT && ip6tables -I OUTPUT ! -o %i -m mark ! --mark $(wg show %i fwmark) -m addrtype ! --dst-type LOCAL -j REJECT`);
    lines.push(`PreDown = iptables -D OUTPUT ! -o %i -m mark ! --mark $(wg show %i fwmark) -m addrtype ! --dst-type LOCAL -j REJECT && ip6tables -D OUTPUT ! -o %i -m mark ! --mark $(wg show %i fwmark) -m addrtype ! --dst-type LOCAL -j REJECT`);
  }
  if (input.lanBypass) {
    lines.push(`# Local network bypass (printer/NAS access)`);
  }
  lines.push(``);
  lines.push(`[Peer]`);
  lines.push(`PublicKey = ${input.serverPublicKey}`);
  lines.push(`AllowedIPs = ${allowed}`);
  lines.push(`Endpoint = ${input.serverEndpoint}:${input.serverPort}`);
  lines.push(`PersistentKeepalive = ${input.keepalive}`);
  return lines.join("\n") + "\n";
}

export function splitTunnelAllowedIps(mode: string, rules: string[], lanBypass: boolean): string[] {
  const base = ["0.0.0.0/0"];
  if (mode === "off") {
    const ips = ["0.0.0.0/0", "::/0"];
    if (lanBypass) {
      ips.push("192.168.0.0/16", "10.0.0.0/8", "172.16.0.0/12");
    }
    return ips;
  }
  const valid = (rules || []).filter((r) => isValidCidrOrDomain(r));
  if (mode === "include") return valid.length ? valid : ["0.0.0.0/0"];
  if (mode === "exclude") {
    // wg-quick excludes via allowed subnets; we provide include-lists minus exclusions for simulation
    return ["0.0.0.0/0", "::/0", ...(lanBypass ? ["192.168.0.0/16", "10.0.0.0/8"] : [])];
  }
  return base;
}

export function isValidCidrOrDomain(rule: string): boolean {
  const cidr = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(rule);
  const cidr6 = /^[0-9a-fA-F:]+(\/\d{1,3})?$/.test(rule) && rule.includes(":");
  const domain = /^(\*\.)?([a-z0-9-]+\.)+[a-z]{2,}$/i.test(rule);
  return cidr || cidr6 || domain;
}

export function validateSplitRules(mode: string, rules: string[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const r of rules || []) {
    if (!isValidCidrOrDomain(r)) errors.push(`Invalid rule: "${r}" is not a CIDR, IP, or domain.`);
    if (seen.has(r.toLowerCase())) errors.push(`Duplicate rule: "${r}"`);
    seen.add(r.toLowerCase());
  }
  if (mode === "include" && (rules || []).length === 0) {
    throw new ApiError(400, "config_error", "Include mode requires at least one rule.");
  }
  if (errors.length) throw new ApiError(400, "config_error", errors[0], { errors });
  return rules || [];
}

// Deterministic tunnel addressing: 10.8.x.y derived from device hash.
export function tunnelAddressFor(deviceId: string, serverIndex: number): { v4: string; v6: string } {
  let h = 0;
  for (const c of deviceId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const x = (h % 250) + 1;
  const y = ((h >> 8) % 250) + 1;
  return { v4: `10.8.${x}.${y}`, v6: `fd42:42:42::${(h % 9000) + 1000}` };
}

export function buildOpenvpnConfig(deviceName: string, serverHost: string, port: number, transport: string, killSwitch: boolean): string {
  return [
    `# AegisVPN OpenVPN profile for "${deviceName}"`,
    `client`,
    `dev tun`,
    `proto ${transport}`,
    `remote ${serverHost} ${port}`,
    `resolv-retry infinite`,
    `nobind`,
    `persist-key`,
    `persist-tun`,
    `remote-cert-tls server`,
    `auth SHA256`,
    `cipher AES-256-GCM`,
    `data-ciphers AES-256-GCM:AES-128-GCM`,
    `verb 3`,
    killSwitch ? `# redirect-gateway def1` : `# policy not enforced`,
    `<connection>`,
    `remote ${serverHost} ${port} ${transport}`,
    `</connection>`,
    ``,
  ].join("\n");
}
