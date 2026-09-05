// Notifications (Section AF): taxonomy-driven list, read state, dedupe,
// preferences with per-category and per-channel control.
import { db } from "@/lib/db";
import { ok, route, readJson, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";

export const GET = route(async (req) => {
  const auth = await requireUser(req);
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "1";
  const category = searchParams.get("category");
  const notifications = await db.notification.findMany({
    where: { userId: auth.id, ...(unreadOnly ? { read: false } : {}), ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const unread = await db.notification.count({ where: { userId: auth.id, read: false } });
  return ok({ notifications, unread });
}, { name: "notifications.list" });

export const PATCH = route(async (req) => {
  const auth = await requireUser(req);
  const body = await readJson(req);
  if (body.action === "read-all") {
    await db.notification.updateMany({ where: { userId: auth.id, read: false }, data: { read: true } });
    return ok({ readAll: true });
  }
  if (body.action === "read" && typeof body.id === "string") {
    const n = await db.notification.findFirst({ where: { id: body.id, userId: auth.id } });
    if (!n) throw new ApiError(404, "not_found", "Notification not found.");
    await db.notification.update({ where: { id: n.id }, data: { read: !body.unread ? true : false } });
    return ok({ updated: true });
  }
  throw new ApiError(400, "invalid_input", "Provide action=read-all or action=read with id.");
}, { name: "notifications.patch" });
