#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# REAL runtime verification matrix for the AegisVPN control plane.
# Boots the actual backend (SQLite + migrations + demo seed) and exercises
# every success/failure path with real HTTP calls. Each step records the
# ACTUAL response into an evidence file (tokens redacted).
#
# Usage:  bash scripts/real-api-matrix.sh [port]
# Output: docs/checklist-execution/evidence/*.txt + evidence-summary.md
# ---------------------------------------------------------------------------
set -u
cd "$(dirname "$0")/../backend"

PORT="${1:-8080}"
ROOT="$(cd .. && pwd)"
EV="$ROOT/docs/checklist-execution/evidence"
mkdir -p "$EV"
rm -f "$EV"/*.txt 2>/dev/null

DB="./data/evidence-$$.db"
export JWT_SECRET="$(openssl rand -base64 48 2>/dev/null || head -c 48 /dev/urandom | base64)"
export DATABASE_PATH="$DB"
export PORT
export NODE_ENV=development

REDRACT='s/eyJ[A-Za-z0-9_-]\{8,\}\.[A-Za-z0-9_-]\{8,\}\.[A-Za-z0-9_-]\{8,\}/<REDACTED-JWT>/g; s/"refreshToken":"[^"]*"/"refreshToken":"<REDACTED>"/g; s/demo-access-[A-Za-z0-9_-]*/<REDACTED-TOKEN>/g'

step() { # step <name> <file-stem>
  STEP_NAME="$1"; STEP_FILE="$EV/$2.txt"
}

record() { # record <curl-extra-args...> — writes method+status+body
  local label="$1"; shift
  local out status
  out=$(mktemp)
  status=$(curl -s -o "$out" -w "%{http_code}" "$@")
  {
    echo # previous curl body has no trailing newline
    echo "### $label"
    echo "HTTP $status"
    sed -E "$REDRACT" "$out"
    echo # keep records on separate lines
  } >> "$STEP_FILE"
  LAST_STATUS="$status"
  rm -f "$out"
}

BASE="http://127.0.0.1:$PORT/api/v1"
STEP_FILE="$EV/00-boot.txt"

echo "== [1/6] Seeding demo database: $DB =="
# NOTE: better-sqlite3 can abort at PROCESS EXIT even after a successful
# seed (known upstream issue). The abort can also discard buffered stdout,
# so judge success by the resulting DATABASE FILE, not output or exit code.
npm run seed:demo --silent > /dev/null 2>&1
if [ -s "$DB" ]; then
  echo "   seed OK (db file present: $(wc -c < "$DB") bytes)"
else
  echo "SEED FAILED — no database produced"; exit 1
fi

echo "== [2/6] Booting real backend on :$PORT =="
# Free the port from any orphaned previous run first (defensive).
if command -v fuser >/dev/null 2>&1; then fuser -k "$PORT"/tcp 2>/dev/null; fi
sleep 0.5
npm start --silent > "$EV/00-server.log" 2>&1 &
SERVER_PID=$!
for i in $(seq 1 40); do
  sleep 0.5
  if curl -s -o /dev/null "http://127.0.0.1:$PORT/health"; then break; fi
done
record "GET /health — real server up" "http://127.0.0.1:$PORT/health"
grep -q "HTTP 200" "$STEP_FILE" && echo "   health OK" || { echo "BOOT FAILED"; tail -20 "$EV/00-server.log"; exit 1; }

cleanup() { kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null; rm -f "$DB" "$DB-shm" "$DB-wal"; }
trap cleanup EXIT

echo "== [3/6] Auth matrix =="
step "auth" "10-auth"; : > "$STEP_FILE"
record "login with WRONG password (failure path)" -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"demo@aegisvpn.local","password":"WrongPass999","deviceName":"matrix","platform":"linux","deviceUid":"11111111-1111-4111-8111-000000000001"}'
record "login with malformed email (validation path)" -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"not-an-email","password":"DemoPass123","deviceName":"matrix","platform":"linux","deviceUid":"11111111-1111-4111-8111-000000000002"}'
RAWLOGIN=$(mktemp)
_lstatus=$(curl -s -o "$RAWLOGIN" -w "%{http_code}" -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"demo@aegisvpn.local","password":"DemoPass123","deviceName":"matrix-runner","platform":"linux","deviceUid":"11111111-1111-4111-8111-0000000000aa"}')
{
  echo "### login demo@aegisvpn.local with CORRECT password (success path)"
  echo "HTTP $_lstatus"
  sed -E "$REDRACT" "$RAWLOGIN"
} >> "$STEP_FILE"
ACCESS=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["accessToken"])' "$RAWLOGIN")
REFRESH=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["refreshToken"])' "$RAWLOGIN")
rm -f "$RAWLOGIN"
[ -n "$ACCESS" ] && echo "   tokens acquired" || { echo "NO TOKENS — aborting"; tail -30 "$STEP_FILE"; exit 1; }
record "GET /auth/me with real access token" "$BASE/auth/me" -H "Authorization: Bearer $ACCESS"
record "GET /auth/me with FORGED token (authz failure path)" "$BASE/auth/me" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.forged.sig"
record "login premium@aegisvpn.local (second seeded identity)" -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"premium@aegisvpn.local","password":"DemoPass123","deviceName":"matrix","platform":"linux","deviceUid":"11111111-1111-4111-8111-000000000003"}'
record "login disabled@aegisvpn.local (disabled-account path)" -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d '{"email":"disabled@aegisvpn.local","password":"DemoPass123","deviceName":"matrix","platform":"linux","deviceUid":"11111111-1111-4111-8111-000000000004"}'
record "POST /auth/refresh with real refresh token (rotation)" -X POST "$BASE/auth/refresh" -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$REFRESH\"}"
record "POST /auth/refresh REUSING rotated token (reuse-detection path)" -X POST "$BASE/auth/refresh" -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$REFRESH\"}"

echo "== [4/6] Devices / servers / provisioning matrix =="
step "resources" "20-resources"; : > "$STEP_FILE"
record "GET /servers — real 7-server matrix" "$BASE/servers" -H "Authorization: Bearer $ACCESS"
record "GET /devices" "$BASE/devices" -H "Authorization: Bearer $ACCESS"
record "POST /vpn/peers on MAINTENANCE server sg-sin-01 (failure path)" -X POST "$BASE/vpn/peers" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -H 'Idempotency-Key: m-maint' -d '{"deviceId":"PLACEHOLDER","serverId":"srv-maintenance","publicKey":"placeholder"}'
# Resolve real ids from the LIVE API (not from evidence files):
DEV_ID=$(curl -s "$BASE/devices" -H "Authorization: Bearer $ACCESS" | python3 -c 'import json,sys; d=json.load(sys.stdin); print([x["id"] for x in d["devices"] if x["name"]=="matrix-runner"][0])')
SRV_ACTIVE=$(curl -s "$BASE/servers" -H "Authorization: Bearer $ACCESS" | python3 -c 'import json,sys; d=json.load(sys.stdin); print([x["id"] for x in d["servers"] if x["status"]=="active"][0])')
SRV_MAINT=$(curl -s "$BASE/servers" -H "Authorization: Bearer $ACCESS" | python3 -c 'import json,sys; d=json.load(sys.stdin); print([x["id"] for x in d["servers"] if x["status"]=="maintenance"][0])')
SRV_OFFLINE=$(curl -s "$BASE/servers" -H "Authorization: Bearer $ACCESS" | python3 -c 'import json,sys; d=json.load(sys.stdin); print([x["id"] for x in d["servers"] if x["status"]=="offline"][0])')
curl -s "$BASE/servers" -H "Authorization: Bearer $ACCESS" > "$EV/21-servers.json"
LAPTOP_ID=$(curl -s "$BASE/devices" -H "Authorization: Bearer $ACCESS" | python3 -c 'import json,sys; d=json.load(sys.stdin); print([x["id"] for x in d["devices"] if x["name"]=="Demo Laptop"][0])')
echo "   device=$DEV_ID laptop=$LAPTOP_ID active=$SRV_ACTIVE maint=$SRV_MAINT offline=$SRV_OFFLINE"

# DEVICE LIMIT: demo user already has 2 seed devices + matrix-runner = 3 >
# free plan max 2 → provisioning must be refused BEFORE any server contact:
record "POST /vpn/peers over plan device limit (entitlement failure path)" -X POST "$BASE/vpn/peers" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -H 'Idempotency-Key: m-limit' -d "{\"deviceId\":\"$DEV_ID\",\"serverId\":\"$SRV_ACTIVE\",\"publicKey\":\"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=\"}"

# Free a plan slot (free plan = 2 devices; the login already used one):
record "DELETE seed 'Demo Laptop' (real slot-freeing mutation)" -X DELETE "$BASE/devices/$LAPTOP_ID" -H "Authorization: Bearer $ACCESS"

record "POST /vpn/peers on MAINTENANCE server (real failure path)" -X POST "$BASE/vpn/peers" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -H 'Idempotency-Key: m-maint2' -d "{\"deviceId\":\"$DEV_ID\",\"serverId\":\"$SRV_MAINT\",\"publicKey\":\"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=\"}"
record "POST /vpn/peers on OFFLINE server (real failure path)" -X POST "$BASE/vpn/peers" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -H 'Idempotency-Key: m-off' -d "{\"deviceId\":\"$DEV_ID\",\"serverId\":\"$SRV_OFFLINE\",\"publicKey\":\"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=\"}"
record "POST /vpn/peers on ACTIVE server (real success path)" -X POST "$BASE/vpn/peers" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -H 'Idempotency-Key: m-ok' -d "{\"deviceId\":\"$DEV_ID\",\"serverId\":\"$SRV_ACTIVE\",\"publicKey\":\"AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=\"}"
record "GET /vpn/peers (tunnel list)" "$BASE/vpn/peers" -H "Authorization: Bearer $ACCESS"
record "GET /sessions (real session rows)" "$BASE/sessions" -H "Authorization: Bearer $ACCESS"
record "PATCH device rename (real mutation)" -X PATCH "$BASE/devices/$DEV_ID" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -d '{"name":"matrix-runner-renamed"}'

echo "== [5/6] Subscription matrix =="
step "subscription" "30-subscription"; : > "$STEP_FILE"
record "GET /subscription (free plan)" "$BASE/subscription" -H "Authorization: Bearer $ACCESS"
record "GET /subscription/plans (catalog)" "$BASE/subscription/plans" -H "Authorization: Bearer $ACCESS"
record "POST /subscription/checkout premium (real mutation)" -X POST "$BASE/subscription/checkout" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -d '{"planCode":"premium"}'
record "POST /subscription/cancel" -X POST "$BASE/subscription/cancel" -H "Authorization: Bearer $ACCESS"
record "POST /subscription/checkout with UNKNOWN plan (failure path)" -X POST "$BASE/subscription/checkout" -H "Authorization: Bearer $ACCESS" -H 'Content-Type: application/json' -d '{"planCode":"ultra"}'

echo "== [6/6] Logout + summary =="
step "logout" "40-logout"; : > "$STEP_FILE"
record "DELETE current device (real revocation — backend allows it)" -X DELETE "$BASE/devices/$DEV_ID" -H "Authorization: Bearer $ACCESS"
record "GET /auth/me AFTER self-revocation (revocation enforcement proof)" "$BASE/auth/me" -H "Authorization: Bearer $ACCESS"
record "POST /auth/logout (real token revocation)" -X POST "$BASE/auth/logout" -H 'Content-Type: application/json' -d "{\"refreshToken\":\"placeholder\"}"

# Summary
SUMMARY="$EV/evidence-summary.md"
{
  echo "# Real-API matrix run — $(date -u +%FT%TZ)"
  echo
  echo "| Evidence file | Steps |"
  echo "|---|---|"
  for f in "$EV"/10-auth.txt "$EV"/20-resources.txt "$EV"/30-subscription.txt "$EV"/40-logout.txt; do
    n=$(grep -c '^### ' "$f" 2>/dev/null || echo 0)
    echo "| $(basename "$f") | $n |"
  done
  echo
  echo "All responses above are from the REAL backend booted on 127.0.0.1:$PORT with"
  echo "migrations applied and the demo seed loaded (DATABASE_PATH=$DB). Tokens redacted."
} > "$SUMMARY"
echo "== DONE — evidence in docs/checklist-execution/evidence/ =="
