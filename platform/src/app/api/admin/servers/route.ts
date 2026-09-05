// Admin server fleet management (AL 878-883, AM): register servers, drain,
// maintenance, enable/disable, capacity ops.
import { db } from "@/lib/db";
import { ok, route, readJson, requireString, sanitizeText, ApiError, getClientIp } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { audit } from "@/lib/audit";
import { generateWireguardKeypair } from "@/lib/crypto";

export const GET = route(async (req) => {
  await requireAdmin(req);
  const servers = await db.server.findMany({ include: { region: true }, orderBy: { code: "asc" } });
  const regions = await db.region.findMany({ orderBy: { name: "asc" } });
  return ok({
    regions,
    servers: servers.map((s) => ({
      id: s.id, code: s.code, hostname: s.hostname, region: { code: s.region.code, name: s.region.name, country: s.region.country },
      status: s.status, health: s.health, loadPct: s.loadPct, capacity: s.capacity,
      activeConnections: s.activeConnections, latencyMs: s.latencyMs, version: s.version,
      maintenanceUntil: s.maintenanceUntil, lastHeartbeatAt: s.lastHeartbeatAt,
    })),
  });
}, { name: "admin.servers.list" });

export const POST = route(async (req) => {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const action = sanitizeText(body.action, 20);

  if (action === "create") {
    const regionId = requireString(body, "regionId", 40);
    const region = await db.region.findUnique({ where: { id: regionId } });
    if (!region) throw new ApiError(404, "not_found", "Region not found.");
    const count = await db.server.count({ where: { regionId } });
    const kp = generateWireguardKeypair();
    const code = `${region.code.toUpperCase().replace("-", "")}-${String(count + 1).padStart(2, "0")}`;
    const server = await db.server.create({
      data: {
        code, hostname: `${region.code}-${String(count + 1).padStart(2, "0")}.aegisvpn.net`,
        regionId, status: "provisioning", loadPct: 0, capacity: 500,
        latencyMs: region.baseLatencyMs,
        publicKey: kp.publicKey, privateKey: kp.privateKey,
        wgPort: 51820 + ((count + 1) % 7),
        ipv4: `185.${(count * 7) % 250}.${region.lat % 250}.${10 + count}`,
        ipv6: `2a01:${count + 1}:a53::1`,
        protocols: JSON.stringify(["wireguard", "openvpn", "ikev2"]),
        version: "1.4.2",
      },
    });
    await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.server_provisioned", targetType: "server", targetId: code, ip: getClientIp(req) });
    return ok({ server });
  }

  if (action === "set-status") {
    const serverId = requireString(body, "serverId", 40);
    const status = sanitizeText(body.status, 14);
    if (!["online", "maintenance", "draining", "offline"].includes(status)) {
      throw new ApiError(400, "invalid_input", "Status must be online, maintenance, draining, or offline.");
    }
    const server = await db.server.findUnique({ where: { id: serverId } });
    if (!server) throw new ApiError(404, "not_found", "Server not found.");
    await db.server.update({
      where: { id: server.id },
      data: { status, maintenanceUntil: status === "maintenance" ? new Date(Date.now() + 2 * 3600e3) : null },
    });
    // Draining/offline: migrate active connections (AM 902)
    if (status === "draining" || status === "offline") {
      const conns = await db.connection.findMany({ where: { serverId: server.id, status: "active" } });
      for (const c of conns) {
        const durationSec = Math.round((Date.now() - c.startedAt.getTime()) / 1000);
        await db.connection.update({ where: { id: c.id }, data: { status: "ended", endedAt: new Date(), durationSec, endReason: "server_drained" } });
      }
      await db.server.update({ where: { id: server.id }, data: { activeConnections: 0 } });
    }
    await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.server_status_changed", targetType: "server", targetId: server.code, metadata: { status }, ip: getClientIp(req), severity: "warning" });
    return ok({ statusSet: status });
  }

  throw new ApiError(400, "invalid_input", `Unknown server action "${action}".`);
}, { name: "admin.servers.post" });
