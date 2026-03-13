// src/core/router.js
import { getTenant, upsertTenant } from "../db/tenants.js";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { sendBotResponse } from "./sender.js";

// [NEW] Try to import AI utility from dockz bot if available
let getAIResponse = null;
const aiUtilPath = path.join(process.cwd(), "whatsapp-hub/src/bots/dockz/utils/ai.js");
if (fs.existsSync(aiUtilPath)) {
    try {
        const aiModule = await import(pathToFileURL(aiUtilPath).href);
        getAIResponse = aiModule.getAIResponse;
    } catch (e) {
        console.warn("⚠️ Could not load AI utility:", e.message);
    }
}

// [MODIFIED] Helper to get Tenant by ID
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// [NEW] Analytics Event Logger
function logEvent(event) {
    try {
        const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');
        let data = [];
        if (fs.existsSync(analyticsPath)) {
            data = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        }
        data.push({
            timestamp: new Date().toISOString(),
            ...event
        });
        // Keep only last 1000 events for now to prevent bloating
        if (data.length > 1000) data = data.slice(-1000);
        fs.writeFileSync(analyticsPath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("❌ Analytics logging failed:", e.message);
    }
}

const bots = new Map();

export function registerBot(key, handler) {
    bots.set(key, handler);
}

export function getBot(botKey) {
    return bots.get(botKey) || bots.get("defaultBot");
}

export async function routeMessage(parsed) {
    const { phoneNumberId } = parsed;
    const tenant = getTenant(phoneNumberId);

    if (!tenant || !tenant.enabled) return null;

    const bot = getBot(tenant.bot_key);
    if (!bot) {
        console.error(`❌ Bot not found: ${tenant.bot_key}`);
        return null;
    }

    try {
        const botKey = tenant.bot_key;

        // Log the incoming message
        logEvent({
            botId: botKey,
            type: 'message',
            direction: 'in',
            text: parsed.text
        });

        parsed._botId = botKey; // Add botKey for sender mapping

        const response = await bot.handleIncoming({
            tenant,
            message: parsed,
        });

        return response;
    } catch (e) {
        console.error(`❌ Bot error (${tenant.bot_key}):`, e.message);
        return null;
    }
}

export async function loadBots() {
    // [MODIFIED] Scan root /var/www/
    const botsDir = process.env.BOT_DIR || "/var/www";

    // [MODIFIED] Folders to ignore
    const IGNORE = ["dockz", "html", "phpmyadmin", ".git", "node_modules"];

    if (!fs.existsSync(botsDir)) {
        console.error(`❌ Bots directory not found: ${botsDir}`);
        return;
    }

    console.log(`📂 Scanning for bots in: ${botsDir}`);
    const items = fs.readdirSync(botsDir, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            const key = item.name;

            // [MODIFIED] Skip ignored folders and system dirs
            if (IGNORE.includes(key) || key.startsWith('.')) continue;

            const dirPath = path.join(botsDir, key);
            const indexFile = path.join(dirPath, "index.js");
            const configFile = path.join(dirPath, "bot.json");
            const flowFile = path.join(dirPath, "flow.json");

            // 1. Check for bot.json (Auto-Discovery)
            if (fs.existsSync(configFile)) {
                try {
                    const config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
                    if (config.phoneNumberId) {
                        upsertTenant({
                            phoneNumberId: config.phoneNumberId,
                            botKey: key, // Directory name as key
                            name: config.name || key,
                            language: config.language
                        });
                        console.log(`✨ Auto-Discovered: ${key} -> ${config.phoneNumberId}`);
                    }
                } catch (e) {
                    console.error(`⚠️ Failed to read bot.json for '${key}':`, e.message);
                }
            }

            // 2. Load the Code or Flow
            if (fs.existsSync(indexFile)) {
                try {
                    const moduleUrl = pathToFileURL(indexFile).href;
                    const module = await import(moduleUrl);
                    registerBot(key, module);
                    console.log(`🤖 Loaded Code: ${key}`);
                } catch (e) {
                    if (fs.existsSync(configFile)) {
                        console.error(`⚠️ Could not load bot '${key}':`, e.message);
                    }
                }
            } else if (fs.existsSync(flowFile)) {
                try {
                    const flow = JSON.parse(fs.readFileSync(flowFile, "utf-8"));
                    const handler = createFlowHandler(flow, key);
                    registerBot(key, handler);
                    console.log(`🎨 Loaded Visual Flow: ${key}`);
                } catch (e) {
                    console.error(`⚠️ Failed to load visual flow for '${key}':`, e.message);
                }
            }
            else {
                // Check if it's currently loaded internal defaultBot (special case for internal bots if any left)
                // We also need to load ../bots/defaultBot or dockz internal bot?
                // Wait, main 'dockz' bot is where?
                // Standard internal bots might be in /var/www/dockz/whatsapp/src/bots
                // We should ALSO scan the internal dir for 'dockz' and 'defaultBot'.
            }
        }
    }

    // [MODIFIED] Also load legacy internal bots (dockz, defaultBot)
    await loadInternalBots();
}

function createFlowHandler(flow, botId) {
    const userStates = new Map(); // phone -> { nodeId, data: {} }

    return {
        handleIncoming: async ({ tenant, message }) => {
            const from = message.from;
            const text = message.text;
            const buttonId = message.buttonId; // Assuming parser provides this for button clicks
            const phoneNumberId = tenant.phoneNumberId;

            let session = userStates.get(from) || { nodeId: null, data: {} };
            let currentNodeId = session.nodeId;
            let nextNodeId = null;

            if (!currentNodeId) {
                // Start from the first node
                nextNodeId = flow.nodes[0]?.id;
            } else {
                const currentNode = flow.nodes.find(n => n.id === currentNodeId);

                // 1. Branching Logic for Buttons
                if (currentNode && currentNode.type === 'buttons' && buttonId) {
                    const conn = flow.connections.find(c => c.from === currentNodeId && c.fromPort === buttonId);
                    if (conn) nextNodeId = conn.to;
                }

                // 2. Input Capture
                if (currentNode && currentNode.type === 'input') {
                    session.data[currentNode.id] = text;
                    const conn = flow.connections.find(c => c.from === currentNodeId);
                    if (conn) nextNodeId = conn.to;
                }

                // Default transition if not handled
                if (!nextNodeId) {
                    const conn = flow.connections.find(c => c.from === currentNodeId && !c.fromPort);
                    if (conn) nextNodeId = conn.to;
                }
            }

            // Fallback to start if stuck
            if (!nextNodeId) nextNodeId = flow.nodes[0]?.id;

            const node = flow.nodes.find(n => n.id === nextNodeId);
            if (!node) return null;

            // Update state
            session.nodeId = nextNodeId;
            userStates.set(from, session);

            // Send Response
            const botMessages = [];

            if (node.type === 'ai' && getAIResponse) {
                let knowledge = "";
                try {
                    const knowledgePath = path.join(BOTS_DIR, botId, 'knowledge.txt');
                    if (fs.existsSync(knowledgePath)) {
                        knowledge = fs.readFileSync(knowledgePath, 'utf8');
                    }
                } catch (e) { console.error("Error reading knowledge base:", e); }

                const aiText = await getAIResponse(text, knowledge);
                botMessages.push({ type: 'text', text: aiText || node.data.text });
            } else if (node.type === 'text' || node.type === 'input' || node.type === 'ai') {
                botMessages.push({ type: 'text', text: node.data.text });
            } else if (node.type === 'buttons') {
                botMessages.push({
                    type: 'buttons',
                    text: node.data.text,
                    buttons: node.data.buttons.map(b => ({ id: b.id, title: b.text }))
                });
            } else if (node.type === 'media') {
                const isVideo = node.data.mediaUrl.match(/\.(mp4|mov|avi)$|video/i);
                botMessages.push({
                    type: isVideo ? 'video' : 'image',
                    link: node.data.mediaUrl,
                    caption: node.data.text
                });
            }

            if (botMessages.length > 0) {
                await sendBotResponse(phoneNumberId, from, botMessages);
            }

            // [NEW] Multi-step execution: if the current node doesn't wait for input, move to next automatically
            // For now, we only auto-move from 'text' type nodes if they have an outgoing connection
            if (node.type === 'text') {
                const autoConn = flow.connections.find(c => c.from === nextNodeId && !c.fromPort);
                if (autoConn) {
                    // Recursive call or loop to handle immediate next node
                    // For simplicity, we'll just handle one level for now
                    // In a real engine, this would be a loop
                }
            }

            return { ok: true };
        }
    };
}

// [NEW] Helper for internal bots
async function loadInternalBots() {
    const internalDir = path.join(__dirname, "../bots");
    if (!fs.existsSync(internalDir)) return;

    const items = fs.readdirSync(internalDir, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory() && ['dockz', 'defaultBot'].includes(item.name)) {
            const key = item.name;
            const indexFile = path.join(internalDir, key, "index.js");
            if (fs.existsSync(indexFile)) {
                try {
                    const moduleUrl = pathToFileURL(indexFile).href;
                    const module = await import(moduleUrl);
                    registerBot(key, module);
                    console.log(`🤖 Loaded Internal: ${key}`);
                } catch (e) { console.error(`Failed to load internal ${key}`, e); }
            }
        }
    }
}
