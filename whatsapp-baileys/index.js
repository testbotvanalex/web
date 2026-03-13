import express from 'express';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

process.on('uncaughtException', (err) => {
    console.error('❌ CRITICAL: Uncaught Exception:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 3300;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3200/auth/api/whatsapp/webhook';

// Store active WhatsApp sockets
const activeSockets = new Map();
// Store currently generating QR codes
const pendingQRCodes = new Map();
// Prevent duplicate initializations
const connectingSockets = new Set();

// Initialize auth directory
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Logger
const logger = pino({ level: 'silent' });

/**
 * Initializes a new Baileys socket for a specific botId
 */
async function startWhatsAppSession(botId) {
    if (connectingSockets.has(botId)) return;
    connectingSockets.add(botId);

    const sessionDir = path.join(SESSIONS_DIR, botId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[${botId}] using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: logger,
        browser: Browsers.macOS('Desktop'),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Store latest QR code for frontend to pull
            console.log(`[${botId}] New QR Code generated.`);
            try {
                const qrImage = await QRCode.toDataURL(qr);
                pendingQRCodes.set(botId, qrImage);
            } catch (e) {
                console.error(`[${botId}] Error generating QR image:`, e);
            }
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            const isInvalidSession = reason === DisconnectReason.loggedOut || reason === 405 || reason === 440;
            console.log(`[${botId}] Connection closed. Reason: ${reason}. Invalid session? ${isInvalidSession}`);

            pendingQRCodes.delete(botId);
            activeSockets.delete(botId);
            connectingSockets.delete(botId);

            if (isInvalidSession) {
                console.log(`[${botId}] Session invalid (Reason: ${reason}). Scheduling cleanup...`);
                setTimeout(() => {
                    try {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                        fs.mkdirSync(sessionDir, { recursive: true });
                        console.log(`[${botId}] Session reset complete for ${botId}.`);
                    } catch (err) {
                        console.error(`[${botId}] Cleanup error:`, err.message);
                    }
                }, 2000);
            } else {
                // Reconnect on drops
                console.log(`[${botId}] Reconnecting...`);
                setTimeout(() => startWhatsAppSession(botId), 5000);
            }
        } else if (connection === 'open') {
            console.log(`[${botId}] 🟢 Connected successfully!`);
            pendingQRCodes.delete(botId);
            connectingSockets.delete(botId);
            activeSockets.set(botId, sock);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue; // Skip own messages

            const senderId = msg.key.remoteJid;
            // Extract pure phone number from ID (e.g. 123456@s.whatsapp.net -> 123456)
            const senderPhone = senderId.split('@')[0];

            const body = msg.message.conversation
                || msg.message.extendedTextMessage?.text
                || msg.message.buttonsResponseMessage?.selectedButtonId
                || msg.message.listResponseMessage?.singleSelectReply?.selectedRowId
                || msg.message.templateButtonReplyMessage?.selectedId
                || "";

            const payload = {
                object: 'whatsapp_business_account',
                entry: [{
                    id: botId,
                    changes: [{
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: senderPhone,
                                phone_number_id: botId,
                            },
                            contacts: [{
                                profile: { name: msg.pushName || 'Unknown' },
                                wa_id: senderPhone,
                            }],
                            messages: [
                                {
                                    from: senderPhone,
                                    id: msg.key.id,
                                    timestamp: Math.floor(msg.messageTimestamp),
                                    text: {
                                        body: body,
                                    },
                                    type: body ? 'text' : 'unknown',
                                }
                            ],
                        },
                        field: 'messages',
                    }]
                }]
            };

            console.log(`[${botId}] Received message from ${senderPhone}. Body: "${body || "[EMPTY/OTHER]"}"`);
            console.log(`[${botId}] RAW MSG TYPE:`, Object.keys(msg.message).join(', '));
            if (!body) console.log(`[${botId}] DEBUG RAW:`, JSON.stringify(msg.message, null, 2));

            // Forward to BotMatic Webhook using official Cloud API structure
            console.log(`[${botId}] Forwarding to ${WEBHOOK_URL}...`);
            try {
                const response = await axios.post(WEBHOOK_URL, payload);
                console.log(`[${botId}] Webhook forwarded! Status: ${response.status}`);
            } catch (err) {
                console.error(`[${botId}] Failed to forward webhook to ${WEBHOOK_URL}:`, err.message);
                if (err.response) {
                    console.error(`[${botId}] Webhook response data:`, JSON.stringify(err.response.data));
                }
            }
        }
    });

    // activeSockets.set(botId, sock); // Removed: set only on 'open' connection event
    return sock;
}

/**
 * Restore all existing sessions on startup
 */
async function restoreSessions() {
    const dirs = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true });
    for (const dir of dirs) {
        if (dir.isDirectory()) {
            const credsPath = path.join(SESSIONS_DIR, dir.name, 'creds.json');
            if (fs.existsSync(credsPath)) {
                console.log(`🔄 Restoring session: ${dir.name}`);
                await startWhatsAppSession(dir.name).catch(err => {
                    console.error(`[${dir.name}] Failed to restore:`, err.message);
                });
            } else {
                console.log(`🧹 Cleaning up invalid session directory: ${dir.name}`);
                fs.rmSync(path.join(SESSIONS_DIR, dir.name), { recursive: true, force: true });
            }
        }
    }
}

// ---------------------------------------------------------
// REST API
// ---------------------------------------------------------

/**
 * Endpoint for frontend to trigger connection or get QR
 */
app.get('/api/whatsapp/connect', async (req, res) => {
    const { botId } = req.query;
    if (!botId) return res.status(400).json({ error: 'botId is required' });

    // If already connected
    if (activeSockets.has(botId) && !pendingQRCodes.has(botId)) {
        return res.json({ status: 'connected' });
    }

    // If QR code is ready
    if (pendingQRCodes.has(botId)) {
        return res.json({ status: 'pending', qr: pendingQRCodes.get(botId) });
    }

    // Start initialization
    if (!connectingSockets.has(botId)) {
        console.log(`[${botId}] Initializing new connection flow...`);
        startWhatsAppSession(botId).catch(err => {
            console.error(`[${botId}] Session init failed:`, err.message);
            connectingSockets.delete(botId);
        });
    }
    return res.json({ status: 'initializing' });
});

/**
 * Endpoint for BotMatic Webhook router to SEND messages via Baileys
 */
app.post('/api/whatsapp/send', async (req, res) => {
    const { botId, to, text } = req.body;
    if (!botId || !to || !text) {
        return res.status(400).json({ error: 'botId, to, and text are required' });
    }

    const sock = activeSockets.get(botId);
    if (!sock) {
        return res.status(404).json({ error: `Socket not connected for botId: ${botId}` });
    }

    try {
        const jid = `${to}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text });
        console.log(`[${botId}] Sent message to ${to}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`[${botId}] Failed to send message:`, error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Endpoint to logout/disconnect
 */
app.delete('/api/whatsapp/disconnect', async (req, res) => {
    const { botId } = req.query;
    if (!botId) return res.status(400).json({ error: 'botId is required' });

    console.log(`[${botId}] Disconnecting and clearing session...`);
    const sock = activeSockets.get(botId);

    if (sock) {
        try {
            await sock.logout();
        } catch (e) {
            try { sock.end(); } catch (err) { }
        }
    }

    // Aggressively clear everything from disk and memory
    const sessionDir = path.join(SESSIONS_DIR, botId);
    try {
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log(`[${botId}] Session directory deleted: ${sessionDir}`);
        }
    } catch (err) {
        console.error(`[${botId}] Failed to delete session directory:`, err.message);
    }

    activeSockets.delete(botId);
    pendingQRCodes.delete(botId);

    res.json({ success: true, message: 'Session cleared aggressively' });
});

// Start Server
app.listen(PORT, async () => {
    console.log(`🚀 Baileys WhatsApp Multiplexer running on port ${PORT}`);
    console.log(`➡️ Forwarding webhooks to: ${WEBHOOK_URL}`);
    await restoreSessions();
});
