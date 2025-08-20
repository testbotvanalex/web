// components/Pricing.tsx
"use client";
import { useState } from "react";
import type { Lang, LocaleDict, Plan } from "@/lib/i18n";

type Props = { lang: Lang; tr: LocaleDict };

export default function Pricing({ lang, tr }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const waText = (plan: string) =>
    lang === "nl"
      ? `Hoi! Ik wil het ${plan} plan.`
      : lang === "fr"
      ? `Bonjour ! Je veux l'offre ${plan}.`
      : `Hi! I'm interested in the ${plan} plan.`;

  const waLink = (plan: string) =>
    "https://wa.me/32470000000?text=" + encodeURIComponent(waText(plan));

  const toggle = (name: string) => setOpen((o) => (o === name ? null : name));

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="text-slate-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );

  const PlanCard = ({ p }: { p: Plan }) => {
    const isOpen = open === p.name;

    return (
      <div
        className={`group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ${
          p.popular ? "ring-2 ring-indigo-200" : ""
        }`}
      >
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl font-bold">{p.name}</h3>
          {/* Клик по цене открывает детали */}
          <button
            onClick={() => toggle(p.name)}
            className="text-slate-700 text-left hover:text-indigo-700 underline decoration-dotted"
            aria-expanded={isOpen}
            aria-controls={`details-${p.name}`}
          >
            {p.price}
          </button>
        </div>

        <ul className="mt-4 space-y-2 text-slate-700">
          {p.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span>•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* Кнопки действий */}
        <div className="mt-6 grid grid-cols-1 gap-2">
          <a
            href={p.link}
            className="w-full text-center rounded-xl bg-indigo-600 text-white font-semibold py-2 hover:scale-[1.01] hover:bg-indigo-700 transition"
          >
            {p.cta}
          </a>
          <a
            href={waLink(p.name)}
            className="w-full text-center rounded-xl border border-slate-300 bg-white py-2 hover:bg-slate-50 hover:scale-[1.01] transition"
          >
            WhatsApp
          </a>
        </div>

        {p.note && (
          <p className="mt-3 text-xs text-slate-500 leading-snug">{p.note}</p>
        )}

        {/* Детали плана */}
        <div
          id={`details-${p.name}`}
          className={`overflow-hidden transition-[grid-template-rows,opacity] duration-300 mt-6 ${
            isOpen ? "opacity-100 grid-rows-[1fr]" : "opacity-0 grid-rows-[0fr]"
          } grid`}
        >
          <div className="min-h-0">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-semibold mb-3">{tr.detailsTitle}</h4>

              <div className="space-y-2">
                <Row label={tr.detailsLabels.channels} value={p.breakdown.channels} />
                <Row label={tr.detailsLabels.scenarios} value={p.breakdown.scenarios} />
                <Row label={tr.detailsLabels.dialogs} value={p.breakdown.dialogs} />
                <Row label={tr.detailsLabels.ai} value={p.breakdown.ai} />
                <Row
                  label={tr.detailsLabels.integrations}
                  value={p.breakdown.integrations}
                />
                <Row label={tr.detailsLabels.support} value={p.breakdown.support} />
                <Row label={tr.detailsLabels.setup} value={p.breakdown.setup} />
              </div>

              <button
                onClick={() => toggle(p.name)}
                className="mt-4 text-sm text-indigo-700 hover:underline"
              >
                {isOpen ? tr.actions.collapse : tr.actions.expand}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="pricing" className="py-20 bg-white scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center">{tr.pricingTitle}</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {tr.plans.map((p) => (
            <PlanCard key={p.name} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}