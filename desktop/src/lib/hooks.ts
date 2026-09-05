import { useCallback, useEffect, useRef, useState } from 'react';
import type { SubscriptionInfo } from '../../shared/ipc';
import { aegis, type AppEvent, type VpnStatusSnapshot } from './bridge';

/** Live VPN status snapshot pushed from the main process. */
export function useVpnStatus(): VpnStatusSnapshot | null {
  const [status, setStatus] = useState<VpnStatusSnapshot | null>(null);

  useEffect(() => {
    let alive = true;
    void aegis().status().then((s) => alive && setStatus(s));
    const off = aegis().onEvent((e: AppEvent) => {
      if (e.type === 'vpn-state') setStatus(e.snapshot);
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  return status;
}

/** Main-process event bus for notices / auth changes. */
export function useAppEvents(handlers: {
  onNotice?: (level: 'info' | 'warn' | 'error', message: string) => void;
  onForceLogout?: (reason: string) => void;
  onEntitlements?: (s: SubscriptionInfo | null) => void;
}): void {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const off = aegis().onEvent((e: AppEvent) => {
      if (e.type === 'notice' && ref.current.onNotice) ref.current.onNotice(e.level, e.message);
      if (e.type === 'force-logout' && ref.current.onForceLogout) ref.current.onForceLogout(e.reason);
      if (e.type === 'entitlements' && ref.current.onEntitlements) ref.current.onEntitlements(e.subscription);
    });
    return off;
  }, []);
}

/** Tiny toast area. */
export interface Toast {
  id: number;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export function useToasts(): {
  toasts: Toast[];
  push: (level: Toast['level'], message: string) => void;
  dismiss: (id: number) => void;
} {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((level: Toast['level'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, level, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);
  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  return { toasts, push, dismiss };
}
