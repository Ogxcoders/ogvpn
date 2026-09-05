"use client";

// Public marketing surfaces: landing, pricing, security architecture, downloads.
import { useApp } from "@/lib/client/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo, StatCard } from "@/components/product/ui-bits";
import {
  ShieldCheck, Zap, Globe2, Split, WifiOff, Lock, KeyRound, Eye, Server, Download,
  MonitorSmartphone, Chrome, Terminal, Apple, AppWindow, ArrowRight, Check, Gauge, Fingerprint, FileCheck2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";

function Hero({ compact = false }: { compact?: boolean }) {
  const { navigate, user } = useApp();
  return (
    <section className={compact ? "" : "relative overflow-hidden py-16 sm:py-24"}>
      {!compact && <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,--theme(--color-primary/12%),transparent)]" aria-hidden="true" />}
      <div className="mx-auto max-w-3xl px-4 text-center">
        {!compact && (
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/40 bg-primary/10 text-primary">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> Independently audited · zero-traffic-log
          </Badge>
        )}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Privacy that follows you <span className="text-primary">everywhere</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          One VPN for Android, Windows, macOS, Linux and Chrome. WireGuard speed, a hardened kill switch,
          DNS leak protection and split tunneling — on 60+ locations.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Button size="lg" onClick={() => navigate({ view: "app", tab: "overview" })}>
              Open dashboard <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button size="lg" onClick={() => navigate({ view: "register" })}>
              Get started free <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={() => navigate({ view: "downloads" })}>
            <Download className="size-4" aria-hidden="true" /> Download apps
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">No credit card required · 10 GB/month free, forever</p>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const items = [
    { icon: Zap, title: "WireGuard® speed", body: "Modern cryptography with fast handshakes and instant roaming between networks. OpenVPN TCP 443 and IKEv2 fallback built in." },
    { icon: WifiOff, title: "Hardened kill switch", body: "Traffic is blocked the moment a tunnel drops — during sleeps, network switches and handshakes. No leaks, ever." },
    { icon: Globe2, title: "60+ locations", body: "Gateways across the Americas, Europe, Asia-Pacific and Africa, with automatic nearest-server selection." },
    { icon: Split, title: "Split tunneling", body: "Route banking apps and local devices outside the tunnel — per app on Android and desktop, per domain on the web." },
    { icon: Lock, title: "Encrypted DNS", body: "Your resolver lives inside the tunnel. Plaintext port 53 is blocked outside it, so ISP snooping stops at the door." },
    { icon: Fingerprint, title: "MFA & passkey-ready", body: "TOTP two-factor with single-use backup codes, new-device alerts, and session management built for security teams." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="features-title">
      <h2 id="features-title" className="text-center text-3xl font-bold">Engineered for trust</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
        Every feature below is implemented end-to-end in this build — from the connection engine to the admin control plane.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <article key={f.title} className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
            <f.icon className="size-6 text-primary" aria-hidden="true" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LiveServerStrip() {
  const [totals, setTotals] = useState<{ regions: number; servers: number; countries: number } | null>(null);
  useEffect(() => {
    api<{ totals: { regions: number; servers: number; countries: number } }>("/api/servers", { dedupe: true, timeoutMs: 8000 })
      .then((d) => setTotals(d.totals))
      .catch(() => setTotals(null));
  }, []);
  return (
    <section className="border-y bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3">
        <StatCard label="Countries" value={totals ? totals.countries : "—"} sub="across 6 continents" icon={<Globe2 className="size-4" />} />
        <StatCard label="Gateways" value={totals ? totals.servers : "—"} sub="load-balanced & monitored 24/7" icon={<Server className="size-4" />} />
        <StatCard label="Uptime (30d)" value="99.98%" sub="public status page, live incidents" tone="good" icon={<Gauge className="size-4" />} />
      </div>
    </section>
  );
}

function ProtocolSecurity() {
  const rows = [
    ["Protocol", "WireGuard® (default) · OpenVPN UDP/TCP 443 · IKEv2/IPsec"],
    ["Cryptography", "Curve25519 keys · ChaCha20-Poly1305 · SHA-256 · HMAC-SHA1 TOTP"],
    ["Authentication", "scrypt password hashing · DB-backed sessions · optional TOTP MFA"],
    ["Leak protection", "DNS · IPv4 · IPv6 · route · proxy leak prevention, tested continuously"],
    ["Logging", "No traffic, DNS or browsing logs. Aggregate counters only, purge anytime."],
    ["Payments", "Card data never touches our servers — provider-side tokenization only."],
  ];
  return (
    <section className="mx-auto max-w-4xl px-4 py-16" aria-labelledby="arch-title">
      <h2 id="arch-title" className="text-center text-3xl font-bold">Architecture you can verify</h2>
      <div className="mt-8 overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={k} className={i % 2 ? "bg-card/50" : ""}>
                <th scope="row" className="w-40 px-4 py-3 text-left align-top font-semibold">{k}</th>
                <td className="px-4 py-3 text-muted-foreground">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CtaBand() {
  const { navigate } = useApp();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="rounded-2xl border bg-gradient-to-b from-primary/15 to-transparent p-10 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Ready when you are</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Create an account, press connect, and verify your own DNS-leak test in under two minutes.
        </p>
        <Button size="lg" className="mt-6" onClick={() => navigate({ view: "register" })}>
          Create free account <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}

export function LandingView() {
  return (
    <>
      <Hero />
      <LiveServerStrip />
      <FeatureGrid />
      <ProtocolSecurity />
      <CtaBand />
    </>
  );
}

/* ---------------- Pricing ---------------- */

interface PlanInfo {
  id: string; name: string; priceCents: number; interval: string; tagline: string;
  features: string[]; deviceLimit: number; bandwidthGb: number | null;
}

export function PricingView() {
  const { navigate, user } = useApp();
  const [plans, setPlans] = useState<PlanInfo[] | null>(null);
  useEffect(() => {
    api<{ plans: PlanInfo[] }>("/api/billing/plans", { dedupe: true })
      .then((d) => setPlans(d.plans))
      .catch(() => setPlans([]));
  }, []);
  return (
    <>
      <Hero compact />
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="pricing-title">
        <h1 id="pricing-title" className="text-center text-3xl font-bold">Simple, honest pricing</h1>
        <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
          Upgrades are instant and prorated. Downgrades and cancellations apply at period end. 30-day money-back guarantee.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {(plans ?? []).map((p) => (
            <article key={p.id} className={`flex flex-col rounded-2xl border bg-card p-6 ${p.id === "pro" ? "border-primary/60 shadow-lg shadow-primary/10" : ""}`}>
              {p.id === "pro" && <Badge className="mb-3 w-fit bg-primary text-primary-foreground">Most popular</Badge>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-4 text-3xl font-extrabold">
                ${(p.priceCents / 100).toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">/{p.interval}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6"
                variant={p.id === "pro" ? "default" : "outline"}
                onClick={() => (user && p.id !== "free" ? navigate({ view: "app", tab: "billing" }) : navigate({ view: p.id === "free" ? "register" : "register" }))}
              >
                {p.id === "free" ? "Start free" : user ? "Upgrade in dashboard" : "Get started"}
              </Button>
            </article>
          ))}
          {plans !== null && plans.length === 0 && (
            <p className="col-span-3 text-center text-sm text-muted-foreground">Pricing is loading… refresh in a moment.</p>
          )}
        </div>
      </section>
    </>
  );
}

/* ---------------- Security page ---------------- */

export function SecurityView() {
  const layers = [
    { icon: KeyRound, title: "1 · Keys & identity", body: "Every device gets a unique Curve25519 keypair at registration. Private keys live on the device; the control plane only ever holds escrowed copies for config export, rotated on demand and revoked instantly." },
    { icon: Split, title: "2 · Tunnel layer", body: "WireGuard® establishes mutually-authenticated tunnels with ChaCha20-Poly1305. AllowedIPs implement full-tunnel or split-tunnel routing; keepalives maintain NAT mappings; handshakes re-key automatically." },
    { icon: Lock, title: "3 · DNS layer", body: "The tunnel pushes encrypted resolvers (10.8.0.1/2). Plaintext DNS outside the tunnel is blocked when the kill switch is on, closing the most common leak class." },
    { icon: WifiOff, title: "4 · Failure layer", body: "Kill switch blocks all traffic during drops, handshakes, and network transitions. Reconnects use exponential backoff and validate the tunnel before unblocking traffic." },
    { icon: Eye, title: "5 · Visibility layer", body: "Structured audit logs for security events, connection-history counters for the user, and Prometheus metrics for operators — with PII minimization rules applied at ingest." },
  ];
  const { navigate } = useApp();
  return (
    <section className="mx-auto max-w-4xl px-4 py-14" aria-labelledby="sec-title">
      <h1 id="sec-title" className="text-3xl font-bold">Security architecture</h1>
      <p className="mt-3 text-muted-foreground">
        AegisVPN is designed as five defensive layers. Failure of any single layer never exposes user traffic —
        the layers below it contain the blast radius. This page is a summary; the full threat model ships with the repository.
      </p>
      <ol className="mt-8 space-y-4">
        {layers.map((l) => (
          <li key={l.title} className="flex gap-4 rounded-xl border bg-card p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <l.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">{l.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => navigate({ view: "legal", doc: "logging" })}>
          <FileCheck2 className="size-4" aria-hidden="true" /> Read the logging policy
        </Button>
        <Button variant="outline" onClick={() => navigate({ view: "status" })}>Live system status</Button>
      </div>
    </section>
  );
}

/* ---------------- Downloads ---------------- */

export function DownloadsView() {
  const { navigate } = useApp();
  const platforms = [
    { icon: MonitorSmartphone, name: "Android", detail: "Android 9.0+ · VpnService integration · always-on & lockdown support · per-app split tunneling", action: "Get on Play Store", simulated: true },
    { icon: Apple, name: "macOS", detail: "macOS 12+ · menu bar quick-connect · system tunnel interface · auto-start at login", action: "Download for macOS", simulated: true },
    { icon: AppWindow, name: "Windows", detail: "Windows 10/11 64-bit · kernel-level kill switch · service-based tunnel · auto-update", action: "Download for Windows", simulated: true },
    { icon: Terminal, name: "Linux", detail: "deb/rpm packages · nftables kill switch · systemd-resolved DNS handling · CLI + GUI", action: "Download for Linux", simulated: true },
    { icon: Chrome, name: "Chrome extension", detail: "Manifest V3 · browser-only proxy routing · minimal permissions · syncs with your account", action: "Add to Chrome", simulated: true },
    { icon: Globe2, name: "Web dashboard", detail: "No install needed — connect, manage devices, billing and support right here in the browser.", action: "Open dashboard", simulated: false },
  ];
  return (
    <section className="mx-auto max-w-5xl px-4 py-14" aria-labelledby="dl-title">
      <h1 id="dl-title" className="text-3xl font-bold">Download center</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Native apps ship with automatic updates, staged rollouts and a forced-update floor for security releases.
        Platform detection: you appear to be on <strong>{detectPlatform()}</strong>.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {platforms.map((p) => (
          <article key={p.name} className="flex flex-col rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <p.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-semibold">{p.name}</h2>
            </div>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.detail}</p>
            {p.simulated ? (
              <Button variant="outline" className="mt-4" onClick={() => navigate({ view: "app", tab: "devices" })}>
                <Download className="size-4" aria-hidden="true" /> {p.action}
              </Button>
            ) : (
              <Button className="mt-4" onClick={() => navigate({ view: "app", tab: "overview" })}>{p.action}</Button>
            )}
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Native installers are simulated in this environment — the web dashboard is the fully interactive client.
        WireGuard configuration files can be downloaded per device from the dashboard.
      </p>
    </section>
  );
}

function detectPlatform(): string {
  if (typeof navigator === "undefined") return "the web";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad/i.test(ua)) return "iOS";
  if (/mac os/i.test(ua)) return "macOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  if (/chrome/i.test(ua)) return "Chrome";
  return "the web";
}

