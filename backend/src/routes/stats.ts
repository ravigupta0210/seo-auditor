import type { Request, Response } from 'express';
import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { pool } from '../lib/db.js';
import { store } from '../lib/store.js';
import { sendReportEmail } from '../lib/mailer.js';
import { requireAdminAndDb } from '../lib/adminAuth.js';

export const statsRouter = Router();

// SQL for the full list of each data type (used by both dashboard + CSV export).
const LIST_SQL: Record<string, string> = {
  leads: `select created_at, email, url, report_sent, audit_id from email_leads order by created_at desc`,
  feedback: `select created_at, name, email, message, url from feedback order by created_at desc`,
  audits: `select created_at, url, scope, overall_score, pages_analyzed from audits order by created_at desc`,
  sent: `select created_at, to_email, kind, subject, success, audit_id from sent_emails order by created_at desc`,
};

/**
 * GET /api/stats?key=<ADMIN_TOKEN>&days=7|30|90
 * Aggregate counts, an audits time series, and recent rows per section.
 */
statsRouter.get('/', async (req: Request, res: Response) => {
  if (!requireAdminAndDb(req, res)) return;
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;

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
      pool!.query(
        `select to_char(d, 'YYYY-MM-DD') as day, coalesce(c.n, 0)::int as n
         from generate_series(current_date - ($1::int - 1) * interval '1 day', current_date, interval '1 day') d
         left join (select date_trunc('day', created_at)::date as day, count(*) as n from audits group by 1) c
           on c.day = d::date
         order by d`,
        [days],
      ),
      pool!.query(`select created_at, name, email, message, url from feedback order by created_at desc limit 25`),
      pool!.query(`select created_at, email, url, report_sent, audit_id from email_leads order by created_at desc limit 25`),
      pool!.query(`select url, count(*)::int as n, round(avg(overall_score))::int as avg_score
                   from audits group by url order by n desc, url asc limit 15`),
      pool!.query(`select created_at, url, scope, overall_score from audits order by created_at desc limit 25`),
      pool!.query(`select created_at, to_email, kind, subject, success, audit_id from sent_emails order by created_at desc limit 25`),
    ]);

    res.json({
      days,
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

/**
 * GET /api/stats/list?key=&type=leads|feedback|audits|sent
 * Full rows (capped at 1000) for browsing in the dashboard.
 */
statsRouter.get('/list', async (req: Request, res: Response) => {
  if (!requireAdminAndDb(req, res)) return;
  const type = String(req.query.type ?? '');
  const sql = LIST_SQL[type];
  if (!sql) {
    res.status(400).json({ error: 'type must be leads, feedback, audits, or sent' });
    return;
  }
  try {
    const r = await pool!.query(`${sql} limit 1000`);
    res.json({ type, rows: r.rows, truncated: r.rows.length === 1000 });
  } catch (err) {
    logger.error({ err, type }, 'stats list failed');
    res.status(500).json({ error: 'Query failed' });
  }
});

/**
 * POST /api/stats/resend?key=   body: { email, auditId }
 * Re-sends the report email for a saved audit to the given address.
 */
statsRouter.post('/resend', async (req: Request, res: Response) => {
  if (!requireAdminAndDb(req, res)) return;
  const email = String(req.body?.email ?? '').trim();
  const auditId = String(req.body?.auditId ?? '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !/^[0-9a-f-]{36}$/i.test(auditId)) {
    res.status(400).json({ error: 'Valid email and auditId are required.' });
    return;
  }
  const report = await store.get(auditId);
  if (!report) {
    res.status(404).json({ error: 'Report not found (it may have been created before persistence was enabled).' });
    return;
  }
  const emailed = await sendReportEmail(email, report);
  if (emailed) {
    try {
      await pool!.query('UPDATE email_leads SET report_sent = true WHERE audit_id = $1 AND email = $2', [auditId, email]);
    } catch (err) {
      logger.error({ err }, 'resend: failed to mark report_sent');
    }
  }
  res.json({ ok: true, emailed });
});

function csvEscape(v: unknown): string {
  if (v == null) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/stats/export?key=&type=leads|feedback|audits
 * Streams the full table as a CSV download.
 */
statsRouter.get('/export', async (req: Request, res: Response) => {
  if (!requireAdminAndDb(req, res)) return;
  const type = String(req.query.type ?? 'leads');
  const sql = LIST_SQL[type];
  if (!sql) {
    res.status(400).json({ error: 'type must be leads, feedback, audits, or sent' });
    return;
  }
  try {
    const r = await pool!.query(sql);
    const headers = r.fields.map((f) => f.name);
    const body = [
      headers.join(','),
      ...r.rows.map((row) => headers.map((h) => csvEscape((row as Record<string, unknown>)[h])).join(',')),
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
    res.send(body);
  } catch (err) {
    logger.error({ err, type }, 'stats export failed');
    res.status(500).json({ error: 'Export failed' });
  }
});
