/**
 * Runnable Search Console + PostHog report — prints indexing / search-performance
 * so we can see "what's going on with Google" (and the funnel) on demand.
 *
 * Run:
 *   cd backend && \
 *   GSC_REFRESH_TOKEN=... GSC_SITE_URL='https://freeseoaudit.vercel.app/' \
 *   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... \
 *   POSTHOG_API_KEY=... POSTHOG_PROJECT_ID=... \
 *   npx tsx scripts/gsc-report.ts
 */
import { gscEnabled, gscOverview, inspectUrl } from '../src/lib/gsc.js';
import { phEnabled, posthogOverview } from '../src/lib/posthog.js';

async function main() {
  console.log('=== Google Search Console ===');
  if (!gscEnabled) {
    console.log('GSC not configured (set GSC_REFRESH_TOKEN + GSC_SITE_URL + client creds).');
  } else {
    const o = await gscOverview(28);
    if (!o) {
      console.log('GSC fetch failed — check the refresh token has webmasters.readonly and access to the property.');
    } else {
      console.log(`Range ${o.range.startDate} → ${o.range.endDate}`);
      console.log(
        `Totals: ${o.totals.clicks} clicks · ${o.totals.impressions} impressions · ` +
          `CTR ${(o.totals.ctr * 100).toFixed(1)}% · avg position ${o.totals.position.toFixed(1)}`,
      );
      console.log(`Sitemaps (${o.sitemaps.length}):`);
      for (const s of o.sitemaps) {
        console.log(`  ${s.path} — ${s.isPending ? 'pending' : 'read'} · ${s.discovered} discovered${s.errors ? ` · errors ${s.errors}` : ''}`);
      }
      console.log(`Top queries (${o.topQueries.length}):`);
      for (const q of o.topQueries.slice(0, 10)) console.log(`  ${q.clicks}c / ${q.impressions}i  "${q.query}"`);
      console.log(`Top pages (${o.topPages.length}):`);
      for (const p of o.topPages.slice(0, 10)) console.log(`  ${p.clicks}c / ${p.impressions}i  ${p.page}`);
    }
    const site = process.env.GSC_SITE_URL || '';
    const home = site.startsWith('sc-domain:') ? `https://${site.slice('sc-domain:'.length)}/` : site;
    if (home.startsWith('http')) {
      const ins = await inspectUrl(home);
      console.log(`Index status of ${home}: ${ins ? `${ins.verdict} / ${ins.coverageState} (last crawl ${ins.lastCrawl ?? 'n/a'})` : 'inspection failed'}`);
    }
  }

  console.log('\n=== PostHog ===');
  if (!phEnabled) {
    console.log('PostHog not configured (set POSTHOG_API_KEY + POSTHOG_PROJECT_ID).');
  } else {
    const p = await posthogOverview(30);
    if (!p) {
      console.log('PostHog fetch failed — check the personal API key + project id.');
    } else {
      console.log(`Last ${p.days}d: ${p.visitors} visitors · ${p.pageviews} pageviews`);
      console.log(`Funnel events: ${JSON.stringify(p.events)}`);
      console.log(`Email conversion (captured/started): ${p.conversionRate}%`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
