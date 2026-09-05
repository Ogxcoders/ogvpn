/**
 * Kill switch orchestration (real implementations, honestly documented).
 *
 * Linux   — nftables: a scoped `table inet aegisvpn_killswitch` ruleset with
 *           output policy drop (allow lo, the wg interface, DHCP/DHCPv6, NTP
 *           and the VPN handshake endpoint). Applied via `sudo nft -f`, removed
 *           via `sudo nft delete table`.
 * macOS   — PF anchor /etc/pf.anchors/com.aegisvpn.blockall loaded as the live
 *           ruleset via `sudo pfctl -f <anchor>`; removal restores
 *           /etc/pf.conf. The anchor file on disk is never edited.
 * Windows — netsh advfirewall outbound block + allow rules scoped by the
 *           tunnel's local IP (netsh cannot scope by interface; a production
 *           implementation would use WFP callouts — see commands.ts and README).
 *
 * All commands are built by the pure builders in vpn/commands.ts. The
 * automated tests cover those builders — the OS-level enforcement effect
 * itself is NOT covered by tests (it requires a live, elevated OS session).
 * Endpoint hostnames are resolved to IPs before rules are applied; a
 * resolution failure fails CLOSED (no kill switch, no tunnel).
 */

import * as dns from 'dns';
import * as net from 'net';
import {
  buildLinuxApplyKillSwitchCommands,
  buildLinuxEnsureRulesDirCommand,
  buildLinuxRemoveKillSwitchCommands,
  buildMacApplyKillSwitchCommands,
  buildMacRemoveKillSwitchCommands,
  buildNftablesRuleset,
  buildPfAnchorRules,
  buildWindowsKillSwitchApplyElevatedCommand,
  buildWindowsKillSwitchRemoveElevatedCommand
} from './commands';
import type { ExecFn } from './adapters/types';
import { runShell } from './adapters/exec';
import { logger } from '../lib/logger';

export interface KillSwitchParams {
  interfaceName: string;
  endpointHost: string;
  endpointPort: number;
  /** Tunnel's local IPv4 (used for the Windows netsh allow rule). */
  tunnelLocalIp: string;
}

export class KillSwitchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KillSwitchError';
  }
}

interface ResolvedEndpoint {
  v4: string;
  v6: string | null;
}

async function defaultResolveEndpoint(host: string): Promise<ResolvedEndpoint> {
  if (net.isIP(host) !== 0) {
    return net.isIP(host) === 6 ? { v4: host, v6: host } : { v4: host, v6: null };
  }
  const results = await dns.promises.lookup(host, { all: true, verbatim: true });
  const v4 = results.find((r) => r.family === 4)?.address;
  const v6 = results.find((r) => r.family === 6)?.address ?? null;
  if (!v4 && !v6) {
    throw new KillSwitchError(`Cannot resolve VPN endpoint host: ${host}`);
  }
  // nftables inet table wants an explicit family per rule; prefer v4 for the
  // primary handshake rule and add the v6 rule when available.
  return { v4: v4 ?? v6!, v6 };
}

export class KillSwitchManager {
  private activeParams: KillSwitchParams | null = null;

  constructor(
    private readonly exec: ExecFn = runShell,
    private readonly platform: NodeJS.Platform = process.platform,
    private readonly resolveEndpoint: (host: string) => Promise<ResolvedEndpoint> = defaultResolveEndpoint
  ) {}

  isActive(): boolean {
    return this.activeParams !== null;
  }

  get params(): KillSwitchParams | null {
    return this.activeParams;
  }

  /**
   * Enforce the kill switch. Must be called BEFORE bringing the tunnel up so
   * no traffic can leak during the handshake. Fails closed: any error leaves
   * the system without a kill switch and without a tunnel.
   */
  async apply(params: KillSwitchParams): Promise<void> {
    if (this.activeParams) {
      await this.remove();
    }
    const endpoint = await this.resolveEndpoint(params.endpointHost).catch((err) => {
      throw err instanceof KillSwitchError
        ? err
        : new KillSwitchError(`Cannot resolve VPN endpoint host: ${params.endpointHost}`);
    });

    const elevatedTimeout = { timeoutMs: 300_000 };
    const sudoTimeout = { timeoutMs: 30_000 };

    switch (this.platform) {
      case 'linux': {
        const ruleset = buildNftablesRuleset(
          params.interfaceName,
          endpoint.v4,
          params.endpointPort,
          endpoint.v6
        );
        await this.exec(buildLinuxEnsureRulesDirCommand(), sudoTimeout);
        const [tee, apply] = buildLinuxApplyKillSwitchCommands();
        await this.exec(tee, { ...sudoTimeout, input: ruleset });
        await this.exec(apply, sudoTimeout);
        break;
      }
      case 'darwin': {
        const anchor = buildPfAnchorRules(params.interfaceName, endpoint.v4, params.endpointPort);
        const [tee, load, enable] = buildMacApplyKillSwitchCommands();
        await this.exec(tee, { ...sudoTimeout, input: anchor });
        await this.exec(load, sudoTimeout);
        await this.exec(enable, sudoTimeout);
        break;
      }
      case 'win32': {
        // netsh needs IPs; if the endpoint is v6-only fall back to the v6
        // literal for the allow rule.
        await this.exec(
          buildWindowsKillSwitchApplyElevatedCommand({
            tunnelLocalIp: params.tunnelLocalIp,
            endpointIp: endpoint.v4,
            endpointPort: params.endpointPort
          }),
          elevatedTimeout
        );
        break;
      }
      default:
        throw new KillSwitchError(`Kill switch is not supported on ${this.platform}`);
    }

    this.activeParams = params;
    logger.info(`Kill switch applied (${this.platform}) for ${params.interfaceName}`);
  }

  /** Best-effort removal; never throws (used during teardown/quit). */
  async remove(): Promise<void> {
    if (!this.activeParams) {
      return;
    }
    const elevatedTimeout = { timeoutMs: 300_000 };
    const sudoTimeout = { timeoutMs: 30_000 };
    try {
      switch (this.platform) {
        case 'linux': {
          const [remove] = buildLinuxRemoveKillSwitchCommands();
          await this.exec(remove, sudoTimeout);
          break;
        }
        case 'darwin': {
          const [restore] = buildMacRemoveKillSwitchCommands();
          await this.exec(restore, sudoTimeout);
          break;
        }
        case 'win32': {
          await this.exec(buildWindowsKillSwitchRemoveElevatedCommand(), elevatedTimeout);
          break;
        }
        default:
          break;
      }
      logger.info('Kill switch removed');
    } catch (err) {
      logger.error(`Kill switch removal failed (will retry on next apply): ${String(err)}`);
    } finally {
      this.activeParams = null;
    }
  }
}
