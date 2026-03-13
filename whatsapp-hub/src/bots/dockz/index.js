import { handleIncoming as processMessage } from './handler.js';
import { initNotariesSchema } from "./db.js";
import "./notaryDbInstance.js";

// Initialize DB schema on load
initNotariesSchema();

export async function handleIncoming({ tenant, message }) {
    console.log('🔵 DOCKZ BOT: Received message', { from: message.from, text: message.text });

    // The router.js already parses the message into { from, text, ... }
    // So we can simply pass it to our logic handler.

    try {
        if (!message.from || !message.text) {
            console.warn('⚠️ DOCKZ BOT: Missing from/text in message', message);
            return { messages: [] };
        }

        await processMessage(message.from, message.text);

    } catch (e) {
        console.error('❌ Dockz bot error:', e.message);
        // We could also notify Telegram admin here if needed, 
        // but helpers.js already does it for internal logic errors.
    }

    return { messages: [] };
}
