// src/core/sender.js
import axios from "axios";

const VERSION = process.env.API_VERSION || "v22.0";
const BASE_URL = `https://graph.facebook.com/${VERSION}`;

/**
 * Send message via WhatsApp Cloud API
 * @param {string} phoneNumberId - Sender's phone number ID
 * @param {string} to - Recipient's phone number
 * @param {object} message - Message payload
 */
async function sendToWhatsApp(phoneNumberId, payload) {
    const token = process.env.WHATSAPP_TOKEN;

    // [FIX] Detect if we should use local Baileys Hub (port 3300) instead of Cloud API
    if (!token || token === 'YOUR_WHATSAPP_TOKEN_HERE') {
        const botId = payload._botId || 'main'; // We'll pass botId in payload for Baileys mapping
        const text = payload.text?.body || payload.interactive?.body?.text || "Unsupported interactive message";

        try {
            console.log(`[Sender] Token missing, routing to local Baileys Hub for bot ${botId}`);
            const response = await axios.post('http://localhost:3300/api/whatsapp/send', {
                botId,
                to: payload.to,
                text
            });
            return response.data;
        } catch (e) {
            console.error("❌ Local Baileys Hub error:", e.response?.data || e.message);
            throw e;
        }
    }

    const url = `${BASE_URL}/${phoneNumberId}/messages`;
    try {
        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        return response.data;
    } catch (e) {
        console.error("❌ WhatsApp API error:", e.response?.data || e.message);
        throw e;
    }
}

/**
 * Send text message
 */
export async function sendText(phoneNumberId, to, text) {
    return sendToWhatsApp(phoneNumberId, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: text },
    });
}

/**
 * Send interactive buttons
 */
export async function sendButtons(phoneNumberId, to, bodyText, buttons) {
    return sendToWhatsApp(phoneNumberId, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
            type: "button",
            body: { text: bodyText },
            action: {
                buttons: buttons.map((btn, i) => ({
                    type: "reply",
                    reply: {
                        id: btn.id,
                        title: String(btn.title).slice(0, 20),
                    },
                })),
            },
        },
    });
}

/**
 * Send interactive list
 */
export async function sendList(phoneNumberId, to, bodyText, buttonText, sections) {
    return sendToWhatsApp(phoneNumberId, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
            type: "list",
            body: { text: bodyText },
            action: {
                button: buttonText,
                sections,
            },
        },
    });
}

/**
 * Send document
 */
export async function sendDocument(phoneNumberId, to, url, filename, caption = "") {
    return sendToWhatsApp(phoneNumberId, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: {
            link: url,
            filename,
            caption,
        },
    });
}

/**
 * Send video
 */
export async function sendVideo(phoneNumberId, to, url, caption = "") {
    return sendToWhatsApp(phoneNumberId, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "video",
        video: {
            link: url,
            caption,
        },
    });
}

/**
 * Mark message as read
 */
export async function markAsRead(phoneNumberId, messageId) {
    try {
        return await sendToWhatsApp(phoneNumberId, {
            messaging_product: "whatsapp",
            status: "read",
            message_id: messageId,
        });
    } catch (e) {
        // Ignore read receipt errors
        console.warn("⚠️ markAsRead failed:", e.message);
    }
}

/**
 * Process bot response and send messages
 */
export async function sendBotResponse(phoneNumberId, to, messages) {
    if (!messages || !Array.isArray(messages)) return;

    for (const msg of messages) {
        switch (msg.type) {
            case "text":
                await sendText(phoneNumberId, to, msg.text);
                break;
            case "buttons":
                await sendButtons(phoneNumberId, to, msg.text, msg.buttons);
                break;
            case "list":
                await sendList(phoneNumberId, to, msg.text, msg.buttonText, msg.sections);
                break;
            case "document":
                await sendDocument(phoneNumberId, to, msg.url, msg.filename, msg.caption);
                break;
            case "video":
                await sendVideo(phoneNumberId, to, msg.url, msg.caption);
                break;
            default:
                console.warn("Unknown message type:", msg.type);
        }

        // Small delay between messages
        await new Promise(r => setTimeout(r, 300));
    }
}
