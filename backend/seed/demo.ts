/**
 * Demo dataset (spec §37). Run: npm run seed:demo
 *
 * DEMO DATA IS CLEARLY SEPARATED:
 *  - Seeded into the database file given by DATABASE_PATH (default ./data/aegis.db)
 *    — point it at ./data/demo.db to keep demo isolated from any real data.
 *  - Every demo user password is a well-known fixture ("DemoPass123") and is
 *    printed here. NEVER run this seed against a production database.
 */
import { loadConfig } from "../src/config.js";
import { buildApp } from "../src/app.js";
import { closeDatabase } from "../src/db.js";
import { hashPassword } from "../src/lib/passwords.js";
import { queryOne, run, query } from "../src/db.js";
import { newId, nowIso } from "../src/lib/util.js";
import crypto from "node:crypto";

const DEMO_PASSWORD = "DemoPass123";

function wgKey(seed: string): string {
  // Generates a valid 32-byte base64 key deterministically for fixtures.
  const buf = crypto.createHash("sha256").update(`aegis-demo-${seed}`).digest();
  return buf.toString("base64");
}

function days(n: number): string {
  return new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();
}

export function seedDemo(databasePath?: string): void {
  const cfg = loadConfig({
    ...process.env,
    DATABASE_PATH: databasePath ?? process.env.DATABASE_PATH ?? "./data/demo.db",
    NODE_ENV: process.env.NODE_ENV ?? "development",
    // Seeding never signs tokens; provide a throwaway secret if unset.
    JWT_SECRET: process.env.JWT_SECRET ?? "demo-seed-only-not-used-for-signing",
  });
  const { db } = buildApp(cfg);

  const existing = queryOne<{ c: number }>(db, "SELECT COUNT(*) AS c FROM users");
  if ((existing?.c ?? 0) > 0) {
    console.error("Database already contains users. Refusing to seed demo data over it.");
    console.error(`DATABASE_PATH=${cfg.databasePath}`);
    process.exit(1);
  }

  const pwd = hashPassword(DEMO_PASSWORD);
  const users: Array<{ id: string; email: string; name: string; role: string }> = [];
  const addUser = (email: string, name: string, role: "user" | "admin" = "user") => {
    const id = newId();
    run(
      db,
      "INSERT INTO users (id, email, password_hash, name, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)",
      id,
      email,
      pwd,
      name,
      role,
      nowIso(),
      nowIso(),
    );
    users.push({ id, email, name, role });
    return id;
  };

  const demo = addUser("demo@aegisvpn.local", "Demo User");
  const premium = addUser("premium@aegisvpn.local", "Premium User");
  const expired = addUser("expired@aegisvpn.local", "Expired Subscription User");
  const disabled = addUser("disabled@aegisvpn.local", "Disabled User");
  const fresh = addUser("new@aegisvpn.local", "New User");
  const admin = addUser("admin@aegisvpn.local", "Demo Admin", "admin");

  // Disabled user is disabled.
  run(db, "UPDATE users SET status = 'disabled' WHERE id = ?", disabled);

  // Subscriptions: free (demo), premium active, expired, canceled, free (new).
  const sub = (userId: string, plan: string, status: string, periodEnd: string | null) => {
    run(
      db,
      "INSERT INTO subscriptions (id, user_id, plan, status, current_period_end, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      newId(),
      userId,
      plan,
      status,
      periodEnd,
      nowIso(),
      nowIso(),
    );
  };
  sub(demo, "free", "active", null);
  sub(premium, "premium", "active", days(21));
  sub(expired, "premium", "expired", days(-3));
  sub(disabled, "free", "active", null);
  sub(fresh, "free", "active", null);
  sub(admin, "premium", "active", days(60));

  // Plans catalog.
  const plan = (code: string, name: string, cents: number, maxDevices: number, features: string[]) => {
    run(
      db,
      "INSERT OR REPLACE INTO plans (code, name, price_cents, interval, max_devices, features) VALUES (?, ?, ?, 'month', ?, ?)",
      code,
      name,
      cents,
      maxDevices,
      JSON.stringify(features),
    );
  };
  plan("free", "Free", 0, 2, ["2 devices", "All server regions", "Kill switch", "Unlimited data"]);
  plan("premium", "Premium", 700, 10, [
    "10 devices",
    "Priority routing",
    "Multi-hop (roadmap)",
    "Dedicated IPv6",
    "Kill switch",
  ]);

  // Servers covering spec §37 server matrix.
  const serverDefs = [
    { code: "nl-ams-01", name: "Amsterdam-1", country: "Netherlands", city: "Amsterdam", host: "ams01.demo.aegisvpn.local", port: 51820, status: "active", capacity: 250, ipv6: "fd00:0a11::/64", key: "K1" },
    { code: "de-fra-01", name: "Frankfurt-1", country: "Germany", city: "Frankfurt", host: "fra01.demo.aegisvpn.local", port: 51820, status: "active", capacity: 250, ipv6: "fd00:0a12::/64", key: "K2" },
    { code: "us-nyc-01", name: "NewYork-1", country: "United States", city: "New York", host: "nyc01.demo.aegisvpn.local", port: 51820, status: "active", capacity: 250, ipv6: "fd00:0a13::/64", key: "K3" },
    { code: "sg-sin-01", name: "Singapore-1", country: "Singapore", city: "Singapore", host: "sin01.demo.aegisvpn.local", port: 51820, status: "maintenance", capacity: 250, ipv6: "fd00:0a14::/64", key: "K4" },
    { code: "jp-tyo-01", name: "Tokyo-1", country: "Japan", city: "Tokyo", host: "tyo01.demo.aegisvpn.local", port: 51820, status: "offline", capacity: 250, ipv6: "fd00:0a15::/64", key: "K5" },
    { code: "uk-lon-01", name: "London-1", country: "United Kingdom", city: "London", host: "lon01.demo.aegisvpn.local", port: 51820, status: "drain", capacity: 250, ipv6: "fd00:0a16::/64", key: "K6" },
    { code: "fi-hel-01", name: "Helsinki-1", country: "Finland", city: "Helsinki", host: "hel01.demo.aegisvpn.local", port: 51820, status: "active", capacity: 60, ipv6: "::/0", key: "K7" },
  ];
  const serverIds: Record<string, string> = {};
  serverDefs.forEach((s, i) => {
    const id = newId();
    serverIds[s.code] = id;
    run(
      db,
      `INSERT INTO servers (id, code, name, country, city, host, port, public_key, ipv4_prefix, ipv6_prefix, dns, status, capacity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      s.code,
      s.name,
      s.country,
      s.city,
      s.host,
      s.port,
      wgKey(`server-${i}`),
      `10.13.${i}.0/24`,
      s.ipv6,
      "10.13.0.1",
      s.status,
      s.capacity,
      nowIso(),
      nowIso(),
    );
  });

  // Devices per spec §37 (android/windows/macos/linux, online/offline/stale).
  const device = (userId: string, name: string, platform: string, uid: string, lastActive: string | null) => {
    const id = newId();
    run(
      db,
      "INSERT INTO devices (id, user_id, name, platform, device_uid, status, last_active_at, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)",
      id,
      userId,
      name,
      platform,
      uid,
      lastActive,
      nowIso(),
    );
    return id;
  };
  const dPhone = device(demo, "Pixel 8", "android", crypto.randomUUID(), nowIso());
  device(demo, "Demo Laptop", "linux", crypto.randomUUID(), nowIso());
  const pWin = device(premium, "Gaming PC", "windows", crypto.randomUUID(), nowIso());
  const pMac = device(premium, "MacBook Pro", "macos", crypto.randomUUID(), days(-9));
  const pLinux = device(premium, "Ubuntu Box", "linux", crypto.randomUUID(), days(-40));

  // Tunnels + sessions: connected, reconnecting, expired, failed (§37 sessions).
  const mkTunnel = (
    userId: string,
    deviceId: string,
    serverId: string,
    keyIdx: number,
    v4Host: number,
  ) => {
    const id = newId();
    const prefixRow = queryOne<{ ipv4_prefix: string; ipv6_prefix: string }>(
      db,
      "SELECT ipv4_prefix, ipv6_prefix FROM servers WHERE id = ?",
      serverId,
    )!;
    const v4 = `${prefixRow.ipv4_prefix.split(".0/24")[0]}.${v4Host}`;
    const v6 = prefixRow.ipv6_prefix === "::/0" ? "::" : `${prefixRow.ipv6_prefix.replace(/::\/\d+$/, "::")}${v4Host.toString(16)}`;
    run(
      db,
      "INSERT INTO tunnels (id, user_id, device_id, server_id, public_key, address_v4, address_v6, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)",
      id,
      userId,
      deviceId,
      serverId,
      wgKey(`tunnel-${keyIdx}`),
      v4,
      v6,
      nowIso(),
    );
    return id;
  };
  const ams = serverIds["nl-ams-01"];
  const fra = serverIds["de-fra-01"];
  const nyc = serverIds["us-nyc-01"];

  const t1 = mkTunnel(demo, dPhone, ams, 1, 2);
  const t2 = mkTunnel(premium, pWin, ams, 2, 3);
  const t3 = mkTunnel(premium, pMac, fra, 3, 2);
  mkTunnel(premium, pLinux, nyc, 4, 4);

  const session = (
    userId: string,
    deviceId: string,
    serverId: string,
    tunnelId: string,
    state: string,
    ago: number,
  ) => {
    run(
      db,
      "INSERT INTO sessions (id, user_id, device_id, server_id, tunnel_id, state, bytes_in, bytes_out, last_handshake_at, connected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      newId(),
      userId,
      deviceId,
      serverId,
      tunnelId,
      state,
      Math.floor(Math.random() * 5_000_000_000),
      Math.floor(Math.random() * 5_000_000_000),
      new Date(Date.now() - ago * 1000).toISOString(),
      new Date(Date.now() - ago * 3 * 1000).toISOString(),
    );
  };
  session(demo, dPhone, ams, t1, "connected", 20);
  session(premium, pWin, ams, t2, "connected", 45);
  session(premium, pMac, fra, t3, "reconnecting", 240);

  // Demo support tickets.
  const ticket = (userId: string, subject: string, status: string) => {
    run(
      db,
      "INSERT INTO tickets (id, user_id, subject, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      newId(),
      userId,
      subject,
      status,
      nowIso(),
      nowIso(),
    );
  };
  ticket(demo, "Cannot reach server Tokyo-1", "open");
  ticket(premium, "Billing question about Premium", "waiting");
  ticket(expired, "Resubscribe after expiry", "resolved");

  const userCount = query<{ id: string }>(db, "SELECT id FROM users").length;
  closeDatabase(db); // graceful close: better-sqlite3 aborts on exit with open statements
  console.log("Demo data seeded.");
  console.log(`  database : ${cfg.databasePath}`);
  console.log(`  users    : ${userCount} (demo, premium, expired, disabled, new, admin)`);
  console.log(`  password : ${DEMO_PASSWORD} (fixture only — demo environments only)`);
  console.log("  servers  : healthy x3, maintenance, offline, drain, IPv4-only");
  console.log("  sessions : connected x2, reconnecting x1");
  console.log("\n⚠  Demo data must never be seeded into production (all fixture passwords are public).");
}

seedDemo(process.argv[2]);
