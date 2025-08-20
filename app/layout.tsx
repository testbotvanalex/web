// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BotMatic — AI chatbots for business",
  description: "Smart chatbots for WhatsApp, Telegram, and the Web.",
  metadataBase: new URL("https://www.botmatic.be"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}