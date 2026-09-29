import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { getDb } from './db/client.js';
import { runSeed } from './db/seed.js';
import incidentRoutes from './routes/incidentRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api', incidentRoutes);
app.use('/api', memoryRoutes);
app.use('/api', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'IncidentMind Backend API',
    hindsightBank: config.hindsightBankId,
    timestamp: new Date().toISOString()
  });
});

// Centralized Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  const db = await getDb();

  // Check if database needs seeding
  const countRow = await db.get<{ count: number }>(`SELECT COUNT(*) as count FROM incidents`);
  if (!countRow || countRow.count === 0) {
    console.log('[Server Startup] Database empty. Running seed initializer...');
    await runSeed();
  }

  if (!process.env.VERCEL) {
    app.listen(config.port, () => {
      console.log(`
🚀 ==================================================
   IncidentMind Autonomous AI Incident Agent Backend
==================================================
   Server Running: http://localhost:${config.port}
   Hindsight Bank: ${config.hindsightBankId}
   LLM Provider:   ${config.llmProvider}
==================================================
      `);
    });
  }
}

// Auto-initialize DB on serverless invocation or server startup
startServer().catch((err) => {
  console.error('Failed to initialize IncidentMind backend server:', err);
});

export default app;
