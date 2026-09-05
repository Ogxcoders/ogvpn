// VPN preference endpoints (Section Q 386 / X/Y/Z user controls).
import { db } from "@/lib/db";
import { ok, route, readJson, sanitizeText, ApiError, getClientIp } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";

export const GET = route(async (req) => {
  const auth = await requireUser(req);
  const settings = await db.user.findUniqueOrThrow({
    where: { id: auth.id },
    select: { killSwitch: true, autoConnect: true, ipv6Enabled: true, lanBypass: true, protocolPreference: true, transportPreference: true, dnsMode: true, dnsServer: true },
  });
  return ok({ settings });
}, { name: "settings.vpn.get" });

export const PATCH = route(async (req) => {
  const auth = await requireUser(req);
  const body = await readJson(req);
  const data: Record<string, unknown> = {};

  if (typeof body.killSwitch === "boolean") data.killSwitch = body.killSwitch;
  if (typeof body.autoConnect === "boolean") data.autoConnect = body.autoConnect;
  if (typeof body.ipv6Enabled === "boolean") data.ipv6Enabled = body.ipv6Enabled;
  if (typeof body.lanBypass === "boolean") data.lanBypass = body.lanBypass;
  if (typeof body.protocolPreference === "string") {
    const p = sanitizeText(body.protocolPreference, 12);
    if (!["wireguard", "openvpn", "ikev2"].includes(p)) throw new ApiError(400, "invalid_input", "Unknown protocol.");
    data.protocolPreference = p;
  }
  if (typeof body.transportPreference === "string") {
    const t = sanitizeText(body.transportPreference, 4);
    if (!["udp", "tcp"].includes(t)) throw new ApiError(400, "invalid_input", "Transport must be udp or tcp.");
    data.transportPreference = t;
  }
  if (typeof body.dnsMode === "string") {
    const m = sanitizeText(body.dnsMode, 8);
    if (!["vpn", "custom"].includes(m)) throw new ApiError(400, "invalid_input", "DNS mode must be vpn or custom.");
    data.dnsMode = m;
  }
  if (body.dnsServer !== undefined) {
    const dns = sanitizeText(body.dnsServer, 60);
    if (dns && !/^(\d{1,3}\.){3}\d{1,3}$/.test(dns) && !/^[0-9a-fA-F:]+$/.test(dns)) {
      throw new ApiError(400, "invalid_input", "Custom DNS must be an IPv4 or IPv6 address.");
    }
    data.dnsServer = dns || null;
  }

  const updated = await db.user.update({
    where: { id: auth.id }, data,
    select: { killSwitch: true, autoConnect: true, ipv6Enabled: true, lanBypass: true, protocolPreference: true, transportPreference: true, dnsMode: true, dnsServer: true },
  });
  await audit({ actorId: auth.id, actorEmail: auth.email, action: "settings.vpn_updated", metadata: data, ip: getClientIp(req) });
  return ok({ settings: updated });
}, { name: "settings.vpn" });
