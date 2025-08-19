// app/[lang]/page.tsx
"use client";

import { getT, type Lang } from "@/lib/i18n";
import ROI from "@/components/ROI";
import { useMemo, useState } from "react";

export default function Page({ params: { lang } }: { params: { lang: Lang } }) {
  const tr = getT(lang);
  const [isYearly, setIsYearly] = useState(true);

  const priceFmt = (n: number) =>
    "€" + (isYearly ? Math.round(n * 10) : n).toString() + (isYearly ? "/jaar" : "/maand");

  const waText = (plan: string) =>
    lang === "nl"
      ? `Hoi! Ik wil het ${plan} plan.`
      : lang === "fr"
      ? `Bonjour ! Je veux l'offre ${plan}.`
      : `Hi! I'm interested in the ${plan} plan.`;

  const waLink = (plan: string) =>
    "https://wa.me/32470000000?text=" + encodeURIComponent(waText(plan));

  const Compare = useMemo(
    () => (
      <div className="card p-6">
        <h3 className="text-lg font-semibold">{tr.compareTitle}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Feature</th>
                <th className="py-2 pr-4">Basic</th>
                <th className="py-2 pr-4">Standard</th>
                <th className="py-2">Premium</th>
              </tr>
            </thead>
            <tbody>
              {tr.compareRows.map((r) => (
                <tr key={r.feature} className="border-t border-slate-200/70">
                  <td className="py-2 pr-4">{r.feature}</td>
                  <td className="py-2 pr-4">{r.basis ? "✓" : "—"}</td>
                  <td className="py-2 pr-4">{r.standard ? "✓" : "—"}</td>
                  <td className="py-2">{r.premium ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
    [tr]
  );

  return (
    <main id="main">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/50 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-12">
          <div className="card p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {tr.heroTitle}
            </h1>
            <p className="mt-4 text-slate-600 max-w-2xl">
              {tr.heroSub}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#contact" className="btn btn-primary">{tr.ctaContact}</a>
              <a href="#pricing" className="btn btn-ghost">{tr.ctaPricing}</a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold">{tr.pricingTitle}</h2>

            {/* Toggle */}
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-3 py-1 rounded-lg border ${
                  !isYearly ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"
                }`}
              >
                {tr.toggleMonthly}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-3 py-1 rounded-lg border ${
                  isYearly ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"
                }`}
              >
                {tr.toggleYearly} <span className="ml-1 text-xs opacity-80">({tr.saveText})</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {tr.plans.map((p) => (
              <div
                key={p.name}
                className={`card p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${
                  p.popular ? "ring-2 ring-brand-200" : ""
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <div className="text-slate-700">{priceFmt(p.priceMonthly)}</div>
                </div>

                <ul className="mt-4 space-y-2 text-slate-700">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a href={p.link} className="btn btn-primary w-full mt-6">{p.cta}</a>
                <a href={waLink(p.name)} className="btn btn-ghost w-full mt-2">WhatsApp</a>
              </div>
            ))}
          </div>

          <div className="mt-8">{Compare}</div>
        </div>
      </section>

      {/* ROI */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <ROI />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-6">{tr.faqTitle}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {tr.faq.map(({ q, a }, i) => (
              <details key={q} open={i === 0} className="card p-4 open:ring-2 open:ring-brand-200 transition">
                <summary className="cursor-pointer font-semibold select-none">{q}</summary>
                <p className="mt-2 text-slate-700">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold">{tr.contactTitle}</h2>
          <p className="text-slate-600 mt-2">{tr.contactDesc}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`mailto:${tr.email}`} className="btn btn-primary">{tr.email}</a>
            <a
              href={"https://wa.me/32470000000?text=" + encodeURIComponent(waText("General"))}
              className="btn btn-ghost"
            >
              WhatsApp
            </a>
          </div>
          {tr.gamble && <p className="mt-10 text-xs text-slate-500">{tr.gamble}</p>}
        </div>
      </section>

      {/* Sticky CTA (mobile) */}
      <div className="sticky-cta">
        <a href="#contact" className="btn btn-primary flex-1">{tr.stickyDemo}</a>
        <a href={"https://wa.me/32470000000?text=" + encodeURIComponent(waText("General"))} className="btn btn-ghost flex-1">
          {tr.stickyWhatsApp}
        </a>
      </div>

      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "BotMatic",
            url: "https://www.botmatic.be",
            logo: "https://www.botmatic.be/logo.png",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: tr.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </main>
  );
}