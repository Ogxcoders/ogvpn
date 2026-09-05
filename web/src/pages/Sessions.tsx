import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Session, SessionsResponse } from '../api/types';
import { useApi } from '../lib/useApi';
import { formatBytes, relativeTime } from '../lib/format';
import { DataTable, type Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';

export default function Sessions() {
  const list = useApi<SessionsResponse>(() => api.get<SessionsResponse>('/sessions'), [], {
    watch: ['sessions'],
  });
  const { toast } = useToast();

  const [pendingDisconnect, setPendingDisconnect] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmDisconnect = async () => {
    if (!pendingDisconnect) return;
    setBusy(true);
    try {
      await api.del(`/sessions/${pendingDisconnect.id}`);
      toast('Session force-disconnected.', 'success');
      setPendingDisconnect(null);
      list.retry();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Force disconnect failed. Please retry.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (list.loading && !list.data) return <PageSkeleton />;
  if (list.error && !list.data) {
    return <ErrorState title="Could not load sessions" error={list.error} retry={list.retry} />;
  }

  const sessions = list.data?.sessions ?? [];
  const byNewest = (a: Session, b: Session) => Date.parse(b.connectedAt) - Date.parse(a.connectedAt);
  const active = sessions
    .filter((s) => s.state === 'connected' || s.state === 'reconnecting')
    .sort(byNewest);
  const history = sessions
    .filter((s) => s.state === 'closed' || s.state === 'failed')
    .sort(byNewest);

  const traffic = (s: Session) => `${formatBytes(s.bytesIn)} in · ${formatBytes(s.bytesOut)} out`;

  const activeColumns: Column<Session>[] = [
    { key: 'deviceName', header: 'Device', render: (s) => <span style={{ fontWeight: 600 }}>{s.deviceName}</span> },
    { key: 'serverName', header: 'Server' },
    { key: 'state', header: 'State', render: (s) => <StatusBadge status={s.state} /> },
    {
      key: 'connectedAt',
      header: 'Connected',
      hideOn: 'sm',
      render: (s) => relativeTime(s.connectedAt),
    },
    { key: 'traffic', header: 'Traffic', hideOn: 'md', render: traffic },
    {
      key: 'actions',
      header: <span style={{ float: 'right' }}>Actions</span>,
      render: (s) => (
        <div className="actions-cell">
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setPendingDisconnect(s)}
            aria-label={`Force disconnect session for ${s.deviceName}`}
          >
            Force disconnect
          </button>
        </div>
      ),
    },
  ];

  const historyColumns: Column<Session>[] = [
    { key: 'deviceName', header: 'Device', render: (s) => <span style={{ fontWeight: 600 }}>{s.deviceName}</span> },
    { key: 'serverName', header: 'Server' },
    { key: 'state', header: 'State', render: (s) => <StatusBadge status={s.state} /> },
    {
      key: 'connectedAt',
      header: 'Started',
      hideOn: 'sm',
      render: (s) => relativeTime(s.connectedAt),
    },
    {
      key: 'closedAt',
      header: 'Ended',
      hideOn: 'sm',
      render: (s) => (s.closedAt ? relativeTime(s.closedAt) : '—'),
    },
    { key: 'traffic', header: 'Traffic', hideOn: 'md', render: traffic },
  ];

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Sessions</h1>
          <p>Active VPN tunnels and connection history for your account.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={list.retry}>
          Refresh
        </button>
      </div>

      <section aria-labelledby="active-sessions-heading" className="stack">
        <h2 id="active-sessions-heading" style={{ margin: 0 }}>
          Active ({active.length})
        </h2>
        <DataTable
          columns={activeColumns}
          rows={active}
          rowKey={(s) => s.id}
          caption="Active VPN sessions"
          empty={
            <EmptyState
              title="No active sessions"
              hint="Connect from any device with the AegisVPN client to see it here."
              icon="shield"
            />
          }
        />
      </section>

      <section aria-labelledby="session-history-heading" className="stack">
        <h2 id="session-history-heading" style={{ margin: 0 }}>
          History ({history.length})
        </h2>
        <DataTable
          columns={historyColumns}
          rows={history}
          rowKey={(s) => s.id}
          caption="Past VPN sessions"
          empty={<EmptyState title="No history yet" hint="Closed sessions will appear here." />}
        />
      </section>

      <ConfirmDialog
        open={pendingDisconnect !== null}
        title="Force disconnect this session?"
        body={
          <>
            The tunnel for <strong>{pendingDisconnect?.deviceName}</strong> on{' '}
            <strong>{pendingDisconnect?.serverName}</strong> will be torn down and the peer removed
            from the server. The client can reconnect afterwards.
          </>
        }
        confirmLabel="Force disconnect"
        danger
        busy={busy}
        onConfirm={() => void confirmDisconnect()}
        onCancel={() => setPendingDisconnect(null)}
      />
    </div>
  );
}
