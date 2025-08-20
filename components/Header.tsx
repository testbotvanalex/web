// components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { languages, type Lang } from "@/lib/i18n";

export default function Header({ lang }: { lang: Lang }) {
  const pathname = usePathname();

  const switchTo = (l: Lang) => {
    // заменяем первый сегмент языка
    const parts = pathname?.split("/") ?? [""];
    // / -> ['', ''] ; /nl -> ['', 'nl']
    if (parts.length > 1 && languages.includes(parts[1] as Lang)) {
      parts[1] = l;
    } else {
      parts.splice(1, 0, l);
    }
    const href = parts.join("/") || `/${l}`;
    return href.replace(/\/+/g, "/");
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-white/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href={`/${lang}`} className="font-extrabold text-xl tracking-tight">
          BotMatic
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#pricing" className="hover:opacity-80">Pricing</a>
          <a href="#faq" className="hover:opacity-80">FAQ</a>
          <a href="#contact" className="hover:opacity-80">Contact</a>
          <Link href={`/${lang}`} className="btn btn-primary">Get demo</Link>
        </nav>

        <div className="flex items-center gap-2">
          {languages.map((l) => (
            <Link
              key={l}
              href={switchTo(l)}
              className={`px-3 py-1 rounded-lg border text-sm ${
                l === lang ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"
              }`}
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}