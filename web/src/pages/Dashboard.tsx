import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DevicesResponse, NotificationsResponse, SessionsResponse } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/useApi';
import { relativeTime } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { PageSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';

export default function Dashboard() {
  const { user, subscription, device } = useAuth();

  const devices = useApi<DevicesResponse>(() => api.get<DevicesResponse>('/devices'), [], {
    watch: ['devices'],
  });
  const sessions = useApi<SessionsResponse>(() => api.get<SessionsResponse>('/sessions'), [], {
    watch: ['sessions'],
  });
  const notifications = useApi<NotificationsResponse>(
    () => api.get<NotificationsResponse>('/notifications'),
    [],
    { watch: ['notifications'] },
  );

  if ((devices.loading && !devices.data) || (sessions.loading && !sessions.data)) {
    return <PageSkeleton />;
  }

  if (devices.error && !devices.data) {
    return <ErrorState title="Could not load your dashboard" error={devices.error} retry={devices.retry} />;
  }
  if (sessions.error && !sessions.data) {
    return <ErrorState title="Could not load your dashboard" error={sessions.error} retry={sessions.retry} />;
  }

  const deviceList = devices.data?.devices ?? [];
  const sessionList = sessions.data?.sessions ?? [];
  const activeSessions = sessionList.filter((s) => s.state === 'connected' || s.state === 'reconnecting');
  const recentNotifications = (notifications.data?.notifications ?? []).slice(0, 5);
  const subPlan = subscription?.plan ?? 'free';

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0] ?? 'there'}</h1>
          <p>
            {user?.email} · <StatusBadge status={user?.role ?? 'user'} />
          </p>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-title">Subscription</div>
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="stat-value" style={{ textTransform: 'capitalize' }}>
              {subPlan}
            </span>
            <StatusBadge status={subscription?.status ?? 'active'} />
          </div>
          {subscription?.currentPeriodEnd ? (
            <p className="small muted">
              {subscription.status === 'canceled' ? 'Active until' : 'Renews'}{' '}
              {relativeTime(subscription.currentPeriodEnd)}
            </p>
          ) : (
            <p className="small muted">No billing period (free plan)</p>
          )}
          {subscription?.maxDevices ? (
            <p className="small muted">Up to {subscription.maxDevices} devices</p>
          ) : null}
          <Link className="btn btn-ghost btn-sm" to="/subscription" style={{ marginTop: 8 }}>
            Manage subscription
          </Link>
        </div>

        <div className="card">
          <div className="card-title">Quick stats</div>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div className="stat-value">{deviceList.length}</div>
              <div className="stat-label">Registered devices</div>
            </div>
            <div>
              <div className="stat-value">{activeSessions.length}</div>
              <div className="stat-label">Active VPN sessions</div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn btn-ghost btn-sm" to="/devices">
              Devices
            </Link>
            <Link className="btn btn-ghost btn-sm" to="/servers">
              Servers
            </Link>
            <Link className="btn btn-ghost btn-sm" to="/sessions">
              Sessions
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-title">This device</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{device?.name ?? '—'}</p>
          <p className="small muted" style={{ textTransform: 'capitalize' }}>
            Platform: {device?.platform ?? 'web'}
          </p>
          <p className="small muted">Last active: {relativeTime(device?.lastActiveAt)}</p>
        </div>
      </div>

      <div className="card">
        <div className="row-between">
          <div className="card-title" style={{ marginBottom: 0 }}>
            Recent notifications
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => notifications.retry()}
          >
            Refresh
          </button>
        </div>
        <hr className="divider" />
        {notifications.loading && !notifications.data ? (
          <p className="muted">Loading…</p>
        ) : notifications.error && !notifications.data ? (
          <ErrorState title="Could not load notifications" error={notifications.error} retry={notifications.retry} />
        ) : recentNotifications.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            hint="Revocations, subscription changes and other account events will appear here."
            icon="shield"
          />
        ) : (
          recentNotifications.map((n) => (
            <div key={n.id} className={`notif ${n.read_at ? 'read' : ''}`}>
              <span className="notif-dot" aria-hidden="true" />
              <div>
                <div className="notif-title">{n.title}</div>
                <div className="notif-body">{n.body}</div>
                <div className="notif-time">{relativeTime(n.created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="row">
          <Icon name="shield" size={16} />
          <span className="small muted">
            Live status updates arrive over a secure event stream — no refresh needed.
          </span>
        </div>
      </div>
    </div>
  );
}
