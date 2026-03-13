// backend/src/utils/ai.js
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

const SYSTEM_PROMPT = `
You are a helpful assistant for a legal document service (BotMatic).
Your task is to answer user questions politely and concisely.
You are not a lawyer, so do not give complex legal advice, but you can explain simple things.
The service helps to remove arrests, cancel enforcement notices, and make objections.
If you don't know the answer, suggest contacting an operator (button in the menu).
ALWAYS respond in English.
`;

export async function getAIResponse(userText, knowledge = "") {
    if (!openai) {
        console.log("⚠️ OpenAI key missing. Skipping AI.");
        return null;
    }

    try {
        const fullSystemPrompt = SYSTEM_PROMPT + (knowledge ? `\n\nCONTEXT INFORMATION:\n${knowledge}` : "");

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: fullSystemPrompt },
                { role: "user", content: userText }
            ],
            model: "gpt-3.5-turbo",
        });

        return completion.choices[0]?.message?.content || null;
    } catch (e) {
        console.error("AI Error:", e.message);
        return null;
    }
}
