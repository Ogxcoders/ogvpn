"use client";

// Customer dashboard shell + connection workspace (Q/N sections): the shared
// VPN connection surface with the polymorphic state system, plus overview tab.
import { useEffect, useState } from "react";
import { useApp } from "@/lib/client/store";
import { useConnectionEngine, type ConnectionEngine } from "@/lib/client/use-connection";
import { api, formatBytes, formatDuration, timeAgo, track, ApiClientError, errMsg } from "@/lib/client/api";
import { Logo, Flag, PlanBadge, Spinner, ErrorState, EmptyState, StatCard, OfflineBanner, StatusBadge } from "@/components/product/ui-bits";
import { NotificationBell } from "@/components/product/notification-bell";
import { ServersView } from "@/components/product/servers-view";
import { DevicesView } from "@/components/product/devices-view";
import { BillingView } from "@/components/product/billing-view";
import { UsageView } from "@/components/product/usage-view";
import { SupportView } from "@/components/product/support-view";
import { SettingsView } from "@/components/product/settings-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home, Globe2, Smartphone, CreditCard, ChartLine, LifeBuoy, Settings, LogOut, LogOut as LogOutAll,
  ShieldCheck, ShieldOff, Zap, ChevronDown, Loader2, Play, Square, RotateCw, Wifi, WifiOff, Beaker, AlertTriangle, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TABS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "servers", label: "Servers", icon: Globe2 },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "usage", label: "Usage", icon: ChartLine },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export function DashboardView() {
  const { user, hydrated, route, navigate, setUser, offline } = useApp();
  const engine = useConnectionEngine();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !user) navigate({ view: "login" });
  }, [hydrated, user, navigate]);

  if (!hydrated) return <Spinner label="Preparing your workspace…" className="py-24" />;
  if (!user) return <Spinner label="Redirecting to sign-in…" className="py-24" />;

  const tab = route.view === "app" && TABS.some((t) => t.id === route.tab) ? route.tab : "overview";

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <OfflineBanner visible={offline} />
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur" role="banner">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <button className="inline-flex size-9 items-center justify-center rounded-md border lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
            <Menu className="size-4" />
          </button>
          <button onClick={() => navigate({ view: "app", tab: "overview" })} aria-label="Dashboard home">
            <Logo size={26} />
          </button>
          <ConnPill engine={engine} onClick={() => navigate({ view: "app", tab: "overview" })} />
          <div className="ml-auto flex items-center gap-2">
            {user.role === "admin" && (
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => navigate({ view: "admin", tab: "overview" })}>
                <ShieldCheck className="size-4" aria-hidden="true" /> Admin
              </Button>
            )}
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-52 shrink-0 lg:block" aria-label="Dashboard navigation">
          <nav className="sticky top-20 space-y-1" aria-label="Sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate({ view: "app", tab: t.id })}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <t.icon className="size-4" aria-hidden="true" /> {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {tab === "overview" && <OverviewTab engine={engine} />}
          {tab === "servers" && <ServersView engine={engine} />}
          {tab === "devices" && <DevicesView engine={engine} />}
          {tab === "billing" && <BillingView />}
          {tab === "usage" && <UsageView />}
          {tab === "support" && <SupportView />}
          {tab === "settings" && <SettingsView />}
        </div>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64" role="dialog" aria-modal="true" aria-label="Navigation">
          <SheetHeader className="flex-row items-center justify-between border-b pb-3">
            <SheetTitle><Logo size={24} /></SheetTitle>
            <button onClick={() => setMenuOpen(false)} aria-label="Close navigation" className="inline-flex size-8 items-center justify-center rounded-md border">
              <X className="size-4" />
            </button>
          </SheetHeader>
          <nav className="mt-2 space-y-1" aria-label="Mobile sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { navigate({ view: "app", tab: t.id }); setMenuOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
                  tab === t.id ? "bg-primary/10 text-primary" : "hover:bg-accent"
                )}
              >
                <t.icon className="size-4" aria-hidden="true" /> {t.label}
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );

  function UserMenu() {
    const { toast } = useToast();
    const doLogout = async (all: boolean) => {
      try {
        await api(all ? "/api/auth/logout-all" : "/api/auth/logout", { method: "POST", body: {}, retries: 0 });
      } catch { /* cookie cleared server-side on success; local state always resets */ }
      setUser(null);
      track("vpn_disconnect", { reason: all ? "logout_all" : "logout" });
      toast({ title: all ? "Signed out everywhere" : "Signed out" });
      navigate({ view: "landing" });
    };
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-sm" aria-label="Account menu">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary" aria-hidden="true">
              {(user?.email?.[0] || "U").toUpperCase()}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <p className="truncate text-sm font-medium">{user?.email}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
              <PlanBadge plan={engine.subscription?.plan || "free"} />
              {!user?.emailVerified && <Badge variant="outline" className="border-warning/40 text-warning">Unverified</Badge>}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ view: "app", tab: "settings" })}>
            <Settings className="size-4" aria-hidden="true" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ view: "app", tab: "billing" })}>
            <CreditCard className="size-4" aria-hidden="true" /> Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void doLogout(false)}>
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void doLogout(true)} className="text-destructive">
            <LogOutAll className="size-4" aria-hidden="true" /> Sign out all devices
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}

function ConnPill({ engine, onClick }: { engine: ConnectionEngine; onClick: () => void }) {
  const s = engine.state;
  const label = {
    disconnected: "Unprotected",
    connecting: "Connecting…",
    connected: `Protected · ${engine.conn?.server.region.countryCode ?? ""}`,
    reconnecting: "Reconnecting…",
    disconnecting: "Disconnecting…",
  }[s];
  return (
    <button
      onClick={onClick}
      className={cn(
        "ml-1 hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium sm:inline-flex",
        s === "connected" && engine.conn?.degraded ? "border-warning/50 bg-warning/10 text-warning" :
        s === "connected" ? "border-primary/50 bg-primary/10 text-primary" :
        s === "connecting" || s === "reconnecting" ? "border-warning/50 bg-warning/10 text-warning" :
        "border-muted bg-muted/40 text-muted-foreground"
      )}
      aria-live="polite"
      aria-label={`Connection status: ${label}`}
    >
      {(s === "connecting" || s === "reconnecting") && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
      {s === "connected" && <ShieldCheck className="size-3" aria-hidden="true" />}
      {s === "disconnected" && <ShieldOff className="size-3" aria-hidden="true" />}
      {label}
    </button>
  );
}

/* ---------------- Overview / Connect workspace ---------------- */

interface HistoryItem {
  id: string; startedAt: string; endedAt: string | null; durationSec: number;
  bytesIn: number; bytesOut: number; endReason: string | null; serverCode: string;
  regionName: string; countryCode: string; device: string;
}

function OverviewTab({ engine }: { engine: ConnectionEngine }) {
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const { navigate } = useApp();

  useEffect(() => {
    if (engine.state === "disconnected") {
      api<{ connections: HistoryItem[] }>("/api/connection/history", { dedupe: true })
        .then((d) => setHistory(d.connections))
        .catch(() => setHistory([]));
    }
  }, [engine.state]);

  const sub = engine.subscription;
  const used = sub?.bytesUsed ?? 0;
  const cap = sub?.bandwidthGb ? sub.bandwidthGb * 1e9 : null;
  const usedPct = cap ? Math.min(100, (used / cap) * 100) : 0;

  return (
    <div className="space-y-6">
      <ConnectPanel engine={engine} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Data used"
          value={cap ? formatBytes(used) : "Unlimited"}
          sub={cap ? `${sub?.bandwidthGb} GB included · ${usedPct.toFixed(0)}% used` : "Current period"}
          icon={<ChartLine className="size-4" />}
          tone={cap && usedPct > 85 ? "bad" : "default"}
        />
        <StatCard
          label="Current latency"
          value={engine.conn ? `${engine.conn.server.latencyMs} ms` : "—"}
          sub={engine.conn ? `load ${engine.conn.server.loadPct}% · ${engine.conn.protocol}` : "Connect to measure"}
          icon={<Zap className="size-4" />}
        />
        <StatCard
          label="Plan"
          value={<span className="capitalize">{sub?.plan ?? "…"}</span>}
          sub={sub ? `${sub.deviceLimit} devices${sub.cancelAtPeriodEnd ? " · cancels at period end" : ""}` : ""}
          icon={<CreditCard className="size-4" />}
        />
      </div>

      {cap && usedPct >= 100 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4" role="alert">
          <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
          <p className="text-sm"><strong>Data cap reached.</strong> New connections are paused on the Free plan.</p>
          <Button size="sm" className="ml-auto" onClick={() => navigate({ view: "app", tab: "billing" })}>Upgrade for unlimited</Button>
        </div>
      )}

      <section aria-labelledby="recent-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-title" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent connections</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate({ view: "app", tab: "usage" })}>Full usage</Button>
        </div>
        {history === null ? (
          <Spinner label="Loading history…" />
        ) : history.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="size-8" />}
            title="No connections yet"
            message="Your connection history will appear here after your first session. Press Connect above to get started."
          />
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {history.slice(0, 8).map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <Flag code={h.countryCode} className="text-lg" />
                <span className="font-medium">{h.regionName}</span>
                <span className="text-xs text-muted-foreground">{h.serverCode} · {h.device}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDuration(h.durationSec)} · ↓{formatBytes(h.bytesIn)} ↑{formatBytes(h.bytesOut)}
                </span>
                <span className="w-16 text-right text-xs text-muted-foreground">{timeAgo(h.startedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function ConnectPanel({ engine }: { engine: ConnectionEngine }) {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [simBusy, setSimBusy] = useState<string | null>(null);

  const s = engine.state;
  const busy = s === "connecting" || s === "reconnecting" || s === "disconnecting";
  const connected = s === "connected";
  const server = engine.conn?.server;
  const target = engine.selectedServer;

  const doConnect = async (simulate?: string) => {
    setSimBusy(simulate || "connect");
    const res = await engine.connect(simulate ? { simulate } : engine.selectedServer ?? undefined);
    setSimBusy(null);
    if (!res.ok) {
      const e = res.error;
      if (e.code === "subscription_required" || e.code === "bandwidth_exceeded" || e.code === "unsupported_location" || e.code === "device_limit_reached") {
        toast({ title: "Upgrade needed", description: e.message, variant: "destructive" });
        if (e.code !== "device_limit_reached") navigate({ view: "app", tab: "billing" });
        else navigate({ view: "app", tab: "devices" });
      } else if (e.code === "update_required") {
        toast({ title: "Update required", description: e.message, variant: "destructive" });
      } else {
        toast({ title: "Connection failed", description: e.message, variant: "destructive" });
      }
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-6 sm:p-8" aria-labelledby="connect-title">
      <h1 id="connect-title" className="sr-only">VPN connection workspace</h1>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
        {/* State ring button */}
        <div className="relative flex shrink-0 flex-col items-center gap-3">
          <button
            onClick={() => (connected ? void engine.disconnect() : void doConnect())}
            disabled={busy || engine.offline}
            aria-pressed={connected}
            aria-label={connected ? "Disconnect VPN" : busy ? "Connection in progress" : "Connect VPN"}
            className={cn(
              "relative flex size-40 flex-col items-center justify-center rounded-full border-4 transition-all sm:size-44",
              connected
                ? "border-primary bg-primary/10 text-primary pulse-ring"
                : s === "connecting" || s === "reconnecting"
                  ? "border-warning/60 bg-warning/5 text-warning"
                  : "border-muted-foreground/25 bg-muted/20 text-muted-foreground hover:border-primary/60 hover:text-primary",
              busy && "cursor-wait opacity-80"
            )}
          >
            {connected && <ShieldCheck className="size-9" aria-hidden="true" />}
            {(s === "connecting" || s === "reconnecting") && <Loader2 className="size-9 animate-spin" aria-hidden="true" />}
            {s === "disconnecting" && <Loader2 className="size-9 animate-spin" aria-hidden="true" />}
            {s === "disconnected" && <Play className="size-9" aria-hidden="true" />}
            <span className="mt-1.5 text-sm font-bold uppercase tracking-wide">
              {s === "disconnected" ? "Connect" : s === "connecting" ? "Connecting" : s === "reconnecting" ? "Reconnecting" : s === "disconnecting" ? "Ending" : "Connected"}
            </span>
            <span className="text-xs opacity-70">
              {connected ? formatDuration(engine.conn?.durationSec ?? 0) : s === "disconnected" ? "Tap to protect" : "hold tight"}
            </span>
          </button>
          {engine.offline && (
            <p className="flex items-center gap-1.5 text-xs text-warning" role="status">
              <WifiOff className="size-3.5" aria-hidden="true" /> Offline{engine.killSwitchActive && connected ? " · kill switch blocking traffic" : ""}
            </p>
          )}
        </div>

        {/* Details column */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Server target */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-background/50 px-4 py-3">
            {server ? (
              <>
                <Flag code={server.region.countryCode} className="text-2xl" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{server.region.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {server.code} · {server.hostname}:{server.port}
                  </p>
                </div>
              </>
            ) : target?.regionName ? (
              <>
                <Flag code={target.countryCode} className="text-2xl" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{target.regionName}</p>
                  <p className="text-xs text-muted-foreground">{target.serverCode} · selected</p>
                </div>
              </>
            ) : (
              <>
                <Zap className="size-6 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Fastest available</p>
                  <p className="text-xs text-muted-foreground">Automatic selection by latency & load</p>
                </div>
              </>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate({ view: "app", tab: "servers" })}>
                <Globe2 className="size-4" aria-hidden="true" /> Change
              </Button>
              {(connected || s === "disconnected") && (
                <Button variant="ghost" size="sm" onClick={() => void doConnect()} disabled={busy} aria-label="Switch server">
                  <RotateCw className="size-4" aria-hidden="true" /> Re-key
                </Button>
              )}
            </div>
          </div>

          {/* Connecting stages (M243) */}
          {s === "connecting" && (
            <div className="rounded-xl border bg-background/50 px-4 py-3" role="status" aria-live="polite">
              <ul className="space-y-1.5">
                {engine.stageLabels.map((label, i) => (
                  <li key={label} className={cn("flex items-center gap-2 text-sm", i > engine.stageIdx ? "opacity-40" : i === engine.stageIdx ? "text-primary" : "")}>
                    {i < engine.stageIdx ? <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
                      : i === engine.stageIdx ? <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden="true" />
                      : <span className="size-3.5 rounded-full border" aria-hidden="true" />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Degraded banner (R410) */}
          {connected && engine.conn?.degraded && (
            <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-warning" role="alert">
              <Wifi className="size-4" aria-hidden="true" /> Server degraded — traffic stays encrypted. Consider switching servers.
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void engine.reconnect()}>Reconnect</Button>
            </div>
          )}

          {/* Error panel (AS) */}
          {engine.error && !connected && (
            <ErrorState
              title={`Connection failed · ${engine.error.code}`}
              message={engine.error.message}
              onRetry={engine.error.retryable ? () => void doConnect() : undefined}
              retryLabel={engine.error.retryable ? "Retry connection" : undefined}
            />
          )}

          {/* Live metrics */}
          {connected && server && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border bg-background/50 px-4 py-3 text-sm sm:grid-cols-4" aria-live="off">
              <Metric label="Duration" value={formatDuration(engine.conn?.durationSec ?? 0)} />
              <Metric label="Downloaded" value={`↓ ${formatBytes(engine.conn?.bytesIn ?? 0)}`} />
              <Metric label="Uploaded" value={`↑ ${formatBytes(engine.conn?.bytesOut ?? 0)}`} />
              <Metric label="Throughput" value={`${engine.conn?.throughputMbps ?? 0} Mbps`} />
              <Metric label="Exit IP" value={<span className="font-mono">{server.ipv4}</span>} />
              <Metric label="Tunnel IP" value={<span className="font-mono">{engine.tunnel?.addressV4 || "10.8.0.x"}</span>} />
              <Metric label="DNS" value={<span className="font-mono">{engine.tunnel?.dns || "10.8.0.1"}</span>} />
              <Metric label="Kill switch" value={engine.killSwitchActive ? "Armed" : "Off"} tone={engine.killSwitchActive ? "good" : undefined} />
            </dl>
          )}

          {/* QA failure-injection helpers (AS/AV evidence) */}
          {!connected && !busy && (
            <details className="rounded-xl border bg-background/50 px-4 py-2 text-sm">
              <summary className="flex cursor-pointer items-center gap-2 text-muted-foreground select-none">
                <Beaker className="size-3.5" aria-hidden="true" /> Failure-path drills (QA)
              </summary>
              <div className="mt-2 flex flex-wrap gap-2 pb-1">
                {[["handshake", "VPN handshake failure"], ["timeout", "Connection timeout"], ["dns", "DNS failure"]].map(([sim, label]) => (
                  <Button key={sim} variant="outline" size="sm" disabled={simBusy !== null} onClick={() => void doConnect(sim)}>
                    {simBusy === sim ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null} {label}
                  </Button>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "good" }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", tone === "good" && "text-primary")}>{value}</dd>
    </div>
  );
}

// Data-cap progress used by overview
export function DataCapBar({ used, capGb }: { used: number; capGb: number | null }) {
  if (!capGb) return null;
  const pct = Math.min(100, (used / (capGb * 1e9)) * 100);
  return (
    <div>
      <Progress value={pct} aria-label={`Data used: ${pct.toFixed(0)}%`} />
      <p className="mt-1 text-xs text-muted-foreground">{formatBytes(used)} of {capGb} GB</p>
    </div>
  );
}
