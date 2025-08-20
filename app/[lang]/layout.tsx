// app/[lang]/layout.tsx
import type { Metadata } from "next";
import "../globals.css";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ lang: "nl" }, { lang: "fr" }, { lang: "en" }];
}

export const metadata: Metadata = {
  title: "BotMatic — Chatbots voor WhatsApp, Telegram, Web",
  description:
    "Automatiseer FAQ, afspraken en sales. Meer conversies, minder werk.",
  alternates: {
    languages: {
      nl: "/nl",
      fr: "/fr",
      en: "/en",
    },
  },
};

export default function LangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <html lang="nl"><body>{children}</body></html>;
}