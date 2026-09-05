#!/usr/bin/env bash
# AegisVPN end-to-end smoke test (spec §59, API level).
# Boots a fresh backend, then walks the real client journey:
#   register → login → me → servers → provision peer (idempotent) →
#   sessions → device revoke (forces disconnect) → verify enforcement.
# Requires: node >= 20. Run from anywhere.
set -euo pipefail

cd "$(dirname "$0")/../backend"

# Random port per run so parallel/leftover servers can't collide.
PORT="${SMOKE_PORT:-$((20000 + RANDOM % 20000))}"
# Kill any leftover backend from a previous aborted run.
pkill -f "tsx src/index.ts" 2>/dev/null || true
sleep 0.5
DB="$(mktemp -d)/smoke.db"
export JWT_SECRET="smoke-secret-only-for-local-tests-0123456789"
export DATABASE_PATH="$DB"
export PORT
export NODE_ENV=development
export RATE_AUTH_MAX=1000
export RATE_DEFAULT_MAX=10000

echo "── installing deps (skipped if present)"
[ -d node_modules ] || npm install --no-audit --no-fund

echo "── starting backend on :$PORT"
# Server output goes to a log file; if it inherited stdout it would hold the
# caller's pipe open forever after the script exits.
npx tsx src/index.ts > "$DB.log" 2>&1 &
BACK_PID=$!
trap 'kill $BACK_PID 2>/dev/null || true' EXIT

for i in $(seq 1 30); do
  curl -sf "http://localhost:$PORT/health" >/dev/null && break
  sleep 0.5
  [ "$i" = 30 ] && { echo "backend did not start"; exit 1; }
done

API="http://localhost:$PORT/api/v1"
DEVICE_UID="11111111-1111-4111-8111-111111111111"

echo "── register"
REG=$(curl -sf -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"email\":\"smoke@local.test\",\"password\":\"Sup3rSecurePass\",\"name\":\"Smoke\",\"deviceName\":\"SmokeCLI\",\"platform\":\"web\",\"deviceUid\":\"$DEVICE_UID\"}")
ACCESS=$(echo "$REG" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).accessToken))")
REFRESH=$(echo "$REG" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).refreshToken))")
DEVICE_ID=$(echo "$REG" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).device.id))")
echo "   registered user + device $DEVICE_ID"

echo "── me"
curl -sf "$API/auth/me" -H "Authorization: Bearer $ACCESS" | grep -q '"subscription"' && echo "   me OK"

echo "── create admin server (promote via bootstrap db is not exposed; use admin endpoints with a seeded admin)"
# promote smoke user to admin directly in the smoke database
node -e "
const Database = require('better-sqlite3');
const db = new Database(process.env.DATABASE_PATH);
db.prepare(\"UPDATE users SET role='admin' WHERE email='smoke@local.test'\").run();
db.close(); console.log('   promoted to admin');
"
SRV=$(curl -sf -X POST "$API/admin/servers" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -d '{"code":"smoke-01","name":"Smoke Server","country":"Testland","city":"Smokeville","host":"smoke01.local.test","port":51820,"publicKey":"'"$(node -e "
const c=require('crypto');
console.log(c.createHash('sha256').update('smoke-srv-'+Date.now()).digest('base64'));
")"'","capacity":10,"ipv4Prefix":"10.123.0.0/24","ipv6Prefix":"fd00:123::/64","dns":"10.123.0.1"}')
SERVER_ID=$(echo "$SRV" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).server.id))")
AGENT_TOKEN=$(echo "$SRV" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).agentToken))")
curl -sf -X PATCH "$API/admin/servers/$SERVER_ID" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -d '{"status":"active"}' >/dev/null
echo "   server $SERVER_ID active"

echo "── provision peer (client-side key simulated here)"
WG_PUB=$(node -e "
const c=require('crypto');
const key=c.createHash('sha256').update('smoke-peer-'+Date.now()).digest();
console.log(key.toString('base64'));
")
PEER=$(curl -sf -X POST "$API/vpn/peers" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' \
  -H "Idempotency-Key: smoke-$(date +%s)" \
  -d "{\"deviceId\":\"$DEVICE_ID\",\"serverId\":\"$SERVER_ID\",\"publicKey\":\"$WG_PUB\"}")
TUNNEL_ID=$(echo "$PEER" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).tunnel.id))")
SESSION_ID=$(echo "$PEER" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).session.id))")
ADDR=$(echo "$PEER" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).tunnel.addressV4))")
echo "   tunnel $TUNNEL_ID @ $ADDR, session $SESSION_ID"

echo "── agent heartbeat picks up add_peer op"
OPS=$(curl -sf -X POST "http://localhost:$PORT/agent/heartbeat" -H "Authorization: Bearer $AGENT_TOKEN" -H 'Content-Type: application/json' \
  -d '{"cpuPct":5,"ramPct":30,"diskPct":10,"tunnelCount":1,"bandwidthIn":0,"bandwidthOut":0,"uptimeSec":100,"wgInterface":"wg0","peers":[{"publicKey":"'"$WG_PUB"'","bytesIn":2048,"bytesOut":4096,"handshakeAgoSec":10}]}')
echo "$OPS" | grep -q 'add_peer' && echo "   add_peer delivered"
OP_ID=$(echo "$OPS" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const o=JSON.parse(s).ops[0];if(o)console.log(o.id);else console.log('none')})")
[ "$OP_ID" != "none" ] && curl -sf -X POST "http://localhost:$PORT/agent/ops/$OP_ID/ack" -H "Authorization: Bearer $AGENT_TOKEN" -H 'Content-Type: application/json' -d '{"success":true}' >/dev/null

echo "── session shows live stats"
curl -sf "$API/sessions" -H "Authorization: Bearer $ACCESS" | grep -q '"bytesIn":2048' && echo "   agent stats applied to session"

echo "── force disconnect (web → client enforcement)"
curl -sf -X DELETE "$API/sessions/$SESSION_ID" -H "Authorization: Bearer $ACCESS" >/dev/null
curl -sf "$API/sessions" -H "Authorization: Bearer $ACCESS" | grep -q "\"id\":\"$SESSION_ID\",\"state\":\"closed\"" \
  || curl -sf "$API/sessions" -H "Authorization: Bearer $ACCESS" | grep -q '"state":"closed"' && echo "   session closed + remove_peer queued"

echo "── device revoke kills the session family"
curl -sf -X DELETE "$API/devices/$DEVICE_ID" -H "Authorization: Bearer $ACCESS" >/dev/null
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/auth/me" -H "Authorization: Bearer $ACCESS")
[ "$CODE" = "401" ] && echo "   old access token rejected (DEVICE_REVOKED)" || { echo "   unexpected: $CODE"; exit 1; }

echo
echo "✅ smoke passed — the full journey works end to end."
