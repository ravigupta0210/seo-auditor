import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { pool } from '../lib/db.js';
import { sendFeedbackEmail } from '../lib/mailer.js';
import { rateLimit } from '../lib/ratelimit.js';

export const feedbackRouter = Router();

const FeedbackBody = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  message: z.string().min(3).max(5000),
  url: z.string().max(2048).optional(),
  // Honeypot: real users leave this empty; bots fill it. Accept any value here so
  // we can silently drop it below rather than returning a validation error that
  // tips off the bot.
  website: z.string().max(200).optional(),
});

// POST /api/feedback — store feedback + email the site owner.
feedbackRouter.post('/', async (req: Request, res: Response) => {
  if (!rateLimit(req, 'feedback', 5, 60_000)) {
    res.status(429).json({ error: 'Too many requests, please try again shortly.' });
    return;
  }
  const parsed = FeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }
  const { name, email, message, url, website } = parsed.data;
  if (website) {
    // Honeypot tripped — pretend success, drop silently.
    res.json({ ok: true });
    return;
  }
  const userAgent = String(req.headers['user-agent'] ?? '').slice(0, 300);
  const log = logger.child({ route: 'feedback' });

  if (pool) {
    try {
      await pool.query(
        'INSERT INTO feedback (name, email, message, url, user_agent) VALUES ($1, $2, $3, $4, $5)',
        [name ?? null, email || null, message, url ?? null, userAgent],
      );
    } catch (err) {
      log.error({ err }, 'failed to persist feedback');
    }
  }

  const emailed = await sendFeedbackEmail({ name, email: email || undefined, message, url, userAgent });
  log.info({ emailed }, 'feedback received');
  res.json({ ok: true });
});
