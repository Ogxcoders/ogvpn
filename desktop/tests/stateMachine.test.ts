import { describe, it, expect } from 'vitest';
import { StateMachine, TRANSITIONS, isRestingState, isActiveState } from '../electron/src/main/vpn/StateMachine';

describe('desktop VPN state machine', () => {
  it('walks the happy connect path', () => {
    const m = new StateMachine('IDLE');
    const path = ['PREPARING', 'CONNECTING', 'HANDSHAKING', 'CONNECTED'] as const;
    for (const next of path) {
      expect(m.can(next)).toBe(true);
      m.transition(next);
    }
    expect(m.state).toBe('CONNECTED');
  });

  it('walks the disconnect path from CONNECTED', () => {
    const m = new StateMachine('CONNECTED');
    m.transition('DISCONNECTING');
    m.transition('DISCONNECTED');
    m.transition('IDLE');
    expect(m.state).toBe('IDLE');
  });

  it('rejects illegal transitions with a typed error', () => {
    const m = new StateMachine('IDLE');
    expect(() => m.transition('CONNECTED')).toThrow(/Illegal VPN state transition/);
    expect(m.state).toBe('IDLE');
  });

  it('tryTransition returns null instead of throwing', () => {
    const m = new StateMachine('IDLE');
    expect(m.tryTransition('CONNECTED')).toBeNull();
    expect(m.tryTransition('PREPARING')).toBe('PREPARING');
    expect(m.state).toBe('PREPARING');
  });

  it('never shows CONNECTED from a resting failure state without a connect path', () => {
    for (const resting of ['ERROR', 'SERVER_UNAVAILABLE', 'CONFIGURATION_ERROR', 'AUTH_REQUIRED', 'DISCONNECTED', 'OFFLINE'] as const) {
      const m = new StateMachine(resting);
      expect(m.can('CONNECTED')).toBe(false);
    }
  });

  it('handles reconnect: CONNECTED → RECONNECTING → CONNECTING → HANDSHAKING → CONNECTED', () => {
    const m = new StateMachine('CONNECTED');
    m.transition('RECONNECTING');
    m.transition('CONNECTING');
    m.transition('HANDSHAKING');
    m.transition('CONNECTED');
    expect(m.state).toBe('CONNECTED');
  });

  it('classify helpers agree with the transition table', () => {
    for (const state of Object.keys(TRANSITIONS) as (keyof typeof TRANSITIONS)[]) {
      const nexts = TRANSITIONS[state];
      expect(Array.isArray(nexts)).toBe(true);
      expect(nexts.length).toBeGreaterThan(0);
    }
    expect(isRestingState('IDLE')).toBe(true);
    expect(isRestingState('CONNECTED')).toBe(false);
    expect(isActiveState('CONNECTED')).toBe(true);
    expect(isActiveState('IDLE')).toBe(false);
  });

  it('notifies listeners on every change', () => {
    const m = new StateMachine('IDLE');
    const seen: string[] = [];
    const off = m.onChange((from, to) => seen.push(`${from}->${to}`));
    m.transition('PREPARING');
    m.transition('CONNECTING');
    off();
    m.transition('HANDSHAKING');
    expect(seen).toEqual(['IDLE->PREPARING', 'PREPARING->CONNECTING']);
  });
});
