import { useEffect, useMemo, useState } from 'react';
import { aegis, type ServerInfo } from '../lib/bridge';
import { AlertIcon, RefreshIcon, SearchIcon } from '../lib/icons';

const STATUS_BADGE: Record<ServerInfo['status'], string> = {
  active: 'success',
  maintenance: 'warn',
  drain: 'warn',
  offline: 'danger',
};

const STATUS_HINT: Record<ServerInfo['status'], string> = {
  active: 'Available',
  maintenance: 'Under maintenance',
  drain: 'Not accepting new connections',
  offline: 'Offline',
};

export function Servers(): React.ReactElement {
  const [servers, setServers] = useState<ServerInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'load' | 'country'>('load');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const load = (): void => {
    setError(null);
    void aegis()
      .listServers()
      .then((s) => setServers(s))
      .catch((e) => setError((e as Error).message));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!servers) return [];
    const q = query.trim().toLowerCase();
    return servers
      .filter((s) => !q || `${s.name} ${s.country} ${s.city} ${s.code}`.toLowerCase().includes(q))
      .sort((a, b) =>
        sortBy === 'load'
          ? a.loadPct - b.loadPct
          : `${a.country}${a.city}`.localeCompare(`${b.country}${b.city}`),
      );
  }, [servers, query, sortBy]);

  const connect = async (server: ServerInfo): Promise<void> => {
    setConnecting(server.id);
    setConnectError(null);
    try {
      await aegis().connect(server.id);
    } catch (e) {
      setConnectError((e as Error).message);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div>
      <h1>Servers</h1>
      <p className="page-sub">Pick an active server — lowest load is usually fastest.</p>

      {connectError ? (
        <div className="error-panel" role="alert">
          <div className="title"><AlertIcon size={18} /> Could not connect</div>
          <div>{connectError}</div>
          <div className="hint">Pick a different active server, or check your network and retry.</div>
        </div>
      ) : null}

      {error ? (
        <div className="error-panel" role="alert">
          <div className="title"><AlertIcon size={18} /> Could not load servers</div>
          <div>{error}</div>
          <div className="hint">Check your connection — the list reloads instantly after.</div>
          <button className="btn mt-12" onClick={load}><RefreshIcon size={15} /> Retry</button>
        </div>
      ) : !servers ? (
        <div className="list-gap" aria-label="Loading servers">
          {[0, 1, 2, 3].map((i) => (
            <div className="skeleton-card" key={i}>
              <div className="rowline">
                <div className="skeleton" style={{ width: 44, height: 44 }} />
                <div className="grow">
                  <div className="skeleton" style={{ width: 160, height: 14 }} />
                  <div className="skeleton mt-8" style={{ width: 220, height: 11 }} />
                </div>
                <div className="skeleton" style={{ width: 90, height: 30 }} />
              </div>
              <div className="skeleton mt-12" style={{ height: 6 }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="card row spread">
            <div className="row grow" style={{ maxWidth: 460 }}>
              <SearchIcon size={16} className="muted" />
              <input
                className="input"
                placeholder="Search country, city or code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search servers"
              />
            </div>
            <label className="muted">
              Sort by{' '}
              <select className="input" style={{ width: 140 }} value={sortBy} onChange={(e) => setSortBy(e.target.value as 'load' | 'country')}>
                <option value="load">Load</option>
                <option value="country">Country</option>
              </select>
            </label>
          </div>

          <div className="card">
            {filtered.length === 0 ? (
              <div className="empty">
                <h3>No servers match</h3>
                <p>Nothing matched “{query}” — check the spelling or try a country code.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Server</th>
                    <th>Status</th>
                    <th style={{ minWidth: 150 }}>Load</th>
                    <th>IP stack</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="row">
                          <div className="avatar" aria-hidden="true">{s.code.slice(0, 2).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                            <div className="muted">{s.city}, {s.country} · {s.code}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ marginBottom: 4 }}>
                          <span className={`badge ${STATUS_BADGE[s.status] ?? ''}`}>
                            <span className="dot" />
                            {s.status}
                          </span>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>{STATUS_HINT[s.status]}</div>
                      </td>
                      <td>
                        <div className="loadbar">
                          <span className={s.loadPct >= 85 ? 'hot' : s.loadPct >= 60 ? 'warm' : ''} style={{ width: `${s.loadPct}%` }} />
                        </div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{s.loadPct}% · {s.tunnelCount ?? 0}/{s.capacity} tunnels</div>
                      </td>
                      <td>{s.supportsDualStack ? 'Dual-stack' : 'IPv4 only'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary"
                          disabled={s.status !== 'active' || connecting !== null}
                          onClick={() => void connect(s)}
                        >
                          {connecting === s.id ? 'Connecting…' : s.status === 'active' ? 'Connect' : STATUS_HINT[s.status]}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
