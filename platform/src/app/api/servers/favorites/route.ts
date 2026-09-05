// Favorites & recents (Section AA 611/612).
import { db } from "@/lib/db";
import { ok, route, readJson, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/session";

export const POST = route(async (req) => {
  const auth = await requireUser(req);
  const body = await readJson(req);
  const serverId = typeof body.serverId === "string" ? body.serverId : "";
  if (!serverId) throw new ApiError(400, "invalid_input", "serverId is required.");
  const existing = await db.favorite.findUnique({ where: { userId_serverId: { userId: auth.id, serverId } } });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return ok({ favorited: false });
  }
  await db.favorite.create({ data: { userId: auth.id, serverId } });
  return ok({ favorited: true });
}, { name: "servers.favorites" });
