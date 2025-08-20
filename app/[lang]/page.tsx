// app/[lang]/page.tsx
"use client";

import { getT, type Lang } from "@/lib/i18n";
import { useMemo, useState } from "react";

export default function Page({ params: { lang } }: { params: { lang: Lang } }) {
  const tr = useMemo(() => getT(lang), [lang]);

  const waText = (plan: string) =>
    lang === "nl"
      ? `Hoi! Ik wil het ${plan} plan.`
      : lang === "fr"
      ? `Bonjour ! Je veux l'offre ${plan}.`
      : `Hi! I'm interested in the ${plan} plan.`;

  const waLink = (plan: string) =>
    "https://wa.me/32470000000?text=" + encodeURIComponent(waText(plan));

  return (
    <main>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {tr.heroTitle}
          </h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            {tr.heroSub}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#contact" className="btn btn-primary">
              {tr.ctaContact}
            </a>
            <a href="#pricing" className="btn btn-outline">
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
              <PriceCard
                key={p.name}
                lang={lang}
                title={p.name}
                price={p.price}
                features={p.features}
                breakdownLabels={tr.detailsLabels}
                breakdown={p.breakdown}
                primaryCta={p.cta}
                link={p.link}
                wa={waLink(p.name)}
                note={p.note}
                popular={p.popular}
                expandText={tr.actions.expand}
                collapseText={tr.actions.collapse}
                detailsTitle={tr.detailsTitle}
              />
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
              <details
                key={q}
                open={i === 0}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm open:ring-2 open:ring-primary-200 transition"
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
            <a href={`mailto:${tr.email}`} className="btn btn-primary">
              {tr.email}
            </a>
            <a
              href={"https://wa.me/32470000000?text=" + encodeURIComponent(waText("General"))}
              className="btn btn-outline"
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

type Labels = {
  channels: string; scenarios: string; dialogs: string; ai: string;
  integrations: string; support: string; setup: string;
};

function PriceCard(props: {
  lang: Lang;
  title: string;
  price: string;
  features: string[];
  breakdownLabels: Labels;
  breakdown: {
    channels: string; scenarios: string; dialogs: string; ai: string;
    integrations: string; support: string; setup: string;
  };
  detailsTitle: string;
  primaryCta: string;
  link: string;
  wa: string;
  note?: string;
  popular?: boolean;
  expandText: string;
  collapseText: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`card p-6 ${props.popular ? "ring-2 ring-primary-200" : ""}`}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-bold">{props.title}</h3>
        {/* Клик по цене тоже раскрывает */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-slate-700 text-right hover:text-primary-700 focus:outline-none"
          aria-expanded={open}
          aria-controls={`details-${props.title}`}
          title={open ? props.collapseText : props.expandText}
        >
          <div className="text-lg font-semibold">{props.price}</div>
          <div className="text-xs">{open ? props.collapseText : props.expandText}</div>
        </button>
      </div>

      <ul className="mt-4 space-y-2 text-slate-700">
        {props.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span>•</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a href={props.link} className="btn btn-primary w-full text-center">
          {props.primaryCta}
        </a>
        <a href={props.wa} className="btn btn-outline w-full text-center">
          WhatsApp
        </a>
      </div>

      {props.note && (
        <p className="mt-2 text-xs text-slate-500">{props.note}</p>
      )}

      {/* Детали: аккордеон/раскрытие */}
      <div
        id={`details-${props.title}`}
        className={`overflow-hidden transition-all duration-300 ${open ? "mt-6 max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <h4 className="font-semibold mb-3">{props.detailsTitle}</h4>
        <dl className="grid grid-cols-1 gap-2 text-sm">
          <Row label={props.breakdownLabels.channels} value={props.breakdown.channels} />
          <Row label={props.breakdownLabels.scenarios} value={props.breakdown.scenarios} />
          <Row label={props.breakdownLabels.dialogs} value={props.breakdown.dialogs} />
          <Row label={props.breakdownLabels.ai} value={props.breakdown.ai} />
          <Row label={props.breakdownLabels.integrations} value={props.breakdown.integrations} />
          <Row label={props.breakdownLabels.support} value={props.breakdown.support} />
          <Row label={props.breakdownLabels.setup} value={props.breakdown.setup} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border border-slate-200 rounded-xl p-3">
      <span className="shrink-0 text-slate-500 min-w-28">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}