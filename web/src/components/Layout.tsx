import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { NotificationsResponse } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/useApi';
import { useOnline } from '../lib/useOnline';
import { initials, relativeTime } from '../lib/format';
import { Icon, type IconName } from './Icon';
import { useToast } from './ToastProvider';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/devices', label: 'Devices', icon: 'devices' },
  { to: '/servers', label: 'Servers', icon: 'servers' },
  { to: '/sessions', label: 'Sessions', icon: 'sessions' },
  { to: '/subscription', label: 'Subscription', icon: 'subscription' },
  { to: '/support', label: 'Support', icon: 'support' },
  { to: '/admin', label: 'Admin', icon: 'admin' },
];

function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('aegis.theme') ?? 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('aegis.theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return [theme, toggle];
}

function NotificationsDrawer({ onClose }: { onClose: () => void }) {
  const list = useApi<NotificationsResponse>(() => api.get<NotificationsResponse>('/notifications'), [], {
    watch: ['notifications'],
  });
  const { toast } = useToast();
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.patch('/notifications/read');
      list.retry();
    } catch {
      toast('Could not mark notifications as read.', 'error');
    } finally {
      setMarking(false);
    }
  };

  const notifications = list.data?.notifications ?? [];
  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Notifications">
        <div className="drawer-head">
          <h2 style={{ margin: 0 }}>Notifications {unread > 0 ? `(${unread} unread)` : ''}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close notifications">
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body">
          {list.loading && !list.data ? (
            <div className="center-page" style={{ minHeight: 120 }}>
              <Spinner label="Loading notifications" />
            </div>
          ) : list.error && !list.data ? (
            <ErrorState title="Could not load notifications" error={list.error} retry={list.retry} />
          ) : notifications.length === 0 ? (
            <EmptyState title="No notifications" hint="Security and account events will appear here." />
          ) : (
            <>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <span className="small muted">{notifications.length} most recent</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void markAllRead()}
                  disabled={marking || unread === 0}
                >
                  Mark all read
                </button>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className={`notif ${n.read_at ? 'read' : ''}`}>
                  <span className="notif-dot" aria-hidden="true" />
                  <div>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.body}</div>
                    <div className="notif-time">{relativeTime(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const online = useOnline();
  const [theme, toggleTheme] = useTheme();

  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close transient UI on navigation.
  useEffect(() => {
    setNavOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Dismiss the account menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const notifications = useApi<NotificationsResponse>(
    () => api.get<NotificationsResponse>('/notifications'),
    [],
    { watch: ['notifications'] },
  );

  const unreadCount = useMemo(
    () => (notifications.data?.notifications ?? []).filter((n) => !n.read_at).length,
    [notifications.data],
  );

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      toast('Signed out.', 'info');
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="app-shell">
      {navOpen ? (
        <div
          className="sidebar-scrim"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <Icon name="shield" size={20} />
          </span>
          AegisVPN
        </div>
        <nav className="nav" aria-label="Main navigation">
          {NAV_ITEMS.filter((item) => item.to !== '/admin' || isAdmin).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          Signed in as {user?.email}
          <br />
          AegisVPN Control Plane v1.0
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            <Icon name={navOpen ? 'close' : 'menu'} />
          </button>

          <span className="topbar-spacer" />

          {!online ? (
            <span className="badge badge-warn" role="status">
              <span className="dot" aria-hidden="true" />
              Offline
            </span>
          ) : null}

          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            onClick={() => setNotifOpen(true)}
          >
            <Icon name="bell" />
            {unreadCount > 0 ? <span className="count-dot">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
          </button>

          <div className="menu-anchor" ref={menuRef}>
            <button
              type="button"
              className="account-chip"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="avatar" aria-hidden="true">
                {initials(user?.name ?? '?')}
              </span>
              <span className="account-name">{user?.name}</span>
            </button>
            {menuOpen ? (
              <div className="menu" role="menu" aria-label="Account menu">
                <div className="menu-head">
                  <div className="menu-name">{user?.name}</div>
                  <div className="menu-email">{user?.email}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className="badge badge-primary">{user?.role}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="item danger"
                  role="menuitem"
                  onClick={() => void signOut()}
                  disabled={signingOut}
                >
                  <Icon name="logout" size={16} />
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {!online ? (
          <div className="offline-banner" role="alert">
            You are offline — data may be stale. Requests will resume automatically when the
            connection returns.
          </div>
        ) : null}

        <main className="content" id="main">
          <Outlet />
        </main>
      </div>

      {notifOpen ? <NotificationsDrawer onClose={() => setNotifOpen(false)} /> : null}
    </div>
  );
}
