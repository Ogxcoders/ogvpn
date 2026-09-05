"use client";

// Device management UI (Section H): list, register with credential reveal,
// rename, split tunneling editor, revoke with confirm, config download.
import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError, errMsg } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { useConnectionEngine, type ConnectionEngine } from "@/lib/client/use-connection";
import { Spinner, ErrorState, EmptyState, PlanBadge } from "@/components/product/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Smartphone, Laptop, Monitor, Globe2, Plus, Star, Trash2, Download, KeyRound, Split, MoreVertical, Chrome, Terminal } from "lucide-react";
import { timeAgo } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DeviceRow {
  id: string; name: string; platform: string; osVersion: string | null; appVersion: string | null;
  status: string; publicKeyFingerprint: string; configVersion: number;
  splitTunnelMode: string; splitRules: string[]; lastSeenAt: string | null; createdAt: string;
  activeConnection: { id: string; serverCode?: string } | null;
}

const PLATFORM_ICONS: Record<string, typeof Smartphone> = {
  android: Smartphone, ios: Smartphone, macos: Laptop, windows: Monitor, linux: Terminal, web: Globe2, extension: Chrome,
};

export function DevicesView({ engine }: { engine: ConnectionEngine }) {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [devices, setDevices] = useState<DeviceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(1);
  const [plan, setPlan] = useState("free");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPlatform, setNewPlatform] = useState("android");
  const [adding, setAdding] = useState(false);
  const [revealCreds, setRevealCreds] = useState<{ device: DeviceRow; privateKey: string } | null>(null);
  const [editDevice, setEditDevice] = useState<DeviceRow | null>(null);
  const [revokeDevice, setRevokeDevice] = useState<DeviceRow | null>(null);
  const [splitMode, setSplitMode] = useState("off");
  const [splitRules, setSplitRules] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const load = useCallback(() => {
    setError(null);
    api<{ devices: DeviceRow[]; deviceLimit: number; plan: string }>("/api/devices", { dedupe: true })
      .then((d) => { setDevices(d.devices); setLimit(d.deviceLimit); setPlan(d.plan); })
      .catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  const addDevice = async () => {
    setAdding(true);
    try {
      const data = await api<{ device: DeviceRow; credentials: { privateKey: string } }>("/api/devices", {
        method: "POST", body: { name: newName, platform: newPlatform }, retries: 0,
      });
      setRevealCreds({ device: data.device, privateKey: data.credentials.privateKey });
      setAddOpen(false);
      setNewName("");
      load();
      void engine.refresh();
    } catch (e) {
      const err = e as ApiClientError;
      if (err.code === "device_limit_reached") {
        toast({ title: "Device limit reached", description: err.message, variant: "destructive" });
        setAddOpen(false);
        navigate({ view: "app", tab: "billing" });
      } else {
        toast({ title: "Could not add device", description: err.message, variant: "destructive" });
      }
    } finally {
      setAdding(false);
    }
  };

  const revoke = async () => {
    if (!revokeDevice) return;
    try {
      await api(`/api/devices/${revokeDevice.id}`, { method: "DELETE", retries: 0 });
      toast({ title: "Device revoked", description: `${revokeDevice.name} can no longer connect.` });
      setRevokeDevice(null);
      load();
      void engine.refresh();
    } catch (e) {
      toast({ title: "Revoke failed", description: errMsg(e), variant: "destructive" });
    }
  };

  const saveEdit = async () => {
    if (!editDevice) return;
    try {
      const body: Record<string, unknown> = {};
      if (renameValue && renameValue !== editDevice.name) body.name = renameValue;
      if (splitMode !== editDevice.splitTunnelMode) body.splitTunnelMode = splitMode;
      if (splitRules || splitMode !== "off") body.splitRules = splitRules.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      await api(`/api/devices/${editDevice.id}`, { method: "PATCH", body, retries: 0 });
      toast({ title: "Device updated" });
      setEditDevice(null);
      load();
    } catch (e) {
      toast({ title: "Update failed", description: errMsg(e), variant: "destructive" });
    }
  };

  const openEdit = (d: DeviceRow) => {
    setEditDevice(d);
    setRenameValue(d.name);
    setSplitMode(d.splitTunnelMode);
    setSplitRules(d.splitRules.join("\n"));
  };

  const downloadConfig = async (d: DeviceRow, rotate: boolean) => {
    try {
      const text = await api<string>(`/api/devices/${d.id}/config?rotate=${rotate ? 1 : 0}`, { raw: true, retries: 0 });
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aegis-${d.platform}-${d.name.replace(/\W+/g, "-").toLowerCase()}.conf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: rotate ? "Keys rotated & config downloaded" : "Config downloaded", description: "Import it into your WireGuard client." });
    } catch (e) {
      toast({ title: "Config download failed", description: errMsg(e), variant: "destructive" });
    }
  };

  const used = devices?.length ?? 0;
  const usedPct = Math.min(100, (used / Math.max(1, limit)) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Devices</h1>
          <p className="text-sm text-muted-foreground">Registered endpoints with per-device keys and routing rules.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="size-4" aria-hidden="true" /> Add device</Button>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{used} of {limit} devices used</span>
          <span className="flex items-center gap-2 text-muted-foreground">Plan: <PlanBadge plan={plan} /></span>
        </div>
        <Progress value={usedPct} aria-label={`Device slots: ${used} of ${limit}`} />
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!devices && !error && <Spinner label="Loading devices…" />}
      {devices && devices.length === 0 && (
        <EmptyState
          icon={<Smartphone className="size-8" />}
          title="No devices yet"
          message="Add a device to generate its VPN profile and manage split tunneling. The web dashboard counts as a device when you connect."
          action={<Button onClick={() => setAddOpen(true)}>Add your first device</Button>}
        />
      )}

      <ul className="space-y-3">
        {devices?.map((d) => {
          const Icon = PLATFORM_ICONS[d.platform] || Monitor;
          const active = Boolean(d.activeConnection);
          return (
            <li key={d.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
              <span className={cn("flex size-10 items-center justify-center rounded-lg", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {d.name}
                  {active && <Badge className="bg-primary/15 text-primary" variant="outline">connected{d.activeConnection?.serverCode ? ` · ${d.activeConnection.serverCode}` : ""}</Badge>}
                  {d.status === "pending" && <Badge variant="outline" className="border-warning/40 text-warning">pending approval</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.platform}{d.osVersion ? ` · ${d.osVersion}` : ""} · app {d.appVersion} · key …{d.publicKeyFingerprint} · cfg v{d.configVersion}
                  {d.lastSeenAt ? ` · seen ${timeAgo(d.lastSeenAt)}` : " · never connected"}
                </p>
              </div>
              {d.splitTunnelMode !== "off" && (
                <Badge variant="outline" className="gap-1"><Split className="size-3" aria-hidden="true" />{d.splitTunnelMode} ({d.splitRules.length})</Badge>
              )}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => void downloadConfig(d, false)} aria-label={`Download config for ${d.name}`}>
                  <Download className="size-4" aria-hidden="true" /> Config
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(d)} aria-label={`Manage ${d.name}`}>
                  <Star className="size-4" aria-hidden="true" /> Manage
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setRevokeDevice(d)} aria-label={`Revoke ${d.name}`}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Add device dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a device</DialogTitle>
            <DialogDescription>
              A unique Curve25519 keypair is generated for the device. The private key is shown once — store it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dev-name">Device name</Label>
              <Input id="dev-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Pixel 9" maxLength={60} />
            </div>
            <div>
              <Label htmlFor="dev-platform">Platform</Label>
              <Select value={newPlatform} onValueChange={setNewPlatform}>
                <SelectTrigger id="dev-platform" aria-label="Platform"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["android", "windows", "macos", "linux", "extension"].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => void addDevice()} disabled={!newName.trim() || adding}>
              {adding && "Creating…"} Create device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credential reveal */}
      <Dialog open={Boolean(revealCreds)} onOpenChange={(v) => !v && setRevealCreds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" aria-hidden="true" /> Private key — shown once</DialogTitle>
            <DialogDescription>
              Copy this private key into the device&apos;s WireGuard client. It is stored server-side only in escrow for
              config export and can be rotated anytime. Never share it.
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-32 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs break-all whitespace-pre-wrap" aria-label="Private key">
            {revealCreds?.privateKey}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevealCreds(null)}>Done</Button>
            {revealCreds && (
              <Button onClick={() => {
                void navigator.clipboard?.writeText(revealCreds.privateKey);
                toast({ title: "Copied to clipboard" });
              }}>Copy key</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage device */}
      <Dialog open={Boolean(editDevice)} onOpenChange={(v) => !v && setEditDevice(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto scroll-contain">
          <DialogHeader>
            <DialogTitle>Manage {editDevice?.name}</DialogTitle>
            <DialogDescription>Rename, rotate credentials, and configure split tunneling (Pro).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} maxLength={60} />
            </div>
            <div>
              <Label htmlFor="split-mode">Split tunneling</Label>
              <Select value={splitMode} onValueChange={setSplitMode}>
                <SelectTrigger id="split-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off — full tunnel</SelectItem>
                  <SelectItem value="include">Include — only these go through VPN</SelectItem>
                  <SelectItem value="exclude">Exclude — these bypass the VPN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {splitMode !== "off" && (
              <div>
                <Label htmlFor="split-rules">Rules (CIDR or domain, one per line)</Label>
                <textarea
                  id="split-rules"
                  value={splitRules}
                  onChange={(e) => setSplitRules(e.target.value)}
                  placeholder={"192.168.0.0/16\n*.bank.example\n10.0.0.0/8"}
                  className="min-h-24 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">Example: 10.0.0.0/8, *.bank.example — duplicates and invalid entries are rejected.</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row justify-between">
            <Button variant="outline" onClick={() => editDevice && void downloadConfig(editDevice, true)}>
              <KeyRound className="size-4" aria-hidden="true" /> Rotate keys
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditDevice(null)}>Cancel</Button>
              <Button onClick={() => void saveEdit()}>Save changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm (S 438: prevent accidental destructive actions) */}
      <Dialog open={Boolean(revokeDevice)} onOpenChange={(v) => !v && setRevokeDevice(null)}>
        <DialogContent role="alertdialog">
          <DialogHeader>
            <DialogTitle>Revoke {revokeDevice?.name}?</DialogTitle>
            <DialogDescription>
              The device is disconnected immediately, its keys are invalidated, and it must be re-added to connect again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDevice(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void revoke()}>Revoke device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
