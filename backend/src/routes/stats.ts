import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { pool } from '../lib/db.js';

export const statsRouter = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN?.trim();

/** Shared auth guard for the owner-only stats routes. Returns true if allowed. */
function authorized(req: Request, res: Response): boolean {
  if (!ADMIN_TOKEN) {
    res.status(403).json({ error: 'Stats are disabled. Set ADMIN_TOKEN on the backend to enable.' });
    return false;
  }
  const key = String(req.query.key ?? '');
  if (key.length !== ADMIN_TOKEN.length || key !== ADMIN_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  if (!pool) {
    res.status(503).json({ error: 'No database configured (DATABASE_URL unset).' });
    return false;
  }
  return true;
}

/**
 * GET /api/stats?key=<ADMIN_TOKEN>
 * Owner-only usage dashboard data: aggregate counts, a 30-day audits time
 * series, and recent rows for audits, email leads, feedback, and sent emails.
 */
statsRouter.get('/', async (req: Request, res: Response) => {
  if (!authorized(req, res)) return;

  try {
    const [totals, overTime, recentFeedback, recentLeads, topUrls, recentAudits, sentEmails] = await Promise.all([
      pool!.query(`
        select
          (select count(*)::int from audits)                         as audits_run,
          (select count(*)::int from email_leads)                    as emails_captured,
          (select count(distinct email)::int from email_leads)       as unique_emails,
          (select count(*)::int from email_leads where report_sent)  as report_emails_sent,
          (select count(*)::int from sent_emails where success)      as emails_sent_total,
          (select count(*)::int from feedback)                       as feedback_received
      `),
      pool!.query(`
        select to_char(d, 'YYYY-MM-DD') as day, coalesce(c.n, 0)::int as n
        from generate_series(current_date - interval '29 days', current_date, interval '1 day') d
        left join (
          select date_trunc('day', created_at)::date as day, count(*) as n
          from audits group by 1
        ) c on c.day = d::date
        order by d
      `),
      pool!.query(`select created_at, name, email, message, url from feedback order by created_at desc limit 25`),
      pool!.query(`select created_at, email, url, report_sent from email_leads order by created_at desc limit 30`),
      pool!.query(`select url, count(*)::int as n, round(avg(overall_score))::int as avg_score
                   from audits group by url order by n desc, url asc limit 15`),
      pool!.query(`select created_at, url, scope, overall_score from audits order by created_at desc limit 15`),
      pool!.query(`select created_at, to_email, kind, subject, success from sent_emails order by created_at desc limit 30`),
    ]);

    res.json({
      totals: totals.rows[0],
      auditsOverTime: overTime.rows,
      recentFeedback: recentFeedback.rows,
      recentLeads: recentLeads.rows,
      topUrls: topUrls.rows,
      recentAudits: recentAudits.rows,
      sentEmails: sentEmails.rows,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, 'stats query failed');
    res.status(500).json({ error: 'Query failed' });
  }
});

function csvEscape(v: unknown): string {
  if (v == null) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');
}

/**
 * GET /api/stats/export?key=<ADMIN_TOKEN>&type=leads|feedback|audits
 * Streams the full table as a CSV download.
 */
statsRouter.get('/export', async (req: Request, res: Response) => {
  if (!authorized(req, res)) return;
  const type = String(req.query.type ?? 'leads');

  try {
    let headers: string[];
    let rows: unknown[][];
    if (type === 'leads') {
      const r = await pool!.query(`select created_at, email, url, report_sent from email_leads order by created_at desc`);
      headers = ['created_at', 'email', 'audited_url', 'report_sent'];
      rows = r.rows.map((x) => [x.created_at, x.email, x.url, x.report_sent]);
    } else if (type === 'feedback') {
      const r = await pool!.query(`select created_at, name, email, message, url from feedback order by created_at desc`);
      headers = ['created_at', 'name', 'email', 'message', 'page'];
      rows = r.rows.map((x) => [x.created_at, x.name, x.email, x.message, x.url]);
    } else if (type === 'audits') {
      const r = await pool!.query(`select created_at, url, scope, overall_score, pages_analyzed from audits order by created_at desc`);
      headers = ['created_at', 'url', 'scope', 'overall_score', 'pages_analyzed'];
      rows = r.rows.map((x) => [x.created_at, x.url, x.scope, x.overall_score, x.pages_analyzed]);
    } else {
      res.status(400).json({ error: 'type must be leads, feedback, or audits' });
      return;
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
    res.send(toCsv(headers, rows));
  } catch (err) {
    logger.error({ err, type }, 'stats export failed');
    res.status(500).json({ error: 'Export failed' });
  }
});
