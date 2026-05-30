import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger.js';
import { fetchPage } from '../crawler/fetcher.js';
import { renderPage } from '../crawler/renderer.js';
import { crawlSite } from '../crawler/crawl.js';
import { fetchRobotsTxt } from '../crawler/robots.js';
import { fetchSitemap } from '../crawler/sitemap.js';
import { runMetadataChecks } from '../checks/metadata.js';
import { runJsonLdChecks } from '../checks/jsonld.js';
import { runContentChecks } from '../checks/content.js';
import { runSecurityChecks } from '../checks/security.js';
import { runRobotsChecks, runSitemapChecks, runHreflangChecks } from '../checks/crawl.js';
import { runPerformanceChecks } from '../checks/performance.js';
import { loadGeoContext, runGeoChecks, runAICloakingCheck } from '../checks/geo.js';
import type { CheckResult } from '../types/check.js';
import { store, type AuditReport, type PageReport, type SiteSummary } from '../lib/store.js';

export const auditRouter = Router();

const SingleQuery = z.object({
  url: z.string().url().max(2048),
  cloaking: z.enum(['1', '0']).optional(),
  perf: z.enum(['1', '0']).optional(),
});

const SiteQuery = z.object({
  url: z.string().url().max(2048),
  maxPages: z.coerce.number().int().min(1).max(100).optional(),
  maxDepth: z.coerce.number().int().min(0).max(5).optional(),
});

const RULE_VERSION = 'v0.1.0';

function summarize(checks: CheckResult[]): SiteSummary {
  const byCategory: Record<string, { error: number; warning: number; info: number; pass: number; checks: number }> = {};
  const totals = { error: 0, warning: 0, info: 0, pass: 0 };
  for (const c of checks) {
    totals[c.severity]++;
    if (!byCategory[c.category]) byCategory[c.category] = { error: 0, warning: 0, info: 0, pass: 0, checks: 0 };
    byCategory[c.category]![c.severity]++;
    byCategory[c.category]!.checks++;
  }
  const scoreForBucket = (b: { error: number; warning: number; info: number; pass: number }) => {
    const penalty = b.error * 20 + b.warning * 8 + b.info * 2;
    return Math.max(0, 100 - penalty);
  };
  const overallPenalty = totals.error * 12 + totals.warning * 4 + totals.info * 1;
  const overall = Math.max(0, 100 - overallPenalty);
  const result: SiteSummary['byCategory'] = {};
  for (const [cat, b] of Object.entries(byCategory)) result[cat] = { score: scoreForBucket(b), checks: b.checks };
  return { overall, byCategory: result, totals };
}

/**
 * Score a multi-page site audit. Two-stage: average per-page scores, then
 * factor in site-wide checks. Prevents a 25-page site from getting 0/100 just
 * because the same metadata error stacks 25 times.
 */
function summarizeSite(pages: PageReport[], siteChecks: CheckResult[]): SiteSummary {
  if (pages.length === 0) return summarize(siteChecks);

  const pageScores = pages.map((p) => summarize(p.checks).overall);
  const avgPageScore = pageScores.reduce((s, n) => s + n, 0) / pageScores.length;

  const siteSummary = summarize(siteChecks);
  // Weight: 70% per-page average, 30% site-wide checks
  const overall = siteChecks.length > 0
    ? Math.round(avgPageScore * 0.7 + siteSummary.overall * 0.3)
    : Math.round(avgPageScore);

  // Totals + byCategory aggregate across all pages + site-wide checks
  const allChecks = [...pages.flatMap((p) => p.checks), ...siteChecks];
  const aggregated = summarize(allChecks);

  return { overall, totals: aggregated.totals, byCategory: aggregated.byCategory };
}

async function runPageChecks(url: string, opts: { cloaking?: boolean; perf?: boolean }): Promise<{
  page: { status: number; bytes: number; finalUrl: string };
  checks: CheckResult[];
}> {
  const page = await renderPage(url);
  if (page.status >= 400) {
    return {
      page: { status: page.status, bytes: page.html.length, finalUrl: page.finalUrl },
      checks: [],
    };
  }
  const robots = await fetchRobotsTxt(new URL(page.url).origin);
  const sitemaps = robots.sitemaps.length > 0
    ? (await Promise.all(robots.sitemaps.map((s) => fetchSitemap(s)))).flat()
    : await fetchSitemap(new URL('/sitemap.xml', page.url).toString());
  const geoCtx = await loadGeoContext(page, robots);

  const checks: CheckResult[] = [
    ...runMetadataChecks(page),
    ...runJsonLdChecks(page),
    ...runContentChecks(page),
    ...runSecurityChecks(page),
    ...runRobotsChecks(robots),
    ...runSitemapChecks(sitemaps),
    ...runHreflangChecks(page),
    ...await runGeoChecks(geoCtx),
  ];
  if (opts.cloaking) {
    checks.push(...await runAICloakingCheck(page));
  }
  if (opts.perf) {
    checks.push(...await runPerformanceChecks(page));
  }
  return {
    page: { status: page.status, bytes: page.html.length, finalUrl: page.finalUrl },
    checks,
  };
}

// --- Single-URL SSE stream ---
auditRouter.get('/stream', async (req: Request, res: Response) => {
  const parsed = SingleQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }
  const { url } = parsed.data;
  const cloaking = parsed.data.cloaking === '1';
  const perf = parsed.data.perf === '1';
  const auditId = randomUUID();
  const log = logger.child({ auditId, url });
  const startTime = Date.now();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  const heartbeat = setInterval(() => res.write(':\n\n'), 15_000);
  req.on('close', () => clearInterval(heartbeat));

  try {
    send('start', { auditId, url, scope: 'single', startedAt: new Date().toISOString() });
    log.info('single audit started');

    send('phase', { phase: 'fetching', message: `Fetching ${url}…` });
    const page = await renderPage(url);
    send('page', {
      status: page.status,
      finalUrl: page.finalUrl,
      bytes: page.html.length,
    });

    if (page.status >= 400) {
      send('error', { message: `Target returned HTTP ${page.status}.`, status: page.status });
      send('done', { auditId, summary: summarize([]), checks: [] });
      res.end();
      return;
    }

    send('phase', { phase: 'robots-sitemap', message: 'Fetching robots.txt + sitemap…' });
    const robots = await fetchRobotsTxt(new URL(page.url).origin);
    const sitemaps = robots.sitemaps.length > 0
      ? (await Promise.all(robots.sitemaps.map((s) => fetchSitemap(s)))).flat()
      : await fetchSitemap(new URL('/sitemap.xml', page.url).toString());
    const geoCtx = await loadGeoContext(page, robots);

    const allChecks: CheckResult[] = [];

    const phases: Array<{ name: string; label: string; run: () => Promise<CheckResult[]> | CheckResult[] }> = [
      { name: 'metadata', label: 'Analyzing metadata…', run: () => runMetadataChecks(page) },
      { name: 'jsonld', label: 'Validating JSON-LD…', run: () => runJsonLdChecks(page) },
      { name: 'content', label: 'Auditing content & headings…', run: () => runContentChecks(page) },
      { name: 'security', label: 'Checking security headers…', run: () => runSecurityChecks(page) },
      { name: 'crawl-robots', label: 'Analyzing robots.txt…', run: () => runRobotsChecks(robots) },
      { name: 'crawl-sitemap', label: 'Analyzing sitemap…', run: () => runSitemapChecks(sitemaps) },
      { name: 'crawl-hreflang', label: 'Checking hreflang…', run: () => runHreflangChecks(page) },
      { name: 'geo', label: 'Running GEO/AEO checks…', run: () => runGeoChecks(geoCtx) },
    ];
    if (cloaking) {
      phases.push({ name: 'geo-cloaking', label: 'Probing AI-crawler cloaking…', run: () => runAICloakingCheck(page) });
    }
    if (perf) {
      phases.push({ name: 'performance', label: 'Calling PageSpeed Insights…', run: () => runPerformanceChecks(page) });
    }

    for (const p of phases) {
      send('phase', { phase: p.name, message: p.label });
      const checks = await Promise.resolve(p.run());
      for (const c of checks) send('check', c);
      allChecks.push(...checks);
    }

    const summary = summarize(allChecks);
    const report: AuditReport = {
      id: auditId,
      url,
      scope: 'single',
      createdAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      summary,
      pages: [{ url: page.finalUrl, status: page.status, bytes: page.html.length, checks: allChecks }],
      siteChecks: [],
      meta: { pagesAnalyzed: 1, durationMs: Date.now() - startTime, ruleVersion: RULE_VERSION },
    };
    await store.save(report);

    send('done', { auditId, summary, checks: allChecks, finishedAt: report.finishedAt });
    log.info({ checks: allChecks.length, overall: summary.overall, ms: Date.now() - startTime }, 'single audit complete');
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err }, 'single audit failed');
    send('error', { message });
    res.end();
  }
});

// --- Full-site SSE stream ---
auditRouter.get('/site/stream', async (req: Request, res: Response) => {
  const parsed = SiteQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }
  const { url, maxPages = 25, maxDepth = 2 } = parsed.data;
  const auditId = randomUUID();
  const log = logger.child({ auditId, url });
  const startTime = Date.now();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  const heartbeat = setInterval(() => res.write(':\n\n'), 15_000);
  req.on('close', () => clearInterval(heartbeat));

  try {
    send('start', { auditId, url, scope: 'site', maxPages, maxDepth, startedAt: new Date().toISOString() });
    log.info({ maxPages, maxDepth }, 'site audit started');

    send('phase', { phase: 'crawl', message: `Crawling up to ${maxPages} pages (depth ${maxDepth})…` });
    const crawl = await crawlSite({
      startUrl: url,
      maxPages,
      maxDepth,
      onPage: (page, depth) => {
        send('crawled', { url: page.finalUrl, status: page.status, depth, bytes: page.html.length });
      },
    });
    send('crawled-summary', {
      pages: crawl.pages.length,
      discoveredLinks: crawl.discoveredLinks,
      skippedByRobots: crawl.skippedByRobots,
      errors: crawl.errors.length,
    });

    if (crawl.pages.length === 0) {
      const firstError = crawl.errors[0]?.error ?? 'unknown reason';
      const detail = crawl.errors.length > 0
        ? `Crawler could not load any pages. First error: ${firstError}`
        : 'Crawler returned zero pages and produced no errors — the start URL may have been blocked by robots.txt.';
      send('error', { message: detail });
      send('done', { auditId, summary: summarize([]), pages: [], siteChecks: [] });
      res.end();
      return;
    }

    // Per-page checks (run sequentially to avoid exhausting free-tier RAM)
    const pageReports: PageReport[] = [];
    const allChecks: CheckResult[] = [];
    for (let i = 0; i < crawl.pages.length; i++) {
      const p = crawl.pages[i]!;
      send('phase', { phase: 'analyze', message: `Analyzing page ${i + 1}/${crawl.pages.length}: ${p.url}` });
      const checks: CheckResult[] = [
        ...runMetadataChecks(p),
        ...runJsonLdChecks(p),
        ...runContentChecks(p),
        ...runSecurityChecks(p),
        ...runHreflangChecks(p),
      ];
      for (const c of checks) send('check', { ...c, pageUrl: p.finalUrl });
      pageReports.push({ url: p.finalUrl, status: p.status, bytes: p.html.length, checks });
      allChecks.push(...checks);
    }

    // Site-wide checks (robots, sitemap, GEO, cross-page duplicates)
    send('phase', { phase: 'site-checks', message: 'Running site-wide checks…' });
    const firstPage = crawl.pages[0]!;
    const geoCtx = await loadGeoContext(firstPage, crawl.robots);
    const siteChecks: CheckResult[] = [
      ...runRobotsChecks(crawl.robots),
      ...runSitemapChecks(crawl.sitemaps),
      ...await runGeoChecks(geoCtx),
      ...crossPageChecks(pageReports),
    ];
    for (const c of siteChecks) send('check', c);
    allChecks.push(...siteChecks);

    const summary = summarizeSite(pageReports, siteChecks);
    const report: AuditReport = {
      id: auditId,
      url,
      scope: 'site',
      createdAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      summary,
      pages: pageReports,
      siteChecks,
      meta: { pagesAnalyzed: pageReports.length, durationMs: Date.now() - startTime, ruleVersion: RULE_VERSION },
    };
    await store.save(report);

    send('done', { auditId, summary, pagesAnalyzed: pageReports.length, finishedAt: report.finishedAt });
    log.info({ pages: pageReports.length, overall: summary.overall, ms: Date.now() - startTime }, 'site audit complete');
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err }, 'site audit failed');
    send('error', { message });
    res.end();
  }
});

// One-shot JSON
auditRouter.get('/', async (req: Request, res: Response) => {
  const parsed = SingleQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    return;
  }
  const { url } = parsed.data;
  const auditId = randomUUID();
  try {
    const startTime = Date.now();
    const { page, checks } = await runPageChecks(url, {
      cloaking: parsed.data.cloaking === '1',
      perf: parsed.data.perf === '1',
    });
    if (page.status >= 400) {
      res.status(502).json({ auditId, error: `Target returned HTTP ${page.status}`, page });
      return;
    }
    const summary = summarize(checks);
    const report: AuditReport = {
      id: auditId,
      url,
      scope: 'single',
      createdAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      summary,
      pages: [{ url: page.finalUrl, status: page.status, bytes: page.bytes, checks }],
      siteChecks: [],
      meta: { pagesAnalyzed: 1, durationMs: Date.now() - startTime, ruleVersion: RULE_VERSION },
    };
    await store.save(report);
    res.json(report);
  } catch (err) {
    res.status(500).json({ auditId, error: err instanceof Error ? err.message : String(err) });
  }
});

// Retrieve a saved report
auditRouter.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id ?? '');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const report = await store.get(id);
  if (!report) {
    res.status(404).json({ error: 'Report not found or expired' });
    return;
  }
  res.json(report);
});

// Recent reports (for programmatic SEO landing pages)
auditRouter.get('/recent/list', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const reports = await store.list(limit);
  // Strip heavy fields
  res.json(reports.map((r) => ({
    id: r.id,
    url: r.url,
    scope: r.scope,
    createdAt: r.createdAt,
    finishedAt: r.finishedAt,
    summary: r.summary,
    meta: r.meta,
  })));
});

// Used by /audit/[id] frontend page also via JSON. Fall back to homepage helper above.

function crossPageChecks(pages: PageReport[]): CheckResult[] {
  if (pages.length < 2) return [];
  const results: CheckResult[] = [];
  const titles = new Map<string, string[]>();
  const descs = new Map<string, string[]>();

  for (const p of pages) {
    const titleCheck = p.checks.find((c) => c.id.startsWith('metadata.title') && c.evidence);
    if (titleCheck?.evidence && typeof titleCheck.evidence === 'object') {
      const t = (titleCheck.evidence as { title?: string }).title;
      if (t) {
        if (!titles.has(t)) titles.set(t, []);
        titles.get(t)!.push(p.url);
      }
    }
    const descCheck = p.checks.find((c) => c.id.startsWith('metadata.description') && c.evidence);
    if (descCheck?.evidence && typeof descCheck.evidence === 'object') {
      const d = (descCheck.evidence as { description?: string }).description;
      if (d) {
        if (!descs.has(d)) descs.set(d, []);
        descs.get(d)!.push(p.url);
      }
    }
  }

  const dupTitles = [...titles.entries()].filter(([, urls]) => urls.length > 1);
  if (dupTitles.length > 0) {
    results.push({
      id: 'crawl.duplicateTitles',
      category: 'crawl',
      severity: 'warning',
      title: `${dupTitles.length} group(s) of pages share the same <title>`,
      evidence: { duplicates: dupTitles.map(([title, urls]) => ({ title, count: urls.length, urls: urls.slice(0, 5) })).slice(0, 10) },
      whyItMatters:
        'Duplicate titles confuse Google about which URL to surface for a query — only one wins, and you can\'t pick which.',
      fix: { summary: 'Make every page\'s <title> unique by including a distinguishing topic or modifier.', docLink: 'https://developers.google.com/search/docs/appearance/title-link' },
      priority: 60,
      ruleVersion: RULE_VERSION,
    });
  }

  const dupDescs = [...descs.entries()].filter(([, urls]) => urls.length > 1);
  if (dupDescs.length > 0) {
    results.push({
      id: 'crawl.duplicateDescriptions',
      category: 'crawl',
      severity: 'warning',
      title: `${dupDescs.length} group(s) of pages share the same meta description`,
      evidence: { duplicates: dupDescs.map(([desc, urls]) => ({ desc, count: urls.length, urls: urls.slice(0, 5) })).slice(0, 10) },
      whyItMatters: 'Duplicate descriptions waste an opportunity to differentiate SERP snippets.',
      fix: { summary: 'Write unique descriptions per page.', docLink: 'https://developers.google.com/search/docs/appearance/snippet' },
      priority: 35,
      ruleVersion: RULE_VERSION,
    });
  }

  return results;
}

// Suppress unused import lint by re-exporting the raw fetch helper for callers that
// want to bypass the renderer.
export { fetchPage };
