require('./load-env');

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const app = express();
const cors = require('cors');

// [NEW] Imports from WhatsApp Hub (Dynamic)
let routeMessage = null;
let loadBot = null;
let loadBots = null;
let whatsappRouterReady = false;

async function initRouter() {
  process.env.BOT_DIR = process.env.BOT_DIR || path.join(__dirname, 'bots');
  const routerPath = path.join(__dirname, 'whatsapp-hub', 'src', 'core', 'router.js');

  if (!fs.existsSync(routerPath)) {
    console.warn(`[Startup] WhatsApp router not found at ${routerPath}. Continuing without WhatsApp routing.`);
    return;
  }

  try {
    const router = await import(pathToFileURL(routerPath).href);
    routeMessage = typeof router.routeMessage === 'function' ? router.routeMessage : null;
    loadBot = typeof router.loadBot === 'function' ? router.loadBot : null;
    loadBots = typeof router.loadBots === 'function' ? router.loadBots : null;

    if (loadBots) {
      await loadBots();
    }

    whatsappRouterReady = Boolean(routeMessage);
    if (whatsappRouterReady) {
      console.log('✅ WhatsApp router loaded');
    } else {
      console.warn('[Startup] WhatsApp router loaded without routeMessage().');
    }
  } catch (error) {
    console.error('[Startup] Failed to initialize WhatsApp router:', error.message);
  }
}
initRouter().catch((error) => {
  console.error('[Startup] Unhandled WhatsApp router init error:', error.message);
});

// [FIX] Enable CORS for local testing (file:// origin)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Raw body needed for webhook signature verification
app.use('/webhook/instagram', express.raw({ type: '*/*' }));
app.use(express.json());

const CONFIG = {
  // ── Meta App (единый для Instagram и Messenger) ──
  META_APP_ID: process.env.META_APP_ID || process.env.INSTAGRAM_APP_ID || '',
  META_APP_SECRET: process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET || '',
  // ── Instagram (через Facebook Login → Graph API) ──
  IG_REDIRECT_URI:
    process.env.META_REDIRECT_URI || process.env.REDIRECT_URI || 'https://ocenka02.ru/auth/instagram/callback',
  IG_SCOPES: (
    process.env.IG_SCOPES ||
    'instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata,pages_read_engagement'
  ),
  IG_SUBSCRIBED_FIELDS: (
    process.env.IG_SUBSCRIBED_FIELDS ||
    'messages,messaging_postbacks,message_reads,message_reactions'
  ),
  // ── Messenger ──
  MESSENGER_APP_ID: process.env.MESSENGER_APP_ID || process.env.META_APP_ID || '',
  MESSENGER_APP_SECRET: process.env.MESSENGER_APP_SECRET || process.env.META_APP_SECRET || '',
  MESSENGER_REDIRECT_URI:
    process.env.MESSENGER_REDIRECT_URI || 'https://ocenka02.ru/auth/messenger/callback',
  MESSENGER_SCOPES:
    process.env.MESSENGER_SCOPES || 'pages_show_list,pages_messaging,pages_manage_metadata',
  // ── General ──
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || 'botmatic_secret_2024',
  PORT: Number(process.env.PORT || 3200),
  STORE_FILE: process.env.CHANNEL_STORE_FILE || path.join(__dirname, 'data', 'channel-store.json'),
  API_VERSION: 'v25.0',
};

const missingConfig = ['META_APP_ID', 'META_APP_SECRET', 'IG_REDIRECT_URI', 'WEBHOOK_VERIFY_TOKEN']
  .filter((key) => !CONFIG[key]);

if (missingConfig.length > 0) {
  console.error('Missing required config keys:', missingConfig.join(', '));
  process.exit(1);
}

const DEFAULT_BOT_ID = process.env.DEFAULT_BOT_ID || 'main';
const DEFAULT_BOT_NAME = process.env.DEFAULT_BOT_NAME || 'Основной бот';
const messengerOauthStates = new Map();
const pendingMessengerSelections = new Map();
const instagramOauthStates = new Map();
const store = loadStore();

app.get('/auth', (req, res) => {
  res.redirect(`/auth/connect?botId=${encodeURIComponent(getDefaultBot().id)}`);
});

app.get('/auth/channels', (req, res) => {
  res.sendFile(path.join(__dirname, 'channels.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/constructor', (req, res) => {
  res.sendFile(path.join(__dirname, 'constructor.html'));
});

app.get('/train', (req, res) => {
  res.sendFile(path.join(__dirname, 'train.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'analytics.html'));
});

app.get('/auth/connect', (req, res) => {
  res.sendFile(path.join(__dirname, 'channels.html'));
});

app.get('/auth/api/bots', (req, res) => {
  const selectedBot = getBotOrDefault(req.query.botId);
  res.json({
    activeBotId: selectedBot.id,
    bots: store.bots.map((bot) => ({
      id: bot.id,
      name: bot.name,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt,
    })),
  });
});

app.post('/auth/api/bots', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const bot = createBot(name || `Bot ${store.bots.length + 1}`);

  res.status(201).json({
    id: bot.id,
    name: bot.name,
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
  });
});

app.get('/auth/api/channels', async (req, res) => {
  const bot = getBotOrDefault(req.query.botId);
  const channels = getChannelsByBotId(bot.id);

  // Proactively sync WhatsApp status if marked as disconnected
  if (!channels.whatsapp.connected) {
    try {
      const waRes = await axios.get(`http://localhost:3300/api/whatsapp/connect?botId=${bot.id}`);
      if (waRes.data.status === 'connected') {
        channels.whatsapp.connected = true;
        channels.whatsapp.connectedAt = new Date().toISOString();
        setChannelsByBotId(bot.id, channels);
      }
    } catch (err) {
      console.error('Proactive WhatsApp sync failed:', err.message);
    }
  }

  const instagramConnected = Boolean(channels.instagram.token && channels.instagram.id);
  const messengerConnected = Boolean(channels.messenger.pageToken && channels.messenger.pageId);
  const telegramConnected = Boolean(channels.telegram.token && channels.telegram.id);
  const botParam = `botId=${encodeURIComponent(bot.id)}`;

  res.json({
    bot: {
      id: bot.id,
      name: bot.name,
    },
    instagram: {
      connected: instagramConnected,
      id: channels.instagram.id || '',
      username: channels.instagram.username || '',
      name: channels.instagram.name || '',
      connectedAt: channels.instagram.connectedAt || '',
      connectUrl: `/auth/instagram/login?${botParam}`,
      disconnectUrl: `/auth/api/channels/instagram?${botParam}`,
      webhookUrl: '/webhook/instagram',
      statusLabel: instagramConnected ? 'Подключен' : 'Не подключен',
    },
    messenger: {
      connected: messengerConnected,
      pageId: channels.messenger.pageId || '',
      pageName: channels.messenger.pageName || '',
      pagePicture: channels.messenger.pagePicture || '',
      connectedAt: channels.messenger.connectedAt || '',
      connectUrl: `/auth/messenger/login?${botParam}`,
      disconnectUrl: `/auth/api/channels/messenger?${botParam}`,
      webhookUrl: '/auth/messenger/webhook',
      statusLabel: messengerConnected ? 'Подключен' : 'Не подключен',
    },
    telegram: {
      connected: telegramConnected,
      id: channels.telegram.id || '',
      username: channels.telegram.username || '',
      name: channels.telegram.name || '',
      connectedAt: channels.telegram.connectedAt || '',
      connectUrl: '#',
      disconnectUrl: `/auth/api/channels/telegram?${botParam}`,
      statusLabel: telegramConnected ? 'Подключен' : 'Не подключен',
    },
    whatsapp: {
      connected: channels.whatsapp.connected || false,
      connectedAt: channels.whatsapp.connectedAt || '',
      connectUrl: '#',
      disconnectUrl: `/auth/api/channels/whatsapp?${botParam}`,
      statusLabel: channels.whatsapp.connected ? 'Подключен' : 'Не подключен',
    },
  });
});

app.delete('/auth/api/channels/:channel', (req, res) => {
  const { channel } = req.params;
  const bot = getBotOrDefault(req.query.botId);
  const channels = getChannelsByBotId(bot.id);

  if (channel === 'instagram') {
    channels.instagram = createEmptyInstagramChannel();
    setChannelsByBotId(bot.id, channels);
    return res.json({ ok: true, botId: bot.id });
  }

  if (channel === 'messenger') {
    channels.messenger = createEmptyMessengerChannel();
    setChannelsByBotId(bot.id, channels);
    return res.json({ ok: true, botId: bot.id });
  }

  if (channel === 'telegram') {
    channels.telegram = createEmptyTelegramChannel();
    setChannelsByBotId(bot.id, channels);
    return res.json({ ok: true, botId: bot.id });
  }

  if (channel === 'whatsapp') {
    channels.whatsapp.connected = false;
    channels.whatsapp.connectedAt = '';
    setChannelsByBotId(bot.id, channels);

    // Ping backend to wipe session folder and clear memory
    axios.delete(`http://localhost:3300/api/whatsapp/disconnect?botId=${encodeURIComponent(bot.id)}`)
      .catch((err) => {
        console.error('Failed to notify WhatsApp hub of disconnect:', err.message);
      });

    return res.json({ ok: true, botId: bot.id });
  }

  res.status(404).json({ error: 'Unknown channel.' });
});

function createEmptyInstagramChannel() {
  return {
    id: '',          // Instagram Business Account ID (ig_id)
    entryId: '',     // alias/fallback for matching
    pageId: '',      // Facebook Page ID
    pageToken: '',   // Facebook Page access token (used for API calls)
    token: '',       // kept for backward compat (same as pageToken)
    username: '',
    name: '',
    connectedAt: '',
  };
}

function createEmptyMessengerChannel() {
  return {
    pageId: '',
    pageName: '',
    pageToken: '',
    pagePicture: '',
    connectedAt: '',
  };
}

function createEmptyTelegramChannel() {
  return {
    id: '',          // bot ID from Telegram
    token: '',       // bot token from BotFather
    username: '',    // bot username
    name: '',        // bot first_name
    connectedAt: '',
  };
}

function createEmptyWhatsappChannel() {
  return {
    connected: false,
    connectedAt: '',
  };
}

function createBotChannels() {
  return {
    instagram: createEmptyInstagramChannel(),
    messenger: createEmptyMessengerChannel(),
    telegram: createEmptyTelegramChannel(),
    whatsapp: createEmptyWhatsappChannel(),
  };
}

function loadStore() {
  const data = {
    bots: [],
    channelsByBotId: {},
  };

  try {
    if (fs.existsSync(CONFIG.STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG.STORE_FILE, 'utf-8'));

      if (Array.isArray(parsed.bots)) {
        data.bots = parsed.bots
          .filter((bot) => bot && bot.id && bot.name)
          .map((bot) => ({
            id: String(bot.id),
            name: String(bot.name),
            createdAt: bot.createdAt || new Date().toISOString(),
            updatedAt: bot.updatedAt || new Date().toISOString(),
          }));
      }

      if (parsed.channelsByBotId && typeof parsed.channelsByBotId === 'object') {
        for (const [botId, channels] of Object.entries(parsed.channelsByBotId)) {
          data.channelsByBotId[botId] = {
            instagram: {
              ...createEmptyInstagramChannel(),
              ...(channels?.instagram || {}),
            },
            messenger: {
              ...createEmptyMessengerChannel(),
              ...(channels?.messenger || {}),
            },
            telegram: {
              ...createEmptyTelegramChannel(),
              ...(channels?.telegram || {}),
            },
            whatsapp: {
              ...createEmptyWhatsappChannel(),
              ...(channels?.whatsapp || {}),
            },
          };
        }
      }
    }
  } catch (error) {
    console.error('Failed to load channel store:', error.message);
  }

  if (data.bots.length === 0) {
    data.bots.push({
      id: DEFAULT_BOT_ID,
      name: DEFAULT_BOT_NAME,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  for (const bot of data.bots) {
    if (!data.channelsByBotId[bot.id]) {
      data.channelsByBotId[bot.id] = createBotChannels();
    }
  }

  const defaultChannels = data.channelsByBotId[data.bots[0].id];

  if (!defaultChannels.instagram.token && CONFIG.DEFAULT_ACCESS_TOKEN) {
    defaultChannels.instagram = {
      id: process.env.INSTAGRAM_USER_ID || '',
      entryId: process.env.INSTAGRAM_ENTRY_ID || '',
      token: CONFIG.DEFAULT_ACCESS_TOKEN,
      username: process.env.INSTAGRAM_USERNAME || '',
      name: process.env.INSTAGRAM_NAME || '',
      connectedAt: process.env.INSTAGRAM_CONNECTED_AT || '',
    };
  }

  if (
    !defaultChannels.messenger.pageToken &&
    process.env.MESSENGER_PAGE_TOKEN &&
    process.env.MESSENGER_PAGE_ID
  ) {
    defaultChannels.messenger = {
      pageId: process.env.MESSENGER_PAGE_ID || '',
      pageName: process.env.MESSENGER_PAGE_NAME || '',
      pageToken: process.env.MESSENGER_PAGE_TOKEN || '',
      pagePicture: process.env.MESSENGER_PAGE_PICTURE || '',
      connectedAt: process.env.MESSENGER_CONNECTED_AT || new Date().toISOString(),
    };
  }

  saveStore(data);
  return data;
}

function saveStore(nextStore = store) {
  try {
    fs.mkdirSync(path.dirname(CONFIG.STORE_FILE), { recursive: true });
    const tempPath = `${CONFIG.STORE_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(nextStore, null, 2));
    fs.renameSync(tempPath, CONFIG.STORE_FILE);
  } catch (error) {
    console.error('Failed to save channel store:', error.message);
  }
}

function getDefaultBot() {
  return store.bots[0];
}

function getBotById(botId) {
  if (!botId) return null;
  return store.bots.find((bot) => bot.id === String(botId)) || null;
}

function getBotOrDefault(botId) {
  return getBotById(botId) || getDefaultBot();
}

function getChannelsByBotId(botId) {
  const key = String(botId);
  if (!store.channelsByBotId[key]) {
    store.channelsByBotId[key] = createBotChannels();
    saveStore();
  }
  if (!store.channelsByBotId[key].telegram) {
    store.channelsByBotId[key].telegram = createEmptyTelegramChannel();
    saveStore();
  }
  if (!store.channelsByBotId[key].whatsapp) {
    store.channelsByBotId[key].whatsapp = createEmptyWhatsappChannel();
    saveStore();
  }
  return store.channelsByBotId[key];
}

function setChannelsByBotId(botId, channels) {
  const key = String(botId);
  store.channelsByBotId[key] = {
    instagram: {
      ...createEmptyInstagramChannel(),
      ...(channels.instagram || {}),
    },
    messenger: {
      ...createEmptyMessengerChannel(),
      ...(channels.messenger || {}),
    },
    telegram: {
      ...createEmptyTelegramChannel(),
      ...(channels.telegram || {}),
    },
    whatsapp: {
      ...createEmptyWhatsappChannel(),
      ...(channels.whatsapp || {}),
    },
  };

  const bot = getBotById(key);
  if (bot) {
    bot.updatedAt = new Date().toISOString();
  }

  saveStore();
}

function createBot(name) {
  const now = new Date().toISOString();
  const bot = {
    id: `bot_${crypto.randomBytes(8).toString('hex')}`,
    name: String(name || '').trim() || `Bot ${store.bots.length + 1}`,
    createdAt: now,
    updatedAt: now,
  };

  store.bots.push(bot);
  store.channelsByBotId[bot.id] = createBotChannels();
  saveStore();
  return bot;
}

function renderPrivacyPolicy(req, res) {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BotMaric Privacy Policy</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        max-width: 760px;
        margin: 40px auto;
        padding: 0 20px;
        line-height: 1.6;
        color: #1f2937;
      }
      h1, h2 {
        line-height: 1.25;
      }
      a {
        color: #2563eb;
      }
    </style>
  </head>
  <body>
    <h1>BotMaric Privacy Policy</h1>
    <p>Дата вступления в силу: 4 марта 2026</p>

    <p>
      BotMaric предоставляет автоматизацию сообщений для Instagram и Messenger
      бизнес-аккаунтов. Эта политика объясняет, какие данные мы обрабатываем,
      когда пользователь подключает аккаунт к приложению.
    </p>

    <h2>Какие данные мы обрабатываем</h2>
    <p>
      Мы можем обрабатывать идентификаторы аккаунтов, данные профиля, токены
      доступа, метаданные сообщений и содержимое сообщений, необходимые для
      отправки, получения и автоматизации ответов через API платформы Meta.
    </p>

    <h2>Как мы используем данные</h2>
    <p>
      Мы используем эти данные только для авторизации подключённых аккаунтов,
      приёма webhook-событий, отправки ответов, поддержки работы сервиса и
      устранения технических проблем.
    </p>

    <h2>Передача данных</h2>
    <p>
      Мы не продаём персональные данные. Информация передаётся только
      подрядчикам и платформенным партнёрам, когда это необходимо для работы
      сервиса или выполнения юридических обязательств.
    </p>

    <h2>Срок хранения</h2>
    <p>
      Мы храним данные только столько, сколько это нужно для предоставления
      сервиса, соблюдения требований безопасности и выполнения юридических
      обязательств.
    </p>

    <h2>Контакты</h2>
    <p>
      По вопросам конфиденциальности или удаления данных напишите на
      <a href="mailto:info@botmatic.be">info@botmatic.be</a>.
    </p>
  </body>
</html>`);
}

app.get('/privacy-policy', renderPrivacyPolicy);
app.get('/webhook/instagram/privacy-policy', renderPrivacyPolicy);

// --- Bot Flow Constructor API ---

const BOTS_DIR = process.env.BOT_DIR || path.join(__dirname, 'bots');
if (!fs.existsSync(BOTS_DIR)) {
  fs.mkdirSync(BOTS_DIR, { recursive: true });
}

app.post('/auth/api/constructor/publish', (req, res) => {
  const { botId, flow } = req.body;
  if (!botId || !flow) {
    return res.status(400).json({ error: 'Missing botId or flow data.' });
  }

  const bot = getBotById(botId);
  if (!bot) {
    return res.status(404).json({ error: 'Bot not found.' });
  }

  const botFolderPath = path.join(BOTS_DIR, botId);
  if (!fs.existsSync(botFolderPath)) {
    fs.mkdirSync(botFolderPath, { recursive: true });
  }

  // Save the flow as config.json for the router to pick up
  const flowPath = path.join(botFolderPath, 'flow.json');
  fs.writeFileSync(flowPath, JSON.stringify(flow, null, 2));

  // Also create a basic bot.json if it doesn't exist to help with auto-discovery
  const configPath = path.join(botFolderPath, 'bot.json');
  if (!fs.existsSync(configPath)) {
    const channels = getChannelsByBotId(botId);
    const botConfig = {
      name: bot.name,
      phoneNumberId: channels.whatsapp.id || '', // We might need to store this better
      language: 'ru'
    };
    fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2));
  }

  console.log(`🚀 Published flow for bot ${botId} to ${flowPath}`);

  // [NEW] Notify WhatsApp hub to reload this bot
  axios.get(`http://localhost:3300/api/whatsapp/reload?botId=${encodeURIComponent(botId)}`)
    .then(() => console.log(`♻️ Triggered reload for bot ${botId}`))
    .catch((err) => console.error(`⚠️ Failed to trigger reload for bot ${botId}:`, err.message));

  res.json({ ok: true, path: flowPath });
});

// AI Training API
app.get('/auth/api/ai/train', (req, res) => {
  const { botId } = req.query;
  if (!botId) return res.status(400).json({ error: "botId required" });

  const knowledgePath = path.join(BOTS_DIR, botId, 'knowledge.txt');
  if (!fs.existsSync(knowledgePath)) {
    return res.json({ ok: true, text: "" });
  }

  const text = fs.readFileSync(knowledgePath, 'utf-8');
  res.json({ ok: true, text });
});

app.post('/auth/api/ai/train', (req, res) => {
  const { botId, text } = req.body;
  if (!botId) return res.status(400).json({ error: "botId required" });

  const botDir = path.join(BOTS_DIR, botId);
  if (!fs.existsSync(botDir)) fs.mkdirSync(botDir, { recursive: true });

  const knowledgePath = path.join(botDir, 'knowledge.txt');
  fs.writeFileSync(knowledgePath, text, 'utf-8');

  res.json({ ok: true, path: knowledgePath });
});

// Analytics API
app.get('/auth/api/analytics', (req, res) => {
  try {
    const analyticsPath = path.join(__dirname, 'data', 'analytics.json');
    if (!fs.existsSync(analyticsPath)) {
      return res.json({ totalMessages: 0, series: [], bots: {} });
    }

    const logs = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));

    // Aggregation logic
    const stats = {
      totalMessages: logs.length,
      byDay: {},
      byBot: {}
    };

    logs.forEach(log => {
      const day = log.timestamp.split('T')[0];
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;

      const botId = log.botId || 'unknown';
      if (!stats.byBot[botId]) stats.byBot[botId] = { total: 0, incoming: 0, outgoing: 0 };
      stats.byBot[botId].total++;
      if (log.direction === 'in') stats.byBot[botId].incoming++;
      if (log.direction === 'out') stats.byBot[botId].outgoing++;
    });

    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/auth/instagram/login', (req, res) => {
  const bot = getBotOrDefault(req.query.botId);
  cleanupExpiredEntries(instagramOauthStates, 10 * 60 * 1000);

  const state = crypto.randomBytes(24).toString('hex');
  instagramOauthStates.set(state, {
    createdAt: Date.now(),
    botId: bot.id,
  });

  // Facebook Login OAuth → Graph API (правильный подход для SaaS)
  const url =
    `https://www.facebook.com/${CONFIG.API_VERSION}/dialog/oauth?` +
    `client_id=${CONFIG.META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(CONFIG.IG_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(CONFIG.IG_SCOPES)}` +
    `&response_type=code` +
    `&state=${state}`;

  res.redirect(url);
});

app.get('/auth/instagram/callback', async (req, res) => {
  let { code, error, state } = req.query;

  let botId = req.query.botId || '';
  if (state && instagramOauthStates.has(state)) {
    botId = instagramOauthStates.get(state).botId;
    instagramOauthStates.delete(state);
  }
  const bot = getBotOrDefault(botId);
  const actionHref = `/auth/connect?botId=${encodeURIComponent(bot.id)}`;

  if (error) {
    return renderErrorPage(res, {
      title: 'Не удалось подключить Instagram',
      description: error,
      actionHref,
      actionLabel: 'Назад к каналам',
    });
  }

  if (!code) {
    return renderErrorPage(res, {
      title: 'Не удалось подключить Instagram',
      description: 'Instagram не передал код авторизации.',
      actionHref,
      actionLabel: 'Назад к каналам',
    });
  }

  code = code.replace(/#_$/, '');

  try {
    // ── 1. Обмен code → short-lived user token (Graph API) ──
    const tokenRes = await axios.get(`https://graph.facebook.com/${CONFIG.API_VERSION}/oauth/access_token`, {
      params: {
        client_id: CONFIG.META_APP_ID,
        client_secret: CONFIG.META_APP_SECRET,
        redirect_uri: CONFIG.IG_REDIRECT_URI,
        code,
      },
    });

    const shortToken = tokenRes.data.access_token;
    console.log('[Instagram Connect] Short Token received');

    // ── 1.5. Проверяем кто это (Debug) ──
    const meRes = await axios.get(`https://graph.facebook.com/${CONFIG.API_VERSION}/me?fields=id,name`, {
      params: { access_token: shortToken },
    });
    console.log('[Instagram Connect] Authenticated as:', meRes.data.name, `(${meRes.data.id})`);

    // ── 2. Конвертация в long-lived token (60 дней) ──
    const longTokenRes = await axios.get(`https://graph.facebook.com/${CONFIG.API_VERSION}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: CONFIG.META_APP_ID,
        client_secret: CONFIG.META_APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });

    const longToken = longTokenRes.data.access_token;

    // ── 2.5. Проверяем разрешения (Debug) ──
    const debugPerms = await axios.get(`https://graph.facebook.com/${CONFIG.API_VERSION}/me/permissions`, {
      params: { access_token: longToken },
    });
    console.log('[Instagram Connect] Granted Permissions:', JSON.stringify(debugPerms.data, null, 2));

    // ── 3. Получаем Pages пользователя с instagram_business_account ──
    const pagesRes = await axios.get(`https://graph.facebook.com/${CONFIG.API_VERSION}/me/accounts`, {
      params: {
        access_token: longToken,
        fields: 'id,name,access_token,instagram_business_account',
      },
    });

    let pages = pagesRes.data.data || [];

    // ── 3.8 Smart Fallback: Проверяем страницы, которые уже есть в сторе (Messenger) ──
    if (pages.length === 0) {
      for (const botId in store.channelsByBotId) {
        const ch = store.channelsByBotId[botId];
        if (ch.messenger?.pageId) {
          try {
            const extraRes = await axios.get(`https://graph.facebook.com/${CONFIG.API_VERSION}/${ch.messenger.pageId}`, {
              params: {
                access_token: longToken,
                fields: 'id,name,access_token,instagram_business_account'
              }
            });
            if (extraRes.data.instagram_business_account) {
              pages.push(extraRes.data);
            }
          } catch (e) {
            // Silently continue fallback
          }
        }
      }
    }

    // ── 4. Ищем Page с привязанным Instagram ──
    let selectedPage = null;
    let igBusinessId = '';
    let igProfile = {};

    console.log('[Instagram Connect] Final pages list for inspection:', JSON.stringify(pages, null, 2));

    for (const page of pages) {
      if (page.instagram_business_account) {
        selectedPage = page;
        igBusinessId = page.instagram_business_account.id;
        break;
      }
    }

    if (!selectedPage || !igBusinessId) {
      return renderErrorPage(res, {
        title: 'Не удалось подключить Instagram',
        description: 'У этого аккаунта не найдено привязанного Instagram Business/Professional аккаунта. Проверь что Instagram привязан к Facebook Page.',
        actionHref,
        actionLabel: 'Назад к каналам',
      });
    }

    // ── 5. Получаем профиль Instagram Business ──
    try {
      const igRes = await axios.get(
        `https://graph.facebook.com/${CONFIG.API_VERSION}/${igBusinessId}`,
        {
          params: {
            fields: 'id,name,username,profile_picture_url,followers_count',
            access_token: selectedPage.access_token,
          },
        }
      );
      igProfile = igRes.data || {};
    } catch (profileErr) {
      console.warn('Could not fetch IG profile:', profileErr.response?.data || profileErr.message);
      igProfile = { id: igBusinessId };
    }

    // ── 6. Сохраняем канал ──
    const channels = getChannelsByBotId(bot.id);
    channels.instagram = {
      id: igBusinessId,
      // Для object=instagram Meta присылает entry.id = IG Business Account ID
      entryId: igBusinessId,
      pageId: selectedPage.id || '',
      pageToken: selectedPage.access_token || '',
      token: selectedPage.access_token || '', // backward compat
      username: igProfile.username || '',
      name: igProfile.name || '',
      connectedAt: new Date().toISOString(),
    };
    setChannelsByBotId(bot.id, channels);

    // ── 7. Авто-подписка Page на webhooks (КЛЮЧЕВОЙ ШАГ!) ──
    await subscribeToInstagramWebhooks(selectedPage.id, selectedPage.access_token);

    console.log(
      `Instagram канал подключен: bot=${bot.id}, pageId=${selectedPage.id}, igId=${igBusinessId}, username=${igProfile.username || 'N/A'}`
    );

    res.send(renderConnectionResultPage({
      title: 'Instagram подключен',
      subtitle: 'Аккаунт подключён через Facebook Login. Page подписана на webhooks.',
      badge: 'Instagram',
      details: [
        igProfile.name ? `Имя: ${escapeHtml(igProfile.name)}` : '',
        igProfile.username ? `Username: @${escapeHtml(igProfile.username)}` : '',
        `IG Business ID: ${escapeHtml(igBusinessId)}`,
        `Page: ${escapeHtml(selectedPage.name || selectedPage.id)}`,
      ].filter(Boolean),
      actionHref,
      actionLabel: 'Открыть каналы',
    }));
  } catch (err) {
    console.error('Instagram auth error:', err.response?.data || err.message);

    renderErrorPage(res, {
      title: 'Не удалось подключить Instagram',
      description: JSON.stringify(err.response?.data || err.message),
      actionHref,
      actionLabel: 'Назад к каналам',
    });
  }
});

app.get('/auth/messenger/login', (req, res) => {
  const bot = getBotOrDefault(req.query.botId);
  if (!CONFIG.MESSENGER_APP_ID || !CONFIG.MESSENGER_APP_SECRET) {
    return renderErrorPage(res, {
      title: 'Messenger пока не настроен',
      description: 'Сначала заполни MESSENGER_APP_ID и MESSENGER_APP_SECRET.',
      actionHref: `/auth/connect?botId=${encodeURIComponent(bot.id)}`,
      actionLabel: 'Назад к каналам',
    });
  }

  cleanupExpiredEntries(messengerOauthStates, 10 * 60 * 1000);

  const state = crypto.randomBytes(24).toString('hex');
  messengerOauthStates.set(state, {
    createdAt: Date.now(),
    botId: bot.id,
  });

  const authUrl =
    `https://www.facebook.com/${CONFIG.API_VERSION}/dialog/oauth?` +
    `client_id=${CONFIG.MESSENGER_APP_ID || CONFIG.META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(CONFIG.MESSENGER_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(CONFIG.MESSENGER_SCOPES)}` +
    `&state=${state}` +
    '&response_type=code';

  res.redirect(authUrl);
});

app.get('/auth/messenger/callback', async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;
  const oauthData = state ? messengerOauthStates.get(state) : null;
  const bot = getBotOrDefault(oauthData?.botId || req.query.botId);
  const actionHref = `/auth/connect?botId=${encodeURIComponent(bot.id)}`;

  if (error) {
    return renderErrorPage(res, {
      title: 'Не удалось подключить Messenger',
      description: errorDescription || error,
      actionHref,
      actionLabel: 'Назад к каналам',
    });
  }

  if (!state || !oauthData) {
    return renderErrorPage(res, {
      title: 'Не удалось подключить Messenger',
      description: 'Состояние OAuth недействительно или уже истекло.',
      actionHref,
      actionLabel: 'Назад к каналам',
    });
  }

  messengerOauthStates.delete(state);

  try {
    const tokenRes = await axios.get(`https://graph.facebook.com/${CONFIG.API_VERSION}/oauth/access_token`, {
      params: {
        client_id: CONFIG.MESSENGER_APP_ID || CONFIG.META_APP_ID,
        client_secret: CONFIG.MESSENGER_APP_SECRET || CONFIG.META_APP_SECRET,
        redirect_uri: CONFIG.MESSENGER_REDIRECT_URI,
        code,
      },
    });

    const shortToken = tokenRes.data.access_token;

    const longTokenRes = await axios.get(`https://graph.facebook.com/${CONFIG.API_VERSION}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: CONFIG.MESSENGER_APP_ID || CONFIG.META_APP_ID,
        client_secret: CONFIG.MESSENGER_APP_SECRET || CONFIG.META_APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });

    const longToken = longTokenRes.data.access_token;
    const pages = await fetchMessengerPages(longToken);

    if (pages.length === 0) {
      return renderErrorPage(res, {
        title: 'Не удалось подключить Messenger',
        description: 'У этого Facebook-аккаунта не найдено ни одной Page.',
        actionHref,
        actionLabel: 'Назад к каналам',
      });
    }

    if (pages.length === 1) {
      const channel = await finalizeMessengerConnection(bot.id, pages[0]);
      return res.send(renderConnectionResultPage({
        title: 'Messenger подключен',
        subtitle: 'Твоя Facebook Page подписана на webhook и готова к ответам.',
        badge: 'Messenger',
        details: [
          `Страница: ${escapeHtml(channel.pageName)}`,
          `Page ID: ${escapeHtml(channel.pageId)}`,
        ],
        actionHref,
        actionLabel: 'Открыть каналы',
      }));
    }

    cleanupExpiredEntries(pendingMessengerSelections, 10 * 60 * 1000);

    const selectionId = crypto.randomBytes(24).toString('hex');
    pendingMessengerSelections.set(selectionId, {
      createdAt: Date.now(),
      pages,
      botId: bot.id,
    });

    res.send(renderMessengerSelectionPage(selectionId, pages));
  } catch (err) {
    console.error('Messenger auth error:', err.response?.data || err.message);

    renderErrorPage(res, {
      title: 'Не удалось подключить Messenger',
      description: JSON.stringify(err.response?.data || err.message),
      actionHref,
      actionLabel: 'Назад к каналам',
    });
  }
});

app.get('/auth/messenger/select', async (req, res) => {
  const { selection, pageId } = req.query;
  const pending = selection ? pendingMessengerSelections.get(selection) : null;

  if (!pending || !pageId) {
    return renderErrorPage(res, {
      title: 'Ошибка выбора страницы Messenger',
      description: 'Ссылка выбора страницы отсутствует или уже устарела.',
      actionHref: '/auth/connect',
      actionLabel: 'Назад к каналам',
    });
  }

  const page = pending.pages.find((candidate) => candidate.id === pageId);
  pendingMessengerSelections.delete(selection);

  if (!page) {
    return renderErrorPage(res, {
      title: 'Ошибка выбора страницы Messenger',
      description: 'Выбранная страница больше недоступна.',
      actionHref: `/auth/connect?botId=${encodeURIComponent(pending.botId || getDefaultBot().id)}`,
      actionLabel: 'Назад к каналам',
    });
  }

  try {
    const bot = getBotOrDefault(pending.botId);
    const channel = await finalizeMessengerConnection(bot.id, page);

    res.send(renderConnectionResultPage({
      title: 'Messenger подключен',
      subtitle: 'Твоя Facebook Page подписана на webhook и готова к ответам.',
      badge: 'Messenger',
      details: [
        `Страница: ${escapeHtml(channel.pageName)}`,
        `Page ID: ${escapeHtml(channel.pageId)}`,
      ],
      actionHref: `/auth/connect?botId=${encodeURIComponent(bot.id)}`,
      actionLabel: 'Открыть каналы',
    }));
  } catch (err) {
    console.error('Messenger page finalize error:', err.response?.data || err.message);

    renderErrorPage(res, {
      title: 'Не удалось подключить Messenger',
      description: JSON.stringify(err.response?.data || err.message),
      actionHref: `/auth/connect?botId=${encodeURIComponent(pending.botId || getDefaultBot().id)}`,
      actionLabel: 'Назад к каналам',
    });
  }
});

app.get('/webhook/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === CONFIG.WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook/instagram', async (req, res) => {
  // ── Проверка подписи X-Hub-Signature-256 ──
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.body; // raw body thanks to express.raw() middleware

  if (CONFIG.META_APP_SECRET && signature && Buffer.isBuffer(rawBody)) {
    const expected = 'sha256=' +
      crypto.createHmac('sha256', CONFIG.META_APP_SECRET).update(rawBody).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      console.warn('[Webhook] Invalid X-Hub-Signature-256. Rejecting.');
      return res.sendStatus(403);
    }
  }

  // Быстрый ACK 200 — Meta требует быстрый ответ
  res.sendStatus(200);

  const body = Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString()) : rawBody;

  console.log('--- Incoming Instagram Webhook ---');
  console.log(JSON.stringify(body, null, 2));

  for (const entry of body.entry || []) {
    const channel = findInstagramChannelByEntryId(entry.id);
    if (!channel) {
      console.log(`[Webhook] No channel found for entry.id: ${entry.id}`);
      continue;
    }

    const events = collectInstagramEvents(entry);
    if (!events.length) {
      console.log('[Webhook] No messaging/standby/changes events in entry.');
      continue;
    }

    // Для IG reply нужен валидный Page token.
    // Иногда из IG OAuth сохраняется user token (IGA...), поэтому используем fallback
    // на messenger.pageToken (если канал Messenger уже подключен для того же бота).
    const instagramToken = channel.instagram.pageToken || channel.instagram.token || '';
    const messengerPageToken = channel.messenger?.pageToken || '';
    const pageToken =
      (!instagramToken || instagramToken.startsWith('IGA')) && messengerPageToken
        ? messengerPageToken
        : instagramToken;

    if (!pageToken) {
      console.log(`[Webhook] Channel found for ${entry.id} but no valid send token exists.`);
      continue;
    }

    for (const payload of events) {
      const { source, event } = payload;
      console.log(`[Webhook Event][${source}]:`, JSON.stringify(event, null, 2));

      if (source === 'standby') {
        console.log('[Webhook] Standby event received. Another app may have primary control of the thread.');
      }

      if (!event.message || event.message.is_echo) {
        console.log('[Webhook] Skipping: not a message or is an echo.');
        continue;
      }

      const senderId =
        event.sender?.id ||
        event.from?.id ||
        event.message?.from?.id ||
        '';

      let text = '';
      if (event.message?.text) {
        text = event.message.text;
      } else if (event.postback?.payload) {
        text = event.postback.payload; // Treatment for buttons
      } else if (event.message?.attachments) {
        text = '[Медиа-файл]';
      }

      if (!senderId) {
        console.log('[Webhook] Skipping: missing senderId.');
        continue;
      }

      // If it's a media file, send a friendly placeholder
      const responseText = event.message?.attachments
        ? 'Я получил ваш файл, но пока умею общаться только текстом. BotMatic уже работает.'
        : `Привет. Я получил твое сообщение в Instagram: "${text}". BotMatic уже работает.`;

      try {
        await sendInstagramMessage(
          pageToken,
          senderId,
          responseText
        );
        console.log(`[Webhook] IG auto-reply sent to ${senderId}`);
      } catch (err) {
        console.error('Instagram send error:', err.response?.data || err.message);
      }
    }
  }
});

// Catch-all webhook for debugging misrouted events from Nginx
app.all('/webhook', (req, res) => {
  console.log('--- Catch-all Webhook received on /webhook ---');
  console.log('Method:', req.method);
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  if (req.query['hub.challenge']) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  res.sendStatus(200);
});

// Explicit messenger webhook with debugging
app.all('/webhook/messenger', (req, res) => {
  console.log('--- Catch-all Webhook received on /webhook/messenger ---');
  console.log('Method:', req.method);
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  if (req.query['hub.challenge']) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  res.sendStatus(200);
});


app.get('/auth/messenger/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === CONFIG.WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

app.post('/auth/messenger/webhook', async (req, res) => {
  res.sendStatus(200);
  console.log('--- Incoming Messenger Webhook ---');
  console.log(JSON.stringify(req.body, null, 2));


  if (req.body.object !== 'page') return;

  for (const entry of req.body.entry || []) {
    const channel = findMessengerChannelByPageId(entry.id);
    if (!channel || !channel.messenger.pageToken) continue;

    for (const event of entry.messaging || []) {
      if (!event.message || event.message.is_echo) continue;

      const senderId = event.sender?.id || event.from?.id || '';
      let text = '';

      if (event.message?.text) {
        text = event.message.text;
      } else if (event.postback?.payload) {
        text = event.postback.payload;
      } else if (event.message?.attachments) {
        text = '[Медиа-файл]';
      }

      if (!senderId) {
        console.log(`[Messenger Webhook] Skipping event: missing senderId`);
        continue;
      }

      const responseText = event.message?.attachments
        ? 'Я получил ваш файл в Messenger, но пока умею отвечать только на текст. BotMatic уже в строю.'
        : `Привет. Я получил твое сообщение в Messenger: "${text}". BotMatic уже работает.`;

      try {
        await sendMessengerMessage(
          channel.messenger.pageToken,
          senderId,
          responseText
        );
      } catch (err) {
        console.error('Messenger send error:', err.response?.data || err.message);
      }
    }
  }
});

// fetchInstagramProfile — больше не нужна (профиль получаем через Graph API в callback)

async function subscribeToInstagramWebhooks(pageId, pageToken) {
  // Подписка Page на webhooks через Graph API (POST /{page-id}/subscribed_apps)
  await axios.post(
    `https://graph.facebook.com/${CONFIG.API_VERSION}/${pageId}/subscribed_apps`,
    null,
    {
      params: {
        subscribed_fields: CONFIG.IG_SUBSCRIBED_FIELDS,
        access_token: pageToken,
      },
    }
  );

  console.log(`Instagram webhook subscriptions enabled for page ${pageId}: ${CONFIG.IG_SUBSCRIBED_FIELDS}`);
}

async function sendInstagramMessage(pageToken, recipientId, text) {
  // Отправка через Graph API /me/messages с Page access token
  await axios.post(
    `https://graph.facebook.com/${CONFIG.API_VERSION}/me/messages`,
    {
      recipient: { id: recipientId },
      message: { text },
    },
    {
      params: {
        access_token: pageToken,
      },
    }
  );
}

async function fetchMessengerPages(accessToken) {
  const response = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
    params: {
      access_token: accessToken,
      fields: 'id,name,access_token,picture{url}',
    },
  });

  return response.data.data || [];
}

async function finalizeMessengerConnection(botId, page) {
  const channels = getChannelsByBotId(botId);
  channels.messenger = {
    pageId: page.id,
    pageName: page.name || '',
    pageToken: page.access_token || '',
    pagePicture: page.picture?.data?.url || '',
    connectedAt: new Date().toISOString(),
  };
  setChannelsByBotId(botId, channels);

  await subscribeMessengerToWebhooks(page.id, page.access_token);

  console.log(`Messenger канал подключен: bot=${botId}, pageId=${page.id}`);
  return channels.messenger;
}

async function subscribeMessengerToWebhooks(pageId, pageToken) {
  await axios.post(
    `https://graph.facebook.com/${CONFIG.API_VERSION}/${pageId}/subscribed_apps`,
    null,
    {
      params: {
        subscribed_fields: 'messages,messaging_postbacks,messaging_optins',
        access_token: pageToken,
      },
    }
  );

  console.log(`Messenger webhook subscriptions enabled for page ${pageId}`);
}

// ─── TELEGRAM ────────────────────────────────────────────────────────
async function subscribeTelegramWebhook(botId, token) {
  const webhookUrl = `https://ocenka02.ru/auth/webhook/telegram/${botId}`;
  await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
    url: webhookUrl,
    allowed_updates: ['message'],
  });
  console.log(`Telegram webhook set for bot ${botId}: ${webhookUrl}`);
}

async function sendTelegramMessage(token, chatId, text) {
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: text,
  });
}

app.post('/auth/api/telegram/connect', async (req, res) => {
  const { botId, token } = req.body;
  if (!botId || !token) {
    return res.status(400).json({ error: 'Missing botId or token' });
  }

  const bot = getBotById(botId);
  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  try {
    // Валидируем токен через Telegram API
    const getMeRes = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    const tgBot = getMeRes.data.result;

    // Подписываемся на вебхуки
    await subscribeTelegramWebhook(bot.id, token);

    // Сохраняем канал
    const channels = getChannelsByBotId(bot.id);
    channels.telegram = {
      id: String(tgBot.id),
      token: token,
      username: tgBot.username || '',
      name: tgBot.first_name || '',
      connectedAt: new Date().toISOString(),
    };
    setChannelsByBotId(bot.id, channels);

    res.json({ success: true, channel: channels.telegram });
  } catch (err) {
    console.error('Telegram connect error:', err.response?.data || err.message);
    res.status(400).json({ error: 'Invalid token or unable to connect' });
  }
});

// --- WhatsApp Baileys Proxy Endpoints ---
app.get('/auth/api/whatsapp/connect', async (req, res) => {
  const botId = req.query.botId;
  if (!botId) return res.status(400).json({ error: 'botId required' });
  try {
    const backendRes = await axios.get(`http://localhost:3300/api/whatsapp/connect?botId=${botId}`);
    res.json(backendRes.data);
  } catch (err) {
    console.error('WhatsApp Baileys proxy error:', err.message);
    res.status(500).json({ error: 'WhatsApp backend offline' });
  }
});

/**
 * [NEW] WhatsApp Webhook Handler
 * Receives events from Baileys Hub and routes them to the bot logic
 */
app.post('/auth/api/whatsapp/webhook', async (req, res) => {
  try {
    if (!whatsappRouterReady || typeof routeMessage !== 'function') {
      console.warn('⚠️ WhatsApp webhook received but router is not initialized. Acking without processing.');
      return res.json({ ok: true, processed: false, reason: 'router_unavailable' });
    }

    const payload = req.body;
    console.log(`📩 Incoming WhatsApp Webhook:`, JSON.stringify(payload, null, 2));

    // Route to bot logic
    const response = await routeMessage(payload);

    // Send 200 OK back to Baileys
    res.json({ ok: true, processed: !!response });
  } catch (err) {
    console.error('❌ WhatsApp Webhook Error:', err.message);
    res.status(500).json({ error: 'Failed to process WhatsApp message' });
  }
});

/**
 * [NEW] Reload Bot logic (Exposed for both internal and external triggers)
 */
app.get('/api/whatsapp/reload', async (req, res) => {
  const { botId } = req.query;
  if (!botId) return res.status(400).json({ error: 'botId required' });
  if (typeof loadBot !== 'function') {
    return res.status(503).json({ error: 'WhatsApp router not initialized' });
  }

  try {
    const success = await loadBot(botId);
    res.json({ ok: success, botId });
  } catch (err) {
    console.error(`❌ Failed to reload bot ${botId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/api/whatsapp/success', (req, res) => {
  const botId = req.body.botId;
  if (!botId) return res.status(400).json({ error: 'botId required' });

  const channels = getChannelsByBotId(botId);
  channels.whatsapp.connected = true;
  channels.whatsapp.connectedAt = new Date().toISOString();
  setChannelsByBotId(botId, channels);

  res.json({ ok: true });
});

app.post('/auth/webhook/telegram/:botId', async (req, res) => {
  res.sendStatus(200); // Быстрый ответ Telegram

  const { botId } = req.params;
  const body = req.body;

  console.log(`--- Incoming Telegram Webhook for bot ${botId} ---`);
  console.log(JSON.stringify(body, null, 2));

  // Получаем канал из store
  const channels = store.channelsByBotId[botId];
  if (!channels || !channels.telegram || !channels.telegram.token) {
    console.log(`[Webhook] No valid Telegram channel found for bot ${botId}`);
    return;
  }

  if (body.message && body.message.text) {
    const chatId = body.message.chat.id;
    const text = body.message.text;

    try {
      await sendTelegramMessage(
        channels.telegram.token,
        chatId,
        `Привет. Я получил твое сообщение в Telegram: "${text}". BotMatic уже работает.`
      );
    } catch (err) {
      console.error('Telegram send error:', err.response?.data || err.message);
    }
  }
});

async function sendMessengerMessage(pageToken, recipientId, text) {
  await axios.post(
    'https://graph.facebook.com/v21.0/me/messages',
    {
      messaging_type: 'RESPONSE',
      recipient: { id: recipientId },
      message: { text },
    },
    {
      params: {
        access_token: pageToken,
      },
    }
  );
}

function findInstagramChannelByEntryId(entryId) {
  const candidateId = entryId ? String(entryId) : '';
  const connectedChannels = [];

  for (const bot of store.bots) {
    const channels = getChannelsByBotId(bot.id);
    const hasInstagramToken = Boolean(channels.instagram.pageToken || channels.instagram.token);
    const hasMessengerToken = Boolean(channels.messenger?.pageToken);
    const canSendToInstagram = hasInstagramToken || hasMessengerToken;
    if (!canSendToInstagram) continue;
    connectedChannels.push({
      bot,
      instagram: channels.instagram,
      messenger: channels.messenger,
    });

    const instagramUserId = channels.instagram.id ? String(channels.instagram.id) : '';
    const instagramEntryId = channels.instagram.entryId ? String(channels.instagram.entryId) : '';
    const instagramPageId = channels.instagram.pageId ? String(channels.instagram.pageId) : '';

    if (candidateId && (
      instagramPageId === candidateId ||
      instagramUserId === candidateId ||
      instagramEntryId === candidateId
    )) {
      return {
        bot,
        instagram: channels.instagram,
        messenger: channels.messenger,
      };
    }
  }

  // Fallback: if only one channel is connected, assume it's the one
  if (candidateId && connectedChannels.length === 1) {
    console.log(`[Lookup] ID Mismatch (${candidateId}), but only one channel exists. Falling back to bot: ${connectedChannels[0].bot.id}`);
    return connectedChannels[0];
  }

  return null;
}

function findMessengerChannelByPageId(pageId) {
  const candidateId = pageId ? String(pageId) : '';

  for (const bot of store.bots) {
    const channels = getChannelsByBotId(bot.id);
    if (!channels.messenger.pageToken || !channels.messenger.pageId) continue;

    if (String(channels.messenger.pageId) === candidateId) {
      return { bot, messenger: channels.messenger };
    }
  }

  return null;
}

function collectInstagramEvents(entry) {
  const events = [];

  for (const event of entry.messaging || []) {
    events.push({ source: 'messaging', event });
  }

  for (const event of entry.standby || []) {
    events.push({ source: 'standby', event });
  }

  for (const change of entry.changes || []) {
    const source = `changes:${change?.field || 'unknown'}`;
    const value = change?.value;

    if (Array.isArray(value?.messages)) {
      for (const messageEvent of value.messages) {
        events.push({ source, event: messageEvent });
      }
      continue;
    }

    if (value && typeof value === 'object') {
      events.push({ source, event: value });
    }
  }

  return events;
}

function cleanupExpiredEntries(store, maxAgeMs) {
  const now = Date.now();

  for (const [key, value] of store.entries()) {
    if (now - value.createdAt > maxAgeMs) {
      store.delete(key);
    }
  }
}

function buildUrlWithQuery(baseUrl, values) {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function renderConnectionResultPage({ title, subtitle, badge, details, actionHref, actionLabel }) {
  const detailItems = details
    .map((detail) => `<li>${detail}</li>`)
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top left, rgba(242, 149, 82, 0.18), transparent 35%),
          radial-gradient(circle at bottom right, rgba(54, 126, 255, 0.18), transparent 32%),
          #0f1220;
        color: #f6f3ea;
        font-family: "Segoe UI", Arial, sans-serif;
        padding: 24px;
      }
      .card {
        width: min(640px, 100%);
        background: rgba(17, 23, 38, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 20px 80px rgba(0, 0, 0, 0.35);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(93, 211, 158, 0.12);
        color: #6de0af;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 10px;
        font-size: clamp(30px, 5vw, 44px);
        line-height: 1.05;
      }
      p {
        margin: 0 0 24px;
        color: #b8c0d8;
        line-height: 1.6;
      }
      ul {
        margin: 0 0 28px;
        padding-left: 18px;
        color: #ecf0ff;
      }
      li + li {
        margin-top: 8px;
      }
      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 190px;
        padding: 14px 18px;
        border-radius: 14px;
        text-decoration: none;
        color: #111827;
        background: linear-gradient(135deg, #f4c76d, #ff8f5b);
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <section class="card">
      <div class="badge">${escapeHtml(badge)}</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      <ul>${detailItems}</ul>
      <a href="${escapeHtml(actionHref)}">${escapeHtml(actionLabel)}</a>
    </section>
  </body>
</html>`;
}

function renderErrorPage(res, { title, description, actionHref, actionLabel }) {
  res.status(400).type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #0b0e18;
        color: #f6f3ea;
        font-family: "Segoe UI", Arial, sans-serif;
        padding: 24px;
      }
      .card {
        width: min(680px, 100%);
        background: #131827;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 32px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 34px;
      }
      p {
        margin: 0 0 20px;
        color: #b8c0d8;
        line-height: 1.6;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        background: rgba(255, 92, 92, 0.08);
        border: 1px solid rgba(255, 92, 92, 0.18);
        border-radius: 14px;
        padding: 16px;
        margin: 0 0 24px;
        color: #ffb7b7;
      }
      a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 190px;
        padding: 14px 18px;
        border-radius: 14px;
        text-decoration: none;
        color: #111827;
        background: #f3d27b;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <section class="card">
      <h1>${escapeHtml(title)}</h1>
      <p>Канал не удалось подключить.</p>
      <pre>${escapeHtml(description)}</pre>
      <a href="${escapeHtml(actionHref)}">${escapeHtml(actionLabel)}</a>
    </section>
  </body>
</html>`);
}

function renderMessengerSelectionPage(selectionId, pages) {
  const pageCards = pages
    .map((page) => {
      const picture = page.picture?.data?.url;
      const avatar = picture
        ? `<img src="${escapeHtml(picture)}" alt="" />`
        : `<span>${escapeHtml((page.name || 'P').slice(0, 1).toUpperCase())}</span>`;

      return `
        <a class="page-card" href="/auth/messenger/select?selection=${encodeURIComponent(selectionId)}&pageId=${encodeURIComponent(page.id)}">
          <div class="avatar">${avatar}</div>
          <div class="meta">
            <strong>${escapeHtml(page.name || 'Unnamed Page')}</strong>
            <span>Page ID: ${escapeHtml(page.id)}</span>
          </div>
          <div class="cta">Подключить</div>
        </a>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Выбор Facebook Page</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        padding: 28px;
        background:
          radial-gradient(circle at top left, rgba(82, 138, 255, 0.18), transparent 35%),
          radial-gradient(circle at bottom right, rgba(120, 92, 255, 0.14), transparent 30%),
          #0e1220;
        color: #edf2ff;
        font-family: "Segoe UI", Arial, sans-serif;
      }
      .wrap {
        width: min(860px, 100%);
        margin: 0 auto;
      }
      h1 {
        margin: 0 0 10px;
        font-size: clamp(32px, 5vw, 48px);
      }
      p {
        margin: 0 0 24px;
        color: #aeb9d8;
        line-height: 1.6;
      }
      .grid {
        display: grid;
        gap: 14px;
      }
      .page-card {
        display: grid;
        grid-template-columns: 64px 1fr auto;
        gap: 16px;
        align-items: center;
        padding: 18px;
        border-radius: 18px;
        background: rgba(17, 23, 38, 0.94);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: inherit;
        text-decoration: none;
      }
      .page-card:hover {
        border-color: rgba(255, 255, 255, 0.18);
        transform: translateY(-1px);
      }
      .avatar {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        overflow: hidden;
        background: linear-gradient(135deg, #5aa4ff, #395cff);
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 22px;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .meta strong {
        display: block;
        font-size: 18px;
        margin-bottom: 4px;
      }
      .meta span {
        color: #9dacd5;
        font-size: 13px;
      }
      .cta {
        padding: 11px 14px;
        border-radius: 12px;
        background: linear-gradient(135deg, #8ab8ff, #4a77ff);
        color: #071224;
        font-weight: 700;
      }
      @media (max-width: 640px) {
        .page-card {
          grid-template-columns: 56px 1fr;
        }
        .cta {
          grid-column: span 2;
          text-align: center;
        }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Выбери Facebook Page</h1>
      <p>Мы нашли несколько Pages у этого Facebook-аккаунта. Выбери ту, которую BotMatic должен подключить для Messenger.</p>
      <section class="grid">${pageCards}</section>
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function ensureStartupSubscription() {
  for (const bot of store.bots) {
    const channels = getChannelsByBotId(bot.id);

    // Instagram: переподписываем Page на webhooks при старте
    const igPageId = channels.instagram.pageId;
    const rawInstagramToken = channels.instagram.pageToken || channels.instagram.token || '';
    const igPageToken =
      (!rawInstagramToken || rawInstagramToken.startsWith('IGA')) && channels.messenger.pageToken
        ? channels.messenger.pageToken
        : rawInstagramToken;

    if (igPageId && igPageToken) {
      try {
        await subscribeToInstagramWebhooks(igPageId, igPageToken);
        console.log(`Startup: Instagram webhooks re-subscribed for bot ${bot.id}, page ${igPageId}`);
      } catch (err) {
        console.error(
          `Startup Instagram webhook subscription failed for bot ${bot.id}:`,
          err.response?.data || err.message
        );
      }
    }

    if (channels.messenger.pageToken && channels.messenger.pageId) {
      try {
        await subscribeMessengerToWebhooks(channels.messenger.pageId, channels.messenger.pageToken);
      } catch (err) {
        console.error(
          `Startup Messenger webhook subscription failed for bot ${bot.id}:`,
          err.response?.data || err.message
        );
      }
    }

    if (channels.telegram.token) {
      try {
        await subscribeTelegramWebhook(bot.id, channels.telegram.token);
      } catch (err) {
        console.error(
          `Startup Telegram webhook subscription failed for bot ${bot.id}:`,
          err.response?.data || err.message
        );
      }
    }
  }
}

ensureStartupSubscription().finally(() => {
  app.listen(CONFIG.PORT, () => {
    console.log(`BotMatic channel server running on port ${CONFIG.PORT}`);
    console.log(`Instagram redirect URI: ${CONFIG.IG_REDIRECT_URI}`);
    console.log(`Messenger redirect URI: ${CONFIG.MESSENGER_REDIRECT_URI}`);
  });
});
