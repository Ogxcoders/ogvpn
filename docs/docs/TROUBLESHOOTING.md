# Troubleshooting

## Backend

**`JWT_SECRET is required`** — copy `.env.example` to `.env`, set
`JWT_SECRET=$(openssl rand -base64 48)`.

**`npm run seed:demo` says "Database already contains users"** — the seed
refuses to run over existing data. Use a separate file:
`DATABASE_PATH=./data/demo.db npm run seed:demo` (that's also what the
README quick start assumes).

**Login returns 429 after ~10 attempts** — that's the auth rate limiter.
Raise `RATE_AUTH_MAX` in `.env` for load testing.

**Web panel can't reach the API** — the Vite dev server proxies `/api` to
`http://localhost:8080`; make sure the backend is running, or set
`VITE_API_BASE` when building for a remote API.

## Android

**`./gradlew` says "Permission denied"** — `chmod +x gradlew` (zip tools
sometimes drop the bit).

**`Failed to resolve com.wireguard.android:tunnel:1.0.20231018`** — pick the
latest `1.0.x` on Maven Central and update `app/build.gradle.kts`.

**`GoBackend.setVpnServiceCreator` unresolved** — your library version moved
the API. `AegisApplication.kt` is the single glue file; the
`NoSuchMethodError` fallback already keeps the app working with the library's
default creator. See the wireguard-android README "GoBackend integration".

**App builds but login fails on emulator** — the debug build targets
`http://10.0.2.2:8080` (host loopback). Is the backend running on the host?
On a physical device use your LAN IP and add it to
`app/src/debug/res/xml/network_security_config.xml`.

**Connect does nothing / no consent dialog** — the system VPN consent Intent
is returned by `TunnelManager.connect()` and surfaced through
`MainActivity`; make sure you tapped Connect (not just Select) and no other
VPN app holds the slot (Settings → VPN).

**"Always-on VPN" conflicts** — if Android shows "VPN app already running",
disable the other VPN or enable Always-on for AegisVPN instead.

## Desktop

**Electron fails to start on Linux (sandbox error)** — run with
`--no-sandbox` only inside containers without user namespaces; on real
desktops keep the sandbox.

**"WireGuard tooling not found"** — install the official WireGuard
(Windows: wireguard.com/install; macOS/Linux: `apt install wireguard-tools` /
`brew install wireguard-tools`).

**wg-quick asks for a password every connect (macOS/Linux)** — that's the
sudo elevation. To go passwordless, install the documented sudoers line from
`desktop/README.md` (restrict it to the exact wg-quick/wg commands).

**Windows UAC prompt appears twice** — one prompt covers tunnel service
install and kill-switch rules via a single PowerShell RunAs; if you see two,
your Windows version is starting the app twice (disable auto-launch in
Settings).

**Kill switch leaves the network blocked after a crash** — removal is
best-effort on teardown; to clear manually:
Linux `sudo nft delete table inet aegisvpn_killswitch`; macOS
`sudo pfctl -f /etc/pf.conf`; Windows remove the `AegisVPN-KillSwitch-*`
rules in Windows Firewall.

## VPN server

**Agent logs `403 forbidden … not pre-provisioned`** — create the server row
in the web admin panel FIRST, then paste its one-time agent token into
`/etc/aegisvpn/agent.env` and `systemctl restart aegis-agent`.

**Server stays "offline" in the panel** — check `systemctl status
aegis-agent`, the backend URL in agent.env (must be reachable from the
server), and that the agent token matches the row.

**Peer added but no internet through tunnel** — verify on the server:
`wg show wg0` (handshake recent?), `sysctl net.ipv4.ip_forward`,
`nft list ruleset | grep masquerade`. The install script sets all three.

## Repo-level

**Vitest: "Invalid PostCSS Plugin"** — every component config pins
`css.postcss.plugins: []` so nothing is inherited from parent directories;
if you reorganize, keep that pin.
