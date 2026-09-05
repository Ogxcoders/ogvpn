import { describe, it, expect } from 'vitest';
import {
  buildWindowsTunnelConfPath,
  buildWindowsInstallCommand,
  buildWindowsInstallScript,
  buildWindowsUninstallScript,
  buildWindowsUninstallCommand,
  buildUnixUpCommand,
  buildUnixDownCommand,
  buildUnixStatusCommand,
  buildNftablesRuleset,
  buildLinuxApplyKillSwitchCommands,
  buildLinuxRemoveKillSwitchCommands,
  buildPfAnchorRules,
  buildMacApplyKillSwitchCommands,
  buildMacRemoveKillSwitchCommands,
  buildWindowsKillSwitchApplyCommands,
  buildWindowsKillSwitchRemoveCommands,
  buildWindowsKillSwitchApplyElevatedCommand,
  buildWindowsElevatedPowerShell,
  WG_INTERFACE,
} from '../electron/src/main/vpn/commands';
import { statusFromDump, parseWgDump } from '../electron/src/main/vpn/parseWgDump';
/** Build a wg dump fixture with handshake ages relative to test time. */
function makeFixture(nowSec: number): string {
  const pk = (n: string) => `${n}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=`;
  return [
    `aegisvpn0\t(hidden)\tXlZ2aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=\t51820\toff`,
    `${pk('peer1')}\t(none)\t203.0.113.10:51820\t0.0.0.0/0,::/0\t${nowSec - 30}\t1234567\t7654321\t25`,
    `${pk('peer2')}\t(none)\t(none)\t10.13.0.6/32\t0\t0\t0\t0`,
    `${pk('peer3')}\t(none)\t198.51.100.5:51821\t10.13.0.7/32\t${nowSec - 500}\t9999\t8888\t25`,
  ].join('\n');
}

const fixture = makeFixture(Math.floor(Date.now() / 1000));

describe('command builders (argv arrays, never shell strings)', () => {
  it('windows tunnel service install/uninstall', () => {
    const conf = buildWindowsTunnelConfPath('C:\\ProgramData');
    expect(conf).toBe('C:\\ProgramData\\AegisVPN\\tunnels\\aegisvpn0.conf');
    // The elevated command embeds the raw script as an EncodedCommand payload.
    expect(buildWindowsInstallScript('wireguard.exe', conf)).toContain('/installtunnelservice');
    expect(buildWindowsUninstallScript('wireguard.exe', conf)).toContain('/uninstalltunnelservice');
    const install = buildWindowsInstallCommand('wireguard.exe', conf);
    expect(install.command).toBe('powershell.exe');
    expect(install.args[2]).toBe('-Command');
    const uninstall = buildWindowsUninstallCommand('wireguard.exe', conf);
    expect(uninstall.command).toBe('powershell.exe');
  });

  it('unix wg-quick up/down/status use sudo + argv', () => {
    expect(buildUnixUpCommand()).toEqual({ command: 'sudo', args: ['wg-quick', 'up', WG_INTERFACE] });
    expect(buildUnixDownCommand()).toEqual({ command: 'sudo', args: ['wg-quick', 'down', WG_INTERFACE] });
    // Status runs unprivileged: `wg show` does not require root.
    const st = buildUnixStatusCommand();
    expect(st.command).toBe('wg');
    expect(st.args).toEqual(['show', WG_INTERFACE, 'dump']);
  });

  it('linux kill switch: apply via tee+nft, remove deletes the table', () => {
    const apply = buildLinuxApplyKillSwitchCommands();
    expect(apply[0]).toEqual({ command: 'sudo', args: ['tee', '/etc/aegisvpn/killswitch.nft'] });
    expect(apply[1]).toEqual({ command: 'sudo', args: ['nft', '-f', '/etc/aegisvpn/killswitch.nft'] });
    const remove = buildLinuxRemoveKillSwitchCommands();
    expect(remove[0]!.args.join(' ')).toContain('delete table inet aegisvpn_killswitch');
  });

  it('nftables ruleset allows only lo, the tunnel, DHCP/NTP and the endpoint', () => {
    const ruleset = buildNftablesRuleset(WG_INTERFACE, '203.0.113.10', 51820, '2001:db8::10');
    expect(ruleset).toContain('policy drop;');
    expect(ruleset).toContain('oifname "aegisvpn0" accept');
    expect(ruleset).toContain('ip daddr 203.0.113.10 udp dport 51820 accept');
    expect(ruleset).toContain('ip6 daddr 2001:db8::10 udp dport 51820 accept');
    expect(ruleset).toContain('udp dport { 67, 68, 546, 547 } accept');
  });

  it('macOS PF anchor + apply/remove sequences', () => {
    const anchor = buildPfAnchorRules(WG_INTERFACE, '203.0.113.10', 51820);
    expect(anchor).toContain('block drop out all');
    expect(anchor).toContain('pass out on aegisvpn0 all');
    const apply = buildMacApplyKillSwitchCommands();
    expect(apply.some((c) => c.args.join(' ').startsWith('pfctl -f'))).toBe(true);
    expect(buildMacRemoveKillSwitchCommands()[0]!.args).toEqual(['pfctl', '-f', '/etc/pf.conf']);
  });

  it('windows kill switch uses netsh rules and one elevated command', () => {
    const cmds = buildWindowsKillSwitchApplyCommands({ tunnelLocalIp: '10.13.0.5', endpointIp: '203.0.113.10', endpointPort: 51820 });
    expect(cmds.every((c) => c.command === 'netsh')).toBe(true);
    expect(cmds[0]!.args.join(' ')).toContain('action=block');
    expect(cmds[1]!.args.join(' ')).toContain('localip=10.13.0.5');
    expect(buildWindowsKillSwitchRemoveCommands().length).toBeGreaterThanOrEqual(4);
    const elevated = buildWindowsKillSwitchApplyElevatedCommand({ tunnelLocalIp: '10.13.0.5', endpointIp: '203.0.113.10', endpointPort: 51820 });
    expect(elevated.command).toBe('powershell.exe');
    expect(elevated.args.join(' ')).toContain('RunAs');
  });

  it('elevated helper wraps a PowerShell -Verb RunAs invocation', () => {
    const cmd = buildWindowsElevatedPowerShell('Write-Output hello');
    expect(cmd.command).toBe('powershell.exe');
    expect(cmd.args[2]).toBe('-Command');
    expect(cmd.args.join(' ')).toContain('RunAs');
  });
});

describe('wg show dump parsing', () => {
  it('parses the fixture into interface + peers', () => {
    const dump = parseWgDump(fixture);
    expect(dump.interface).not.toBeNull();
    expect(dump.interface!.listenPort).toBe(51820);
    expect(dump.peers.length).toBe(3);
  });

  it('computes handshake freshness and skips never-handshaked peers', () => {
    const now = Math.floor(Date.now() / 1000);
    const status = statusFromDump(fixture, now);
    expect(status.state).toBe('up');
    expect(status.handshakeAgoSec).not.toBeNull();
    expect(status.handshakeAgoSec!).toBeLessThan(180);
    // Peers without a handshake contribute no status, but are visible in raw dump.
    expect(parseWgDump(fixture).peers.some((p) => p.latestHandshake === 0)).toBe(true);
  });
});
