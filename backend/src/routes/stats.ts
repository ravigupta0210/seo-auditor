import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { pool } from '../lib/db.js';

export const statsRouter = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN?.trim();

/**
 * GET /api/stats?key=<ADMIN_TOKEN>
 * Owner-only usage dashboard data. Disabled unless ADMIN_TOKEN is set, and the
 * caller must pass a matching key. Returns aggregate counts + recent rows for
 * audits, email leads, and feedback.
 */
statsRouter.get('/', async (req: Request, res: Response) => {
  if (!ADMIN_TOKEN) {
    res.status(403).json({ error: 'Stats are disabled. Set ADMIN_TOKEN on the backend to enable.' });
    return;
  }
  const key = String(req.query.key ?? '');
  if (key.length !== ADMIN_TOKEN.length || key !== ADMIN_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!pool) {
    res.status(503).json({ error: 'No database configured (DATABASE_URL unset).' });
    return;
  }

  try {
    const [totals, recentFeedback, recentLeads, topUrls, recentAudits] = await Promise.all([
      pool.query(`
        select
          (select count(*)::int from audits)                        as audits_run,
          (select count(*)::int from email_leads)                   as emails_captured,
          (select count(distinct email)::int from email_leads)      as unique_emails,
          (select count(*)::int from email_leads where report_sent) as report_emails_sent,
          (select count(*)::int from feedback)                      as feedback_received
      `),
      pool.query(`select created_at, name, email, message, url from feedback order by created_at desc limit 25`),
      pool.query(`select created_at, email, url, report_sent from email_leads order by created_at desc limit 30`),
      pool.query(`select url, count(*)::int as n, round(avg(overall_score))::int as avg_score
                  from audits group by url order by n desc, url asc limit 15`),
      pool.query(`select created_at, url, scope, overall_score from audits order by created_at desc limit 15`),
    ]);

    res.json({
      totals: totals.rows[0],
      recentFeedback: recentFeedback.rows,
      recentLeads: recentLeads.rows,
      topUrls: topUrls.rows,
      recentAudits: recentAudits.rows,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'stats query failed');
    res.status(500).json({ error: 'Query failed' });
  }
});
