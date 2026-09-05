# Architecture

```
                        ┌───────────────────────────────┐
                        │        WEB CONTROL PLANE      │
                        │  Vite+React SPA (admin/users) │
                        └──────────┬────────────────────┘
                                   │ REST + SSE
                                   ▼
┌──────────────┐        ┌───────────────────────┐
│ ANDROID APP  │◄──────►│     BACKEND API        │
│ Kotlin       │  REST  │  Express + SQLite      │
│ Compose      │ + SSE  │  auth/devices/servers  │
│ VpnService   │        │  vpn provisioning      │
│ GoBackend WG │        │  control plane (ops)   │
└──────┬───────┘        │  event bus (SSE)       │
       │                └────┬─────────────┬────┘
       │ TUN                 │             │ op-queue / heartbeat
       ▼                     │             ▼
┌──────────────┐             │      ┌──────────────────┐
│ WireGuard    │             │      │ VPN SERVER AGENT │
│ peer session │             │      │ zero-dep Node    │
└──────┬───────┘             │      │ `wg set` applier │
       │ UDP 51820           │      └────────┬─────────┘
       └─────────────────────────────────────┘
                    (agents push heartbeats; peers connect client→server)

┌──────────────┐
│ DESKTOP APP  │  Electron main process owns VPN + tokens;
│ Win/macOS/   │  orchestrates wireguard-nt / wg-quick per OS;
│ Linux        │  same SSE + REST contract as Android.
└──────────────┘
```

## Control plane flow (peer provisioning)

1. Client generates a Curve25519 keypair **locally**; private key never leaves the device.
2. `POST /vpn/peers {deviceId, serverId, publicKey}` → backend validates the key,
   checks entitlements (subscription, device limits, server status/capacity),
   allocates the next free address in the server's IPv4/IPv6 pools (gateway
   .1 skipped), creates the tunnel row + a `connected` session, queues an
   `add_peer` op, and returns the tunnel configuration.
3. The server agent picks the op up on its next heartbeat and applies
   `wg set wg0 peer <pub> allowed-ips <v4>/32[,<v6>/128]`, then acks.
   Failed ops retry on subsequent heartbeats (5 attempts → dead + audit).
4. The client brings the tunnel up (GoBackend / wg-quick / wireguard-nt) and
   confirms CONNECTED only after real traffic/handshake activity.

## Enforcement paths (web → client)

| Web action | Backend effect | Client effect |
|---|---|---|
| Revoke device | device revoked, refresh tokens killed, session closed, remove_peer op queued, `device.revoked` | SSE → tunnel torn down + logged out (Android/desktop) |
| Force disconnect | session closed, remove_peer op, `session.force-disconnect` | SSE → VPN down |
| Disable user | all tokens revoked, sessions closed, `account.disabled` | SSE → logout |
| Server drain/retire | status change, sessions force-closed on retire, `server.changed` | SSE → fail over to least-loaded active server |
| Subscription change | row updated, `subscription.changed` | SSE → entitlement refresh |

Events are notifications, not truth: every client re-fetches state after
reconnecting the SSE stream.

## State machine (all three clients share the vocabulary)

IDLE → PREPARING → AUTHORIZING → CONFIGURING → CONNECTING → HANDSHAKING →
CONNECTED → RECONNECTING → … → DISCONNECTING → DISCONNECTED
with failure states: ERROR, OFFLINE, AUTH_REQUIRED, VPN_PERMISSION_REQUIRED,
SERVER_UNAVAILABLE, CONFIGURATION_ERROR.
The UI never renders a state the machine did not produce — "Connected" is
only reachable from real handshake/traffic confirmation.
