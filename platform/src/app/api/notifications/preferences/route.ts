// Notification preferences (AF 732): per-category + channel matrix.
import { db } from "@/lib/db";
import { ok, route, readJson, sanitizeText } from "@/lib/api";
import { requireUser } from "@/lib/session";

const CATEGORY_FIELDS = ["connection", "security", "account", "billing", "maintenance", "incident", "update"];
const CHANNEL_FIELDS = ["emailEnabled", "pushEnabled", "inProductEnabled"];

export const GET = route(async (req) => {
  const auth = await requireUser(req);
  let pref = await db.notificationPref.findUnique({ where: { userId: auth.id } });
  if (!pref) pref = await db.notificationPref.create({ data: { userId: auth.id } });
  return ok({ preferences: pref });
}, { name: "notifications.prefs.get" });

export const PATCH = route(async (req) => {
  const auth = await requireUser(req);
  const body = await readJson(req);
  const data: Record<string, boolean> = {};
  for (const f of CATEGORY_FIELDS) {
    if (typeof body[f] === "boolean") data[f] = body[f] as boolean;
  }
  for (const f of CHANNEL_FIELDS) {
    if (typeof body[f] === "boolean") data[f] = body[f] as boolean;
  }
  const pref = await db.notificationPref.upsert({
    where: { userId: auth.id },
    update: data,
    create: { userId: auth.id, ...data },
  });
  return ok({ preferences: pref });
}, { name: "notifications.prefs.patch" });
