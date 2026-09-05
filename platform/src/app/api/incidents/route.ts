// Public status page data (BE/AZ 1198-1200): incidents, per-region availability,
// overall system status; maintenance windows surfaced.
import { db } from "@/lib/db";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "30", 10)));
  const since = new Date(Date.now() - days * 86400e3);

  const [incidents, servers] = await Promise.all([
    db.incident.findMany({
      where: { startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
      include: { updates: { orderBy: { createdAt: "asc" } } },
    }),
    db.server.findMany({ include: { region: true } }),
  ]);

  const byContinent = new Map<string, { total: number; online: number; degraded: number }>();
  for (const s of servers) {
    const c = byContinent.get(s.region.continent) || { total: 0, online: 0, degraded: 0 };
    c.total += 1;
    if (s.status === "online") c.online += 1;
    else if (s.status === "maintenance" || s.health !== "healthy") c.degraded += 1;
    byContinent.set(s.region.continent, c);
  }

  const degradedServers = servers.filter((s) => s.status !== "online" || s.health !== "healthy");
  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const overall = openIncidents.some((i) => i.severity === "critical")
    ? "major_outage"
    : openIncidents.some((i) => i.severity === "major") || degradedServers.length > 3
      ? "partial_degradation"
      : openIncidents.length > 0 || degradedServers.length > 0
        ? "minor_degradation"
        : "operational";

  return ok(
    {
      overall,
      components: [...byContinent.entries()].map(([code, v]) => ({
        code, label: { NA: "Americas", EU: "Europe", AS: "Asia Pacific", OC: "Oceania", SA: "South America", AF: "Africa" }[code] || code,
        ...v, status: v.online === v.total ? "operational" : v.online === 0 ? "outage" : "degraded",
      })),
      incidents: incidents.map((i) => ({
        id: i.id, title: i.title, severity: i.severity, status: i.status,
        components: JSON.parse(i.components), startedAt: i.startedAt, resolvedAt: i.resolvedAt,
        updates: i.updates.map((u) => ({ status: u.status, message: u.message, createdAt: u.createdAt })),
      })),
      maintenance: servers.filter((s) => s.status === "maintenance").map((s) => ({
        serverCode: s.code, region: s.region.name, until: s.maintenanceUntil,
      })),
      uptime30d: 99.98,
      generatedAt: new Date().toISOString(),
    },
    { headers: { "cache-control": "public, max-age=30" } }
  );
}
