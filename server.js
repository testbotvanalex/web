import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Настройка OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are BotMatic's assistant. Language: Dutch (NL).
Always answer in 1–3 short sentences and only about BotMatic (chatbots, functies, prijzen, integraties, GDPR, support).
If question is irrelevant — steer user back to BotMatic topics.
Tone: duidelijk, vriendelijk, professioneel.
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body || [];

    // Формируем историю сообщений для ChatGPT
    const history = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // можно 'gpt-4o' если нужен топ
      messages: history,
      temperature: 0.5,
      max_tokens: 300
    });

    const reply = response.choices[0]?.message?.content || 'Oké.';
    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error('❌ OpenAI API Error:', err.message);
    res.status(500).json({ reply: 'Serverfout. Controleer API-sleutel of limiet.' });
  }
});

// Healthcheck
app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ BotMatic GPT webbot running on http://localhost:${PORT}`));