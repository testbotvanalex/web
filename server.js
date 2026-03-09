// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env in dev
if (process.env.NODE_ENV !== "production") {
  try {
    const { readFileSync } = await import("fs");
    const env = readFileSync(new URL("./.env", import.meta.url), "utf8");
    env.split("\n").forEach(line => {
      const [k, ...v] = line.split("=");
      if (k && v.length) process.env[k.trim()] = v.join("=").trim();
    });
  } catch {}
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(express.json());

// 📁 Раздаём всё из папки public
app.use(express.static(path.join(__dirname, "public")));

// 🤖 AI chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });

  try {
    const messages = [
      {
        role: "system",
        content: `Jij bent de vriendelijke assistent van BotMatic — een Belgisch bedrijf dat chatbots maakt voor KMO's via WhatsApp, Instagram en Messenger.
Beantwoord ALLEEN vragen over BotMatic, chatbots, automatisering van klantgesprekken en gerelateerde onderwerpen.
Bij vragen over iets anders: zeg vriendelijk dat je alleen over BotMatic kunt helpen.
Antwoorden: max 2-3 korte zinnen. Gebruik soms emoji. Eindig gesprekken altijd met een uitnodiging voor een WhatsApp demo.
Prijzen: Basis €149/maand, Groei €249/maand, Pro €399/maand. Geen setupkosten. Maandelijks opzegbaar.
Kanalen: WhatsApp, Instagram, Facebook Messenger.
Talen: NL en FR voor Belgische KMO's.`
      },
      ...history.slice(-6),
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.status(500).json({ reply: "Sorry, even een technisch probleem. Probeer het later opnieuw of stuur ons een WhatsApp! 💬" });
  }
});

// 📄 Публичные legal-страницы с чистыми URL
app.get(["/privacy-policy", "/privacy-policy/"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy-policy.html"));
});

app.get(["/terms", "/terms/"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "terms.html"));
});

app.get(["/data-deletion", "/data-deletion/"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "data-deletion.html"));
});

// 📄 404 для всех неизвестных путей
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ BotMatic webbot running on http://localhost:${PORT}`);
});
