# AegisVPN Desktop

Electron + TypeScript client for Windows, macOS and Linux. The main process
orchestrates the **official WireGuard implementations** per OS (wireguard-nt
tunnel service on Windows, `wg-quick` on macOS/Linux); the renderer is an
unprivileged React UI behind a strict IPC bridge — it never sees tokens,
private keys, or shell commands.

## Run

```bash
npm install
npm run dev        # Vite dev server + Electron
npm run typecheck  # both tsconfigs
npm test           # 27 pure-logic tests (state machine, conf builder,
                   # command builders, keys, wg dump parsing)
npm run build      # compile main + bundle renderer
npm run dist       # electron-builder: NSIS / DMG / AppImage (--dir default)
```

## WireGuard prerequisites

| OS | Requirement | Elevation |
|---|---|---|
| Windows 10/11 | [WireGuard for Windows](https://wireguard.com/install) installed (`wireguard.exe` on PATH or default dir) | single UAC prompt via PowerShell `RunAs` (EncodedCommand) for tunnel service + kill switch |
| macOS | `brew install wireguard-tools` | sudo; passwordless option below |
| Linux | `apt install wireguard-tools` (or distro equivalent) | sudo; passwordless option below |

### Optional passwordless elevation (macOS/Linux)

```
# /etc/sudoers.d/aegisvpn  (0440, via visudo -f)
youruser ALL=(root) NOPASSWD: /usr/bin/wg-quick, /usr/bin/wg, /usr/bin/tee /etc/wireguard/aegisvpn0.conf, /usr/bin/nft, /usr/sbin/pfctl
```
Scope it tighter in security-sensitive environments; the app only ever
invokes the commands built in `electron/src/main/vpn/commands.ts`.

## Kill switch (honest behavior)

- **Windows**: netsh WFP rules — block all outbound, allow only the tunnel
  interface + endpoint + DHCP. Removal deletes the four named rules.
- **Linux**: nftables `aegisvpn_killswitch` table (policy drop; allow lo,
  wg iface, DHCP/NTP, endpoint). `sudo nft delete table inet
  aegisvpn_killswitch` clears it.
- **macOS**: PF anchor loaded as the live ruleset — macOS has no per-anchor
  enable for block rules, so enforcement temporarily replaces user PF rules
  (documented caveat in `commands.ts`); removal restores `/etc/pf.conf`.
- The kill switch is applied **before** the tunnel comes up (fail-closed).
- OS-level enforcement alternative: keep the tunnel always-on via the OS
  (documented in Settings).

## Security model

- Tokens: OS keychain encryption via `safeStorage` (DPAPI/Keychain/libsecret)
  in userData; renderer never receives them.
- WireGuard private keys: generated in-process with x25519 (@noble/curves),
  held **in memory only** for the tunnel lifetime, never persisted, never
  logged; only the public key is uploaded.
- Diagnostics output is scrubbed of every 44-char base64 blob.
- Sandbox: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

## Auto-update

Deliberately **not** bundled (no feed configured in this build — pretending
otherwise would fake a security feature). Wire it in three steps: see
`electron/src/main/update/UpdateService.ts` and the Settings screen text.

## Known platform caveats

- macOS kill switch temporarily replaces the live PF ruleset (no per-anchor
  block enable in PF) — documented in `commands.ts` and shown in Settings.
- Linux tray icons vary by desktop environment; the app ships an empty
  template icon in dev and falls back gracefully.
- `close to tray` keeps the VPN up when the window closes; Quit lives in the
  tray menu and the app menu.
