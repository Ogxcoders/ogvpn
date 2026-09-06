import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aegis, formatBytes, formatDuration, type ServerInfo, type VpnStatusSnapshot } from '../lib/bridge';
import { useVpnStatus } from '../lib/hooks';
import { AlertIcon, CheckCircleIcon, CloudOffIcon, PowerIcon, RefreshIcon, ShieldIcon } from '../lib/icons';

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

const STATE_HINTS: Record<string, string> = {
  IDLE: 'Tap to protect your traffic',
  DISCONNECTED: 'Tap to protect your traffic',
  PREPARING: 'Preparing the VPN service…',
  CONNECTING: 'Establishing secure tunnel…',
  HANDSHAKING: 'Exchanging encryption keys…',
  CONNECTED: 'Your traffic is protected',
  RECONNECTING: 'Connection lost — recovering…',
  DISCONNECTING: 'Closing the tunnel…',
  ERROR: 'Check the message below, then try again',
  OFFLINE: 'No network connection',
  AUTH_REQUIRED: 'Sign in to continue',
  SERVER_UNAVAILABLE: 'Pick another server to continue',
  CONFIGURATION_ERROR: 'Reset the error to rebuild the tunnel',
};

type RingClass = '' | 'resting' | 'connected' | 'busy' | 'failed' | 'offline';

function ringFor(s: VpnStatusSnapshot | null): RingClass {
  if (!s) return '';
  if (s.state === 'CONNECTED') return 'connected';
  if (['CONNECTING', 'HANDSHAKING', 'RECONNECTING', 'DISCONNECTING', 'PREPARING'].includes(s.state)) return 'busy';
  if (['ERROR', 'SERVER_UNAVAILABLE', 'CONFIGURATION_ERROR'].includes(s.state)) return 'failed';
  if (s.state === 'OFFLINE') return 'offline';
  return 'resting';
}

function RingIcon({ state, className }: { state: RingClass; className?: string }): React.ReactElement {
  switch (state) {
    case 'connected': return <CheckCircleIcon size={30} className={className} />;
    case 'failed': return <AlertIcon size={30} className={className} />;
    case 'offline': return <CloudOffIcon size={30} className={className} />;
    default: return <PowerIcon size={30} className={className} />;
  }
}

export function Home(): React.ReactElement {
  const status = useVpnStatus();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    void aegis().demoStatus().then(setDemo).catch(() => setDemo(false));
  }, []);

  // Re-render every second for the session duration ticker.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const connected = status?.state === 'CONNECTED';
  const busyState = status ? ['CONNECTING', 'HANDSHAKING', 'RECONNECTING', 'DISCONNECTING', 'PREPARING'].includes(status.state) : false;
  const ring = ringFor(status);
  const stateKey = status?.state ?? 'IDLE';
  const headline = STATE_LABELS[stateKey] ?? stateKey;
  const hint = STATE_HINTS[stateKey] ?? '';
  const actionLabel = connected ? 'Disconnect' : connected || busyState ? headline : 'Connect';

  const toggle = async (): Promise<void> => {
    if (busy || busyState) return;
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
    if (!best) throw new Error('No active servers available — check your connection and retry.');
    return best.id;
  }

  return (
    <div>
      <h1>Protection</h1>
      <p className="page-sub">One decision dominates this screen — everything else is detail.</p>

      {demo ? (
        <div className="demo-banner" role="status">
          <span className="demo-chip">DEMO</span>
          Sample data. The tunnel is simulated — no traffic is routed or protected.
        </div>
      ) : null}

      {error ? (
        <div className="error-panel" role="alert">
          <div className="title"><AlertIcon size={18} /> Could not complete that action</div>
          <div>{error}</div>
          <div className="hint">Check your network, then tap the ring to try again.</div>
        </div>
      ) : null}

      {status?.lastError && status.state !== 'IDLE' ? (
        <div className="banner" role="alert">
          <AlertIcon size={16} />
          <span className="grow">{status.lastError}</span>
          <button className="btn" onClick={() => void aegis().resetError()}>
            <RefreshIcon size={14} /> Reset
          </button>
        </div>
      ) : null}

      <div className="card connect-wrap">
        <button
          className={`connect-big ${ring}`}
          onClick={() => void toggle()}
          disabled={busy || busyState}
          aria-label={connected ? 'Disconnect VPN' : 'Connect VPN'}
          aria-pressed={connected}
        >
          <RingIcon state={ring} />
          <span>{actionLabel}</span>
          <span className="connect-sub">{busyState ? headline : hint}</span>
        </button>

        <div className="metrics mt-16" style={{ justifyContent: 'center' }} aria-live="polite">
          <div className="metric">
            <div className="k">State</div>
            <div className="v">{headline}</div>
          </div>
          <div className="metric">
            <div className="k">Server</div>
            <div className="v">{status?.serverName ?? '—'}</div>
          </div>
          <div className="metric">
            <div className="k">Duration</div>
            <div className="v">{connected && status?.connectedSince ? formatDuration(status.connectedSince) : '—'}</div>
          </div>
        </div>

        <button className="btn mt-16" onClick={() => navigate('/servers')}>
          <ShieldIcon size={15} />
          {connected || busyState ? 'Switch server' : 'Choose server'}
        </button>
      </div>

      <div className="card">
        <h2>Session details</h2>
        <div className="metrics">
          <div className="metric">
            <div className="k">Tunnel IP</div>
            <div className="v mono">
              {status?.addressV4 ?? '—'}
              {status?.addressV6 && status.addressV6 !== '::' ? ` · ${status.addressV6}` : ''}
            </div>
          </div>
          <div className="metric">
            <div className="k">Down</div>
            <div className="v">{formatBytes(status?.rxBytes ?? 0)}</div>
          </div>
          <div className="metric">
            <div className="k">Up</div>
            <div className="v">{formatBytes(status?.txBytes ?? 0)}</div>
          </div>
          <div className="metric">
            <div className="k">Handshake</div>
            <div className="v">{status?.handshakeAgoSec != null ? `${status.handshakeAgoSec}s ago` : '—'}</div>
          </div>
          <div className="metric">
            <div className="k">Kill switch</div>
            <div className="v">{status?.killSwitchActive ? 'active' : 'inactive'}</div>
          </div>
        </div>
        <div className="desktop-only-hint">Tip: the ring is the main action — Space/Enter activates it when focused.</div>
      </div>
    </div>
  );
}

export type { ServerInfo };
