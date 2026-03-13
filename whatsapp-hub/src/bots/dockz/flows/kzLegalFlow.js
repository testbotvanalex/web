// flows/kzLegalFlow.js
// Флоу продажи юридических документов для снятия ареста Kaspi
//
// Шаблоны (doc-файлы → ключ шаблона):
//   Бланк.doc                      → zayavlenie        (Заявление ЧСИ)
//   бланк_отмена_ИН.doc            → vozrazhenie       (Возражение на ИН)
//   Бланк_Жалоба_в_Палату_ЧСИ.doc → complaint_chamber (Жалоба в палату ЧСИ)
//   Бланк_Жалоба_в_суд_на_ЧСИ.doc → complaint_court   (Жалоба в суд)
//   Жалоба_в_Юстицию_бланк.doc    → complaint_justice  (Жалоба в Минюст)
//   Блан_Нотариусу.doc             → notary_docs       (Заявление нотариусу)
//
// Интеграция в handler.js (добавить ПЕРЕД основным switch(step)):
//   import { handleKzLegalStep } from "./flows/kzLegalFlow.js";
//   if (await handleKzLegalStep(from, cleanBox)) return;
//
// Добавить в роутер верхнего уровня:
//   if (cleanBox === "kz_legal" || cleanBox === KZ_LEGAL_STEP.MENU) {
//       await sendKzLegalMenu(from); return;
//   }

import {
    sendWhatsAppMessage,
    sendInteractiveButtons,
    sendInteractiveList,
} from "../helpers.js";
import { getUser, setStep, setData, setTemplate } from "../memory/userState.js";

// ─── Шаги флоу ──────────────────────────────────────────────────────────────
export const KZ_LEGAL_STEP = {
    MENU:  "kz_legal_menu",
    GUIDE: "kz_legal_guide",
};

// ─── Каталог документов ──────────────────────────────────────────────────────
// Порядок: сначала самые востребованные (заявление + возражение),
// затем жалобы по возрастанию инстанции.
const KASPI_DOCS = [
    {
        id:       "kzl_zayavlenie",
        key:      "zayavlenie",
        title:    "📄 Заявление ЧСИ",
        desc:     "Ознакомление с исполнительным производством",
        when:     "Арест есть, но исполнительной надписи НЕТ",
        file:     "Бланк.doc",
    },
    {
        id:       "kzl_vozrazhenie",
        key:      "vozrazhenie",
        title:    "✍️ Возражение на ИН",
        desc:     "Отменить исполнительную надпись нотариуса",
        when:     "Есть исполнительная надпись нотариуса",
        file:     "бланк_отмена_ИН.doc",
    },
    {
        id:       "kzl_notary_docs",
        key:      "notary_docs",
        title:    "📋 Заявление нотариусу",
        desc:     "Документы через нотариуса (ЧСИ)",
        when:     "Документ выдан нотариусом",
        file:     "Блан_Нотариусу.doc",
    },
    {
        id:       "kzl_complaint_chamber",
        key:      "complaint_chamber",
        title:    "📣 Жалоба в палату ЧСИ",
        desc:     "Незаконные действия судебного исполнителя",
        when:     "ЧСИ нарушает ваши права или не отвечает",
        file:     "Бланк_Жалоба_в_Палату_ЧСИ.doc",
    },
    {
        id:       "kzl_complaint_court",
        key:      "complaint_court",
        title:    "⚖️ Жалоба в суд на ЧСИ",
        desc:     "Обжаловать действия ЧСИ в суде",
        when:     "Жалоба в палату не помогла",
        file:     "Бланк_Жалоба_в_суд_на_ЧСИ.doc",
    },
    {
        id:       "kzl_complaint_justice",
        key:      "complaint_justice",
        title:    "🏛️ Жалоба в Минюст",
        desc:     "Министерство юстиции — высшая инстанция",
        when:     "Суд и палата ЧСИ не решили проблему",
        file:     "Жалоба_в_Юстицию_бланк.doc",
    },
];

export function getKaspiDocById(id) {
    return KASPI_DOCS.find(d => d.id === id) || null;
}

export function getKaspiDocByKey(key) {
    return KASPI_DOCS.find(d => d.key === key) || null;
}

// ─── Главное меню флоу ───────────────────────────────────────────────────────
/**
 * Отправляет меню документов для снятия ареста Kaspi.
 * После выбора документа пользователь попадает в sendKzDocCard,
 * затем — в стандартный fill_<key> → startFormFlow.
 */
export async function sendKzLegalMenu(from) {
    const intro = [
        "⚖️ *Снятие ареста Kaspi — юридические документы*",
        "",
        "Выберите подходящий документ из списка ниже.",
        "Если не знаете какой выбрать — нажмите «Помощь с выбором» 👇",
    ].join("\n");

    await sendWhatsAppMessage(from, intro);

    const rows = KASPI_DOCS.map(d => ({
        id:          d.id,
        title:       d.title.slice(0, 24),
        description: d.desc.slice(0, 72),
    }));

    await sendInteractiveList(from, "📂 Документы для снятия ареста Kaspi", "Открыть", [
        { title: "Юридические документы", rows },
    ]);

    await sendInteractiveButtons(from, "Не знаете что выбрать?", [
        { id: KZ_LEGAL_STEP.GUIDE, title: "❓ Помощь с выбором" },
        { id: "entry_services",    title: "📂 Все документы" },
        { id: "nav_menu",          title: "🏠 Меню" },
    ]);

    await setStep(from, KZ_LEGAL_STEP.MENU);
}

// ─── Диагностическая шпаргалка ───────────────────────────────────────────────
/**
 * Пошаговый гид для выбора нужного документа.
 * Объясняет разницу между ситуациями с нотариусом и без.
 */
export async function sendKzLegalGuide(from) {
    const guide = [
        "❓ *Как выбрать нужный документ?*",
        "",
        "1️⃣ Зайдите на сайт:",
        "   https://aisoip.adilet.gov.kz/",
        "   Найдите своё дело по ИИН.",
        "",
        "2️⃣ Посмотрите строку «Орган, выдавший документ»:",
        "",
        "   📌 «Нотариальная палата» → есть исполнительная надпись:",
        "      ✍️ Возражение на ИН — чтобы отменить",
        "      📋 Заявление нотариусу — чтобы ознакомиться",
        "",
        "   📌 «Решение суда» / «ДВД» / другое → обычное ИП:",
        "      📄 Заявление ЧСИ — ознакомиться с делом",
        "",
        "3️⃣ Если ЧСИ нарушает ваши права:",
        "   📣 Жалоба в палату ЧСИ (1-я инстанция)",
        "   ⚖️ Жалоба в суд на ЧСИ (2-я инстанция)",
        "   🏛️ Жалоба в Минюст (крайняя мера)",
        "",
        "💡 Сомневаетесь — напишите специалисту.",
    ].join("\n");

    await sendWhatsAppMessage(from, guide);

    await sendInteractiveButtons(from, "Что дальше?", [
        { id: KZ_LEGAL_STEP.MENU, title: "📂 Выбрать документ" },
        { id: "nav_operator",      title: "👤 Специалист" },
        { id: "entry_services",    title: "📂 Все документы" },
    ]);

    await setStep(from, KZ_LEGAL_STEP.GUIDE);
}

// ─── Карточка документа ──────────────────────────────────────────────────────
/**
 * Краткая карточка перед стартом заполнения.
 * Кнопка «Начать» отправляет fill_<key>, который обрабатывает handler.js.
 */
export async function sendKzDocCard(from, doc) {
    const lines = [
        `${doc.title}`,
        "",
        `📌 Когда нужен:`,
        `   ${doc.when}`,
        "",
        "Заполнение занимает 2–3 минуты.",
        "Готовый документ придёт сюда в WhatsApp.",
    ];

    await sendWhatsAppMessage(from, lines.join("\n"));

    await sendInteractiveButtons(from, "Начать оформление?", [
        { id: `fill_${doc.key}`,  title: "📝 Начать" },
        { id: KZ_LEGAL_STEP.MENU, title: "◀️ Назад" },
        { id: "entry_services",   title: "📂 Все документы" },
    ]);

    await setData(from, "kz_legal_doc_key", doc.key);
    await setStep(from, `kz_legal_card_${doc.key}`);
}

// ─── Главный обработчик шагов kz_legal_* ────────────────────────────────────
/**
 * Вызывайте из handleIncoming в handler.js ДО основного switch(step).
 *
 * Пример интеграции:
 *   import { handleKzLegalStep } from "./flows/kzLegalFlow.js";
 *   // ... внутри handleIncoming, до switch(step):
 *   if (await handleKzLegalStep(from, cleanBox)) return;
 *
 * @param {string} from   — номер телефона
 * @param {string} text   — cleanBox (trim().toLowerCase())
 * @returns {Promise<boolean>} true если шаг был обработан этим флоу
 */
export async function handleKzLegalStep(from, text) {
    const cleanBox = String(text || "").trim().toLowerCase();

    // Открытие главного меню флоу
    if (cleanBox === "kz_legal" || cleanBox === KZ_LEGAL_STEP.MENU) {
        await sendKzLegalMenu(from);
        return true;
    }

    // Открытие гида
    if (cleanBox === KZ_LEGAL_STEP.GUIDE) {
        await sendKzLegalGuide(from);
        return true;
    }

    // Выбор документа из списка (kzl_*)
    const kzlDoc = getKaspiDocById(cleanBox);
    if (kzlDoc) {
        await setTemplate(from, kzlDoc.key);
        await sendKzDocCard(from, kzlDoc);
        return true;
    }

    // Шаги kz_legal_card_* (повторный показ карточки при любом тексте)
    const user = await getUser(from);
    const step = user?.step || "";
    if (step.startsWith("kz_legal_card_")) {
        const key = step.replace("kz_legal_card_", "");
        const doc = getKaspiDocByKey(key);
        if (doc) {
            await sendKzDocCard(from, doc);
        } else {
            await sendKzLegalMenu(from);
        }
        return true;
    }

    // Шаги самого меню/гида — повтор
    if (step === KZ_LEGAL_STEP.MENU) {
        await sendKzLegalMenu(from);
        return true;
    }
    if (step === KZ_LEGAL_STEP.GUIDE) {
        await sendKzLegalGuide(from);
        return true;
    }

    return false;
}
