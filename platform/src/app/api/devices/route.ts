// Device management (Section H): registration, identification, naming, status,
// limits, revocation, key provisioning, split tunneling, security alerts.
import { db } from "@/lib/db";
import { ApiError, ok, route, readJson, requireString, sanitizeText, getClientIp, metricCounter } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { audit, notify } from "@/lib/audit";
import { generateWireguardKeypair } from "@/lib/crypto";
import { isValidCidrOrDomain } from "@/lib/wg";

const PLATFORMS = ["android", "windows", "macos", "linux", "ios", "web", "extension"];

function serializeDevice(d: {
  id: string; name: string; platform: string; osVersion: string | null; appVersion: string | null;
  status: string; publicKey: string; configVersion: number; splitTunnelMode: string; splitRules: string | null;
  lastSeenAt: Date | null; createdAt: Date;
}, activeConnection?: { id: string; serverCode?: string } | null) {
  return {
    id: d.id, name: d.name, platform: d.platform, osVersion: d.osVersion, appVersion: d.appVersion,
    status: d.status, publicKeyFingerprint: d.publicKey.slice(0, 10), configVersion: d.configVersion,
    splitTunnelMode: d.splitTunnelMode, splitRules: d.splitRules ? JSON.parse(d.splitRules) : [],
    lastSeenAt: d.lastSeenAt, createdAt: d.createdAt,
    activeConnection: activeConnection ?? null,
  };
}

export const GET = route(async (req) => {
  const auth = await requireUser(req);
  const devices = await db.device.findMany({
    where: { userId: auth.id, status: { not: "revoked" } },
    orderBy: { createdAt: "asc" },
  });
  const activeConnections = await db.connection.findMany({
    where: { userId: auth.id, status: "active" },
    include: { server: { select: { code: true, hostname: true } } },
  });
  const sub = await db.subscription.findUnique({ where: { userId: auth.id } });
  return ok({
    deviceLimit: sub?.deviceLimit ?? 1,
    plan: sub?.plan ?? "free",
    devices: devices.map((d) => {
      const active = activeConnections.find((c) => c.deviceId === d.id);
      return serializeDevice(
        d,
        active ? { id: active.id, serverCode: active.server.code } : null
      );
    }),
  });
}, { name: "devices.list" });

export const POST = route(async (req) => {
  const auth = await requireUser(req);
  const body = await readJson(req);
  const name = requireString(body, "name", 60);
  const platform = sanitizeText(body.platform, 12) || "web";
  if (!PLATFORMS.includes(platform)) {
    throw new ApiError(400, "invalid_input", `Platform must be one of: ${PLATFORMS.join(", ")}.`);
  }
  const sub = await db.subscription.findUnique({ where: { userId: auth.id } });
  if (!sub) throw new ApiError(404, "not_found", "Subscription missing.");
  if (!["active", "trialing", "grace"].includes(sub.status)) {
    throw new ApiError(402, "subscription_required", "Your subscription is not active. Reactivate it to register devices.");
  }
  const count = await db.device.count({ where: { userId: auth.id, status: { not: "revoked" } } });
  if (count >= sub.deviceLimit) {
    throw new ApiError(409, "device_limit_reached",
      `Your ${sub.plan} plan allows ${sub.deviceLimit} device${sub.deviceLimit > 1 ? "s" : ""}. Upgrade to add more.`,
      { deviceLimit: sub.deviceLimit, plan: sub.plan });
  }
  const dupe = await db.device.findFirst({ where: { userId: auth.id, name, status: { not: "revoked" } } });
  if (dupe) throw new ApiError(409, "conflict", "You already have a device with that name.");
  // Provisioning (Section I/L): generate device keypair, return private key once over TLS.
  const kp = generateWireguardKeypair();
  const device = await db.device.create({
    data: {
      userId: auth.id, name, platform,
      osVersion: sanitizeText(body.osVersion, 40) || null,
      appVersion: sanitizeText(body.appVersion, 12) || "1.2.0",
      publicKey: kp.publicKey, privateKey: kp.privateKey,
      status: "active",
    },
  });
  metricCounter("device_registered");
  await audit({ actorId: auth.id, actorEmail: auth.email, action: "device.registered", targetType: "device", targetId: device.id, metadata: { platform }, ip: getClientIp(req) });
  await notify({
    userId: auth.id, category: "device", type: "device_registered", priority: "important",
    title: "New device added", body: `"${name}" (${platform}) was registered to your account. If this wasn't you, revoke it immediately.`,
  });
  return ok({
    device: serializeDevice(device),
    credentials: { privateKey: kp.privateKey }, // shown once — secure transport
  });
}, { name: "devices.create" });
