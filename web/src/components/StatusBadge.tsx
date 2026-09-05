import { humanize } from '../lib/format';

export type BadgeTone = 'success' | 'warn' | 'danger' | 'muted' | 'primary';

/*
 * Status → color map per design spec:
 *   success: active, connected
 *   warn:    maintenance, drain, reconnecting, canceled, waiting, open
 *   danger:  offline, revoked, failed, expired, past_due, disabled, deleted
 *   primary: premium, admin
 *   muted:   everything else (free, closed, user, retired, …)
 */
const TONE_MAP: Record<string, BadgeTone> = {
  active: 'success',
  connected: 'success',
  resolved: 'success',
  maintenance: 'warn',
  drain: 'warn',
  reconnecting: 'warn',
  canceled: 'warn',
  waiting: 'warn',
  open: 'warn',
  offline: 'danger',
  revoked: 'danger',
  failed: 'danger',
  expired: 'danger',
  past_due: 'danger',
  disabled: 'danger',
  deleted: 'danger',
  premium: 'primary',
  admin: 'primary',
};

export function statusTone(status: string): BadgeTone {
  return TONE_MAP[status.toLowerCase()] ?? 'muted';
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = statusTone(status);
  return (
    <span className={`badge badge-${tone}`}>
      <span className="dot" aria-hidden="true" />
      {label ?? humanize(status)}
    </span>
  );
}
