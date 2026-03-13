import { randomUUID } from "node:crypto";
import db from "../db/index.js";
import { nowIso } from "../utils/time.js";

function mapChatRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    companyId: row.company_id,
    customerPhone: row.customer_phone,
    customerName: row.customer_name,
    mode: row.mode,
    status: row.status,
    unreadCount: row.unread_count,
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listChats(companyId, filter = "all") {
  let sql = `
    SELECT *
    FROM chats
    WHERE company_id = ?
  `;
  const params = [companyId];

  if (filter === "open") sql += " AND status = 'open'";
  if (filter === "bot") sql += " AND mode = 'bot'";
  if (filter === "human") sql += " AND mode = 'human'";

  sql += " ORDER BY COALESCE(last_message_at, created_at) DESC";
  return db.prepare(sql).all(...params).map(mapChatRow);
}

export function getChat(companyId, chatId) {
  const row = db
    .prepare("SELECT * FROM chats WHERE company_id = ? AND id = ?")
    .get(companyId, chatId);
  return mapChatRow(row);
}

export function findOrCreateChat(companyId, customerPhone, customerName = null) {
  const existing = db
    .prepare(
      "SELECT * FROM chats WHERE company_id = ? AND customer_phone = ?"
    )
    .get(companyId, customerPhone);

  if (existing) {
    if (customerName && customerName !== existing.customer_name) {
      db.prepare(
        `UPDATE chats
         SET customer_name = ?, updated_at = ?
         WHERE id = ?`
      ).run(customerName, nowIso(), existing.id);
    }
    return getChat(companyId, existing.id);
  }

  const chatId = randomUUID();
  const timestamp = nowIso();

  db.prepare(
    `INSERT INTO chats (
      id, company_id, customer_phone, customer_name, mode, status,
      unread_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'bot', 'open', 0, ?, ?)`
  ).run(chatId, companyId, customerPhone, customerName, timestamp, timestamp);

  db.prepare(
    `INSERT INTO sessions (id, chat_id, company_id, mode, created_at, updated_at)
     VALUES (?, ?, ?, 'bot', ?, ?)`
  ).run(randomUUID(), chatId, companyId, timestamp, timestamp);

  return getChat(companyId, chatId);
}

export function updateChatAfterInbound(companyId, chatId, preview) {
  db.prepare(
    `UPDATE chats
     SET unread_count = unread_count + 1,
         last_message_preview = ?,
         last_message_at = ?,
         updated_at = ?
     WHERE company_id = ? AND id = ?`
  ).run(preview, nowIso(), nowIso(), companyId, chatId);
}

export function updateChatAfterOutbound(companyId, chatId, preview) {
  db.prepare(
    `UPDATE chats
     SET last_message_preview = ?,
         last_message_at = ?,
         updated_at = ?
     WHERE company_id = ? AND id = ?`
  ).run(preview, nowIso(), nowIso(), companyId, chatId);
}

export function resetUnread(companyId, chatId) {
  db.prepare(
    "UPDATE chats SET unread_count = 0, updated_at = ? WHERE company_id = ? AND id = ?"
  ).run(nowIso(), companyId, chatId);
}

export function takeoverChat(companyId, chatId, userId) {
  db.prepare(
    "UPDATE chats SET mode = 'human', updated_at = ? WHERE company_id = ? AND id = ?"
  ).run(nowIso(), companyId, chatId);

  db.prepare(
    `UPDATE sessions
     SET mode = 'human', assigned_user_id = ?, updated_at = ?
     WHERE company_id = ? AND chat_id = ?`
  ).run(userId, nowIso(), companyId, chatId);

  return getChat(companyId, chatId);
}

export function releaseChat(companyId, chatId) {
  db.prepare(
    "UPDATE chats SET mode = 'bot', updated_at = ? WHERE company_id = ? AND id = ?"
  ).run(nowIso(), companyId, chatId);

  db.prepare(
    `UPDATE sessions
     SET mode = 'bot', assigned_user_id = NULL, updated_at = ?
     WHERE company_id = ? AND chat_id = ?`
  ).run(nowIso(), companyId, chatId);

  return getChat(companyId, chatId);
}
