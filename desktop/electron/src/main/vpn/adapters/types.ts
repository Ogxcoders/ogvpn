import type { ShellCommand } from '../commands';

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export interface ExecOptions {
  /** Text piped to the child's stdin (e.g. conf content for `sudo tee`). */
  input?: string;
  /** Kill the child after this many ms. Elevated ops default high (UAC wait). */
  timeoutMs?: number;
}

export type ExecFn = (cmd: ShellCommand, opts?: ExecOptions) => Promise<ExecResult>;

export interface AdapterStatus {
  state: 'up' | 'down';
  /** Seconds since the latest handshake; null when none has occurred yet. */
  handshakeAgoSec: number | null;
  rxBytes: number;
  txBytes: number;
}

/**
 * Platform adapter around the official WireGuard implementation:
 *  - WindowsAdapter: wireguard-nt tunnel service (WireGuard for Windows).
 *  - UnixAdapter:    wg-quick on Linux and macOS (via sudo).
 */
export interface WireGuardAdapter {
  readonly interfaceName: string;
  /** True when the platform WireGuard tooling is installed and reachable. */
  isAvailable(): Promise<boolean>;
  /** Bring the tunnel up with the given wg-quick configuration text. */
  up(conf: string): Promise<void>;
  /** Tear the tunnel down. */
  down(): Promise<void>;
  /** Current status parsed from `wg show <if> dump`. */
  status(): Promise<AdapterStatus>;
  /** Sanitized (private-key-free) dump for the Diagnostics screen. */
  dumpSanitized(): Promise<string | null>;
}
