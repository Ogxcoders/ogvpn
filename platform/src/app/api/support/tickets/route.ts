// Support tickets: list + create (Section AZ). Categories, priority, SLA metadata.
import { db } from "@/lib/db";
import { ok, route, readJson, requireString, sanitizeText, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { audit } from "@/lib/audit";

const CATEGORIES = ["technical", "billing", "account", "abuse", "other"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

export const GET = route(async (req) => {
  const auth = await requireUser(req);
  const tickets = await db.supportTicket.findMany({
    where: { userId: auth.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return ok({ tickets });
}, { name: "support.list" });

export const POST = route(async (req) => {
  const auth = await requireUser(req);
  const body = await readJson(req);
  const subject = requireString(body, "subject", 160);
  const message = requireString(body, "message", 4000);
  const category = sanitizeText(body.category, 12);
  const priority = sanitizeText(body.priority, 8);
  if (!CATEGORIES.includes(category)) {
    throw new ApiError(400, "invalid_input", `Category must be one of: ${CATEGORIES.join(", ")}.`);
  }
  if (!PRIORITIES.includes(priority)) {
    throw new ApiError(400, "invalid_input", `Priority must be one of: ${PRIORITIES.join(", ")}.`);
  }
  const sub = await db.subscription.findUnique({ where: { userId: auth.id } });
  const ticket = await db.supportTicket.create({
    data: { userId: auth.id, subject, category, priority, status: "open" },
  });
  await db.ticketMessage.create({ data: { ticketId: ticket.id, authorRole: "user", body: message } });
  await db.ticketMessage.create({
    data: {
      ticketId: ticket.id, authorRole: "system",
      body: `Ticket received. Reference ${ticket.id.slice(-8).toUpperCase()}. ${sub?.plan === "business" ? "Business SLA: 4h response." : sub?.plan === "pro" ? "Pro SLA: 1 business day." : "Free plan: 3 business days."}`,
    },
  });
  await audit({ actorId: auth.id, actorEmail: auth.email, action: "support.ticket_created", targetType: "ticket", targetId: ticket.id, metadata: { category, priority } });
  return ok({ ticket });
}, { name: "support.create" });
