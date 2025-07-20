export default defineNuxtConfig({
  ssr: true,
  app: {
    head: {
      title: 'BotMatic',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Custom WhatsApp & Telegram Chatbots in 48h' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' }
      ]
    }
  }
})