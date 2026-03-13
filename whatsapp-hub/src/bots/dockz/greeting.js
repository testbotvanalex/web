import { sendWhatsAppMessage, sendInteractiveButtons } from "../utils/sendMessage.js";

export async function sendGreeting(to, t) {
  await sendWhatsAppMessage(
    to,
    "Я помогу вам со снятием арестов 👋\n\nВыберите действие:"
  );

  await sendInteractiveButtons(to, "Меню:", [
    { id: "scenario_1", title: "📄 Заявление ЧСИ" },
    { id: "scenario_2", title: "📄 Возражение" },
    { id: "operator", title: "👤 Оператор" },
  ]);
}