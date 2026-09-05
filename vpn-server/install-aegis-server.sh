#!/usr/bin/env bash
#
# AegisVPN — WireGuard server + control-plane agent installer.
#
# Target: Debian 12 / Ubuntu 22.04+ (x86_64 or aarch64), run as root.
# Installs and configures, idempotently where sensible:
#   - WireGuard (kernel module + wg / wg-quick tools), qrencode, nftables, curl
#   - IP forwarding sysctls (/etc/sysctl.d/99-aegisvpn.conf)
#   - Server keypair in /etc/wireguard (generated only if missing)
#   - /etc/wireguard/wg0.conf (10.66.66.1/24, fd42:4242::1/64, port 51820 by
#     default — override with AEGIS_IPV4 / AEGIS_IPV6 / AEGIS_PORT)
#   - nftables ruleset /etc/nftables.d/aegisvpn.nft: NAT masquerade + forward
#     rules + an OPTIONAL kill-switch output chain armed only while the marker
#     file /etc/aegisvpn/killswitch exists (see aegis-killswitch helper)
#   - the zero-dependency Node agent in /opt/aegis-agent (Node >= 18;
#     Debian 12 ships nodejs 18.19, Ubuntu 22.04's distro node is too old and
#     gets NodeSource 20.x)
#   - /etc/aegisvpn/agent.env (0600) with AEGIS_BACKEND_URL / AEGIS_AGENT_TOKEN
#   - systemd unit aegis-agent.service (After=network-online + wg-quick@wg0)
#   - enables wg-quick@wg0 + aegis-agent, prints server key, endpoint and a
#     QR code of a sample (throwaway) client config template
#
# Usage:
#   sudo AEGIS_BACKEND_URL=https://api.example.com/api/v1 \
#        AEGIS_AGENT_TOKEN=agt_xxx ./install-aegis-server.sh
#
# Safety: refuses to run if /etc/wireguard/wg0.conf already exists unless
# AEGIS_ALLOW_EXISTING=1 is set (the keypair is preserved; the conf is
# rewritten from the template).

set -euo pipefail

# ---------------------------------------------------------------------------
# Overridable defaults (env)
# ---------------------------------------------------------------------------
AEGIS_IF="${AEGIS_IF:-wg0}"                 # WireGuard interface name
AEGIS_IPV4="${AEGIS_IPV4:-10.66.66.1/24}"   # server tunnel v4 address (host)
AEGIS_IPV6="${AEGIS_IPV6:-fd42:4242::1/64}" # server tunnel v6 address (host)
AEGIS_PORT="${AEGIS_PORT:-51820}"           # UDP listen port
AEGIS_DNS="${AEGIS_DNS:-1.1.1.1,1.0.0.1}"   # DNS handed to clients
AEGIS_SERVER_CAPACITY="${AEGIS_SERVER_CAPACITY:-250}"
AEGIS_SERVER_NAME="${AEGIS_SERVER_NAME:-$(hostname)}"
AEGIS_SERVER_COUNTRY="${AEGIS_SERVER_COUNTRY:-Unknown}"
AEGIS_SERVER_CITY="${AEGIS_SERVER_CITY:-Unknown}"
AEGIS_SERVER_HOST="${AEGIS_SERVER_HOST:-}"  # public endpoint host (auto-detected if empty)
AEGIS_IPV4_PREFIX="${AEGIS_IPV4_PREFIX:-}"  # registration prefix (derived if empty)
AEGIS_IPV6_PREFIX="${AEGIS_IPV6_PREFIX:-}"
POLL_INTERVAL_SEC="${POLL_INTERVAL_SEC:-30}"
AEGIS_ALLOW_EXISTING="${AEGIS_ALLOW_EXISTING:-0}" # 1 = rewrite existing wg0.conf
AEGIS_FORCE_ENV="${AEGIS_FORCE_ENV:-0}"           # 1 = rewrite existing agent.env
AEGIS_NO_START="${AEGIS_NO_START:-0}"             # 1 = enable but do not start services

WG_CONF="/etc/wireguard/${AEGIS_IF}.conf"
WG_DIR="/etc/wireguard"
SERVER_KEY="${WG_DIR}/server.key"
SERVER_PUB_FILE="${WG_DIR}/server.pub"
ENV_DIR="/etc/aegisvpn"
ENV_FILE="${ENV_DIR}/agent.env"
NFT_RULESET="/etc/nftables.d/aegisvpn.nft"
NFT_CONF="/etc/nftables.conf"
KS_HELPER="/usr/local/sbin/aegis-killswitch"
AGENT_DIR="/opt/aegis-agent"
UNIT_FILE="/etc/systemd/system/aegis-agent.service"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
step() { printf '\n==> %s\n' "$*"; }
msg()  { printf '    %s\n' "$*"; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Step 1 — verify root, systemd, architecture
# ---------------------------------------------------------------------------
step "[1/12] Verifying environment"
[ "$(id -u)" -eq 0 ] || die "must run as root (try: sudo -i)"
command -v systemctl >/dev/null 2>&1 || die "systemctl not found — systemd is required"
[ -d /run/systemd/system ] || die "systemd is not running as PID 1"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|aarch64) msg "root ok, systemd ok, architecture ${ARCH}" ;;
  *) die "unsupported architecture '${ARCH}' (need x86_64 or aarch64)" ;;
esac

# Sanity-check operator-supplied values before anything is written.
case "$AEGIS_PORT" in ''|*[!0-9]*) die "AEGIS_PORT must be numeric" ;; esac
[ "$AEGIS_PORT" -ge 1 ] && [ "$AEGIS_PORT" -le 65535 ] || die "AEGIS_PORT out of range"
printf '%s' "$AEGIS_IPV4" | grep -qE '^[0-9]{1,3}(\.[0-9]{1,3}){3}/[0-9]{1,2}$' \
  || die "AEGIS_IPV4 must look like 10.66.66.1/24"
printf '%s' "$AEGIS_IPV6" | grep -qE '^[0-9A-Fa-f:]+::[0-9A-Fa-f:]*/[0-9]{1,3}$' \
  || die "AEGIS_IPV6 must look like fd42:4242::1/64 (must use :: form)"
printf '%s' "$AEGIS_IF" | grep -qE '^[A-Za-z0-9._-]{1,15}$' \
  || die "AEGIS_IF must be a valid Linux interface name (max 15 chars)"

# Safety: refuse to clobber an existing WireGuard config unless explicitly allowed.
if [ -f "$WG_CONF" ] && [ "$AEGIS_ALLOW_EXISTING" != "1" ]; then
  die "$WG_CONF already exists — refusing to overwrite. Re-run with AEGIS_ALLOW_EXISTING=1 to proceed (the keypair in $WG_DIR is preserved)."
fi

# ---------------------------------------------------------------------------
# Step 2 — packages
# ---------------------------------------------------------------------------
step "[2/12] Installing packages (wireguard, wireguard-tools, qrencode, curl, nftables)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq wireguard wireguard-tools qrencode curl nftables >/dev/null
msg "packages installed"

if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  msg "NOTICE: ufw is active. AegisVPN is nftables-based and NOT ufw-dependent;"
  msg "        make sure UDP ${AEGIS_PORT} stays reachable (e.g. ufw allow ${AEGIS_PORT}/udp)."
fi

# ---------------------------------------------------------------------------
# Step 3 — Node.js >= 18 for the agent
# ---------------------------------------------------------------------------
node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }

ensure_node() {
  if command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge 18 ]; then
    msg "node $(node -v) already present"
    return
  fi
  msg "Node >= 18 missing — trying distro packages (Debian 12 ships nodejs 18.19)"
  apt-get install -y -qq nodejs npm >/dev/null || true
  if command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge 18 ]; then
    msg "node $(node -v) installed from distro"
    return
  fi
  # Ubuntu 22.04 ships nodejs 12 — too old. Use the official NodeSource repo.
  msg "distro nodejs is too old — provisioning Node 20.x from NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
  if command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge 18 ]; then
    msg "node $(node -v) installed from NodeSource"
  else
    die "could not provision Node >= 18 — install it manually and re-run"
  fi
}

step "[3/12] Ensuring Node.js >= 18"
ensure_node
NODE_BIN="$(command -v node)"

# ---------------------------------------------------------------------------
# Step 4 — IP forwarding sysctls
# ---------------------------------------------------------------------------
step "[4/12] Configuring IP forwarding sysctls"
cat > /etc/sysctl.d/99-aegisvpn.conf <<EOF
# AegisVPN — forwarding for WireGuard client traffic (managed by install-aegis-server.sh)
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1
EOF
sysctl --system >/dev/null 2>&1 || sysctl -p /etc/sysctl.d/99-aegisvpn.conf >/dev/null
msg "net.ipv4.ip_forward=1, net.ipv6.conf.all.forwarding=1 applied"

# ---------------------------------------------------------------------------
# Step 5 — server keypair (generated only if missing)
# ---------------------------------------------------------------------------
step "[5/12] Ensuring WireGuard server keypair"
install -d -m 0700 "$WG_DIR"
umask 077
if [ ! -s "$SERVER_KEY" ]; then
  wg genkey | tee "$SERVER_KEY" | wg pubkey > "$SERVER_PUB_FILE"
  msg "generated new server keypair"
elif [ ! -s "$SERVER_PUB_FILE" ]; then
  wg pubkey < "$SERVER_KEY" > "$SERVER_PUB_FILE"
  msg "re-derived public key from existing private key"
else
  msg "existing keypair kept"
fi
chmod 600 "$SERVER_KEY" "$SERVER_PUB_FILE"
umask 022
SERVER_PUB="$(cat "$SERVER_PUB_FILE")"
printf '%s' "$SERVER_PUB" | grep -qE '^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$' \
  || die "server public key in $SERVER_PUB_FILE does not look like a WireGuard key"

modprobe wireguard 2>/dev/null \
  || msg "WARN: could not load the wireguard kernel module — wg-quick@${AEGIS_IF} may fail on this kernel"

# ---------------------------------------------------------------------------
# Step 6 — /etc/wireguard/wg0.conf
# ---------------------------------------------------------------------------
step "[6/12] Writing ${WG_CONF}"
umask 077
cat > "$WG_CONF" <<EOF
[Interface]
# Managed by AegisVPN install-aegis-server.sh.
# Re-running the installer refuses to overwrite this file unless
# AEGIS_ALLOW_EXISTING=1 is set (the keypair is preserved either way).
Address = ${AEGIS_IPV4}, ${AEGIS_IPV6}
ListenPort = ${AEGIS_PORT}
PrivateKey = $(cat "$SERVER_KEY")
# NAT + forwarding rules live in /etc/nftables.d/aegisvpn.nft and are loaded
# by nftables.service (included from /etc/nftables.conf). These hooks arm the
# OPTIONAL kill switch — active only while /etc/aegisvpn/killswitch exists:
PostUp = ${KS_HELPER} up
PostDown = ${KS_HELPER} down
SaveConfig = false
EOF
chmod 600 "$WG_CONF"
umask 022
msg "written (Address ${AEGIS_IPV4}, ${AEGIS_IPV6}; ListenPort ${AEGIS_PORT})"

# ---------------------------------------------------------------------------
# Step 7 — nftables ruleset + kill-switch helper
# ---------------------------------------------------------------------------
step "[7/12] Writing nftables ruleset + kill-switch helper"

# Registration prefixes are derived from the tunnel addresses (host -> subnet).
V4_PREFIX="$AEGIS_IPV4_PREFIX"
if [ -z "$V4_PREFIX" ]; then
  v4addr="${AEGIS_IPV4%%/*}"
  IFS='.' read -r v4o1 v4o2 v4o3 _ <<< "$v4addr"
  V4_PREFIX="${v4o1}.${v4o2}.${v4o3}.0/24"
fi
V6_PREFIX="$AEGIS_IPV6_PREFIX"
if [ -z "$V6_PREFIX" ]; then
  V6_PREFIX="${AEGIS_IPV6%%::*}::/${AEGIS_IPV6##*/}"
fi

install -d -m 0755 /etc/nftables.d
cat > "$NFT_RULESET" <<EOF
# AegisVPN nftables ruleset — managed by install-aegis-server.sh.
# Loaded by nftables.service via: include "/etc/nftables.d/*.nft"
# (the installer appends that include line to /etc/nftables.conf).
#
# IP filtering notes:
#   - WireGuard needs ONLY udp/${AEGIS_PORT} open on input; the stock
#     inet filter table (policy accept) leaves input open. Tighten input in
#     your own nftables ruleset if the box also runs other services.
#   - This product does NOT depend on ufw. Do not mix ufw and custom nft
#     rulesets without understanding both.

table inet aegisvpn {

    # --- Client traffic NAT -----------------------------------------------
    # Masquerade client traffic leaving via anything that is not ${AEGIS_IF}
    # (i.e. the WAN uplink), for both address families.
    chain postrouting {
        type nat hook postrouting priority srcnat; policy accept;
        oifname != "${AEGIS_IF}" ip saddr ${V4_PREFIX} counter masquerade
        oifname != "${AEGIS_IF}" ip6 saddr ${V6_PREFIX} counter masquerade
    }

    # --- Forwarding ---------------------------------------------------------
    # Allow the two client forward paths. The server's own traffic is not
    # restricted here (see the output chain below).
    chain forward {
        type filter hook forward priority filter; policy accept;
        iifname "${AEGIS_IF}" counter accept comment "aegisvpn: client -> internet"
        oifname "${AEGIS_IF}" counter accept comment "aegisvpn: internet -> client"
    }

    # --- Optional kill switch (OFF unless armed) ----------------------------
    # Armed ONLY while /etc/aegisvpn/killswitch exists: the wg-quick PostUp
    # hook (${KS_HELPER}) inserts drop rules into this chain for any output
    # that would bypass the ${AEGIS_IF} interface; PostDown (and
    # "aegis-killswitch down") flushes them again. Static policy stays accept
    # so a bare ruleset load never locks the operator out.
    chain output {
        type filter hook output priority filter; policy accept;
    }
}
EOF

# Make sure /etc/nftables.conf includes our ruleset directory (Debian/Ubuntu
# ship a minimal conf without it).
if [ ! -f "$NFT_CONF" ]; then
  printf '#!/usr/sbin/nft -f\nflush ruleset\ninclude "/etc/nftables.d/*.nft"\n' > "$NFT_CONF"
elif ! grep -q '/etc/nftables.d' "$NFT_CONF"; then
  printf '\n# AegisVPN: load per-product rulesets\ninclude "/etc/nftables.d/*.nft"\n' >> "$NFT_CONF"
fi

# Kill-switch helper used by the wg-quick PostUp/PostDown hooks above.
cat > "$KS_HELPER" <<'AEGIS_KS'
#!/usr/bin/env bash
# aegis-killswitch — wg-quick PostUp/PostDown hook for the optional AegisVPN
# kill switch.
#
# ARMING: the switch is armed ONLY while /etc/aegisvpn/killswitch exists.
#   touch /etc/aegisvpn/killswitch && systemctl restart wg-quick@wg0
# While armed, output that would bypass the WireGuard interface is dropped:
# only loopback, the WireGuard interface itself, replies of established
# connections, the backend API endpoint (resolved from agent.env) and any
# operator exemptions (one IP/CIDR per line in
# /etc/aegisvpn/killswitch.allow) remain reachable. Disarm by removing the
# marker and restarting wg-quick (or run "aegis-killswitch down").
set -euo pipefail

MODE="${1:-}"
RULESET="/etc/nftables.d/aegisvpn.nft"
MARKER="/etc/aegisvpn/killswitch"
ALLOWLIST="/etc/aegisvpn/killswitch.allow"
ENV_FILE="/etc/aegisvpn/agent.env"
WG_IF="wg0"

[ "$(id -u)" -eq 0 ] || { echo "aegis-killswitch: must run as root" >&2; exit 1; }
[ "$MODE" = "up" ] || [ "$MODE" = "down" ] || { echo "usage: aegis-killswitch {up|down}" >&2; exit 2; }

if [ -f "$ENV_FILE" ]; then
  iface="$(sed -n 's/^WG_INTERFACE=//p' "$ENV_FILE" | tail -n1 | tr -d '[:space:]')"
  [ -n "$iface" ] && WG_IF="$iface"
fi

# Boot-order safety: wg-quick can come up before nftables.service loads the
# table — make sure it exists before adding rules to it.
nft list table inet aegisvpn >/dev/null 2>&1 || nft -f "$RULESET"

if [ "$MODE" = "down" ]; then
  nft flush chain inet aegisvpn output
  exit 0
fi

# Not armed -> leave the output chain empty (policy accept).
[ -f "$MARKER" ] || exit 0

nft flush chain inet aegisvpn output
nft add rule inet aegisvpn output oifname "lo" counter accept comment "aegis-killswitch: loopback"
nft add rule inet aegisvpn output oifname "$WG_IF" counter accept comment "aegis-killswitch: wireguard"
nft add rule inet aegisvpn output ct state established,related counter accept comment "aegis-killswitch: established"

# Keep the control-plane agent reachable: allow the backend API endpoint.
url="$(sed -n 's/^AEGIS_BACKEND_URL=//p' "$ENV_FILE" 2>/dev/null | tail -n1 || true)"
if [ -n "$url" ]; then
  host="$(printf '%s' "$url" | sed -E 's#^[a-zA-Z][a-zA-Z0-9+.-]*://([^/:?]+).*#\1#')"
  case "$url" in
    https://*) defport="443" ;;
    *)         defport="80" ;;
  esac
  port="$(printf '%s' "$url" | sed -n -E 's#^[a-zA-Z][a-zA-Z0-9+.-]*://[^/]*:([0-9]{1,5}).*#\1#p')"
  port="${port:-$defport}"
  for ip in $(getent ahostsv4 "$host" 2>/dev/null | awk '{print $1}' | sort -u \
              | grep -E '^([0-9]{1,3}\.){3}[0-9]{1,3}$' || true); do
    nft add rule inet aegisvpn output ip daddr "$ip" tcp dport "$port" counter accept \
      comment "aegis-killswitch: backend"
  done
  for ip6 in $(getent ahostsv6 "$host" 2>/dev/null | awk '{print $1}' | sort -u \
               | grep -E '^[0-9A-Fa-f:]+$' || true); do
    nft add rule inet aegisvpn output ip6 daddr "$ip6" tcp dport "$port" counter accept \
      comment "aegis-killswitch: backend"
  done
fi

# Operator exemptions: one IP or CIDR per line, '#' comments allowed.
if [ -f "$ALLOWLIST" ]; then
  while IFS= read -r cidr || [ -n "$cidr" ]; do
    case "$cidr" in ''|'#'*) continue ;; esac
    nft add rule inet aegisvpn output ip daddr "$cidr" counter accept \
      comment "aegis-killswitch: operator allow"
  done < "$ALLOWLIST"
fi

# Finally: drop any output that would bypass the WireGuard interface.
nft add rule inet aegisvpn output counter drop comment "aegis-killswitch: drop non-wg output"
echo "aegis-killswitch: armed (output restricted to lo, ${WG_IF}, established + allowlisted)"
AEGIS_KS
chmod 0750 "$KS_HELPER"

# Apply the full ruleset now (flush + reload; fails loudly on syntax errors).
nft -f "$NFT_CONF"
systemctl enable nftables.service >/dev/null
msg "ruleset applied, nftables.service enabled"

# ---------------------------------------------------------------------------
# Step 8 — agent files
# ---------------------------------------------------------------------------
step "[8/12] Installing the server agent"
[ -f "$SCRIPT_DIR/agent/agent.js" ] || die "agent/agent.js not found next to this script — run it from the vpn-server/ directory of the AegisVPN repository"
[ -f "$SCRIPT_DIR/agent/package.json" ] || die "agent/package.json not found next to this script"
install -d -m 0755 "$AGENT_DIR"
install -m 0755 "$SCRIPT_DIR/agent/agent.js" "$AGENT_DIR/agent.js"
install -m 0644 "$SCRIPT_DIR/agent/package.json" "$AGENT_DIR/package.json"
msg "agent installed in ${AGENT_DIR} (zero npm dependencies — no install step needed)"

# ---------------------------------------------------------------------------
# Step 9 — /etc/aegisvpn/agent.env
# ---------------------------------------------------------------------------
step "[9/12] Writing ${ENV_FILE}"

# Prompt only when stdin is a TTY; env/CI installs must pass values explicitly.
prompt_value() { # <name> <prompt> [silent]
  local __name="$1" __prompt="$2" __silent="${3:-}" __input=""
  [ -n "${!__name:-}" ] && return 0
  if [ -t 0 ]; then
    if [ "$__silent" = "silent" ]; then
      read -rsp "$__prompt" __input; printf '\n' >&2
    else
      read -rp "$__prompt" __input
    fi
    printf -v "$__name" '%s' "$__input"
    export "$__name"
  fi
}

# Public endpoint host: explicit env > detected public IPv4 > hostname.
if [ -z "$AEGIS_SERVER_HOST" ]; then
  detected="$(curl -4 -fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"
  if printf '%s' "$detected" | grep -qE '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'; then
    AEGIS_SERVER_HOST="$detected"
  else
    AEGIS_SERVER_HOST="$(hostname)"
  fi
  msg "detected endpoint host: ${AEGIS_SERVER_HOST}"
fi

# Registration code: lowercase [a-z0-9-]{2,24}; derived from hostname unless set.
if [ -z "$AEGIS_SERVER_CODE" ]; then
  AEGIS_SERVER_CODE="$(hostname | tr 'A-Z' 'a-z' | sed -E 's/[^a-z0-9-]+/-/g; s/^-+//; s/-+$//' | cut -c1-24)"
fi
case "$AEGIS_SERVER_CODE" in
  [a-z0-9-][a-z0-9-]*) ;;
  *) AEGIS_SERVER_CODE="aegis-server" ;;
esac

if [ -f "$ENV_FILE" ] && [ "$AEGIS_FORCE_ENV" != "1" ]; then
  msg "keeping existing $ENV_FILE (set AEGIS_FORCE_ENV=1 to rewrite it)"
else
  prompt_value AEGIS_BACKEND_URL "Backend API base URL (e.g. https://api.example.com/api/v1): "
  [ -n "$AEGIS_BACKEND_URL" ] || die "AEGIS_BACKEND_URL is required — pass it as an env var or answer the prompt"
  prompt_value AEGIS_AGENT_TOKEN "Agent token from admin panel (input hidden): " silent
  if [ -z "$AEGIS_AGENT_TOKEN" ]; then
    AEGIS_AGENT_TOKEN="PASTE_AGENT_TOKEN_FROM_ADMIN_PANEL"
    msg "no agent token provided — placeholder written; paste the real token later (see final next steps)"
  fi
  umask 077
  cat > "$ENV_FILE" <<EOF
# AegisVPN agent configuration — CONTAINS A SECRET (0600, root only).
# Edit and run "systemctl restart aegis-agent" to apply.
AEGIS_BACKEND_URL=${AEGIS_BACKEND_URL}
AEGIS_AGENT_TOKEN=${AEGIS_AGENT_TOKEN}
# Server row id from the admin panel (informational hint for operators).
AEGIS_SERVER_ID=${AEGIS_SERVER_ID:-}
WG_INTERFACE=${AEGIS_IF}
# Registration metadata: the agent POSTs /agent/register once at startup.
AEGIS_SERVER_NAME=${AEGIS_SERVER_NAME}
AEGIS_SERVER_CODE=${AEGIS_SERVER_CODE}
AEGIS_SERVER_COUNTRY=${AEGIS_SERVER_COUNTRY}
AEGIS_SERVER_CITY=${AEGIS_SERVER_CITY}
AEGIS_SERVER_HOST=${AEGIS_SERVER_HOST}
AEGIS_SERVER_PORT=${AEGIS_PORT}
AEGIS_SERVER_CAPACITY=${AEGIS_SERVER_CAPACITY}
AEGIS_IPV4_PREFIX=${V4_PREFIX}
AEGIS_IPV6_PREFIX=${V6_PREFIX}
AEGIS_DNS=${AEGIS_DNS}
POLL_INTERVAL_SEC=${POLL_INTERVAL_SEC}
EOF
  chmod 600 "$ENV_FILE"
  umask 022
  msg "written with 0600 permissions"
fi

# ---------------------------------------------------------------------------
# Step 10 — systemd unit
# ---------------------------------------------------------------------------
step "[10/12] Writing ${UNIT_FILE}"
# If the node binary lives under /root or /home, ProtectHome=yes would hide it.
PROTECT_HOME_LINE="ProtectHome=yes"
case "$NODE_BIN" in
  /root/*|/home/*) PROTECT_HOME_LINE="ProtectHome=no # node binary lives under a home directory" ;;
esac
cat > "$UNIT_FILE" <<EOF
[Unit]
Description=AegisVPN server agent (control-plane heartbeat + peer ops)
Documentation=https://aegisvpn.invalid/vpn-server
Wants=network-online.target
After=network-online.target wg-quick@${AEGIS_IF}.service

[Service]
Type=simple
EnvironmentFile=${ENV_FILE}
WorkingDirectory=${AGENT_DIR}
ExecStart=${NODE_BIN} ${AGENT_DIR}/agent.js
Restart=always
RestartSec=10
SyslogIdentifier=aegis-agent
# Hardening: the agent runs as root (wg set needs CAP_NET_ADMIN) but gets a
# restricted filesystem view; it writes nothing outside its own stdout logs.
NoNewPrivileges=yes
PrivateTmp=yes
${PROTECT_HOME_LINE}
ProtectSystem=full

[Install]
WantedBy=multi-user.target
EOF
msg "unit written (Restart=always, EnvironmentFile=${ENV_FILE})"

# ---------------------------------------------------------------------------
# Step 11 — enable + start services
# ---------------------------------------------------------------------------
step "[11/12] Enabling services (wg-quick@${AEGIS_IF}, aegis-agent)"
systemctl daemon-reload
systemctl enable "wg-quick@${AEGIS_IF}.service" >/dev/null
systemctl enable aegis-agent.service >/dev/null
msg "enabled wg-quick@${AEGIS_IF}.service and aegis-agent.service"

if [ "$AEGIS_NO_START" = "1" ]; then
  msg "AEGIS_NO_START=1 — skipping service start"
else
  systemctl restart nftables.service || true
  systemctl restart "wg-quick@${AEGIS_IF}.service"
  systemctl restart aegis-agent.service
  sleep 3
  msg "wg status:"
  wg show "$AEGIS_IF" || true
  msg "agent registration (first log lines):"
  journalctl -u aegis-agent.service -n 15 --no-pager || true
fi

# ---------------------------------------------------------------------------
# Step 12 — summary: key, endpoint, sample peer template + QR, next steps
# ---------------------------------------------------------------------------
step "[12/12] Summary"

# Throwaway sample client keypair — for the QR template only. It is NOT
# registered in the control plane; use the admin panel/API for real clients.
sample_priv="$(umask 077; wg genkey)"
sample_pub="$(printf '%s' "$sample_priv" | wg pubkey)"
sample_v4="$(printf '%s' "$V4_PREFIX" | sed -E 's/\.0\/24$/.254/')"
sample_v6="${V6_PREFIX%/64}fe"

SERVER_PEER_BLOCK="[Peer]
# Sample manual test client (throwaway keys — see QR below).
PublicKey = ${sample_pub}
AllowedIPs = ${sample_v4}/32, ${sample_v6}/128"

CLIENT_CFG="[Interface]
# THROWAWAY sample keypair generated by install-aegis-server.sh.
# Replace with a real client provisioned from the AegisVPN control plane.
PrivateKey = ${sample_priv}
Address = ${sample_v4}/32, ${sample_v6}/128
DNS = ${AEGIS_DNS}

[Peer]
PublicKey = ${SERVER_PUB}
Endpoint = ${AEGIS_SERVER_HOST}:${AEGIS_PORT}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25"

cat <<EOF

==============================================================
 AegisVPN server installed
--------------------------------------------------------------
 endpoint   : ${AEGIS_SERVER_HOST}:${AEGIS_PORT}
 public key : ${SERVER_PUB}
 interface  : ${AEGIS_IF} (${AEGIS_IPV4}, ${AEGIS_IPV6})
 agent env  : ${ENV_FILE}
 agent logs : journalctl -u aegis-agent -f

 Sample server-side [Peer] block (for manual wg testing):
${SERVER_PEER_BLOCK}

 Sample client config (QR below; keys are throwaway):
${CLIENT_CFG}
==============================================================
EOF

if qrencode -t ansiutf8 "$CLIENT_CFG" 2>/dev/null; then
  :
else
  msg "(qrencode unavailable — client config printed above as text)"
fi

cat <<'EOF'
==============================================================
 NEXT STEPS
--------------------------------------------------------------
 1. In the web admin panel go to Servers -> New server and create
    the server row for this machine; the panel issues the
    agentToken (agt_...) for it.
 2. If you did not paste the token during install, put it into
    /etc/aegisvpn/agent.env as AEGIS_AGENT_TOKEN=agt_...
 3. systemctl restart aegis-agent
    -> the agent POSTs /agent/register (fills in details and
       flips the server row to active), then heartbeats and
       applies add_peer / remove_peer ops from the control plane.
 4. Optional kill switch:
    touch /etc/aegisvpn/killswitch
    systemctl restart wg-quick@wg0
    (exempt extra CIDRs via /etc/aegisvpn/killswitch.allow)
==============================================================
EOF
