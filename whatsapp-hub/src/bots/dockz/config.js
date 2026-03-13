export const cfg = {
  BASE_URL: process.env.BASE_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  DOWNLOAD_TOKEN_SECRET: process.env.DOWNLOAD_TOKEN_SECRET || 'secret',
  LINK_TTL_SECONDS: Number(process.env.LINK_TTL_SECONDS || 86400),
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'mock'
};