'use client';

import { motion } from 'framer-motion';

export default function Home() {
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <main className="bg-white text-gray-800 font-sans scroll-smooth">
      {/* Hero */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-0 z-50 shadow">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <motion.img
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            src="/logo.png"
            alt="Botmatic Logo"
            className="mx-auto mb-6 w-24 h-24 object-contain"
          />
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Botmatic
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-8"
          >
            Автоматизация маркетинга и чат‑боты для роста бизнеса
          </motion.p>
          <motion.a
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            href="#cta"
            className="inline-block bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-full shadow hover:bg-yellow-300 transition"
          >
            Попробовать бесплатно
          </motion.a>
        </div>
      </header>

      {/* Что мы делаем */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-2xl font-semibold mb-4"
        >
          Что мы делаем
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="leading-relaxed"
        >
          Botmatic — это платформа для автоматизации маркетинга с поддержкой
          Facebook и Instagram чат‑ботов, email/SMS‑рассылок и интеграций с
          e‑commerce. Мы помогаем компаниям экономить время, повышать продажи и
          улучшать клиентский сервис.
        </motion.p>
      </section>

      {/* Наши возможности */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-2xl font-semibold mb-6"
          >
            Наши возможности
          </motion.h2>
          <ul className="grid md:grid-cols-2 gap-6 list-disc list-inside">
            {[
              'Визуальный конструктор чат‑ботов',
              'Автоматизация Facebook и Instagram',
              'Email и SMS маркетинг',
              'Интеграция с интернет‑магазинами',
              'Планирование и автопостинг в соцсети',
            ].map((item, idx) => (
              <motion.li
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white p-4 rounded shadow hover:shadow-lg transition"
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA секция */}
      <section id="cta" className="bg-indigo-600 text-white py-16 text-center">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-3xl font-bold mb-4"
        >
          Начните автоматизировать уже сегодня
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-8 max-w-xl mx-auto"
        >
          Зарегистрируйтесь и настройте своего первого чат‑бота за 10 минут —
          без программистов и лишних затрат.
        </motion.p>
        <motion.a
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          href="https://botmatic.be/signup"
          className="inline-block bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-full shadow hover:bg-yellow-300 transition"
        >
          Создать аккаунт
        </motion.a>
      </section>

      {/* Контакты */}
      <section className="max-w-6xl mx-auto px-4 py-12 text-center">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-2xl font-semibold mb-4"
        >
          Свяжитесь с нами
        </motion.h2>
        <motion.a
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          href="mailto:info@botmatic.be"
          className="text-indigo-600 hover:underline text-lg"
        >
          info@botmatic.be
        </motion.a>
      </section>
    </main>
  );
}