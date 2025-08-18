import type { Metadata } from "next";
import Header from "@/components/Header";
import { languages, type Lang } from "@/lib/i18n";

export const dynamic = "force-static"; // страницы статичны

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://botmatic.be";

export async function generateMetadata(
  { params }: { params: { lang: Lang } }
): Promise<Metadata> {
  const { lang } = params;
  const alternates: Record<string, string> = {};
  languages.forEach(l => {
    alternates[l] = `${SITE}/${l}`;
  });

  return {
    metadataBase: new URL(SITE),
    title: "BotMatic — Slimme chatbots",
    description: "Chatbots die écht geld opleveren. WhatsApp/Telegram/Website. Diagnose, afspraken, betalingen, CRM-integraties.",
    alternates: { languages: alternates },
    openGraph: {
      title: "BotMatic — Smart chatbots",
      description: "From lead to deal: WA/Telegram/Web. Booking, payments, CRM.",
      url: `${SITE}/${lang}`,
      siteName: "BotMatic",
      type: "website",
      locale: lang,
    },
  };
}

export default function LangLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: Lang };
}) {
  return (
    <html lang={lang}>
      <body className="bg-white text-slate-900 antialiased">
        <Header />
        <div className="pt-[72px]">{children}</div>
      </body>
    </html>
  );
}