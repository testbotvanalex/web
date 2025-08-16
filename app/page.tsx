export default function Home() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem',
        lineHeight: 1.6,
        color: '#222',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <img
          src="/logo.png"
          alt="Botmatic Logo"
          style={{ height: '80px', marginBottom: '1rem' }}
        />
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Botmatic</h1>
        <p style={{ fontSize: '1.2rem', color: '#555' }}>
          Автоматизация маркетинга и чат‑боты для роста бизнеса
        </p>
      </header>

      <section style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2>Что мы делаем</h2>
        <p>
          Botmatic — это платформа для автоматизации маркетинга с поддержкой
          Facebook и Instagram чат‑ботов, email/SMS‑рассылок и интеграций с
          e‑commerce. Мы помогаем компаниям экономить время, повышать продажи и
          улучшать клиентский сервис.
        </p>
      </section>

      <section
        style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: '#f9f9f9',
          borderRadius: '8px',
        }}
      >
        <h2>Наши возможности</h2>
        <ul>
          <li>Визуальный конструктор чат‑ботов</li>
          <li>Автоматизация Facebook и Instagram</li>
          <li>Email и SMS маркетинг</li>
          <li>Интеграция с интернет‑магазинами</li>
          <li>Планирование и автопостинг в соцсети</li>
        </ul>
      </section>

      <section style={{ marginTop: '3rem', textAlign: 'center' }}>
        <h2>Свяжитесь с нами</h2>
        <p>Email: <a href="mailto:info@botmatic.be">info@botmatic.be</a></p>
      </section>
    </main>
  );
}