import 'dotenv/config';
import express from 'express';
import webhookRouter from './routes/webhook.js';
import adminRouter from './routes/admin.js';
import { loadBots } from './core/router.js';
import './db/db.js';
import { startScheduler } from './scheduler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/webhook', webhookRouter);
app.use('/admin', adminRouter);

async function start() {
    console.log('🚀 Starting server initialization...');
    
    console.log('⏳ Loading bots...');
    await loadBots();
    console.log('✅ Bots loaded.');

    console.log('⏳ Starting scheduler...');
    startScheduler();
    console.log('✅ Scheduler started.');

    app.listen(PORT, () => {
        console.log(`🚀 Multi-tenant WhatsApp server running on port ${PORT}`);
        console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook`);
        console.log(`🔧 Admin API: http://localhost:${PORT}/admin`);
    });
}

start().catch(console.error);
