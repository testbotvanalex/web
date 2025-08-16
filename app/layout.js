import "./globals.css";

export const metadata = {
  title: "BotMatic — AI Chatbots",
  description: "Чат-боты для бизнеса (WhatsApp, Telegram, Web).",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}