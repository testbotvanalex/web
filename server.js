// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 📁 Раздаём всё из папки public
app.use(express.static(path.join(__dirname, "public")));

// 📄 Все неизвестные пути отправляем на index.html (для SPA или обычного сайта)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ BotMatic webbot running on http://localhost:${PORT}`);
});