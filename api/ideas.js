// /api/ideas.js
async function readJsonSafe(req) {
  // 1) Если body уже объект — просто вернём его
  if (req.body && typeof req.body === 'object') return req.body;

  // 2) Если body строка — попробуем распарсить
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* fallthrough */ }
  }

  // 3) Иначе прочитаем поток (иногда Vercel отдаёт как stream)
  const chunks = [];
  for await (const ch of req) chunks.push(ch);
  const text = Buffer.concat(chunks).toString('utf8') || '';
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await readJsonSafe(req);

    const description = (body.description || '').trim();
    const lang = (body.lang || 'nl').trim();

    if (!description) {
      return res.status(400).json({ error: 'Ongeldige omschrijving' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key ontbreekt' });

    const prompt =
      `Bedrijf: "${description}". Genereer 3 praktische chatbot-ideeën ` +
      `(klantenservice, leadgeneratie, sales). Gebruik 1., 2., 3. en **vette** titels. ` +
      `Schrijf in taal: ${lang}.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await r.json();
    if (!r.ok) {
      const msg = data?.error?.message || `HTTP ${r.status}`;
      return res.status(r.status).json({ error: msg });
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return res.status(502).json({ error: 'Leeg antwoord van het model' });

    return res.status(200).json({ ok: true, text });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Onbekende fout' });
  }
}
