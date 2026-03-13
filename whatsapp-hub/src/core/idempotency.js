// src/core/idempotency.js
import { isProcessed, markProcessed } from "../db/processed.js";

/**
 * Check if message should be processed
 * Returns true if message is new, false if duplicate
 */
export function shouldProcess(messageId, phoneNumberId) {
    if (!messageId) return true; // Allow if no ID (shouldn't happen)

    if (isProcessed(messageId)) {
        console.log(`🔄 Duplicate message skipped: ${messageId}`);
        return false;
    }

    markProcessed(messageId, phoneNumberId);
    return true;
}
