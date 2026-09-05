// Health probe (AB 642): liveness + dependency summary for load balancers.
import { db } from "@/lib/db";
import { metricGauge } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let database = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }
  const [users, servers] = await Promise.all([
    db.user.count().catch(() => -1),
    db.server.count().catch(() => -1),
  ]);
  metricGauge("db_healthy", database === "ok" ? 1 : 0);
  const healthy = database === "ok";
  return Response.json(
    {
      status: healthy ? "healthy" : "degraded",
      uptimeSec: Math.round(process.uptime()),
      checks: { database, api: "ok" },
      gauges: { users, servers },
      latencyMs: Date.now() - started,
      version: process.env.npm_package_version || "1.2.0",
    },
    { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } }
  );
}
