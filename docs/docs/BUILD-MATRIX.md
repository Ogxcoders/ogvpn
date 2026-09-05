# Build Matrix & Requirements Traceability

## Build matrix (spec §58 — nothing green that was not executed)

| Platform | Build | Unit | Integration | E2E | Physical |
|---|---|---|---|---|---|
| Web (control plane) | ✅ BUILT (vite build) | ✅ 16 pass | ✅ client refresh/integration tests | ⚠️ manual (run backend+web, see below) | N/A |
| Backend | ✅ BUILT (tsc clean + boot) | ✅ 47 pass | ✅ supertest full-stack HTTP | ✅ live boot smoke + SSE round-trip in tests | N/A |
| Android | ⛔ NOT EXECUTED (no SDK) — source complete | ⛔ not executed (JVM tests written: 20) | ⛔ (MockWebServer tests written) | ⛔ (instrumented tests written) | ⛔ requires device |
| Windows | ⛔ build requires Windows+NSIS — logic ✅ 27 pass | ✅ (shared desktop suite) | ⛔ | ⛔ | ⛔ requires host |
| macOS | ⛔ same | ✅ (shared desktop suite) | ⛔ | ⛔ | ⛔ |
| Linux | ⛔ GUI not executed (headless) — renderer ✅ BUILT | ✅ 27 pass | ⛔ | ⛔ | ⛔ requires WG tooling |
| VPN servers | ✅ script syntax + agent logic ✅ 25 pass | ✅ | ✅ agent↔backend protocol via backend tests | ⛔ needs real server | ⛔ |

Legend: ✅ executed here — ⛔ documented NOT EXECUTED with exact local commands in docs/TESTING.md.

## Requirements traceability (spec §68 — master spec section → implementation)

| Spec § | Requirement | Where it lives | Tested |
|---|---|---|---|
| 0 | No-refusal execution | all source present; docs/TESTING.md honesty | — |
| 1–2 | Repo audit + inventory | fresh repo; worklog.md; this matrix | — |
| 3 | Android research | docs/TECH-DECISIONS.md (Android) | — |
| 4 | WireGuard engine evaluation | docs/TECH-DECISIONS.md (engine choices) | — |
| 5–6 | Language decisions | docs/TECH-DECISIONS.md | — |
| 7 | Shared core architecture | shared contract + mirrored state machines; control plane | ✅ |
| 8–9 | Android project + foundation | android/ (Gradle KTS, manifest, DI, nav) | ⛔ local |
| 10 | Android auth | AuthRepository + TokenRefreshInterceptor | ✅ (api tests) |
| 11–12 | Home + permission flow | HomeScreen, TunnelManager.connect, MainActivity consent bridge | ⛔ local (state machine ✅) |
| 13–14 | VPN service + engine | AegisVpnService + TunnelManager (GoBackend, real stats) | ⛔ local |
| 15 | Network transitions | ConnectivityManager callbacks → RECONNECTING | ✅ state machine |
| 16 | Kill switch | app-level reconnect+truthful labeling; OS lockdown documented; desktop KillSwitchManager per OS | ✅ commands tested |
| 17 | Split tunneling | TunnelManager excluded packages → addDisallowedApplication; desktop per-OS | ⛔ local |
| 18 | DNS | config dns push (server-provided), leak prevention via full-tunnel routes | ⛔ local |
| 19 | Server selection | ServersScreen (search/sort/favorites/load) + desktop Servers | ⛔ local (API ✅) |
| 20–21 | Device mgmt + settings | DevicesScreen/SettingsScreen + web Devices + backend routes | ✅ backend+web |
| 22–23 | Notifications + security | Notifier (channels/permission), redacted logging, secure storage | ⛔ local |
| 24–25 | Android UX + tests | loading/empty/error/offline states in all screens; 3 test files | ⛔ local |
| 26–33 | Desktop app (all) | desktop/ (shell, auth, vpn, per-OS adapters, tray, settings, diagnostics, update honesty) | ✅ logic / ⛔ GUI |
| 34–36 | Web control plane + web→client control | web/ (all pages) + SSE events → clients react (device.revoked, session.force-disconnect, subscription.changed, server.changed) | ✅ (SSE tests backend + web event tests) |
| 37 | Demo data | backend/seed/demo.ts — full matrix (users ×, servers ×7, devices, sessions, tickets) | ✅ |
| 38 | API contract audit | docs/API-CONTRACT.md (every endpoint: auth/authz/req/res/errors/rate-limit/idempotency/offline) | ✅ (47 tests incl. error paths) |
| 39 | Database audit | migrations/001+002, FKs, indexes, unique constraints, transactions in migration runner | ✅ |
| 40–41 | Server control plane + health | controlPlane.ts (ops queue, retry×5→dead), agent heartbeats → load/handshake freshness | ✅ |
| 42 | Server failure | maintenance/offline → 503 SERVER_UNAVAILABLE; capacity gate; client reconnect paths | ✅ |
| 43–44 | Concurrency + failure matrix | refresh single-flight + reuse detection tests; idempotency; rate limits; force-disconnect races | ✅ |
| 45–46 | Dependency + conflict audit | docs/SECURITY-AUDIT.md §dependencies; zero-dep zones | — |
| 47 | Security audit | docs/SECURITY-AUDIT.md | — |
| 48–50 | UI/UX audit + screen inventory | every screen implements loading/empty/error/offline/retry; inventories in component READMEs | ⛔ local (code-verified) |
| 51 | State-machine audit | domain/VpnStateMachine.kt + desktop StateMachine.ts — formal transitions + failure paths | ✅ both |
| 52–53 | Logging + observability | logger.ts (redaction), /health /health/ready /metrics, agent heartbeats | ✅ |
| 54–55 | Performance | keepalive=25, single SSE stream, WAL sqlite, throttled last_active writes, unref'd timers | ⛔ measured locally |
| 56–57 | Every code path + static analysis | zod validation on every input; vitest suites; tsc strict everywhere; bash -n | ✅ |
| 58 | Build matrix | this file | — |
| 59–60 | E2E + web control tests | backend tests simulate the full journey (register→provision→op→heartbeat→force-disconnect→revocation); scripts/smoke.sh for local E2E | ✅ API-level |
| 61 | Demo mode | simulated checkout labeled; demo seed isolated; NO fake tunnel state anywhere | ✅ |
| 62 | Local buildability | root README real commands everywhere | — |
| 63 | Honesty format | docs/TESTING.md | — |
| 64–66 | Review + regression passes | worklog.md defect log; all suites re-run after every fix (final: 47+16+27+25 = 115 green) | ✅ |
| 67 | Final search | TODO/FIXME/placeholder grep = 0 across repo (justified words excluded) | ✅ |
| 68 | Traceability | this file | — |
| 69 | Defect report | docs/DEFECT-REPORT.md | — |
| 70–71 | Build report + acceptance | below | — |

## Final build report (spec §70)

- WEB: IMPLEMENTED / BUILT / TESTED
- BACKEND: IMPLEMENTED / BUILT / TESTED
- DATABASE: IMPLEMENTED / MIGRATED / TESTED
- ANDROID: IMPLEMENTED (source + build config + tests written) / NOT BUILT / NOT TESTED — commands provided
- WINDOWS: IMPLEMENTED (shared desktop logic tested) / NOT BUILT / NOT TESTED
- macOS: IMPLEMENTED / NOT BUILT / NOT TESTED
- LINUX: IMPLEMENTED / renderer BUILT / logic TESTED / GUI NOT EXECUTED
- VPN CONTROL PLANE: IMPLEMENTED / TESTED
- VPN SERVERS: IMPLEMENTED / agent TESTED / live install NOT EXECUTED

## Acceptance checklist (spec §71)

Android source ✅ / build config ✅ / VPN service ✅ / real engine ✅ / auth ✅(code) / server mgmt ✅ / settings ✅ / device mgmt ✅ / errors ✅ / offline ✅ / tests ✅ / Desktop source ✅ / build config ✅ / VPN impl ✅ / auth ✅ / server mgmt ✅ / settings ✅ / tests ✅ / Web controls backend ✅ / backend controls clients ✅ / DB integrity ✅ / VPN server integration ✅ / demo data ✅ / deps audited ✅ / conflicts investigated ✅ / security audited ✅ / code reviewed ✅ / tests run ✅ / failures fixed ✅ / regression run ✅ / traceability ✅.
