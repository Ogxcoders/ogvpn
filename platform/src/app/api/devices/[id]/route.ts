// Device mutation (Section H): rename, split-tunnel rules, revocation.
import { db } from "@/lib/db";
import { ApiError, ok, route, readJson, sanitizeText, getClientIp } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { audit, notify } from "@/lib/audit";
import { validateSplitRules, isValidCidrOrDomain } from "@/lib/wg";
import { planOf } from "@/lib/entitlements";

async function getOwnedDevice(userId: string, id: string) {
  const device = await db.device.findFirst({ where: { id, userId, status: { not: "revoked" } } });
  if (!device) throw new ApiError(404, "not_found", "Device not found.");
  return device;
}

async function endActiveConnections(deviceId: string, reason: string) {
  const conns = await db.connection.findMany({ where: { deviceId, status: "active" } });
  for (const c of conns) {
    const durationSec = Math.round((Date.now() - c.startedAt.getTime()) / 1000);
    await db.connection.update({ where: { id: c.id }, data: { status: "ended", endedAt: new Date(), durationSec, endReason: reason } });
    await db.server.update({ where: { id: c.serverId }, data: { activeConnections: { decrement: 1 } } }).catch(() => {});
  }
  return conns.length;
}

export const PATCH = route(async (req, ctx) => {
  const auth = await requireUser(req);
  const params = ctx?.params ? await ctx.params : {};
  const device = await getOwnedDevice(auth.id, params.id);
  const body = await readJson(req);
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = sanitizeText(body.name, 60);
    if (!name) throw new ApiError(400, "invalid_input", "Device name cannot be empty.");
    data.name = name;
  }
  if (body.splitTunnelMode !== undefined || body.splitRules !== undefined) {
    const sub = await db.subscription.findUnique({ where: { userId: auth.id } });
    const ent = planOf(sub?.plan ?? "free");
    if (!ent.splitTunneling) {
      throw new ApiError(402, "subscription_required", "Split tunneling is a Pro feature. Upgrade to control per-app routing.", { upgradeUrl: "#pricing" });
    }
    const mode = sanitizeText(body.splitTunnelMode ?? device.splitTunnelMode, 10);
    if (!["off", "include", "exclude"].includes(mode)) {
      throw new ApiError(400, "invalid_input", "Split tunnel mode must be off, include, or exclude.");
    }
    const rules = Array.isArray(body.splitRules) ? body.splitRules : (body.splitRules !== undefined ? String(body.splitRules).split(/[\n,]/) : undefined);
    if (rules !== undefined) {
      const cleaned = (rules as unknown[]).map((r) => sanitizeText(r, 120)).filter(Boolean);
      for (const r of cleaned) {
        if (!isValidCidrOrDomain(r)) throw new ApiError(400, "config_error", `Invalid split rule: "${r}" — use CIDR, IP, or domain (e.g. 10.0.0.0/8, *.bank.com).`);
      }
      const seen = new Set<string>();
      for (const r of cleaned) {
        if (seen.has(r.toLowerCase())) throw new ApiError(400, "config_error", `Duplicate rule: "${r}"`);
        seen.add(r.toLowerCase());
      }
      validateSplitRules(mode, cleaned);
      data.splitRules = JSON.stringify(cleaned);
    }
    data.splitTunnelMode = mode;
  }
  if (body.markSeen) data.lastSeenAt = new Date();

  const updated = await db.device.update({ where: { id: device.id }, data });
  await audit({ actorId: auth.id, actorEmail: auth.email, action: "device.updated", targetType: "device", targetId: device.id, metadata: { fields: Object.keys(data) }, ip: getClientIp(req) });
  return ok({
    device: { ...updated, splitRules: updated.splitRules ? JSON.parse(updated.splitRules) : [] },
  });
}, { name: "devices.patch" });

export const DELETE = route(async (req, ctx) => {
  const auth = await requireUser(req);
  const params = ctx?.params ? await ctx.params : {};
  const device = await getOwnedDevice(auth.id, params.id);
  const ended = await endActiveConnections(device.id, "device_revoked");
  await db.device.update({ where: { id: device.id }, data: { status: "revoked" } });
  await db.vpnConfig.updateMany({ where: { deviceId: device.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit({ actorId: auth.id, actorEmail: auth.email, action: "device.revoked", targetType: "device", targetId: device.id, ip: getClientIp(req), severity: "warning" });
  await notify({
    userId: auth.id, category: "security", type: "device_revoked", priority: "important",
    title: "Device revoked", body: `"${device.name}" was revoked and its configurations invalidated.`,
  });
  return ok({ revoked: true, connectionsEnded: ended });
}, { name: "devices.revoke" });
