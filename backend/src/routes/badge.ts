import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { store } from '../lib/store.js';
import type { ReportScore } from '../lib/store.js';

/**
 * Badges live on other people's sites, so this endpoint sees far more traffic
 * than anything else we serve, and the same handful of report ids over and
 * over. A small TTL cache keeps a popular badge from hitting Postgres on every
 * uncached render. Scores are immutable per report id, so staleness is a
 * non-issue — the TTL exists only to bound memory.
 */
const SCORE_TTL_MS = 60 * 60 * 1000;
const SCORE_CACHE_MAX = 1000;
const scoreCache = new Map<string, { value: ReportScore | null; expires: number }>();

async function lookupScore(id: string): Promise<ReportScore | null> {
  const hit = scoreCache.get(id);
  if (hit && hit.expires > Date.now()) return hit.value;

  const value = await store.getScore(id).catch(() => null);

  // Cheap FIFO eviction — this is a hot-path cache, not a general-purpose LRU.
  if (scoreCache.size >= SCORE_CACHE_MAX) {
    const oldest = scoreCache.keys().next().value;
    if (oldest !== undefined) scoreCache.delete(oldest);
  }
  // Cache misses too, so a bad id can't be used to hammer the database.
  scoreCache.set(id, { value, expires: Date.now() + SCORE_TTL_MS });
  return value;
}

export const badgeRouter = Router();

const BadgeQuery = z.object({
  /**
   * Preferred: the id of a stored report. The score and host are then read
   * server-side from the report, so the badge states something we actually
   * measured. A badge whose number the embedder can choose is worthless as a
   * trust signal — and it is the embedder's own site it appears on, so the
   * incentive to inflate it is obvious.
   */
  report: z.string().uuid().optional(),
  /** Legacy, unverified. Kept so existing embeds keep rendering. */
  score: z.coerce.number().min(0).max(100).optional(),
  host: z.string().max(120).optional(),
});

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'site';
  }
}

/**
 * SVG "SEO Score" badge users can embed on their own sites.
 * Layout is split into two strips: dark left strip with host, coloured right strip with score.
 * Width auto-adjusts to host length (up to a cap) so the host never overlaps the score.
 */
badgeRouter.get('/', async (req: Request, res: Response) => {
  const parsed = BadgeQuery.safeParse(req.query);
  const q = parsed.success ? parsed.data : {};

  let score = Math.max(0, Math.min(100, Math.round(q.score ?? 0)));
  let rawHost = q.host ?? 'site';
  let verified = false;

  if (q.report) {
    const report = await lookupScore(q.report);
    if (report) {
      // Derived, not supplied — neither value can be spoofed by the embedder.
      score = Math.max(0, Math.min(100, Math.round(report.score)));
      rawHost = hostOf(report.url);
      verified = true;
    } else {
      // Expired or unknown id. Say so rather than rendering a plausible score.
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(unknownBadge());
      return;
    }
  }

  const safeHost = String(rawHost).replace(/[<>&"']/g, '').slice(0, 30);
  const label = `${verified ? 'SEO score ✓' : 'SEO score'} · ${safeHost}`;
  const value = `${score}/100`;

  // Rough text width estimate: 7px per char for our 11px font
  const labelWidth = Math.max(120, label.length * 7 + 16);
  const valueWidth = value.length * 8 + 18;
  const totalWidth = labelWidth + valueWidth;

  const color = score >= 90 ? '#4ade80' : score >= 75 ? '#86efac' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#ef4444';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" role="img" aria-label="SEO Score ${value}">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="28" rx="4"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="28" fill="#0b0f14"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="28" fill="${color}"/>
    <rect width="${totalWidth}" height="28" fill="url(#b)"/>
  </g>
  <g fill="#e6edf3" text-anchor="start" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="11" font-weight="600">
    <text x="10" y="18">${escapeXml(label)}</text>
  </g>
  <g fill="#0b0f14" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="700">
    <text x="${labelWidth + valueWidth / 2}" y="19">${value}</text>
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.send(svg);
});

/** Rendered when a report id no longer resolves — better than a fake number. */
function unknownBadge(): string {
  const w = 168;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="28" role="img" aria-label="SEO score unavailable">
  <clipPath id="r"><rect width="${w}" height="28" rx="4"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${w}" height="28" fill="#0b0f14"/>
    <rect x="118" width="${w - 118}" height="28" fill="#6b7280"/>
  </g>
  <g fill="#e6edf3" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="11" font-weight="600">
    <text x="10" y="18">SEO score</text>
  </g>
  <g fill="#0b0f14" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="12" font-weight="700">
    <text x="${118 + (w - 118) / 2}" y="19">n/a</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}
