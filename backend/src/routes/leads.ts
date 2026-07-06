import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { pool } from '../lib/db.js';
import { store } from '../lib/store.js';
import { sendReportEmail, mailEnabled } from '../lib/mailer.js';
import { rateLimit } from '../lib/ratelimit.js';

export const leadsRouter = Router();

const LeadBody = z.object({
  email: z.string().email().max(254),
  auditId: z.string().regex(/^[0-9a-f-]{36}$/i).optional(),
  url: z.string().url().max(2048).optional(),
});

// POST /api/leads — capture an email that wants its report, then send it.
leadsRouter.post('/', async (req: Request, res: Response) => {
  if (!rateLimit(req, 'leads', 10, 60_000)) {
    res.status(429).json({ error: 'Too many requests, please try again shortly.' });
    return;
  }
  const parsed = LeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }
  const { email, auditId, url } = parsed.data;
  const log = logger.child({ route: 'leads', email, auditId });

  // Persist the lead (best-effort — never block the email on the DB).
  if (pool) {
    try {
      await pool.query(
        'INSERT INTO email_leads (email, audit_id, url) VALUES ($1, $2, $3)',
        [email, auditId ?? null, url ?? null],
      );
    } catch (err) {
      log.error({ err }, 'failed to persist email lead');
    }
  }

  // Send the report email if we have the report.
  let emailed = false;
  if (auditId) {
    const report = await store.get(auditId);
    if (report) {
      emailed = await sendReportEmail(email, report);
      if (emailed && pool) {
        try {
          await pool.query(
            'UPDATE email_leads SET report_sent = true WHERE audit_id = $1 AND email = $2',
            [auditId, email],
          );
        } catch (err) {
          log.error({ err }, 'failed to mark report_sent');
        }
      }
    } else {
      log.warn('report not found for auditId; lead stored but no email sent');
    }
  }

  log.info({ emailed, mailEnabled }, 'lead captured');
  res.json({ ok: true, emailed });
});
