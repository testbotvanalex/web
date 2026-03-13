// backend/src/webhook/helpers.js
import axios from "axios";
import {
    sendWhatsAppMessage,
    sendInteractiveButtons,
    sendInteractiveList,
    sendWhatsAppDocument,
} from "./utils/sendMessage.js";
export { sendWhatsAppMessage, sendInteractiveButtons, sendInteractiveList, sendWhatsAppDocument };

import { sendTelegramMessage } from "./utils/telegram.js";
export { sendTelegramMessage };
import { getUser, resetUser, initUser, setData, setStep, setTemplate } from "./memory/userState.js";
export { getUser, resetUser, initUser, setData, setStep, setTemplate };
import { TEXTS } from "./texts.js";
import {
    NAV_BACK_ID,
    NAV_MENU_ID,
    NAV_EDIT_ID,
    OPERATOR_ID,
    AFTER_DOC_STEP,
    AFTER_Q_ID,
    AFTER_FB_ID,
    AFTER_RAHMET_ID, // [NEW]
    AFTER_MENU_ID,
} from "./constants.js";

export const MENU_MORE_ID = "menu_more_docs";

/* ====== VIDEO FLOW IDS ====== */
export const S1_VIDEO_WATCH_ID = "s1_watch_video";
export const S1_VIDEO_CONTINUE_ID = "s1_continue_fill";

export const S2_VIDEO_WATCH_ID = "s2_watch_video";
export const S2_VIDEO_CONTINUE_ID = "s2_continue_fill";

/* ===================== */
/* HELPERS */
/* ===================== */
export async function getT(phone) {
    const user = await getUser(phone);
    const lang = user?.data?.lang || "ru";
    return { ...TEXTS[lang], lang };
}

export function navButtons(t) {
    return [
        { id: NAV_BACK_ID, title: t.btn_back },
        { id: NAV_MENU_ID, title: t.btn_menu },
    ];
}

export async function sendNavPrompt(to, prompt) {
    const t = await getT(to);
    await sendInteractiveButtons(to, prompt, navButtons(t));
}

export async function sendOperatorPrompt(to, prompt) {
    const t = await getT(to);
    await sendInteractiveButtons(to, prompt, [
        { id: NAV_MENU_ID, title: t.btn_menu },
    ]);
}

function getPublicBase() {
    return String(process.env.PUBLIC_BASE_URL || "https://botmatic02.ru").replace(/\/+$/, "");
}

/* ===================== */
/* VIDEO SENDER */
/* ===================== */
async function trySendVideo(to, url, caption) {
    try {
        const { sendWhatsAppVideo } = await import("../utils/sendMessage.js");
        if (typeof sendWhatsAppVideo === "function") {
            await sendWhatsAppVideo(to, url, caption);
            return true;
        }
    } catch (e) {
        // ignore, fallback below
    }
    await sendWhatsAppMessage(to, `🎥 ${caption}:\n${url}`);
    return false;
}

export async function sendScenario1Video(to) {
    const base = getPublicBase();
    const url = `${base}/video/zayavlenie.mp4`;
    await trySendVideo(to, url, "Видео (ЧСИ заявление)");
    // Add buttons so user can continue after watching
    await sendInteractiveButtons(to, "Посмотрели? Нажмите «Продолжить» для начала заполнения:", [
        { id: S1_VIDEO_CONTINUE_ID, title: "➡️ Продолжить" },
        { id: NAV_MENU_ID, title: "🏠 Меню" },
    ]);
}

export async function sendScenario2Video(to) {
    const base = getPublicBase();
    const url = `${base}/video/vozrazhenie.mp4`;
    await trySendVideo(to, url, "Видео (Возражение)");
    // Add buttons so user can continue after watching
    await sendInteractiveButtons(to, "Посмотрели? Нажмите «Продолжить» для начала заполнения:", [
        { id: S2_VIDEO_CONTINUE_ID, title: "➡️ Продолжить" },
        { id: NAV_MENU_ID, title: "🏠 Меню" },
    ]);
}

/* ===================== */
/* LANGUAGE / CONSENT */
/* ===================== */
/* ===================== */
/* HYBRID START SEQUENCE */
/* ===================== */
export async function sendStartSequence(to) {
    const t = await getT(to);

    // 1. Check Arrests Link
    await sendWhatsAppMessage(to, t.check_arrests_text);

    // 2. Attention Warning
    await sendWhatsAppMessage(to, t.attention_text);

    // 3. Quick access
    await sendInteractiveButtons(to, "Быстрый доступ:", [
        { id: "doc_menu", title: t.btn_docs_menu || "📂 Меню документов" },
        { id: "check_arrests", title: t.btn_check_arrests || "🔍 Как проверить" },
        { id: "nav_menu", title: t.btn_menu || "🏠 Меню" },
    ]);

    // 4. Main Menu
    await sendMainMenu(to);
}

export async function sendLanguageMenu(to) {
    // Deprecated for Hybrid Flow, redirecting to Start Sequence
    return sendStartSequence(to);
}

export async function sendConsent(to) {
    const t = await getT(to);
    await sendWhatsAppMessage(to, t.consent_text);
    await sendInteractiveButtons(to, t.consent_title, [
        { id: "consent_yes", title: "✅ " + (t.consent_btn_yes || "Келісемін") },
        { id: "consent_no", title: "❌ " + (t.consent_btn_no || "Жоқ") },
    ]);
}

/* ===================== */
/* MENUS (LIST) */
/* ===================== */
export async function sendMainMenu(to) {
    const t = await getT(to);

    await sendInteractiveList(to, "👇 " + t.main_menu, t.menu_btn, [
        {
            title: "Қызметтер / Услуги",
            rows: [
                {
                    id: "scenario_1",
                    title: t.btn_s1, // Statement
                    description: "Егер атқарушылық жазба ЖОҚ болса",
                },
                {
                    id: "scenario_2",
                    title: t.btn_s2, // Objection
                    description: "Егер атқарушылық жазба БАР болса",
                },
                {
                    id: "complaint_csi",
                    title: t.btn_complaint, // Complaint CSI
                    description: "Егер ЧСИ жауап бермесе/заңсыз әрекет етсе",
                },
                {
                    id: "restruct",
                    title: t.btn_restruct, // Restructuring
                    description: "График погашения / Реструктуризация",
                },
                {
                    id: "doc_menu",
                    title: t.btn_docs_menu || "📂 Меню документов",
                    description: "Все документы",
                },
                {
                    id: "check_arrests",
                    title: t.btn_check_arrests || "🔍 Как проверить аресты",
                    description: "Короткая инструкция",
                },
                {
                    id: "info_price",
                    title: t.btn_price, // Price
                    description: "Добровольная поддержка",
                },
                {
                    id: OPERATOR_ID,
                    title: t.btn_operator, // Specialist
                    description: "Задать вопрос юристу",
                },
            ],
        },
    ]);
}

export async function sendMoreDocsMenu(to) {
    const body = "Выберите документ из списка 👇";
    await sendInteractiveList(to, body, "Открыть", [
        {
            title: "Другие документы",
            rows: [
                { id: "scenario_3", title: "📄 Нотариус", description: "Документы через нотариуса" },
                { id: OPERATOR_ID, title: "👤 Специалист", description: "Написать специалисту" },
                { id: NAV_MENU_ID, title: "🏠 Меню", description: "Вернуться в главное меню" },
            ],
        },
    ]);
}

/* ===================== */
/* VIDEO CHOICE MENUS */
/* ===================== */
export async function sendScenario1VideoChoice(to) {
    await sendWhatsAppMessage(to, "Перед заполнением можете посмотреть видео-инструкцию. Что делаем?");
    await sendInteractiveButtons(to, "Выбор:", [
        { id: S1_VIDEO_WATCH_ID, title: "▶️ Смотреть видео" },
        { id: S1_VIDEO_CONTINUE_ID, title: "➡️ Продолжить" },
        { id: NAV_MENU_ID, title: "🏠 Меню" },
    ]);
}

export async function sendScenario2VideoChoice(to) {
    await sendWhatsAppMessage(to, "Перед заполнением можете посмотреть видео-инструкцию. Что делаем?");
    await sendInteractiveButtons(to, "Выбор:", [
        { id: S2_VIDEO_WATCH_ID, title: "▶️ Смотреть видео" },
        { id: S2_VIDEO_CONTINUE_ID, title: "➡️ Продолжить" },
        { id: NAV_MENU_ID, title: "🏠 Меню" },
    ]);
}

/* ===================== */
/* SCENARIO STEPS DEFINITION */
/* ===================== */
const S1_STEPS = [
    "s1_bailiff_name",
    "s1_bailiff_address",
    "s1_bailiff_phone",
    "s1_bailiff_email",
    "s1_case_number",
    "s1_case_date",
    "s1_client_full_name",
    "s1_client_address",
    "s1_iin",
    "s1_client_phone",
    "s1_client_email",
    "s1_confirm", // special case
];

const S2_STEPS = [
    "s2_notary_choice",
    "s2_notary_address",
    "s2_notary_phone",
    "s2_notary_email",
    "s2_creditor_name",
    "s2_client_full_name",
    "s2_client_address",
    "s2_iin",
    "s2_client_phone",
    "s2_debt_amount",
    "s2_client_email",
    "s2_confirm", // special case
    "s3_confirm", // special case
];

export async function jumpToStep(from, stepKey) {
    const t = await getT(from);

    let label = "";
    let idx = S1_STEPS.indexOf(stepKey);
    if (idx !== -1) {
        label = t.steps_s1[idx];
    } else {
        idx = S2_STEPS.indexOf(stepKey);
        if (idx !== -1) label = t.steps_s2[idx];
    }

    if (label) {
        // Set flag that we are in editing mode
        await setData(from, "is_editing", true);
        await setStep(from, stepKey);
        await sendNavPrompt(from, label);
    } else {
        // Fallback if step not found
        await goToMenuPreserveLang(from);
    }
}

/* ===================== */
/* NAVIGATION */
/* ===================== */

export async function goToMenuPreserveLang(from) {
    const prev = await getUser(from);
    const lang = prev?.data?.lang || "ru";
    const gdpr = prev?.data?.gdpr_accepted ? true : false;
    const gdpr_ts = prev?.data?.gdpr_accepted_at || null;

    await resetUser(from);
    await initUser(from);
    await setData(from, "lang", lang);

    if (gdpr) {
        await setData(from, "gdpr_accepted", true);
        if (gdpr_ts) await setData(from, "gdpr_accepted_at", gdpr_ts);
        await setStep(from, "main_menu");
        await sendMainMenu(from);
    } else {
        await setStep(from, "consent");
        await sendConsent(from);
    }
}

export async function goBack(from) {
    const user = await getUser(from);
    const currentStep = user.step;
    const t = await getT(from);

    // 1. Try to find in S1
    let idx = S1_STEPS.indexOf(currentStep);
    if (idx !== -1) {
        if (idx === 0) {
            // First step "s1_bailiff_name" -> Go back to Video Choice
            await setStep(from, "s1_video_choice");
            await sendScenario1VideoChoice(from);
            return;
        }
        const prevStep = S1_STEPS[idx - 1];
        await setStep(from, prevStep);
        await sendNavPrompt(from, t.steps_s1[idx - 1]);
        return;
    }

    // 2. Try to find in S2/S3
    idx = S2_STEPS.indexOf(currentStep);
    if (idx !== -1) {
        if (idx === 0) {
            if (user.template === "notary_docs") {
                // Scen 3 had no video choice, goes back to More Docs Menu
                await setStep(from, "more_docs_menu");
                await sendMoreDocsMenu(from);
                return;
            }
            await setStep(from, "s2_video_choice");
            await sendScenario2VideoChoice(from);
            return;
        }

        // Normal back step
        const prevStep = S2_STEPS[idx - 1];

        if (currentStep === "s3_confirm") {
            // Back to email (index 10)
            await setStep(from, "s2_client_email");
            await sendNavPrompt(from, t.steps_s2[10]);
            return;
        }

        await setStep(from, prevStep);
        await sendNavPrompt(from, t.steps_s2[idx - 1]);
        return;
    }

    // Default: Main Menu
    return goToMenuPreserveLang(from);
}

/* ===================== */
/* FLOW HELPERS */
/* ===================== */
export async function saveAndNext(from, key, value, nextStep, nextPrompt) {
    const v = value === null || value === undefined ? "" : String(value).trim();
    await setData(from, key, v);

    // [NEW] Check if we were in "Edit Mode"
    const user = await getUser(from); // Get user data to check the flag
    if (user.data && user.data.is_editing) {
        // Clear flag
        await setData(from, "is_editing", false);

        if (user.template === "vozrazhenie") {
            await setStep(from, "s2_confirm");
        } else if (user.template === "notary_docs") {
            await setStep(from, "s3_confirm");
        } else {
            // Default to s1 (zayavlenie)
            await setStep(from, "s1_confirm");
        }

        // Go straight to summary/confirmation
        await sendSummary(from);
        return;
    }

    await setStep(from, nextStep);
    await sendNavPrompt(from, nextPrompt);
}

/* ===================== */
/* SUMMARY */
/* ===================== */
export async function sendSummary(from) {
    const t = await getT(from);
    const user = await getUser(from);
    const d = user?.data || {};

    // 1. Попытка генерации черновика
    try {
        await sendWhatsAppMessage(from, "⏳ " + (t.gen_draft || "Генерирую черновик... / Жоба дайындалуда..."));

        const payload = {
            template: user.template, // убедись, что template установлен
            data: {
                ...d,
                current_date: new Date().toLocaleDateString("ru-RU"),
                phone: from,
            },
        };

        const gen = await axios.post(
            "http://127.0.0.1:3011/generate/document",
            payload,
            { timeout: 30000 }
        );

        if (gen.data?.url) {
            await sendWhatsAppDocument(from, gen.data.url, "DRAFT_PREVIEW.pdf");
            await sendWhatsAppMessage(from, "📝 " + (t.check_draft || "Проверьте данные в документе выше. / Жоғарыдағы құжаттағы деректерді тексеріңіз."));
        }
    } catch (e) {
        console.error("⚠️ Draft generation failed:", e.message);
        // [LOGGING] Notify Telegram
        try { await sendTelegramMessage(`⚠️ <b>DRAFT ERROR</b>\nUser: ${from}\nError: ${e.message}`); } catch (err) { }
    }

    const lines = [
        t.confirm_title,
        "",
        `👤 ФИО: ${d.client_full_name || "—"}`,
        `🏠 Адрес: ${d.client_address || "—"}`,
        `🆔 ИИН: ${d.iin || "—"}`,
        `📱 Телефон: ${d.client_phone || "—"}`,
        `✉️ Email: ${d.client_email || "—"}`,
    ];

    await sendWhatsAppMessage(from, lines.join("\n"));

    await sendInteractiveButtons(from, "Подтвердить?", [
        { id: "confirm_yes", title: t.btn_yes },
        { id: NAV_EDIT_ID, title: t.btn_edit },
        { id: NAV_MENU_ID, title: t.btn_menu },
    ]);
}

/* ===================== */
/* EDIT MENU */
/* ===================== */
export async function sendEditMenu(from) {
    const t = await getT(from);
    const user = await getUser(from);
    const d = user.data || {};

    let steps = S1_STEPS;
    if (user.template === "vozrazhenie" || user.template === "notary_docs") {
        steps = S2_STEPS;
    }

    const editableSteps = steps.filter(s => !s.includes("confirm"));

    const rows = editableSteps.map(stepKey => {
        let label = stepKey;
        let idx = S1_STEPS.indexOf(stepKey);
        if (idx !== -1) {
            label = t.steps_s1[idx];
        } else {
            idx = S2_STEPS.indexOf(stepKey);
            if (idx !== -1) label = t.steps_s2[idx];
        }
        let cleanLabel = label.replace(/^.*Шаг \d+\/\d+\.\s*/, "").replace(/[:：].*$/, "").trim();

        return {
            id: `EDT:${stepKey}`,
            title: cleanLabel.slice(0, 24),
            description: (d[stepKey.replace(/^s\d_/, "")] || "").slice(0, 72)
        };
    });

    await sendInteractiveList(from, t.edit_desc, t.btn_edit, [
        {
            title: t.edit_title,
            rows: rows
        }
    ]);
}

/* ===================== */
/* AFTER DOC */
/* ===================== */
export async function sendAfterDocMenu(from) {
    const t = await getT(from);
    // [MODIFIED] Added RAHMET and Menu
    await sendInteractiveButtons(from, t.after_doc_title, [
        { id: AFTER_RAHMET_ID, title: t.after_doc_btn_rahmet.slice(0, 20) }, // "🙏 Rahmet"
        { id: AFTER_FB_ID, title: t.after_doc_btn_fb.slice(0, 20) }, // "Review"
        { id: AFTER_MENU_ID, title: t.btn_menu.slice(0, 20) },
    ]);
    await setStep(from, AFTER_DOC_STEP);
}

/* ===================== */
/* NOTARY SEARCH */
/* ===================== */
export async function sendNotaryList(from, notaries) {
    const t = await getT(from);
    const rows = notaries.map(n => ({
        id: `NOTARY_ID:${n.id}`,
        title: n.fio.slice(0, 24),
        description: (n.address || n.city || "").slice(0, 72)
    }));
    rows.push({
        id: "NOTARY_MANUAL",
        title: "Ввести вручную",
        description: "Если вашего нотариуса нет в списке"
    });

    await sendInteractiveList(from, "Найдены нотариусы 👇", "Выбрать", [
        {
            title: "Результаты поиска",
            rows: rows
        }
    ]);
}

/* ===================== */
/* SUPPORT */
/* ===================== */
export async function forwardToSupport(kind, from, messageText) {
    const state = await getUser(from);
    const d = state?.data || {};
    const template = state?.template || "unknown";

    const header =
        kind === "question"
            ? "❓ <b>ВОПРОС</b>"
            : kind === "feedback"
                ? "⭐ <b>ОТЗЫВ</b>"
                : kind === "operator"
                    ? "👤 <b>СПЕЦИАЛИСТ</b>"
                    : "📩 <b>СООБЩЕНИЕ</b>";

    const lines = [
        `${header}`,
        `📑 Шаблон: ${template}`,
        `👤 <a href="wa.me/${from}">${from}</a>`,
        `📝 <b>ФИО:</b> ${d.client_full_name || "—"}`,
        `✉️ <b>Email:</b> ${d.client_email || "—"}`,
        d.__last_doc_url ? `🔗 <a href="${d.__last_doc_url}">Скачать документ</a>` : null,
        "",
        "<b>Текст:</b>",
        String(messageText || ""),
    ].filter(Boolean);

    await sendTelegramMessage(lines.join("\n"));
}

/* ===================== */
/* CONFIRMATION */
/* ===================== */
export async function handleConfirmation(from, text, filename, finalMsg) {
    const t = await getT(from);

    if (text === NAV_MENU_ID) return goToMenuPreserveLang(from);
    if (text === NAV_EDIT_ID) return sendEditMenu(from);
    if (text !== "confirm_yes") return;

    await sendWhatsAppMessage(from, t.processing);

    const state = await getUser(from);
    const payload = {
        template: state.template,
        data: {
            ...state.data,
            current_date: new Date().toLocaleDateString("ru-RU"),
            phone: from,
        },
    };

    try {
        const gen = await axios.post(
            "http://127.0.0.1:3011/generate/document",
            payload,
            { timeout: 60000 }
        );

        if (!gen.data?.url) throw new Error("No URL in response");

        await setData(from, "__last_doc_url", gen.data.url);

        await sendWhatsAppDocument(from, gen.data.url, filename);

        if (finalMsg) {
            await sendWhatsAppMessage(from, finalMsg);
        }

        // Donate offer (voluntary)
        await sendInteractiveButtons(from, t.donate_text, [
            { id: "donate", title: "💳 Поддержать" },
            { id: "review", title: "⭐ Отзыв" },
            { id: "thanks", title: "🙏 Рахмет" },
            { id: NAV_MENU_ID, title: t.btn_menu },
        ]);

        // [LOGGING] Success
        try { await sendTelegramMessage(`✅ <b>DOC GENERATED</b>\nTo: ${from}\nFile: ${filename}\nLink: ${gen.data.url}`); } catch (err) { }

    } catch (e) {
        console.error("❌ Generation failed:", e.message);
        // [LOGGING] Error
        try { await sendTelegramMessage(`🚨 <b>GEN ERROR</b>\nTo: ${from}\nError: ${e.message}`); } catch (err) { }

        await sendWhatsAppMessage(from, "❌ " + (t.error_gen || "Ошибка создания документа."));
    }
}
