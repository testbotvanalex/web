const express = require('express');
const axios = require('axios');
const router = express.Router();
const D = require('../db');

const BASE_URL = process.env.BASE_URL || 'https://admin.botmatic.be';

// ── OpenAI client for suggestion regeneration ─────────────────────────────────
let _adminOAI = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require('openai');
    _adminOAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (_) {}

const SUGGESTION_SYSTEM_PROMPT =
  'You are a customer support assistant helping a business operator reply to customer messages.\n' +
  'Write a short, natural reply in the same language as the customer.\n' +
  'Keep it concise and professional.\n' +
  'Output only the reply text.';

async function _buildSuggestion(chat) {
  if (!_adminOAI) return null;
  const history = D.messages.historyByThread.all(
    chat.client_id, chat.channel, chat.sender_id, 10
  );
  if (!history.length) return null;
  const histMsgs = [...history].reverse().map(m => ({
    role: m.direction === 'out' ? 'assistant' : 'user',
    content: m.text || '',
  }));
  const resp = await _adminOAI.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    messages: [{ role: 'system', content: SUGGESTION_SYSTEM_PROMPT }, ...histMsgs],
    max_tokens: 500,
    temperature: 0.7,
  });
  return resp.choices[0].message.content?.trim() || null;
}

async function setupTelegramWebhook(channelId, token) {
  const url = `${BASE_URL}/webhook/telegram/${channelId}`;
  await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
    url,
    allowed_updates: ['message'],
  });
  console.log(`[Admin] TG webhook set: ${url}`);
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function ok(res, data) { res.json({ ok: true, ...data }); }
function err(res, msg, status = 400) { res.status(status).json({ ok: false, error: msg }); }

function ensureChatForThread({ client_id, channel, sender_id, sender_name = '', last_message_at = new Date().toISOString() }) {
  if (!client_id || !channel || !sender_id) return null;
  let chat = D.chats.byThread.get(client_id, channel, sender_id);
  if (!chat) {
    const id = D.genId('chat_');
    D.chats.insert.run({
      id,
      client_id,
      channel,
      sender_id,
      sender_name: sender_name || sender_id,
      mode: 'bot',
      status: 'open',
      unread_count: 0,
      last_message_at,
    });
    chat = D.chats.byId.get(id);
  }
  return chat;
}

function enrichWorkspace(client) {
  if (!client) return client;

  const ownBot = D.db.prepare(`
    SELECT id, name
    FROM bots
    WHERE client_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(client.id);

  const linkedChannelBot = D.db.prepare(`
    SELECT b.id, b.name
    FROM channels c
    JOIN bots b ON b.id = c.bot_id
    WHERE c.client_id = ?
      AND c.bot_id IS NOT NULL
    ORDER BY COALESCE(c.connected_at, c.id) DESC
    LIMIT 1
  `).get(client.id);

  const exactBot = D.bots.byId.get(client.id);
  const resolvedBot = ownBot || linkedChannelBot || exactBot || null;

  return {
    ...client,
    workspace_bot_id: resolvedBot?.id || null,
    workspace_bot_name: resolvedBot?.name || null,
  };
}

function matchesBotScope(workspace, botId) {
  const target = String(botId || '').trim().toLowerCase();
  if (!target) return true;
  return [
    workspace.id,
    workspace.workspace_bot_id,
    workspace.workspace_bot_name,
  ].filter(Boolean).some((value) => String(value).trim().toLowerCase() === target);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get('/stats', (req, res) => {
  try {
    const overview  = D.stats.overview.get();
    const byStatus  = D.stats.byStatus.all();
    const activity  = D.activity.recent.all();
    ok(res, { overview, byStatus, activity });
  } catch (e) { err(res, e.message, 500); }
});

// ── Clients ───────────────────────────────────────────────────────────────────

router.get('/clients', (req, res) => {
  try {
    const rows = D.clients.all.all().map(enrichWorkspace);
    ok(res, { clients: rows });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/clients', (req, res) => {
  try {
    const {
      company, niche = '', contact_name = '', contact_phone = '',
      contact_email = '', contract_url = '', goal = 'leads',
      tone = 'friendly', language = 'ru', restrictions = '[]',
      status = 'new', sla_owner = '', sla_deadline = '',
      priority = 'normal', notes = '',
    } = req.body;

    if (!company) return err(res, 'company required');

    const id = D.genId('client_');
    D.clients.insert.run({
      id, company, niche, contact_name, contact_phone, contact_email,
      contract_url, goal, tone, language,
      restrictions: typeof restrictions === 'string' ? restrictions : JSON.stringify(restrictions),
      status, sla_owner, sla_deadline, priority, notes,
    });

    // Create a default bot for this client
    const botId = D.genId('bot_');
    D.bots.insert.run({ id: botId, client_id: id, name: `${company} Bot`, prompt: '', knowledge_base: '' });

    D.log(id, 'client_created', `Company: ${company}`);

    ok(res, { client: D.clients.byId.get(id), bot: D.bots.byId.get(botId) });
  } catch (e) { err(res, e.message, 500); }
});

router.get('/clients/:id', (req, res) => {
  try {
    const client = enrichWorkspace(D.clients.byId.get(req.params.id));
    if (!client) return err(res, 'not found', 404);

    const exactBot = D.bots.byId.get(client.id);
    const bots     = exactBot ? [exactBot] : D.bots.byClient.all(client.id);
    const channels = D.channels.byClient.all(client.id);
    const tasks    = D.tasks.byClient.all(client.id);
    const activity = D.activity.byClient.all(client.id);

    ok(res, { client, bots, channels, tasks, activity });
  } catch (e) { err(res, e.message, 500); }
});

router.put('/clients/:id', (req, res) => {
  try {
    const client = D.clients.byId.get(req.params.id);
    if (!client) return err(res, 'not found', 404);

    const data = { ...client, ...req.body, id: client.id };
    if (Array.isArray(data.restrictions)) data.restrictions = JSON.stringify(data.restrictions);

    D.clients.update.run(data);
    D.log(client.id, 'client_updated', `Fields: ${Object.keys(req.body).join(', ')}`);

    ok(res, { client: D.clients.byId.get(client.id) });
  } catch (e) { err(res, e.message, 500); }
});

router.patch('/clients/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const STATUSES = ['new', 'brief', 'connecting', 'setup', 'test', 'live', 'support'];
    if (!STATUSES.includes(status)) return err(res, 'invalid status');

    const client = D.clients.byId.get(req.params.id);
    if (!client) return err(res, 'not found', 404);

    D.clients.updateStatus.run(status, client.id);
    D.log(client.id, 'status_changed', `${client.status} → ${status}`);

    ok(res, { status });
  } catch (e) { err(res, e.message, 500); }
});

router.delete('/clients/:id', (req, res) => {
  try {
    const client = D.clients.byId.get(req.params.id);
    if (!client) return err(res, 'not found', 404);

    D.clients.delete.run(client.id);
    D.log(null, 'client_deleted', `Company: ${client.company}`);

    ok(res, { deleted: client.id });
  } catch (e) { err(res, e.message, 500); }
});

// ── Bots ──────────────────────────────────────────────────────────────────────

router.get('/clients/:id/bots', (req, res) => {
  try {
    const exactBot = D.bots.byId.get(req.params.id);
    const bots = exactBot ? [exactBot] : D.bots.byClient.all(req.params.id);
    ok(res, { bots });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/clients/:id/bots', (req, res) => {
  try {
    const { name = 'Новый бот', prompt = '', knowledge_base = '' } = req.body;
    const id = D.genId('bot_');
    D.bots.insert.run({ id, client_id: req.params.id, name, prompt, knowledge_base });
    D.log(req.params.id, 'bot_created', `Bot: ${name}`);
    ok(res, { bot: D.bots.byId.get(id) });
  } catch (e) { err(res, e.message, 500); }
});

router.put('/bots/:id', (req, res) => {
  try {
    const bot = D.bots.byId.get(req.params.id);
    if (!bot) return err(res, 'not found', 404);

    const { name = bot.name, prompt = bot.prompt, knowledge_base = bot.knowledge_base } = req.body;
    D.bots.update.run({ id: bot.id, name, prompt, knowledge_base });
    D.log(bot.client_id, 'bot_updated', `Bot: ${name}, version +1`);

    ok(res, { bot: D.bots.byId.get(bot.id) });
  } catch (e) { err(res, e.message, 500); }
});

router.delete('/bots/:id', (req, res) => {
  try {
    const bot = D.bots.byId.get(req.params.id);
    if (!bot) return err(res, 'not found', 404);
    D.bots.delete.run(bot.id);
    D.log(bot.client_id, 'bot_deleted', `Bot: ${bot.name}`);
    ok(res, { deleted: bot.id });
  } catch (e) { err(res, e.message, 500); }
});

// ── Bot Flow ───────────────────────────────────────────────────────────────────

router.get('/bots/:id/flow', (req, res) => {
  try {
    const bot = D.bots.byId.get(req.params.id);
    if (!bot) return err(res, 'not found', 404);
    const flow = bot.flow ? JSON.parse(bot.flow) : null;
    ok(res, { flow });
  } catch (e) { err(res, e.message, 500); }
});

router.put('/bots/:id/flow', (req, res) => {
  try {
    const bot = D.bots.byId.get(req.params.id);
    if (!bot) return err(res, 'not found', 404);
    const { flow } = req.body;
    if (!flow) return err(res, 'flow required');
    D.bots.updateFlow.run({ id: bot.id, flow: JSON.stringify(flow) });
    D.log(bot.client_id, 'flow_updated', `Bot: ${bot.name}, nodes: ${flow.nodes?.length || 0}`);
    ok(res, { saved: true });
  } catch (e) { err(res, e.message, 500); }
});

// ── Channels ──────────────────────────────────────────────────────────────────

router.get('/clients/:id/channels', (req, res) => {
  try {
    const channels = D.channels.byClient.all(req.params.id);
    ok(res, { channels });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/clients/:id/channels', async (req, res) => {
  try {
    const { bot_id, type, page_id, page_name, token, token_expiry, username, webhook_active = 0 } = req.body;
    if (!type) return err(res, 'type required');

    // Проверяем, нет ли уже такого канала (upsert по client+type)
    const existing = D.db.prepare(
      `SELECT id FROM channels WHERE client_id = ? AND type = ?`
    ).get(req.params.id, type);
    const id = existing?.id || D.genId('ch_');

    D.channels.upsert.run({
      id, client_id: req.params.id, bot_id: bot_id || null,
      type, status: 'connected', page_id, page_name, token,
      token_expiry: token_expiry || null, username,
      connected_at: new Date().toISOString(),
      connected_by: 'admin', webhook_active: 1,
    });
    D.log(req.params.id, 'channel_connected', `${type}: ${page_name || username}`);

    // Авто-webhook для Telegram
    if (type === 'telegram' && token) {
      setupTelegramWebhook(id, token).catch(e =>
        console.error('[Admin] TG webhook setup failed:', e.response?.data || e.message)
      );
    }

    ok(res, { channel: D.channels.byId.get(id) });
  } catch (e) { err(res, e.message, 500); }
});

router.patch('/channels/:id/disconnect', (req, res) => {
  try {
    const ch = D.channels.byId.get(req.params.id);
    if (!ch) return err(res, 'not found', 404);
    D.channels.disconnect.run(ch.id);
    D.log(ch.client_id, 'channel_disconnected', `${ch.type}`);
    ok(res, { disconnected: ch.id });
  } catch (e) { err(res, e.message, 500); }
});

router.delete('/channels/:id', (req, res) => {
  try {
    const ch = D.channels.byId.get(req.params.id);
    if (!ch) return err(res, 'not found', 404);
    D.channels.delete.run(ch.id);
    D.log(ch.client_id, 'channel_deleted', `${ch.type}`);
    ok(res, { deleted: ch.id });
  } catch (e) { err(res, e.message, 500); }
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

router.get('/clients/:id/tasks', (req, res) => {
  try {
    ok(res, { tasks: D.tasks.byClient.all(req.params.id) });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/clients/:id/tasks', (req, res) => {
  try {
    const { title, description = '', status = 'todo', due_date = null } = req.body;
    if (!title) return err(res, 'title required');
    const id = D.genId('task_');
    D.tasks.insert.run({ id, client_id: req.params.id, title, description, status, due_date });
    D.log(req.params.id, 'task_created', title);
    ok(res, { task: { id, client_id: req.params.id, title, description, status, due_date } });
  } catch (e) { err(res, e.message, 500); }
});

router.put('/tasks/:id', (req, res) => {
  try {
    const { title, description, status, due_date } = req.body;
    D.tasks.update.run({ id: req.params.id, title, description, status, due_date });
    ok(res, { ok: true });
  } catch (e) { err(res, e.message, 500); }
});

router.delete('/tasks/:id', (req, res) => {
  try {
    D.tasks.delete.run(req.params.id);
    ok(res, { deleted: req.params.id });
  } catch (e) { err(res, e.message, 500); }
});

// ── Messages ──────────────────────────────────────────────────────────────────

router.get('/clients/:id/messages', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const messages = D.messages.byClient.all(req.params.id, limit);
    ok(res, { messages });
  } catch (e) { err(res, e.message, 500); }
});

// ── Chats (Inbox MVP) ─────────────────────────────────────────────────────────
router.get('/chats', (req, res) => {
  try {
    D.chats.ensureFromMessages.run();
    const botId = String(req.query.botId || '').trim();
    const mode = String(req.query.mode || 'all');
    const status = String(req.query.status || 'all');
    const search = String(req.query.search || '').trim().toLowerCase();

    let rows = D.chats.list.all();
    if (botId) {
      const allowedClientIds = new Set(
        D.clients.all.all()
          .map(enrichWorkspace)
          .filter((workspace) => matchesBotScope(workspace, botId))
          .map((workspace) => workspace.id)
      );
      rows = rows.filter((r) => allowedClientIds.has(r.client_id));
    }
    if (mode !== 'all') rows = rows.filter((r) => r.mode === mode);
    if (status !== 'all') rows = rows.filter((r) => r.status === status);
    if (search) {
      rows = rows.filter((r) => {
        const nm = String(r.sender_name || '').toLowerCase();
        const sid = String(r.sender_id || '').toLowerCase();
        const comp = String(r.company || '').toLowerCase();
        return nm.includes(search) || sid.includes(search) || comp.includes(search);
      });
    }

    ok(res, { chats: rows });
  } catch (e) { err(res, e.message, 500); }
});

router.get('/chats/:id/messages', (req, res) => {
  try {
    const chat = D.chats.byId.get(req.params.id);
    if (!chat) return err(res, 'chat not found', 404);

    const limit = parseInt(req.query.limit, 10) || 200;
    const messages = D.messages.byThread.all(chat.client_id, chat.channel, chat.sender_id, limit);
    D.chats.markRead.run(chat.id);

    ok(res, { chat, messages });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/chats/:id/takeover', (req, res) => {
  try {
    const chat = D.chats.byId.get(req.params.id);
    if (!chat) return err(res, 'chat not found', 404);
    D.chats.setMode.run('human', chat.id);
    ok(res, { chat: D.chats.byId.get(chat.id) });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/chats/:id/release', (req, res) => {
  try {
    const chat = D.chats.byId.get(req.params.id);
    if (!chat) return err(res, 'chat not found', 404);
    D.chats.setMode.run('bot', chat.id);
    ok(res, { chat: D.chats.byId.get(chat.id) });
  } catch (e) { err(res, e.message, 500); }
});

router.delete('/chats/:id', (req, res) => {
  try {
    const chat = D.chats.byId.get(req.params.id);
    if (!chat) return err(res, 'chat not found', 404);
    D.db.prepare('DELETE FROM messages WHERE client_id = ? AND channel = ? AND sender_id = ?')
      .run(chat.client_id, chat.channel, chat.sender_id);
    D.db.prepare('DELETE FROM ai_suggestions WHERE chat_id = ?').run(chat.id);
    D.db.prepare('DELETE FROM chats WHERE id = ?').run(chat.id);
    ok(res, { deleted: true });
  } catch (e) { err(res, e.message, 500); }
});

// ── Send message manually from Inbox ─────────────────────────────────────────
router.post('/send-message', async (req, res) => {
  const { chat_id, client_id, channel, sender_id, text } = req.body;
  if (!text?.trim())
    return err(res, 'Missing fields');

  try {
    let resolvedClientId = client_id;
    let resolvedChannel = channel;
    let resolvedSenderId = sender_id;

    if (chat_id) {
      const chat = D.chats.byId.get(chat_id);
      if (!chat) return err(res, 'chat not found', 404);
      resolvedClientId = chat.client_id;
      resolvedChannel = chat.channel;
      resolvedSenderId = chat.sender_id;
    }

    if (!resolvedClientId || !resolvedChannel || !resolvedSenderId) {
      return err(res, 'Missing fields');
    }

    let ch = D.db.prepare(
      `SELECT * FROM channels WHERE client_id = ? AND type = ? AND status = 'connected' LIMIT 1`
    ).get(resolvedClientId, resolvedChannel);

    // WhatsApp fallback: allow manual send even before channel row is synced in DB.
    if (!ch && resolvedChannel === 'whatsapp') {
      const envToken =
        process.env.WHATSAPP_TOKEN ||
        process.env.WA_TOKEN ||
        process.env.WA_ACCESS_TOKEN ||
        '';
      const envPhoneNumberId =
        process.env.WA_PHONE_NUMBER_ID ||
        process.env.WHATSAPP_PHONE_NUMBER_ID ||
        process.env.PHONE_NUMBER_ID ||
        '';

      if (envToken && envPhoneNumberId) {
        ch = {
          type: 'whatsapp',
          token: envToken,
          page_id: String(envPhoneNumberId),
          status: 'connected',
        };
      }
    }

    if (!ch) return err(res, 'Channel not connected', 404);

    if (resolvedChannel === 'telegram') {
      await axios.post(`https://api.telegram.org/bot${ch.token}/sendMessage`, {
        chat_id: resolvedSenderId, text: text.trim(),
      });
    } else if (['instagram', 'messenger'].includes(resolvedChannel)) {
      await axios.post(
        `https://graph.facebook.com/v21.0/me/messages`,
        { recipient: { id: resolvedSenderId }, message: { text: text.trim() } },
        { params: { access_token: ch.token } }
      );
    } else if (resolvedChannel === 'whatsapp') {
      if (!ch.page_id) return err(res, 'WhatsApp phone_number_id is missing for this channel');
      if (!ch.token) return err(res, 'WhatsApp access token is missing for this channel');

      await axios.post(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(ch.page_id)}/messages`,
        {
          messaging_product: 'whatsapp',
          to: String(resolvedSenderId),
          text: { body: text.trim() },
        },
        { headers: { Authorization: `Bearer ${ch.token}` } }
      );
    } else {
      return err(res, `Channel "${resolvedChannel}" not supported for manual send`);
    }

    const now = new Date().toISOString();
    const chat =
      D.chats.byThread.get(resolvedClientId, resolvedChannel, resolvedSenderId) ||
      ensureChatForThread({
        client_id: resolvedClientId,
        channel: resolvedChannel,
        sender_id: resolvedSenderId,
        sender_name: resolvedSenderId,
        last_message_at: now,
      });

    // Save to DB
    D.messages.insert.run({
      id: D.genId('msg_'), client_id: resolvedClientId, channel: resolvedChannel,
      sender_id: resolvedSenderId, sender_name: resolvedSenderId,
      text: text.trim(), direction: 'out', raw: null,
    });
    if (chat) {
      D.chats.touchOutgoing.run({
        id: chat.id,
        sender_name: resolvedSenderId,
        last_message_at: now,
      });
      D.chats.setMode.run('human', chat.id);
    }

    ok(res, { sent: true, chat_id: chat?.id || null });
  } catch (e) {
    console.error('[send-message]', e.response?.data || e.message);
    err(res, e.response?.data?.error?.message || e.message, 500);
  }
});

// ── AI Suggestions ────────────────────────────────────────────────────────────

// GET  /api/admin/chats/:chatId/suggestion
// Returns the latest pending suggestion (or null)
router.get('/chats/:chatId/suggestion', (req, res) => {
  try {
    const chat = D.chats.byId.get(req.params.chatId);
    if (!chat) return err(res, 'chat not found', 404);
    const suggestion = D.suggestions.getLatest.get(chat.id);
    ok(res, { suggestion: suggestion || null });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/admin/chats/:chatId/suggestion/regenerate
// Discards current pending suggestion, generates and stores a new one
router.post('/chats/:chatId/suggestion/regenerate', async (req, res) => {
  try {
    const chat = D.chats.byId.get(req.params.chatId);
    if (!chat) return err(res, 'chat not found', 404);

    // Discard any existing pending suggestion
    const existing = D.suggestions.getLatest.get(chat.id);
    if (existing) D.suggestions.updateStatus.run('discarded', Date.now(), existing.id);

    if (!_adminOAI) return ok(res, { suggestion: null, reason: 'OPENAI_API_KEY not set' });

    const text = await _buildSuggestion(chat);
    if (!text) return ok(res, { suggestion: null, reason: 'No history to suggest from' });

    const newSug = {
      id:              D.genId('sug_'),
      chat_id:         chat.id,
      message_id:      null,
      suggestion_text: text,
      status:          'pending',
      created_at:      Date.now(),
      updated_at:      Date.now(),
    };
    D.suggestions.insert.run(newSug);

    ok(res, { suggestion: newSug });
  } catch (e) {
    console.error('[suggestion/regenerate]', e.message);
    err(res, e.message, 500);
  }
});

// POST /api/admin/chats/:chatId/suggestion/discard
// Marks current pending suggestion as discarded
router.post('/chats/:chatId/suggestion/discard', (req, res) => {
  try {
    const chat = D.chats.byId.get(req.params.chatId);
    if (!chat) return err(res, 'chat not found', 404);
    const sug = D.suggestions.getLatest.get(chat.id);
    if (sug) D.suggestions.updateStatus.run('discarded', Date.now(), sug.id);
    ok(res, { discarded: true });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
