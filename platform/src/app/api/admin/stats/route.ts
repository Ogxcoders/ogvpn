// Admin stats (AL/AH): platform KPIs, connection success metrics, revenue,
// server fleet health, release health.
import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { metricsSnapshot } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireAdmin(req);
  const dayAgo = new Date(Date.now() - 86400e3);
  const monthAgo = new Date(Date.now() - 30 * 86400e3);

  const [
    totalUsers, activeUsers, newUsers24h, suspendedUsers,
    totalServers, onlineServers, maintenanceServers, degradedServers,
    activeConnections, connections24h, failedConnections24h,
    subs, proCount, businessCount, freeCount,
    revenue30d, openTickets, openIncidents, failedAuths24h, suspiciousAuths24h,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "active" } }),
    db.user.count({ where: { createdAt: { gte: dayAgo } } }),
    db.user.count({ where: { status: "suspended" } }),
    db.server.count(),
    db.server.count({ where: { status: "online" } }),
    db.server.count({ where: { status: "maintenance" } }),
    db.server.count({ where: { health: { not: "healthy" } } }),
    db.connection.count({ where: { status: "active" } }),
    db.connection.count({ where: { startedAt: { gte: dayAgo } } }),
    db.connection.count({ where: { status: "failed", startedAt: { gte: dayAgo } } }),
    db.subscription.findMany({ select: { plan: true, status: true } }),
    db.subscription.count({ where: { plan: "pro", status: { in: ["active", "grace"] } } }),
    db.subscription.count({ where: { plan: "business", status: { in: ["active", "grace"] } } }),
    db.subscription.count({ where: { plan: "free" } }),
    db.invoice.aggregate({ where: { createdAt: { gte: monthAgo }, status: "paid" }, _sum: { amountCents: true } }),
    db.supportTicket.count({ where: { status: { in: ["open", "pending"] } } }),
    db.incident.count({ where: { status: { not: "resolved" } } }),
    db.authAttempt.count({ where: { success: false, createdAt: { gte: dayAgo } } }),
    db.authAttempt.count({ where: { suspicious: true, createdAt: { gte: dayAgo } } }),
  ]);

  const mrrCents = proCount * 799 + businessCount * 2499;
  const snap = metricsSnapshot();
  const apiErrorRate = (() => {
    const entries = Object.entries(snap.apis);
    const total = entries.reduce((a, [, c]) => a + c.count, 0);
    const errors = entries.reduce((a, [, c]) => a + c.errors, 0);
    return total ? +(errors / total * 100).toFixed(2) : 0;
  })();

  return ok({
    users: { total: totalUsers, active: activeUsers, new24h: newUsers24h, suspended: suspendedUsers },
    servers: { total: totalServers, online: onlineServers, maintenance: maintenanceServers, degraded: degradedServers, uptimePct: totalServers ? +(((totalServers - maintenanceServers) / totalServers) * 100).toFixed(2) : 100 },
    connections: { active: activeConnections, last24h: connections24h, failed24h: failedConnections24h, successRatePct: connections24h ? +(((connections24h - failedConnections24h) / connections24h) * 100).toFixed(1) : 100 },
    subscriptions: { free: freeCount, pro: proCount, business: businessCount, mrrCents, revenue30dCents: revenue30d._sum.amountCents || 0 },
    ops: { openTickets, openIncidents, failedAuths24h, suspiciousAuths24h, apiErrorRatePct: apiErrorRate },
    slo: { connectSuccessTarget: 99.5, apiAvailabilityTarget: 99.9, dnsLeakIncidents: 0 },
  });
}, { name: "admin.stats" });
