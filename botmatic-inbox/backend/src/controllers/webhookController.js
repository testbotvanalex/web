import { processWebhookPayload } from "../services/webhookService.js";

export function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
}

export async function receiveWebhook(req, res, next) {
  try {
    const result = await processWebhookPayload(req.body);
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
}
