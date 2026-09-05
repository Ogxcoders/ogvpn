// Support ticket detail: view, reply, close (Section AZ).
import { db } from "@/lib/db";
import { ok, route, readJson, requireString, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";

export const GET = route(async (req, ctx) => {
  const auth = await requireUser(req);
  const params = ctx?.params ? await ctx.params : {};
  const ticket = await db.supportTicket.findFirst({
    where: { id: params.id, userId: auth.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) throw new ApiError(404, "not_found", "Ticket not found.");
  return ok({ ticket });
}, { name: "support.detail" });

export const POST = route(async (req, ctx) => {
  const auth = await requireUser(req);
  const params = ctx?.params ? await ctx.params : {};
  const body = await readJson(req);
  const ticket = await db.supportTicket.findFirst({ where: { id: params.id, userId: auth.id } });
  if (!ticket) throw new ApiError(404, "not_found", "Ticket not found.");

  if (body.action === "close") {
    await db.supportTicket.update({ where: { id: ticket.id }, data: { status: "closed" } });
    await audit({ actorId: auth.id, actorEmail: auth.email, action: "support.ticket_closed", targetType: "ticket", targetId: ticket.id });
    return ok({ closed: true });
  }
  const text = requireString(body, "message", 4000);
  await db.ticketMessage.create({ data: { ticketId: ticket.id, authorRole: "user", body: text } });
  const userMsgCount = await db.ticketMessage.count({ where: { ticketId: ticket.id, authorRole: "user" } });
  if (userMsgCount === 1) {
    await db.supportTicket.update({ where: { id: ticket.id }, data: { status: "pending" } });
    await db.ticketMessage.create({
      data: { ticketId: ticket.id, authorRole: "agent", authorName: "Aegis Support", body: "Thanks for the details! Our team will follow up within one business day. Priority SLA applies for Pro and Business plans." },
    });
  }
  await audit({ actorId: auth.id, actorEmail: auth.email, action: "support.replied", targetType: "ticket", targetId: ticket.id });
  const updated = await db.supportTicket.findUnique({ where: { id: ticket.id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  return ok({ ticket: updated });
}, { name: "support.reply" });
