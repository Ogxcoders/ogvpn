import { useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Server, ServersResponse } from '../api/types';
import { useApi } from '../lib/useApi';
import { relativeTime } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { LoadBar } from '../components/LoadBar';
import { CopyField } from '../components/CopyField';
import { Icon } from '../components/Icon';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { PageSkeleton } from '../components/Skeleton';

type SortKey = 'load' | 'country' | 'name';

function ServerDetail({ server, onClose }: { server: Server; onClose: () => void }) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${server.name} details`}>
        <div className="drawer-head">
          <h2 style={{ margin: 0 }}>{server.name}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close server details">
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body stack">
          <div className="row">
            <StatusBadge status={server.status} />
            <span className="server-flag mono">
              {server.code.toUpperCase()} · {server.city}, {server.country}
            </span>
          </div>

          <LoadBar pct={server.loadPct} />
          <p className="small muted">
            {server.tunnelCount} active tunnel{server.tunnelCount === 1 ? '' : 's'} of {server.capacity} capacity
          </p>

          <dl style={{ margin: 0 }} className="stack">
            <div className="row-between">
              <dt className="muted small">Endpoint</dt>
              <dd className="mono" style={{ margin: 0 }}>
                {server.host}:{server.port}
              </dd>
            </div>
            <div className="row-between">
              <dt className="muted small">DNS</dt>
              <dd className="mono" style={{ margin: 0 }}>
                {server.dns}
              </dd>
            </div>
            <div className="row-between">
              <dt className="muted small">IPv4 pool</dt>
              <dd className="mono" style={{ margin: 0 }}>
                {server.ipv4Prefix}
              </dd>
            </div>
            <div className="row-between">
              <dt className="muted small">IPv6 pool</dt>
              <dd className="mono" style={{ margin: 0 }}>
                {server.ipv6Prefix}
              </dd>
            </div>
            <div className="row-between">
              <dt className="muted small">Dual-stack</dt>
              <dd style={{ margin: 0 }}>
                {server.supportsDualStack ? (
                  <span className="server-flag" style={{ color: 'var(--success)' }}>
                    <Icon name="dual" size={14} /> IPv4 + IPv6
                  </span>
                ) : (
                  <span className="server-flag">IPv4 only</span>
                )}
              </dd>
            </div>
            <div className="row-between">
              <dt className="muted small">Last heartbeat</dt>
              <dd style={{ margin: 0 }} className="small">
                {relativeTime(server.lastHeartbeatAt)}
              </dd>
            </div>
          </dl>

          <CopyField label="Server public key" value={server.publicKey} />
          <p className="small muted">
            This WireGuard public key is pinned by clients when they provision a peer on this server.
          </p>
        </div>
      </aside>
    </>
  );
}

export default function Servers() {
  const list = useApi<ServersResponse>(() => api.get<ServersResponse>('/servers'), [], {
    watch: ['servers'],
  });

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('load');
  const [selected, setSelected] = useState<Server | null>(null);

  const servers = list.data?.servers ?? [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? servers.filter((s) =>
          [s.name, s.country, s.city, s.code].some((v) => v.toLowerCase().includes(q)),
        )
      : [...servers];
    switch (sort) {
      case 'load':
        return filtered.sort((a, b) => (b.loadPct ?? 0) - (a.loadPct ?? 0));
      case 'country':
        return filtered.sort(
          (a, b) => a.country.localeCompare(b.country) || a.city.localeCompare(b.city),
        );
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [servers, query, sort]);

  if (list.loading && !list.data) return <PageSkeleton />;
  if (list.error && !list.data) {
    return <ErrorState title="Could not load servers" error={list.error} retry={list.retry} />;
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Servers</h1>
          <p>
            {servers.length} location{servers.length === 1 ? '' : 's'} online network-wide. Servers
            in maintenance or drain mode accept no new peers.
          </p>
        </div>
        <div className="row">
          <input
            className="input"
            style={{ width: 220 }}
            type="search"
            placeholder="Search name, country, city…"
            aria-label="Search servers"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label className="sr-only" htmlFor="server-sort">
            Sort servers
          </label>
          <select
            id="server-sort"
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="load">Sort by load</option>
            <option value="country">Sort by country</option>
            <option value="name">Sort by name</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={query ? 'No servers match your search' : 'No servers available'}
          hint={
            query
              ? 'Try a different name, country or city.'
              : 'The network currently has no active locations. Check back soon.'
          }
        />
      ) : (
        <div className="server-grid">
          {visible.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`server-card ${s.status === 'maintenance' ? 'maintenance' : ''} ${
                s.status === 'offline' ? 'offline' : ''
              }`}
              onClick={() => setSelected(s)}
              aria-label={`View details for ${s.name}`}
            >
              <div className="row-between">
                <span style={{ fontWeight: 700 }}>{s.name}</span>
                <StatusBadge status={s.status} />
              </div>
              <span className="server-flag">
                <Icon name="servers" size={13} />
                {s.city}, {s.country}
              </span>
              <LoadBar pct={s.loadPct} />
              <div className="row-between">
                <span className="server-flag">
                  {s.supportsDualStack ? (
                    <>
                      <Icon name="dual" size={13} /> IPv4 + IPv6
                    </>
                  ) : (
                    'IPv4 only'
                  )}
                </span>
                <span className="small muted">
                  {s.tunnelCount}/{s.capacity} peers
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected ? <ServerDetail server={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
