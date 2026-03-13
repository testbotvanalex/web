// src/core/parser.js

/**
 * Parse incoming Meta webhook payload
 * Extracts: phone_number_id, message, sender info
 */
export function parseIncoming(body) {
    const results = [];

    const entry = body?.entry?.[0];
    if (!entry) return results;

    const changes = entry.changes || [];

    for (const change of changes) {
        if (change.field !== "messages") continue;

        const value = change.value || {};
        const phoneNumberId = value.metadata?.phone_number_id;
        const displayPhone = value.metadata?.display_phone_number;

        if (!phoneNumberId) continue;

        // Process messages
        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (const msg of messages) {
            const contact = contacts.find(c => c.wa_id === msg.from) || {};

            results.push({
                phoneNumberId,
                displayPhone,
                messageId: msg.id,
                from: msg.from,
                timestamp: msg.timestamp,
                type: msg.type,

                // Text content
                text: msg.text?.body || msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || null,

                // Interactive data
                buttonId: msg.interactive?.button_reply?.id || null,
                buttonTitle: msg.interactive?.button_reply?.title || null,
                listId: msg.interactive?.list_reply?.id || null,
                listTitle: msg.interactive?.list_reply?.title || null,

                // Contact info
                profileName: contact.profile?.name || null,

                // Raw data for advanced use
                raw: msg,
            });
        }

        // Process statuses (optional, for delivery reports)
        const statuses = value.statuses || [];
        for (const status of statuses) {
            results.push({
                phoneNumberId,
                displayPhone,
                type: "status",
                statusType: status.status, // sent, delivered, read
                messageId: status.id,
                recipientId: status.recipient_id,
                timestamp: status.timestamp,
            });
        }
    }

    return results;
}
