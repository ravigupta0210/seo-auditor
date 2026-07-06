import express from 'express';
import cors from 'cors';
import { auditRouter } from './routes/audit.js';
import { badgeRouter } from './routes/badge.js';
import { feedbackRouter } from './routes/feedback.js';
import { leadsRouter } from './routes/leads.js';
import { ensureSchema, dbEnabled } from './lib/db.js';
import { mailEnabled } from './lib/mailer.js';
import { logger } from './lib/logger.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: false }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => res.json({ ok: true, version: '0.1.0', db: dbEnabled, mail: mailEnabled }));

app.use('/api/audit', auditRouter);
app.use('/api/badge', badgeRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/leads', leadsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

async function start() {
  await ensureSchema();
  app.listen(PORT, () => {
    logger.info({ port: PORT, db: dbEnabled, mail: mailEnabled }, 'seo-auditor backend listening');
  });
}

start();
