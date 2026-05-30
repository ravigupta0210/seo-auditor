import { fetchPage } from './fetcher.js';

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface SitemapResult {
  url: string;
  status: number;
  isIndex: boolean;
  entries: SitemapEntry[];
  childSitemaps: string[];
  parseErrors: string[];
}

const MAX_SITEMAP_DEPTH = 3;
const MAX_TOTAL_URLS = 5000;

export async function fetchSitemap(sitemapUrl: string, depth = 0, seen = new Set<string>()): Promise<SitemapResult[]> {
  if (depth > MAX_SITEMAP_DEPTH) return [];
  if (seen.has(sitemapUrl)) return [];
  seen.add(sitemapUrl);

  const results: SitemapResult[] = [];
  try {
    const page = await fetchPage(sitemapUrl);
    const parsed = parseSitemap(sitemapUrl, page.status, page.html);
    results.push(parsed);

    if (parsed.isIndex) {
      for (const child of parsed.childSitemaps) {
        const childResults = await fetchSitemap(child, depth + 1, seen);
        results.push(...childResults);
        const total = results.reduce((n, r) => n + r.entries.length, 0);
        if (total >= MAX_TOTAL_URLS) break;
      }
    }
  } catch (err) {
    results.push({
      url: sitemapUrl,
      status: 0,
      isIndex: false,
      entries: [],
      childSitemaps: [],
      parseErrors: [err instanceof Error ? err.message : String(err)],
    });
  }
  return results;
}

export function parseSitemap(url: string, status: number, xml: string): SitemapResult {
  const parseErrors: string[] = [];
  const entries: SitemapEntry[] = [];
  const childSitemaps: string[] = [];

  // Detect sitemap index
  const isIndex = /<sitemapindex[\s>]/i.test(xml);

  if (isIndex) {
    const sitemapBlocks = xml.match(/<sitemap[\s\S]*?<\/sitemap>/gi) ?? [];
    for (const block of sitemapBlocks) {
      const loc = extractTag(block, 'loc');
      if (loc) childSitemaps.push(loc);
    }
  } else {
    const urlBlocks = xml.match(/<url[\s\S]*?<\/url>/gi) ?? [];
    for (const block of urlBlocks) {
      const loc = extractTag(block, 'loc');
      if (!loc) {
        parseErrors.push('<url> block missing <loc>');
        continue;
      }
      entries.push({
        loc,
        lastmod: extractTag(block, 'lastmod') ?? undefined,
        changefreq: extractTag(block, 'changefreq') ?? undefined,
        priority: extractTag(block, 'priority') ?? undefined,
      });
    }
  }

  return { url, status, isIndex, entries, childSitemaps, parseErrors };
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
  const m = re.exec(block);
  return m && m[1] ? decodeEntities(m[1].trim()) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
