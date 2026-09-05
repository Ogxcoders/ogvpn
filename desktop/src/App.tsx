import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { aegis, type AuthIdentity } from './lib/bridge';
import { useAppEvents, useToasts } from './lib/hooks';
import { Login } from './screens/Login';
import { Home } from './screens/Home';
import { Servers } from './screens/Servers';
import { Devices } from './screens/Devices';
import { Settings } from './screens/Settings';
import { Diagnostics } from './screens/Diagnostics';

function Shell({ onLogout }: { onLogout: () => void }): React.ReactElement {
  const { toasts, push, dismiss } = useToasts();

  useAppEvents({
    onNotice: (level, message) => push(level, message),
    onForceLogout: (reason) => {
      push('error', reason);
      onLogout();
    },
  });

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="brand">AegisVPN</div>
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Home</NavLink>
        <NavLink to="/servers" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Servers</NavLink>
        <NavLink to="/devices" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Devices</NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Settings</NavLink>
        <NavLink to="/diagnostics" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Diagnostics</NavLink>
        <button className="btn btn-ghost" style={{ marginTop: 'auto' }} onClick={onLogout}>Log out</button>
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

  useEffect(() => {
    void aegis()
      .me()
      .then((i) => setIdentity(i))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="auth-wrap">
        <div className="muted">Starting…</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {identity ? (
        <Shell onLogout={() => { void aegis().logout().then(() => setIdentity(null)); }} />
      ) : (
        <Routes>
          <Route path="*" element={<Login onAuthenticated={setIdentity} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
