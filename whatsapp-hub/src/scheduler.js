// backend/src/webhook/scheduler.js
import cron from "node-cron";
import { getDb } from "./bots/dockz/db.js";
import { sendWhatsAppMessage, sendInteractiveButtons } from "./bots/dockz/utils/sendMessage.js";
import { TEXTS } from "./bots/dockz/texts.js";
import { OPERATOR_ID, NAV_MENU_ID } from "./bots/dockz/constants.js";
import { setStep } from "./bots/dockz/memory/userState.js";
import { sendTelegramMessage } from "./bots/dockz/utils/telegram.js";

// Helper to get translated texts
function getT(lang) {
    return TEXTS[lang] || TEXTS.ru;
}

// 1. Check for stale sessions every minute
export function startScheduler() {
    console.log("⏰ Scheduler started (1m check interval)");

    cron.schedule("* * * * *", async () => {
        try {
            checkReminders();
        } catch (e) {
            console.error("Scheduler Error:", e);
        }
    });
}

async function checkReminders() {
    const db = getDb();
    const T15M = 15 * 60 * 1000;
    const T1H = 60 * 60 * 1000;
    const T3H = 3 * 60 * 60 * 1000;
    const now = new Date();

    const users = db.prepare(`
    SELECT phone, step, data, updated_at, reminder_count, template, admin_alerted_at
    FROM sessions
    WHERE step IS NOT NULL
      AND step NOT IN ('main_menu', 'after_doc', 'consent_refused', 'doc_info')
      AND (
        (reminder_count = 0 AND updated_at < datetime('now', '-15 minutes')) OR
        (reminder_count = 1 AND updated_at < datetime('now', '-1 hour')) OR
        (reminder_count = 2 AND updated_at < datetime('now', '-3 hours'))
      )
    LIMIT 50
  `).all();

    function getReadableStep(step) {
        const stepMap = {
            consent: '1. Consent (GDPR)',
            consent_refused: '❌ Consent Refused',
            lang_selection: '0. Language Selection',
            main_menu: '🏠 Main Menu',
            more_docs_menu: '📂 More Documents Menu',
            operator_text: '👤 Writing to Operator',
            s1_video_choice: '🎥 Video Choice (Bailiff)',
            s1_bailiff_name: '📄 Bailiff: Name',
            s1_bailiff_address: '📄 Bailiff: Address',
            s1_bailiff_phone: '📄 Bailiff: Phone',
            s1_bailiff_email: '📄 Bailiff: Email',
            s1_case_number: '📄 Bailiff: Case Number',
            s1_case_date: '📄 Bailiff: Case Date',
            s1_client_full_name: '📄 Client: Name',
            s1_client_address: '📄 Client: Address',
            s1_iin: '📄 Client: IIN',
            s1_client_phone: '📄 Client: Phone',
            s1_client_email: '📄 Client: Email',
            s1_confirm: '✅ Bailiff: Confirm',
            s2_video_choice: '🎥 Video Choice (Objection)',
            s2_notary_choice: '⚖️ Notary Choice',
            s2_notary_search: '🔍 Notary Search',
            s2_notary_manual_name: '✍️ Manual Notary Entry',
            s2_notary_address: '⚖️ Notary Address',
            s2_notary_phone: '⚖️ Notary Phone',
            s2_notary_email: '⚖️ Notary Email',
            s2_creditor_name: '⚖️ Creditor Name',
            s2_client_full_name: '⚖️ Client: Name',
            s2_client_address: '⚖️ Client: Address',
            s2_iin: '⚖️ Client: IIN',
            s2_client_phone: '⚖️ Client: Phone',
            s2_debt_amount: '⚖️ Debt Amount',
            s2_client_email: '⚖️ Client: Email',
            s2_confirm: '✅ Objection: Confirm',
            s3_confirm: '✅ Notary: Confirm',
            after_doc: '🏁 Document Downloaded',
            after_question_text: '❓ Asking Question',
            after_feedback_text: '⭐ Writing Feedback',
            ux_greeting: '👋 Приветствие',
            doc_menu: '📋 Меню документов',
            doc_fill: '✍️ Заполнение документа',
            doc_confirm: '✅ Подтверждение документа',
            doc_edit: '✏️ Редактирование документа',
            doc_payment: '💳 Оплата',
            consent_check: '🔒 Проверка согласия',
            consent_entry: '🔒 Ввод согласия',
            contact_specialist: '📞 Связь со специалистом',
            after_delivery: '📬 После доставки',
            rate_menu: '⭐ Меню оценки',
            rate_thanks: '🙏 Спасибо за оценку',
            thanks_screen: '🏁 Экран благодарности',
        };
        return stepMap[step] || step;
    }

    for (const user of users) {
        const lastUpdate = new Date(user.updated_at + 'Z');
        const diff = now - lastUpdate;

        let data = {};
        try { data = JSON.parse(user.data); } catch (e) { }
        const lang = data.lang || 'ru';
        const t = getT(lang);

        const phone = user.phone;
        let nextCount = user.reminder_count;
        let msg = '';
        let buttons = [];

        const adminAlertedAt = user.admin_alerted_at ? new Date(user.admin_alerted_at + 'Z') : null;
        const shouldAlertAdmin = !adminAlertedAt || adminAlertedAt < lastUpdate;

        if (user.reminder_count === 0 && diff >= T15M) {
            msg = t.reminder_15m;
            buttons = [
                { id: OPERATOR_ID, title: t.btn_contact },
                { id: NAV_MENU_ID, title: t.btn_menu }
            ];
            nextCount = 1;

            if (shouldAlertAdmin) {
                try {
                    const stepName = getReadableStep(user.step);
                    await sendTelegramMessage(`⏳ <b>ЗАСТРЯЛ</b> (15 мин)
👤 +${phone}
📍 Шаг: ${stepName}`);
                    db.prepare(`
                        UPDATE sessions
                        SET admin_alerted_at = CURRENT_TIMESTAMP
                        WHERE phone = ?
                    `).run(phone);
                } catch (e) { }
            }
        } else if (user.reminder_count === 1 && diff >= T1H) {
            msg = t.reminder_1h;
            buttons = [
                { id: OPERATOR_ID, title: t.btn_contact },
                { id: NAV_MENU_ID, title: t.btn_menu }
            ];
            nextCount = 2;

            if (shouldAlertAdmin) {
                try {
                    const stepName = getReadableStep(user.step);
                    await sendTelegramMessage(`⚠️ <b>ЗАСТРЯЛ</b> (1 ч)
👤 +${phone}
📍 Шаг: ${stepName}`);
                    db.prepare(`
                        UPDATE sessions
                        SET admin_alerted_at = CURRENT_TIMESTAMP
                        WHERE phone = ?
                    `).run(phone);
                } catch (e) { }
            }
        } else if (user.reminder_count === 2 && diff >= T3H) {
            msg = t.reminder_3h;
            buttons = [{ id: NAV_MENU_ID, title: t.btn_menu }];
            nextCount = 3;

            if (shouldAlertAdmin) {
                try {
                    const stepName = getReadableStep(user.step);
                    await sendTelegramMessage(`🛑 <b>ЗАСТРЯЛ</b> (3 ч - Финал)
👤 +${phone}
📍 Шаг: ${stepName}`);
                    db.prepare(`
                        UPDATE sessions
                        SET admin_alerted_at = CURRENT_TIMESTAMP
                        WHERE phone = ?
                    `).run(phone);
                } catch (e) { }
            }
        }

        if (!msg) continue;

        console.log(`Sending reminder ${nextCount} to ${phone}`);
        try {
            if (buttons.length > 0) {
                await sendInteractiveButtons(phone, msg, buttons);
            } else {
                await sendWhatsAppMessage(phone, msg);
            }

            db.prepare(`
                UPDATE sessions
                SET reminder_count = ?, reminded_at = CURRENT_TIMESTAMP
                WHERE phone = ?
            `).run(nextCount, phone);
        } catch (e) {
            console.error(`Failed to send reminder to ${phone}:`, e.message);
        }
    }
}
