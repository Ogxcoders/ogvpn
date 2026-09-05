# AegisVPN — API Contract v1

Base URL: `http://localhost:8080/api/v1`
All bodies are JSON unless stated otherwise. All timestamps are ISO-8601 UTC.

## Conventions

- **Auth**: `Authorization: Bearer <accessToken>` (JWT, 15 min, claims `{sub: userId, did: deviceId, role, typ:"access"}`).
- **Refresh tokens**: opaque 256-bit random, stored SHA-256-hashed server-side, rotating on every refresh with reuse detection (presenting a revoked token revokes the whole family).
- **Errors**: `{ "error": { "code": "MACHINE_CODE", "message": "human text", "details"?: any } }`
  - Codes: `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `RATE_LIMITED` 429, `SERVER_ERROR` 500, `UPSTREAM_TIMEOUT` 504.
- **Idempotency**: mutating client calls may send `Idempotency-Key: <uuid>`; server caches the first response for 24 h.
- **Rate limits**: auth endpoints 10/min/IP; peers 30/min/user; default 120/min/user. Header `Retry-After` on 429.
- **Offline behavior**: clients must treat network failure as retryable with exponential backoff; all GETs are safe to retry; peer creation requires idempotency key to be safely retryable.

## Auth

| Method | Path | Auth | Request | Success | Errors |
|---|---|---|---|---|---|
| POST | `/auth/register` | – | `{email, password, name, deviceName, platform}` | 201 `{user, accessToken, refreshToken, device}` | VALIDATION_ERROR, CONFLICT (email exists), RATE_LIMITED |
| POST | `/auth/login` | – | `{email, password, deviceName, platform}` | 200 `{user, accessToken, refreshToken, device}` | VALIDATION_ERROR, UNAUTHORIZED (bad creds), FORBIDDEN (account disabled), RATE_LIMITED |
| POST | `/auth/refresh` | – | `{refreshToken}` | 200 `{accessToken, refreshToken}` (rotated) | UNAUTHORIZED (invalid/expired/reused), FORBIDDEN (device revoked, account disabled) |
| POST | `/auth/logout` | ✓ | `{refreshToken}` | 204 | UNAUTHORIZED |
| GET | `/auth/me` | ✓ | – | 200 `{user, subscription, device}` | UNAUTHORIZED |
| POST | `/auth/password-change` | ✓ | `{currentPassword, newPassword}` | 204 | VALIDATION_ERROR, UNAUTHORIZED |
| POST | `/auth/password-forgot` | – | `{email}` | 200 `{status:"ok"}` (always; token logged in dev) | RATE_LIMITED |
| POST | `/auth/password-reset` | – | `{token, newPassword}` | 204 | VALIDATION_ERROR, UNAUTHORIZED |
| DELETE | `/auth/account` | ✓ | `{password}` | 204 (cascades: revokes devices, tunnels, sessions) | UNAUTHORIZED |

`user`: `{id, email, name, role: "user"|"admin", status: "active"|"disabled"|"deleted", createdAt}`
`device`: `{id, name, platform: "android"|"windows"|"macos"|"linux"|"web", lastActiveAt, status}`

## Devices

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| GET | `/devices` | ✓ | 200 `{devices: Device[]}` (each with active session + tunnel summary) | |
| PATCH | `/devices/:id` | ✓ | 200 `{device}` | rename; 403 if not owner |
| DELETE | `/devices/:id` | ✓ | 204 | **revoke**: closes sessions, removes tunnel peers (server ops), emits `device.revoked` |

## Servers (client-visible)

| Method | Path | Auth | Success |
|---|---|---|---|
| GET | `/servers` | ✓ | 200 `{servers: [{id, code, name, country, city, host, port, publicKey, dns, status: "active"|"maintenance"|"drain"|"offline", loadPct, capacity, ipv4Prefix, ipv6Prefix, supportsDualStack, lastHeartbeatAt}]}` — only servers with status != `retired` are listed |
| GET | `/servers/:id` | ✓ | 200 `{server}` (404 if retired) |

## VPN provisioning

WireGuard private keys are generated **client-side** and never leave the device. The client uploads only the public key.

| Method | Path | Auth | Request | Success | Errors |
|---|---|---|---|---|---|
| POST | `/vpn/peers` | ✓ | `{deviceId, serverId, publicKey}` | 201 `{tunnel: {id, addressV4, addressV6, serverPublicKey, endpointHost, endpointPort, allowedIps: ["0.0.0.0/0","::/0"], dns, mtu: 1420, keepalive: 25, serverId}, session: {id, state}}` | VALIDATION_ERROR (bad wg key), FORBIDDEN (subscription expired, device revoked, plan device limit), CONFLICT (public key already registered), NOT_FOUND (server/device), SERVER_UNAVAILABLE (`503`, server not active) |
| GET | `/vpn/peers` | ✓ | – | 200 `{tunnels: Tunnel[]}` | |
| GET | `/vpn/peers/:id` | ✓ | 200 `{tunnel, session}` | 404 if not owner |
| DELETE | `/vpn/peers/:id` | ✓ | 204 | removes peer from server (op), closes session |
| POST | `/vpn/peers/:id/rotate` | ✓ | `{newPublicKey}` | 200 `{tunnel}` (same address, new key pushed via op) | VALIDATION_ERROR |

`publicKey`: base64, 44 chars ending `=`, valid Curve25519 point (checked server-side).

## Sessions

| Method | Path | Auth | Success |
|---|---|---|---|
| GET | `/sessions` | ✓ | 200 `{sessions: [{id, state: "connected"|"reconnecting"|"closed"|"failed", deviceId, deviceName, serverId, serverName, connectedAt, closedAt, bytesIn, bytesOut}]}` |
| DELETE | `/sessions/:id` | ✓ | 204 | **force disconnect**: closes session, queues peer-removal op, emits `session.force-disconnect` |

## Subscription

| Method | Path | Auth | Success |
|---|---|---|---|
| GET | `/subscription/plans` | ✓ | 200 `{plans: [{code, name, priceCents, interval, maxDevices, features: string[]}]}` |
| GET | `/subscription` | ✓ | 200 `{subscription: {plan, status: "active"|"canceled"|"expired"|"past_due"|"free", currentPeriodEnd, maxDevices}}` |
| POST | `/subscription/checkout` | ✓ | `{planCode}` → 200 `{subscription}` — **DEMO MODE ONLY**: activates instantly and labels the payment `simulated`. With `PAYMENTS_PROVIDER=stripe` this returns a real Checkout session URL (interface stubbed, not shipped). |
| POST | `/subscription/cancel` | ✓ | 200 `{subscription}` (status `canceled`, active until period end) |

Free plan: 2 devices. Premium: 10.

## Events (Server-Sent Events)

`GET /events` — text/event-stream. Auth: `?access_token=<jwt>` (EventSource cannot set headers).
Events:
- `device.revoked` `{deviceId}` → client must tear tunnel + log out
- `session.force-disconnect` `{sessionId, tunnelId}` → client must disconnect VPN
- `subscription.changed` `{status, plan}` → client refreshes entitlements
- `server.changed` `{serverId, status}` → client refreshes server list; reconnect if connected to it
- `config.updated` `{tunnelId}` → client re-fetches config
- `account.disabled` → client logs out
- `ping` keepalive every 25 s
Reconnect policy: client reconnects with backoff; missed events are recovered by re-fetching state (events are notifications, not a source of truth).

## Server-agent endpoints (machine-to-machine)

Auth: `Authorization: Bearer <AGENT_TOKEN>` (per-server provisioning token).

| Method | Path | Request/Success |
|---|---|---|
| POST | `/agent/register` | `{name, code, country, city, host, port, publicKey, capacity, ipv4Prefix, ipv6Prefix, dns, platform}` → 201 `{serverId}` |
| POST | `/agent/heartbeat` | `{cpuPct, ramPct, diskPct, tunnelCount, bandwidthIn, bandwidthOut, uptimeSec, wgInterface}` → 200 `{ops: [{id, type: "add_peer"|"remove_peer", payload}]}` (pending ops, ≤50, oldest first; empty array = none) |
| POST | `/agent/ops/:id/ack` | `{success, error?}` → 204 |

## Admin (role=admin)

| Method | Path | Success |
|---|---|---|
| GET | `/admin/users` | 200 `{users}` (paged `?page&limit`) |
| PATCH | `/admin/users/:id` | `{status?, role?}` → 200 `{user}`; disabling emits `account.disabled`, closes sessions, revokes tunnels |
| GET | `/admin/servers` | 200 `{servers}` (incl. retired + raw heartbeat metrics) |
| POST | `/admin/servers` | create server manually → 201 `{server}` |
| PATCH | `/admin/servers/:id` | `{status?}` → maintenance/drain/active/retired; drain stops new peers |
| GET | `/admin/stats` | 200 `{users, devices, activeSessions, tunnelsByServer, subscriptions}` |
| GET | `/admin/audit` | 200 `{entries}` (audit log, paged) |

## Observability

- `GET /health` → 200 `{status:"ok", uptime, version}` (no auth)
- `GET /health/ready` → 200/503 (checks DB)
- `GET /metrics` → JSON counters `{httpRequests, authAttempts, peersCreated, peersRemoved, sseClients, dbQueryCount}`

## Bootstrap admin

On first boot with empty DB, if `ADMIN_EMAIL`/`ADMIN_PASSWORD` env are set, an admin user is created. Documented in SETUP. Never hardcodes credentials in code.
