// Admin support tooling (AL 887): all tickets, agent replies, status transitions.
import { db } from "@/lib/db";
import { ok, route, readJson, requireString, sanitizeText, ApiError, getClientIp } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { notify } from "@/lib/audit";

export const GET = route(async (req, ctx) => {
  await requireAdmin(req);
  const params = ctx?.params ? await ctx.params : {};
  if (params.id) {
    const ticket = await db.supportTicket.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { createdAt: "asc" } }, user: { select: { email: true, name: true, subscription: { select: { plan: true } } } } },
    });
    if (!ticket) throw new ApiError(404, "not_found", "Ticket not found.");
    return ok({ ticket });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tickets = await db.supportTicket.findMany({
    where: status ? { status } : {},
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 100,
    include: { user: { select: { email: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return ok({ tickets });
}, { name: "admin.tickets.list" });

export const POST = route(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const params = ctx?.params ? await ctx.params : {};
  const body = await readJson(req);
  const ticket = await db.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket) throw new ApiError(404, "not_found", "Ticket not found.");

  if (body.action === "reply") {
    const text = requireString(body, "message", 4000);
    await db.ticketMessage.create({ data: { ticketId: ticket.id, authorRole: "agent", authorName: admin.name || "Aegis Support", body: text } });
    await db.supportTicket.update({ where: { id: ticket.id }, data: { status: "solved" } });
    await notify({ userId: ticket.userId, category: "account", type: "support_reply", title: `Support replied: ${ticket.subject}`, body: "Your support ticket has a new response." });
    return ok({ replied: true });
  }
  if (body.action === "status") {
    const status = sanitizeText(body.status, 10);
    if (!["open", "pending", "solved", "closed"].includes(status)) throw new ApiError(400, "invalid_input", "Invalid status.");
    await db.supportTicket.update({ where: { id: ticket.id }, data: { status } });
    return ok({ statusSet: status });
  }
  throw new ApiError(400, "invalid_input", "Unknown ticket action.");
}, { name: "admin.tickets.post" });
