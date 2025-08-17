export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
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
          <a href="mailto:hello@botmatic.be" className="rounded-2xl px-5 py-3 bg-white text-black font-semibold">
            Связаться
          </a>
          <a href="#pricing" className="rounded-2xl px-5 py-3 border border-white/20">
            Тарифы
          </a>
        </div>
        <footer className="mt-16 text-xs text-white/40">
          21+ Гемблинг может вызывать зависимость. Остановитесь вовремя. Подробнее — www.stopoptijd.be
        </footer>
      </div>
    </main>
  );
}