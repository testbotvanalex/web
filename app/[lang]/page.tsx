// app/[lang]/page.tsx
import { getT, type Lang } from "@/lib/i18n";

export default function Page({ params: { lang } }: { params: { lang: Lang } }) {
  const tr = getT(lang);

  const waText = (plan: string) =>
    lang === "nl" ? `Hoi! Ik wil het ${plan} plan.`
    : lang === "fr" ? `Bonjour ! Je veux l'offre ${plan}.`
    : `Hi! I'm interested in the ${plan} plan.`;

  const waLink = (plan: string) => "https://wa.me/32470000000?text=" + encodeURIComponent(waText(plan));

  return (
    <main>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{tr.heroTitle}</h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">{tr.heroSub}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#contact" className="rounded-xl px-5 py-3 bg-indigo-600 text-white font-semibold hover:scale-[1.02] hover:bg-indigo-700 transition">
              {tr.ctaContact}
            </a>
            <a href="#pricing" className="rounded-xl px-5 py-3 border border-slate-300 bg-white hover:bg-slate-50 hover:scale-[1.02] transition">
              {tr.ctaPricing}
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center">{tr.pricingTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {tr.plans.map((p) => (
              <div
                key={p.name}
                className={`group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ${p.popular ? "ring-2 ring-indigo-200" : ""}`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <div className="text-slate-700">{p.price}</div>
                </div>
                <ul className="mt-4 space-y-2 text-slate-700">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2"><span>•</span><span>{f}</span></li>
                  ))}
                </ul>

                <a href={p.link} className="mt-6 inline-block w-full text-center rounded-xl bg-indigo-600 text-white font-semibold py-2 hover:scale-[1.01] hover:bg-indigo-700 transition">
                  {p.cta}
                </a>
                <a href={waLink(p.name)} className="mt-2 inline-block w-full text-center rounded-xl border border-slate-300 bg-white py-2 hover:bg-slate-50 hover:scale-[1.01] transition">
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-slate-50 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-6">{tr.faqTitle}</h2>
          <div className="space-y-4">
            {tr.faq.map(({ q, a }, i) => (
              <details key={q} open={i === 0} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm open:ring-2 open:ring-indigo-200 transition">
                <summary className="cursor-pointer font-semibold select-none hover:text-slate-900">{q}</summary>
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
            <a href={`mailto:${tr.email}`} className="rounded-xl px-5 py-3 bg-indigo-600 text-white font-semibold hover:scale-[1.02] hover:bg-indigo-700 transition">
              {tr.email}
            </a>
            <a href={"https://wa.me/32470000000?text=" + encodeURIComponent(waText("General"))} className="rounded-xl px-5 py-3 border border-slate-300 bg-white hover:bg-slate-50 transition">
              WhatsApp
            </a>
          </div>
          <p className="mt-10 text-xs text-slate-500">{tr.gamble}</p>
        </div>
      </section>
    </main>
  );
}