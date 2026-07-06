/**
 * Email delivery via the Gmail API over HTTPS.
 *
 * Why not SMTP: Render's free tier blocks outbound SMTP ports (25/465/587).
 * Why not a 3rd-party API with a @gmail.com sender: it fails DMARC → spam.
 * The Gmail API sends over HTTPS (port 443, not blocked) *through Google as the
 * authenticated account*, so it's fully authenticated (SPF/DKIM/DMARC pass) and
 * lands in the inbox. Free, no custom domain needed.
 *
 * Config (all optional — mailer degrades to a no-op + log when unset):
 *   GMAIL_CLIENT_ID      OAuth 2.0 client id (Google Cloud → Credentials)
 *   GMAIL_CLIENT_SECRET  OAuth 2.0 client secret
 *   GMAIL_REFRESH_TOKEN  Refresh token for the sending account (gmail.send scope)
 *   MAIL_FROM            From header, e.g. "Free SEO Audit <freeseoaudit.app@gmail.com>"
 *                        (the email MUST be the authenticated Gmail account)
 *   FEEDBACK_TO          Where feedback notifications go (defaults to the sender email)
 *   APP_URL              Public frontend origin for report links
 */
import { logger } from './logger.js';
import type { AuditReport } from './store.js';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET?.trim();
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN?.trim();
const MAIL_FROM = process.env.MAIL_FROM?.trim() || '';
const APP_URL = (process.env.APP_URL?.trim() || 'https://freeseoaudit.vercel.app').replace(/\/$/, '');

// Extract the bare email from a "Name <email>" or plain-email MAIL_FROM.
function senderEmail(raw: string): string {
  const m = raw.match(/<([^>]+)>/);
  return (m ? m[1] : raw).trim();
}
const FROM_HEADER = MAIL_FROM || undefined;
const SENDER_EMAIL = MAIL_FROM ? senderEmail(MAIL_FROM) : undefined;
const FEEDBACK_TO = process.env.FEEDBACK_TO?.trim() || SENDER_EMAIL;

export const mailEnabled = Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && FROM_HEADER);

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// --- Gmail API transport ---------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15_000);
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        refresh_token: REFRESH_TOKEN!,
        grant_type: 'refresh_token',
      }),
      signal: ac.signal,
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: (await res.text().catch(() => '')).slice(0, 400) }, 'Gmail token refresh failed');
      return null;
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  } catch (err) {
    logger.error({ err }, 'Gmail token refresh threw');
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function encodeSubject(s: string): string {
  // RFC 2047 encoded-word only when the subject has non-ASCII (e.g. an em dash).
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}
function wrap76(b64: string): string {
  return b64.replace(/.{76}/g, '$&\r\n');
}

function buildRaw(opts: { to: string; subject: string; html: string; text: string; replyTo?: string }): string {
  const boundary = 'mime_boundary_seoauditor';
  const parts = [
    `From: ${FROM_HEADER}`,
    `To: ${opts.to}`,
    opts.replyTo ? `Reply-To: ${opts.replyTo}` : null,
    `Subject: ${encodeSubject(opts.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(Buffer.from(opts.text, 'utf8').toString('base64')),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(Buffer.from(opts.html, 'utf8').toString('base64')),
    `--${boundary}--`,
    '',
  ].filter((l): l is string => l !== null);
  return Buffer.from(parts.join('\r\n'), 'utf8').toString('base64url');
}

async function send(opts: { to: string; subject: string; html: string; text: string; replyTo?: string }): Promise<boolean> {
  if (!mailEnabled) {
    logger.warn({ to: opts.to, subject: opts.subject }, 'mailer disabled (GMAIL_* / MAIL_FROM unset) — email not sent');
    return false;
  }
  const token = await getAccessToken();
  if (!token) return false;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15_000);
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ raw: buildRaw(opts) }),
      signal: ac.signal,
    });
    if (res.status >= 200 && res.status < 300) return true;
    logger.error({ status: res.status, body: (await res.text().catch(() => '')).slice(0, 500), to: opts.to }, 'Gmail API send failed');
    return false;
  } catch (err) {
    logger.error({ err, to: opts.to }, 'Gmail API send threw');
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// --- Email content ---------------------------------------------------------

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
      <a href="${reportUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block">View the full report</a>
    </p>
    <p style="color:#888;font-size:12px;margin-top:24px">You asked us to email this from freeseoaudit.vercel.app. Reports are kept so this link stays live. Reply to this email with any feedback.</p>
  </div>`;

  const text =
    `Your SEO + GEO audit for ${url} is ready.\n\n` +
    `Score: ${score}/100 (Grade ${gradeLetter(score)})\n` +
    `${t.error} errors, ${t.warning} warnings, ${t.info} info, ${t.pass} passed.\n\n` +
    (issues.length ? `Top things to fix:\n${issues.map((c) => `- [${c.severity}] ${c.title}`).join('\n')}\n\n` : '') +
    `View the full report: ${reportUrl}\n`;

  return send({ to, subject: `Your SEO audit for ${url} - score ${score}/100`, html, text });
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
      <tr><td style="padding:4px 10px 4px 0;color:#888">Name</td><td>${esc(fb.name || '-')}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#888">Email</td><td>${esc(fb.email || '-')}</td></tr>
      <tr><td style="padding:4px 10px 4px 0;color:#888">Page</td><td>${esc(fb.url || '-')}</td></tr>
    </table>
    <h3 style="font-size:14px;margin:16px 0 6px">Message</h3>
    <p style="white-space:pre-wrap;font-size:15px;background:#f6f6f6;padding:12px 14px;border-radius:8px;margin:0">${esc(fb.message)}</p>
    <p style="color:#aaa;font-size:11px;margin-top:16px">${esc(fb.userAgent || '')}</p>
  </div>`;
  const text =
    `New feedback on Free SEO Audit\n\n` +
    `Name: ${fb.name || '-'}\nEmail: ${fb.email || '-'}\nPage: ${fb.url || '-'}\n\n` +
    `Message:\n${fb.message}\n`;

  return send({
    to: FEEDBACK_TO,
    subject: `Feedback${fb.name ? ` from ${fb.name}` : ''} - Free SEO Audit`,
    html,
    text,
    replyTo: fb.email || undefined,
  });
}
