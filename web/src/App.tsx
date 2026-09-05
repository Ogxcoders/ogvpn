import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, EventBridge, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/ToastProvider';
import { Spinner } from './components/Spinner';
import { ErrorState } from './components/ErrorState';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Servers from './pages/Servers';
import Sessions from './pages/Sessions';
import Subscription from './pages/Subscription';
import Support from './pages/Support';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

/** Blocks anonymous access; remembers the intended destination. */
function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="center-page">
        <Spinner size={28} label="Checking session" />
      </div>
    );
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Blocks non-admin access inside the authenticated shell. */
function RequireAdmin() {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return (
      <ErrorState
        title="Admins only — this area requires an administrator account"
      />
    );
  }
  return <Outlet />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <EventBridge />
        <BrowserRouter>
          <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="devices" element={<Devices />} />
            <Route path="servers" element={<Servers />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="support" element={<Support />} />
            <Route element={<RequireAdmin />}>
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
