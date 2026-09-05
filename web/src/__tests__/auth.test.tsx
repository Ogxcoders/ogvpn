import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/ToastProvider';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { api, setTokens } from '../api/client';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    api: {
      ...actual.api,
      post: vi.fn(),
      get: vi.fn(),
      patch: vi.fn(),
      del: vi.fn(),
    },
  };
});

function renderAt(ui: React.ReactElement, path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

const okAuth = {
  user: { id: 'u1', email: 'a@b.c', name: 'A', role: 'user', status: 'active' },
  device: { id: 'd1', name: 'Web', platform: 'web', status: 'active', lastActiveAt: null },
  accessToken: 'tok',
  refreshToken: 'ref',
};

describe('Login page', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    localStorage.clear();
  });

  it('renders email and password fields and submit button', () => {
    renderAt(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in|log in|login/i })).toBeInTheDocument();
  });

  it('blocks invalid email client-side', async () => {
    const user = userEvent.setup();
    renderAt(<Login />);
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'whatever123');
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }));
    expect(api.post).not.toHaveBeenCalled();
    expect(await screen.findByText(/valid email|enter a valid/i)).toBeInTheDocument();
  });

  it('submits credentials and stores tokens on success', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValueOnce(okAuth);
    renderAt(<Login />);
    await user.type(screen.getByLabelText(/email/i), 'a@b.c');
    await user.type(screen.getByLabelText(/password/i), 'Sup3rSecurePass');
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/login', expect.objectContaining({ email: 'a@b.c' }), expect.anything()));
    // AuthProvider persists tokens through the client module.
    expect(localStorage.getItem('aegis.refresh')).toBe('ref');
  });

  it('shows the backend error message on bad credentials', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValueOnce(
      new (await import('../api/client')).ApiError(401, 'UNAUTHORIZED', 'Invalid email or password'),
    );
    renderAt(<Login />);
    await user.type(screen.getByLabelText(/email/i), 'a@b.c');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass123');
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }));
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});

describe('Register page', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it('rejects weak passwords before any network call', async () => {
    const user = userEvent.setup();
    renderAt(<Register />, '/register');
    await user.type(screen.getByLabelText(/^name$/i), 'New User');
    await user.type(screen.getByLabelText(/email/i), 'n@d.e');
    await user.type(screen.getByLabelText(/^password$/i), 'short1');
    await user.click(screen.getByRole('button', { name: /create|register|sign up/i }));
    expect(api.post).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 10 characters/);
  });

  it('requires the password to contain a letter and a digit', async () => {
    const user = userEvent.setup();
    renderAt(<Register />, '/register');
    await user.type(screen.getByLabelText(/^name$/i), 'New User');
    await user.type(screen.getByLabelText(/email/i), 'n@d.e');
    await user.type(screen.getByLabelText(/^password$/i), ' nodigitsatall ');
    await user.click(screen.getByRole('button', { name: /create|register|sign up/i }));
    expect(api.post).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least one digit/);
  });
});

describe('AuthContext', () => {
  it('boots anonymous without tokens', async () => {
    vi.mocked(api.get).mockReset();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId('auth-status').textContent).toBe('anonymous'));
  });

  it('boots authenticated with a stored token and loads me', async () => {
    setTokens({ accessToken: 'tok', refreshToken: 'ref' });
    vi.mocked(api.get).mockResolvedValueOnce({
      user: okAuth.user,
      subscription: { plan: 'free', status: 'active', maxDevices: 2, currentPeriodEnd: null },
      device: okAuth.device,
    });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId('auth-status').textContent).toBe('authenticated'));
    expect(screen.getByTestId('auth-email').textContent).toBe('a@b.c');
  });
});

function Probe() {
  const { status, user } = useAuthPublic();
  return (
    <div>
      <span data-testid="auth-status">{status}</span>
      <span data-testid="auth-email">{user?.email ?? ''}</span>
    </div>
  );
}

import { useAuth as useAuthPublic } from '../context/AuthContext';
