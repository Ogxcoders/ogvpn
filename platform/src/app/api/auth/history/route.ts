// Authentication history for the current user (E 110).
import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/session";

export const GET = route(async (req) => {
  const auth = await requireUser(req);
  const attempts = await db.authAttempt.findMany({
    where: { userId: auth.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: { id: true, success: true, reason: true, ip: true, createdAt: true },
  });
  return ok(attempts);
}, { name: "auth.history" });
