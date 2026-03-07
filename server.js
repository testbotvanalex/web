// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 📁 Раздаём всё из папки public
app.use(express.static(path.join(__dirname, "public")));

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
