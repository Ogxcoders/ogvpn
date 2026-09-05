// Usage analytics for the account (Q 391 / AD): monthly data, connection stats,
// per-region breakdown.
import { db } from "@/lib/db";
import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/session";

export const GET = route(async (req) => {
  const auth = await requireUser(req);
  const sub = await db.subscription.findUniqueOrThrow({ where: { userId: auth.id } });
  const periodStart = sub.currentPeriodStart;

  const conns = await db.connection.findMany({
    where: { userId: auth.id, startedAt: { gte: periodStart } },
    include: { server: { include: { region: true } } },
    orderBy: { startedAt: "desc" },
  });

  const totalBytes = conns.reduce((a, c) => a + Number(c.bytesIn) + Number(c.bytesOut), 0);
  const totalDurationSec = conns.reduce((a, c) => a + c.durationSec, 0);
  const byRegion = new Map<string, { region: string; countryCode: string; connections: number; bytes: number }>();
  for (const c of conns) {
    const key = c.server.region.code;
    const cur = byRegion.get(key) || { region: c.server.region.name, countryCode: c.server.region.countryCode, connections: 0, bytes: 0 };
    cur.connections += 1;
    cur.bytes += Number(c.bytesIn) + Number(c.bytesOut);
    byRegion.set(key, cur);
  }
  const failed = conns.filter((c) => c.status === "failed").length;
  const reconnected = conns.reduce((a, c) => a + c.reconnects, 0);

  return ok({
    periodStart, currentPeriodEnd: sub.currentPeriodEnd,
    plan: sub.plan, bandwidthGb: sub.bandwidthGb, bytesUsed: Number(sub.bytesUsed) + totalBytes,
    totals: {
      connections: conns.length, active: conns.filter((c) => c.status === "active").length,
      failed, reconnected, totalBytes, totalDurationSec,
      avgDurationSec: conns.length ? Math.round(totalDurationSec / conns.length) : 0,
    },
    byRegion: [...byRegion.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 10),
    recent: conns.slice(0, 10).map((c) => ({
      id: c.id, startedAt: c.startedAt, durationSec: c.durationSec,
      serverCode: c.server.code, regionName: c.server.region.name, countryCode: c.server.region.countryCode,
      bytes: Number(c.bytesIn) + Number(c.bytesOut), status: c.status,
    })),
  });
}, { name: "usage" });
