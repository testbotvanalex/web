// /api/ideas.js
// Узел Vercel (Node runtime). Без внешних зависимостей.
// Что добавлено:
// - CORS + preflight (OPTIONS)
// - Таймаут запроса к OpenAI (AbortController)
// - Простая защита от флуда (in‑memory rate limit по IP)
// - Жёсткая валидация входа (язык только nl/en/fr)
// - System + User промпты (более стабильный тон/формат)
// - max_tokens/температура по умолчанию + явные ошибки
// - Безопасный парсинг body (как у тебя), но компактнее

const RATE_WINDOW_MS = 60_000; // 1 минута
const RATE_MAX = 20;           // не более 20 POST/мин с одного IP
const ipHits = new Map();

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function readJsonSafe(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* no-op */ }
  }
  const chunks = [];
  for await (const ch of req) chunks.push(ch);
  const text = Buffer.concat(chunks).toString('utf8') || '';
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

function rateLimit(req, res) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();
  const now = Date.now();
  const bucket = ipHits.get(ip) || { ts: now, count: 0 };
  if (now - bucket.ts > RATE_WINDOW_MS) {
    bucket.ts = now; bucket.count = 0;
  }
  bucket.count += 1;
  ipHits.set(ip, bucket);
  if (bucket.count > RATE_MAX) {
    res.statusCode = 429;
    return { error: 'Too many requests. Try again later.' };
  }
  return null;
}

export default async function handler(req, res) {
  allowCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200; return res.end();
  }
  if (req.method !== 'POST') {
    res.statusCode = 405; return res.json({ error: 'Method not allowed' });
  }

  const rl = rateLimit(req, res);
  if (rl) return res.json(rl);

  try {
    const body = await readJsonSafe(req);

    // ---- Валидация входа ----
    const description = String(body?.description || '').trim().slice(0, 800);
    let lang = String(body?.lang || 'nl').trim().toLowerCase();
    if (!['nl', 'en', 'fr'].includes(lang)) lang = 'nl';

    if (!description) {
      res.statusCode = 400;
      return res.json({ error: lang === 'nl'
        ? 'Ongeldige omschrijving'
        : lang === 'fr'
        ? 'Description invalide'
        : 'Invalid description'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      return res.json({ error: lang === 'nl'
        ? 'API-sleutel ontbreekt'
        : lang === 'fr'
        ? "Clé d'API manquante"
        : 'API key missing'
      });
    }

    // ---- Промпт ----
    const system = (
      lang === 'nl' ? 'Je bent een zakelijke copywriter. Antwoord in het Nederlands.' :
      lang === 'fr' ? 'Tu es un copywriter business. Réponds en français.' :
                      'You are a business copywriter. Answer in English.'
    ) + ' Provide 3 concise, practical chatbot ideas for a business. Use numbered list (1., 2., 3.) with **bold** titles and 1–2 sentences each. Focus on customer service, lead gen, and sales.';

    const user = (
      lang === 'nl' ? `Bedrijf: "${description}".` :
      lang === 'fr' ? `Entreprise : "${description}".` :
                      `Business: "${description}".`
    );

    // ---- Запрос к OpenAI ----
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000); // 25s таймаут

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    }).catch(err => {
      throw new Error(err?.name === 'AbortError' ? 'Upstream timeout' : (err?.message || 'Fetch failed'));
    }).finally(() => clearTimeout(timeout));

    let data;
    try { data = await r.json(); } catch {
      data = null;
    }

    if (!r.ok) {
      const msg = data?.error?.message || `HTTP ${r.status}`;
      res.statusCode = r.status;
      return res.json({ error: msg });
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      res.statusCode = 502;
      return res.json({ error: lang === 'nl'
        ? 'Leeg antwoord van het model'
        : lang === 'fr'
        ? 'Réponse vide du modèle'
        : 'Empty model response'
      });
    }

    return res.status(200).json({ ok: true, text });
  } catch (e) {
    const msg = e?.message || 'Unknown error';
    const code = /timeout|abort/i.test(msg) ? 504 : 500;
    res.statusCode = code;
    return res.json({ error: msg });
  }
}
