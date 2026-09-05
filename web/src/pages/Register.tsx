import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { emailError, passwordPolicyErrors } from '../lib/validation';
import { webDeviceName } from '../lib/device';
import { Icon } from '../components/Icon';
import { Spinner } from '../components/Spinner';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  deviceName?: string;
}

export default function Register() {
  const { register, status } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deviceName, setDeviceName] = useState(() => webDeviceName());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') return <Navigate to="/" replace />;
  if (status === 'loading') {
    return (
      <div className="center-page">
        <Spinner size={28} label="Checking session" />
      </div>
    );
  }

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (name.trim().length > 80) errors.name = 'Name is too long (max 80 characters)';
    const emailErr = emailError(email);
    if (emailErr) errors.email = emailErr;
    // Mirror the backend password policy exactly.
    const policy = passwordPolicyErrors(password);
    if (policy.length > 0) errors.password = `Password must contain ${policy.join(', ')}`;
    if (!deviceName.trim()) errors.deviceName = 'Device name is required';
    if (deviceName.trim().length > 80) errors.deviceName = 'Device name is too long (max 80 characters)';
    return errors;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      await register({ name, email, password, deviceName });
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CONFLICT') {
          setFormError('An account with this email already exists. Sign in instead.');
        } else if (err.code === 'RATE_LIMITED') {
          setFormError('Too many attempts. Wait a minute and try again.');
        } else {
          setFormError(err.message || 'Registration failed. Please try again.');
        }
      } else {
        setFormError('Registration failed. Check your connection and try again.');
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
        <p className="auth-sub">Create your account. The first device is registered automatically.</p>

        {formError ? (
          <div className="form-error" role="alert">
            {formError}
          </div>
        ) : null}

        <form onSubmit={(e) => void onSubmit(e)} noValidate>
          <div className="field">
            <label htmlFor="reg-name">Name</label>
            <input
              id="reg-name"
              className="input"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? 'reg-name-error' : undefined}
              placeholder="Alex Doe"
            />
            {fieldErrors.name ? (
              <span id="reg-name-error" className="field-error">
                {fieldErrors.name}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
              placeholder="you@example.com"
            />
            {fieldErrors.email ? (
              <span id="reg-email-error" className="field-error">
                {fieldErrors.email}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby="reg-password-hint"
              placeholder="At least 10 characters"
            />
            <span id="reg-password-hint" className="field-hint">
              Minimum 10 characters, with at least one letter and one digit.
            </span>
            {fieldErrors.password ? (
              <span className="field-error" role="alert">
                {fieldErrors.password}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="reg-device">Device name</label>
            <input
              id="reg-device"
              className="input"
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              aria-invalid={fieldErrors.deviceName ? true : undefined}
              aria-describedby={fieldErrors.deviceName ? 'reg-device-error' : undefined}
            />
            {fieldErrors.deviceName ? (
              <span id="reg-device-error" className="field-error">
                {fieldErrors.deviceName}
              </span>
            ) : null}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? <Spinner size={16} label="Creating account" /> : null}
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
