"use client";

// Shared product UI atoms: brand, flags, state indicators, loading/empty/error
// states (Section R), accessible status messaging.
import { Loader2, AlertTriangle, ShieldCheck, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span
        className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <ShieldCheck style={{ width: size * 0.62, height: size * 0.62 }} strokeWidth={2.4} />
      </span>
      {withWordmark && (
        <span className="whitespace-nowrap font-bold tracking-tight text-foreground" style={{ fontSize: size * 0.62 }}>
          Aegis<span className="text-primary">VPN</span>
        </span>
      )}
    </span>
  );
}

const FLAGS: Record<string, string> = {
  US: "🇺🇸", CA: "🇨🇦", GB: "🇬🇧", DE: "🇩🇪", NL: "🇳🇱", FR: "🇫🇷", SE: "🇸🇪", CH: "🇨🇭",
  ES: "🇪🇸", IT: "🇮🇹", PL: "🇵🇱", JP: "🇯🇵", SG: "🇸🇬", HK: "🇭🇰", IN: "🇮🇳", AU: "🇦🇺",
  NZ: "🇳🇿", BR: "🇧🇷", AR: "🇦🇷", MX: "🇲🇽", ZA: "🇿🇦", AE: "🇦🇪", KR: "🇰🇷",
};

export function Flag({ code, className }: { code?: string; className?: string }) {
  const flag = code ? FLAGS[code.toUpperCase()] : undefined;
  if (!flag) return <span className={cn("inline-block", className)} aria-hidden="true">🌐</span>;
  return (
    <span className={cn("inline-block leading-none", className)} role="img" aria-label={code}>
      {flag}
    </span>
  );
}

export function LoadPill({ load }: { load: number }) {
  const tone = load < 40 ? "text-primary" : load < 70 ? "text-warning" : "text-destructive";
  return <span className={cn("font-mono text-xs", tone)}>{load}%</span>;
}

export function StateDot({ state, className }: { state: "ok" | "warn" | "bad" | "idle"; className?: string }) {
  const map = {
    ok: "bg-primary", warn: "bg-warning", bad: "bg-destructive", idle: "bg-muted-foreground",
  } as const;
  return (
    <span
      className={cn("inline-block size-2 rounded-full", map[state], state === "ok" && "pulse-ring", className)}
      aria-hidden="true"
    />
  );
}

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-8 text-muted-foreground", className)} role="status" aria-live="polite">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label || "Loading…"}</span>
    </div>
  );
}

export function ErrorState({ title, message, onRetry, retryLabel }: {
  title?: string; message: string; onRetry?: () => void; retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center" role="alert">
      <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-medium">{title || "Something went wrong"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw className="size-3.5" aria-hidden="true" /> {retryLabel || "Retry"}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: {
  icon?: React.ReactNode; title: string; message: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
      {icon && <div className="text-muted-foreground" aria-hidden="true">{icon}</div>}
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-warning/15 px-4 py-1.5 text-sm text-warning backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      You&apos;re offline — showing cached state. Actions will resume automatically.
    </div>
  );
}

export function StatCard({ label, value, sub, icon, tone }: {
  label: string; value: React.ReactNode; sub?: string; icon?: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneCls = {
    default: "text-foreground",
    good: "text-primary",
    warn: "text-warning",
    bad: "text-destructive",
  }[tone ?? "default"];
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground" aria-hidden="true">{icon}</span>}
      </div>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", toneCls)}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    free: "bg-secondary text-secondary-foreground",
    pro: "bg-primary/15 text-primary border border-primary/30",
    business: "bg-warning/15 text-warning border border-warning/30",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", map[plan] || map.free)}>
      {plan}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, "ok" | "warn" | "bad" | "idle"> = {
    active: "ok", online: "ok", healthy: "ok", paid: "ok", solved: "ok", operational: "ok", resolved: "ok",
    maintenance: "warn", draining: "warn", grace: "warn", past_due: "warn", pending: "warn", degraded: "warn", monitoring: "warn",
    suspended: "bad", revoked: "bad", failed: "bad", critical: "bad", investigating: "bad",
    canceled: "bad", expired: "bad", offline: "bad", open: "warn", deleted: "idle", provisioning: "idle", closed: "idle", trialing: "ok",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <StateDot state={tone[status] ?? "idle"} />
      <span className="capitalize">{status.replace(/_/g, " ")}</span>
    </span>
  );
}

export function KbdHint({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{children}</kbd>;
}
