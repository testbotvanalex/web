export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description, lang = 'nl' } = req.body;

    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Ongeldige omschrijving' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key ontbreekt' });
    }

    const prompt = `Bedrijf: "${description}". Genereer 3 praktische chatbot-ideeën (service, leads, sales) in taal: ${lang}. Gebruik 1., 2., 3. en **vette** titels.`;

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || `HTTP ${r.status}` });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ ok: true, text });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Onbekende fout' });
  }
}
