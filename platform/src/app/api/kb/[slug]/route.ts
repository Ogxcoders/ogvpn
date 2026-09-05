// Knowledge base (BA 1197 / AZ): articles by category, individual lookup.
import { db } from "@/lib/db";
import { ok, route, ApiError } from "@/lib/api";

export const GET = route(async (req, ctx) => {
  const params = ctx?.params ? await ctx.params : {};
  if (params.slug) {
    const article = await db.kbArticle.findUnique({ where: { slug: params.slug } });
    if (!article) throw new ApiError(404, "not_found", "Article not found.");
    return ok({ article });
  }
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = (searchParams.get("q") || "").toLowerCase();
  const articles = await db.kbArticle.findMany({
    where: { ...(category ? { category } : {}) },
    orderBy: { order: "asc" },
  });
  const filtered = q
    ? articles.filter((a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q))
    : articles;
  return ok({ articles: filtered, categories: ["getting-started", "connection", "security", "billing", "privacy", "platform"] });
}, { name: "kb" });
