const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Je bent de BotMatic-assistent op de website botmatic.be. BotMatic bouwt slimme chatbots voor Belgische KMO's die automatisch klantvragen beantwoorden via WhatsApp, Instagram, Messenger en meer — 24/7, zonder dat je team iets hoeft te doen. Je helpt websitebezoekers met vragen over BotMatic's diensten, hoe het werkt, prijzen en opzet. Wees vriendelijk, kort en concreet. Als iemand een demo wil, meer info wil of een afspraak wil: stuur ze naar WhatsApp: https://wa.me/32456912464. Antwoord altijd in dezelfde taal als de bezoeker (NL of FR).`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-8).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
    res.json({ reply: response.choices[0].message.content?.trim() });
  } catch (e) {
    console.error('[/api/chat]', e.message);
    res.status(500).json({ reply: 'Sorry, even een probleem. Probeer opnieuw!' });
  }
};
