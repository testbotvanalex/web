#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const ROOT = path.join(__dirname, '..');
const BOTMATIC_DB = path.join(ROOT, 'data', 'botmatic.db');
const STORE_JSON = path.join(ROOT, 'data', 'channel-store.json');
const TENANTS_DB = path.join(ROOT, 'whatsapp-hub', 'storage', 'sqlite.db');

const now = () => new Date().toISOString();
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'legacy';

function ensureTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS legacy_sync_map (
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      bot_id TEXT NOT NULL,
      synced_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (source_type, source_id)
    );
  `);
}

function upsertClientAndBot(db, sourceType, sourceId, botName) {
  const map = db.prepare('SELECT * FROM legacy_sync_map WHERE source_type = ? AND source_id = ?').get(sourceType, sourceId);
  if (map) {
    return { clientId: map.client_id, botId: map.bot_id, created: false };
  }

  const suffix = slug(sourceId);
  const clientId = `client_legacy_${suffix}`;
  const botId = `bot_legacy_${suffix}`;

  const existingClient = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
  if (!existingClient) {
    db.prepare(`
      INSERT INTO clients (id, company, contact_name, contact_email, goal, tone, language, restrictions, status, priority, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'support', 'friendly', 'ru', '[]', 'active', 'normal', ?, ?, ?)
    `).run(
      clientId,
      `Imported · ${botName || sourceId}`,
      'Legacy Import',
      'import@botmatic.local',
      `Auto imported from ${sourceType}:${sourceId}`,
      now(),
      now()
    );
  }

  const existingBot = db.prepare('SELECT id FROM bots WHERE id = ?').get(botId);
  if (!existingBot) {
    db.prepare(`
      INSERT INTO bots (id, client_id, name, prompt, knowledge_base, version, created_at, updated_at)
      VALUES (?, ?, ?, '', '', 1, ?, ?)
    `).run(botId, clientId, botName || `Imported ${sourceId}`, now(), now());
  }

  db.prepare(`
    INSERT OR REPLACE INTO legacy_sync_map (source_type, source_id, client_id, bot_id, synced_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(sourceType, sourceId, clientId, botId, now());

  return { clientId, botId, created: true };
}

function upsertChannel(db, { clientId, botId, type, status, pageId, pageName, username, token }) {
  const existing = db.prepare('SELECT id FROM channels WHERE client_id = ? AND bot_id = ? AND type = ?').get(clientId, botId, type);
  const id = existing?.id || `ch_${slug(clientId + '_' + botId + '_' + type)}`;

  db.prepare(`
    INSERT INTO channels (id, client_id, bot_id, type, status, page_id, page_name, token, username, connected_at, connected_by, webhook_active)
    VALUES (@id, @client_id, @bot_id, @type, @status, @page_id, @page_name, @token, @username, @connected_at, 'sync', @webhook_active)
    ON CONFLICT(id) DO UPDATE SET
      status=excluded.status,
      page_id=COALESCE(excluded.page_id, channels.page_id),
      page_name=COALESCE(excluded.page_name, channels.page_name),
      token=COALESCE(excluded.token, channels.token),
      username=COALESCE(excluded.username, channels.username),
      connected_at=excluded.connected_at,
      webhook_active=excluded.webhook_active
  `).run({
    id,
    client_id: clientId,
    bot_id: botId,
    type,
    status: status || 'connected',
    page_id: pageId || null,
    page_name: pageName || null,
    token: token || null,
    username: username || null,
    connected_at: now(),
    webhook_active: status === 'connected' ? 1 : 0,
  });
}

function run() {
  const db = new Database(BOTMATIC_DB);
  ensureTable(db);

  let importedBots = 0;
  let upsertedChannels = 0;

  let store = null;
  if (fs.existsSync(STORE_JSON)) {
    store = JSON.parse(fs.readFileSync(STORE_JSON, 'utf-8'));
  }

  const waToken = process.env.WHATSAPP_TOKEN || process.env.WA_TOKEN || process.env.WA_ACCESS_TOKEN || null;

  if (store?.bots?.length) {
    for (const b of store.bots) {
      const sourceId = b.id || b.name || `bot_${Date.now()}`;
      const botName = b.name || sourceId;
      const { clientId, botId, created } = upsertClientAndBot(db, 'channel_store_bot', sourceId, botName);
      if (created) importedBots += 1;

      const ch = store.channelsByBotId?.[sourceId] || {};

      if (ch.telegram?.token) {
        upsertChannel(db, {
          clientId, botId, type: 'telegram', status: 'connected',
          pageId: ch.telegram.id || null,
          pageName: ch.telegram.name || null,
          username: ch.telegram.username || null,
          token: ch.telegram.token || null,
        });
        upsertedChannels += 1;
      }

      if (ch.instagram?.id || ch.instagram?.token || ch.instagram?.pageToken) {
        upsertChannel(db, {
          clientId, botId, type: 'instagram', status: 'connected',
          pageId: ch.instagram.id || ch.instagram.pageId || null,
          pageName: ch.instagram.name || null,
          username: ch.instagram.username || null,
          token: ch.instagram.pageToken || ch.instagram.token || null,
        });
        upsertedChannels += 1;
      }

      if (ch.messenger?.pageId || ch.messenger?.pageToken) {
        upsertChannel(db, {
          clientId, botId, type: 'messenger', status: 'connected',
          pageId: ch.messenger.pageId || null,
          pageName: ch.messenger.pageName || null,
          username: null,
          token: ch.messenger.pageToken || null,
        });
        upsertedChannels += 1;
      }

      if (ch.whatsapp?.connected) {
        upsertChannel(db, {
          clientId, botId, type: 'whatsapp', status: 'connected',
          pageId: process.env.WA_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || null,
          pageName: 'WhatsApp Imported',
          username: null,
          token: waToken,
        });
        upsertedChannels += 1;
      }
    }
  }

  if (fs.existsSync(TENANTS_DB)) {
    const tdb = new Database(TENANTS_DB, { readonly: true });
    const tenants = tdb.prepare('SELECT phone_number_id, display_phone, bot_key, language, enabled FROM tenants').all();

    for (const t of tenants) {
      const sourceId = t.bot_key || `tenant_${t.phone_number_id}`;
      const botName = `WA Tenant ${sourceId}`;
      const { clientId, botId, created } = upsertClientAndBot(db, 'wa_tenant_bot', sourceId, botName);
      if (created) importedBots += 1;

      upsertChannel(db, {
        clientId,
        botId,
        type: 'whatsapp',
        status: Number(t.enabled) === 1 ? 'connected' : 'disconnected',
        pageId: t.phone_number_id || null,
        pageName: t.display_phone || null,
        username: null,
        token: waToken,
      });
      upsertedChannels += 1;
    }
  }

  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM clients) AS clients,
      (SELECT COUNT(*) FROM bots) AS bots,
      (SELECT COUNT(*) FROM channels) AS channels
  `).get();

  console.log(JSON.stringify({
    ok: true,
    importedBots,
    upsertedChannels,
    totals,
  }, null, 2));

  db.close();
}

run();
