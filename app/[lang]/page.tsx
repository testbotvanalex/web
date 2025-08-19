// app/[lang]/page.tsx
import { getT, type Lang } from "@/lib/i18n";
import Pricing from "@/components/Pricing";

export default function Page({ params: { lang } }: { params: { lang: Lang } }) {
  const tr = getT(lang);

  const waText = (topic: string) =>
    lang === "nl"
      ? `Hoi! ${topic}`
      : lang === "fr"
      ? `Bonjour ! ${topic}`
      : `Hi! ${topic}`;

  const waLink = (topic: string) =>
    "https://wa.me/32470000000?text=" + encodeURIComponent(waText(topic));

  return (
    <main>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {tr.heroTitle}
          </h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">{tr.heroSub}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#contact"
              className="rounded-xl px-5 py-3 bg-indigo-600 text-white font-semibold hover:scale-[1.02] hover:bg-indigo-700 transition"
            >
              {tr.ctaContact}
            </a>
            <a
              href="#pricing"
              className="rounded-xl px-5 py-3 border border-slate-300 bg-white hover:bg-slate-50 hover:scale-[1.02] transition"
            >
              {tr.ctaPricing}
            </a>
          </div>
        </div>
      </section>

      {/* Pricing with click-for-details */}
      <Pricing lang={lang} tr={tr} />

      {/* FAQ */}
      <section id="faq" className="py-16 bg-slate-50 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-6">{tr.faqTitle}</h2>
          <div className="space-y-4">
            {tr.faq.map(({ q, a }, i) => (
              <details
                key={q}
                open={i === 0}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm open:ring-2 open:ring-indigo-200 transition"
              >
                <summary className="cursor-pointer font-semibold select-none hover:text-slate-900">
                  {q}
                </summary>
                <p className="mt-2 text-slate-700">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 scroll-mt-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold">{tr.contactTitle}</h2>
          <p className="text-slate-600 mt-2">{tr.contactDesc}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`mailto:${tr.email}`}
              className="rounded-xl px-5 py-3 bg-indigo-600 text-white font-semibold hover:scale-[1.02] hover:bg-indigo-700 transition"
            >
              {tr.email}
            </a>
            <a
              href={waLink(
                lang === "nl"
                  ? "Ik wil een demo boeken."
                  : lang === "fr"
                  ? "Je souhaite réserver une démo."
                  : "I’d like to book a demo."
              )}
              className="rounded-xl px-5 py-3 border border-slate-300 bg-white hover:bg-slate-50 transition"
            >
              WhatsApp
            </a>
          </div>
          <p className="mt-10 text-xs text-slate-500">{tr.gamble}</p>
        </div>
      </section>
    </main>
  );
}