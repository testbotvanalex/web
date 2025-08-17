import Header from "@/components/Header";
import Pricing from "@/components/Pricing";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-950 text-white">
        {/* Hero */}
        <section className="min-h-[85vh] flex items-center justify-center px-6 pt-20">
          <div className="max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
              <span>BotMatic</span><span>•</span><span>Запуск новой версии</span>
            </div>
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
              Умные чат-боты, которые реально приносят деньги
            </h1>
            <p className="mt-4 text-white/70">
              WhatsApp/Telegram/сайт. Диагностика, запись, оплата, интеграции с CRM.
              Под ключ — от лид-магнита до сделки.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#contact" className="rounded-2xl px-5 py-3 bg-white text-black font-semibold">
                Связаться
              </a>
              <a href="#pricing" className="rounded-2xl px-5 py-3 border border-white/20">
                Тарифы
              </a>
            </div>
          </div>
        </section>

        {/* Оффер/пункты */}
        <section id="offer" className="py-14">
          <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-6">
            {[
              ["Быстрый старт","Готовые шаблоны под ниши и кнопочный UX."],
              ["AI-офферы","Персональные предложения по ответам клиента."],
              ["Интеграции","Bitrix24, Google Sheets, Webhooks, платёжки."]
            ].map(([t,s])=>(
              <div key={t} className="rounded-2xl border border-white/10 p-6">
                <h3 className="font-bold text-lg">{t}</h3>
                <p className="text-white/70 mt-2">{s}</p>
              </div>
            ))}
          </div>
        </section>

        <Pricing />

        {/* Контакты */}
        <section id="contact" className="py-16">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold">Связаться</h2>
            <p className="text-white/70 mt-2">Расскажи про бизнес и цель, предложу сценарий и цену.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:hello@botmatic.be" className="rounded-2xl px-5 py-3 bg-white text-black font-semibold">hello@botmatic.be</a>
              <a href="https://wa.me/XXXXXXXXXXX" className="rounded-2xl px-5 py-3 border border-white/20">WhatsApp</a>
            </div>
            <p className="mt-10 text-xs text-white/40">
              21+ Гемблинг может вызывать зависимость. Остановитесь вовремя. Подробнее — www.stopoptijd.be
            </p>
          </div>
        </section>
      </main>
    </>
  );
}