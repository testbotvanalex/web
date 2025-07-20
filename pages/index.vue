<template>
  <div class="hero">
    <div class="container">
      <h1>Custom Chatbots for WhatsApp, Telegram, Instagram</h1>
      <p class="subtitle">
        Get a bot for sales, support or automation.<br />
        No coding. Delivered in 48h. Fully personalized.
      </p>
      <div class="grid">
        <div class="card">
          <h3>🧩 Fully Custom</h3>
          <p>Each bot is built for your specific business case.</p>
        </div>
        <div class="card">
          <h3>🤖 AI-Powered</h3>
          <p>Auto-replies, smart logic, and GPT answers built-in.</p>
        </div>
        <div class="card">
          <h3>⚡ Fast Setup</h3>
          <p>Ready to use in 1–2 days. No tech skills needed.</p>
        </div>
      </div>
      <a href="https://t.me/botmatic" target="_blank" class="btn">Talk to us on Telegram</a>
    </div>
  </div>

  <section class="use-cases">
    <div class="container">
      <h2>Who is it for?</h2>
      <p class="subtitle">Perfect for small businesses, creators, and local services</p>
      <div class="grid">
        <div class="card">
          <h3>🛍️ Webshops & Stores</h3>
          <p>Handle orders, questions and promos automatically.</p>
        </div>
        <div class="card">
          <h3>💬 Coaches & Experts</h3>
          <p>Answer FAQs, collect leads, and close clients 24/7.</p>
        </div>
        <div class="card">
          <h3>📦 Local Services</h3>
          <p>Bookings, reminders, info — all handled by your bot.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 100vh;
  background: #f5f8fb;
  color: #1e1e1e;
  padding: 2rem;
}
.container {
  max-width: 960px;
  margin: auto;
  padding: 2rem 1rem;
}
.subtitle {
  font-size: 1.1rem;
  margin: 1rem 0 2rem;
  color: #666;
}
.grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: transform 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
}
.btn {
  background: #007aff;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  transition: background 0.2s;
}
.btn:hover {
  background: #005fcc;
}
.use-cases {
  background: #f9fafb;
  padding: 4rem 1rem 2rem;
  text-align: center;
}
.use-cases h2 {
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  color: #111;
}
@media(min-width: 640px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
