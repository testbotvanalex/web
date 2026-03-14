const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'botmatic.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Performance settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id         TEXT PRIMARY KEY,
    company    TEXT NOT NULL,
    niche      TEXT,
    contact_name  TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    contract_url  TEXT,
    goal       TEXT DEFAULT 'leads',
    tone       TEXT DEFAULT 'friendly',
    language   TEXT DEFAULT 'ru',
    restrictions TEXT DEFAULT '[]',
    status     TEXT DEFAULT 'new',
    sla_owner  TEXT,
    sla_deadline TEXT,
    priority   TEXT DEFAULT 'normal',
    notes      TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bots (
    id           TEXT PRIMARY KEY,
    client_id    TEXT NOT NULL,
    name         TEXT,
    prompt       TEXT DEFAULT '',
    knowledge_base TEXT DEFAULT '',
    flow         TEXT DEFAULT NULL,
    version      INTEGER DEFAULT 1,
    last_deploy  TEXT,
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS channels (
    id            TEXT PRIMARY KEY,
    client_id     TEXT NOT NULL,
    bot_id        TEXT,
    type          TEXT NOT NULL,
    status        TEXT DEFAULT 'disconnected',
    page_id       TEXT,
    page_name     TEXT,
    token         TEXT,
    token_expiry  TEXT,
    username      TEXT,
    connected_at  TEXT,
    connected_by  TEXT DEFAULT 'admin',
    webhook_active INTEGER DEFAULT 0,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY,
    client_id   TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT DEFAULT 'todo',
    due_date    TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    client_id   TEXT NOT NULL,
    channel     TEXT NOT NULL,
    sender_id   TEXT,
    sender_name TEXT,
    text        TEXT,
    direction   TEXT DEFAULT 'in',
    raw         TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chats (
    id              TEXT PRIMARY KEY,
    client_id       TEXT NOT NULL,
    channel         TEXT NOT NULL,
    sender_id       TEXT NOT NULL,
    sender_name     TEXT,
    mode            TEXT DEFAULT 'bot',
    status          TEXT DEFAULT 'open',
    assigned_user_id TEXT,
    unread_count    INTEGER DEFAULT 0,
    last_message_at TEXT DEFAULT (datetime('now')),
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE (client_id, channel, sender_id)
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id          TEXT PRIMARY KEY,
    client_id   TEXT,
    action      TEXT NOT NULL,
    details     TEXT,
    actor       TEXT DEFAULT 'admin',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_bots_client        ON bots(client_id);
  CREATE INDEX IF NOT EXISTS idx_channels_client    ON channels(client_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_client       ON tasks(client_id);
  CREATE INDEX IF NOT EXISTS idx_messages_client    ON messages(client_id);
  CREATE INDEX IF NOT EXISTS idx_messages_thread    ON messages(client_id, channel, sender_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created   ON messages(created_at);
  CREATE INDEX IF NOT EXISTS idx_chats_client       ON chats(client_id);
  CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at);
  CREATE INDEX IF NOT EXISTS idx_activity_client    ON activity_log(client_id);
  CREATE INDEX IF NOT EXISTS idx_clients_status     ON clients(status);
`);

// ── Migrations (safe: ignore if column already exists) ────────────────────────
try { db.exec(`ALTER TABLE bots ADD COLUMN flow TEXT DEFAULT NULL`); } catch (_) {}
try { db.exec(`ALTER TABLE clients ADD COLUMN portal_password TEXT DEFAULT NULL`); } catch (_) {}
try { db.exec(`ALTER TABLE clients ADD COLUMN portal_login TEXT DEFAULT NULL`); } catch (_) {}

// ── Helpers ──────────────────────────────────────────────────────────────────

function genId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function touch(id) {
  db.prepare(`UPDATE clients SET updated_at = datetime('now') WHERE id = ?`).run(id);
}

function log(clientId, action, details = '', actor = 'admin') {
  db.prepare(
    `INSERT INTO activity_log (id, client_id, action, details, actor) VALUES (?, ?, ?, ?, ?)`
  ).run(genId('log_'), clientId, action, details, actor);
}

// ── Clients ──────────────────────────────────────────────────────────────────

const clientQ = {
  all: db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM bots    WHERE client_id = c.id) AS bot_count,
      (SELECT COUNT(*) FROM channels WHERE client_id = c.id AND status = 'connected') AS channels_connected,
      (SELECT GROUP_CONCAT(type) FROM channels WHERE client_id = c.id AND status = 'connected') AS channel_types,
      (SELECT COUNT(*) FROM tasks   WHERE client_id = c.id AND status != 'done') AS tasks_open
    FROM clients c
    ORDER BY c.created_at DESC
  `),

  byId: db.prepare(`SELECT * FROM clients WHERE id = ?`),

  insert: db.prepare(`
    INSERT INTO clients (id, company, niche, contact_name, contact_phone, contact_email,
      contract_url, goal, tone, language, restrictions, status, sla_owner, sla_deadline, priority, notes)
    VALUES (@id, @company, @niche, @contact_name, @contact_phone, @contact_email,
      @contract_url, @goal, @tone, @language, @restrictions, @status, @sla_owner, @sla_deadline, @priority, @notes)
  `),

  update: db.prepare(`
    UPDATE clients SET
      company = @company, niche = @niche, contact_name = @contact_name,
      contact_phone = @contact_phone, contact_email = @contact_email,
      contract_url = @contract_url, goal = @goal, tone = @tone,
      language = @language, restrictions = @restrictions, status = @status,
      sla_owner = @sla_owner, sla_deadline = @sla_deadline, priority = @priority,
      notes = @notes, updated_at = datetime('now')
    WHERE id = @id
  `),

  delete: db.prepare(`DELETE FROM clients WHERE id = ?`),

  updateStatus: db.prepare(`UPDATE clients SET status = ?, updated_at = datetime('now') WHERE id = ?`),
};

// ── Bots ─────────────────────────────────────────────────────────────────────

const botQ = {
  byClient: db.prepare(`SELECT * FROM bots WHERE client_id = ? ORDER BY created_at DESC`),
  byId:     db.prepare(`SELECT * FROM bots WHERE id = ?`),

  insert: db.prepare(`
    INSERT INTO bots (id, client_id, name, prompt, knowledge_base)
    VALUES (@id, @client_id, @name, @prompt, @knowledge_base)
  `),

  update: db.prepare(`
    UPDATE bots SET name = @name, prompt = @prompt, knowledge_base = @knowledge_base,
      version = version + 1, last_deploy = datetime('now'), updated_at = datetime('now')
    WHERE id = @id
  `),

  updateFlow: db.prepare(`
    UPDATE bots SET flow = @flow, updated_at = datetime('now') WHERE id = @id
  `),

  delete: db.prepare(`DELETE FROM bots WHERE id = ?`),
};

// ── Channels ──────────────────────────────────────────────────────────────────

const channelQ = {
  byClient: db.prepare(`SELECT * FROM channels WHERE client_id = ? ORDER BY type`),
  byId:     db.prepare(`SELECT * FROM channels WHERE id = ?`),
  byBotAndType: db.prepare(`SELECT * FROM channels WHERE bot_id = ? AND type = ?`),

  upsert: db.prepare(`
    INSERT INTO channels (id, client_id, bot_id, type, status, page_id, page_name,
      token, token_expiry, username, connected_at, connected_by, webhook_active)
    VALUES (@id, @client_id, @bot_id, @type, @status, @page_id, @page_name,
      @token, @token_expiry, @username, @connected_at, @connected_by, @webhook_active)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status, page_id = excluded.page_id, page_name = excluded.page_name,
      token = excluded.token, token_expiry = excluded.token_expiry,
      username = excluded.username, connected_at = excluded.connected_at,
      webhook_active = excluded.webhook_active
  `),

  updateStatus: db.prepare(`UPDATE channels SET status = ? WHERE id = ?`),
  disconnect:   db.prepare(`UPDATE channels SET status = 'disconnected', token = NULL, page_id = NULL, connected_at = NULL WHERE id = ?`),
  delete:       db.prepare(`DELETE FROM channels WHERE id = ?`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

const taskQ = {
  byClient: db.prepare(`SELECT * FROM tasks WHERE client_id = ? ORDER BY status, due_date`),

  insert: db.prepare(`
    INSERT INTO tasks (id, client_id, title, description, status, due_date)
    VALUES (@id, @client_id, @title, @description, @status, @due_date)
  `),

  update: db.prepare(`
    UPDATE tasks SET title = @title, description = @description,
      status = @status, due_date = @due_date
    WHERE id = @id
  `),

  delete: db.prepare(`DELETE FROM tasks WHERE id = ?`),
};

// ── Messages ──────────────────────────────────────────────────────────────────

const messageQ = {
  byClient: db.prepare(`
    SELECT * FROM messages WHERE client_id = ?
    ORDER BY created_at DESC LIMIT ?
  `),

  // История конкретного чата (для контекста OpenAI)
  history: db.prepare(`
    SELECT direction, text FROM messages
    WHERE client_id = ? AND sender_id = ? AND text IS NOT NULL
    ORDER BY created_at DESC LIMIT ?
  `),

  historyByThread: db.prepare(`
    SELECT direction, text FROM messages
    WHERE client_id = ? AND channel = ? AND sender_id = ? AND text IS NOT NULL
    ORDER BY created_at DESC LIMIT ?
  `),

  byThread: db.prepare(`
    SELECT * FROM messages
    WHERE client_id = ? AND channel = ? AND sender_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `),

  insert: db.prepare(`
    INSERT OR IGNORE INTO messages (id, client_id, channel, sender_id, sender_name, text, direction, raw)
    VALUES (@id, @client_id, @channel, @sender_id, @sender_name, @text, @direction, @raw)
  `),
};

// ── Chats ─────────────────────────────────────────────────────────────────────

const chatQ = {
  list: db.prepare(`
    SELECT
      ch.*,
      c.company,
      (
        SELECT m.text
        FROM messages m
        WHERE m.client_id = ch.client_id
          AND m.channel = ch.channel
          AND m.sender_id = ch.sender_id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) AS last_message_text
    FROM chats ch
    INNER JOIN clients c ON c.id = ch.client_id
    ORDER BY ch.last_message_at DESC
  `),

  byId: db.prepare(`SELECT * FROM chats WHERE id = ?`),

  byThread: db.prepare(`
    SELECT * FROM chats
    WHERE client_id = ? AND channel = ? AND sender_id = ?
    LIMIT 1
  `),

  insert: db.prepare(`
    INSERT INTO chats (id, client_id, channel, sender_id, sender_name, mode, status, unread_count, last_message_at)
    VALUES (@id, @client_id, @channel, @sender_id, @sender_name, @mode, @status, @unread_count, @last_message_at)
  `),

  touchIncoming: db.prepare(`
    UPDATE chats
    SET
      sender_name = COALESCE(NULLIF(@sender_name, ''), sender_name),
      unread_count = unread_count + 1,
      status = 'open',
      last_message_at = @last_message_at,
      updated_at = datetime('now')
    WHERE id = @id
  `),

  touchOutgoing: db.prepare(`
    UPDATE chats
    SET
      sender_name = COALESCE(NULLIF(@sender_name, ''), sender_name),
      last_message_at = @last_message_at,
      updated_at = datetime('now')
    WHERE id = @id
  `),

  setMode: db.prepare(`
    UPDATE chats
    SET mode = ?, updated_at = datetime('now')
    WHERE id = ?
  `),

  markRead: db.prepare(`
    UPDATE chats
    SET unread_count = 0, updated_at = datetime('now')
    WHERE id = ?
  `),

  ensureFromMessages: db.prepare(`
    INSERT OR IGNORE INTO chats (id, client_id, channel, sender_id, sender_name, mode, status, unread_count, last_message_at, created_at, updated_at)
    SELECT
      'chat_' || lower(hex(randomblob(8))),
      m.client_id,
      m.channel,
      m.sender_id,
      MAX(COALESCE(m.sender_name, m.sender_id)),
      'bot',
      'open',
      0,
      MAX(m.created_at),
      datetime('now'),
      datetime('now')
    FROM messages m
    WHERE m.sender_id IS NOT NULL AND m.sender_id != ''
    GROUP BY m.client_id, m.channel, m.sender_id
  `),
};

// ── Activity ──────────────────────────────────────────────────────────────────

const activityQ = {
  byClient: db.prepare(`
    SELECT * FROM activity_log WHERE client_id = ?
    ORDER BY created_at DESC LIMIT 50
  `),
  recent: db.prepare(`
    SELECT a.*, c.company FROM activity_log a
    LEFT JOIN clients c ON c.id = a.client_id
    ORDER BY a.created_at DESC LIMIT 100
  `),
};

// ── Stats ─────────────────────────────────────────────────────────────────────

const statsQ = {
  overview: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM clients) AS total_clients,
      (SELECT COUNT(*) FROM clients WHERE status IN ('live','support')) AS live_clients,
      (SELECT COUNT(*) FROM channels WHERE status = 'connected') AS connected_channels,
      (SELECT COUNT(*) FROM tasks WHERE status != 'done') AS open_tasks,
      (SELECT COUNT(*) FROM messages WHERE direction = 'in' AND date(created_at) = date('now')) AS messages_today,
      (SELECT COUNT(*) FROM messages WHERE direction = 'in') AS messages_total,
      (SELECT COUNT(*) FROM messages WHERE direction = 'in' AND date(created_at) >= date('now','-7 days')) AS messages_week
  `),

  byStatus: db.prepare(`
    SELECT status, COUNT(*) as count FROM clients GROUP BY status
  `),
};

module.exports = {
  db,
  genId,
  touch,
  log,
  clients:  clientQ,
  bots:     botQ,
  channels: channelQ,
  tasks:    taskQ,
  messages: messageQ,
  chats:    chatQ,
  activity: activityQ,
  stats:    statsQ,
};
