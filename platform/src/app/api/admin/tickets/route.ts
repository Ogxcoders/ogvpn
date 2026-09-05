// Admin support queue (AL 887): all tickets with filters.
import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

export const GET = route(async (req) => {
  await requireAdmin(req);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tickets = await db.supportTicket.findMany({
    where: status ? { status } : {},
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
    include: {
      user: { select: { email: true, subscription: { select: { plan: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return ok({ tickets });
}, { name: "admin.tickets" });
