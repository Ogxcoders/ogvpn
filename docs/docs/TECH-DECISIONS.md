# Technology Decision Report

Per master spec §74 — every major choice justified on platform
compatibility, security, performance, maintenance, dependency health,
licensing, and implementation complexity. Nothing selected for fashion.

## ANDROID

- **Primary language**: **Kotlin 2.0.20**. First-class Android support, coroutines for structured concurrency, Compose compiler integration. Alternatives: Java (no coroutines/serialization ergonomics, more boilerplate); C++ (huge toolchain burden, no UI story); pure Rust app layer (immature Android UI, FFI overhead everywhere).
- **UI**: **Jetpack Compose** (BOM 2024.09) — declarative, state-driven, maps directly onto the state-machine state flow; Material 3.
- **Architecture**: unidirectional — UI → TunnelManager → pure `VpnStateMachine` → StateFlow → UI. Manual DI (`ServiceLocator`) instead of Hilt: a fresh-clone build must not depend on kapt/ksp processor version alignment; the graph is ~10 singletons and fully inspectable.
- **VPN API**: **Android `VpnService`** (system TUN interface, consent flow via `prepare()`, `onRevoke()` handling). This is the only genuine VPN API on Android; anything else is a proxy, not a VPN.
- **VPN engine**: **wireguard-android `tunnel` library (GoBackend)** — the official userspace WireGuard for Android (wireguard-go compiled to JNI .so). Chosen over: hand-rolled WireGuard in Kotlin (cryptographically irresponsible — Noise protocol, cookie MACs, key rotation must not be reimplemented); boringtun JNI (Cloudflare archive status/maintenance risk, would need our own JNI bridge); gotatun (younger, smaller audit surface). wireguard-android is maintained by the WireGuard upstream author, is used by the official app, and bundles prebuilt .so for arm64-v8a/armeabi-v7a/x86/x86_64.
- **Native layer**: the library's bundled Go runtime — we own zero native code.
- **Networking**: Retrofit + OkHttp + kotlinx-serialization (typed, interceptors for auth + single-flight refresh).
- **Storage**: EncryptedSharedPreferences (tokens + tunnel private keys), DataStore (settings). Private keys also live in the encrypted store, keyed per tunnel id.
- **Testing**: JUnit4 JVM tests for the pure state machine + DTOs + MockWebServer; Compose UI tests for instrumented runs.
- **Licensing note**: wireguard-android is GPL-2.0-only — the Android app must be GPL-compliant if distributed. Documented in the root README.

## DESKTOP

- **Primary language**: **TypeScript** (shared vocabulary with backend/web; typed shell + renderer).
- **UI shell**: **Electron 28**. Rejected alternatives, honestly evaluated:
  - *Rust shell (Tauri)*: lighter footprint, but the protocol engine is NOT in our code (we orchestrate the official WireGuard implementations per OS), so a Rust shell buys no security/performance where it matters and costs a Rust toolchain + a second language across the repo.
  - *Wails (Go)*: same argument + smaller ecosystem for tray/auto-update.
  - *Native per-OS UIs*: 3× the UI work for a personal-scale product.
  Electron's downsides (memory, bundle size) are acknowledged and acceptable for a control-plane UI; security is handled via `contextIsolation` + sandboxed renderer + strict IPC bridge — the renderer never sees tokens or keys.
- **Architecture**: main process owns VPN + tokens + settings + SSE; renderer is unprivileged React behind a documented `AegisBridge` IPC contract (`shared/ipc.ts`).
- **VPN API per OS**: Windows — **wireguard-nt** via `wireguard.exe /installtunnelservice` (official WireGuard for Windows, elevated, single UAC prompt via PowerShell `RunAs` + EncodedCommand); macOS/Linux — **wg-quick** over `sudo` (documented sudoers line). Status via `wg show <if> dump` parsed into AdapterStatus.
- **VPN engine**: official WireGuard implementations per OS. The alternative — embedding wireguard-go/boringtun ourselves — would require elevated daemons, custom TUN handling on 3 OSes, and would duplicate code that upstream already ships and supports. Orchestration keeps the crypto exactly where it is audited upstream.
- **Native integration**: none of our own; commands are built as argv arrays (never shell-concatenated), unit-tested, and executed with timeouts.
- **Storage**: `safeStorage`-encrypted tokens (DPAPI/Keychain/libsecret), JSON settings file, renderer localStorage not used for secrets.
- **Testing**: pure-module vitest suite (state machine, conf builder, command builders, keys, dump parsing); renderer typechecked + built. GUI runtime behavior requires a real desktop (documented).

## SHARED

- **VPN core**: deliberately NOT shared app code — the protocol lives in upstream implementations (wireguard-android on Android; official tools on desktop; kernel+wgctrl on servers). App-side shared vocabulary: the frozen API contract (docs/API-CONTRACT.md) + mirrored state-machine vocabularies (15 states, identical transition semantics, tested on both Kotlin and TypeScript).
- **Protocol**: WireGuard only. Modern, minimal, formally verified (Noise*), no legacy protocol baggage.
- **Configuration model**: client-side keypairs; backend provisions {serverPublicKey, endpoint, addresses, dns, mtu 1420, keepalive 25, allowedIps ::/0+0.0.0.0/0}. Desktop serializes to wg-quick conf; Android builds `com.wireguard.config.Config`.
- **Crypto**: Curve25519 keys only (x25519 via @noble/curves on desktop, com.wireguard.crypto on Android); ChaCha20-Poly1305 + BLAKE2s inside WireGuard (upstream).
- **Error model**: machine-readable codes (VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED, SERVER_UNAVAILABLE, UPSTREAM_TIMEOUT, SERVER_ERROR) with per-surface typed wrappers (VpnApiError on Android, ApiError on TS surfaces).
- **State machine**: formal 15-state vocabulary with event-driven transitions and failure paths, unit-tested on both platforms; UI may never show a state the machine did not produce.

## BACKEND

- **Language**: **Node.js 20+ / TypeScript strict**.
- **Framework**: **Express 4** — smallest stable surface that does the job; alternatives (Fastify: marginally faster, adds schema-duplication; NestJS: heavy DI ceremony for ~20 routes) rejected on complexity budget.
- **Database**: **SQLite via better-sqlite3** — zero external services for a self-hostable control plane, synchronous WAL engine is fast at this scale, hand-written SQL migrations are auditable (spec §39 demands migration/rollback auditability, which an ORM hides). Postgres migration path documented (the SQL is portable).
- **Realtime**: **SSE** (not WebSockets): one-way notifications fit the semantics (events are hints; clients re-fetch state), survive proxies, work with the same auth tokens, trivial on all four platforms.
- **Authentication**: JWT access tokens (HS256, 15 min, own auditable implementation — no transitive deps) + opaque rotating refresh tokens (256-bit, SHA-256 at rest, reuse detection nukes the family), scrypt password hashing (Node built-in, memory-hard). Rate limiting on auth + global default.
- **Control plane**: durable op-queue (`server_ops`) drained by per-server agent heartbeats — survives server outages, applies with retry×5 → dead + audit, argv-validated at both ends.

## INFRASTRUCTURE

- **VPN server OS**: Debian 12 / Ubuntu 22.04+ (WireGuard in mainline kernel).
- **WireGuard/control plane**: kernel module + `wg set` applied by the agent; provisioning via op-queue.
- **DNS**: server-provided resolver inside the tunnel prefix (10.x.y.1), pushed via client config.
- **Routing**: wg-quick / VpnService manage prefix + default routes; NAT via nftables masquerade.
- **Firewall**: nftables (Linux) — forwarding + NAT + optional kill-switch ruleset; kill switch on clients: nftables (Linux), PF anchor (macOS, with honest caveat), netsh/WFP rules (Windows).
- **Monitoring**: agent heartbeats (CPU/RAM/disk/tunnel count/transfer/handshake freshness) → server rows → load % in clients + admin stats; /health, /health/ready, /metrics on the backend; structured JSON logs everywhere with secret redaction.

## Dependencies audit summary

All runtime dependencies are mainstream, actively maintained, and license-compatible (MIT/Apache-2.0/ISC; the GPL exception is wireguard-android, flagged above). Zero-dep zones were created deliberately: JWT + refresh hashing (node:crypto), scrypt (node:crypto), SSE parsing (hand-rolled on OkHttp/undici), the server agent (node stdlib only). Full per-dependency table: docs/SECURITY-AUDIT.md §dependencies.
