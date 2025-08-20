import "./globals.css";

export const metadata = {
  title: "BotMatic — AI чат-боты для бизнеса",
  description: "WhatsApp/Telegram/Веб-боты: диагностика, запись, оплата, интеграции с CRM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-neutral-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}