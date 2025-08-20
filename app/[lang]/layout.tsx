// app/[lang]/layout.tsx
import type { Metadata } from "next";
import { languages, type Lang } from "@/lib/i18n";
import Link from "next/link";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const { lang } = params;
  return {
    alternates: {
      languages: {
        nl: "/nl",
        fr: "/fr",
        en: "/en",
      },
    },
    title: `BotMatic — ${lang.toUpperCase()}`,
  };
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: Lang };
}) {
  const { lang } = params;
  return (
    <html lang={lang}>
      <body>
        <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href={`/${lang}`} className="font-extrabold tracking-tight">
              BotMatic
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href={`/${lang}#pricing`} className="hover:text-primary-700">
                Pricing
              </Link>
              <Link href={`/${lang}#contact`} className="hover:text-primary-700">
                Contact
              </Link>
              <div className="flex items-center gap-1">
                {languages.map((l) => (
                  <Link
                    key={l}
                    href={`/${l}`}
                    className={`px-2 py-1 rounded-md border ${
                      l === lang ? "border-primary-600 text-primary-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {l.toUpperCase()}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </header>
        {children}
        <footer className="py-10 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} BotMatic. All rights reserved.
        </footer>
      </body>
    </html>
  );
}