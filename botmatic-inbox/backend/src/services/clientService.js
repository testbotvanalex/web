import db from "../db/index.js";

function mapClientRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    chatId: row.chat_id,
    companyId: row.company_id,
    name: row.name,
    phone: row.phone,
    status: row.status,
    mode: row.mode,
    unreadCount: row.unread_count,
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listClients(companyId) {
  return db
    .prepare(
      `SELECT
         customer_phone AS id,
         id AS chat_id,
         company_id,
         COALESCE(NULLIF(TRIM(customer_name), ''), customer_phone) AS name,
         customer_phone AS phone,
         status,
         mode,
         unread_count,
         last_message_preview,
         last_message_at,
         created_at,
         updated_at
       FROM chats
       WHERE company_id = ?
       ORDER BY COALESCE(last_message_at, created_at) DESC`
    )
    .all(companyId)
    .map(mapClientRow);
}
