// src/bots/defaultBot/index.js
import { getTexts } from "./texts.js";
import { handleStart, handleMenu, handleInfo, handleServices, handleOperator, handleUnknown } from "./flows.js";

/**
 * Default bot handler
 * Simple example that responds to basic commands
 */
export async function handleIncoming({ tenant, message }) {
    const lang = tenant.language || "en";
    const t = getTexts(lang);

    const text = (message.text || "").toLowerCase().trim();
    const buttonId = message.buttonId;

    // Start / greeting
    if (text === "/start" || text === "start" || text === "привет" || text === "hello" || text === "hallo") {
        return { messages: handleStart(t) };
    }

    // Menu
    if (text === "menu" || text === "меню") {
        return { messages: handleMenu(t) };
    }

    // Button: Info
    if (buttonId === "info" || text === "info" || text === "информация") {
        return { messages: handleInfo(t) };
    }

    // Button: Services
    if (buttonId === "services" || text === "услуги" || text === "services") {
        return { messages: handleServices(t) };
    }

    // Button: Operator
    if (buttonId === "operator" || text === "оператор" || text === "operator") {
        return { messages: handleOperator(t) };
    }

    // Unknown
    return { messages: handleUnknown(t) };
}
