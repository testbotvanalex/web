// app/[lang]/layout.tsx
import "./../globals.css";
import type { Metadata } from "next";
import { languages, type Lang } from "@/lib/i18n";
import Header from "@/components/Header";
import { Inter } from "next/font/google";

export const dynamic = "force-static";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  title: "BotMatic — WhatsApp & Web Chatbots",
  description: "Capture leads, book meetings, and auto-answer with BotMatic.",
  openGraph: {
    title: "BotMatic — Smart Chatbots",
    description: "WhatsApp & Website chatbots that convert.",
    images: ["/og.jpg"], // положи og.jpg в /public при желании
  },
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "/",
    languages: {
      "nl-BE": "/nl",
      "fr-BE": "/fr",
      "en": "/en",
    },
  },
};

export default function LangLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: Lang };
}) {
  return (
    <html lang={lang}>
      <body className={inter.className}>
        <a href="#main" className="sr-skip">Skip to content</a>
        <Header lang={lang} />
        {children}
      </body>
    </html>
  );
}