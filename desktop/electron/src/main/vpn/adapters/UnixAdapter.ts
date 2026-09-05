/**
 * Unix adapter (Linux + macOS) — drives the official wg-quick implementation
 * from wireguard-tools.
 *
 * Prerequisites (documented in README):
 *   Linux: `apt install wireguard-tools` (or distro equivalent)
 *   macOS: `brew install wireguard-tools`
 *   Passwordless sudo for the exact commands listed in scripts/aegisvpn-sudoers
 *   (otherwise the OS password prompt appears per operation).
 *
 * Flow:
 *  1. conf → /etc/wireguard/aegisvpn0.conf via `sudo tee` (stdin),
 *  2. up/down via `sudo wg-quick up|down aegisvpn0`,
 *  3. status via `wg show aegisvpn0 dump` (unprivileged; private key shows
 *     as "(hidden)" which the parser tolerates).
 */

import {
  WG_INTERFACE,
  buildUnixDownCommand,
  buildUnixStatusCommand,
  buildUnixUpCommand,
  buildUnixWhichCommand,
  buildUnixWriteConfCommand
} from '../commands';
import type { AdapterStatus, ExecFn, WireGuardAdapter } from './types';
import { runShell } from './exec';
import { sanitizeWgDumpForDiagnostics, statusFromDump } from '../parseWgDump';

const CONF_WRITE_TIMEOUT_MS = 30_000;
const UP_DOWN_TIMEOUT_MS = 60_000;
const STATUS_TIMEOUT_MS = 10_000;

export class UnixAdapter implements WireGuardAdapter {
  readonly interfaceName = WG_INTERFACE;

  constructor(private readonly exec: ExecFn = runShell) {}

  async isAvailable(): Promise<boolean> {
    try {
      await this.exec(buildUnixWhichCommand('wg'), { timeoutMs: 5_000 });
      await this.exec(buildUnixWhichCommand('wg-quick'), { timeoutMs: 5_000 });
      return true;
    } catch {
      return false;
    }
  }

  async up(conf: string): Promise<void> {
    await this.exec(buildUnixWriteConfCommand(), {
      input: conf,
      timeoutMs: CONF_WRITE_TIMEOUT_MS
    });
    await this.exec(buildUnixUpCommand(), { timeoutMs: UP_DOWN_TIMEOUT_MS });
  }

  async down(): Promise<void> {
    await this.exec(buildUnixDownCommand(), { timeoutMs: UP_DOWN_TIMEOUT_MS });
  }

  async status(): Promise<AdapterStatus> {
    try {
      const { stdout } = await this.exec(buildUnixStatusCommand(), {
        timeoutMs: STATUS_TIMEOUT_MS
      });
      return statusFromDump(stdout);
    } catch {
      return { state: 'down', handshakeAgoSec: null, rxBytes: 0, txBytes: 0 };
    }
  }

  async dumpSanitized(): Promise<string | null> {
    try {
      const { stdout } = await this.exec(buildUnixStatusCommand(), {
        timeoutMs: STATUS_TIMEOUT_MS
      });
      return sanitizeWgDumpForDiagnostics(stdout);
    } catch {
      return null;
    }
  }
}

/** Unknown platforms are rejected at controller construction time. */
export function createAdapterForPlatform(platform: NodeJS.Platform): WireGuardAdapter {
  switch (platform) {
    case 'win32':
      // Lazy require keeps Windows specifics out of unix-only processes.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { WindowsAdapter } = require('./WindowsAdapter') as { WindowsAdapter: new () => WireGuardAdapter };
      return new WindowsAdapter();
    case 'darwin':
    case 'linux':
      return new UnixAdapter();
    default:
      throw new Error(`Unsupported platform for AegisVPN: ${platform}`);
  }
}
