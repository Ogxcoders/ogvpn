# Testing Report — What Was Executed vs. What Requires Local Tooling

Environment: Linux x86_64 sandbox, Node v24.19.0, npm 11.17.0, Python 3.12,
Java present, **no Android SDK, no Android emulator, no macOS/Windows hosts,
no WireGuard-enabled root server**.

Per the master spec §63, everything below uses the mandated format. Nothing
is marked "Passed" that was not run.

---

## Backend (Node/TypeScript)

TEST: typecheck (tsc --noEmit)
STATUS: EXECUTED — PASS (0 errors)

TEST: unit + integration suite (vitest, 6 files)
STATUS: EXECUTED — PASS (47/47 tests)
COVERAGE: auth register/login/refresh-rotation/reuse-detection/logout/me;
password policy + change + forgot/reset; rate limiting (real 429s);
device list/rename/revoke (tokens killed, session closed, DEVICE_REVOKED 401,
plan device limits); servers list/detail w/ live load; peer provisioning
(key validation, IP allocation skipping gateway, duplicate-key 409,
maintenance-server 503, capacity 503, idempotency replay, rotate keeping
address, delete → remove_peer op queued); control plane (agent auth 401,
register→active, heartbeat returns ops, ack lifecycle, retry×5→dead,
handshake freshness → connected/reconnecting states, admin disable → force
disconnect); subscriptions (plans, simulated checkout labeled, cancel,
Stripe → 501, expired → free-tier limits, notification persisted); SSE
(live event delivery, 401 on bad token, durable notifications, metrics,
readiness).

TEST: live boot smoke test
STATUS: EXECUTED — PASS
PROCEDURE: `npm run seed:demo` → `npm start` → curl login as demo user →
GET /servers, /subscription/plans, /devices all returned seeded data.

---

## Web control plane (Vite/React/TypeScript)

TEST: typecheck (tsc --noEmit)
STATUS: EXECUTED — PASS

TEST: vitest + Testing Library (3 files)
STATUS: EXECUTED — PASS (16/16 tests)
COVERAGE: api client (bearer injection, error envelope → typed ApiError,
401 → refresh → single retry, refresh failure → session-expired event +
token wipe, network failure mapping); Login page (render, client
validation, submit shape, backend error display); Register (weak password
blocked client-side); AuthContext boot (anonymous / authenticated); Devices
(list, revoke with confirm dialog → DELETE + toast).

TEST: production build (vite build)
STATUS: EXECUTED — PASS (240 kB JS bundle, gzip 73 kB)

---

## Desktop (Electron + TypeScript)

TEST: typecheck main process (tsc -p tsconfig.main.json)
STATUS: EXECUTED — PASS

TEST: typecheck renderer (tsc -p tsconfig.renderer.json)
STATUS: EXECUTED — PASS

TEST: pure-logic suite (vitest, 4 files)
STATUS: EXECUTED — PASS (27/27 tests)
COVERAGE: state machine (happy path, disconnect, reconnect, illegal
transitions, resting states); x25519 key generation (44-char base64,
deterministic derivation, randomness); wg-quick conf builder (sections,
private key confinement to [Interface], defaults, IPv4-only servers,
invalid-key rejection); command builders (Windows tunnel service +
elevated PowerShell, unix wg-quick sudo argv, nftables/PF/netsh kill-switch
rule generation and removal, exact argv arrays); wg dump parsing (fixture
with never-handshaked peer, freshness math).

TEST: renderer production build (vite build)
STATUS: EXECUTED — PASS (185 kB JS bundle)

TEST: Electron GUI runtime (window, tray, IPC, real adapter execution)
STATUS: NOT EXECUTED
REASON: headless sandbox; no display server and no elevated WireGuard
tooling.
IMPLEMENTATION: COMPLETE
EXPECTED LOCAL COMMAND: `cd desktop && npm install && npm run dev`
EXPECTED RESULT: window opens; login against running backend; Connect with
WireGuard installed elevates via UAC/sudo and establishes a real tunnel.
REMAINING VALIDATION: real Windows/macOS/Linux desktop with WireGuard
installed.

---

## Android (Kotlin/Compose/wireguard-android)

TEST: Gradle build (assembleDebug)
STATUS: NOT EXECUTED
REASON: Android SDK unavailable in current environment.
IMPLEMENTATION: COMPLETE (28 Kotlin sources + full Gradle KTS setup +
committed wrapper jar)
EXPECTED LOCAL COMMAND: `cd android && ./gradlew :app:assembleDebug`
EXPECTED RESULT: app/build/outputs/apk/debug/app-debug.apk
REMAINING VALIDATION: Android SDK 35 + JDK 17 (see android/README.md
first-build checklist).

TEST: JVM unit tests (VpnStateMachineTest, DtoParsingTest, AegisApiTest)
STATUS: NOT EXECUTED (requires Android toolchain)
IMPLEMENTATION: COMPLETE
EXPECTED LOCAL COMMAND: `cd android && ./gradlew :app:testDebugUnitTest`
EXPECTED RESULT: 20 tests pass (state machine paths, DTO contract parsing,
Retrofit request shape via MockWebServer).

TEST: instrumented UI tests (LoginScreenTest, HomeScreenTest)
STATUS: NOT EXECUTED (requires emulator)
IMPLEMENTATION: COMPLETE
EXPECTED LOCAL COMMAND: `cd android && ./gradlew :app:connectedDebugAndroidTest`
EXPECTED RESULT: 3 tests pass on a running emulator.

TEST: real tunnel (VpnService consent, handshake, traffic, DNS, split
tunneling, network transitions, kill switch)
STATUS: NOT EXECUTED (requires physical device/emulator + live VPN server)
IMPLEMENTATION: COMPLETE — the tunnel is real (GoBackend over VpnService);
state derives from wireguard statistics, never fabricated.
REMAINING VALIDATION: follow android/README.md verification steps.

---

## VPN server infrastructure

TEST: agent logic suite (vitest, 25 tests)
STATUS: EXECUTED — PASS
COVERAGE: wg dump parsing (zero-handshake peers), allowed-ips composition,
command builders reject injection attempts ("x; rm -rf /"), cpu/ram math,
key/IP validators.

TEST: install script syntax (bash -n)
STATUS: EXECUTED — PASS

TEST: full server install + agent against a real WireGuard interface
STATUS: NOT EXECUTED
REASON: requires a root Debian/Ubuntu host with the wg kernel module.
IMPLEMENTATION: COMPLETE (install-aegis-server.sh + agent)
EXPECTED LOCAL COMMAND: `sudo ./vpn-server/install-aegis-server.sh` on a
fresh Debian 12/Ubuntu 22.04 host (see vpn-server/README.md)
EXPECTED RESULT: wg0 up, nftables NAT active, agent registered + heartbeating
to the backend, server flips to "active" in the control plane.
REMAINING VALIDATION: a disposable VPS.

---

## Summary counts

| Suite | Executed here | Result |
|---|---|---|
| backend vitest | 47 | all pass |
| web vitest + RTL | 16 | all pass |
| desktop vitest | 27 | all pass |
| vpn-server agent vitest | 25 | all pass |
| typechecks (backend/web/desktop×2) | 5 | all pass |
| production builds (web, desktop renderer) | 2 | pass |
| Android build/tests/GUI | 0 executed | source complete, commands documented |
| Electron GUI runtime | 0 executed | logic tested instead |
| VPN server live install | 0 executed | agent logic tested, script syntax-checked |
