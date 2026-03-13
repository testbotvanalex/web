import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Use environment variable or default relative path
const DB_PATH = process.env.SQLITE_PATH || path.resolve(process.cwd(), "data.sqlite");

let db;

export function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    // Optimization pragma
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export async function initNotariesSchema() {
  const db = getDb();

  // Create table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fio TEXT,
      license TEXT,
      address TEXT,
      phone_raw TEXT,
      phone TEXT,
      email TEXT,
      region TEXT,
      worktime TEXT,
      status TEXT,
      source_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notaries_fio ON notaries(fio);
    CREATE INDEX IF NOT EXISTS idx_notaries_region ON notaries(region);
  `);

  // Trigger for updated_at
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_notaries_updated_at
    AFTER UPDATE ON notaries
    FOR EACH ROW
    BEGIN
      UPDATE notaries SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);

  // Also ensure sessions table exists (migration from old code)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      phone TEXT PRIMARY KEY,
      step TEXT,
      data TEXT,
      template TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reminded_at DATETIME,
      reminder_count INTEGER DEFAULT 0,
      admin_alerted_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      event_type TEXT,
      event_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Ensure admin_alerted_at exists (if table already existed)
  try {
    db.prepare("ALTER TABLE sessions ADD COLUMN admin_alerted_at DATETIME").run();
  } catch (e) {
    // Ignore error if column exists (SqliteError: duplicate column name...)
  }

  console.log("✅ SQLite DB schema initialized (notaries + sessions + events).");
  return db;
}

export function logEvent(phone, type, data = null) {
  try {
    const db = getDb();
    const payload = data ? JSON.stringify(data) : null;
    db.prepare("INSERT INTO events (phone, event_type, event_data) VALUES (?, ?, ?)").run(phone, type, payload);
  } catch (e) {
    console.error("Failed to log event:", e);
  }
}

export function searchNotaries(query) {
  const db = getDb();
  if (!query || query.length < 2) return [];

  // SQLite LIKE is case-sensitive for Cyrillic by default on many systems.
  // Since we have < 2000 rows, it's faster and safer to filter in JS.
  const all = db.prepare("SELECT * FROM notaries").all();
  const q = query.toLowerCase().trim();

  return all.filter(n =>
    (n.fio && n.fio.toLowerCase().includes(q)) ||
    (n.region && n.region.toLowerCase().includes(q)) ||
    (n.license && n.license.toLowerCase().includes(q))
  ).slice(0, 15);
}

export function getNotaryById(id) {
  const db = getDb();
  return db.prepare("SELECT * FROM notaries WHERE id = ?").get(id);
}

// Auto-init on import (optional, but keeps existing behavior of log on startup)
try {
  getDb();
} catch (e) {
  console.error(e);
}