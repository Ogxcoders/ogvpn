import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/ToastProvider';
import Devices from '../pages/Devices';
import { api } from '../api/client';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    api: { ...actual.api, get: vi.fn(), patch: vi.fn(), del: vi.fn(), post: vi.fn() },
  };
});

const devices = {
  devices: [
    {
      id: 'dev-1',
      name: 'Pixel 8',
      platform: 'android',
      status: 'active',
      lastActiveAt: '2026-09-05T10:00:00Z',
      createdAt: '2026-08-01T10:00:00Z',
      session: { id: 's1', state: 'connected', tunnelId: 't1', serverId: 'srv-1' },
    },
    {
      id: 'dev-2',
      name: 'Old Laptop',
      platform: 'linux',
      status: 'active',
      lastActiveAt: null,
      createdAt: '2026-07-01T10:00:00Z',
      session: null,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <Devices />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('Devices page', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue(devices);
    vi.mocked(api.del).mockReset().mockResolvedValue(undefined);
  });

  it('lists devices with platform and session status', async () => {
    renderPage();
    expect(await screen.findByText('Pixel 8')).toBeInTheDocument();
    expect(screen.getByText('Old Laptop')).toBeInTheDocument();
    expect(screen.getAllByText(/connected/i).length).toBeGreaterThan(0);
    expect(api.get).toHaveBeenCalledWith('/devices');
  });

  it('revokes a device after confirmation and shows the disconnect toast', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Pixel 8');
    const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
    await user.click(revokeButtons[0]!);
    // Confirmation dialog appears; cancel first to verify the guard.
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(api.del).not.toHaveBeenCalled();
    // Now confirm the revoke.
    await user.click(revokeButtons[0]!);
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Revoke device' }));
    await waitFor(() => expect(api.del).toHaveBeenCalledWith('/devices/dev-1'));
    await waitFor(() => expect(screen.getAllByText(/disconnect/i).length).toBeGreaterThan(0));
  });
});
