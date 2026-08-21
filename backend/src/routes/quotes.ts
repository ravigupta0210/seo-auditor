import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { pool } from '../lib/db.js';
import { store } from '../lib/store.js';
import { sendQuoteRequestEmail, sendQuoteAckEmail } from '../lib/mailer.js';
import { rateLimit } from '../lib/ratelimit.js';

export const quotesRouter = Router();

const TIERS = ['report', 'implementation', 'analytics', 'monitoring', 'custom'] as const;
const REPO_ACCESS = ['yes', 'no', 'maybe'] as const;

const QuoteBody = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().max(254),
  company: z.string().max(160).optional(),
  siteUrl: z.string().min(3).max(2048),
  auditId: z.string().uuid().optional().or(z.literal('')),
  tier: z.enum(TIERS).optional(),
  stack: z.string().max(300).optional(),
  requirements: z.string().min(10).max(5000),
  timeline: z.string().max(120).optional(),
  budget: z.string().max(120).optional(),
  repoAccess: z.enum(REPO_ACCESS).optional(),
  // Honeypot — same pattern as /api/feedback. Bots fill it; we accept any value
  // so we can drop silently instead of returning a validation error.
  website: z.string().max(200).optional(),
});

/** Normalize whatever the user typed into something with a scheme. */
function normalizeSite(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, '')}`;
}

// POST /api/quotes — capture a paid-work enquiry, notify the owner, ack the prospect.
quotesRouter.post('/', async (req: Request, res: Response) => {
  if (!rateLimit(req, 'quotes', 5, 60_000)) {
    res.status(429).json({ error: 'Too many requests, please try again shortly.' });
    return;
  }
  const parsed = QuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }
  const d = parsed.data;
  if (d.website) {
    // Honeypot tripped — pretend success, drop silently.
    res.json({ ok: true });
    return;
  }

  const siteUrl = normalizeSite(d.siteUrl);
  const auditId = d.auditId || undefined;
  const userAgent = String(req.headers['user-agent'] ?? '').slice(0, 300);
  const referrer = String(req.headers['referer'] ?? '').slice(0, 500);
  const log = logger.child({ route: 'quotes', siteUrl });

  // Read the score from the stored report rather than trusting the client — this
  // number goes straight into the quote we send, so it has to be real.
  let auditScore: number | undefined;
  if (auditId) {
    try {
      const report = await store.get(auditId);
      auditScore = report?.summary?.overall;
    } catch (err) {
      log.warn({ err, auditId }, 'could not load audit for quote request');
    }
  }

  const payload = {
    name: d.name,
    email: d.email,
    company: d.company,
    siteUrl,
    auditId,
    auditScore,
    tier: d.tier,
    stack: d.stack,
    requirements: d.requirements,
    timeline: d.timeline,
    budget: d.budget,
    repoAccess: d.repoAccess,
    userAgent,
    referrer,
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO quote_requests
           (name, email, company, site_url, audit_id, audit_score, tier, stack,
            requirements, timeline, budget, repo_access, user_agent, referrer)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          d.name ?? null,
          d.email,
          d.company ?? null,
          siteUrl,
          auditId ?? null,
          auditScore ?? null,
          d.tier ?? null,
          d.stack ?? null,
          d.requirements,
          d.timeline ?? null,
          d.budget ?? null,
          d.repoAccess ?? null,
          userAgent,
          referrer,
        ],
      );
    } catch (err) {
      // Never lose the lead to a DB hiccup — the email below is the real delivery.
      log.error({ err }, 'failed to persist quote request');
    }
  }

  const notified = await sendQuoteRequestEmail(payload);
  const acked = await sendQuoteAckEmail(payload);
  log.info({ notified, acked, tier: d.tier, auditScore }, 'quote request received');

  res.json({ ok: true, acknowledged: acked });
});
