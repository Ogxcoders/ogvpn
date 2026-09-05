// Server catalog (Sections I/AA): regions, servers, availability, capacity,
// maintenance status, latency, load; per-user favorites & recents; filtering,
// search, plan gating.
import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

export const GET = route(async (req) => {
  const user = await getSessionUser(req);
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const continent = searchParams.get("continent") || "";
  const tier = searchParams.get("tier") || "";

  const regions = await db.region.findMany({
    where: {
      ...(continent ? { continent } : {}),
      ...(q ? { OR: [
        { name: { contains: q } }, { city: { contains: q } },
        { country: { contains: q } }, { countryCode: { contains: q } },
      ] } : {}),
    },
    include: {
      servers: { orderBy: { code: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const userId = user?.id;
  const [favorites, recents] = userId
    ? await Promise.all([
        db.favorite.findMany({ where: { userId } }),
        db.recentServer.findMany({ where: { userId }, orderBy: { usedAt: "desc" }, take: 8 }),
      ])
    : [[], []];
  const favSet = new Set(favorites.map((f) => f.serverId));
  const recentSet = new Map(recents.map((r) => [r.serverId, r.usedAt]));

  const sub = userId ? await db.subscription.findUnique({ where: { userId } }) : null;
  const plan = sub?.plan ?? "free";
  const subStatus = sub?.status ?? "active";
  const isPremium = plan === "pro" || plan === "business";

  const data = regions
    .filter((r) => !tier || r.tier === tier)
    .map((r) => {
      const servers = r.servers.map((s) => {
        const usable = isPremium ? true : r.freeAllowed;
        return {
          id: s.id, code: s.code, hostname: s.hostname,
          status: s.status, health: s.health, loadPct: s.loadPct,
          capacity: s.capacity, activeConnections: s.activeConnections,
          latencyMs: s.latencyMs, protocols: JSON.parse(s.protocols) as string[],
          version: s.version, dedicated: s.dedicated,
          maintenanceUntil: s.maintenanceUntil,
          favorite: favSet.has(s.id),
          recent: recentSet.has(s.id),
          locked: !usable,
        };
      });
      const online = servers.filter((s) => s.status === "online");
      const best = online.length
        ? Math.min(...online.map((s) => s.latencyMs + Math.round(s.loadPct / 4)))
        : null;
      return {
        id: r.id, code: r.code, name: r.name, city: r.city, country: r.country,
        countryCode: r.countryCode, continent: r.continent, tier: r.tier,
        freeAllowed: r.freeAllowed, locked: !isPremium && !r.freeAllowed,
        serverCount: servers.length, onlineCount: online.length,
        bestScore: best,
        avgLatencyMs: online.length ? Math.round(online.reduce((a, s) => a + s.latencyMs, 0) / online.length) : r.baseLatencyMs,
        maxLoad: online.length ? Math.max(...online.map((s) => s.loadPct)) : 0,
        servers,
      };
    });

  // Recommended: lowest latency score among unlocked, online, non-maintenance
  const recommended = data
    .flatMap((r) => r.servers.filter((s) => s.status === "online" && !s.locked).map((s) => ({ ...s, region: r })))
    .sort((a, b) => (a.latencyMs + a.loadPct / 4) - (b.latencyMs + b.loadPct / 4))
    .slice(0, 3)
    .map(({ region, ...s }) => ({ serverId: s.id, serverCode: s.code, regionCode: region.code, regionName: region.name, countryCode: region.countryCode, latencyMs: s.latencyMs, loadPct: s.loadPct }));

  return ok({
    plan, subscriptionStatus: subStatus,
    regions: data,
    recommended,
    favorites: favorites.map((f) => f.serverId),
    recents: recents.map((r) => r.serverId),
    totals: { regions: data.length, servers: data.reduce((a, r) => a + r.servers.length, 0), countries: new Set(data.map((r) => r.countryCode)).size },
  });
}, { name: "servers.list" });
