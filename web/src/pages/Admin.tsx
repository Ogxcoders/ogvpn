import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type {
  AdminAuditResponse,
  AdminCreateServerResponse,
  AdminServersResponse,
  AdminStatsResponse,
  AdminUser,
  AdminUsersResponse,
  UserRole,
} from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/useApi';
import { formatDateTime, relativeTime } from '../lib/format';
import { DataTable, type Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CopyField } from '../components/CopyField';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';

type AdminTab = 'overview' | 'users' | 'servers' | 'audit';

const PAGE_SIZE_USERS = 20;
const PAGE_SIZE_AUDIT = 25;

function Pagination({
  page,
  limit,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  limit: number;
  total: number | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  const pages = total === null ? null : Math.max(1, Math.ceil(total / limit));
  return (
    <div className="pagination">
      {pages !== null ? (
        <span className="small muted">
          Page {page} of {pages} · {total} total
        </span>
      ) : (
        <span className="small muted">Page {page}</span>
      )}
      <button type="button" className="btn btn-ghost btn-sm" onClick={onPrev} disabled={page <= 1}>
        Previous
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={onNext}
        disabled={pages !== null && page >= pages}
      >
        Next
      </button>
    </div>
  );
}

/* ---------------- Overview ---------------- */

function Overview() {
  const stats = useApi<AdminStatsResponse>(() => api.get<AdminStatsResponse>('/admin/stats'));
  if (stats.loading && !stats.data) return <PageSkeleton />;
  if (stats.error && !stats.data) {
    return <ErrorState title="Could not load stats" error={stats.error} retry={stats.retry} />;
  }
  const s = stats.data!;
  return (
    <div className="stack">
      <div className="grid-3">
        <div className="card">
          <div className="stat-value">{s.users}</div>
          <div className="stat-label">Active users</div>
        </div>
        <div className="card">
          <div className="stat-value">{s.devices}</div>
          <div className="stat-label">Registered devices</div>
        </div>
        <div className="card">
          <div className="stat-value">{s.activeSessions}</div>
          <div className="stat-label">Connected sessions</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Active subscriptions</div>
          {s.subscriptions.length === 0 ? (
            <p className="muted small">No active subscriptions.</p>
          ) : (
            s.subscriptions.map((row) => (
              <div key={row.plan} className="row-between" style={{ padding: '6px 0' }}>
                <span style={{ textTransform: 'capitalize' }}>{row.plan}</span>
                <span className="badge badge-primary">{row.c}</span>
              </div>
            ))
          )}
        </div>
        <div className="card">
          <div className="card-title">Active tunnels by server</div>
          {s.tunnelsByServer.length === 0 ? (
            <p className="muted small">No active tunnels.</p>
          ) : (
            s.tunnelsByServer.map((row) => (
              <div key={row.server_id} className="row-between" style={{ padding: '6px 0' }}>
                <code>{row.server_id.slice(0, 8)}…</code>
                <span className="badge badge-muted">{row.c}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Users ---------------- */

function Users() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pendingDisable, setPendingDisable] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useApi<AdminUsersResponse>(
    () => api.get<AdminUsersResponse>(`/admin/users?page=${page}&limit=${PAGE_SIZE_USERS}`),
    [page],
  );

  const setStatus = async (target: AdminUser, status: 'active' | 'disabled') => {
    setBusy(true);
    try {
      await api.patch<{ user: AdminUser }>(`/admin/users/${target.id}`, { status });
      toast(
        status === 'disabled'
          ? `${target.email} disabled — sessions closed and tokens revoked.`
          : `${target.email} re-enabled.`,
        'success',
      );
      setPendingDisable(null);
      await list.retry();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Update failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const setRole = async (target: AdminUser, role: UserRole) => {
    try {
      await api.patch<{ user: AdminUser }>(`/admin/users/${target.id}`, { role });
      toast(`${target.email} is now ${role === 'admin' ? 'an admin' : 'a regular user'}.`, 'success');
      await list.retry();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Role update failed.', 'error');
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'email',
      header: 'User',
      render: (u) => (
        <div>
          <div style={{ fontWeight: 600 }}>{u.email}</div>
          <div className="small muted">{u.name}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <>
          <label className="sr-only" htmlFor={`role-${u.id}`}>
            Role for {u.email}
          </label>
          <select
            id={`role-${u.id}`}
            className="input"
            value={u.role}
            onChange={(e) => void setRole(u, e.target.value as UserRole)}
            disabled={busy}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </>
      ),
    },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'created_at',
      header: 'Created',
      hideOn: 'sm',
      render: (u) => formatDateTime(u.created_at),
    },
    {
      key: 'actions',
      header: <span style={{ float: 'right' }}>Actions</span>,
      render: (u) => (
        <div className="actions-cell">
          {u.status === 'active' ? (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={busy || u.id === me?.id}
              title={u.id === me?.id ? 'You cannot disable your own account' : undefined}
              onClick={() => setPendingDisable(u)}
            >
              Disable
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => void setStatus(u, 'active')}
            >
              Enable
            </button>
          )}
        </div>
      ),
    },
  ];

  if (list.loading && !list.data) return <PageSkeleton />;
  if (list.error && !list.data) {
    return <ErrorState title="Could not load users" error={list.error} retry={list.retry} />;
  }

  const data = list.data!;
  return (
    <div className="stack">
      <DataTable
        columns={columns}
        rows={data.users}
        rowKey={(u) => u.id}
        caption="All users"
        empty={<EmptyState title="No users found" />}
      />
      <Pagination
        page={data.page}
        limit={data.limit}
        total={data.total}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
      <ConfirmDialog
        open={pendingDisable !== null}
        title={`Disable ${pendingDisable?.email ?? ''}?`}
        body="The user is signed out everywhere immediately: sessions close, tunnels are revoked and all refresh tokens are invalidated."
        confirmLabel="Disable user"
        danger
        busy={busy}
        onConfirm={() => void setStatus(pendingDisable!, 'disabled')}
        onCancel={() => setPendingDisable(null)}
      />
    </div>
  );
}

/* ---------------- Servers ---------------- */

const EMPTY_SERVER_FORM = {
  code: '',
  name: '',
  country: '',
  city: '',
  host: '',
  port: '51820',
  publicKey: '',
  capacity: '250',
  ipv4Prefix: '10.8.0.0/24',
  ipv6Prefix: '::/0',
  dns: '10.8.0.1',
};

const WG_KEY_RE = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/;
const CODE_RE = /^[a-z0-9-]{2,24}$/;
const IPV4_PREFIX_RE = /^\d+\.\d+\.\d+\.0\/24$/;

function Servers() {
  const list = useApi<AdminServersResponse>(() => api.get<AdminServersResponse>('/admin/servers'));
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_SERVER_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<AdminCreateServerResponse | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setServerStatus = async (id: string, code: string, status: string) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/servers/${id}`, { status });
      toast(`${code} set to ${status}.`, 'success');
      await list.retry();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Status update failed.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!CODE_RE.test(form.code)) errors.code = '2–24 chars: a-z, 0-9, dashes';
    if (!form.name.trim()) errors.name = 'Name is required';
    if (form.country.trim().length < 2) errors.country = 'Country is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (form.host.trim().length < 3) errors.host = 'Host is required';
    const port = Number(form.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) errors.port = 'Port must be 1–65535';
    if (!WG_KEY_RE.test(form.publicKey)) errors.publicKey = 'Must be a 44-char base64 WireGuard key';
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 65534) errors.capacity = '1–65534';
    if (!IPV4_PREFIX_RE.test(form.ipv4Prefix)) errors.ipv4Prefix = 'Expected e.g. 10.8.0.0/24';
    if (form.ipv6Prefix.trim().length < 3) errors.ipv6Prefix = 'IPv6 prefix required (e.g. ::/0)';
    if (form.dns.trim().length < 3) errors.dns = 'DNS host required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createServer = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setCreating(true);
    try {
      const res = await api.post<AdminCreateServerResponse>('/admin/servers', {
        code: form.code,
        name: form.name,
        country: form.country,
        city: form.city,
        host: form.host,
        port: Number(form.port),
        publicKey: form.publicKey,
        capacity: Number(form.capacity),
        ipv4Prefix: form.ipv4Prefix,
        ipv6Prefix: form.ipv6Prefix,
        dns: form.dns,
      });
      setCreated(res);
      setShowForm(false);
      setForm(EMPTY_SERVER_FORM);
      await list.retry();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Server creation failed.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<AdminServersResponse['servers'][number]>[] = [
    {
      key: 'name',
      header: 'Server',
      render: (s) => (
        <div>
          <div style={{ fontWeight: 600 }}>{s.name}</div>
          <div className="small muted mono">
            {s.code} · {s.city}, {s.country}
          </div>
        </div>
      ),
    },
    {
      key: 'host',
      header: 'Endpoint',
      hideOn: 'sm',
      render: (s) => (
        <span className="mono small">
          {s.host}:{s.port}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'capacity',
      header: 'Capacity',
      hideOn: 'sm',
      render: (s) => `${s.capacity} peers`,
    },
    {
      key: 'last_heartbeat_at',
      header: 'Heartbeat',
      hideOn: 'md',
      render: (s) => relativeTime(s.last_heartbeat_at),
    },
    {
      key: 'actions',
      header: <span style={{ float: 'right' }}>Set status</span>,
      render: (s) => (
        <div className="actions-cell">
          <label className="sr-only" htmlFor={`srv-status-${s.id}`}>
            Status for {s.code}
          </label>
          <select
            id={`srv-status-${s.id}`}
            className="input"
            value={s.status}
            disabled={busyId === s.id}
            onChange={(e) => void setServerStatus(s.id, s.code, e.target.value)}
          >
            <option value="active">active</option>
            <option value="maintenance">maintenance</option>
            <option value="drain">drain</option>
            <option value="offline">offline</option>
            <option value="retired">retired</option>
          </select>
        </div>
      ),
    },
  ];

  if (list.loading && !list.data) return <PageSkeleton />;
  if (list.error && !list.data) {
    return <ErrorState title="Could not load servers" error={list.error} retry={list.retry} />;
  }

  return (
    <div className="stack">
      {created ? (
        <div className="card" role="alert">
          <h2>Server "{created.server.name}" created</h2>
          <p className="banner banner-warn">
            Store the agent token now — <strong>it is shown only once</strong> and cannot be
            retrieved again. It authenticates the VPN server agent against the control plane.
          </p>
          <CopyField label="Agent token" value={created.agentToken} describedBy="agent-token-once" />
          <span id="agent-token-once" className="field-error small">
            Shown once. Copy it before leaving this page.
          </span>
          <div style={{ marginTop: 14 }}>
            <button type="button" className="btn btn-primary" onClick={() => setCreated(null)}>
              Done
            </button>
          </div>
        </div>
      ) : null}

      <div className="row-between">
        <h2 style={{ margin: 0 }}>Servers ({list.data?.servers.length ?? 0})</h2>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Close form' : 'Add server'}
        </button>
      </div>

      {showForm ? (
        <form className="card" onSubmit={(e) => void createServer(e)} noValidate aria-label="Create server">
          <h2>Create server</h2>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="srv-code">Code</label>
              <input
                id="srv-code"
                className="input"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                aria-invalid={formErrors.code ? true : undefined}
                placeholder="fra-01"
              />
              {formErrors.code ? <span className="field-error">{formErrors.code}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="srv-name">Name</label>
              <input
                id="srv-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                aria-invalid={formErrors.name ? true : undefined}
                placeholder="Frankfurt 1"
              />
              {formErrors.name ? <span className="field-error">{formErrors.name}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="srv-country">Country</label>
              <input
                id="srv-country"
                className="input"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                aria-invalid={formErrors.country ? true : undefined}
                placeholder="Germany"
              />
              {formErrors.country ? <span className="field-error">{formErrors.country}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="srv-city">City</label>
              <input
                id="srv-city"
                className="input"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                aria-invalid={formErrors.city ? true : undefined}
                placeholder="Frankfurt"
              />
              {formErrors.city ? <span className="field-error">{formErrors.city}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="srv-host">Host</label>
              <input
                id="srv-host"
                className="input"
                value={form.host}
                onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
                aria-invalid={formErrors.host ? true : undefined}
                placeholder="fra-01.example.net"
              />
              {formErrors.host ? <span className="field-error">{formErrors.host}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="srv-port">Port</label>
              <input
                id="srv-port"
                className="input"
                type="number"
                value={form.port}
                onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                aria-invalid={formErrors.port ? true : undefined}
              />
              {formErrors.port ? <span className="field-error">{formErrors.port}</span> : null}
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="srv-key">WireGuard public key</label>
              <input
                id="srv-key"
                className="input"
                value={form.publicKey}
                onChange={(e) => setForm((f) => ({ ...f, publicKey: e.target.value }))}
                aria-invalid={formErrors.publicKey ? true : undefined}
                placeholder="44-character base64 key ending with ="
              />
              {formErrors.publicKey ? <span className="field-error">{formErrors.publicKey}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="srv-capacity">Capacity</label>
              <input
                id="srv-capacity"
                className="input"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                aria-invalid={formErrors.capacity ? true : undefined}
              />
              {formErrors.capacity ? <span className="field-error">{formErrors.capacity}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="srv-ipv4">IPv4 prefix</label>
              <input
                id="srv-ipv4"
                className="input"
                value={form.ipv4Prefix}
                onChange={(e) => setForm((f) => ({ ...f, ipv4Prefix: e.target.value }))}
                aria-invalid={formErrors.ipv4Prefix ? true : undefined}
              />
              {formErrors.ipv4Prefix ? <span className="field-error">{formErrors.ipv4Prefix}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="srv-ipv6">IPv6 prefix</label>
              <input
                id="srv-ipv6"
                className="input"
                value={form.ipv6Prefix}
                onChange={(e) => setForm((f) => ({ ...f, ipv6Prefix: e.target.value }))}
                aria-invalid={formErrors.ipv6Prefix ? true : undefined}
              />
              {formErrors.ipv6Prefix ? <span className="field-error">{formErrors.ipv6Prefix}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="srv-dns">DNS</label>
              <input
                id="srv-dns"
                className="input"
                value={form.dns}
                onChange={(e) => setForm((f) => ({ ...f, dns: e.target.value }))}
                aria-invalid={formErrors.dns ? true : undefined}
              />
              {formErrors.dns ? <span className="field-error">{formErrors.dns}</span> : null}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create server'}
          </button>
        </form>
      ) : null}

      <DataTable
        columns={columns}
        rows={list.data?.servers ?? []}
        rowKey={(s) => s.id}
        caption="All servers including retired"
        empty={<EmptyState title="No servers registered" hint="Add your first VPN server." />}
      />
    </div>
  );
}

/* ---------------- Audit ---------------- */

function Audit() {
  const [page, setPage] = useState(1);
  const list = useApi<AdminAuditResponse>(
    () => api.get<AdminAuditResponse>(`/admin/audit?page=${page}&limit=${PAGE_SIZE_AUDIT}`),
    [page],
  );

  const columns: Column<AdminAuditResponse['entries'][number]>[] = [
    { key: 'action', header: 'Action', render: (e) => <code>{e.action}</code> },
    {
      key: 'actor_user_id',
      header: 'Actor',
      hideOn: 'sm',
      render: (e) => (e.actor_user_id ? <code className="small">{e.actor_user_id.slice(0, 8)}…</code> : 'system'),
    },
    {
      key: 'target',
      header: 'Target',
      hideOn: 'md',
      render: (e) =>
        e.target_type ? (
          <span className="small">
            {e.target_type} <code className="small">{e.target_id?.slice(0, 8)}…</code>
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'created_at',
      header: 'When',
      render: (e) => relativeTime(e.created_at),
    },
  ];

  if (list.loading && !list.data) return <PageSkeleton />;
  if (list.error && !list.data) {
    return <ErrorState title="Could not load the audit log" error={list.error} retry={list.retry} />;
  }

  const data = list.data!;
  return (
    <div className="stack">
      <DataTable
        columns={columns}
        rows={data.entries}
        rowKey={(e) => e.id}
        caption="Audit log"
        empty={<EmptyState title="Audit log is empty" icon="shield" />}
      />
      <Pagination
        page={data.page}
        limit={data.limit}
        total={null}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );
}

/* ---------------- Page shell ---------------- */

export default function Admin() {
  const [tab, setTab] = useState<AdminTab>('overview');

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'servers', label: 'Servers' },
    { id: 'audit', label: 'Audit log' },
  ];

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Admin</h1>
          <p>Platform-wide management. Every action here lands in the audit log.</p>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Admin sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={tabs.find((t) => t.id === tab)?.label}>
        {tab === 'overview' ? <Overview /> : null}
        {tab === 'users' ? <Users /> : null}
        {tab === 'servers' ? <Servers /> : null}
        {tab === 'audit' ? <Audit /> : null}
      </div>
    </div>
  );
}
