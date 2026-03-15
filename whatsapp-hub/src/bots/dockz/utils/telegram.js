// backend/src/utils/telegram.js
import axios from "axios";

// split long messages to fit Telegram limit (4096)
function splitTelegramText(text, chunkSize = 3800) {
  const s = String(text || "");
  const chunks = [];
  for (let i = 0; i < s.length; i += chunkSize) chunks.push(s.slice(i, i + chunkSize));
  return chunks.length ? chunks : [""];
}

function getChatIds() {
  // поддержка: TELEGRAM_CHAT_IDS="-100...,6467..." или TELEGRAM_CHAT_ID="..."
  const idsRaw =
    process.env.TELEGRAM_CHAT_IDS ||
    process.env.TELEGRAM_CHAT_ID ||
    "";

  return idsRaw
    .split(",")
    .map((x) => String(x).trim())
    .filter(Boolean);
}

export async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getChatIds();

  if (!token || chatIds.length === 0) {
    console.log("TG: skip (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID(S) not set)");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const chunks = splitTelegramText(text);

  for (const chatId of chatIds) {
    for (const chunk of chunks) {
      try {
        await axios.post(
          url,
          { chat_id: chatId, text: chunk, parse_mode: 'HTML', disable_web_page_preview: true },
          { timeout: 15000 }
        );
      } catch (e) {
        const data = e?.response?.data;
        console.log("TG: send failed:", data || e?.message || e);
      }
    }
  }
}