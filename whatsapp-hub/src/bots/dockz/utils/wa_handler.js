import { saveSession } from "./sessions.js";
import { sendWhatsAppText } from "./wa.js";

export async function handleIncomingMessage(msg, phoneNumberId) {
  const waId = msg.from;
  saveSession(waId);

  const text = msg.text?.body || "";

  if (text.toLowerCase() === "старт" || text.toLowerCase() === "start") {
    await sendWhatsAppText({
      token: process.env.WABA_TOKEN,
      phoneNumberId,
      waId,
      text: "Hello! I am ready to generate a document. Please send the form.",
    });
    return;
  }

  await sendWhatsAppText({
    token: process.env.WABA_TOKEN,
    phoneNumberId,
    waId,
    text: "Received 👍",
  });
}