import { useEffect, useMemo, useState } from 'react';
import { aegis, type ServerInfo } from '../lib/bridge';

const STATUS_BADGE: Record<ServerInfo['status'], string> = {
  active: 'success',
  maintenance: 'warn',
  drain: 'warn',
  offline: 'danger',
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

  if (error) {
    return (
      <div className="error-state">
        <h3>Could not load servers</h3>
        <p>{error}</p>
        <button className="btn" onClick={load}>Retry</button>
      </div>
    );
  }
  if (!servers) {
    return <div className="skeleton" style={{ height: 220 }} />;
  }

  return (
    <div>
      <div className="card row spread">
        <input
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="Search country, city or code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search servers"
        />
        <label className="muted">
          Sort by{' '}
          <select className="input" style={{ width: 140 }} value={sortBy} onChange={(e) => setSortBy(e.target.value as 'load' | 'country')}>
            <option value="load">Load</option>
            <option value="country">Country</option>
          </select>
        </label>
      </div>

      {connectError ? <div className="banner" role="alert">{connectError}</div> : null}

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">No servers match “{query}”.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Server</th>
                <th>Status</th>
                <th>Load</th>
                <th>IPv6</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div className="muted">{s.city}, {s.country} · {s.code}</div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[s.status] ?? ''}`}>
                      <span className="dot" />
                      {s.status}
                    </span>
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <div className="loadbar"><span style={{ width: `${s.loadPct}%` }} /></div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{s.loadPct}% · {s.tunnelCount ?? 0}/{s.capacity}</div>
                  </td>
                  <td>{s.supportsDualStack ? 'Dual-stack' : 'IPv4 only'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-primary"
                      disabled={s.status !== 'active' || connecting !== null}
                      onClick={() => void connect(s)}
                    >
                      {connecting === s.id ? 'Connecting…' : 'Connect'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
