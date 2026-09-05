# AegisVPN Web Control Plane

Authenticated React SPA controlling the same backend state as the Android
and desktop clients: account, devices (rename/revoke), servers (live load),
sessions (force disconnect), subscription (demo checkout clearly labeled
"simulated"), support tickets, and the admin panel (users, servers with
one-time agent tokens, stats, audit log).

## Run

```bash
npm install
npm run dev        # http://localhost:5173 — proxies /api to localhost:8080
npm run typecheck && npm test && npm run build
```

For a remote backend set `VITE_API_BASE=http://your-host:8080` at build time
(the client prefixes every path with `/api/v1`).

## Why an SPA and not Next.js

The control plane is authenticated-only (no SEO/SSR needs), deploys as
static files next to the backend, and `npm run build` produces a single
dist/ folder servable by anything. Documented in TECH-DECISIONS.md.

## Structure

- `src/api/client.ts` — fetch wrapper: bearer injection, typed error
  envelope, **single-flight refresh rotation** (the backend rotates refresh
  tokens; parallel refreshes would trip reuse detection), one retry after
  refresh, session-expired event.
- `src/api/types.ts` — contract-v1 types.
- `src/context/AuthContext.tsx` — session + `useEvents` SSE hook (reconnect
  with backoff; device.revoked → logout, session.force-disconnect → toast +
  data refresh, subscription/server changed → refetch).
- `src/pages/` — Dashboard, Devices, Servers, Sessions, Subscription,
  Support, Admin, NotFound. Every page implements loading / empty / error /
  offline / retry.

## Security notes

- Tokens live in localStorage (documented XSS tradeoff; refresh rotation
  bounds the blast radius; httpOnly-cookie upgrade path noted in client.ts).
- No tokens or secrets are rendered or logged.
- Admin area is role-gated in the router AND enforced server-side.

## Offline demo mode (no backend needed)

The login screen has **"Explore demo mode (offline)"**. Tapping it flips the
local demo flag (`localStorage: aegis.demo`): every `/api/v1` call is then
answered by `src/api/demoMode.ts` — a tiny in-memory backend that mirrors
`backend/seed/demo.ts` (same 7-server matrix, plans, devices, sessions) and
returns real contract types, so the UI code paths are identical in demo and
real mode.

What works: login/register, dashboard, servers (incl. maintenance/offline/
drain/IPv4-only), devices (rename/revoke with honest 409 on the current
device), sessions, subscription checkout/cancel (marked `simulatedPayment`),
support tickets.

What is honestly NOT real: no server, no WireGuard tunnel, no traffic
protection, no admin area (contract-faithful 403). A "DEMO MODE" banner in
the sidebar stays visible with an "Exit demo" action.
