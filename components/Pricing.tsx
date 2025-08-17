type Plan = { name: string; price: string; features: string[]; cta: string; popular?: boolean; };
const plans: Plan[] = [
  { name: "Basis", price: "€29/мес", features: ["1 канал (напр., WhatsApp)", "1 сценарий (FAQ/запись)", "до 500 диалогов"], cta: "Выбрать" },
  { name: "Standaard", price: "€99/мес", features: ["2 канала", "несколько сценариев", "до 2 000 диалогов", "приоритетные апдейты"], cta: "Самый популярный", popular: true },
  { name: "Premium", price: "€299/мес", features: ["Все каналы + интеграции", "AI-оферы и оплата", "безлимит диалогов", "выделенный PM"], cta: "Запросить демо" }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-center">Тарифы</h2>
        <p className="text-white/70 text-center mt-2">Прозрачно. Можно отменить в любой момент.</p>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {plans.map(p => (
            <div key={p.name} className={`rounded-2xl border border-white/10 p-6 ${p.popular ? "ring-2 ring-white/40" : ""}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="text-white/80">{p.price}</div>
              </div>
              <ul className="mt-4 space-y-2 text-white/80">
                {p.features.map(f => <li key={f} className="flex gap-2"><span>•</span><span>{f}</span></li>)}
              </ul>
              <a href="#contact" className="mt-6 inline-block w-full text-center rounded-xl bg-white text-black font-semibold py-2">
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}