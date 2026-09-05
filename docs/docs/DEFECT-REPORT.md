# Defect Report

Defects discovered during the build/test/fix loop (spec §69), all FIXED and
regression-tested. Final suite state: 115/115 green.

## FIXED

| ID | Severity | Platform | Description | Root cause | Fix | Regression test |
|---|---|---|---|---|---|---|
| D-01 | HIGH | Backend | Rate limits never applied from env overrides in tests → false 429s | `intEnv()` read `process.env` instead of the passed env object | `intEnv(env, name, def)`; all limits now honor env | auth suite incl. dedicated 429 test (tight limiter) |
| D-02 | CRITICAL | Backend | Closing one test server's DB killed sibling servers ("database connection is not open") | module-level singleton in db.ts | per-instance connections + registry; `closeDatabase(db)` targets one | whole suite (parallel isolation) |
| D-03 | HIGH | Backend | `GET /api/v1/auth/me` missing (contract §auth) → 404 | route never written | implemented with user+subscription+device; contract-faithful | auth tests: me + tampered-token 401 |
| D-04 | HIGH | Backend | password-change callable without auth | missing requireAuth on route | requireAuth added | password-change invalidates sessions test |
| D-05 | MEDIUM | Backend | Fresh DB had empty plans table → checkout 500, plans [] | plan catalog only existed in demo seed | added data migration 002_plans.sql (idempotent) | subscription suite on fresh DB |
| D-06 | MEDIUM | Backend | seed aborted with SIGABRT (exit 134) after successful write | `process.exit()` with live better-sqlite3 statements | graceful `closeDatabase(db)` + natural exit | seed run twice, exit 0 |
| D-07 | LOW | Backend | DEVICE_REVOKED surfaced as generic UNAUTHORIZED envelope detail | unauthorized() had single-arg signature | typed ApiError(401, "DEVICE_REVOKED", …) | devices test asserts code |
| D-08 | MEDIUM | Backend | peer stats matching broke tests (random keys per call) | test helper hashed random UUID into key | deterministic per-test keys | controlplane stats tests |
| D-09 | LOW | Backend | revoked tunnel still listed as active after DELETE | list returned raw rows without status diff | status="revoked" surfaced + asserted | vpn delete test |
| D-10 | MEDIUM | Web | PostCSS config inherited from parent directories → vitest/vite crash | Vite config search walks up the tree | `css.postcss.plugins: []` pinned in web + desktop + agent configs | all TS suites run standalone |
| D-11 | LOW | Web | App.tsx: AuthProvider not imported; ErrorState prop mismatch | agent file interrupted mid-write | imports fixed; props aligned | typecheck |
| D-12 | MEDIUM | Desktop | shared/ipc.ts imported at wrong relative depth in 7 files → module resolution errors | interrupted agent pass | depths corrected (3–4 ups per location) | tsc --noEmit both configs |
| D-13 | MEDIUM | Desktop | VpnController referenced nonexistent `applyKillSwitch`/`removeKillSwitch` exports | API drift between files | refactored to KillSwitchManager (apply/remove, fail-closed ordering: kill switch BEFORE tunnel up) | typecheck + command tests |
| D-14 | LOW | Desktop | Windows elevated commands assert raw script text (it's base64 EncodedCommand) | wrong assertion layer | tests assert the script builders + wrapper structure separately | command tests |
| D-15 | LOW | Desktop | wg-dump fixture used baked timestamps → freshness test decayed over time | static fixture file | dynamic fixture generated relative to test clock | parse tests |
| D-16 | MEDIUM | Android | TunnelManager.connect() contained a malformed transition expression (interrupted write) | agent pass cut mid-file | rewritten: consent-intent flow → VpnPermissionRequired → resume on grant/deny | state machine tests |
| D-17 | LOW | Android | service/manager handshake mismatch (establishTunnel vs onServiceStarted) | same interrupted pass | unified: service foregrounds → manager.onServiceStarted() drives GoBackend → stats loop confirms handshake | code review + tests |
| D-18 | LOW | Android | word "placeholder" in a comment (spec §67 search hit) | phrasing | reworded to "bootstrap client" | grep audit |

## OPEN (known limitations, by design and documented)

| ID | Severity | Area | Limitation | Mitigation |
|---|---|---|---|---|
| O-01 | MEDIUM | Desktop kill switch | macOS PF anchor temporarily replaces the live ruleset (no per-anchor block enable) | honest caveat in code + README; restore path tested at builder level |
| O-02 | LOW | Desktop updates | electron-updater not bundled (no feed configured) | UpdateService reports manual updates honestly; wiring steps documented |
| O-03 | LOW | Backend | in-memory rate limiting is per-process | swap interface for Redis in multi-instance deploys (interface already extracted) |
| O-04 | LOW | Android | GoBackend.setVpnServiceCreator availability guarded by NoSuchMethodError fallback | single glue file AegisApplication.kt + README checklist |
| O-05 | LOW | Backend | JWT HMAC-SHA256 (not RS256/EdDSA) — fine for single-service control plane | document key rotation procedure in SECURITY-AUDIT.md |
