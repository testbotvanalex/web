export default function Home() {
  return (
    <main className="bg-white text-gray-800 font-sans">
      {/* Hero */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <img
            src="/logo.png"
            alt="Botmatic Logo"
            className="mx-auto mb-6 w-24 h-24 object-contain"
          />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Botmatic</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto">
            Автоматизация маркетинга и чат‑боты для роста бизнеса
          </p>
        </div>
      </header>

      {/* Что мы делаем */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-4">Что мы делаем</h2>
        <p className="leading-relaxed">
          Botmatic — это платформа для автоматизации маркетинга с поддержкой
          Facebook и Instagram чат‑ботов, email/SMS‑рассылок и интеграций с
          e‑commerce. Мы помогаем компаниям экономить время, повышать продажи и
          улучшать клиентский сервис.
        </p>
      </section>

      {/* Наши возможности */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-6">Наши возможности</h2>
          <ul className="grid md:grid-cols-2 gap-6 list-disc list-inside">
            <li>Визуальный конструктор чат‑ботов</li>
            <li>Автоматизация Facebook и Instagram</li>
            <li>Email и SMS маркетинг</li>
            <li>Интеграция с интернет‑магазинами</li>
            <li>Планирование и автопостинг в соцсети</li>
          </ul>
        </div>
      </section>

      {/* Контакты */}
      <section className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Свяжитесь с нами</h2>
        <a
          href="mailto:info@botmatic.be"
          className="text-indigo-600 hover:underline text-lg"
        >
          info@botmatic.be
        </a>
      </section>
    </main>
  );
}