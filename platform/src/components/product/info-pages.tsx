"use client";

// Info surfaces: live status page, legal documents, docs/knowledge base.
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { Spinner, ErrorState, EmptyState, StatusBadge } from "@/components/product/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { errMsg } from "@/lib/client/api";
import { cn } from "@/lib/utils";

/* ---------------- Status page ---------------- */

interface Incident {
  id: string; title: string; severity: string; status: string; startedAt: string; resolvedAt: string | null;
  components: string[];
  updates: Array<{ status: string; message: string; createdAt: string }>;
}
interface StatusData {
  overall: string;
  components: Array<{ code: string; label: string; total: number; online: number; status: string }>;
  incidents: Incident[];
  maintenance: Array<{ serverCode: string; region: string; until: string | null }>;
  uptime30d: number;
  generatedAt: string;
}

export function StatusView() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api<StatusData>("/api/incidents", { dedupe: true })
      .then((d) => { setError(null); setData(d); })
      .catch((e) => setError(errMsg(e)));
  };
  useEffect(load, []);

  const overallLabel: Record<string, [string, string]> = {
    operational: ["All systems operational", "text-primary"],
    minor_degradation: ["Minor degradation", "text-warning"],
    partial_degradation: ["Partial degradation", "text-warning"],
    major_outage: ["Major outage", "text-destructive"],
  };
  const [label, cls] = overallLabel[data?.overall ?? "operational"] ?? ["Loading", ""];

  return (
    <section className="mx-auto max-w-4xl px-4 py-14" aria-labelledby="status-title">
      <h1 id="status-title" className="text-3xl font-bold">System status</h1>
      <div className="mt-6 flex items-center gap-3 rounded-xl border bg-card p-5" role="status" aria-live="polite">
        <span className={cn("size-3 rounded-full", data?.overall === "operational" ? "bg-primary pulse-ring" : data?.overall === "major_outage" ? "bg-destructive" : "bg-warning")} aria-hidden="true" />
        <div>
          <p className={cn("text-lg font-semibold", cls)}>{label}</p>
          <p className="text-xs text-muted-foreground">
            30-day uptime {data ? `${data.uptime30d}%` : "—"} · refreshed {data ? new Date(data.generatedAt).toLocaleTimeString() : "…"}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={load}>Refresh</Button>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Regions</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {(data?.components ?? []).map((c) => (
          <div key={c.code} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div>
              <p className="text-sm font-medium">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.online}/{c.total} gateways online</p>
            </div>
            <StatusBadge status={c.status} />
          </div>
        ))}
        {!data && !error && <Spinner />}
        {error && <ErrorState message={error} onRetry={load} />}
      </div>

      {data && data.maintenance.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Scheduled maintenance</h2>
          <ul className="mt-3 space-y-2">
            {data.maintenance.map((m) => (
              <li key={m.serverCode} className="rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm">
                <strong>{m.region}</strong> — {m.serverCode} under maintenance{m.until ? ` until ${new Date(m.until).toLocaleTimeString()}` : ""}.
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Incident history</h2>
      <div className="mt-3 space-y-3">
        {data?.incidents.length === 0 && <EmptyState title="No incidents" message="No incidents were recorded in the last 30 days." />}
        {data?.incidents.map((i) => (
          <article key={i.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{i.title}</p>
              <Badge variant="outline" className={i.severity === "critical" ? "border-destructive/40 text-destructive" : i.severity === "major" ? "border-warning/40 text-warning" : ""}>{i.severity}</Badge>
              <StatusBadge status={i.status} />
              <span className="ml-auto text-xs text-muted-foreground">{new Date(i.startedAt).toLocaleString()}</span>
            </div>
            <ol className="mt-3 space-y-2 border-l-2 pl-4">
              {i.updates.map((u, idx) => (
                <li key={idx} className="text-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{u.status} · {new Date(u.createdAt).toLocaleTimeString()}</p>
                  <p className="text-muted-foreground">{u.message}</p>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Legal ---------------- */

const LEGAL_DOCS: Record<string, { title: string; updated: string; sections: Array<[string, string]> }> = {
  privacy: {
    title: "Privacy Policy", updated: "2026-08-30",
    sections: [
      ["What we collect", "Account email, chosen display name, billing records from our payment provider, aggregate connection counters (bytes and duration per session, for abuse prevention), and security events (sign-in attempts, device registrations). We collect the minimum needed to operate the service."],
      ["What we never collect", "Browsing history, traffic destinations, DNS queries, payload content, or the IP addresses you visit. Our gateways run in a stateless mode: connection metadata is kept in volatile memory only and is not written to disk."],
      ["Legal bases", "Contract performance for account and connection data; legitimate interest for fraud and abuse prevention; consent for optional telemetry, revocable anytime under Settings → Privacy."],
      ["Your rights", "Export your entire account data as JSON from Settings → Privacy, request deletion with a 30-day restoration window, and withdraw telemetry consent instantly. GDPR and CCPA requests are honored through privacy@aegisvpn.io."],
      ["Retention", "Deleted accounts are purged within 30 days. Invoices are retained for 7 years where tax law requires. Analytics events are sampled and retained for 90 days."],
    ],
  },
  terms: {
    title: "Terms of Service", updated: "2026-08-30",
    sections: [
      ["The service", "AegisVPN provides encrypted network transport through client applications and gateway servers. We target 99.9% API availability and 99.5% connection success; the live status page is the source of truth."],
      ["Your account", "You are responsible for activity under your account, keeping credentials confidential, and enabling MFA where available. One human or business entity per account; device limits apply per plan."],
      ["Fair use", "The free plan includes 10 GB/month. Automated scraping of the service, reselling access without agreement, or circumventing plan limits is prohibited."],
      ["Changes", "We may modify features with 30 days notice for material changes affecting paid plans. Price changes apply only to future periods; your current cycle is protected."],
      ["Termination", "You may cancel at any time; service remains active until period end. We may suspend accounts for abuse per the Acceptable Use policy, with an appeal path."],
    ],
  },
  aup: {
    title: "Acceptable Use Policy", updated: "2026-08-30",
    sections: [
      ["Prohibited activity", "Unlawful content distribution, network attacks, spam, credential stuffing, child sexual abuse material, and any activity restricting others' lawful access to the network."],
      ["Enforcement", "Suspicious activity triggers automated rate limiting; confirmed abuse results in account suspension. Appeals are reviewed by a human within 5 business days."],
      ["Reporting", "Report abuse to abuse@aegisvpn.io with evidence. We acknowledge reports within 48 hours."],
    ],
  },
  logging: {
    title: "Zero-Traffic-Log Policy", updated: "2026-08-30",
    sections: [
      ["Gateway design", "Gateways run diskless-capable images: no traffic logs, no DNS logs, no destination records. Volatile counters (active sessions, bytes) exist only for capacity management and vanish on restart."],
      ["Audit scope", "The control plane (account systems) logs security events with PII minimization: emails are stored, IPs are stored for 90 days for abuse defense, and are never joined with gateway traffic."],
      ["Verification", "The logging policy is covered by the annual independent audit; the latest attestation summary is available to customers on request."],
    ],
  },
  refund: {
    title: "Refund Policy", updated: "2026-08-30",
    sections: [
      ["30-day guarantee", "First-time subscriptions are refundable in full within 30 days of purchase, no questions asked. Open a billing ticket from the dashboard."],
      ["Proration", "Voluntary downgrades apply at period end; upgrades apply immediately with prorated credit for unused time."],
      ["Exceptions", "Refunds are unavailable where abuse of the guarantee is detected (repeat purchases/cancellations) or where required by payment-network rules."],
    ],
  },
};

export function LegalView({ doc }: { doc: string }) {
  const { navigate } = useApp();
  const d = LEGAL_DOCS[doc] || LEGAL_DOCS.privacy;
  const tabs = Object.entries(LEGAL_DOCS).map(([k, v]) => [k, v.title] as const);
  return (
    <section className="mx-auto max-w-4xl px-4 py-14" aria-labelledby="legal-title">
      <h1 id="legal-title" className="text-3xl font-bold">{d.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated {d.updated}</p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Legal documents">
        {tabs.map(([k, t]) => (
          <Button key={k} size="sm" variant={k === doc ? "default" : "outline"} onClick={() => navigate({ view: "legal", doc: k })}>
            {t.replace(" Policy", "")}
          </Button>
        ))}
      </nav>
      <div className="mt-8 space-y-6">
        {d.sections.map(([h, body]) => (
          <div key={h}>
            <h2 className="text-lg font-semibold">{h}</h2>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Docs / KB ---------------- */

interface Article { slug: string; title: string; category: string; body: string }
const CATEGORY_LABELS: Record<string, string> = {
  "getting-started": "Getting started", connection: "Connection", security: "Security",
  billing: "Billing", privacy: "Privacy", platform: "Platforms",
};

export function DocsView({ slug }: { slug?: string }) {
  const { navigate } = useApp();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [current, setCurrent] = useState<Article | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ articles: Article[] }>("/api/kb", { dedupe: true })
      .then((d) => { setError(null); setArticles(d.articles); })
      .catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(() => {
    if (!slug || !articles) return;
    let cancelled = false; // stale-response protection
    api<{ article: Article }>(`/api/kb/${slug}`, { dedupe: true })
      .then((d) => { if (!cancelled) setCurrent(d.article); })
      .catch(() => { if (!cancelled) setCurrent(null); });
    return () => { cancelled = true; };
  }, [slug, articles]);

  const filtered = (articles ?? []).filter((a) =>
    q ? a.title.toLowerCase().includes(q.toLowerCase()) || a.body.toLowerCase().includes(q.toLowerCase()) : true
  );

  if (slug && current) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-14" aria-labelledby="doc-title">
        <Button variant="ghost" size="sm" onClick={() => navigate({ view: "docs" })} className="mb-4 gap-1.5">
          <ArrowLeft className="size-4" aria-hidden="true" /> All articles
        </Button>
        <h1 id="doc-title" className="text-2xl font-bold">{current.title}</h1>
        <Badge variant="outline" className="mt-2">{CATEGORY_LABELS[current.category] || current.category}</Badge>
        <div className="mt-6 space-y-3 leading-relaxed text-muted-foreground">
          {current.body.split("\n").map((para, i) => (
            <p key={i} className={para.startsWith("-") || /^\d\./.test(para) ? "pl-4" : ""}>{para}</p>
          ))}
        </div>
      </section>
    );
  }

  const grouped = new Map<string, Article[]>();
  for (const a of filtered) {
    const list = grouped.get(a.category) || [];
    list.push(a);
    grouped.set(a.category, list);
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-14" aria-labelledby="docs-title">
      <h1 id="docs-title" className="text-3xl font-bold">Documentation & knowledge base</h1>
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search articles… (e.g. kill switch, refund, split tunneling)"
          className="pl-9" aria-label="Search knowledge base"
        />
      </div>
      {error && <ErrorState message={error} />}
      {!articles && !error && <Spinner label="Loading documentation…" />}
      {articles && filtered.length === 0 && (
        <EmptyState title="No matching articles" message={`Nothing matched "${q}". Try different keywords.`} />
      )}
      <div className="mt-8 space-y-8">
        {[...grouped.entries()].map(([cat, list]) => (
          <div key={cat}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORY_LABELS[cat] || cat}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {list.map((a) => (
                <button
                  key={a.slug}
                  onClick={() => navigate({ view: "docs", slug: a.slug })}
                  className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/30"
                >
                  <p className="font-medium">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.body.split("\n")[0]}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
