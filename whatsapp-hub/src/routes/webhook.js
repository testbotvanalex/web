import express from "express";
import axios from "axios";
import { parseIncoming } from "../core/parser.js";
import { routeMessage } from "../core/router.js";
import { shouldProcess } from "../core/idempotency.js";
import { sendBotResponse, markAsRead } from "../core/sender.js";

const router = express.Router();

router.get("/", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log(`🔍 Verify: mode=${mode}, token=${token}, expected=${process.env.VERIFY_TOKEN}`);

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
        console.log("✅ Webhook verified");
        return res.status(200).send(challenge);
    }

    console.warn("⚠️ Webhook verification failed");
    return res.sendStatus(403);
});

router.post("/", async (req, res) => {
    res.sendStatus(200);
    try {
        // --- PROXY LOGIC FOR INSTAGRAM ---
        if (req.body.object === 'instagram') {
            console.log("📸 IG Webhook -> Proxying to 3200...");
            try {
                await axios.post("http://127.0.0.1:3200/webhook/instagram", req.body);
            } catch (err) {
                console.error("❌ IG Proxy Failed:", err.message);
            }
            return;
        }

        // Mirror every incoming WhatsApp webhook into BotMatic unified inbox.
        try {
            await axios.post("http://127.0.0.1:3200/auth/api/whatsapp/webhook", req.body);
        } catch (err) {
            console.error("❌ BotMatic WhatsApp mirror failed:", err.message);
        }

        const parsed = parseIncoming(req.body);

        // --- PROXY LOGIC FOR AUTOSCOUT ---
        const autoScoutItem = parsed.find(i => i.phoneNumberId === "869710229554065");
        if (autoScoutItem) {
            console.log("🔀 Proxying to AutoScout (3010)...");
            try {
                await axios.post("http://127.0.0.1:3010/webhook", req.body);
            } catch (err) {
                console.error("❌ AutoScout Proxy Failed:", err.message);
            }
            return;
        }
        // ---------------------------------

        for (const item of parsed) {
            if (item.type === "status") continue;
            if (!shouldProcess(item.messageId, item.phoneNumberId)) continue;

            console.log(`📩 ${item.from} → ${item.phoneNumberId}: ${item.text || item.type}`);

            markAsRead(item.phoneNumberId, item.messageId).catch(() => { });

            const response = await routeMessage(item);
            if (response?.messages?.length) {
                await sendBotResponse(item.phoneNumberId, item.from, response.messages);
            }
        }
    } catch (e) {
        console.error("❌ Webhook error:", e.message);
    }
});

export default router;
