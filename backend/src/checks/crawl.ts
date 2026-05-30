import * as cheerio from 'cheerio';
import type { CheckResult, PageContext } from '../types/check.js';
import type { RobotsTxt } from '../crawler/robots.js';
import type { SitemapResult } from '../crawler/sitemap.js';

const RULE_VERSION = 'v0.1.0';

export function runRobotsChecks(robots: RobotsTxt): CheckResult[] {
  const results: CheckResult[] = [];

  if (robots.status === 0 || robots.status >= 400) {
    results.push({
      id: 'crawl.robots.missing',
      category: 'crawl',
      severity: 'warning',
      title: 'No /robots.txt found',
      evidence: { url: robots.url, status: robots.status },
      whyItMatters:
        'robots.txt is the standard way to tell crawlers which paths to skip and where to find sitemaps. Most sites should have one.',
      fix: {
        summary: 'Add a /robots.txt at your origin.',
        snippet: `User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`,
        docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
      },
      priority: 40,
      ruleVersion: RULE_VERSION,
    });
    return results;
  }

  if (robots.parseErrors.length > 0) {
    results.push({
      id: 'crawl.robots.syntaxErrors',
      category: 'crawl',
      severity: 'error',
      title: `robots.txt has ${robots.parseErrors.length} syntax issue(s)`,
      evidence: { errors: robots.parseErrors.slice(0, 5) },
      whyItMatters:
        'Malformed lines may be ignored or, worse, change crawler behavior unpredictably across user agents.',
      fix: { summary: 'Fix the listed errors and re-verify with Google Search Console\'s robots.txt tester.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt' },
      priority: 70,
      ruleVersion: RULE_VERSION,
    });
  }

  // Check for the dangerous "Disallow: /" on user-agent: *
  const starRule = robots.rules.find((r) => r.userAgent === '*');
  if (starRule?.disallow.includes('/')) {
    results.push({
      id: 'crawl.robots.disallowAll',
      category: 'crawl',
      severity: 'error',
      title: 'robots.txt blocks ALL crawlers from the entire site',
      whyItMatters:
        'User-agent: * with Disallow: / blocks Google completely. If this is a staging environment that\'s fine; on production it deletes you from search.',
      fix: { summary: 'If this is production, change Disallow: / to specific paths only.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt' },
      priority: 95,
      ruleVersion: RULE_VERSION,
    });
  }

  if (robots.sitemaps.length === 0) {
    results.push({
      id: 'crawl.robots.noSitemap',
      category: 'crawl',
      severity: 'warning',
      title: 'robots.txt does not reference a sitemap',
      whyItMatters:
        'The Sitemap directive helps every search engine (not just Google) find your URL inventory automatically.',
      fix: { summary: 'Add a Sitemap: line at the bottom of robots.txt.', snippet: 'Sitemap: https://your-domain.com/sitemap.xml', docLink: 'https://www.sitemaps.org/protocol.html#submit_robots' },
      priority: 35,
      ruleVersion: RULE_VERSION,
    });
  } else {
    results.push({
      id: 'crawl.robots.ok',
      category: 'crawl',
      severity: 'pass',
      title: `robots.txt found with ${robots.sitemaps.length} sitemap reference(s)`,
      evidence: { sitemaps: robots.sitemaps, rules: robots.rules.length },
      whyItMatters: 'Crawl directives are declared and sitemaps are discoverable.',
      fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    });
  }

  return results;
}

export function runSitemapChecks(sitemaps: SitemapResult[]): CheckResult[] {
  const results: CheckResult[] = [];
  const totalEntries = sitemaps.reduce((n, s) => n + s.entries.length, 0);

  const reachable = sitemaps.filter((s) => s.status === 200);
  if (reachable.length === 0) {
    results.push({
      id: 'crawl.sitemap.missing',
      category: 'crawl',
      severity: 'warning',
      title: 'No reachable sitemap.xml',
      whyItMatters:
        'Sitemaps give search engines a definitive URL list with lastmod hints. Missing sitemaps slow crawling and may leave URLs un-indexed.',
      fix: {
        summary: 'Generate a sitemap.xml and reference it from robots.txt.',
        snippet: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-05-01</lastmod>
  </url>
</urlset>`,
        docLink: 'https://www.sitemaps.org/protocol.html',
      },
      priority: 55,
      ruleVersion: RULE_VERSION,
    });
    return results;
  }

  // Check freshness
  const now = Date.now();
  const stale = sitemaps
    .flatMap((s) => s.entries)
    .filter((e) => {
      if (!e.lastmod) return false;
      const d = Date.parse(e.lastmod);
      if (Number.isNaN(d)) return false;
      return now - d > 365 * 24 * 60 * 60 * 1000;
    });

  if (stale.length > totalEntries * 0.5 && totalEntries > 5) {
    results.push({
      id: 'crawl.sitemap.stale',
      category: 'crawl',
      severity: 'warning',
      title: `${stale.length} of ${totalEntries} sitemap entries have lastmod > 1 year old`,
      evidence: { staleCount: stale.length, totalEntries },
      whyItMatters:
        'Stale lastmod signals tell Google there\'s no point re-crawling — but fresh content with old lastmod gets ignored. Either update lastmod when content changes or remove it.',
      fix: { summary: 'Update lastmod when pages change, or omit it entirely (better than lying).', docLink: 'https://www.sitemaps.org/protocol.html#lastmod' },
      priority: 30,
      ruleVersion: RULE_VERSION,
    });
  }

  results.push({
    id: 'crawl.sitemap.ok',
    category: 'crawl',
    severity: 'pass',
    title: `Found ${reachable.length} sitemap(s) with ${totalEntries} URL(s)`,
    evidence: { sitemaps: reachable.length, urls: totalEntries },
    whyItMatters: 'Search engines can efficiently discover the URL list.',
    fix: { summary: 'No action needed.', docLink: 'https://www.sitemaps.org/protocol.html' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  });

  return results;
}

export function runHreflangChecks(page: PageContext): CheckResult[] {
  const $ = cheerio.load(page.html);
  const links = $('link[rel="alternate"][hreflang]').toArray();
  if (links.length === 0) {
    return [{
      id: 'crawl.hreflang.none',
      category: 'crawl',
      severity: 'info',
      title: 'No hreflang annotations',
      whyItMatters:
        'Only required for multi-language/multi-region sites. If you serve a single locale, ignore this.',
      fix: { summary: 'If you have localized versions, add hreflang annotations.', docLink: 'https://developers.google.com/search/docs/specialized/international/localized-versions' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    }];
  }

  const tags: Array<{ lang: string; href: string }> = [];
  let hasXDefault = false;
  for (const l of links) {
    const lang = $(l).attr('hreflang') ?? '';
    const href = $(l).attr('href') ?? '';
    tags.push({ lang, href });
    if (lang === 'x-default') hasXDefault = true;
  }

  const results: CheckResult[] = [];
  if (!hasXDefault) {
    results.push({
      id: 'crawl.hreflang.noXDefault',
      category: 'crawl',
      severity: 'warning',
      title: 'hreflang annotations missing x-default',
      whyItMatters:
        'x-default tells Google which page to serve when no language matches. Without it, users from unmatched regions may land on the wrong locale.',
      fix: {
        summary: 'Add an x-default hreflang pointing to your fallback locale.',
        snippet: '<link rel="alternate" hreflang="x-default" href="https://example.com/" />',
        docLink: 'https://developers.google.com/search/docs/specialized/international/localized-versions#xdefault',
      },
      priority: 40,
      ruleVersion: RULE_VERSION,
    });
  }
  results.push({
    id: 'crawl.hreflang.found',
    category: 'crawl',
    severity: hasXDefault ? 'pass' : 'info',
    title: `${tags.length} hreflang annotation(s) found`,
    evidence: { tags: tags.slice(0, 10), hasXDefault },
    whyItMatters: 'Multi-locale signals are declared.',
    fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/specialized/international/localized-versions' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  });
  return results;
}
