require('./load-env');

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── CONFIG (замени на свои) ───────────────────────────────────────────
const CONFIG = {
  APP_ID: process.env.META_APP_ID || 'YOUR_META_APP_ID',
  APP_SECRET: process.env.META_APP_SECRET || 'YOUR_META_APP_SECRET',
  REDIRECT_URI: process.env.REDIRECT_URI || 'https://botmatic02.ru/auth/instagram/callback',
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || 'botmatic_secret_2024',
};
// ──────────────────────────────────────────────────────────────────────

// In-memory store (замени на PostgreSQL в продакшне)
const connectedAccounts = new Map();
const oauthStates = new Map(); // CSRF protection

// ─── STEP 1: Начало OAuth flow ─────────────────────────────────────────
app.get('/auth/instagram/start', (req, res) => {
  const clientId = req.query.clientId || 'demo'; // твой tenant ID

  // Генерируем state для защиты от CSRF
  const state = crypto.randomBytes(16).toString('hex');
  oauthStates.set(state, { clientId, createdAt: Date.now() });

  // Cleanup старых state (старше 10 минут)
  for (const [key, val] of oauthStates.entries()) {
    if (Date.now() - val.createdAt > 600000) oauthStates.delete(key);
  }

  const scopes = [
    'instagram_basic',
    'instagram_manage_messages',
    'pages_messaging',
    'pages_show_list',
  ].join(',');

  const authUrl =
    `https://www.facebook.com/v21.0/dialog/oauth?` +
    `client_id=${CONFIG.APP_ID}` +
    `&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${state}` +
    `&response_type=code`;

  res.redirect(authUrl);
});

// ─── STEP 2: Meta редиректит сюда с кодом ─────────────────────────────
app.get('/auth/instagram/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Ошибка от Meta (например, пользователь отменил)
  if (error) {
    return res.redirect(`/?status=error&message=${encodeURIComponent(req.query.error_description || 'Cancelled')}`);
  }

  // Проверяем CSRF state
  if (!state || !oauthStates.has(state)) {
    return res.redirect('/?status=error&message=Invalid+state');
  }

  const { clientId } = oauthStates.get(state);
  oauthStates.delete(state);

  try {
    // ── 2a. Меняем code на short-lived token ──────────────────────────
    const tokenRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        client_id: CONFIG.APP_ID,
        client_secret: CONFIG.APP_SECRET,
        redirect_uri: CONFIG.REDIRECT_URI,
        code,
      },
    });

    const shortToken = tokenRes.data.access_token;

    // ── 2b. Меняем на long-lived token (60 дней) ──────────────────────
    const longTokenRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: CONFIG.APP_ID,
        client_secret: CONFIG.APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });

    const longToken = longTokenRes.data.access_token;
    const expiresIn = longTokenRes.data.expires_in; // ~5184000 sec = 60 дней

    // ── 2c. Получаем список Pages пользователя ────────────────────────
    const pagesRes = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
      params: { access_token: longToken, fields: 'id,name,access_token,instagram_business_account' },
    });

    const pages = pagesRes.data.data || [];

    // ── 2d. Находим страницы с подключённым Instagram ─────────────────
    const instagramAccounts = [];

    for (const page of pages) {
      if (page.instagram_business_account) {
        // Получаем инфо об Instagram аккаунте
        const igRes = await axios.get(
          `https://graph.facebook.com/v21.0/${page.instagram_business_account.id}`,
          {
            params: {
              fields: 'id,name,username,profile_picture_url,followers_count',
              access_token: page.access_token,
            },
          }
        );

        instagramAccounts.push({
          igId: igRes.data.id,
          igUsername: igRes.data.username,
          igName: igRes.data.name,
          igPicture: igRes.data.profile_picture_url,
          igFollowers: igRes.data.followers_count,
          pageId: page.id,
          pageName: page.name,
          pageToken: page.access_token, // Page token для webhook'ов
        });
      }
    }

    if (instagramAccounts.length === 0) {
      return res.redirect('/?status=error&message=No+Instagram+Business+account+found');
    }

    // ── 2e. Сохраняем (в продакшне → PostgreSQL) ──────────────────────
    const account = instagramAccounts[0]; // Если несколько - можно показать выбор
    connectedAccounts.set(clientId, {
      ...account,
      longToken,
      expiresAt: Date.now() + expiresIn * 1000,
      connectedAt: new Date().toISOString(),
    });

    // ── 2f. Подписываемся на Webhooks ─────────────────────────────────
    await subscribeToWebhooks(account.pageId, account.pageToken);

    console.log(`✅ Instagram connected: @${account.igUsername} for client ${clientId}`);

    res.redirect(`/?status=success&username=${account.igUsername}&clientId=${clientId}`);
  } catch (err) {
    console.error('OAuth error:', err.response?.data || err.message);
    res.redirect(`/?status=error&message=${encodeURIComponent('OAuth failed: ' + (err.response?.data?.error?.message || err.message))}`);
  }
});

// ─── Подписка на Webhooks ──────────────────────────────────────────────
async function subscribeToWebhooks(pageId, pageToken) {
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`,
      null,
      {
        params: {
          subscribed_fields: 'messages,messaging_postbacks,messaging_optins',
          access_token: pageToken,
        },
      }
    );
    console.log(`✅ Webhooks subscribed for page ${pageId}`);
  } catch (err) {
    console.error('Webhook subscription error:', err.response?.data || err.message);
  }
}

// ─── WEBHOOK: Верификация (GET) ────────────────────────────────────────
app.get('/webhook/instagram', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

  if (mode === 'subscribe' && token === CONFIG.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ─── WEBHOOK: Входящие сообщения (POST) ───────────────────────────────
app.post('/webhook/instagram', (req, res) => {
  res.sendStatus(200); // Всегда отвечай 200 быстро!

  const body = req.body;
  if (body.object !== 'instagram') return;

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      handleIncomingMessage(entry.id, event);
    }
  }
});

async function handleIncomingMessage(pageId, event) {
  if (!event.message || event.message.is_echo) return;

  const senderId = event.sender.id;
  const text = event.message.text;

  console.log(`📩 Instagram DM from ${senderId}: "${text}"`);

  // Найди аккаунт по pageId
  let account = null;
  for (const acc of connectedAccounts.values()) {
    if (acc.pageId === pageId) { account = acc; break; }
  }

  if (!account) return console.error('Account not found for page:', pageId);

  // ── Отправляем ответ ──────────────────────────────────────────────
  try {
    await sendInstagramMessage(account.pageToken, account.igId, senderId,
      `Привет! Ты написал: "${text}"\n\nЭто BotMatic 🤖`
    );
  } catch (err) {
    console.error('Send message error:', err.response?.data || err.message);
  }
}

// ─── Отправка сообщения в Instagram DM ────────────────────────────────
async function sendInstagramMessage(pageToken, igId, recipientId, text) {
  await axios.post(
    `https://graph.facebook.com/v21.0/${igId}/messages`,
    {
      recipient: { id: recipientId },
      message: { text },
    },
    { params: { access_token: pageToken } }
  );
}

// ─── API: Статус подключённых аккаунтов ───────────────────────────────
app.get('/api/accounts', (req, res) => {
  const accounts = [];
  for (const [clientId, acc] of connectedAccounts.entries()) {
    accounts.push({
      clientId,
      igUsername: acc.igUsername,
      igName: acc.igName,
      igPicture: acc.igPicture,
      igFollowers: acc.igFollowers,
      connectedAt: acc.connectedAt,
      tokenExpiresAt: new Date(acc.expiresAt).toISOString(),
    });
  }
  res.json(accounts);
});

// ─── API: Отключить аккаунт ────────────────────────────────────────────
app.delete('/api/accounts/:clientId', (req, res) => {
  connectedAccounts.delete(req.params.clientId);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BotMatic Instagram OAuth server running on http://localhost:${PORT}`);
  console.log(`📋 Config: App ID = ${CONFIG.APP_ID}`);
});
