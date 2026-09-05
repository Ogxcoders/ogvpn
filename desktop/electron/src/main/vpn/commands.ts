/**
 * Pure command builders for every shell interaction the desktop client
 * performs against the OS WireGuard implementations and the per-OS kill
 * switch mechanisms. Nothing here spawns a process — the adapters execute the
 * returned {command, args} pairs (see vpn/adapters/exec.ts), which keeps the
 * generated command lines unit-testable without elevation or a VPN stack.
 *
 * Windows : wireguard-nt via `wireguard.exe /installtunnelservice` (requires
 *           elevation — spawned through PowerShell Start-Process -Verb RunAs).
 * Linux   : wg-quick + nftables kill switch, through `sudo` (sudoers policy in
 *           scripts/aegisvpn-sudoers).
 * macOS   : wg-quick + PF kill switch, through `sudo`.
 */

export interface ShellCommand {
  readonly command: string;
  readonly args: string[];
}

/** Fixed tunnel interface name used on every platform. */
export const WG_INTERFACE = 'aegisvpn0';

// ---------------------------------------------------------------------------
// Windows (wireguard-nt)
// ---------------------------------------------------------------------------

export const WINDOWS_DEFAULT_WIREGUARD_EXE = 'wireguard.exe';
export const WINDOWS_DEFAULT_WIREGUARD_DIR = 'C:\\Program Files\\WireGuard';

/** Tunnel config path under %PROGRAMDATA%. Interface name == conf basename. */
export function buildWindowsTunnelConfPath(programDataDir: string): string {
  const root = programDataDir.replace(/[\\/]+$/, '');
  return `${root}\\AegisVPN\\tunnels\\${WG_INTERFACE}.conf`;
}

/** PowerShell -EncodedCommand payload: base64 of UTF-16LE script text. */
export function encodePowerShellCommand(script: string): string {
  return Buffer.from(script, 'utf16le').toString('base64');
}

/**
 * Wrap a PowerShell script so it runs inside ONE elevated process (single UAC
 * prompt). The outer, non-elevated powershell.exe receives a -Command string
 * containing only single quotes (safe to pass through spawn args); the actual
 * elevated script travels as a UTF-16LE base64 -EncodedCommand, which is
 * immune to Windows argument quoting pitfalls.
 */
export function buildWindowsElevatedPowerShell(script: string): ShellCommand {
  const encoded = encodePowerShellCommand(script);
  return {
    command: 'powershell.exe',
    args: [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile','-EncodedCommand','${encoded}'`
    ]
  };
}

/** Elevated script body: register the tunnel service with wireguard-nt. */
export function buildWindowsInstallScript(wireguardExe: string, confPath: string): string {
  return `& '${wireguardExe}' /installtunnelservice '${confPath}'`;
}

/** Elevated script body: remove the tunnel service. */
export function buildWindowsUninstallScript(wireguardExe: string, confPath: string): string {
  return `& '${wireguardExe}' /uninstalltunnelservice '${confPath}'`;
}

/** Elevated script body: stage the conf into %PROGRAMDATA%\AegisVPN\tunnels. */
export function buildWindowsStageConfScript(tmpPath: string, destPath: string): string {
  const dir = destPath.slice(0, destPath.lastIndexOf('\\'));
  return `New-Item -ItemType Directory -Force -Path '${dir}' | Out-Null; Copy-Item -Force -LiteralPath '${tmpPath}' -Destination '${destPath}'`;
}

/** Full elevated command: install tunnel service (wireguard-nt). */
export function buildWindowsInstallCommand(wireguardExe: string, confPath: string): ShellCommand {
  return buildWindowsElevatedPowerShell(buildWindowsInstallScript(wireguardExe, confPath));
}

/** Full elevated command: uninstall tunnel service. */
export function buildWindowsUninstallCommand(wireguardExe: string, confPath: string): ShellCommand {
  return buildWindowsElevatedPowerShell(buildWindowsUninstallScript(wireguardExe, confPath));
}

/** Full elevated command: copy staged conf to the ProgramData tunnels dir. */
export function buildWindowsStageConfCommand(tmpPath: string, destPath: string): ShellCommand {
  return buildWindowsElevatedPowerShell(buildWindowsStageConfScript(tmpPath, destPath));
}

/** `wg.exe show <if> dump` — parsed by parseWgDump.ts. */
export function buildWindowsStatusCommand(interfaceName: string = WG_INTERFACE): ShellCommand {
  return { command: 'wg.exe', args: ['show', interfaceName, 'dump'] };
}

/** Locate a binary on Windows PATH. */
export function buildWindowsWhereCommand(binary: string): ShellCommand {
  return { command: 'where.exe', args: [binary] };
}

// ---------------------------------------------------------------------------
// Unix (Linux + macOS) — wg-quick
// ---------------------------------------------------------------------------

export const UNIX_CONF_PATH = `/etc/wireguard/${WG_INTERFACE}.conf`;
export const UNIX_WG_QUICK = 'wg-quick';

/** Write the tunnel conf: `sudo tee <path>` — conf text is piped via stdin. */
export function buildUnixWriteConfCommand(confPath: string = UNIX_CONF_PATH): ShellCommand {
  return { command: 'sudo', args: ['tee', confPath] };
}

export function buildUnixRemoveConfCommand(confPath: string = UNIX_CONF_PATH): ShellCommand {
  return { command: 'sudo', args: ['rm', '-f', confPath] };
}

export function buildUnixUpCommand(interfaceName: string = WG_INTERFACE): ShellCommand {
  return { command: 'sudo', args: [UNIX_WG_QUICK, 'up', interfaceName] };
}

export function buildUnixDownCommand(interfaceName: string = WG_INTERFACE): ShellCommand {
  return { command: 'sudo', args: [UNIX_WG_QUICK, 'down', interfaceName] };
}

export function buildUnixStatusCommand(interfaceName: string = WG_INTERFACE): ShellCommand {
  return { command: 'wg', args: ['show', interfaceName, 'dump'] };
}

export function buildUnixWhichCommand(binary: string): ShellCommand {
  return { command: 'which', args: [binary] };
}

// ---------------------------------------------------------------------------
// Kill switch — Linux (nftables)
// ---------------------------------------------------------------------------

export const NFT_TABLE_NAME = 'aegisvpn_killswitch';
export const LINUX_KILL_SWITCH_RULES_PATH = '/etc/aegisvpn/killswitch.nft';

/**
 * Full nftables ruleset for the kill switch. While enforced, ALL outbound
 * traffic is dropped except:
 *   - loopback and the WireGuard interface itself,
 *   - DHCP/DHCPv6 (udp dport 67/68/546/547) so link-local addressing works,
 *   - NTP (udp dport 123),
 *   - the WireGuard handshake to the VPN server endpoint (v4 + optional v6).
 *
 * Scoped to table inet aegisvpn_killswitch so the rest of the system ruleset
 * is untouched. NOTE: actual enforcement depends on the OS nftables stack and
 * requires root; the automated tests cover the generated ruleset text, not
 * the kernel effect.
 */
export function buildNftablesRuleset(
  interfaceName: string,
  endpointIpV4: string,
  endpointPort: number,
  endpointIpV6: string | null
): string {
  const lines: string[] = [
    '# AegisVPN kill switch ruleset (generated by the AegisVPN desktop client).',
    '# Load with: sudo nft -f /etc/aegisvpn/killswitch.nft',
    '# Remove with: sudo nft delete table inet aegisvpn_killswitch',
    'table inet aegisvpn_killswitch {',
    '  chain output {',
    '    type filter hook output priority 0; policy drop;',
    '    ct state established,related accept',
    '    oifname "lo" accept',
    `    oifname "${interfaceName}" accept`,
    '    udp dport { 67, 68, 546, 547 } accept  # DHCP + DHCPv6',
    '    udp dport 123 accept  # NTP',
    `    ip daddr ${endpointIpV4} udp dport ${endpointPort} accept  # WireGuard handshake`
  ];
  if (endpointIpV6) {
    lines.push(`    ip6 daddr ${endpointIpV6} udp dport ${endpointPort} accept  # WireGuard handshake (v6)`);
  }
  lines.push('  }');
  lines.push('}');
  return `${lines.join('\n')}\n`;
}

export function buildLinuxEnsureRulesDirCommand(dir: string = '/etc/aegisvpn'): ShellCommand {
  return { command: 'sudo', args: ['mkdir', '-p', dir] };
}

/** Sequence: mkdir rules dir → tee ruleset (stdin) → nft -f. */
export function buildLinuxApplyKillSwitchCommands(
  rulesPath: string = LINUX_KILL_SWITCH_RULES_PATH
): ShellCommand[] {
  return [
    { command: 'sudo', args: ['tee', rulesPath] },
    { command: 'sudo', args: ['nft', '-f', rulesPath] }
  ];
}

export function buildLinuxRemoveKillSwitchCommands(): ShellCommand[] {
  return [{ command: 'sudo', args: ['nft', 'delete', 'table', 'inet', NFT_TABLE_NAME] }];
}

// ---------------------------------------------------------------------------
// Kill switch — macOS (PF anchor)
// ---------------------------------------------------------------------------

export const MACOS_PF_ANCHOR_PATH = '/etc/pf.anchors/com.aegisvpn.blockall';

/**
 * PF ruleset loaded while the kill switch is enforced.
 *
 * HONEST CAVEAT: macOS PF has no per-anchor enable flag for `block`, so the
 * client loads this ruleset as the *live* ruleset via `sudo pfctl -f <anchor>`
 * and restores the default ruleset (`sudo pfctl -f /etc/pf.conf`) on removal.
 * While enforced this temporarily replaces any user-customized PF rules; the
 * default /etc/pf.conf file on disk is never modified.
 */
export function buildPfAnchorRules(
  interfaceName: string,
  endpointIp: string,
  endpointPort: number
): string {
  const lines: string[] = [
    '# AegisVPN kill switch PF anchor (generated by the AegisVPN desktop client).',
    '# While enforced this is loaded as the live ruleset via: sudo pfctl -f <anchor>',
    '# Removal restores the default ruleset via: sudo pfctl -f /etc/pf.conf',
    'set skip on lo0',
    'block drop out all',
    `pass out on ${interfaceName} all`,
    `pass out proto udp to ${endpointIp} port ${endpointPort}`,
    'pass out proto udp to any port 67:68',
    'pass out proto udp to any port 123'
  ];
  return `${lines.join('\n')}\n`;
}

/** Sequence: tee anchor (stdin) → pfctl -f anchor → pfctl -E (enable pf). */
export function buildMacApplyKillSwitchCommands(
  anchorPath: string = MACOS_PF_ANCHOR_PATH
): ShellCommand[] {
  return [
    { command: 'sudo', args: ['tee', anchorPath] },
    { command: 'sudo', args: ['pfctl', '-f', anchorPath] },
    { command: 'sudo', args: ['pfctl', '-E'] }
  ];
}

export function buildMacRemoveKillSwitchCommands(): ShellCommand[] {
  return [{ command: 'sudo', args: ['pfctl', '-f', '/etc/pf.conf'] }];
}

// ---------------------------------------------------------------------------
// Kill switch — Windows (netsh advfirewall / WFP note)
// ---------------------------------------------------------------------------

export const WIN_KS_BLOCK_RULE = 'AegisVPN-KillSwitch-Block';
export const WIN_KS_ALLOW_TUNNEL_RULE = 'AegisVPN-KillSwitch-AllowTunnel';
export const WIN_KS_ALLOW_HANDSHAKE_RULE = 'AegisVPN-KillSwitch-AllowHandshake';
export const WIN_KS_ALLOW_DHCP_RULE = 'AegisVPN-KillSwitch-AllowDhcp';

export const WIN_KS_RULE_NAMES: readonly string[] = [
  WIN_KS_BLOCK_RULE,
  WIN_KS_ALLOW_TUNNEL_RULE,
  WIN_KS_ALLOW_HANDSHAKE_RULE,
  WIN_KS_ALLOW_DHCP_RULE
];

/**
 * Windows Firewall (WFP via netsh advfirewall) kill switch rules.
 *
 * HONEST CAVEAT: netsh advfirewall cannot scope a rule to a specific
 * interface. The practical approximation used here is:
 *   1. block ALL outbound,
 *   2. allow outbound sourced from the tunnel's local IP (= traffic inside
 *      the aegisvpn0 interface),
 *   3. allow the WireGuard handshake UDP flow to the server endpoint,
 *   4. allow DHCP.
 * A production-grade implementation would use the Windows Filtering Platform
 * callouts directly (as the official WireGuard for Windows client does);
 * this requires elevation and is documented in README.md.
 */
export function buildWindowsKillSwitchApplyCommands(params: {
  tunnelLocalIp: string;
  endpointIp: string;
  endpointPort: number;
}): ShellCommand[] {
  const base = ['advfirewall', 'firewall', 'add', 'rule'];
  return [
    {
      command: 'netsh',
      args: [...base, `name=${WIN_KS_BLOCK_RULE}`, 'dir=out', 'action=block']
    },
    {
      command: 'netsh',
      args: [
        ...base,
        `name=${WIN_KS_ALLOW_TUNNEL_RULE}`,
        'dir=out',
        'action=allow',
        `localip=${params.tunnelLocalIp}`
      ]
    },
    {
      command: 'netsh',
      args: [
        ...base,
        `name=${WIN_KS_ALLOW_HANDSHAKE_RULE}`,
        'dir=out',
        'action=allow',
        'protocol=UDP',
        `remoteip=${params.endpointIp}`,
        `remoteport=${String(params.endpointPort)}`
      ]
    },
    {
      command: 'netsh',
      args: [
        ...base,
        `name=${WIN_KS_ALLOW_DHCP_RULE}`,
        'dir=out',
        'action=allow',
        'protocol=UDP',
        'localport=68',
        'remoteport=67'
      ]
    }
  ];
}

export function buildWindowsKillSwitchRemoveCommands(): ShellCommand[] {
  const del = ['advfirewall', 'firewall', 'delete', 'rule'];
  return WIN_KS_RULE_NAMES.map((name) => ({
    command: 'netsh',
    args: [...del, `name=${name}`]
  }));
}

/** Join ShellCommands into a single PowerShell script body (one UAC prompt). */
export function buildWindowsScriptFromCommands(commands: readonly ShellCommand[]): string {
  return commands.map((c) => [c.command, ...c.args].join(' ')).join('; ');
}

/** Full elevated apply command for the Windows kill switch (single prompt). */
export function buildWindowsKillSwitchApplyElevatedCommand(params: {
  tunnelLocalIp: string;
  endpointIp: string;
  endpointPort: number;
}): ShellCommand {
  return buildWindowsElevatedPowerShell(
    buildWindowsScriptFromCommands(buildWindowsKillSwitchApplyCommands(params))
  );
}

/** Full elevated remove command for the Windows kill switch (single prompt). */
export function buildWindowsKillSwitchRemoveElevatedCommand(): ShellCommand {
  return buildWindowsElevatedPowerShell(
    buildWindowsScriptFromCommands(buildWindowsKillSwitchRemoveCommands())
  );
}
