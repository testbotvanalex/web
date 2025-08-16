export default function Home() {
  return (
    <main className="bg-white text-gray-800">
      {/* Hero */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Botmatic</h1>
          <p className="text-lg">
            Автоматизация маркетинга и чат‑боты для роста бизнеса
          </p>
        </div>
      </header>

      {/* Описание */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-4">Что мы делаем</h2>
        <p>
          Botmatic — это платформа для автоматизации маркетинга с поддержкой
          Facebook и Instagram чат‑ботов, email/SMS‑рассылок и интеграций с
          e‑commerce.
        </p>
      </section>
    </main>
  );
}