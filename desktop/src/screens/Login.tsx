import { FormEvent, useState } from 'react';
import { aegis, emailError, passwordPolicyErrors, type AuthIdentity, type LoginResult } from '../lib/bridge';
import { AlertIcon, ShieldIcon } from '../lib/icons';

export function Login({ onAuthenticated }: { onAuthenticated: (i: AuthIdentity) => void }): React.ReactElement {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);
    const errors: typeof fieldErrors = {};
    const emailErr = emailError(email);
    if (emailErr) errors.email = emailErr;
    const policy = passwordPolicyErrors(password);
    if (policy.length > 0) errors.password = `Password must contain ${policy.join(', ')}`;
    if (mode === 'register' && !name.trim()) errors.name = 'Name is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const result: LoginResult = mode === 'login'
        ? await aegis().login({ email, password })
        : await aegis().register({ email, password, name });
      const identity = await aegis().me();
      onAuthenticated(identity ?? { user: result.user, device: result.device, subscription: result.subscription });
    } catch (err) {
      setFormError((err as Error).message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark"><ShieldIcon size={44} /></span>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p>Private, fast and honest VPN protection</p>
        </div>

        {formError ? (
          <div className="error-panel" role="alert">
            <div className="title"><AlertIcon size={18} /> Sign-in failed</div>
            <div>{formError}</div>
            <div className="hint">Check your credentials and retry — or use demo mode below.</div>
          </div>
        ) : null}

        <form onSubmit={(e) => void submit(e)} noValidate>
          {mode === 'register' ? (
            <div className="field">
              <label htmlFor="auth-name">Name</label>
              <input id="auth-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={!!fieldErrors.name} />
              {fieldErrors.name ? <div className="field-error">{fieldErrors.name}</div> : null}
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!fieldErrors.email} />
            {fieldErrors.email ? <div className="field-error">{fieldErrors.email}</div> : null}
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input id="auth-password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} aria-invalid={!!fieldErrors.password} />
            {fieldErrors.password ? <div className="field-error">{fieldErrors.password}</div> : null}
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <div className="muted mt-12" style={{ textAlign: 'center' }}>
          {mode === 'login' ? (
            <>No account yet? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); setFieldErrors({}); }}>Create one</a></>
          ) : (
            <>Already registered? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setFieldErrors({}); }}>Sign in</a></>
          )}
        </div>

        <div className="demo-card">
          <h3>
            <span className="demo-chip">DEMO</span>
            Explore the full interface offline
          </h3>
          <p>
            Sample servers, devices and VPN states — no account, backend or WireGuard tooling needed.
            The tunnel is simulated; no traffic is routed.
          </p>
          <button className="btn" type="button" disabled={busy} style={{ width: '100%' }} onClick={() => void enterDemo()}>
            Explore demo mode
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * Offline demo mode: flips the main-process demo flag (all API calls are
   * then answered locally) and signs in with the documented demo fixture.
   */
  async function enterDemo(): Promise<void> {
    setFormError(null);
    setFieldErrors({});
    setBusy(true);
    try {
      await aegis().demoEnable();
      const result: LoginResult = await aegis().login({ email: 'demo@aegisvpn.local', password: 'DemoPass123' });
      const identity = await aegis().me();
      onAuthenticated(identity ?? { user: result.user, device: result.device, subscription: result.subscription });
    } catch (err) {
      setFormError((err as Error).message || 'Demo sign-in failed');
    } finally {
      setBusy(false);
    }
  }
}
