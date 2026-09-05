// Admin user management (AL 872-873, AK 865): search, inspect, suspend,
// restore, plan override, deletion.
import { db } from "@/lib/db";
import { ok, route, readJson, sanitizeText, ApiError, getClientIp } from "@/lib/api";
import { requireAdmin, revokeAllSessions } from "@/lib/session";
import { audit, notify } from "@/lib/audit";

export const GET = route(async (req, ctx) => {
  await requireAdmin(req);
  const params = ctx?.params ? await ctx.params : {};
  const { searchParams } = new URL(req.url);

  if (params.id) {
    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        subscription: true,
        devices: { where: { status: { not: "revoked" } } },
        sessions: { where: { revokedAt: null }, select: { id: true, deviceLabel: true, ip: true, lastSeenAt: true } },
        connections: { orderBy: { startedAt: "desc" }, take: 10, include: { server: { include: { region: true } } } },
        invoices: { orderBy: { createdAt: "desc" }, take: 10 },
        tickets: { orderBy: { updatedAt: "desc" }, take: 5 },
      },
    });
    if (!user) throw new ApiError(404, "not_found", "User not found.");
    const authAttempts = await db.authAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 15 });
    const auditEvents = await db.auditEvent.findMany({ where: { actorId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
    return ok({
      user: { ...user, passwordHash: undefined, totpSecret: undefined, backupCodes: undefined },
      authAttempts, auditEvents,
    });
  }

  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const status = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 15;
  const where = {
    ...(q ? { email: { contains: q } } : {}),
    ...(status ? { status } : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
      include: { subscription: { select: { plan: true, status: true } } },
    }),
    db.user.count({ where }),
  ]);
  return ok({
    users: users.map((u) => ({ ...u, passwordHash: undefined, totpSecret: undefined, backupCodes: undefined })),
    total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)),
  });
}, { name: "admin.users.list" });

export const PATCH = route(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const params = ctx?.params ? await ctx.params : {};
  const body = await readJson(req);
  const target = await db.user.findUnique({ where: { id: params.id }, include: { subscription: true } });
  if (!target) throw new ApiError(404, "not_found", "User not found.");
  if (target.id === admin.id && body.action === "suspend") {
    throw new ApiError(400, "invalid_input", "You cannot suspend your own administrator account.");
  }

  switch (body.action) {
    case "suspend": {
      await db.user.update({ where: { id: target.id }, data: { status: "suspended", statusReason: sanitizeText(body.reason, 200) || "Policy violation" } });
      await db.connection.updateMany({ where: { userId: target.id, status: "active" }, data: { status: "ended", endedAt: new Date(), endReason: "account_suspended" } });
      await revokeAllSessions(target.id, "suspended");
      await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.user_suspended", targetType: "user", targetId: target.id, metadata: { reason: body.reason }, ip: getClientIp(req), severity: "warning" });
      return ok({ suspended: true });
    }
    case "unsuspend": {
      await db.user.update({ where: { id: target.id }, data: { status: "active", statusReason: null, failedLoginCount: 0, lockedUntil: null } });
      await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.user_unsuspended", targetType: "user", targetId: target.id, ip: getClientIp(req) });
      return ok({ unsuspended: true });
    }
    case "set-plan": {
      const plan = sanitizeText(body.plan, 12);
      if (!["free", "pro", "business"].includes(plan)) throw new ApiError(400, "invalid_input", "Invalid plan.");
      const limits = { free: 1, pro: 10, business: 30 } as Record<string, number>;
      const bandwidth = { free: 10, pro: null, business: null } as Record<string, number | null>;
      await db.subscription.update({
        where: { userId: target.id },
        data: { plan, deviceLimit: limits[plan], bandwidthGb: bandwidth[plan], status: "active" },
      });
      await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.plan_override", targetType: "user", targetId: target.id, metadata: { plan }, ip: getClientIp(req), severity: "warning" });
      await notify({ userId: target.id, category: "billing", type: "plan_changed", title: "Your plan changed", body: `Your plan was changed to ${plan} by the Aegis team. Contact support if this is unexpected.`, priority: "important" });
      return ok({ planSet: plan });
    }
    case "unlock": {
      await db.user.update({ where: { id: target.id }, data: { failedLoginCount: 0, lockedUntil: null } });
      await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.user_unlocked", targetType: "user", targetId: target.id, ip: getClientIp(req) });
      return ok({ unlocked: true });
    }
    case "force-logout": {
      const n = await revokeAllSessions(target.id, "admin_force_logout");
      await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.force_logout", targetType: "user", targetId: target.id, metadata: { sessions: n }, ip: getClientIp(req), severity: "warning" });
      return ok({ revokedSessions: n });
    }
    default:
      throw new ApiError(400, "invalid_input", `Unknown admin action "${body.action}".`);
  }
}, { name: "admin.users.patch" });
