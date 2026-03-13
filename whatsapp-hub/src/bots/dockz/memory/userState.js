import { getDb, logEvent } from "../db.js";

// const userState = new Map(); // Removed in favor of DB

export async function initUser(phone) {
  const db = getDb();
  // better-sqlite3: synchronous .get()
  const existing = db.prepare("SELECT phone FROM sessions WHERE phone = ?").get(phone);

  if (!existing) {
    db.prepare("INSERT INTO sessions (phone, step, template, data) VALUES (?, ?, ?, ?)").run(
      phone, null, null, JSON.stringify({})
    );
    logEvent(phone, "SESSION_START");
  }
}

export async function getUser(phone) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM sessions WHERE phone = ?").get(phone);

  if (!row) return null;

  return {
    step: row.step,
    template: row.template,
    data: row.data ? JSON.parse(row.data) : {}
  };
}

export async function setStep(phone, step) {
  const db = getDb();
  db.prepare("UPDATE sessions SET step = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?").run(step, phone);
  logEvent(phone, "STEP_CHANGE", { step });
}

export async function setTemplate(phone, template) {
  const db = getDb();
  db.prepare("UPDATE sessions SET template = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?").run(template, phone);
  logEvent(phone, "TEMPLATE_SET", { template });
}

export async function setData(phone, key, value) {
  const db = getDb();
  // We need to fetch current data, update it, and save it back
  const row = db.prepare("SELECT data FROM sessions WHERE phone = ?").get(phone);
  if (!row) return; // Should not happen if initUser was called

  const currentData = row.data ? JSON.parse(row.data) : {};
  currentData[key] = value;

  db.prepare("UPDATE sessions SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?").run(JSON.stringify(currentData), phone);
  // Optional: log specific critical data changes? heavy log.
  // logEvent(phone, "DATA_UPDATE", { key, value }); 
}

export async function resetUser(phone) {
  const db = getDb();
  db.prepare("UPDATE sessions SET step = NULL, template = NULL, data = ? WHERE phone = ?").run(JSON.stringify({}), phone);
  logEvent(phone, "SESSION_RESET");
}

export async function getUserStats() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT step, COUNT(*) as count 
    FROM sessions 
    WHERE updated_at > datetime('now', '-7 days')
    GROUP BY step 
    ORDER BY count DESC
  `).all();

  // Also get total users
  const total = db.prepare("SELECT COUNT(*) as count FROM sessions").get();

  return {
    rows,
    total: total?.count || 0
  };
}