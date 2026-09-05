"use client";

// Admin control plane (AL): KPI overview, user management, server fleet,
// incident management, abuse review, audit log, support queue.
import { useCallback, useEffect, useState } from "react";
import { api, timeAgo, errMsg } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { Spinner, ErrorState, EmptyState, StatCard, StatusBadge, PlanBadge, Flag } from "@/components/product/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard, Users, Server, Siren, ShieldAlert, ScrollText, LifeBuoy, Search,
  Ban, Unlock, ChevronDown, LogOut, Plus, Activity, Wrench, Play, CircleSlash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "servers", label: "Servers", icon: Server },
  { id: "incidents", label: "Incidents", icon: Siren },
  { id: "abuse", label: "Abuse review", icon: ShieldAlert },
  { id: "audit", label: "Audit log", icon: ScrollText },
  { id: "tickets", label: "Support", icon: LifeBuoy },
] as const;

export function AdminView() {
  const { user, hydrated, route, navigate } = useApp();

  useEffect(() => {
    if (hydrated && !user) navigate({ view: "login" });
  }, [hydrated, user, navigate]);

  useEffect(() => {
    if (hydrated && user && user.role !== "admin") navigate({ view: "app", tab: "overview" });
  }, [hydrated, user, navigate]);

  if (!hydrated || !user) return <Spinner label="Checking authorization…" className="py-24" />;
  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Ban className="mx-auto size-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold">Administrator access required</h1>
        <p className="mt-1 text-sm text-muted-foreground">This area is restricted to operations staff with MFA-protected admin roles.</p>
      </div>
    );
  }

  const tab = route.view === "admin" && ADMIN_TABS.some((t) => t.id === route.tab) ? route.tab : "overview";

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur" role="banner">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <span className="flex items-center gap-2 font-bold"><Activity className="size-5 text-primary" aria-hidden="true" /> Aegis Control Plane</span>
          <Badge variant="outline" className="border-primary/40 text-primary">admin</Badge>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate({ view: "app", tab: "overview" })}>
            Customer view
          </Button>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        <aside className="hidden w-52 shrink-0 lg:block" aria-label="Admin navigation">
          <nav className="sticky top-20 space-y-1">
            {ADMIN_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate({ view: "admin", tab: t.id })}
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
        <div className="min-w-0 flex-1">
          {tab === "overview" && <AdminOverview />}
          {tab === "users" && <AdminUsers />}
          {tab === "servers" && <AdminServers />}
          {tab === "incidents" && <AdminIncidents />}
          {tab === "abuse" && <AdminAbuse />}
          {tab === "audit" && <AdminAudit />}
          {tab === "tickets" && <AdminTickets />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */

interface Stats {
  users: { total: number; active: number; new24h: number; suspended: number };
  servers: { total: number; online: number; maintenance: number; degraded: number; uptimePct: number };
  connections: { active: number; last24h: number; failed24h: number; successRatePct: number };
  subscriptions: { free: number; pro: number; business: number; mrrCents: number; revenue30dCents: number };
  ops: { openTickets: number; openIncidents: number; failedAuths24h: number; suspiciousAuths24h: number; apiErrorRatePct: number };
  slo: { connectSuccessTarget: number; apiAvailabilityTarget: number; dnsLeakIncidents: number };
}

function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    api<Stats>("/api/admin/stats", { dedupe: true })
      .then((d) => { setError(null); setStats(d); })
      .catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return <Spinner label="Aggregating platform metrics…" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Platform overview</h1>
        <Badge variant="outline" className="text-xs text-muted-foreground">auto-refresh 30s</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={stats.users.total} sub={`+${stats.users.new24h} in 24h · ${stats.users.suspended} suspended`} icon={<Users className="size-4" />} />
        <StatCard label="Active connections" value={stats.connections.active} sub={`${stats.connections.last24h} sessions in 24h`} icon={<Activity className="size-4" />} />
        <StatCard label="Connect success" value={`${stats.connections.successRatePct}%`} sub={`SLO target ${stats.slo.connectSuccessTarget}%`} tone={stats.connections.successRatePct >= stats.slo.connectSuccessTarget ? "good" : "warn"} icon={<Play className="size-4" />} />
        <StatCard label="MRR" value={`$${(stats.subscriptions.mrrCents / 100).toFixed(0)}`} sub={`$${(stats.subscriptions.revenue30dCents / 100).toFixed(0)} last 30d`} tone="good" />
        <StatCard label="Fleet health" value={`${stats.servers.online}/${stats.servers.total}`} sub={`${stats.servers.maintenance} maintenance · ${stats.servers.degraded} degraded · ${stats.servers.uptimePct}% uptime`} tone={stats.servers.degraded > 2 ? "warn" : "default"} icon={<Server className="size-4" />} />
        <StatCard label="API error rate" value={`${stats.ops.apiErrorRatePct}%`} sub={`SLO target ${(100 - stats.slo.apiAvailabilityTarget).toFixed(1)}%`} tone={stats.ops.apiErrorRatePct < 1 ? "good" : "warn"} />
        <StatCard label="Failed sign-ins 24h" value={stats.ops.failedAuths24h} sub={`${stats.ops.suspiciousAuths24h} flagged suspicious`} tone={stats.ops.suspiciousAuths24h > 0 ? "warn" : "default"} icon={<ShieldAlert className="size-4" />} />
        <StatCard label="Open work" value={stats.ops.openTickets + stats.ops.openIncidents} sub={`${stats.ops.openTickets} tickets · ${stats.ops.openIncidents} incidents`} icon={<LifeBuoy className="size-4" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {(["free", "pro", "business"] as const).map((p) => (
          <div key={p} className="flex items-center justify-between rounded-xl border bg-card p-4">
            <PlanBadge plan={p} />
            <span className="text-lg font-bold">{stats.subscriptions[p]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Users ---------------- */

interface AdminUser {
  id: string; email: string; name: string | null; role: string; status: string; statusReason: string | null;
  emailVerified: boolean; mfaEnabled: boolean; createdAt: string; lastLoginAt: string | null;
  subscription?: { plan: string; status: string } | null;
  devices?: Array<{ id: string; name: string; platform: string }>;
  sessions?: Array<{ id: string; deviceLabel: string | null; lastSeenAt: string }>;
  connections?: Array<{ id: string; startedAt: string; server: { code: string; region: { name: string } } }>;
  invoices?: Array<{ id: string; number: string; amountCents: number; status: string }>;
  authAttempts?: Array<{ id: string; success: boolean; reason: string | null; ip: string | null; createdAt: string }>;
}

function AdminUsers() {
  const { toast } = useToast();
  const [data, setData] = useState<{ users: AdminUser[]; total: number; page: number; pages: number } | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ users: AdminUser[]; total: number; page: number; pages: number }>(`/api/admin/users?q=${encodeURIComponent(q)}&page=${page}`, { dedupe: true })
      .then((d) => { setError(null); setData(d); })
      .catch((e) => setError(errMsg(e)));
  }, [q, page]);
  useEffect(load, [load]);

  const openDetail = async (id: string) => {
    try {
      const d = await api<{ user: AdminUser }>(`/api/admin/users/${id}`, { dedupe: true });
      setDetail(d.user);
    } catch (e) {
      toast({ title: "Could not load user", description: errMsg(e), variant: "destructive" });
    }
  };

  const act = async (id: string, action: string, extra?: Record<string, unknown>) => {
    try {
      await api(`/api/admin/users/${id}`, { method: "PATCH", body: { action, ...extra }, retries: 0 });
      toast({ title: `Action applied: ${action}` });
      setDetail(null);
      load();
    } catch (e) {
      toast({ title: "Action failed", description: errMsg(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Users <span className="text-sm font-normal text-muted-foreground">({data?.total ?? "…"})</span></h1>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by email…" className="pl-9" aria-label="Search users" />
        </div>
      </div>
      {error && <ErrorState message={error} onRetry={load} />}
      {!data && !error && <Spinner />}
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {data?.users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary" aria-hidden="true">
              {u.email[0].toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {u.email}
                {u.role === "admin" && <Badge variant="outline" className="border-primary/40 text-primary">admin</Badge>}
                {u.mfaEnabled && <Badge variant="outline">MFA</Badge>}
                {!u.emailVerified && <Badge variant="outline" className="border-warning/40 text-warning">unverified</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">joined {new Date(u.createdAt).toLocaleDateString()} · last login {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "never"}</p>
            </div>
            <PlanBadge plan={u.subscription?.plan || "free"} />
            <StatusBadge status={u.status} />
            <Button variant="ghost" size="sm" onClick={() => void openDetail(u.id)}>Inspect</Button>
          </li>
        ))}
      </ul>
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2" aria-label="Pagination">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.page} / {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={Boolean(detail)} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scroll-contain">
          <DialogHeader>
            <DialogTitle>{detail?.email}</DialogTitle>
            <DialogDescription>Account inspection & enforcement actions.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Plan" value={<span className="text-base capitalize">{detail.subscription?.plan || "free"}</span>} />
                <StatCard label="Devices" value={detail.devices?.length ?? 0} />
                <StatCard label="Sessions" value={detail.sessions?.length ?? 0} />
                <StatCard label="Recent conns" value={detail.connections?.length ?? 0} />
              </div>
              {detail.devices && detail.devices.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold">Devices</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {detail.devices.map((d) => <li key={d.id}>• {d.name} ({d.platform})</li>)}
                  </ul>
                </div>
              )}
              {detail.authAttempts && detail.authAttempts.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold">Auth attempts</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {detail.authAttempts.slice(0, 8).map((a) => (
                      <li key={a.id} className={cn(!a.success && "text-destructive")}>
                        {a.success ? "✓" : "✗"} {new Date(a.createdAt).toLocaleString()} · {a.ip} · {a.reason || "login"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Select onValueChange={(plan) => void act(detail.id, "set-plan", { plan })}>
                  <SelectTrigger className="w-40" aria-label="Set plan"><SelectValue placeholder="Set plan…" /></SelectTrigger>
                  <SelectContent>
                    {["free", "pro", "business"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                {detail.status === "suspended" ? (
                  <Button variant="outline" size="sm" onClick={() => void act(detail.id, "unsuspend")}><Unlock className="size-4" aria-hidden="true" /> Unsuspend</Button>
                ) : (
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => void act(detail.id, "suspend", { reason: "Admin review" })}>
                    <Ban className="size-4" aria-hidden="true" /> Suspend
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => void act(detail.id, "unlock")}><Unlock className="size-4" aria-hidden="true" /> Clear lockout</Button>
                <Button variant="outline" size="sm" onClick={() => void act(detail.id, "force-logout")}><LogOut className="size-4" aria-hidden="true" /> Force logout</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Servers ---------------- */

interface AdminServer {
  id: string; code: string; hostname: string; region: { code: string; name: string; country: string };
  status: string; health: string; loadPct: number; capacity: number; activeConnections: number;
  latencyMs: number; version: string; maintenanceUntil: string | null; lastHeartbeatAt: string;
}
interface AdminRegion { id: string; code: string; name: string; baseLatencyMs: number }

function AdminServers() {
  const { toast } = useToast();
  const [data, setData] = useState<{ servers: AdminServer[]; regions: AdminRegion[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [regionId, setRegionId] = useState("");

  const load = useCallback(() => {
    api<{ servers: AdminServer[]; regions: AdminRegion[] }>("/api/admin/servers", { dedupe: true })
      .then((d) => { setError(null); setData(d); }).catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const setStatus = async (serverId: string, status: string) => {
    try {
      await api("/api/admin/servers", { method: "POST", body: { action: "set-status", serverId, status }, retries: 0 });
      toast({ title: `Server → ${status}`, description: status === "draining" || status === "offline" ? "Active connections were migrated." : undefined });
      load();
    } catch (e) {
      toast({ title: "Status change failed", description: errMsg(e), variant: "destructive" });
    }
  };

  const provision = async () => {
    try {
      await api("/api/admin/servers", { method: "POST", body: { action: "create", regionId }, retries: 0 });
      toast({ title: "Server provisioning started" });
      setProvisionOpen(false);
      load();
    } catch (e) {
      toast({ title: "Provisioning failed", description: errMsg(e), variant: "destructive" });
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner label="Loading fleet…" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Server fleet <span className="text-sm font-normal text-muted-foreground">({data.servers.length})</span></h1>
        <Button size="sm" onClick={() => setProvisionOpen(true)}><Plus className="size-4" aria-hidden="true" /> Provision server</Button>
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {data.servers.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
            <span className="font-mono text-xs">{s.code}</span>
            <span className="text-xs text-muted-foreground">{s.region.name}</span>
            <StatusBadge status={s.status} />
            {s.health !== "healthy" && <Badge variant="outline" className="border-warning/40 text-warning">{s.health}</Badge>}
            <span className="text-xs text-muted-foreground">{s.activeConnections}/{s.capacity} conns · {s.loadPct}% load · {s.latencyMs}ms · v{s.version}</span>
            <span className="ml-auto flex gap-1">
              {(["online", "maintenance", "draining", "offline"] as const).map((st) => (
                <Button
                  key={st} size="sm" variant={s.status === st ? "default" : "ghost"}
                  disabled={s.status === st}
                  onClick={() => void setStatus(s.id, st)}
                  aria-label={`Set ${s.code} to ${st}`}
                >
                  {st === "online" ? <Play className="size-3" aria-hidden="true" /> : st === "maintenance" ? <Wrench className="size-3" aria-hidden="true" /> : st === "draining" ? <ChevronDown className="size-3" aria-hidden="true" /> : <CircleSlash className="size-3" aria-hidden="true" />}
                  <span className="sr-only sm:not-sr-only sm:ml-1">{st}</span>
                </Button>
              ))}
            </span>
          </li>
        ))}
      </ul>

      <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Provision a new gateway</DialogTitle>
            <DialogDescription>Automation registers the node, generates keys, installs health checks, and flips it to online after validation.</DialogDescription></DialogHeader>
          <div>
            <Label htmlFor="prov-region">Region</Label>
            <Select value={regionId} onValueChange={setRegionId}>
              <SelectTrigger id="prov-region" className="mt-2"><SelectValue placeholder="Choose region…" /></SelectTrigger>
              <SelectContent>
                {data.regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProvisionOpen(false)}>Cancel</Button>
            <Button onClick={() => void provision()} disabled={!regionId}>Provision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Incidents ---------------- */

interface AdminIncident {
  id: string; title: string; severity: string; status: string; startedAt: string; resolvedAt: string | null;
  components: string[];
  updates: Array<{ status: string; message: string; createdAt: string }>;
}

function AdminIncidents() {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<AdminIncident[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [message, setMessage] = useState("");
  const [updateFor, setUpdateFor] = useState<AdminIncident | null>(null);
  const [updateStatus, setUpdateStatus] = useState("identified");
  const [updateMessage, setUpdateMessage] = useState("");

  const load = useCallback(() => {
    api<{ incidents: AdminIncident[] }>("/api/admin/incidents", { dedupe: true }).then((d) => setIncidents(d.incidents)).catch(() => setIncidents([]));
  }, []);
  useEffect(load, [load]);

  const create = async () => {
    try {
      await api("/api/admin/incidents", { method: "POST", body: { action: "create", title, severity, message }, retries: 0 });
      toast({ title: "Incident declared", description: "Subscribers were notified." });
      setCreateOpen(false); setTitle(""); setMessage("");
      load();
    } catch (e) {
      toast({ title: "Could not declare incident", description: errMsg(e), variant: "destructive" });
    }
  };

  const postUpdate = async () => {
    if (!updateFor) return;
    try {
      await api("/api/admin/incidents", { method: "POST", body: { action: "update", incidentId: updateFor.id, status: updateStatus, message: updateMessage }, retries: 0 });
      toast({ title: "Update posted" });
      setUpdateFor(null); setUpdateMessage("");
      load();
    } catch (e) {
      toast({ title: "Update failed", description: errMsg(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Incidents</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-4" aria-hidden="true" /> Declare incident</Button>
      </div>
      {!incidents && <Spinner />}
      {incidents?.length === 0 && <EmptyState title="No incidents" message="Declare an incident to notify subscribers and track resolution on the status page." />}
      <ul className="space-y-3">
        {incidents?.map((i) => (
          <li key={i.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{i.title}</p>
              <Badge variant="outline" className={i.severity === "critical" ? "border-destructive/40 text-destructive" : i.severity === "major" ? "border-warning/40 text-warning" : ""}>{i.severity}</Badge>
              <StatusBadge status={i.status} />
              <span className="ml-auto text-xs text-muted-foreground">{timeAgo(i.startedAt)}</span>
              <Button size="sm" variant="outline" onClick={() => { setUpdateFor(i); setUpdateStatus(i.status === "resolved" ? "monitoring" : "identified"); }}>Post update</Button>
            </div>
            <ol className="mt-2 space-y-1 border-l-2 pl-3 text-xs text-muted-foreground">
              {i.updates.map((u, idx) => (
                <li key={idx}><span className="font-semibold uppercase">{u.status}</span> · {u.message}</li>
              ))}
            </ol>
          </li>
        ))}
      </ul>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Declare incident</DialogTitle>
            <DialogDescription>Subscribers receive notifications per their preferences; the status page updates immediately.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="inc-title">Title</Label><Input id="inc-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div>
              <Label htmlFor="inc-sev">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger id="inc-sev" className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>{["minor", "major", "critical"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="inc-msg">Initial update</Label><Textarea id="inc-msg" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-20" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => void create()} disabled={!title || !message}>Declare</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(updateFor)} onOpenChange={(v) => !v && setUpdateFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update: {updateFor?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="upd-status">Status</Label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger id="upd-status" className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>{["investigating", "identified", "monitoring", "resolved"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="upd-msg">Message</Label><Textarea id="upd-msg" value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} className="min-h-20" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateFor(null)}>Cancel</Button>
            <Button onClick={() => void postUpdate()} disabled={!updateMessage}>Post update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Abuse review ---------------- */

interface Attempt { id: string; email: string; success: boolean; reason: string | null; ip: string | null; suspicious: boolean; createdAt: string }

function AdminAbuse() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("suspicious");
  const [data, setData] = useState<{
    attempts: Attempt[];
    lockedUsers: Array<{ id: string; email: string; lockedUntil: string; failedLoginCount: number }>;
    suspended: Array<{ id: string; email: string; statusReason: string | null }>;
    failureBreakdown: Array<{ reason: string | null; _count: number }>;
  } | null>(null);

  const load = useCallback(() => {
    api<never>(`/api/admin/abuse?filter=${filter}`, { dedupe: true }).then((d) => setData(d as never)).catch(() => setData(null));
  }, [filter]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const act = async (attemptId: string, action: string) => {
    await api("/api/admin/abuse", { method: "POST", body: { action, attemptId } }).catch(() => {});
    toast({ title: action === "escalate" ? "Security notice sent to user" : "Flag dismissed" });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Abuse & fraud review</h1>
        <div className="flex gap-1" role="tablist" aria-label="Attempt filter">
          {["suspicious", "failed", "all"].map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-medium capitalize", filter === f ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {data?.lockedUsers && data.lockedUsers.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
          <p className="mb-2 text-sm font-semibold text-warning">Locked accounts (brute-force protection)</p>
          <ul className="space-y-1 text-sm">
            {data.lockedUsers.map((u) => (
              <li key={u.id}>{u.email} — locked until {new Date(u.lockedUntil).toLocaleTimeString()} · {u.failedLoginCount} failures</li>
            ))}
          </ul>
        </div>
      )}
      {data?.suspended && data.suspended.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="mb-2 text-sm font-semibold text-destructive">Suspended accounts</p>
          <ul className="space-y-1 text-sm">
            {data.suspended.map((u) => <li key={u.id}>{u.email} — {u.statusReason || "policy violation"}</li>)}
          </ul>
        </div>
      )}

      {!data && <Spinner />}
      {data && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {data.attempts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
              <span className={cn("size-2 rounded-full", a.success ? "bg-primary" : a.suspicious ? "bg-destructive" : "bg-warning")} aria-hidden="true" />
              <span className="font-medium">{a.email}</span>
              <span className="font-mono text-xs text-muted-foreground">{a.ip}</span>
              <Badge variant="outline" className="text-xs">{a.reason || (a.success ? "login" : "failed")}</Badge>
              {a.suspicious && <Badge variant="outline" className="border-destructive/40 text-destructive">suspicious</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
              {a.suspicious && (
                <span className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => void act(a.id, "escalate")}>Escalate</Button>
                  <Button size="sm" variant="ghost" onClick={() => void act(a.id, "dismiss")}>Dismiss</Button>
                </span>
              )}
            </li>
          ))}
          {data.attempts.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing flagged in the last 7 days.</li>}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Audit log ---------------- */

interface AuditRow { id: string; actorEmail: string | null; action: string; targetType: string | null; targetId: string | null; severity: string; ip: string | null; createdAt: string }

function AdminAudit() {
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState("");
  const [data, setData] = useState<{ events: AuditRow[]; total: number; page: number; pages: number } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api<{ events: AuditRow[]; total: number; page: number; pages: number }>(`/api/admin/audit?q=${encodeURIComponent(q)}&severity=${severity}&page=${page}`, { dedupe: true })
      .then(setData).catch(() => setData(null));
  }, [q, severity, page]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Audit log <span className="text-sm font-normal text-muted-foreground">({data?.total ?? "…"} events)</span></h1>
      <div className="flex flex-wrap gap-2">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Filter by email or action…" className="pl-9" aria-label="Filter audit log" />
        </div>
        <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1); }}>
          <SelectTrigger className="w-40" aria-label="Severity filter"><SelectValue placeholder="All severities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {!data && <Spinner />}
      <ul className="divide-y overflow-hidden rounded-xl border bg-card font-mono text-xs">
        {data?.events.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
            <span className="w-36 shrink-0 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
            <span className={cn("w-16 shrink-0 font-semibold uppercase", e.severity === "critical" ? "text-destructive" : e.severity === "warning" ? "text-warning" : "text-muted-foreground")}>{e.severity}</span>
            <span className="font-semibold">{e.action}</span>
            <span className="text-muted-foreground">{e.actorEmail}</span>
            {e.targetId && <span className="text-muted-foreground">→ {e.targetType}:{e.targetId.slice(-8)}</span>}
            <span className="ml-auto text-muted-foreground">{e.ip}</span>
          </li>
        ))}
      </ul>
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.page} / {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Support queue ---------------- */

interface AdminTicket {
  id: string; subject: string; category: string; priority: string; status: string; updatedAt: string;
  user?: { email: string; subscription?: { plan: string } | null };
  messages: Array<{ body: string }>;
}

function AdminTickets() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<AdminTicket[] | null>(null);
  const [replyTo, setReplyTo] = useState<AdminTicket | null>(null);
  const [reply, setReply] = useState("");

  const load = useCallback(() => {
    api<{ tickets: AdminTicket[] }>("/api/admin/tickets", { dedupe: true }).then((d) => setTickets(d.tickets)).catch(() => setTickets([]));
  }, []);
  useEffect(load, [load]);

  const sendReply = async () => {
    if (!replyTo) return;
    await api(`/api/admin/tickets/${replyTo.id}`, { method: "POST", body: { action: "reply", message: reply } }).catch(() => {});
    toast({ title: "Reply sent", description: "User was notified." });
    setReplyTo(null); setReply("");
    load();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Support queue</h1>
      {!tickets && <Spinner />}
      {tickets?.length === 0 && <EmptyState title="Queue is empty" message="No customer tickets right now." />}
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {tickets?.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.subject}</p>
              <p className="text-xs text-muted-foreground">{t.user?.email} · <PlanBadge plan={t.user?.subscription?.plan || "free"} /> · {t.messages[0]?.body.slice(0, 80)}…</p>
            </div>
            <Badge variant="outline" className="capitalize">{t.priority}</Badge>
            <StatusBadge status={t.status} />
            <Button size="sm" variant="outline" onClick={() => setReplyTo(t)}>Reply</Button>
          </li>
        ))}
      </ul>
      <Dialog open={Boolean(replyTo)} onOpenChange={(v) => !v && setReplyTo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reply: {replyTo?.subject}</DialogTitle></DialogHeader>
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} className="min-h-28" placeholder="Write the agent response…" aria-label="Agent reply" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyTo(null)}>Cancel</Button>
            <Button onClick={() => void sendReply()} disabled={!reply.trim()}>Send & mark solved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
