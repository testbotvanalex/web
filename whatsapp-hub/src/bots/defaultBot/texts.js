// src/bots/defaultBot/texts.js

export const TEXTS = {
    ru: { // Now also English
        greeting: "Welcome to BotMatic! 🚀\nI am your new virtual assistant. How can I help you today?",
        unknown: "Not sure I understood. Type 'menu' to return to the options list.",
        menu_title: "Main Menu",
        btn_info: "ℹ️ About Company",
        btn_services: "🛠 Services",
        btn_operator: "👤 Call Operator",
        info_text: "BotMatic is an omni-channel platform for communication automation. We unify WhatsApp, Telegram, and Instagram in one window with smart AI.",
        services_text: "What we can do:\n1️⃣ Smart chatbot development\n2️⃣ AI connection to social networks\n3️⃣ Direct integration with CRM",
        operator_text: "One moment! 🕒 I'm transferring the dialogue to a live operator. Someone will contact you shortly. Please describe your question.",
    },
    en: {
        greeting: "Welcome to BotMatic! 🚀\nI am your virtual assistant. How can I help?",
        unknown: "I didn't understand. Type 'menu' to see options.",
        menu_title: "Main Menu",
        btn_info: "ℹ️ Info",
        btn_help: "❓ Help",
        info_text: "This is a multi-tenant WhatsApp bot.\nEach number can use its own logic.",
        help_text: "For help, contact the administrator.",
    },
    nl: {
        greeting: "Hallo! 👋\nIk ben een testbot. Kies een actie:",
        unknown: "Ik begreep het niet. Typ 'menu' om opties te zien.",
        menu_title: "Hoofdmenu",
        btn_info: "ℹ️ Info",
        btn_help: "❓ Hulp",
        info_text: "Dit is een multi-tenant WhatsApp bot.\nElk nummer kan zijn eigen logica gebruiken.",
        help_text: "Neem voor hulp contact op met de beheerder.",
    },
};

export function getTexts(lang) {
    return TEXTS[lang] || TEXTS.en;
}
