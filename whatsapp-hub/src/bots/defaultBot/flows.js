// src/bots/defaultBot/flows.js
import { getTexts } from "./texts.js";

/**
 * Handle greeting / start
 */
export function handleStart(t) {
    return [
        { type: "text", text: t.greeting },
        {
            type: "buttons",
            text: t.menu_title,
            buttons: [
                { id: "info", title: t.btn_info },
                { id: "services", title: t.btn_services },
                { id: "operator", title: t.btn_operator },
            ],
        },
    ];
}

/**
 * Handle menu command
 */
export function handleMenu(t) {
    return [
        {
            type: "buttons",
            text: t.menu_title,
            buttons: [
                { id: "info", title: t.btn_info },
                { id: "services", title: t.btn_services },
                { id: "operator", title: t.btn_operator },
            ],
        },
    ];
}

/**
 * Handle info button
 */
export function handleInfo(t) {
    return [
        { type: "text", text: t.info_text },
        ...handleMenu(t),
    ];
}

/**
 * Handle services button
 */
export function handleServices(t) {
    return [
        { type: "text", text: t.services_text },
        ...handleMenu(t),
    ];
}

/**
 * Handle operator button
 */
export function handleOperator(t) {
    return [
        { type: "text", text: t.operator_text }
    ];
}

/**
 * Handle unknown input
 */
export function handleUnknown(t) {
    return [{ type: "text", text: t.unknown }];
}
