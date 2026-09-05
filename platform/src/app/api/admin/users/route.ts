// Admin user search/list (AL 872).
import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";
import { requireAdmin } from "@/lib/session";

export const GET = route(async (req) => {
  await requireAdmin(req);
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const status = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 15;
  const where = {
    ...(q ? { email: { contains: q } } : {}),
    ...(status ? { status } : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
      include: { subscription: { select: { plan: true, status: true } } },
    }),
    db.user.count({ where }),
  ]);
  return ok({
    users: users.map((u) => ({ ...u, passwordHash: undefined, totpSecret: undefined, backupCodes: undefined })),
    total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)),
  });
}, { name: "admin.users" });
