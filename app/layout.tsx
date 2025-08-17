export const metadata = {
  title: "BotMatic — AI чат-боты для бизнеса",
  description: "WhatsApp/Telegram/Веб-боты с оплатой и интеграциями."
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-neutral-950 text-white">{children}</body>
    </html>
  );
}