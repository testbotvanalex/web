// src/db/db.js
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storageDir = path.join(__dirname, "..", "..", "storage");

// Ensure storage directory exists
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

const dbPath = path.join(storageDir, "sqlite.db");
export const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    phone_number_id TEXT PRIMARY KEY,
    display_phone TEXT,
    bot_key TEXT NOT NULL DEFAULT 'defaultBot',
    language TEXT DEFAULT 'ru',
    enabled INTEGER DEFAULT 1,
    config TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS processed_messages (
    message_id TEXT PRIMARY KEY,
    phone_number_id TEXT,
    processed_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_processed_phone 
    ON processed_messages(phone_number_id);
`);

console.log("✅ Database initialized:", dbPath);

export default db;
