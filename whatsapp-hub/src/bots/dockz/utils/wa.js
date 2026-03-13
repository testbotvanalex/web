import axios from "axios";

export async function sendWhatsAppText({ token, phoneNumberId, waId, text }) {
  return axios.post(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: waId,
      type: "text",
      text: { body: text },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function sendWhatsAppDocument({ token, phoneNumberId, waId, url, filename }) {
  return axios.post(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: waId,
      type: "document",
      document: { link: url, filename },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function sendWhatsAppButtons({ token, phoneNumberId, waId, header, body, buttons }) {
  return axios.post(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: waId,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        header: { type: "text", text: header },
        action: {
          buttons: buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}