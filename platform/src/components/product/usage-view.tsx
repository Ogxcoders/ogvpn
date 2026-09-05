"use client";

// Usage analytics view (Q 391): period totals, per-region breakdown, recent sessions.
import { useEffect, useState } from "react";
import { api, formatBytes, formatDuration, errMsg } from "@/lib/client/api";
import { Spinner, ErrorState, EmptyState, StatCard, Flag } from "@/components/product/ui-bits";
import { Progress } from "@/components/ui/progress";
import { ChartLine, Clock3, Zap, Ban } from "lucide-react";

interface UsageData {
  periodStart: string; currentPeriodEnd: string; plan: string;
  bandwidthGb: number | null; bytesUsed: number;
  totals: { connections: number; active: number; failed: number; reconnected: number; totalBytes: number; totalDurationSec: number; avgDurationSec: number };
  byRegion: Array<{ region: string; countryCode: string; connections: number; bytes: number }>;
  recent: Array<{ id: string; startedAt: string; durationSec: number; serverCode: string; regionName: string; countryCode: string; bytes: number; status: string }>;
}

export function UsageView() {
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => {
    api<UsageData>("/api/usage", { dedupe: true })
      .then((d) => { setError(null); setData(d); })
      .catch((e) => setError(errMsg(e)));
  };
  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner label="Crunching your usage…" />;

  const cap = data.bandwidthGb ? data.bandwidthGb * 1e9 : null;
  const pct = cap ? Math.min(100, (data.bytesUsed / cap) * 100) : 0;
  const maxRegionBytes = Math.max(1, ...data.byRegion.map((r) => r.bytes));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Usage</h1>
        <p className="text-sm text-muted-foreground">
          Period {new Date(data.periodStart).toLocaleDateString()} – {new Date(data.currentPeriodEnd).toLocaleDateString()}
        </p>
      </div>

      {cap && (
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Data included</span>
            <span className="text-muted-foreground">{formatBytes(data.bytesUsed)} / {data.bandwidthGb} GB</span>
          </div>
          <Progress value={pct} aria-label={`Data: ${pct.toFixed(0)}% used`} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Sessions" value={data.totals.connections} sub={`${data.totals.active} active now`} icon={<ChartLine className="size-4" />} />
        <StatCard label="Time protected" value={formatDuration(data.totals.totalDurationSec)} sub={`avg ${formatDuration(data.totals.avgDurationSec)}`} icon={<Clock3 className="size-4" />} />
        <StatCard label="Data tunneled" value={formatBytes(data.totals.totalBytes)} icon={<Zap className="size-4" />} />
        <StatCard label="Failed attempts" value={data.totals.failed} sub={`${data.totals.reconnected} auto-reconnects`} tone={data.totals.failed > 0 ? "warn" : "default"} icon={<Ban className="size-4" />} />
      </div>

      {data.byRegion.length > 0 && (
        <section aria-labelledby="byregion-title">
          <h2 id="byregion-title" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">By location</h2>
          <ul className="space-y-2 rounded-xl border bg-card p-4">
            {data.byRegion.map((r) => (
              <li key={r.region} className="flex items-center gap-3 text-sm">
                <Flag code={r.countryCode} className="text-lg" />
                <span className="w-32 truncate">{r.region}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(r.bytes / maxRegionBytes) * 100}%` }} />
                </div>
                <span className="w-20 text-right text-muted-foreground">{formatBytes(r.bytes)}</span>
                <span className="w-16 text-right text-xs text-muted-foreground">{r.connections}×</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent sessions</h2>
        {data.recent.length === 0 ? (
          <EmptyState title="No sessions this period" message="Connect from the overview to start tracking usage." />
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {data.recent.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <Flag code={c.countryCode} />
                <span className="font-medium">{c.regionName}</span>
                <span className="text-xs text-muted-foreground">{c.serverCode}</span>
                <span className="ml-auto text-xs text-muted-foreground">{formatDuration(c.durationSec)} · {formatBytes(c.bytes)}</span>
                <span className="text-xs capitalize text-muted-foreground">{c.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
