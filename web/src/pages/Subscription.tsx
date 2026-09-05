import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Plan, PlansResponse, SubscriptionResponse } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/useApi';
import { formatDateTime, formatPrice } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorState } from '../components/ErrorState';
import { PageSkeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';
import { Icon } from '../components/Icon';

export default function Subscription() {
  const { refreshMe } = useAuth();
  const { toast } = useToast();

  const sub = useApi<SubscriptionResponse>(() => api.get<SubscriptionResponse>('/subscription'), [], {
    watch: ['subscription'],
  });
  const plans = useApi<PlansResponse>(() => api.get<PlansResponse>('/subscription/plans'), []);

  const [banner, setBanner] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<Plan['code'] | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  const subscription = sub.data?.subscription;
  const planList = plans.data?.plans ?? [];

  const checkout = async (planCode: Plan['code']) => {
    setBanner(null);
    setCheckoutBusy(planCode);
    try {
      await api.post<SubscriptionResponse>('/subscription/checkout', { planCode });
      setBanner(
        'Simulated payment (demo mode) — no card was charged. Your plan is now active.',
      );
      toast(`Plan switched to ${planCode}.`, 'success');
      await Promise.all([sub.retry(), refreshMe()]);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Checkout failed. Please retry.', 'error');
    } finally {
      setCheckoutBusy(null);
    }
  };

  const cancel = async () => {
    setCancelBusy(true);
    try {
      await api.post<SubscriptionResponse>('/subscription/cancel');
      toast('Subscription canceled — active until the end of the billing period.', 'warn');
      setCancelOpen(false);
      await Promise.all([sub.retry(), refreshMe()]);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Cancel failed. Please retry.', 'error');
    } finally {
      setCancelBusy(false);
    }
  };

  if (sub.loading && !sub.data) return <PageSkeleton />;
  if (sub.error && !sub.data) {
    return <ErrorState title="Could not load your subscription" error={sub.error} retry={sub.retry} />;
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Subscription</h1>
          <p>Manage your plan and billing.</p>
        </div>
      </div>

      {banner ? (
        <div className="banner banner-warn" role="status">
          {banner}
        </div>
      ) : null}

      <div className="card">
        <div className="card-title">Current plan</div>
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="stat-value" style={{ textTransform: 'capitalize' }}>
            {subscription?.plan ?? 'free'}
          </span>
          <StatusBadge status={subscription?.status ?? 'active'} />
        </div>
        <p className="small muted">
          {subscription?.currentPeriodEnd
            ? subscription.status === 'canceled'
              ? `Active until ${formatDateTime(subscription.currentPeriodEnd)}`
              : `Renews on ${formatDateTime(subscription.currentPeriodEnd)}`
            : 'No billing period — free plan.'}
        </p>
        {subscription?.maxDevices ? (
          <p className="small muted">Device limit: {subscription.maxDevices}</p>
        ) : null}
        {subscription?.plan === 'premium' && subscription?.status === 'active' ? (
          <button type="button" className="btn btn-danger" onClick={() => setCancelOpen(true)}>
            Cancel subscription
          </button>
        ) : null}
      </div>

      {plans.loading && !plans.data ? (
        <PageSkeleton />
      ) : plans.error && !plans.data ? (
        <ErrorState title="Could not load plans" error={plans.error} retry={plans.retry} />
      ) : (
        <div className="grid-2">
          {planList.map((p) => {
            const isCurrent = subscription?.plan === p.code;
            return (
              <div
                key={p.code}
                className="card"
                style={isCurrent ? { borderColor: 'var(--primary)' } : undefined}
              >
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <h2 style={{ margin: 0 }}>{p.name}</h2>
                  {isCurrent ? <span className="badge badge-primary">Current</span> : null}
                </div>
                <p style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 12px' }}>
                  {formatPrice(p.priceCents)}
                  <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>
                    {' '}
                    / {p.interval}
                  </span>
                </p>
                <ul style={{ margin: '0 0 16px', paddingLeft: 4, listStyle: 'none' }} className="stack">
                  {p.features.map((f) => (
                    <li key={f} className="row small" style={{ flexWrap: 'nowrap' }}>
                      <span style={{ color: 'var(--success)', display: 'inline-flex' }}>
                        <Icon name="check" size={15} />
                      </span>
                      {f}
                    </li>
                  ))}
                  <li className="row small" style={{ flexWrap: 'nowrap' }}>
                    <span style={{ color: 'var(--success)', display: 'inline-flex' }}>
                      <Icon name="check" size={15} />
                    </span>
                    Up to {p.maxDevices} devices
                  </li>
                </ul>
                <button
                  type="button"
                  className={`btn ${isCurrent ? 'btn-ghost' : 'btn-primary'}`}
                  disabled={isCurrent || checkoutBusy !== null}
                  onClick={() => void checkout(p.code)}
                >
                  {checkoutBusy === p.code
                    ? 'Processing…'
                    : isCurrent
                      ? 'Current plan'
                      : p.code === 'free'
                        ? 'Downgrade to Free'
                        : `Switch to ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="small muted">
        Payments in this build run in demo mode: checkout activates the plan instantly and is
        labeled as a simulated payment. No payment provider is contacted.
      </p>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel your subscription?"
        body="Your plan stays active until the end of the current billing period. After that you are moved to the Free plan (2 devices)."
        confirmLabel="Cancel subscription"
        danger
        busy={cancelBusy}
        onConfirm={() => void cancel()}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
