"use client";

// Server browser (Section AA): search, region/country filtering, favorites,
// recents, recommended, availability/capacity/maintenance status, plan gating.
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, errMsg } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { useConnectionEngine, type ConnectionEngine } from "@/lib/client/use-connection";
import { Flag, LoadPill, Spinner, ErrorState, EmptyState } from "@/components/product/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Search, Star, Lock, Wrench, AlertTriangle, Zap, ChevronRight, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ServerRow {
  id: string; code: string; hostname: string; status: string; health: string; loadPct: number;
  capacity: number; activeConnections: number; latencyMs: number; protocols: string[];
  dedicated: boolean; favorite: boolean; recent: boolean; locked: boolean;
}
interface RegionRow {
  id: string; code: string; name: string; city: string; country: string; countryCode: string;
  continent: string; tier: string; freeAllowed: boolean; locked: boolean;
  serverCount: number; onlineCount: number; avgLatencyMs: number; maxLoad: number;
  servers: ServerRow[];
}
interface ServersPayload {
  plan: string; subscriptionStatus: string;
  regions: RegionRow[];
  recommended: Array<{ serverId: string; serverCode: string; regionCode: string; regionName: string; countryCode: string; latencyMs: number; loadPct: number }>;
  favorites: string[]; recents: string[];
  totals: { regions: number; servers: number; countries: number };
}

const CONTINENTS = ["", "EU", "NA", "AS", "OC", "SA", "AF"];
const CONTINENT_LABELS: Record<string, string> = { "": "All regions", EU: "Europe", NA: "Americas", AS: "Asia Pacific", OC: "Oceania", SA: "S. America", AF: "Africa" };

export function ServersView({ engine }: { engine: ConnectionEngine }) {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [data, setData] = useState<ServersPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [continent, setContinent] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [upgradeRegion, setUpgradeRegion] = useState<string | null>(null);

  const load = useCallback(() => {
    api<ServersPayload>("/api/servers", { dedupe: true, timeoutMs: 12000 })
      .then((d) => { setError(null); setData(d); })
      .catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleFavorite = async (serverId: string) => {
    // optimistic update (AC 668) with rollback (AC 669)
    setData((prev) => prev ? ({
      ...prev,
      favorites: prev.favorites.includes(serverId) ? prev.favorites.filter((f) => f !== serverId) : [...prev.favorites, serverId],
      regions: prev.regions.map((r) => ({ ...r, servers: r.servers.map((s) => s.id === serverId ? { ...s, favorite: !s.favorite } : s) })),
    }) : prev);
    try {
      await api("/api/servers/favorites", { method: "POST", body: { serverId } });
    } catch {
      load();
      toast({ title: "Could not update favorite", variant: "destructive" });
    }
  };

  const connectTo = async (region: RegionRow, server: ServerRow) => {
    if (server.locked || region.locked) { setUpgradeRegion(region.name); return; }
    if (server.status === "maintenance") {
      toast({ title: "Server under maintenance", description: `${server.code} is offline for maintenance. Pick another gateway.`, variant: "destructive" });
      return;
    }
    const res = await engine.connect({ serverId: server.id, serverCode: server.code, regionName: region.name, countryCode: region.countryCode });
    if (!res.ok) {
      toast({ title: "Connection failed", description: res.error.message, variant: "destructive" });
    } else {
      toast({ title: `Connected to ${region.name}`, description: `via ${server.code}` });
    }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.regions
      .filter((r) => (continent ? r.continent === continent : true))
      .filter((r) => (needle ? r.name.toLowerCase().includes(needle) || r.city.toLowerCase().includes(needle) || r.country.toLowerCase().includes(needle) || r.servers.some((s) => s.code.toLowerCase().includes(needle)) : true))
      .filter((r) => (favoritesOnly ? r.servers.some((s) => s.favorite) : true));
  }, [data, q, continent, favoritesOnly]);

  const recents = data
    ? data.regions.flatMap((r) => r.servers.filter((s) => s.recent && !s.locked).map((s) => ({ region: r, server: s }))).slice(0, 4)
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Servers</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `${data.totals.regions} locations · ${data.totals.servers} gateways · ${data.totals.countries} countries` : "Loading network…"}
        </p>
      </div>

      {/* Recommended strip (AA 613) */}
      {data && data.recommended.length > 0 && (
        <section aria-labelledby="rec-title">
          <h2 id="rec-title" className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Zap className="size-4 text-primary" aria-hidden="true" /> Recommended for you
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {data.recommended.map((r) => (
              <button
                key={r.serverCode}
                onClick={() => {
                  const region = data.regions.find((x) => x.code === r.regionCode);
                  const server = region?.servers.find((s) => s.code === r.serverCode);
                  if (region && server) void connectTo(region, server);
                }}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50"
              >
                <Flag code={r.countryCode} className="text-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.regionName}</span>
                  <span className="block text-xs text-muted-foreground">{r.latencyMs} ms · load {r.loadPct}%</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Filters (AA 608-610) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search country, city, or server code…" className="pl-9" aria-label="Search servers" />
        </div>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Continent filter">
          {CONTINENTS.map((c) => (
            <button
              key={c || "all"}
              role="tab"
              aria-selected={continent === c}
              onClick={() => setContinent(c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                continent === c ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {CONTINENT_LABELS[c]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={favoritesOnly} onCheckedChange={setFavoritesOnly} aria-label="Show favorites only" />
          <Star className="size-4" aria-hidden="true" /> Favorites
        </label>
      </div>

      {recents.length > 0 && !favoritesOnly && !q && (
        <p className="text-xs text-muted-foreground">
          Recent: {recents.map(({ region }) => region.name).join(" · ")}
        </p>
      )}

      {error && <ErrorState message={error} onRetry={load} />}
      {!data && !error && <Spinner label="Loading server list…" />}
      {data && filtered.length === 0 && (
        <EmptyState
          icon={<Search className="size-8" />}
          title="No locations match"
          message={favoritesOnly ? "You haven't favorited any servers in this filter yet — tap the star on any location." : "Try a different search term or clear the continent filter."}
        />
      )}

      <ul className="space-y-2">
        {filtered.map((region) => {
          const open = expanded === region.code;
          const best = region.servers.filter((s) => s.status === "online" && !s.locked)
            .sort((a, b) => (a.latencyMs + a.loadPct / 4) - (b.latencyMs + b.loadPct / 4))[0];
          return (
            <li key={region.code} className={cn("overflow-hidden rounded-xl border bg-card transition-colors", region.locked && "opacity-90")}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(open ? null : region.code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if ((e.target as HTMLElement).closest("button") && e.target !== e.currentTarget) return;
                    e.preventDefault();
                    setExpanded(open ? null : region.code);
                  }
                }}
                aria-expanded={open}
                className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-accent/30"
              >
                <Flag code={region.countryCode} className="text-2xl" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    {region.name}
                    {region.tier !== "standard" && <Crown className="size-3.5 text-warning" aria-label={`${region.tier} location`} />}
                    {region.locked && <Lock className="size-3.5 text-muted-foreground" aria-label="Premium location" />}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {region.city}, {region.country} · {region.onlineCount}/{region.serverCount} online
                  </span>
                </span>
                <span className="text-right text-xs">
                  <span className={cn("block font-medium", region.onlineCount ? "text-foreground" : "text-destructive")}>
                    {region.onlineCount ? `${region.avgLatencyMs} ms` : "offline"}
                  </span>
                  <LoadPill load={region.maxLoad} />
                </span>
                {!region.locked && best && (
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); void connectTo(region, best); }}
                  >
                    Connect
                  </Button>
                )}
                {region.locked && (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setUpgradeRegion(region.name); }}>
                    <Lock className="size-3.5" aria-hidden="true" /> Unlock
                  </Button>
                )}
                <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-90")} aria-hidden="true" />
              </div>
              {open && (
                <ul className="divide-y border-t bg-background/40">
                  {region.servers.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                      <button
                        onClick={() => void toggleFavorite(s.id)}
                        aria-label={s.favorite ? `Unfavorite ${s.code}` : `Favorite ${s.code}`}
                        className="rounded p-0.5"
                      >
                        <Star className={cn("size-4", s.favorite ? "fill-warning text-warning" : "text-muted-foreground")} aria-hidden="true" />
                      </button>
                      <span className="font-mono text-xs">{s.code}</span>
                      <StatusChips server={s} />
                      <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{s.latencyMs} ms</span>
                        <LoadPill load={s.loadPct} />
                        <span>{s.activeConnections}/{s.capacity}</span>
                        <span className="hidden sm:inline">{s.protocols.map((p) => p.slice(0, 2).toUpperCase()).join("·")}</span>
                      </span>
                      <Button
                        size="sm"
                        variant={s.status === "online" && !s.locked ? "outline" : "ghost"}
                        disabled={s.status !== "online" || s.locked}
                        onClick={() => void connectTo(region, s)}
                      >
                        {s.status === "maintenance" ? <Wrench className="size-3.5" aria-hidden="true" /> : s.locked ? <Lock className="size-3.5" aria-hidden="true" /> : null}
                        {s.locked ? "Premium" : s.status === "online" ? "Use" : s.status}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {/* Upgrade dialog (D90 subscription-boundary state) */}
      <Dialog open={Boolean(upgradeRegion)} onOpenChange={(v) => !v && setUpgradeRegion(null)}>
        <DialogContent role="alertdialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="size-5 text-warning" aria-hidden="true" /> {upgradeRegion} is a premium location</DialogTitle>
            <DialogDescription>
              Upgrade to Aegis Pro to unlock all 60+ locations, unlimited data, 10 devices, and split tunneling.
              Your current session and preferences are preserved through the upgrade.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeRegion(null)}>Not now</Button>
            <Button onClick={() => { setUpgradeRegion(null); navigate({ view: "app", tab: "billing" }); }}>See plans</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusChips({ server }: { server: ServerRow }) {
  if (server.status === "online" && server.health === "healthy") return null;
  return (
    <span className="flex gap-1.5">
      {server.status === "maintenance" && <Badge variant="outline" className="border-warning/40 text-warning">maintenance</Badge>}
      {server.status === "draining" && <Badge variant="outline" className="border-warning/40 text-warning">draining</Badge>}
      {server.status === "offline" && <Badge variant="outline" className="border-destructive/40 text-destructive">offline</Badge>}
      {server.status === "provisioning" && <Badge variant="outline">provisioning</Badge>}
      {server.status === "online" && server.health === "degraded" && (
        <Badge variant="outline" className="border-warning/40 text-warning"><AlertTriangle className="mr-1 size-3" aria-hidden="true" />degraded</Badge>
      )}
    </span>
  );
}
