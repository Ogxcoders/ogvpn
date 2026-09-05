import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Device, DevicesResponse } from '../api/types';
import { useApi } from '../lib/useApi';
import { relativeTime } from '../lib/format';
import { DataTable, type Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';

export default function Devices() {
  const list = useApi<DevicesResponse>(() => api.get<DevicesResponse>('/devices'), [], {
    watch: ['devices'],
  });
  const { toast } = useToast();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameBusy, setRenameBusy] = useState(false);

  const [pendingRevoke, setPendingRevoke] = useState<Device | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  const startRename = (device: Device) => {
    setRenamingId(device.id);
    setRenameValue(device.name);
    setRenameError(null);
  };

  const saveRename = async (device: Device) => {
    const name = renameValue.trim();
    if (!name) {
      setRenameError('Name is required');
      return;
    }
    if (name.length > 80) {
      setRenameError('Name is too long (max 80 characters)');
      return;
    }
    setRenameBusy(true);
    try {
      await api.patch<{ device: Device }>(`/devices/${device.id}`, { name });
      toast('Device renamed.', 'success');
      setRenamingId(null);
      list.retry();
    } catch (err) {
      setRenameError(err instanceof ApiError ? err.message : 'Rename failed. Please retry.');
    } finally {
      setRenameBusy(false);
    }
  };

  const confirmRevoke = async () => {
    if (!pendingRevoke) return;
    setRevokeBusy(true);
    try {
      await api.del(`/devices/${pendingRevoke.id}`);
      toast('Device revoked — client will disconnect', 'success');
      setPendingRevoke(null);
      list.retry();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : 'Revocation failed. Please retry.',
        'error',
      );
    } finally {
      setRevokeBusy(false);
    }
  };

  if (list.loading && !list.data) return <PageSkeleton />;
  if (list.error && !list.data) {
    return <ErrorState title="Could not load devices" error={list.error} retry={list.retry} />;
  }

  const devices = list.data?.devices ?? [];

  const columns: Column<Device>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (d) =>
        renamingId === d.id ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveRename(d);
            }}
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
          >
            <input
              className="input"
              style={{ maxWidth: 220 }}
              value={renameValue}
              autoFocus
              aria-label="Device name"
              aria-invalid={renameError ? true : undefined}
              onChange={(e) => {
                setRenameValue(e.target.value);
                setRenameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setRenamingId(null);
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={renameBusy}>
              Save
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setRenamingId(null)}
            >
              Cancel
            </button>
            {renameError ? <span className="field-error">{renameError}</span> : null}
          </form>
        ) : (
          <span style={{ fontWeight: 600 }}>{d.name}</span>
        ),
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (d) => <span style={{ textTransform: 'capitalize' }}>{d.platform}</span>,
    },
    {
      key: 'lastActiveAt',
      header: 'Last active',
      hideOn: 'sm',
      render: (d) => relativeTime(d.lastActiveAt),
    },
    {
      key: 'session',
      header: 'Session',
      hideOn: 'sm',
      render: (d) =>
        d.session ? (
          <StatusBadge status={d.session.state} />
        ) : (
          <span className="muted small">Disconnected</span>
        ),
    },
    {
      key: 'actions',
      header: <span style={{ float: 'right' }}>Actions</span>,
      render: (d) => (
        <div className="actions-cell">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => startRename(d)}
            disabled={renamingId === d.id}
            aria-label={`Rename ${d.name}`}
          >
            Rename
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setPendingRevoke(d)}
            aria-label={`Revoke ${d.name}`}
          >
            Revoke
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Devices</h1>
          <p>
            {devices.length} registered device{devices.length === 1 ? '' : 's'}. Revoking a device
            disconnects it immediately and removes its VPN peer.
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={list.retry}>
          Refresh
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={devices}
        rowKey={(d) => d.id}
        caption="Your registered devices"
        empty={
          <EmptyState
            title="No devices"
            hint="Sign in from an Android, desktop client or this browser to register your first device."
          />
        }
      />

      <ConfirmDialog
        open={pendingRevoke !== null}
        title={`Revoke "${pendingRevoke?.name ?? ''}"?`}
        body="The device will be disconnected immediately, its VPN peer removed and its sessions closed. This cannot be undone."
        confirmLabel="Revoke device"
        danger
        busy={revokeBusy}
        onConfirm={() => void confirmRevoke()}
        onCancel={() => setPendingRevoke(null)}
      />
    </div>
  );
}
