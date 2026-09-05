// Admin incident management (BE): create, update (timeline), resolve.
import { db } from "@/lib/db";
import { ok, route, readJson, requireString, sanitizeText, ApiError, getClientIp } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { audit, notify } from "@/lib/audit";

export const GET = route(async (req) => {
  await requireAdmin(req);
  const incidents = await db.incident.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { updates: { orderBy: { createdAt: "asc" } } },
  });
  return ok({ incidents });
}, { name: "admin.incidents.list" });

export const POST = route(async (req) => {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const action = sanitizeText(body.action, 16);

  if (action === "create") {
    const title = requireString(body, "title", 160);
    const severity = sanitizeText(body.severity, 10);
    const status = sanitizeText(body.status, 14) || "investigating";
    if (!["minor", "major", "critical"].includes(severity)) throw new ApiError(400, "invalid_input", "Severity must be minor, major, or critical.");
    if (!["investigating", "identified", "monitoring", "resolved"].includes(status)) throw new ApiError(400, "invalid_input", "Invalid status.");
    const components = Array.isArray(body.components) ? body.components.map((c: unknown) => sanitizeText(c, 40)).filter(Boolean) : [];
    const message = requireString(body, "message", 2000);
    const incident = await db.incident.create({
      data: { title, severity, status, components: JSON.stringify(components) },
    });
    await db.incidentUpdate.create({ data: { incidentId: incident.id, status, message } });
    await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.incident_created", targetType: "incident", targetId: incident.id, metadata: { severity }, ip: getClientIp(req), severity: "warning" });
    // Fan out incident notifications (AF 728)
    const users = await db.user.findMany({ where: { status: "active" }, select: { id: true }, take: 500 });
    for (const u of users) {
      await notify({
        userId: u.id, category: "incident", type: "incident_opened", priority: severity === "critical" ? "critical" : "important",
        title: `Service notice: ${title}`,
        body: message,
      }).catch(() => {});
    }
    return ok({ incident });
  }

  if (action === "update") {
    const incidentId = requireString(body, "incidentId", 40);
    const status = sanitizeText(body.status, 14);
    const message = requireString(body, "message", 2000);
    if (!["investigating", "identified", "monitoring", "resolved"].includes(status)) throw new ApiError(400, "invalid_input", "Invalid status.");
    const incident = await db.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new ApiError(404, "not_found", "Incident not found.");
    await db.incident.update({
      where: { id: incident.id },
      data: { status, resolvedAt: status === "resolved" ? new Date() : null },
    });
    await db.incidentUpdate.create({ data: { incidentId: incident.id, status, message } });
    await audit({ actorId: admin.id, actorEmail: admin.email, action: "admin.incident_updated", targetType: "incident", targetId: incident.id, metadata: { status }, ip: getClientIp(req) });
    return ok({ updated: true });
  }

  throw new ApiError(400, "invalid_input", `Unknown incident action "${action}".`);
}, { name: "admin.incidents.post" });
