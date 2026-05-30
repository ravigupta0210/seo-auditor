import * as cheerio from 'cheerio';
import { renderPage } from './renderer.js';
import { fetchRobotsTxt, isAllowed, type RobotsTxt } from './robots.js';
import { fetchSitemap, type SitemapResult } from './sitemap.js';
import type { PageContext } from '../types/check.js';
import { logger } from '../lib/logger.js';

export interface CrawlOptions {
  startUrl: string;
  maxPages?: number;
  maxDepth?: number;
  respectRobots?: boolean;
  onPage?: (page: PageContext, depth: number) => void;
}

export interface CrawlResult {
  origin: string;
  robots: RobotsTxt;
  sitemaps: SitemapResult[];
  pages: PageContext[];
  discoveredLinks: number;
  skippedByRobots: number;
  errors: { url: string; error: string }[];
}

const DEFAULT_MAX_PAGES = 50;
const DEFAULT_MAX_DEPTH = 3;

export async function crawlSite(opts: CrawlOptions): Promise<CrawlResult> {
  const startUrl = opts.startUrl;
  const maxPages = opts.maxPages ?? DEFAULT_MAX_PAGES;
  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;
  const respectRobots = opts.respectRobots ?? true;
  const start = new URL(startUrl);
  const origin = start.origin;

  const log = logger.child({ origin });
  const robots = await fetchRobotsTxt(origin);
  const sitemaps = robots.sitemaps.length > 0
    ? (await Promise.all(robots.sitemaps.map((s) => fetchSitemap(s)))).flat()
    : await fetchSitemap(new URL('/sitemap.xml', origin).toString());

  // Seed queue with sitemap URLs (highest priority) + start URL
  const seedUrls = new Set<string>([startUrl]);
  for (const sm of sitemaps) {
    for (const e of sm.entries) {
      const u = new URL(e.loc, origin);
      if (u.origin === origin) seedUrls.add(u.toString());
      if (seedUrls.size >= maxPages * 2) break;
    }
  }

  const queue: Array<{ url: string; depth: number }> = [...seedUrls].map((url) => ({ url, depth: 0 }));
  const visited = new Set<string>();
  const pages: PageContext[] = [];
  const errors: { url: string; error: string }[] = [];
  let discoveredLinks = 0;
  let skippedByRobots = 0;

  while (queue.length > 0 && pages.length < maxPages) {
    const next = queue.shift()!;
    if (visited.has(next.url)) continue;
    visited.add(next.url);

    if (next.depth > maxDepth) continue;

    const pathname = new URL(next.url).pathname;
    if (respectRobots && !isAllowed(robots, pathname)) {
      skippedByRobots++;
      continue;
    }

    try {
      const page = await renderPage(next.url);
      if (page.status >= 400) {
        errors.push({ url: next.url, error: `HTTP ${page.status}` });
        continue;
      }
      pages.push(page);
      opts.onPage?.(page, next.depth);

      if (next.depth < maxDepth) {
        const links = extractInternalLinks(page.html, page.finalUrl, origin);
        discoveredLinks += links.length;
        for (const link of links) {
          if (!visited.has(link) && pages.length + queue.length < maxPages * 3) {
            queue.push({ url: link, depth: next.depth + 1 });
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ url: next.url, error: message });
      log.warn({ err, url: next.url }, 'page fetch failed');
    }
  }

  return { origin, robots, sitemaps, pages, discoveredLinks, skippedByRobots, errors };
}

function extractInternalLinks(html: string, baseUrl: string, origin: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      const url = new URL(href, baseUrl);
      if (url.origin !== origin) return;
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      url.hash = '';
      links.add(url.toString());
    } catch {
      // ignore
    }
  });
  return [...links];
}
