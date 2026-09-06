import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { aegis, type AuthIdentity } from './lib/bridge';
import { useAppEvents, useToasts, useVpnStatus } from './lib/hooks';
import { DevicesIcon, GearIcon, GlobeIcon, HomeIcon, LogoutIcon, PulseIcon, ShieldIcon } from './lib/icons';
import { Login } from './screens/Login';
import { Home } from './screens/Home';
import { Servers } from './screens/Servers';
import { Devices } from './screens/Devices';
import { Settings } from './screens/Settings';
import { Diagnostics } from './screens/Diagnostics';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, key: '1' },
  { to: '/servers', label: 'Servers', icon: GlobeIcon, key: '2' },
  { to: '/devices', label: 'Devices', icon: DevicesIcon, key: '3' },
  { to: '/settings', label: 'Settings', icon: GearIcon, key: '4' },
  { to: '/diagnostics', label: 'Diagnostics', icon: PulseIcon, key: '5' },
] as const;

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

/** Sidebar status line mirrors the live VPN state — not renderer-only truth. */
function SidebarStatus(): React.ReactElement {
  const status = useVpnStatus();
  const connected = status?.state === 'CONNECTED';
  const inFlight = status
    ? ['CONNECTING', 'HANDSHAKING', 'RECONNECTING', 'DISCONNECTING', 'PREPARING'].includes(status.state)
    : false;
  const cls = connected ? 'success' : inFlight ? 'warn' : status?.state === 'ERROR' ? 'danger' : '';
  return (
    <div className="sidebar-status" aria-live="polite">
      <div className="label">VPN status</div>
      <div className="mt-8">
        <span className={`badge ${cls}`}>
          <span className="dot" />
          {status?.state ?? '…'}
        </span>
      </div>
    </div>
  );
}

function Shell({ onLogout }: { onLogout: () => void }): React.ReactElement {
  const { toasts, push, dismiss } = useToasts();
  const navigate = useNavigate();

  useAppEvents({
    onNotice: (level, message) => push(level, message),
    onForceLogout: (reason) => {
      push('error', reason);
      onLogout();
    },
  });

  // Keyboard shortcuts: Ctrl/Cmd+1..5 navigate between sections.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const item = NAV_ITEMS.find((n) => e.key === n.key);
      if (item) {
        e.preventDefault();
        navigate(item.to);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="app-shell">
      <nav className="sidebar" aria-label="Primary">
        <div className="brand">
          <span className="brand-mark"><ShieldIcon size={22} /></span>
          AegisVPN
        </div>
        {NAV_ITEMS.map(({ to, label, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
            <kbd style={{ marginLeft: 'auto', opacity: 0.7 }}>{isMac ? `⌘${key}` : `Ctrl+${key}`}</kbd>
          </NavLink>
        ))}
        <SidebarStatus />
        <button className="btn btn-ghost" style={{ marginTop: 'auto' }} onClick={onLogout}>
          <LogoutIcon size={16} />
          Log out
        </button>
        <div className="sidebar-footer">
          <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd>1–5</kbd> to switch sections
        </div>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <div className="toast-area" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.level}`} onClick={() => dismiss(t.id)}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}

export function App(): React.ReactElement {
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [checking, setChecking] = useState(true);

  // Follow the OS light/dark preference (platform convention) by mapping
  // prefers-color-scheme onto the data-theme attribute.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = (): void => {
      document.documentElement.dataset.theme = mq.matches ? 'light' : 'dark';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const onLogout = useCallback(() => {
    void aegis().logout().then(() => setIdentity(null));
  }, []);

  useEffect(() => {
    void aegis()
      .me()
      .then((i) => setIdentity(i))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="auth-wrap">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-brand">
            <span className="brand-mark"><ShieldIcon size={40} /></span>
          </div>
          <div className="muted">Starting…</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {identity ? (
        <Shell onLogout={onLogout} />
      ) : (
        <Routes>
          <Route path="*" element={<Login onAuthenticated={setIdentity} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
