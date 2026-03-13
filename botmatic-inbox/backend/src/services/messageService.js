import { randomUUID } from "node:crypto";
import db from "../db/index.js";

function mapMessageRow(row) {
  return {
    id: row.id,
    chatId: row.chat_id,
    companyId: row.company_id,
    senderType: row.sender_type,
    senderName: row.sender_name,
    text: row.text,
    whatsappMessageId: row.whatsapp_message_id,
    createdAt: row.created_at,
  };
}

export function listMessages(companyId, chatId) {
  return db
    .prepare(
      `SELECT *
       FROM messages
       WHERE company_id = ? AND chat_id = ?
       ORDER BY created_at ASC`
    )
    .all(companyId, chatId)
    .map(mapMessageRow);
}

export function createMessage({
  chatId,
  companyId,
  senderType,
  senderName,
  text,
  whatsappMessageId = null,
}) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO messages (
      id, chat_id, company_id, sender_type, sender_name, text, whatsapp_message_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, chatId, companyId, senderType, senderName, text, whatsappMessageId);

  return db
    .prepare("SELECT * FROM messages WHERE id = ?")
    .get(id);
}
