// backend/src/webhook/adminCommands.js
import { getDb } from "./db.js";
import { getUserStats, resetUser, setStep } from "./memory/userState.js";

export async function handleAdminCommands({ text, from, sendWhatsAppMessage, sendLanguageMenu }) {
    if (!text || typeof text !== "string") return false;

    // !broadcast some text
    if (text.startsWith("!broadcast ")) {
        const msgBody = text.replace("!broadcast ", "").trim();
        if (!msgBody) return true;

        // TODO: ограничь по номеру если надо
        // if (from !== "77771234567") return true;

        const db = await getDb();
        const rows = await db.all("SELECT DISTINCT phone FROM sessions");

        await sendWhatsAppMessage(from, `🚀 Начинаю рассылку для ${rows.length} пользователей...`);

        let count = 0;
        for (const row of rows) {
            if (!row?.phone) continue;
            if (row.phone === from) continue;

            try {
                await sendWhatsAppMessage(row.phone, msgBody);
                count++;
                await new Promise(r => setTimeout(r, 100));
            } catch (e) {
                console.error(`Broadcast fail for ${row.phone}`, e?.message || e);
            }
        }

        await sendWhatsAppMessage(from, `✅ Рассылка завершена. Отправлено: ${count}`);
        return true;
    }

    // !reset
    if (text === "!reset") {
        await resetUser(from);
        await setStep(from, "choose_lang");
        await sendLanguageMenu(from);
        return true;
    }

    // !stats
    if (text === "!stats") {
        const stats = await getUserStats();
        const rows = stats?.rows || [];
        let report = `📊 *Статистика (7 дней)*\nВсего юзеров: ${stats?.total ?? 0}\n\n`;

        if (rows.length === 0) {
            report += "Нет данных.";
        } else {
            for (const r of rows) {
                report += `• ${r.day}: ${r.count}\n`;
            }
        }

        await sendWhatsAppMessage(from, report);
        return true;
    }

    return false;
}