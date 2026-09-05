import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aegis, formatBytes, formatDuration, type ServerInfo, type VpnStatusSnapshot } from '../lib/bridge';
import { useVpnStatus } from '../lib/hooks';

const STATE_LABELS: Record<string, string> = {
  IDLE: 'Idle',
  PREPARING: 'Preparing…',
  CONNECTING: 'Connecting…',
  HANDSHAKING: 'Handshaking…',
  CONNECTED: 'Connected',
  RECONNECTING: 'Reconnecting…',
  DISCONNECTING: 'Disconnecting…',
  DISCONNECTED: 'Disconnected',
  ERROR: 'Error',
  OFFLINE: 'Offline',
  AUTH_REQUIRED: 'Sign-in required',
  SERVER_UNAVAILABLE: 'Server unavailable',
  CONFIGURATION_ERROR: 'Configuration error',
};

export function stateClass(s: VpnStatusSnapshot | null): string {
  if (!s) return '';
  if (s.state === 'CONNECTED') return 'connected';
  if (['CONNECTING', 'HANDSHAKING', 'RECONNECTING', 'DISCONNECTING', 'PREPARING'].includes(s.state)) return 'busy';
  if (['ERROR', 'SERVER_UNAVAILABLE', 'CONFIGURATION_ERROR'].includes(s.state)) return 'failed';
  return '';
}

export function Home(): React.ReactElement {
  const status = useVpnStatus();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, tick] = useState(0);

  // Re-render every second for the session duration ticker.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const connected = status?.state === 'CONNECTED';
  const busyState = status ? ['CONNECTING', 'HANDSHAKING', 'RECONNECTING', 'DISCONNECTING', 'PREPARING'].includes(status.state) : false;

  const toggle = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      if (connected) {
        await aegis().disconnect();
      } else {
        await aegis().connect(status?.serverId ?? (await pickDefaultServer()));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  async function pickDefaultServer(): Promise<string> {
    const servers = await aegis().listServers();
    const best = servers.filter((s) => s.status === 'active').sort((a, b) => a.loadPct - b.loadPct)[0];
    if (!best) throw new Error('No active servers available');
    return best.id;
  }

  return (
    <div>
      {error ? <div className="banner" role="alert">{error}</div> : null}
      {status?.lastError && status.state !== 'IDLE' ? (
        <div className="banner" role="alert">{status.lastError} <button className="btn btn-sm" onClick={() => void aegis().resetError()}>Reset</button></div>
      ) : null}
      <div className="card" style={{ textAlign: 'center', padding: 28 }}>
        <div style={{ marginBottom: 14 }}>
          <span className={`badge ${connected ? 'success' : busyState ? 'warn' : ''}`}>
            <span className="dot" />
            {STATE_LABELS[status?.state ?? 'IDLE'] ?? status?.state}
          </span>
        </div>
        <button
          className={`connect-big ${stateClass(status)} ${busy || busyState ? 'busy' : ''}`}
          onClick={() => void toggle()}
          disabled={busy || busyState || status?.state === 'DISCONNECTING'}
          aria-label={connected ? 'Disconnect VPN' : 'Connect VPN'}
        >
          {connected ? 'Disconnect' : busyState ? '…' : 'Connect'}
        </button>
        <div style={{ marginTop: 18 }}>
          <div className="muted">{connected || busyState ? 'Server' : 'Select a server to begin'}</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{status?.serverName ?? '—'}</div>
        </div>
        <button className="btn" style={{ marginTop: 12 }} onClick={() => navigate('/servers')}>Choose server</button>
      </div>

      <div className="card">
        <h2>Session</h2>
        <div className="row spread">
          <div>
            <div className="muted">Duration</div>
            <div>{formatDuration(status?.connectedSince ?? null)}</div>
          </div>
          <div>
            <div className="muted">IP (tunnel)</div>
            <div className="mono">{status?.addressV4 ?? '—'}{status?.addressV6 && status.addressV6 !== '::' ? ` · ${status.addressV6}` : ''}</div>
          </div>
        </div>
        <div className="row spread" style={{ marginTop: 12 }}>
          <div>
            <div className="muted">Down</div>
            <div>{formatBytes(status?.rxBytes ?? 0)}</div>
          </div>
          <div>
            <div className="muted">Up</div>
            <div>{formatBytes(status?.txBytes ?? 0)}</div>
          </div>
          <div>
            <div className="muted">Handshake</div>
            <div>{status?.handshakeAgoSec != null ? `${status.handshakeAgoSec}s ago` : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { ServerInfo };
