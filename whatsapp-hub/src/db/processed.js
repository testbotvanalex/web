// src/db/processed.js
import { db } from "./db.js";

const stmts = {
    check: db.prepare("SELECT 1 FROM processed_messages WHERE message_id = ?"),
    insert: db.prepare("INSERT OR IGNORE INTO processed_messages (message_id, phone_number_id) VALUES (?, ?)"),
    cleanup: db.prepare("DELETE FROM processed_messages WHERE processed_at < datetime('now', '-24 hours')"),
};

/**
 * Check if message was already processed
 */
export function isProcessed(messageId) {
    return !!stmts.check.get(messageId);
}

/**
 * Mark message as processed
 */
export function markProcessed(messageId, phoneNumberId) {
    stmts.insert.run(messageId, phoneNumberId);
}

/**
 * Cleanup old entries (run periodically)
 */
export function cleanupOld() {
    const result = stmts.cleanup.run();
    if (result.changes > 0) {
        console.log(`🧹 Cleaned up ${result.changes} old processed messages`);
    }
}

// Cleanup every hour
setInterval(cleanupOld, 60 * 60 * 1000);
