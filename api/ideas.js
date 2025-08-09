// api/ideas.js
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  // На всякий случай читаем поток (иногда body может быть строкой)
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await readJson(req);
    const description = (body.description || '').trim();
    const lang = (body.lang || 'nl').trim();

    if (description.length < 5) {
      return res.status(400).json({ error: 'Ongeldige omschrijving' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key ontbreekt' });
    }

    const prompt =
      `Bedrijf: "${description}". Genereer 3 praktische chatbot-ideeën ` +
      `(klantenservice, leadgeneratie, sales) in taal: ${lang}. ` +
      `Gebruik 1., 2., 3. en **vette** titels.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      const msg = data?.error?.message || `HTTP ${r.status}`;
      return res.status(r.status).json({ error: msg });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== 'string' || !text.trim()) {
      // Вернём явную ошибку вместо пустоты
      return res.status(502).json({ error: 'Leeg antwoord van het model' });
    }

    return res.status(200).json({ ok: true, text });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Onbekende fout' });
  }
}
