// Connection engine (Section M): initiation, cancellation, progress, completion,
// failure, reconnect, duplicate protection, history recording, duration & bytes.
import { db } from "@/lib/db";
import {
  ApiError, ok, route, readJson, readJsonSafe, requireString, sanitizeText, rateLimit, rateLimitResponse,
  getClientIp, metricCounter,
} from "@/lib/api";
import { requireUser } from "@/lib/session";
import { audit, notify } from "@/lib/audit";
import { planOf, isActiveStatus, versionGate } from "@/lib/entitlements";
import { generateWireguardKeypair } from "@/lib/crypto";
import { tunnelAddressFor } from "@/lib/wg";

const HANDSHAKE_STAGES = [
  { key: "resolving", label: "Resolving endpoint", weight: 15 },
  { key: "network", label: "Checking network & captive portal", weight: 15 },
  { key: "handshake", label: "Performing secure handshake", weight: 35 },
  { key: "assign", label: "Assigning tunnel address", weight: 15 },
  { key: "dns", label: "Securing DNS resolvers", weight: 10 },
  { key: "secured", label: "Connection secured", weight: 10 },
];

async function activeConnection(userId: string) {
  return db.connection.findFirst({
    where: { userId, status: "active" },
    include: { server: { include: { region: true } }, device: true },
  });
}

async function endConnection(conn: { id: string; serverId: string; startedAt: Date }, reason: string) {
  const durationSec = Math.round((Date.now() - conn.startedAt.getTime()) / 1000);
  await db.connection.update({
    where: { id: conn.id },
    data: { status: "ended", endedAt: new Date(), durationSec, endReason: reason },
  });
  await db.server.update({ where: { id: conn.serverId }, data: { activeConnections: { decrement: 1 } } }).catch(() => {});
  return durationSec;
}

export const POST = route(async (req, ctx) => {
  const auth = await requireUser(req);
  const params = ctx?.params ? await ctx.params : {};
  const action = params.action;
  const body = await readJsonSafe(req);
  const ip = getClientIp(req);

  const rl = rateLimit(`conn:${auth.id}`, 30, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const sub = await db.subscription.findUniqueOrThrow({ where: { userId: auth.id } });

  if (action === "connect" || action === "reconnect") {
    // Global version gate (AT 1046): force update when below minimum
    const gate = versionGate(auth.clientVersion);
    if (!gate.ok) {
      throw new ApiError(426, "update_required", "This app version is no longer supported. Update to continue.", { latest: gate.latest });
    }
    // Subscription boundaries (D90)
    if (!isActiveStatus(sub.status) && sub.plan !== "free") {
      throw new ApiError(402, "subscription_required",
        sub.status === "canceled" ? "Your subscription was canceled. Reactivate to connect." : "Your subscription needs attention. Update billing to continue.",
        { plan: sub.plan, status: sub.status });
    }
    // Bandwidth entitlement (free plan cap)
    if (sub.bandwidthGb !== null && Number(sub.bytesUsed) >= sub.bandwidthGb * 1e9) {
      throw new ApiError(402, "bandwidth_exceeded",
        `You've used all ${sub.bandwidthGb} GB of this month's free data. Upgrade for unlimited data.`,
        { usedGb: Number(sub.bytesUsed) / 1e9, capGb: sub.bandwidthGb });
    }
    // Duplicate-connect protection (M264)
    const existing = await activeConnection(auth.id);
    if (action === "connect" && existing) {
      throw new ApiError(409, "conflict", "A connection is already active. Disconnect first.", { activeConnectionId: existing.id });
    }
    if (existing && action === "reconnect" && existing.serverId === sanitizeText(body.serverId, 40) && !body.force) {
      return ok({ alreadyConnected: true, connection: serializeConn(existing) });
    }
    if (existing) await endConnection(existing, "reconnecting");

    // Server selection (AA): manual or automatic best-score
    let server;
    if (body.serverId || body.serverCode) {
      server = await db.server.findFirst({
        where: { OR: [{ id: String(body.serverId || "") }, { code: String(body.serverCode || "") }] },
        include: { region: true },
      });
      if (!server) throw new ApiError(404, "not_found", "That server does not exist.");
    } else {
      const candidates = await db.server.findMany({ where: { status: "online" }, include: { region: true } });
      const usable = candidates.filter((c) => (sub.plan !== "free" || c.region.freeAllowed));
      if (!usable.length) throw new ApiError(503, "server_unavailable", "No servers are currently available for your plan. Try again shortly.");
      server = usable.sort((a, b) => (a.latencyMs + a.loadPct / 4) - (b.latencyMs + b.loadPct / 4))[0];
    }
    // Availability states (I/AA)
    if (server.status === "maintenance") {
      throw new ApiError(503, "server_maintenance", `${server.region.name} is under maintenance until ${server.maintenanceUntil ? new Date(server.maintenanceUntil).toLocaleTimeString() : "shortly"}. Pick another location.`, { serverCode: server.code });
    }
    if (server.status === "draining") {
      throw new ApiError(503, "server_unavailable", `${server.code} is being drained and accepts no new connections.`, { serverCode: server.code });
    }
    if (server.status !== "online") {
      throw new ApiError(503, "server_unavailable", `${server.code} is currently offline. Try another location.`, { serverCode: server.code });
    }
    if (server.activeConnections >= server.capacity) {
      throw new ApiError(503, "server_at_capacity", `${server.code} is at full capacity. Another gateway in ${server.region.name} will be selected.`, { serverCode: server.code });
    }
    // Plan/location gate (D90/AD)
    const ent = planOf(sub.plan);
    if (sub.plan === "free" && !server.region.freeAllowed) {
      throw new ApiError(402, "unsupported_location", `${server.region.name} is a premium location. Upgrade to unlock all ${60}+ locations.`, { regionTier: server.region.tier });
    }
    // Simulated failure injection for QA of failure paths (AS/AV)
    const sim = sanitizeText(body.simulate, 20);
    if (sim === "handshake") throw new ApiError(502, "handshake_error", "The VPN handshake failed after 3 attempts. The server was unreachable on UDP 51820.", { retryable: true });
    if (sim === "timeout") throw new ApiError(504, "timeout", "The connection attempt timed out. Check your network and try again.", { retryable: true });
    if (sim === "dns") throw new ApiError(502, "dns_error", "DNS resolution of the VPN endpoint failed. Your network may be blocking VPN endpoints.", { retryable: true });

    // Device resolution: explicit device or the web dashboard pseudo-device
    let device;
    if (typeof body.deviceId === "string" && body.deviceId) {
      device = await db.device.findFirst({ where: { id: body.deviceId, userId: auth.id, status: "active" } });
      if (!device) throw new ApiError(404, "not_found", "Device not found or revoked.", { deviceRevoked: true });
    } else {
      device = await db.device.findFirst({ where: { userId: auth.id, platform: "web", status: "active" } });
      if (!device) {
        const count = await db.device.count({ where: { userId: auth.id, status: { not: "revoked" } } });
        if (count >= sub.deviceLimit) {
          throw new ApiError(409, "device_limit_reached", `Your ${sub.plan} plan allows ${sub.deviceLimit} device${sub.deviceLimit > 1 ? "s" : ""}. Upgrade or revoke a device to continue.`, { deviceLimit: sub.deviceLimit, plan: sub.plan });
        }
        const kp = generateWireguardKeypair();
        device = await db.device.create({
          data: { userId: auth.id, name: "Web Dashboard", platform: "web", appVersion: auth.clientVersion, publicKey: kp.publicKey, privateKey: kp.privateKey },
        });
      }
    }

    // Tunnel addressing + config record
    const tunnel = tunnelAddressFor(device.id, 0);
    const configBody = [
      "# AegisVPN runtime configuration (summary)",
      `[Interface]`,
      `Address = ${tunnel.v4}${auth.ipv6Enabled ? `, ${tunnel.v6}` : ""}`,
      `DNS = ${auth.dnsMode === "custom" && auth.dnsServer ? auth.dnsServer : "10.8.0.1, 10.8.0.2"}`,
      `KillSwitch = ${auth.killSwitch ? "on" : "off"}`,
      ``,
      `[Peer]`,
      `PublicKey = ${server.publicKey.slice(0, 20)}…`,
      `Endpoint = ${server.hostname}:${server.wgPort}`,
      `AllowedIPs = 0.0.0.0/0${auth.ipv6Enabled ? ", ::/0" : ""}`,
      `PersistentKeepalive = 25`,
    ].join("\n");
    await db.vpnConfig.create({
      data: {
        userId: auth.id, deviceId: device.id, serverId: server.id,
        protocol: auth.protocolPreference, body: configBody,
        version: device.configVersion, expiresAt: new Date(Date.now() + 24 * 3600e3),
      },
    });

    const exitIp = server.ipv4;
    const conn = await db.connection.create({
      data: {
        userId: auth.id, deviceId: device.id, serverId: server.id, regionId: server.regionId,
        protocol: auth.protocolPreference, transport: auth.transportPreference,
        status: "active", clientIp: ip, exitIp,
      },
      include: { server: { include: { region: true } }, device: true },
    });
    await db.server.update({ where: { id: server.id }, data: { activeConnections: { increment: 1 } } });
    await db.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
    await db.recentServer.upsert({
      where: { userId_serverId: { userId: auth.id, serverId: server.id } },
      update: { usedAt: new Date() },
      create: { userId: auth.id, serverId: server.id },
    });
    metricCounter("vpn_connect_success");
    if (action === "reconnect") metricCounter("vpn_reconnect");
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "vpn.connected", targetType: "server", targetId: server.code, metadata: { protocol: conn.protocol, device: device.name }, ip });
    return ok({
      stages: HANDSHAKE_STAGES,
      connection: serializeConn(conn),
      tunnel: { addressV4: tunnel.v4, addressV6: auth.ipv6Enabled ? tunnel.v6 : null },
    });
  }

  if (action === "disconnect") {
    const existing = await activeConnection(auth.id);
    if (!existing) return ok({ disconnected: true, alreadyDisconnected: true });
    // Duplicate-disconnect protection: idempotent
    const reason = sanitizeText(body.reason, 30) || "user";
    const durationSec = await endConnection(existing, reason);
    metricCounter("vpn_disconnect");
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "vpn.disconnected", targetType: "server", targetId: existing.server.code, metadata: { durationSec, reason }, ip });
    return ok({ disconnected: true, durationSec });
  }

  if (action === "cancel") {
    // Connection cancellation during connecting (M242): nothing active yet, idempotent ack
    return ok({ cancelled: true });
  }

  throw new ApiError(404, "not_found", `Unknown connection action "${action}".`);
}, { name: "connection.post" });

export const GET = route(async (req, ctx) => {
  const auth = await requireUser(req);
  const params = ctx?.params ? await ctx.params : {};
  const action = params.action;

  if (action === "status") {
    const conn = await activeConnection(auth.id);
    const sub = await db.subscription.findUniqueOrThrow({ where: { userId: auth.id } });
    if (!conn) {
      return ok({ state: "disconnected", connection: null, subscription: subSummary(sub) });
    }
    // Live traffic simulation + duration measurement (M267/M268)
    const elapsedSec = Math.round((Date.now() - conn.startedAt.getTime()) / 1000);
    const throughputMbps = 40 + (parseInt(conn.id.slice(-4), 36) % 80);
    const totalBytes = Math.round((throughputMbps * 1e6) / 8 * elapsedSec);
    const bytesIn = Math.round(totalBytes * 0.75);
    const bytesOut = totalBytes - bytesIn;
    const degraded = conn.server.health === "degraded";
    await db.connection.update({ where: { id: conn.id }, data: { bytesIn: BigInt(bytesIn), bytesOut: BigInt(bytesOut), durationSec: elapsedSec, degraded } }).catch(() => {});
    if (sub.bandwidthGb !== null) {
      const used = Number(sub.bytesUsed) + Math.round(totalBytes * 0.02); // sampled accounting
      await db.subscription.update({ where: { id: sub.id }, data: { bytesUsed: BigInt(used) } }).catch(() => {});
    }
    return ok({
      state: degraded ? "degraded" : "connected",
      connection: {
        ...serializeConn(conn),
        durationSec: elapsedSec,
        bytesIn, bytesOut, throughputMbps, degraded,
      },
      tunnel: { addressV4: conn.exitIp ? `10.8.${(parseInt(conn.id.slice(-2), 36) % 250) + 1}.1` : null, dns: auth.dnsMode === "custom" ? auth.dnsServer : "10.8.0.1" },
      killSwitchActive: auth.killSwitch,
      subscription: subSummary(sub),
    });
  }

  if (action === "history") {
    const conns = await db.connection.findMany({
      where: { userId: auth.id, status: { not: "active" } },
      orderBy: { startedAt: "desc" },
      take: 50,
      include: { server: { include: { region: true } }, device: { select: { name: true, platform: true } } },
    });
    return ok({
      connections: conns.map((c) => ({
        id: c.id, startedAt: c.startedAt, endedAt: c.endedAt, durationSec: c.durationSec,
        bytesIn: Number(c.bytesIn), bytesOut: Number(c.bytesOut),
        reconnects: c.reconnects, degraded: c.degraded, endReason: c.endReason,
        protocol: c.protocol, transport: c.transport,
        serverCode: c.server.code, regionName: c.server.region.name, countryCode: c.server.region.countryCode,
        device: c.device.name,
      })),
    });
  }

  throw new ApiError(404, "not_found", `Unknown connection query "${action}".`);
}, { name: "connection.get" });

function serializeConn(c: {
  id: string; protocol: string; transport: string; startedAt: Date;
  server: { id: string; code: string; hostname: string; ipv4: string; wgPort: number; health: string; loadPct: number; latencyMs: number; region: { code: string; name: string; city: string; country: string; countryCode: string } };
  device: { id: string; name: string; platform: string };
}) {
  return {
    id: c.id, protocol: c.protocol, transport: c.transport, startedAt: c.startedAt,
    server: {
      id: c.server.id, code: c.server.code, hostname: c.server.hostname,
      ipv4: c.server.ipv4, port: c.server.wgPort, health: c.server.health,
      loadPct: c.server.loadPct, latencyMs: c.server.latencyMs,
      region: { code: c.server.region.code, name: c.server.region.name, city: c.server.region.city, country: c.server.region.country, countryCode: c.server.region.countryCode },
    },
    device: { id: c.device.id, name: c.device.name, platform: c.device.platform },
  };
}

function subSummary(sub: { plan: string; status: string; deviceLimit: number; bandwidthGb: number | null; bytesUsed: bigint; currentPeriodEnd: Date; cancelAtPeriodEnd: boolean }) {
  return {
    plan: sub.plan, status: sub.status, deviceLimit: sub.deviceLimit,
    bandwidthGb: sub.bandwidthGb, bytesUsed: Number(sub.bytesUsed),
    currentPeriodEnd: sub.currentPeriodEnd, cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  };
}
