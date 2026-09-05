// Admin audit log viewer (AL 889 / AI 807): filterable security & audit trail.
import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

export const GET = route(async (req) => {
  await requireAdmin(req);
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const severity = searchParams.get("severity") || "";
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 30;
  const where = {
    ...(severity ? { severity } : {}),
    ...(q ? { OR: [{ actorEmail: { contains: q } }, { action: { contains: q } }] } : {}),
  };
  const [events, total, actions] = await Promise.all([
    db.auditEvent.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
    }),
    db.auditEvent.count({ where }),
    db.auditEvent.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
  ]);
  const filtered = action ? events.filter((e) => e.action === action) : events;
  return ok({ events: filtered, total, page, pageSize, actions: actions.map((a) => a.action) });
}, { name: "admin.audit" });
