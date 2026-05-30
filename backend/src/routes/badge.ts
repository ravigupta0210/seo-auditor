import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

export const badgeRouter = Router();

const BadgeQuery = z.object({
  score: z.coerce.number().min(0).max(100).optional(),
  host: z.string().max(120).optional(),
});

/**
 * SVG "SEO Score" badge users can embed on their own sites.
 * Layout is split into two strips: dark left strip with host, coloured right strip with score.
 * Width auto-adjusts to host length (up to a cap) so the host never overlaps the score.
 */
badgeRouter.get('/', (req: Request, res: Response) => {
  const parsed = BadgeQuery.safeParse(req.query);
  const score = Math.max(0, Math.min(100, Math.round(parsed.success ? parsed.data.score ?? 0 : 0)));
  const rawHost = parsed.success ? parsed.data.host ?? 'site' : 'site';

  const safeHost = String(rawHost).replace(/[<>&"']/g, '').slice(0, 30);
  const label = `SEO score · ${safeHost}`;
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

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}
