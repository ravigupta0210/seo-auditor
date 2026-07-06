/**
 * Email delivery via Gmail SMTP (nodemailer).
 *
 * Config (all optional — mailer degrades to a no-op + log when unset):
 *   SMTP_USER   Gmail address that sends (e.g. gravi5964@gmail.com)
 *   SMTP_PASS   Gmail *App Password* (16 chars, needs 2-Step Verification on)
 *   FEEDBACK_TO Where feedback notifications go (defaults to SMTP_USER)
 *   MAIL_FROM   Display From (defaults to "Free SEO Audit <SMTP_USER>")
 *   APP_URL     Public frontend origin for report links
 */
import nodemailer from 'nodemailer';
import { logger } from './logger.js';
import type { AuditReport } from './store.js';

const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASS = process.env.SMTP_PASS?.trim();
const FEEDBACK_TO = process.env.FEEDBACK_TO?.trim() || SMTP_USER;
const MAIL_FROM = process.env.MAIL_FROM?.trim() || (SMTP_USER ? `Free SEO Audit <${SMTP_USER}>` : undefined);
const APP_URL = (process.env.APP_URL?.trim() || 'https://freeseoaudit.vercel.app').replace(/\/$/, '');

export const mailEnabled = Boolean(SMTP_USER && SMTP_PASS);

const transporter = mailEnabled
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

async function send(opts: { to: string; subject: string; html: string; text: string; replyTo?: string }): Promise<boolean> {
  if (!transporter) {
    logger.warn({ to: opts.to, subject: opts.subject }, 'mailer disabled (SMTP_USER/SMTP_PASS unset) — email not sent');
    return false;
  }
  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    return true;
  } catch (err) {
    logger.error({ err, to: opts.to }, 'sendMail failed');
    return false;
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
    logger.warn('sendFeedbackEmail: no FEEDBACK_TO/SMTP_USER configured');
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
