# Security Audit

## Authentication & sessions
- Passwords: **scrypt** (N=16384, r=8, p=1, 64-byte key) via node:crypto; per-password random salt; `timingSafeEqual` comparison; uniform "Invalid email or password" with dummy-verify to blunt enumeration timing. Policy: ≥10 chars, letter+digit, enforced client AND server side.
- Access tokens: HS256 JWT, 15-minute TTL, iss-checked, type-checked, custom auditable implementation (no transitive dep), constant-time signature compare.
- Refresh tokens: 256-bit random, **stored SHA-256-hashed**, rotated on every refresh, **reuse detection** (presenting a revoked token revokes the whole family + audit event). Tests cover rotation, replay → family revocation, expiry, revoked-device rejection.
- Login rate limiting: fixed-window per-IP on auth routes (429 + Retry-After) + global default limiter. Password-forgot is non-enumerable (always 200).

## Authorization
- Every user route requires a valid access token bound to (user, device); disabled accounts and revoked devices fail closed (401 DEVICE_REVOKED / ACCOUNT_DISABLED).
- Ownership checks on all device/tunnel/session mutations (tests cover cross-user 403/404).
- Admin routes gated by role; self-disable forbidden; disable cascades (tokens revoked, sessions closed, peers removed, event emitted).
- Agent routes: per-server bearer token, only SHA-256 hash stored, shown exactly once at creation.

## VPN key handling
- **Private keys never leave the client.** Android generates `com.wireguard.crypto.KeyPair` on-device; desktop uses x25519 (@noble/curves). Only the public key is uploaded (44-char base64 validated server-side).
- Server-side storage holds public keys only. Client private keys persist only in EncryptedSharedPreferences (Android) / safeStorage-encrypted store (desktop).
- Backend never logs keys; logger **redacts any field matching /pass|token|secret|key|auth|cookie|credential/i**; diagnostics dump sanitizer scrubs ALL 44-char base64 blobs (defense in depth).
- Key rotation endpoint exists (`POST /vpn/peers/:id/rotate`) with atomic address preservation.

## Injection / input safety
- All backend input validated with zod (body, params, query); strict error envelope, no stack traces to clients.
- Server agent executes **only execFile with argv arrays**; peer public keys must match the canonical WireGuard base64 regex, IPs validated — command-injection attempts ("x; rm -rf /") are rejected by validators (tested).
- SQL: exclusively prepared statements (better-sqlite3) — no string interpolation into SQL. SQLite has no SQLi surface beyond that.
- Desktop renderer is sandboxed with contextIsolation; `shell.openExternal` for external links; no nodeIntegration.
- Android WebView: none used.

## Transport
- Backend CORS configurable (set CORS_ORIGIN in production); API served over TLS in production deployments (reverse proxy); tokens accepted over TLS only outside localhost.
- Android debug network-security-config permits cleartext **only** to 10.0.2.2/localhost for development; release builds inherit platform defaults (TLS required).
- Event streams auth via short-lived access token query param (EventSource limitation) — documented; tokens are 15-min TTL.

## Web/desktop client-side storage
- Web stores access+refresh in localStorage — **documented tradeoff** (XSS surface) with the httpOnly-cookie upgrade path in web/src/api/client.ts; refresh rotation limits blast radius; no tokens rendered in UI or logs.
- Desktop: tokens encrypted via OS keychain (safeStorage), renderer never receives them; plaintext fallback warns via `degraded` flag equivalent.

## Abuse prevention
- Rate limits (auth 10/min default, global 120/min), idempotency keys (24h) on peer creation, capacity gates per server, plan device limits enforced server-side (2 free / 10 premium), subscription expiry → free tier.

## Database integrity
- Foreign keys ON (cascade deletes verified), UNIQUE constraints (email, device_uid per user, tunnel public key, server code), WAL journaling, transactions around migrations, audit_log for every security-relevant action (register, login, failures, revocations, admin actions, simulated checkouts, op failures).

## Logging & observability
- Structured JSON logs with redaction; /health, /health/ready (DB probe), /metrics (counters incl. dbQueryCount); agent heartbeats power load %; audit_log queryable via /admin/audit.
- No secrets in notifications, no sensitive data in crash paths, no console.log left in shipped TS/Kotlin code.

## Dependency audit (spec §45)
| Dependency | Purpose | Direct? | License | Notes |
|---|---|---|---|---|
| express | HTTP | direct | MIT | LTS, huge audit surface community |
| better-sqlite3 | DB | direct | MIT | prebuilt binaries; sync API avoids async race classes |
| zod | validation | direct | MIT | |
| cors | CORS | direct | MIT | |
| jsonwebtoken | — | NOT USED (replaced by zero-dep HS256 impl) | — | removed from runtime |
| @noble/curves | x25519 (desktop) | direct | MIT | audited, pure JS |
| electron | shell | direct | MIT | pinned 28.x, sandbox renderer |
| react/react-dom/vite | UI+build | direct | MIT | |
| retrofit/okhttp/kotlinx | Android net | direct | Apache-2.0 | |
| com.wireguard.android:tunnel | VPN engine | direct | **GPL-2.0-only** | flagged: distribution requires GPL compliance |
| wireguard tools (server) | VPN | system | GPL-2.0 | upstream official |
Transitive conflict scan performed (npm ls / Gradle alignment): no duplicate-version conflicts found; native module count limited to better-sqlite3 (prebuilt) and the GoBackend .so files (bundled by upstream AAR). No ABI conflicts on supported archs.

## Secrets & configuration
- No hardcoded credentials anywhere (`grep` audit: JWT secret required at boot in non-test envs; demo password is a clearly-labeled public fixture in the seed script only).
- .env.example lists every variable; bootstrap admin requires explicit ADMIN_EMAIL/ADMIN_PASSWORD and an empty admin table.
- Agent tokens: returned once by POST /admin/servers, stored hashed; agent.env is 0600.

## Residual risks (documented, accepted for v1)
1. localStorage tokens on web (XSS-class) — refresh rotation + CSP recommendation; httpOnly upgrade path documented.
2. macOS kill switch temporarily replaces the live PF ruleset (OS limitation) — honest warning shipped in UI docs.
3. In-memory rate limiter — per-process only; Redis swap interface provided.
4. HS256 JWT — single-service trust domain; rotate via JWT_SECRET + invalidate all refresh tokens (password-change flow demonstrates the invalidation pattern).
