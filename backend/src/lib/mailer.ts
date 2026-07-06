/**
 * Email delivery via Brevo's HTTP API (https://api.brevo.com/v3/smtp/email).
 *
 * We use HTTP (port 443) instead of SMTP because Render's free tier blocks all
 * outbound SMTP ports (25/465/587). HTTPS can't be blocked without breaking the
 * server itself.
 *
 * Config (all optional — mailer degrades to a no-op + log when unset):
 *   BREVO_API_KEY  Brevo API key (Brevo → SMTP & API → API Keys)
 *   MAIL_FROM      Verified Brevo sender. "Name <email>" or just the email.
 *                  (Verify the address in Brevo → Senders first.)
 *   FEEDBACK_TO    Where feedback notifications go (defaults to the sender email)
 *   APP_URL        Public frontend origin for report links
 */
import { logger } from './logger.js';
import type { AuditReport } from './store.js';

const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim();
const APP_URL = (process.env.APP_URL?.trim() || 'https://freeseoaudit.vercel.app').replace(/\/$/, '');

// Parse MAIL_FROM as either "Name <email>" or a bare email address.
function parseSender(raw: string | undefined): { name: string; email: string } | null {
  if (!raw) return null;
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m && m[2]) return { name: m[1] || 'Free SEO Audit', email: m[2].trim() };
  const email = raw.trim();
  return email ? { name: 'Free SEO Audit', email } : null;
}

const SENDER = parseSender(process.env.MAIL_FROM);
const FEEDBACK_TO = process.env.FEEDBACK_TO?.trim() || SENDER?.email;

export const mailEnabled = Boolean(BREVO_API_KEY && SENDER);

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

async function send(opts: { to: string; subject: string; html: string; text: string; replyTo?: string }): Promise<boolean> {
  if (!mailEnabled || !SENDER) {
    logger.warn({ to: opts.to, subject: opts.subject }, 'mailer disabled (BREVO_API_KEY/MAIL_FROM unset) — email not sent');
    return false;
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15_000);
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY!,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text,
        ...(opts.replyTo ? { replyTo: { email: opts.replyTo } } : {}),
      }),
      signal: ac.signal,
    });
    if (res.status >= 200 && res.status < 300) return true;
    const body = await res.text().catch(() => '');
    logger.error({ status: res.status, body: body.slice(0, 500), to: opts.to }, 'Brevo send failed');
    return false;
  } catch (err) {
    logger.error({ err, to: opts.to }, 'Brevo send threw');
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function gradeLetter(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/** Email a user the summary + link to their saved audit report. */
export async function sendReportEmail(to: string, report: AuditReport): Promise<boolean> {
  const { summary, url, id, scope } = report;
  const reportUrl = `${APP_URL}/audit/${id}`;
  const t = summary?.totals ?? { error: 0, warning: 0, info: 0, pass: 0 };
  const score = summary?.overall ?? 0;

  // Top issues: errors first, then warnings, capped at 8.
  const issues = report.pages
    .flatMap((p) => p.checks)
    .concat(report.siteChecks ?? [])
    .filter((c) => c.severity === 'error' || c.severity === 'warning')
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
      return (b.priority ?? 0) - (a.priority ?? 0);
    })
    .slice(0, 8);

  const issueRows = issues
    .map(
      (c) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:${
          c.severity === 'error' ? '#c0392b' : '#b7791f'
        };font-weight:600;text-transform:uppercase;font-size:11px;vertical-align:top">${c.severity}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:14px">${esc(c.title)}</td></tr>`,
    )
    .join('');

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="margin:0 0 4px">Your SEO + GEO audit is ready</h2>
    <p style="margin:0 0 16px;color:#555;font-size:14px">${esc(url)} · ${scope === 'site' ? 'Full-site crawl' : 'Single-page audit'}</p>
    <div style="display:inline-block;background:#0f172a;color:#fff;border-radius:12px;padding:14px 22px;margin-bottom:16px">
      <span style="font-size:34px;font-weight:800">${score}</span>
      <span style="font-size:15px;opacity:.8">/100 · Grade ${gradeLetter(score)}</span>
    </div>
    <p style="margin:0 0 16px;font-size:14px">
      <strong style="color:#c0392b">${t.error}</strong> errors ·
      <strong style="color:#b7791f">${t.warning}</strong> warnings ·
      <strong style="color:#2563eb">${t.info}</strong> info ·
      <strong style="color:#16a34a">${t.pass}</strong> passed
    </p>
    ${issueRows ? `<h3 style="font-size:15px;margin:18px 0 8px">Top things to fix</h3>
      <table style="width:100%;border-collapse:collapse">${issueRows}</table>` : ''}
    <p style="margin:22px 0">
      <a href="${reportUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block">View the full report →</a>
    </p>
    <p style="color:#888;font-size:12px;margin-top:24px">You asked us to email this from freeseoaudit.vercel.app. Reports are kept so this link stays live. Reply to this email with any feedback.</p>
  </div>`;

  const text =
    `Your SEO + GEO audit for ${url} is ready.\n\n` +
    `Score: ${score}/100 (Grade ${gradeLetter(score)})\n` +
    `${t.error} errors, ${t.warning} warnings, ${t.info} info, ${t.pass} passed.\n\n` +
    (issues.length ? `Top things to fix:\n${issues.map((c) => `- [${c.severity}] ${c.title}`).join('\n')}\n\n` : '') +
    `View the full report: ${reportUrl}\n`;

  return send({ to, subject: `Your SEO audit for ${url} — score ${score}/100`, html, text });
}

/** Notify the site owner of new feedback. */
export async function sendFeedbackEmail(fb: {
  name?: string;
  email?: string;
  message: string;
  url?: string;
  userAgent?: string;
}): Promise<boolean> {
  if (!FEEDBACK_TO) {
    logger.warn('sendFeedbackEmail: no FEEDBACK_TO/MAIL_FROM configured');
    return false;
  }
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;color:#1a1a1a">
    <h2 style="margin:0 0 12px">New feedback on Free SEO Audit</h2>
    <table style="border-collapse:collapse;font-size:14px">
      <tr><td style="padding:4px 10px 4px 0;color:#888">Name</td><td>${esc(fb.name || '—')}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#888">Email</td><td>${esc(fb.email || '—')}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#888">Page</td><td>${esc(fb.url || '—')}</td></tr>
    </table>
    <h3 style="font-size:14px;margin:16px 0 6px">Message</h3>
    <p style="white-space:pre-wrap;font-size:15px;background:#f6f6f6;padding:12px 14px;border-radius:8px;margin:0">${esc(fb.message)}</p>
    <p style="color:#aaa;font-size:11px;margin-top:16px">${esc(fb.userAgent || '')}</p>
  </div>`;
  const text =
    `New feedback on Free SEO Audit\n\n` +
    `Name: ${fb.name || '—'}\nEmail: ${fb.email || '—'}\nPage: ${fb.url || '—'}\n\n` +
    `Message:\n${fb.message}\n`;

  return send({
    to: FEEDBACK_TO,
    subject: `Feedback${fb.name ? ` from ${fb.name}` : ''} — Free SEO Audit`,
    html,
    text,
    replyTo: fb.email || undefined,
  });
}
