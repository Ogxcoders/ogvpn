"use client";

// Settings hub (E/G/AF/X/Y/Z user surfaces): profile, security (MFA, sessions,
// auth history), VPN defaults (kill switch, DNS, IPv6, LAN bypass, protocol),
// privacy (telemetry, export, delete), notifications preferences.
import { useCallback, useEffect, useState } from "react";
import { api, timeAgo, ApiClientError, errMsg } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { Spinner, ErrorState, StatusBadge } from "@/components/product/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, ShieldCheck, KeyRound, Eye, BellRing, Printer, MonitorSmartphone, FileDown, Trash2,
  LogOut, QrCode, RefreshCcw, Lock, History, Globe2, Split, Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SessionRow { id: string; deviceLabel: string | null; platform: string; ip: string | null; createdAt: string; lastSeenAt: string; trusted: boolean; isCurrent: boolean }
interface AttemptRow { id: string; success: boolean; reason: string | null; ip: string | null; createdAt: string }
interface NotificationPrefs { connection: boolean; security: boolean; account: boolean; billing: boolean; maintenance: boolean; incident: boolean; update: boolean; emailEnabled: boolean; pushEnabled: boolean; inProductEnabled: boolean }

export function SettingsView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Account, security, VPN defaults, privacy, and notifications.</p>
      </div>
      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile"><User className="mr-1.5 size-3.5" aria-hidden="true" />Profile</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck className="mr-1.5 size-3.5" aria-hidden="true" />Security</TabsTrigger>
          <TabsTrigger value="vpn"><Globe2 className="mr-1.5 size-3.5" aria-hidden="true" />VPN</TabsTrigger>
          <TabsTrigger value="notifications"><BellRing className="mr-1.5 size-3.5" aria-hidden="true" />Notifications</TabsTrigger>
          <TabsTrigger value="privacy"><Eye className="mr-1.5 size-3.5" aria-hidden="true" />Privacy</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="security"><SecurityTab /></TabsContent>
        <TabsContent value="vpn"><VpnTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="privacy"><PrivacyTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Profile ---------- */

function ProfileTab() {
  const { user, setUser } = useApp();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api("/api/auth/profile", { method: "POST", body: { name }, retries: 0 });
      setUser(user ? { ...user, name } : null);
      toast({ title: "Profile saved" });
    } catch (e) {
      toast({ title: "Could not save profile", description: (e as ApiClientError).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      await api("/api/auth/password-change", { method: "POST", body: { currentPassword: currentPw, newPassword: newPw }, retries: 0 });
      toast({ title: "Password changed", description: "Other devices were signed out." });
      setPwOpen(false); setCurrentPw(""); setNewPw("");
    } catch (e) {
      toast({ title: "Change failed", description: errMsg(e), variant: "destructive" });
    }
  };

  const changeEmail = async () => {
    try {
      const d = await api<{ devEmailToken?: string }>("/api/auth/email-change", { method: "POST", body: { password: confirmPw, email: newEmail }, retries: 0 });
      if (d.devEmailToken) {
        // Sandbox: confirm immediately through the token flow
        await api("/api/auth/email-change-confirm", { method: "POST", body: { token: d.devEmailToken }, retries: 0 });
        if (user) setUser({ ...user, email: newEmail, emailVerified: true });
        toast({ title: "Email updated", description: "Dev environment: confirmation was applied automatically." });
      } else {
        toast({ title: "Check your new inbox", description: "Click the confirmation link to finish." });
      }
      setEmailOpen(false); setNewEmail(""); setConfirmPw("");
    } catch (e) {
      toast({ title: "Email change failed", description: errMsg(e), variant: "destructive" });
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <section className="space-y-4 rounded-xl border bg-card p-5" aria-labelledby="profile-title">
        <h2 id="profile-title" className="font-semibold">Profile</h2>
        <div>
          <Label htmlFor="pf-email">Email</Label>
          <div className="flex items-center gap-2">
            <Input id="pf-email" value={user?.email || ""} readOnly aria-readonly />
            <Badge variant="outline" className={user?.emailVerified ? "border-primary/40 text-primary" : "border-warning/40 text-warning"}>
              {user?.emailVerified ? "verified" : "unverified"}
            </Badge>
          </div>
        </div>
        <div>
          <Label htmlFor="pf-name">Display name</Label>
          <div className="flex gap-2">
            <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            <Button variant="outline" onClick={() => void saveProfile()} disabled={saving}>Save</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPwOpen(true)}><Lock className="size-4" aria-hidden="true" /> Change password</Button>
          <Button variant="outline" onClick={() => setEmailOpen(true)}><Printer className="size-4" aria-hidden="true" /> Change email</Button>
        </div>
      </section>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change password</DialogTitle>
            <DialogDescription>Other devices will be signed out. Your current session stays active.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="cur-pw">Current password</Label>
              <Input id="cur-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" /></div>
            <div><Label htmlFor="new-pw">New password</Label>
              <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="10+ chars, mixed case, digit" autoComplete="new-password" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={() => void changePassword()} disabled={!currentPw || !newPw}>Update password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change email</DialogTitle>
            <DialogDescription>Confirm with your password; then verify the new address.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="new-email">New email</Label>
              <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
            <div><Label htmlFor="cf-pw">Current password</Label>
              <Input id="cf-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="current-password" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button onClick={() => void changeEmail()} disabled={!newEmail || !confirmPw}>Send confirmation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Security ---------- */

function SecurityTab() {
  const { user, setUser } = useApp();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[] | null>(null);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaUri, setMfaUri] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePw, setDisablePw] = useState("");

  const load = useCallback(() => {
    api<{ sessions: SessionRow[] }>("/api/auth/sessions", { dedupe: true }).then((d) => setSessions(d.sessions)).catch(() => setSessions([]));
    api<AttemptRow[]>("/api/auth/history", { dedupe: true }).then((d) => setAttempts(d)).catch(() => setAttempts([]));
  }, []);
  useEffect(load, [load]);

  const revokeSession = async (id: string) => {
    await api(`/api/auth/sessions?id=${id}`, { method: "DELETE" }).catch(() => {});
    setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
    toast({ title: "Session revoked" });
  };

  const startMfa = async () => {
    try {
      const d = await api<{ secret: string; otpauthUri: string }>("/api/auth/mfa/enroll", { method: "POST", body: {}, retries: 0 });
      setMfaSecret(d.secret);
      setMfaUri(d.otpauthUri);
      setMfaOpen(true);
    } catch (e) {
      toast({ title: "MFA enrollment failed", description: errMsg(e), variant: "destructive" });
    }
  };

  const activateMfa = async () => {
    try {
      const d = await api<{ backupCodes: string[] }>("/api/auth/mfa/activate", { method: "POST", body: { code: mfaCode }, retries: 0 });
      setBackupCodes(d.backupCodes);
      setMfaOpen(false);
      setMfaCode("");
      if (user) setUser({ ...user, mfaEnabled: true });
      toast({ title: "MFA enabled", description: "Store your backup codes somewhere safe." });
    } catch (e) {
      toast({ title: "Invalid code", description: errMsg(e), variant: "destructive" });
    }
  };

  const disableMfa = async () => {
    try {
      await api("/api/auth/mfa/disable", { method: "POST", body: { password: disablePw }, retries: 0 });
      if (user) setUser({ ...user, mfaEnabled: false });
      setDisableOpen(false); setDisablePw("");
      toast({ title: "MFA disabled", description: "Other devices were signed out." });
    } catch (e) {
      toast({ title: "Could not disable MFA", description: errMsg(e), variant: "destructive" });
    }
  };

  const regenerateCodes = async () => {
    const pw = window.prompt("Confirm your password to regenerate backup codes:");
    if (!pw) return;
    try {
      const d = await api<{ backupCodes: string[] }>("/api/auth/mfa/backup-codes", { method: "POST", body: { password: pw }, retries: 0 });
      setBackupCodes(d.backupCodes);
      toast({ title: "Backup codes regenerated" });
    } catch (e) {
      toast({ title: "Regeneration failed", description: errMsg(e), variant: "destructive" });
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* MFA */}
      <section className="space-y-3 rounded-xl border bg-card p-5" aria-labelledby="mfa-title">
        <h2 id="mfa-title" className="flex items-center gap-2 font-semibold"><KeyRound className="size-4" aria-hidden="true" /> Multi-factor authentication</h2>
        {user?.mfaEnabled ? (
          <>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Enabled with authenticator app
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void regenerateCodes()}><RefreshCcw className="size-3.5" aria-hidden="true" /> New backup codes</Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDisableOpen(true)}>Disable MFA</Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Add a TOTP authenticator (Aegis, Google Authenticator, 1Password) plus 10 single-use backup codes.</p>
            <Button onClick={() => void startMfa()}><QrCode className="size-4" aria-hidden="true" /> Enable MFA</Button>
          </>
        )}
      </section>

      {/* Sessions */}
      <section className="space-y-3 rounded-xl border bg-card p-5" aria-labelledby="sess-title">
        <h2 id="sess-title" className="flex items-center gap-2 font-semibold"><MonitorSmartphone className="size-4" aria-hidden="true" /> Active sessions</h2>
        {!sessions && <Spinner label="Loading sessions…" />}
        <ul className="space-y-2">
          {sessions?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-medium">
                  {s.deviceLabel || "Unknown device"}
                  {s.isCurrent && <Badge variant="outline" className="border-primary/40 text-primary">this device</Badge>}
                  {s.trusted && <Badge variant="outline">trusted</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">{s.ip || "—"} · active {timeAgo(s.lastSeenAt)}</p>
              </div>
              {!s.isCurrent && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void revokeSession(s.id)}>
                  <LogOut className="size-3.5" aria-hidden="true" /> Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Auth history */}
      <section className="space-y-3 rounded-xl border bg-card p-5" aria-labelledby="hist-title">
        <h2 id="hist-title" className="flex items-center gap-2 font-semibold"><History className="size-4" aria-hidden="true" /> Authentication history</h2>
        {!attempts && <p className="text-sm text-muted-foreground">Loading…</p>}
        {attempts?.length === 0 && <p className="text-sm text-muted-foreground">No sign-in activity recorded yet.</p>}
        <ul className="space-y-1.5">
          {attempts?.slice(0, 10).map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-xs">
              <span className={cn("size-1.5 rounded-full", a.success ? "bg-primary" : "bg-destructive")} aria-hidden="true" />
              <span className="w-24">{new Date(a.createdAt).toLocaleString()}</span>
              <span className="font-mono">{a.ip}</span>
              <span className="text-muted-foreground">{a.reason || (a.success ? "success" : "failed")}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* MFA enroll dialog */}
      <Dialog open={mfaOpen} onOpenChange={setMfaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set up your authenticator</DialogTitle>
            <DialogDescription>Scan the URI with your authenticator app, then confirm the 6-digit code.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-1 text-xs font-semibold">Manual entry key</p>
              <p className="break-all font-mono text-xs">{mfaSecret}</p>
              <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">{mfaUri}</p>
            </div>
            <div>
              <Label htmlFor="mfa-code">6-digit code</Label>
              <Input id="mfa-code" inputMode="numeric" maxLength={6} value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))} className="text-center font-mono text-lg tracking-widest" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMfaOpen(false)}>Cancel</Button>
            <Button onClick={() => void activateMfa()} disabled={mfaCode.length !== 6}>Verify & enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup codes display */}
      <Dialog open={Boolean(backupCodes)} onOpenChange={(v) => !v && setBackupCodes(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Your backup codes</DialogTitle>
            <DialogDescription>Each code works exactly once. Store them in a password manager or print them.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes?.map((c) => (
              <code key={c} className="rounded-md border bg-muted/40 px-2 py-1.5 text-center font-mono text-sm">{c}</code>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => backupCodes && void navigator.clipboard?.writeText(backupCodes.join("\n"))}>
              <Copy className="size-4" aria-hidden="true" /> Copy all
            </Button>
            <Button onClick={() => setBackupCodes(null)}>I&apos;ve saved them</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable MFA */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent role="alertdialog">
          <DialogHeader><DialogTitle>Disable MFA?</DialogTitle>
            <DialogDescription>This reduces account security. Other devices will be signed out.</DialogDescription></DialogHeader>
          <div><Label htmlFor="dis-pw">Confirm password</Label>
            <Input id="dis-pw" type="password" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} autoComplete="current-password" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void disableMfa()} disabled={!disablePw}>Disable MFA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- VPN defaults ---------- */

function VpnTab() {
  const { toast } = useToast();
  const [killSwitch, setKillSwitch] = useState(true);
  const [ipv6, setIpv6] = useState(true);
  const [lan, setLan] = useState(true);
  const [autoConnect, setAutoConnect] = useState(false);
  const [protocol, setProtocol] = useState("wireguard");
  const [dnsMode, setDnsMode] = useState("vpn");
  const [dnsServer, setDnsServer] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    api<{ settings: { killSwitch: boolean; ipv6Enabled: boolean; lanBypass: boolean; autoConnect: boolean; protocolPreference: string; dnsMode: string; dnsServer: string | null } }>("/api/settings/vpn", { dedupe: true })
      .then((d) => {
        setKillSwitch(d.settings.killSwitch);
        setIpv6(d.settings.ipv6Enabled);
        setLan(d.settings.lanBypass);
        setAutoConnect(d.settings.autoConnect);
        setProtocol(d.settings.protocolPreference);
        setDnsMode(d.settings.dnsMode);
        setDnsServer(d.settings.dnsServer || "");
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
  }, []);

  const persist = async (patch: Record<string, unknown>, label: string) => {
    try {
      await api("/api/settings/vpn", { method: "PATCH", body: patch, retries: 1 });
      toast({ title: label, description: "Applies to new connections immediately." });
    } catch (e) {
      toast({ title: "Could not save", description: (e as ApiClientError).message, variant: "destructive" });
    }
  };

  return (
    <div className={cn("max-w-xl space-y-4", !hydrated && "opacity-60 transition-opacity")} aria-busy={!hydrated}>
      <ToggleRow id="ks" icon={<ShieldCheck className="size-4" aria-hidden="true" />} title="Kill switch" desc="Block all traffic if the tunnel drops — during handshakes, sleep/wake and network switches." checked={killSwitch} onChange={(v) => { setKillSwitch(v); void persist({ killSwitch: v }, "Kill switch updated"); }} />
      <ToggleRow id="v6" icon={<Globe2 className="size-4" aria-hidden="true" />} title="IPv6 inside the tunnel" desc="Route IPv6 through the VPN and prevent IPv6 leaks on dual-stack networks." checked={ipv6} onChange={(v) => { setIpv6(v); void persist({ ipv6Enabled: v }, "IPv6 preference updated"); }} />
      <ToggleRow id="lan" icon={<MonitorSmartphone className="size-4" aria-hidden="true" />} title="Allow LAN access" desc="Reach printers, NAS and local devices while connected (192.168.0.0/16, 10.0.0.0/8)." checked={lan} onChange={(v) => { setLan(v); void persist({ lanBypass: v }, "LAN access updated"); }} />
      <ToggleRow id="ac" icon={<Zap2 className="size-4" aria-hidden="true" />} title="Auto-connect on launch" desc="Establish the tunnel immediately when a client opens." checked={autoConnect} onChange={(v) => { setAutoConnect(v); void persist({ autoConnect: v }, "Auto-connect updated"); }} />
      <div className="rounded-xl border bg-card p-4">
        <Label htmlFor="proto" className="flex items-center gap-2"><Split className="size-4" aria-hidden="true" /> Preferred protocol</Label>
        <Select value={protocol} onValueChange={(v) => { setProtocol(v); void persist({ protocolPreference: v }, "Protocol preference saved"); }}>
          <SelectTrigger id="proto" className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="wireguard">WireGuard® — fastest (recommended)</SelectItem>
            <SelectItem value="openvpn">OpenVPN — UDP, TCP 443 fallback</SelectItem>
            <SelectItem value="ikev2">IKEv2/IPsec — best roaming</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1.5 text-xs text-muted-foreground">Protocol negotiation and fallback are automatic per network.</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <Label htmlFor="dns-mode">DNS inside the tunnel</Label>
        <Select value={dnsMode} onValueChange={(v) => { setDnsMode(v); void persist({ dnsMode: v }, "DNS mode saved"); }}>
          <SelectTrigger id="dns-mode" className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vpn">Aegis encrypted DNS (10.8.0.1) — leak-proof</SelectItem>
            <SelectItem value="custom">Custom resolver</SelectItem>
          </SelectContent>
        </Select>
        {dnsMode === "custom" && (
          <div className="mt-2 flex gap-2">
            <Input id="dns-server" value={dnsServer} onChange={(e) => setDnsServer(e.target.value)} placeholder="9.9.9.9" className="font-mono" />
            <Button variant="outline" onClick={() => void persist({ dnsServer }, "Custom DNS saved")}>Save</Button>
          </div>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">Custom resolvers are still forced through the tunnel when the kill switch is armed.</p>
      </div>
    </div>
  );
}

function Zap2({ className }: { className?: string }) {
  return <span className={className} aria-hidden="true">⚡</span>;
}

function ToggleRow({ id, icon, title, desc, checked, onChange }: {
  id: string; icon: React.ReactNode; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4">
      <div className="flex gap-3">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div>
          <Label htmlFor={id} className="font-medium">{title}</Label>
          <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ---------- Notifications ---------- */

function NotificationsTab() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    api<{ preferences: NotificationPrefs }>("/api/notifications/preferences", { dedupe: true })
      .then((d) => setPrefs(d.preferences))
      .catch(() => setPrefs(null));
  }, []);

  const set = (key: keyof NotificationPrefs) => (v: boolean) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: v };
    setPrefs(next);
    api("/api/notifications/preferences", { method: "PATCH", body: { [key]: v } }).catch(() => {});
    toast({ title: "Preference saved" });
  };

  if (!prefs) return <Spinner label="Loading preferences…" />;

  const categories: Array<[keyof NotificationPrefs, string, string]> = [
    ["connection", "Connection", "Connect, disconnect, reconnect and degraded-server notices"],
    ["security", "Security", "New sign-ins, device registrations, MFA and lockout events"],
    ["account", "Account", "Email changes, support replies, welcome"],
    ["billing", "Billing", "Payments, failures, renewals, plan changes"],
    ["maintenance", "Maintenance", "Scheduled gateway maintenance windows"],
    ["incident", "Incidents", "Service incidents and resolution updates"],
    ["update", "App updates", "New releases and required upgrades"],
  ];

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Channels</h2>
        <ToggleRow id="ch-email" icon={<BellRing className="size-4" aria-hidden="true" />} title="Email" desc="Security and billing email to your account address." checked={prefs.emailEnabled} onChange={set("emailEnabled")} />
        <div className="mt-3">
          <ToggleRow id="ch-push" icon={<BellRing className="size-4" aria-hidden="true" />} title="Push (native apps)" desc="Delivered through platform push services on mobile and desktop." checked={prefs.pushEnabled} onChange={set("pushEnabled")} />
        </div>
        <div className="mt-3">
          <ToggleRow id="ch-inapp" icon={<BellRing className="size-4" aria-hidden="true" />} title="In-product" desc="The bell menu in the dashboard. Critical security notices always arrive." checked={prefs.inProductEnabled} onChange={set("inProductEnabled")} />
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-1 font-semibold">Categories</h2>
        <p className="mb-2 text-sm text-muted-foreground">Critical security alerts bypass these switches by design.</p>
        <div className="space-y-2">
          {categories.map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={Boolean(prefs[key])} onCheckedChange={set(key)} aria-label={`${title} notifications`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Privacy ---------- */

function PrivacyTab() {
  const { user, navigate, setUser } = useApp();
  const { toast } = useToast();
  const [telemetry, setTelemetry] = useState(true);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState("");

  const download = async (kind: "export" | "diagnostics") => {
    try {
      const text = await api<string>(`/api/account/${kind}`, { raw: true, retries: 0 });
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = kind === "export" ? "aegis-account-export.json" : "aegis-diagnostics.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: kind === "export" ? "Data export downloaded" : "Diagnostics downloaded" });
    } catch (e) {
      toast({ title: "Download failed", description: errMsg(e), variant: "destructive" });
    }
  };

  const deleteAccount = async () => {
    try {
      await api("/api/account/delete", { method: "POST", body: { password: deletePw }, retries: 0 });
      setUser(null);
      setDeleteOpen(false);
      toast({ title: "Account scheduled for deletion", description: "Sign in within 30 days to restore it." });
      navigate({ view: "landing" });
    } catch (e) {
      toast({ title: "Deletion failed", description: errMsg(e), variant: "destructive" });
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <ToggleRow id="tel" icon={<Eye className="size-4" aria-hidden="true" />} title="Product telemetry" desc="Anonymous performance counters that help us fix failures faster. Never includes browsing data." checked={telemetry} onChange={(v) => { setTelemetry(v); void api("/api/account/privacy", { method: "POST", body: { telemetryEnabled: v } }); }} />
      <ToggleRow id="anx" icon={<Eye className="size-4" aria-hidden="true" />} title="Product analytics events" desc="Feature usage events with PII stripping and sampling. Opt out at any time." checked={!analyticsOptOut} onChange={(v) => { setAnalyticsOptOut(!v); void api("/api/account/privacy", { method: "POST", body: { analyticsOptOut: !v } }); }} />
      <div className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted-foreground">GDPR/CCPA tooling — self-serve, immediate.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void download("export")}><FileDown className="size-4" aria-hidden="true" /> Export account data</Button>
          <Button variant="outline" onClick={() => void download("diagnostics")}><FileDown className="size-4" aria-hidden="true" /> Diagnostics report</Button>
        </div>
      </div>
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
        <h2 className="font-semibold text-destructive">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deletion schedules a full purge in 30 days. Signing in again within the window restores everything.
        </p>
        <Button variant="destructive" className="mt-3" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-4" aria-hidden="true" /> Delete account
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent role="alertdialog">
          <DialogHeader><DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Active connections end immediately and all sessions are signed out. Data is purged after 30 days.
            </DialogDescription></DialogHeader>
          <div><Label htmlFor="del-pw">Confirm password</Label>
            <Input id="del-pw" type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} autoComplete="current-password" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Keep account</Button>
            <Button variant="destructive" onClick={() => void deleteAccount()} disabled={!deletePw}>Delete forever window</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
