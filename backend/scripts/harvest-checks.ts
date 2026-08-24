/**
 * Harvest real CheckResult objects from the engine.
 *
 * The catalog (frontend/lib/checks-catalog.ts) must mirror what the backend
 * actually emits. Hand-writing entries from the source drifts immediately and
 * gets the copy subtly wrong, so instead we run the real checks over a spread
 * of sites and record every distinct id with its actual title, whyItMatters
 * and fix.
 *
 * Usage: npx tsx scripts/harvest-checks.ts > /tmp/checks.json
 */
import { fetchPage } from '../src/crawler/fetcher.js';
import { fetchRobotsTxt } from '../src/crawler/robots.js';
import { runMetadataChecks } from '../src/checks/metadata.js';
import { runJsonLdChecks } from '../src/checks/jsonld.js';
import { runContentChecks } from '../src/checks/content.js';
import { runSecurityChecks } from '../src/checks/security.js';
import { runRobotsChecks, runSitemapChecks, runHreflangChecks } from '../src/checks/crawl.js';
import { loadGeoContext, runGeoChecks } from '../src/checks/geo.js';
import type { CheckResult } from '../src/types/check.js';

// Deliberately varied: a bare page, a docs site, a marketing site, a JS-heavy
// app, a news site. Between them they trigger most branches.
const TARGETS = [
  'https://example.com',
  'https://developer.mozilla.org/en-US/docs/Web/HTML',
  'https://vercel.com',
  'https://nextjs.org/docs',
  'https://schema.org',
  'https://www.bbc.com/news',
  'https://news.ycombinator.com',
  'https://ahrefs.com/blog/',
];

const seen = new Map<string, CheckResult>();

for (const url of TARGETS) {
  try {
    const page = await fetchPage(url);
    if (page.status >= 400) { console.error(`  skip ${url} (${page.status})`); continue; }
    const robots = await fetchRobotsTxt(new URL(page.finalUrl ?? url).origin);
    const results: CheckResult[] = [
      ...runMetadataChecks(page),
      ...runJsonLdChecks(page),
      ...runContentChecks(page),
      ...runSecurityChecks(page),
      ...runRobotsChecks(robots),
      ...runHreflangChecks(page),
      ...(await runGeoChecks(await loadGeoContext(page, robots))),
    ];
    for (const r of results) if (!seen.has(r.id)) seen.set(r.id, r);
    console.error(`  ${url} -> ${results.length} checks (${seen.size} distinct so far)`);
  } catch (err) {
    console.error(`  FAILED ${url}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.error(`\n  harvested ${seen.size} distinct check ids`);
console.log(JSON.stringify([...seen.values()], null, 2));
