import { getChat, updateChatAfterOutbound } from "../services/chatService.js";
import { listMessages, createMessage } from "../services/messageService.js";
import { sendWhatsAppTextMessage } from "../services/metaWhatsAppService.js";
import db from "../db/index.js";
import { httpError } from "../utils/httpError.js";

function getCompany(companyId) {
  return db.prepare("SELECT * FROM companies WHERE id = ?").get(companyId);
}

export function getChatMessages(req, res, next) {
  try {
    const chat = getChat(req.auth.user.companyId, req.params.id);
    if (!chat) throw httpError(404, "Chat not found");
    const messages = listMessages(req.auth.user.companyId, chat.id);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function postChatMessage(req, res, next) {
  try {
    const chat = getChat(req.auth.user.companyId, req.params.id);
    if (!chat) throw httpError(404, "Chat not found");

    const text = String(req.body?.text || "").trim();
    if (!text) throw httpError(400, "Message text is required");

    const company = getCompany(req.auth.user.companyId);
    const sendResult = await sendWhatsAppTextMessage({
      accessToken: company.access_token,
      phoneNumberId: company.phone_number_id,
      to: chat.customerPhone,
      text,
    });

    const message = createMessage({
      chatId: chat.id,
      companyId: req.auth.user.companyId,
      senderType: "operator",
      senderName: req.auth.user.name,
      text,
      whatsappMessageId: sendResult?.messages?.[0]?.id || null,
    });

    updateChatAfterOutbound(
      req.auth.user.companyId,
      chat.id,
      text.slice(0, 160)
    );

    res.status(201).json({
      message: {
        id: message.id,
        chatId: message.chat_id,
        companyId: message.company_id,
        senderType: message.sender_type,
        senderName: message.sender_name,
        text: message.text,
        whatsappMessageId: message.whatsapp_message_id,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}
