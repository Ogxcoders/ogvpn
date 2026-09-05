/**
 * Windows adapter — drives the official wireguard-nt implementation shipped
 * with "WireGuard for Windows" (https://www.wireguard.com/install/).
 *
 * Prerequisite (documented in README): WireGuard for Windows must be installed.
 * It provides wireguard.exe (tunnel service manager) and wg.exe (status CLI).
 *
 * Flow:
 *  1. conf text is staged to a user-writable temp file,
 *  2. copied (elevated, one UAC prompt) to %PROGRAMDATA%\AegisVPN\tunnels\aegisvpn0.conf,
 *  3. `wireguard.exe /installtunnelservice <conf>` registers the wireguard-nt
 *     tunnel service (elevated). The interface is named after the conf basename
 *     → aegisvpn0.
 * Removal uses `/uninstalltunnelservice`. Status reads `wg.exe show aegisvpn0 dump`.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  WG_INTERFACE,
  WINDOWS_DEFAULT_WIREGUARD_DIR,
  buildWindowsElevatedPowerShell,
  buildWindowsInstallScript,
  buildWindowsStageConfCommand,
  buildWindowsStatusCommand,
  buildWindowsUninstallScript,
  buildWindowsWhereCommand
} from '../commands';
import type { ExecFn } from './types';
import type { AdapterStatus, WireGuardAdapter } from './types';
import { runShell } from './exec';
import { sanitizeWgDumpForDiagnostics, statusFromDump } from '../parseWgDump';
import { logger } from '../../lib/logger';

const ELEVATED_TIMEOUT_MS = 300_000; // leave room for the user to accept UAC
const STATUS_TIMEOUT_MS = 10_000;

export class WindowsAdapter implements WireGuardAdapter {
  readonly interfaceName = WG_INTERFACE;

  constructor(
    private readonly exec: ExecFn = runShell,
    private readonly programDataDir: string = process.env['PROGRAMDATA'] ?? 'C:\\ProgramData'
  ) {}

  private get confPath(): string {
    // buildWindowsTunnelConfPath is pure; import lazily to avoid cycles.
    const { buildWindowsTunnelConfPath } = require('../commands') as {
      buildWindowsTunnelConfPath: (dir: string) => string;
    };
    return buildWindowsTunnelConfPath(this.programDataDir);
  }

  private get stagedConfPath(): string {
    return path.join(os.tmpdir(), `aegisvpn-stage-${WG_INTERFACE}.conf`);
  }

  /** Resolve wireguard.exe: PATH first, then the default install directory. */
  private async resolveWireguardExe(): Promise<string> {
    try {
      const { stdout } = await this.exec(buildWindowsWhereCommand('wireguard.exe'));
      const first = stdout.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0);
      if (first) return first;
    } catch {
      // fall through to default location
    }
    const fallback = path.join(WINDOWS_DEFAULT_WIREGUARD_DIR, 'wireguard.exe');
    try {
      await fs.promises.access(fallback);
      return fallback;
    } catch {
      throw new Error(
        'wireguard.exe not found. Install WireGuard for Windows (wireguard-nt) first — see README.'
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.resolveWireguardExe();
      await this.exec(buildWindowsWhereCommand('wg.exe'));
      return true;
    } catch {
      try {
        const { buildWindowsStatusCommand } = require('../commands') as {
          buildWindowsStatusCommand: (iface: string) => { command: string; args: string[] };
        };
        await this.exec(buildWindowsStatusCommand(this.interfaceName), {
          timeoutMs: STATUS_TIMEOUT_MS
        });
        return true;
      } catch {
        return false;
      }
    }
  }

  async up(conf: string): Promise<void> {
    const wireguardExe = await this.resolveWireguardExe();
    const staged = this.stagedConfPath;
    await fs.promises.writeFile(staged, conf, 'utf8');
    try {
      // One elevated prompt: create tunnels dir + copy conf into ProgramData.
      await this.exec(buildWindowsStageConfCommand(staged, this.confPath), {
        timeoutMs: ELEVATED_TIMEOUT_MS
      });
      // Second elevated prompt: register + start the wireguard-nt tunnel service.
      await this.exec(
        buildWindowsElevatedPowerShell(buildWindowsInstallScript(wireguardExe, this.confPath)),
        { timeoutMs: ELEVATED_TIMEOUT_MS }
      );
    } finally {
      await fs.promises.unlink(staged).catch(() => undefined);
    }
  }

  async down(): Promise<void> {
    const wireguardExe = await this.resolveWireguardExe();
    try {
      await this.exec(
        buildWindowsElevatedPowerShell(buildWindowsUninstallScript(wireguardExe, this.confPath)),
        { timeoutMs: ELEVATED_TIMEOUT_MS }
      );
    } catch (err) {
      // Tolerate "service not installed" — verify via status before failing.
      const status = await this.status().catch(() => null);
      if (status === null || status.state === 'up') {
        logger.warn(`Windows tunnel uninstall failed: ${String(err)}`);
        throw err;
      }
    }
  }

  async status(): Promise<AdapterStatus> {
    try {
      const { stdout } = await this.exec(buildWindowsStatusCommand(this.interfaceName), {
        timeoutMs: STATUS_TIMEOUT_MS
      });
      return statusFromDump(stdout);
    } catch {
      return { state: 'down', handshakeAgoSec: null, rxBytes: 0, txBytes: 0 };
    }
  }

  async dumpSanitized(): Promise<string | null> {
    try {
      const { stdout } = await this.exec(buildWindowsStatusCommand(this.interfaceName), {
        timeoutMs: STATUS_TIMEOUT_MS
      });
      return sanitizeWgDumpForDiagnostics(stdout);
    } catch {
      return null;
    }
  }
}
