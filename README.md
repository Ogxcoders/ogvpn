# OGVPN — End-to-End VPN System

[![CI](https://github.com/Ogxcoders/ogvpn/actions/workflows/ci.yml/badge.svg)](https://github.com/Ogxcoders/ogvpn/actions/workflows/ci.yml)

A production-oriented, self-hostable VPN product: **Web + Android + Desktop +
Chrome extension + Backend/API + Database + VPN control plane + VPN server
infrastructure** — built, tested and released by GitHub Actions on every push.

Everything is one system: clients provision real WireGuard tunnels through the
backend control plane, the web panel manages the same database state, and
server events (revocation, disconnect, subscription changes) reach every
client in real time over SSE.

## Repository map

| Component | Path | Stack | CI artifact |
|---|---|---|---|
| Backend API + control plane | [`backend/`](backend/) | Node 22, TypeScript, Express 4, SQLite (better-sqlite3), JWT + rotating refresh, SSE | test report + boot smoke |
| Web control plane | [`web/`](web/) | Vite + React 18 + TypeScript SPA | production bundle |
| Android client | [`android/`](android/) | Kotlin 2.0, Jetpack Compose, VpnService + official wireguard-android GoBackend | debug/release **APK** + **AAB** |
| Desktop client | [`desktop/`](desktop/) | Electron + TypeScript, per-OS WireGuard (wireguard-nt / wg-quick) | NSIS installer / DMG / AppImage |
| VPN server infra | [`vpn-server/`](vpn-server/) | WireGuard + nftables install script + zero-dep Node agent | agent test report |
| Chrome extension | [`extension/`](extension/) | Manifest V3 service worker | packed ZIP |
| Product platform | [`platform/`](platform/) | Next.js 16 + Prisma/SQLite (billing, admin, support, analytics) | production build |
| Master checklist | [`docs/MASTER-CHECKLIST.md`](docs/MASTER-CHECKLIST.md) | 3,754 items with evidence tiers | CI integrity check |

## Master checklist — how status works

`docs/master-checklist.json` tracks **3,754 items** (3,689 base + 65 CI/CD+GitHub)
with one status per item:

```
NOT_STARTED → IMPLEMENTED → BUILT → AUTOMATED_TESTED → REAL_RUNTIME_TESTED → EVIDENCED
```

Rules enforced in this repository:

- **Source code is not proof of functionality. Compilation is not proof of correctness.**
- An item is PASS only at the **EVIDENCED** tier with a durable, linkable artifact
  (CI run URL, artifact, log, screenshot).
- No blanket pass counts — every item carries its own status and evidence list.
- CI fails if the checklist JSON is ever truncated or malformed
  (`tools/validate_checklist.py` runs on every push).

Current honest position (updated as CI runs complete):

| Tier | Meaning | Where we are |
|---|---|---|
| IMPLEMENTED | code exists in the repo | all components |
| BUILT | compiled/assembled by GitHub Actions | backend, web, extension, platform ✔ — Android & Desktop proven by CI runs (see Actions tab) |
| AUTOMATED_TESTED | suites pass in CI | backend 47, web 16, desktop 27, vpn-server agent 25, android unit tests |
| REAL_RUNTIME_TESTED | exercised against real devices/servers/networks | requires real hardware — see `docs/TESTING.md` for the honest per-matrix status |
| EVIDENCED | artifacts attached | every green CI run uploads artifacts |

## Quick start

### Backend + web control plane

```bash
cd backend
npm install
cp .env.example .env                  # set JWT_SECRET (openssl rand -base64 48)
npm run seed:demo                     # demo users/servers — NEVER in production
npm start                             # API on http://localhost:8080

# second terminal
cd web
npm install
npm run dev                           # http://localhost:5173 (proxies /api → :8080)
```

**Demo logins** (fixture data, demo environments ONLY): `demo@aegisvpn.local`,
`premium@aegisvpn.local`, `admin@aegisvpn.local`, `expired@aegisvpn.local`,
`new@aegisvpn.local` — password `DemoPass123`. The admin user unlocks
`/admin` in the web app.

### Android (real APK on your machine)

```bash
cd android && ./gradlew :app:assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk (installable, debug-signed)
```

Requirements: JDK 17, Android SDK (Android Studio handles this; the Gradle
wrapper is committed). Release/AAB: `:app:assembleRelease`, `:app:bundleRelease`
— add your own signing config before distributing (none is committed, by design).
First build notes, emulator↔host networking and the VPN consent flow are in
[`android/README.md`](android/README.md).

### Desktop

```bash
cd desktop
npm install
npm run dev       # Electron dev
npm run dist      # NSIS / DMG / AppImage via electron-builder
```

Per-OS WireGuard prerequisites and the kill-switch behavior are in
[`desktop/README.md`](desktop/README.md).

### VPN server (Debian 12 / Ubuntu 22.04+)

See [`vpn-server/README.md`](vpn-server/README.md): provision a host, create the
server row in the web admin panel, run `vpn-server/install-aegis-server.sh`,
paste the one-time agent token — the agent registers, heartbeats live metrics,
and applies peer add/remove ops via `wg set`.

### Chrome extension

Load `extension/` via `chrome://extensions` → Developer mode → "Load unpacked".

## CI/CD

Every push runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

| Job | Proves |
|---|---|
| `checklist` | the 3,754-item checklist JSON is intact and valid |
| `backend` | deps install, typecheck, 47 tests, live boot + `/api/health` smoke |
| `web` | typecheck, 16 tests, production build |
| `vpn-server-agent` | 25 agent tests (incl. command-injection rejection) |
| `extension` | syntax checks + packed ZIP |
| `android` | unit tests + debug APK + release APK + unsigned AAB |
| `desktop` (win/mac/linux matrix) | typecheck, 27 tests, renderer build, real installers |
| `platform` | Prisma schema push + Next.js production build |
| `security` | secret scanning (gitleaks) + dependency audit |

Tagged releases (`v*`) run [`release.yml`](.github/workflows/release.yml) and
attach correctly-named APK/AAB/installer/ZIP artifacts to a GitHub Release.

## Security notes

- No secrets are committed (`.env` is gitignored; `.env.example` holds placeholders).
- Demo credentials are fixtures for demo environments only.
- WireGuard private keys are generated **on-device** (Android/desktop); the
  backend stores public keys only.
- Rotate any credential that has ever been pasted into a chat, issue, or log.

## License

MIT for original code — the Android app links the GPL-2.0 wireguard-android
library and is therefore distributed under GPL-2.0 terms. Details:
[`LICENSE.md`](LICENSE.md).
