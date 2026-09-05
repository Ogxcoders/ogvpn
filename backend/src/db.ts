import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type DB = Database.Database;

/** Registry of open databases so each app instance owns exactly one. */
const open = new Set<DB>();

let dbQueryCount = 0;

export function metrics(): { dbQueryCount: number } {
  return { dbQueryCount };
}

/**
 * Opens (or creates) the SQLite database and applies pending migrations
 * in filename order, each inside a transaction. Every call returns an
 * independent connection owned by the caller.
 */
export function openDatabase(databasePath: string): DB {
  const isMemory = databasePath === ":memory:";
  if (!isMemory) {
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  }
  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const migrationsDir = path.resolve(__dirname, "../migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const appliedRows = db
    .prepare("SELECT version FROM schema_migrations")
    .all() as Array<{ version: string }>;
  const applied = new Set(appliedRows.map((r) => r.version));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(
        file,
        new Date().toISOString(),
      );
    })();
  }

  open.add(db);
  return db;
}

/** Closes a specific connection (preferred) or every open connection. */
export function closeDatabase(target?: DB): void {
  if (target) {
    if (open.has(target) && target.open) target.close();
    open.delete(target);
    return;
  }
  for (const db of open) {
    if (db.open) db.close();
  }
  open.clear();
}

/** Instrumented query helper — counts queries for /metrics. */
export function query<T = unknown>(db: DB, sql: string, ...params: unknown[]): T[] {
  dbQueryCount += 1;
  return db.prepare(sql).all(...params) as T[];
}

export function queryOne<T = unknown>(db: DB, sql: string, ...params: unknown[]): T | undefined {
  dbQueryCount += 1;
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(db: DB, sql: string, ...params: unknown[]): void {
  dbQueryCount += 1;
  db.prepare(sql).run(...params);
}
