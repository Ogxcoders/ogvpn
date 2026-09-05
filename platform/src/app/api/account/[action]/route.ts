// Account privacy operations (E/BB): data export (GDPR access), account deletion
// with retention window & restore policy, privacy/telemetry controls, diagnostics.
import { db } from "@/lib/db";
import { ApiError, ok, route, readJson, readJsonSafe, requireString, getClientIp } from "@/lib/api";
import { requireUser, revokeAllSessions } from "@/lib/session";
import { audit, notify } from "@/lib/audit";

export const GET = route(async (req, ctx) => {
  const auth = await requireUser(req);
  const params = ctx?.params ? await ctx.params : {};
  if (params.action === "export") {
    // Account export workflow (E120 / BB 1231): full data portability
    const [user, devices, connections, sub, invoices, tickets, notifications] = await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: auth.id }, select: { email: true, name: true, createdAt: true, mfaEnabled: true, killSwitch: true, autoConnect: true, protocolPreference: true, dnsMode: true, analyticsOptOut: true } }),
      db.device.findMany({ where: { userId: auth.id } }),
      db.connection.findMany({ where: { userId: auth.id }, orderBy: { startedAt: "desc" }, take: 500 }),
      db.subscription.findUnique({ where: { userId: auth.id } }),
      db.invoice.findMany({ where: { userId: auth.id } }),
      db.supportTicket.findMany({ where: { userId: auth.id }, include: { messages: true } }),
      db.notification.findMany({ where: { userId: auth.id } }),
    ]);
    const exportData = {
      exportedAt: new Date().toISOString(),
      format: "aegisvpn.account.export/v1",
      account: { ...user, passwordHash: undefined, totpSecret: undefined },
      devices, connections, subscription: sub, invoices,
      supportTickets: tickets, notifications,
      policies: { retention: "30 days after deletion request", contact: "privacy@aegisvpn.io" },
    };
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "privacy.data_exported", ip: getClientIp(req) });
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="aegis-account-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }
  if (params.action === "diagnostics") {
    // Privacy-safe diagnostics (AI 816): no browsing data, no DNS queries, no payloads
    const conns = await db.connection.findMany({ where: { userId: auth.id }, orderBy: { startedAt: "desc" }, take: 20, include: { server: { include: { region: true } } } });
    const diag = {
      generatedAt: new Date().toISOString(),
      appVersion: auth.clientVersion,
      platform: "web",
      protocol: auth.protocolPreference,
      killSwitch: auth.killSwitch, ipv6: auth.ipv6Enabled, lanBypass: auth.lanBypass,
      dnsMode: auth.dnsMode,
      recentConnections: conns.map((c) => ({
        startedAt: c.startedAt, endedAt: c.endedAt, status: c.status, endReason: c.endReason,
        serverCode: c.server.code, protocol: c.protocol, reconnects: c.reconnects,
      })),
      exclusions: "No traffic content, no DNS queries, no IPs of visited services are collected.",
    };
    return new Response(JSON.stringify(diag, null, 2), {
      headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="aegis-diagnostics.json"' },
    });
  }
  throw new ApiError(404, "not_found", "Unknown account endpoint.");
}, { name: "account.get" });

export const POST = route(async (req, ctx) => {
  const auth = await requireUser(req);
  const params = ctx?.params ? await ctx.params : {};
  const body = await readJsonSafe(req);

  if (params.action === "privacy") {
    const data: Record<string, unknown> = {};
    if (typeof body.analyticsOptOut === "boolean") data.analyticsOptOut = body.analyticsOptOut;
    if (typeof body.telemetryEnabled === "boolean") data.telemetryEnabled = body.telemetryEnabled;
    await db.user.update({ where: { id: auth.id }, data });
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "privacy.preferences_updated", metadata: data, ip: getClientIp(req) });
    return ok({ updated: true, ...data });
  }

  if (params.action === "delete") {
    // Account deletion (E105/BB 1229): password confirm → soft delete → 30-day restore window → purge
    const { verifyPassword } = await import("@/lib/crypto");
    const password = requireString(body, "password", 128);
    if (!verifyPassword(password, auth.passwordHash)) {
      throw new ApiError(401, "invalid_credentials", "Password confirmation failed.");
    }
    const purgeAt = new Date(Date.now() + 30 * 86400e3);
    await db.user.update({
      where: { id: auth.id },
      data: { status: "deleted", statusReason: "user_requested", purgeAt },
    });
    await db.connection.updateMany({ where: { userId: auth.id, status: "active" }, data: { status: "ended", endedAt: new Date(), endReason: "account_deleted" } });
    await revokeAllSessions(auth.id, "account_deleted");
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "account.deletion_requested", metadata: { purgeAt }, ip: getClientIp(req), severity: "warning" });
    return ok({
      deleted: true, purgeAt,
      restorePolicy: "Sign in again within 30 days to cancel deletion and restore your account.",
    });
  }

  if (params.action === "restore") {
    // Account restoration policy (E106): sign-in within the window undoes deletion
    const user = await db.user.findUnique({ where: { id: auth.id } });
    if (!user || user.status !== "deleted") throw new ApiError(400, "invalid_input", "No pending deletion to restore.");
    if (user.purgeAt && user.purgeAt.getTime() < Date.now()) {
      throw new ApiError(410, "conflict", "The restoration window has passed.");
    }
    await db.user.update({ where: { id: auth.id }, data: { status: "active", statusReason: null, purgeAt: null } });
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "account.restored", ip: getClientIp(req) });
    return ok({ restored: true });
  }

  throw new ApiError(404, "not_found", "Unknown account endpoint.");
}, { name: "account.post" });
