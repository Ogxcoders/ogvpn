import type {
  AegisBridge,
  AppEvent,
  DeviceSummary,
  LoginRequest,
  RegisterRequest,
  ServerInfo,
  SettingsMap,
  SubscriptionInfo,
  TunnelInfo,
  VpnStatusSnapshot,
} from '../../shared/ipc';

declare global {
  interface Window {
    aegis: AegisBridge;
  }
}

export const aegis = (): AegisBridge => window.aegis;

export type * from '../../shared/ipc';
export type {
  AegisBridge,
  AppEvent,
  DeviceSummary,
  LoginRequest,
  RegisterRequest,
  ServerInfo,
  SettingsMap,
  SubscriptionInfo,
  TunnelInfo,
  VpnStatusSnapshot,
};

export function formatBytes(n: number): string {
  if (!Number.isFinite(n)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${v.toFixed(v >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}

export function formatDuration(since: string | null): string {
  if (!since) return '—';
  const secs = Math.max(0, Math.floor((Date.now() - Date.parse(since)) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** Client-side mirrors of the backend validation rules. */
export function passwordPolicyErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push('at least 10 characters');
  if (!/[a-zA-Z]/.test(password)) errors.push('at least one letter');
  if (!/[0-9]/.test(password)) errors.push('at least one digit');
  return errors;
}

export function emailError(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
  return null;
}
