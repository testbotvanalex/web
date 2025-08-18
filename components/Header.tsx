"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const langs = [
  { code: "nl", label: "Nederlands" },
  { code: "fr", label: "Français"  },
  { code: "en", label: "English"   },
] as const;

export default function Header() {
  const pathname = usePathname() || "/nl";
  const current = (pathname.split("/")[1] || "nl") as "nl" | "fr" | "en";

  const labels = {
    nl: { pricing: "Tarieven", faq: "FAQ", contact: "Contact", demo: "Demo aanvragen" },
    fr: { pricing: "Tarifs",   faq: "FAQ", contact: "Contact", demo: "Demander une démo" },
    en: { pricing: "Pricing",  faq: "FAQ", contact: "Contact", demo: "Request demo" },
  }[current];

  const wa = "https://wa.me/32470000000?text=" + encodeURIComponent(
    current === "nl" ? "Hoi! Ik wil een BotMatic demo."
    : current === "fr" ? "Bonjour ! Je veux une démo BotMatic."
    : "Hi! I’d like a BotMatic demo."
  );

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={`/${current}`} className="font-extrabold tracking-tight hover:opacity-80 transition">
          BotMatic
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-slate-700">
          <a href="#pricing" className="hover:text-slate-900 transition"> {labels.pricing} </a>
          <a href="#faq" className="hover:text-slate-900 transition"> {labels.faq} </a>
          <a href="#contact" className="hover:text-slate-900 transition"> {labels.contact} </a>
        </div>

        <div className="flex items-center gap-3">
          {/* Language switch */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            {langs.map(l => {
              const href = `/${l.code}`;
              const active = l.code === current;
              return (
                <Link
                  key={l.code}
                  href={href}
                  className={`rounded-lg px-2 py-1 border transition ${
                    active
                      ? "border-slate-900 text-slate-900"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* CTAs */}
          <a
            href={wa}
            className="hidden sm:inline-block rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 transition"
          >
            WhatsApp
          </a>
          <a
            href="#contact"
            className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:scale-[1.02] hover:bg-indigo-700 transition"
          >
            {labels.demo}
          </a>
        </div>
      </nav>
    </header>
  );
}