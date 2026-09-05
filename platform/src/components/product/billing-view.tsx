"use client";

// Subscription & billing UI (AD/AE): plan cards, checkout with card form,
// invoices, cancel/resume/downgrade flows with data preservation.
import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError, formatBytes, errMsg } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { Spinner, ErrorState, PlanBadge, StatusBadge } from "@/components/product/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, CreditCard, Download, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Plan { id: string; name: string; priceCents: number; interval: string; tagline: string; features: string[]; deviceLimit: number; bandwidthGb: number | null; splitTunneling: boolean; dedicatedIp: boolean; prioritySupport: boolean }
interface Sub { plan: string; status: string; deviceLimit: number; bandwidthGb: number | null; bytesUsed: number; currentPeriodEnd: string; cancelAtPeriodEnd: boolean; paymentMethod: string | null }
interface Invoice { id: string; number: string; amountCents: number; status: string; description: string; createdAt: string }

export function BillingView() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [sub, setSub] = useState<Sub | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ plan: Plan; cycle: "month" | "year"; amountCents: number } | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [downgradeOpen, setDowngradeOpen] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      api<{ plans: Plan[]; current: Sub }>("/api/billing/plans", { dedupe: true }),
      api<{ invoices: Invoice[] }>("/api/billing/invoices", { dedupe: true }),
    ])
      .then(([a, b]) => { setPlans(a.plans); setSub(a.current); setInvoices(b.invoices); })
      .catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(load, [load]);

  const startCheckout = (plan: Plan) => {
    api<{ checkoutSession: { amountCents: number } }>("/api/billing/checkout", { method: "POST", body: { plan: plan.id, cycle: "month" }, retries: 0 })
      .then((d) => setCheckout({ plan, cycle: "month", amountCents: d.checkoutSession.amountCents }))
      .catch((e) => toast({ title: "Checkout unavailable", description: errMsg(e), variant: "destructive" }));
  };

  const confirmPay = async () => {
    if (!checkout) return;
    setPayBusy(true);
    try {
      await api("/api/billing/confirm", {
        method: "POST",
        body: { plan: checkout.plan.id, cycle: checkout.cycle, cardName, cardNumber },
        retries: 0,
      });
      toast({ title: "Payment successful", description: `${checkout.plan.name} is now active. Receipt emailed.` });
      setCheckout(null);
      setCardNumber(""); setCardName("");
      load();
    } catch (e) {
      const err = e as ApiClientError;
      toast({ title: "Payment failed", description: `${err.message}${err.details && typeof err.details === 'object' && 'declineCode' in err.details ? ` (${(err.details as { declineCode: string }).declineCode})` : ""}`, variant: "destructive" });
    } finally {
      setPayBusy(false);
    }
  };

  const doCancel = async () => {
    try {
      await api("/api/billing/cancel", { method: "POST", body: {}, retries: 0 });
      toast({ title: "Subscription canceled", description: "Active until period end — resume anytime." });
      setCancelOpen(false);
      load();
    } catch (e) {
      toast({ title: "Cancel failed", description: errMsg(e), variant: "destructive" });
    }
  };
  const doResume = async () => {
    try {
      await api("/api/billing/resume", { method: "POST", body: {}, retries: 0 });
      toast({ title: "Subscription resumed" });
      load();
    } catch (e) {
      toast({ title: "Resume failed", description: errMsg(e), variant: "destructive" });
    }
  };
  const doDowngrade = async () => {
    try {
      const d = await api<{ revokedDevices: number }>("/api/billing/downgrade", { method: "POST", body: {}, retries: 0 });
      toast({ title: "Switched to Aegis Free", description: d.revokedDevices ? `${d.revokedDevices} extra device(s) deactivated.` : undefined });
      setDowngradeOpen(false);
      load();
    } catch (e) {
      toast({ title: "Downgrade failed", description: errMsg(e), variant: "destructive" });
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!plans || !sub) return <Spinner label="Loading billing…" />;

  const capGb = sub.bandwidthGb;
  const usedPct = capGb ? Math.min(100, (sub.bytesUsed / (capGb * 1e9)) * 100) : 0;
  const isPaid = sub.plan !== "free";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Subscription & billing</h1>
        <p className="text-sm text-muted-foreground">Manage your plan, payment method, and invoices.</p>
      </div>

      {/* Current plan */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <PlanBadge plan={sub.plan} />
          <StatusBadge status={sub.status} />
          {sub.cancelAtPeriodEnd && <Badge variant="outline" className="border-warning/40 text-warning">cancels at period end</Badge>}
          <span className="ml-auto text-xs text-muted-foreground">
            {isPaid ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : "Free forever"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {sub.deviceLimit} devices · {capGb ? `${capGb} GB/month` : "unlimited data"}
          {sub.paymentMethod ? ` · ${sub.paymentMethod}` : " · no card on file"}
        </p>
        {capGb && (
          <div className="mt-3 max-w-sm">
            <Progress value={usedPct} aria-label={`Data used ${usedPct.toFixed(0)}%`} />
            <p className="mt-1 text-xs text-muted-foreground">{formatBytes(sub.bytesUsed)} of {capGb} GB used this period</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {sub.cancelAtPeriodEnd ? (
            <Button size="sm" onClick={() => void doResume()}>Resume subscription</Button>
          ) : isPaid ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>Cancel subscription</Button>
              <Button size="sm" variant="ghost" onClick={() => setDowngradeOpen(true)}>Downgrade to Free</Button>
            </>
          ) : null}
        </div>
      </div>

      {/* Plans */}
      <section aria-labelledby="plans-title">
        <h2 id="plans-title" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Change plan</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((p) => {
            const current = p.id === sub.plan;
            return (
              <article key={p.id} className={cn("flex flex-col rounded-xl border bg-card p-5", current && "border-primary/60")}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{p.name}</h3>
                  {current && <Badge variant="outline" className="border-primary/40 text-primary">current</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <p className="mt-3 text-2xl font-extrabold">${(p.priceCents / 100).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/{p.interval}</span></p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                  {p.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />{f}</li>
                  ))}
                </ul>
                {!current && p.id !== "free" && (
                  <Button className="mt-4" onClick={() => startCheckout(p)} disabled={!sub}>
                    Upgrade to {p.name.replace("Aegis ", "")}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Invoices */}
      <section aria-labelledby="inv-title">
        <h2 id="inv-title" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Billing history</h2>
        {invoices && invoices.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No invoices yet — they appear after your first payment.</p>
        )}
        {invoices && invoices.length > 0 && (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-mono text-xs">{inv.number}</span>
                <span className="text-muted-foreground">{inv.description}</span>
                <span className="ml-auto flex items-center gap-3">
                  <StatusBadge status={inv.status} />
                  <span className="font-medium">${(inv.amountCents / 100).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</span>
                  <button
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={`Download invoice ${inv.number}`}
                    onClick={() => {
                      const blob = new Blob([`AegisVPN Invoice ${inv.number}\n${inv.description}\nAmount: $${(inv.amountCents / 100).toFixed(2)}\nStatus: ${inv.status}\nDate: ${inv.createdAt}\n`], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = `${inv.number}.txt`; a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="size-4" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Checkout dialog */}
      <Dialog open={Boolean(checkout)} onOpenChange={(v) => !v && setCheckout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout — {checkout?.plan.name}</DialogTitle>
            <DialogDescription>
              Simulated payment provider (Stripe-class flow). Total ${(checkout ? checkout.amountCents / 100 : 0).toFixed(2)}.
              Card 4242 4242 4242 4242 succeeds; any card ending 0002 simulates a decline for testing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-name">Name on card</Label>
              <Input id="card-name" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Ada Lovelace" autoComplete="cc-name" />
            </div>
            <div>
              <Label htmlFor="card-number">Card number</Label>
              <Input id="card-number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" inputMode="numeric" autoComplete="cc-number" />
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline size-3" aria-hidden="true" />
              Upgrades are prorated and applied instantly. Incomplete upgrade progress is preserved.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckout(null)}>Cancel</Button>
            <Button onClick={() => void confirmPay()} disabled={payBusy}>
              {payBusy ? "Processing…" : `Pay $${checkout ? (checkout.amountCents / 100).toFixed(2) : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Premium features stay active until {sub ? new Date(sub.currentPeriodEnd).toLocaleDateString() : ""}.
              After that you&apos;ll move to the Free plan (1 device, 10 GB/month, standard locations). Your settings and devices are preserved for when you return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep subscription</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doCancel()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Downgrade confirm */}
      <AlertDialog open={downgradeOpen} onOpenChange={setDowngradeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Downgrade now?</AlertDialogTitle>
            <AlertDialogDescription>
              Downgrading applies immediately. Devices beyond the Free limit (1) will be deactivated and premium
              locations will lock. Cancel-at-period-end keeps premium features until the date above instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my plan</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doDowngrade()}>Downgrade to Free</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
