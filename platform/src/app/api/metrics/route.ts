// Metrics exposition (Section AH): Prometheus-style text + JSON snapshot.
import { metricsSnapshot } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const snap = metricsSnapshot();
  let infra: Record<string, number> = {};
  try {
    const [servers, active, conns24h, users] = await Promise.all([
      db.server.count(),
      db.connection.count({ where: { status: "active" } }),
      db.connection.count({ where: { startedAt: { gte: new Date(Date.now() - 86400e3) } } }),
      db.user.count(),
    ]);
    infra = { servers, active_connections: active, connections_24h: conns24h, users };
  } catch { /* infra gauges best-effort */ }

  if (searchParams.get("format") === "json") {
    return Response.json({ ...snap, infra }, { headers: { "cache-control": "no-store" } });
  }
  const lines: string[] = [];
  for (const [name, c] of Object.entries(snap.apis)) {
    lines.push(`# TYPE api_requests counter`);
    lines.push(`api_requests{route="${name}"} ${c.count}`);
    lines.push(`api_errors{route="${name}"} ${c.errors}`);
    lines.push(`api_latency_ms_avg{route="${name}"} ${c.avgLatencyMs}`);
  }
  for (const [name, v] of Object.entries(snap.gauges)) {
    lines.push(`${name} ${v}`);
  }
  for (const [name, v] of Object.entries(infra)) {
    lines.push(`aegis_${name} ${v}`);
  }
  return new Response(lines.join("\n") + "\n", {
    headers: { "content-type": "text/plain; version=0.0.4", "cache-control": "no-store" },
  });
}
