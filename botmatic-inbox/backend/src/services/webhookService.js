import { createMessage } from "./messageService.js";
import {
  findOrCreateChat,
  updateChatAfterInbound,
  updateChatAfterOutbound,
} from "./chatService.js";
import { findCompanyByPhoneNumberId } from "./companyService.js";
import { sendWhatsAppTextMessage } from "./metaWhatsAppService.js";

function safePreview(text) {
  return (text || "").slice(0, 160);
}

export async function processWebhookPayload(payload) {
  if (payload.object !== "whatsapp_business_account") {
    return { processed: 0 };
  }

  let processed = 0;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      const metadata = value?.metadata;
      const phoneNumberId = metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      const company = findCompanyByPhoneNumberId(phoneNumberId);
      if (!company) continue;

      for (const contact of value?.contacts || []) {
        const customerPhone = contact.wa_id;
        if (!customerPhone) continue;

        const customerName = contact.profile?.name || contact.wa_id;
        const chat = findOrCreateChat(company.id, customerPhone, customerName);
        const inboundMessages = (value.messages || []).filter(
          (message) => message.from === customerPhone
        );

        for (const inbound of inboundMessages) {
          const text = inbound.text?.body || "[unsupported message type]";
          createMessage({
            chatId: chat.id,
            companyId: company.id,
            senderType: "customer",
            senderName: customerName,
            text,
            whatsappMessageId: inbound.id || null,
          });

          updateChatAfterInbound(company.id, chat.id, safePreview(text));
          processed += 1;

          if (chat.mode === "bot") {
            const autoReply = `BotMatic auto-reply: we received "${text}".`;
            const sendResult = await sendWhatsAppTextMessage({
              accessToken: company.access_token,
              phoneNumberId: company.phone_number_id,
              to: customerPhone,
              text: autoReply,
            });

            createMessage({
              chatId: chat.id,
              companyId: company.id,
              senderType: "bot",
              senderName: "BotMatic",
              text: autoReply,
              whatsappMessageId: sendResult?.messages?.[0]?.id || null,
            });

            updateChatAfterOutbound(company.id, chat.id, safePreview(autoReply));
          }
        }
      }
    }
  }

  return { processed };
}
