// Knowledge base listing (BA): articles by category + search.
import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";

export const GET = route(async (req) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = (searchParams.get("q") || "").toLowerCase();
  const articles = await db.kbArticle.findMany({
    where: category ? { category } : {},
    orderBy: { order: "asc" },
  });
  const filtered = q
    ? articles.filter((a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q))
    : articles;
  return ok({
    articles: filtered,
    categories: ["getting-started", "connection", "security", "billing", "privacy", "platform"],
  });
}, { name: "kb.list" });
