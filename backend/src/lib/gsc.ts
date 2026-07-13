/**
 * Google Search Console read-only client (raw fetch, no SDK).
 *
 * Config (degrades to null/disabled when unset):
 *   GSC_REFRESH_TOKEN   OAuth refresh token with webmasters.readonly scope,
 *                       authorized by an account that has access to the property.
 *   GSC_SITE_URL        Property, e.g. "https://freeseoaudit.vercel.app/" or
 *                       "sc-domain:freeseoaudit.vercel.app".
 *   GSC_CLIENT_ID/SECRET  OAuth client (falls back to the Gmail client).
 */
import { logger } from './logger.js';
import { getGoogleAccessToken } from './googleAuth.js';

const REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN?.trim();
const SITE_URL = process.env.GSC_SITE_URL?.trim();
const CLIENT_ID = (process.env.GSC_CLIENT_ID || process.env.GMAIL_CLIENT_ID)?.trim();
const CLIENT_SECRET = (process.env.GSC_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET)?.trim();

export const gscEnabled = Boolean(REFRESH_TOKEN && SITE_URL && CLIENT_ID && CLIENT_SECRET);

const BASE = SITE_URL ? `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}` : '';

async function gscFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  if (!gscEnabled) return null;
  const token = await getGoogleAccessToken({ clientId: CLIENT_ID!, clientSecret: CLIENT_SECRET!, refreshToken: REFRESH_TOKEN! });
  if (!token) return null;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 20_000);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init?.headers ?? {}) },
      signal: ac.signal,
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: (await res.text().catch(() => '')).slice(0, 400), url }, 'GSC API call failed');
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    logger.error({ err, url }, 'GSC API call threw');
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function ymd(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

export interface SaRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
interface SaResponse {
  rows?: SaRow[];
}
interface Sitemap {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  errors?: string;
  warnings?: string;
  contents?: Array<{ type: string; submitted: string; indexed: string }>;
}

async function searchAnalytics(startDate: string, endDate: string, dimensions: string[], rowLimit = 25): Promise<SaRow[]> {
  const data = await gscFetch<SaResponse>(`${BASE}/searchAnalytics/query`, {
    method: 'POST',
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, dataState: 'all' }),
  });
  return data?.rows ?? [];
}

/** Composite Search Console snapshot for the admin dashboard / script. */
export async function gscOverview(days = 28): Promise<{
  range: { startDate: string; endDate: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  series: Array<{ date: string; clicks: number; impressions: number }>;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  sitemaps: Array<{ path: string; lastDownloaded: string | null; isPending: boolean; discovered: number; errors: string | null }>;
} | null> {
  if (!gscEnabled) return null;
  const startDate = ymd(-days);
  const endDate = ymd(0);

  const [totalsRows, dateRows, queryRows, pageRows, sitemapData] = await Promise.all([
    searchAnalytics(startDate, endDate, [], 1),
    searchAnalytics(startDate, endDate, ['date'], 90),
    searchAnalytics(startDate, endDate, ['query'], 25),
    searchAnalytics(startDate, endDate, ['page'], 25),
    gscFetch<{ sitemap?: Sitemap[] }>(`${BASE}/sitemaps`),
  ]);

  const t = totalsRows[0];
  return {
    range: { startDate, endDate },
    totals: {
      clicks: t?.clicks ?? 0,
      impressions: t?.impressions ?? 0,
      ctr: t?.ctr ?? 0,
      position: t?.position ?? 0,
    },
    series: dateRows.map((r) => ({ date: r.keys[0]!, clicks: r.clicks, impressions: r.impressions })),
    topQueries: queryRows.map((r) => ({ query: r.keys[0]!, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    topPages: pageRows.map((r) => ({ page: r.keys[0]!, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    sitemaps: (sitemapData?.sitemap ?? []).map((s) => ({
      path: s.path,
      lastDownloaded: s.lastDownloaded ?? null,
      isPending: Boolean(s.isPending),
      discovered: (s.contents ?? []).reduce((sum, c) => sum + Number(c.submitted || 0), 0),
      errors: s.errors && Number(s.errors) > 0 ? s.errors : null,
    })),
  };
}

/** Index status of a single URL (URL Inspection API). */
export async function inspectUrl(url: string): Promise<{ verdict: string; coverageState: string; lastCrawl: string | null; robotsState: string } | null> {
  const data = await gscFetch<{ inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string; robotsTxtState?: string } } }>(
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    { method: 'POST', body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }) },
  );
  const r = data?.inspectionResult?.indexStatusResult;
  if (!r) return null;
  return {
    verdict: r.verdict ?? 'UNKNOWN',
    coverageState: r.coverageState ?? 'unknown',
    lastCrawl: r.lastCrawlTime ?? null,
    robotsState: r.robotsTxtState ?? 'unknown',
  };
}
