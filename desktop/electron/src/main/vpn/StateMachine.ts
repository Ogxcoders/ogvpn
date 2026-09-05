/**
 * VPN state machine for the AegisVPN desktop client.
 *
 * Ports the state vocabulary shared with the backend contract:
 * IDLE / PREPARING / CONNECTING / HANDSHAKING / CONNECTED / RECONNECTING /
 * DISCONNECTING / DISCONNECTED / ERROR / OFFLINE / AUTH_REQUIRED /
 * VPN_PERMISSION_REQUIRED / SERVER_UNAVAILABLE / CONFIGURATION_ERROR
 *
 * This module is pure TypeScript (no electron imports) so it is unit-testable
 * in plain Node.
 */

import type { VpnState } from '../../../../shared/ipc';

export const VPN_STATES: readonly VpnState[] = [
  'IDLE',
  'PREPARING',
  'CONNECTING',
  'HANDSHAKING',
  'CONNECTED',
  'RECONNECTING',
  'DISCONNECTING',
  'DISCONNECTED',
  'ERROR',
  'OFFLINE',
  'AUTH_REQUIRED',
  'VPN_PERMISSION_REQUIRED',
  'SERVER_UNAVAILABLE',
  'CONFIGURATION_ERROR'
];

/**
 * Allowed transitions. Failure paths are explicit: any provisioning /
 * connection step may land in ERROR, OFFLINE (network), AUTH_REQUIRED (401
 * after refresh), VPN_PERMISSION_REQUIRED (elevation/sudo denied),
 * SERVER_UNAVAILABLE (server not active) or CONFIGURATION_ERROR (WireGuard
 * tooling missing), and each of those can be left via IDLE / retry paths.
 */
export const TRANSITIONS: Readonly<Record<VpnState, readonly VpnState[]>> = {
  IDLE: ['PREPARING', 'CONNECTING', 'AUTH_REQUIRED', 'ERROR', 'CONFIGURATION_ERROR', 'DISCONNECTED'],
  PREPARING: [
    'CONNECTING',
    'ERROR',
    'OFFLINE',
    'AUTH_REQUIRED',
    'SERVER_UNAVAILABLE',
    'CONFIGURATION_ERROR',
    'VPN_PERMISSION_REQUIRED',
    'DISCONNECTING',
    'IDLE'
  ],
  CONNECTING: [
    'HANDSHAKING',
    'ERROR',
    'DISCONNECTING',
    'OFFLINE',
    'VPN_PERMISSION_REQUIRED',
    'CONFIGURATION_ERROR',
    'SERVER_UNAVAILABLE',
    'CONNECTING'
  ],
  HANDSHAKING: ['CONNECTED', 'RECONNECTING', 'CONNECTING', 'DISCONNECTING', 'ERROR'],
  CONNECTED: ['CONNECTING', 'RECONNECTING', 'DISCONNECTING', 'ERROR', 'SERVER_UNAVAILABLE'],
  RECONNECTING: [
    'CONNECTING',
    'HANDSHAKING',
    'CONNECTED',
    'DISCONNECTING',
    'ERROR',
    'OFFLINE',
    'SERVER_UNAVAILABLE'
  ],
  DISCONNECTING: ['DISCONNECTED', 'ERROR'],
  DISCONNECTED: ['IDLE', 'PREPARING', 'CONNECTING'],
  ERROR: ['IDLE', 'DISCONNECTED', 'PREPARING', 'CONNECTING', 'DISCONNECTING'],
  OFFLINE: ['IDLE', 'CONNECTING', 'PREPARING', 'ERROR'],
  AUTH_REQUIRED: ['IDLE', 'PREPARING', 'CONNECTING'],
  VPN_PERMISSION_REQUIRED: ['IDLE', 'PREPARING', 'CONNECTING', 'ERROR'],
  SERVER_UNAVAILABLE: ['IDLE', 'PREPARING', 'CONNECTING', 'DISCONNECTED'],
  CONFIGURATION_ERROR: ['IDLE', 'PREPARING', 'CONNECTING', 'ERROR']
};

const RESTING_STATES: readonly VpnState[] = [
  'IDLE',
  'DISCONNECTED',
  'ERROR',
  'OFFLINE',
  'AUTH_REQUIRED',
  'VPN_PERMISSION_REQUIRED',
  'SERVER_UNAVAILABLE',
  'CONFIGURATION_ERROR'
];

/** States from which the user may start a new connection. */
export function isRestingState(state: VpnState): boolean {
  return RESTING_STATES.includes(state);
}

/** States in which a tunnel is (or may shortly be) live. */
export function isActiveState(state: VpnState): boolean {
  return state === 'CONNECTED' || state === 'HANDSHAKING' || state === 'RECONNECTING';
}

export type StateChangeListener = (from: VpnState, to: VpnState) => void;

export class IllegalTransitionError extends Error {
  constructor(readonly from: VpnState, readonly to: VpnState) {
    super(`Illegal VPN state transition: ${from} → ${to}`);
    this.name = 'IllegalTransitionError';
  }
}

export class StateMachine {
  private current: VpnState;
  private readonly listeners = new Set<StateChangeListener>();

  constructor(initial: VpnState = 'IDLE') {
    this.current = initial;
  }

  get state(): VpnState {
    return this.current;
  }

  can(next: VpnState): boolean {
    return TRANSITIONS[this.current].includes(next);
  }

  /**
   * Move to `next`. Throws IllegalTransitionError if the transition is not
   * allowed — callers should treat that as a programming error and use
   * `tryTransition` when a race may make the transition stale.
   */
  transition(next: VpnState): VpnState {
    if (!this.can(next)) {
      throw new IllegalTransitionError(this.current, next);
    }
    const from = this.current;
    this.current = next;
    for (const listener of this.listeners) {
      listener(from, next);
    }
    return next;
  }

  /** Like `transition` but returns null instead of throwing on illegal moves. */
  tryTransition(next: VpnState): VpnState | null {
    try {
      return this.transition(next);
    } catch {
      return null;
    }
  }

  onChange(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
