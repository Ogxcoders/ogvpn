-- AegisVPN schema v1
-- SQLite. Applied transactionally by src/db.ts in filename order.

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','deleted')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE devices (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  platform       TEXT NOT NULL CHECK (platform IN ('android','windows','macos','linux','web')),
  device_uid     TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  last_active_at TEXT,
  created_at     TEXT NOT NULL,
  UNIQUE (user_id, device_uid)
);

CREATE TABLE refresh_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id   TEXT REFERENCES devices(id) ON DELETE SET NULL,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  revoked_at  TEXT,
  replaced_by TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE servers (
  id                 TEXT PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  country            TEXT NOT NULL,
  city               TEXT NOT NULL,
  host               TEXT NOT NULL,
  port               INTEGER NOT NULL,
  public_key         TEXT NOT NULL,
  ipv4_prefix        TEXT NOT NULL,
  ipv6_prefix        TEXT NOT NULL,
  dns                TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','maintenance','drain','offline','retired')),
  capacity           INTEGER NOT NULL DEFAULT 250,
  agent_token_hash   TEXT,
  last_heartbeat_at  TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE TABLE tunnels (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id    TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  server_id    TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  public_key   TEXT NOT NULL UNIQUE,
  address_v4   TEXT NOT NULL,
  address_v6   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','rotated')),
  created_at   TEXT NOT NULL,
  revoked_at   TEXT
);
CREATE INDEX idx_tunnels_server ON tunnels(server_id, status);
CREATE INDEX idx_tunnels_user ON tunnels(user_id, status);

CREATE TABLE sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id    TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  server_id    TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  tunnel_id    TEXT NOT NULL REFERENCES tunnels(id) ON DELETE CASCADE,
  state        TEXT NOT NULL DEFAULT 'connected' CHECK (state IN ('connected','reconnecting','closed','failed')),
  bytes_in     INTEGER NOT NULL DEFAULT 0,
  bytes_out    INTEGER NOT NULL DEFAULT 0,
  last_handshake_at TEXT,
  connected_at TEXT NOT NULL,
  closed_at    TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id, state);
CREATE INDEX idx_sessions_server ON sessions(server_id, state);

CREATE TABLE server_ops (
  id         TEXT PRIMARY KEY,
  server_id  TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('add_peer','remove_peer')),
  payload    TEXT NOT NULL,            -- JSON
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','dispatched','applied','failed','dead')),
  attempts   INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  applied_at TEXT
);
CREATE INDEX idx_ops_pending ON server_ops(server_id, status, created_at);

CREATE TABLE subscriptions (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan               TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium')),
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','canceled','expired','past_due')),
  current_period_end TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE TABLE plans (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  interval    TEXT NOT NULL CHECK (interval IN ('month','year')),
  max_devices INTEGER NOT NULL,
  features    TEXT NOT NULL            -- JSON array of strings
);

CREATE TABLE notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read_at    TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);

CREATE TABLE audit_log (
  id            TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  target_type   TEXT,
  target_id     TEXT,
  meta          TEXT,                  -- JSON
  created_at    TEXT NOT NULL
);
CREATE INDEX idx_audit_created ON audit_log(created_at);

CREATE TABLE tickets (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','waiting','resolved')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE ticket_messages (
  id         TEXT PRIMARY KEY,
  ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE idempotency_keys (
  key        TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  endpoint   TEXT NOT NULL,
  status     INTEGER NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE password_resets (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL
);
