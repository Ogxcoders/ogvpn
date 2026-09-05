// Per-device VPN configuration generation & delivery (Sections L/J/K):
// WireGuard wg-quick profile or OpenVPN profile, key rotation, integrity,
// secure delivery, caching-safe headers, audit events.
import { db } from "@/lib/db";
import { ApiError, route, getClientIp } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";
import { buildWireguardConfig, buildOpenvpnConfig, splitTunnelAllowedIps, tunnelAddressFor } from "@/lib/wg";
import { generateWireguardKeypair } from "@/lib/crypto";

export const GET = route(async (req, ctx) => {
  const auth = await requireUser(req);
  const params = ctx?.params ? await ctx.params : {};
  const device = await db.device.findFirst({
    where: { id: params.id, userId: auth.id, status: { not: "revoked" } },
  });
  if (!device) throw new ApiError(404, "not_found", "Device not found.");

  const { searchParams } = new URL(req.url);
  const serverCode = searchParams.get("server");
  const protocol = searchParams.get("protocol") === "openvpn" ? "openvpn" : "wireguard";
  const rotate = searchParams.get("rotate") === "1";

  let privateKey = device.privateKey;
  if (rotate || !privateKey) {
    // Credential rotation (J190/K206): regenerate device keypair, bump config version.
    const kp = generateWireguardKeypair();
    privateKey = kp.privateKey;
    await db.device.update({
      where: { id: device.id },
      data: { privateKey: kp.privateKey, publicKey: kp.publicKey, configVersion: { increment: 1 } },
    });
    await db.vpnConfig.updateMany({ where: { deviceId: device.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "device.keys_rotated", targetType: "device", targetId: device.id, ip: getClientIp(req), severity: "warning" });
  }

  const server = serverCode
    ? await db.server.findFirst({ where: { OR: [{ code: serverCode }, { hostname: serverCode }] } })
    : await db.server.findFirst({ where: { status: "online", health: { not: "critical" } }, orderBy: { loadPct: "asc" } });
  if (!server || server.status === "offline") throw new ApiError(503, "server_unavailable", "No available server for configuration generation.");

  const region = await db.region.findUniqueOrThrow({ where: { id: server.regionId } });
  const tunnel = tunnelAddressFor(device.id, 0);
  const user = await db.user.findUniqueOrThrow({ where: { id: auth.id } });

  const allowedIps = splitTunnelAllowedIps(device.splitTunnelMode, device.splitRules ? JSON.parse(device.splitRules) : [], user.lanBypass);
  const dnsServers = user.dnsMode === "custom" && user.dnsServer ? [user.dnsServer] : ["10.8.0.1", "10.8.0.2"];
  const configVersion = device.configVersion;

  let body: string;
  if (protocol === "openvpn") {
    body = buildOpenvpnConfig(device.name, server.hostname, server.wgPort + 1000, user.transportPreference, user.killSwitch);
  } else {
    body = buildWireguardConfig({
      deviceName: device.name,
      devicePrivateKey: privateKey!,
      serverPublicKey: server.publicKey,
      serverEndpoint: server.hostname,
      serverPort: server.wgPort,
      clientAddressV4: tunnel.v4,
      clientAddressV6: user.ipv6Enabled ? tunnel.v6 : undefined,
      dnsServers,
      killSwitch: user.killSwitch,
      keepalive: 25,
      allowedIps,
      lanBypass: user.lanBypass,
      mtu: 1420,
    });
  }

  // Persist config record (audit trail + versioning + expiry)
  const expiresAt = new Date(Date.now() + 90 * 86400e3);
  await db.vpnConfig.create({
    data: {
      userId: auth.id, deviceId: device.id, serverId: server.id,
      protocol, body, version: configVersion, expiresAt,
    },
  });
  await db.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
  await audit({ actorId: auth.id, actorEmail: auth.email, action: "config.generated", targetType: "device", targetId: device.id, metadata: { server: server.code, protocol, rotate }, ip: getClientIp(req) });

  const filename = `aegis-${device.platform}-${server.code}.conf`;
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}, { name: "devices.config" });
