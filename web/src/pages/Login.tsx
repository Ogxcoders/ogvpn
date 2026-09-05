import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { emailError } from '../lib/validation';
import { Icon } from '../components/Icon';
import { Spinner } from '../components/Spinner';

export default function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (status === 'authenticated') return <Navigate to={from} replace />;
  if (status === 'loading') {
    return (
      <div className="center-page">
        <Spinner size={28} label="Checking session" />
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: { email?: string; password?: string } = {};
    const emailErr = emailError(email);
    if (emailErr) errors.email = emailErr;
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ACCOUNT_DISABLED' || err.status === 403) {
          setFormError('Your account has been disabled. Contact support for help.');
        } else if (err.code === 'RATE_LIMITED') {
          setFormError('Too many sign-in attempts. Wait a minute and try again.');
        } else {
          setFormError(err.message || 'Sign-in failed. Please try again.');
        }
      } else {
        setFormError('Sign-in failed. Check your connection and try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">
            <Icon name="shield" size={22} />
          </span>
          AegisVPN
        </div>
        <p className="auth-sub">Sign in to your control plane.</p>

        {formError ? (
          <div className="form-error" role="alert">
            {formError}
          </div>
        ) : null}

        <form onSubmit={(e) => void onSubmit(e)} noValidate>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              placeholder="you@example.com"
            />
            {fieldErrors.email ? (
              <span id="login-email-error" className="field-error">
                {fieldErrors.email}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              placeholder="••••••••••"
            />
            {fieldErrors.password ? (
              <span id="login-password-error" className="field-error">
                {fieldErrors.password}
              </span>
            ) : null}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? <Spinner size={16} label="Signing in" /> : null}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-foot">
          No account yet? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
