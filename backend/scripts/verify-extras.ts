import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const findings: string[] = [];

  // 1. Full-site crawl mode against a small multi-page site
  console.log('--- full-site crawl against neverssl.com (small static site) ---');
  const sitePage = await ctx.newPage();
  sitePage.on('pageerror', (e) => findings.push(`[site/pageerror] ${e.message}`));
  await sitePage.goto('http://localhost:3000/audit?url=https%3A%2F%2Fneverssl.com&scope=site', { waitUntil: 'domcontentloaded' });
  try {
    await sitePage.waitForSelector('text=Overall', { timeout: 90_000 });
    const score = await sitePage.locator('div').filter({ hasText: /^\d{1,3} \/100$/ }).first().textContent();
    const checks = await sitePage.locator('article, details').count();
    console.log(`  crawl done — score=${score?.trim()} checks=${checks}`);
    await sitePage.screenshot({ path: '/tmp/seo-screenshots/sitecrawl-done.png', fullPage: true });
  } catch (e) {
    console.log(`  FAILED: ${(e as Error).message}`);
    await sitePage.screenshot({ path: '/tmp/seo-screenshots/sitecrawl-failed.png', fullPage: true });
  }
  await sitePage.close();

  // 2. Badge SVG renders correctly
  console.log('--- badge SVG ---');
  const badgePage = await ctx.newPage();
  await badgePage.goto('http://localhost:4000/api/badge?score=87&host=example.com', { waitUntil: 'domcontentloaded' });
  await badgePage.screenshot({ path: '/tmp/seo-screenshots/badge.png' });
  const svgContent = await badgePage.content();
  const hasScore = svgContent.includes('87/100');
  const hasHost = svgContent.includes('example.com');
  console.log(`  badge has score=87/100: ${hasScore}, has host: ${hasHost}`);
  await badgePage.close();

  // 3. Programmatic page — check explainer page actually shows code snippet
  console.log('--- check explainer page interactive elements ---');
  const checkPage = await ctx.newPage();
  await checkPage.goto('http://localhost:3000/check/jsonld.syntaxError', { waitUntil: 'domcontentloaded' });
  const h1 = await checkPage.locator('h1').first().textContent();
  const cta = await checkPage.locator('a:has-text("Audit my site")').count();
  console.log(`  explainer H1: "${h1}"  CTA: ${cta} button(s)`);
  await checkPage.close();

  // 4. Site-crawled report retrieval — open a saved single audit report
  console.log('--- check that /audit/[id] still works for a fresh audit ---');
  const auditPage = await ctx.newPage();
  await auditPage.goto('http://localhost:3000/audit?url=https%3A%2F%2Fexample.com&scope=single', { waitUntil: 'domcontentloaded' });
  await auditPage.waitForSelector('text=View shareable report', { timeout: 60_000 });
  const reportHref = await auditPage.locator('a:has-text("View shareable report")').getAttribute('href');
  console.log(`  report link: ${reportHref}`);
  if (reportHref) {
    const r = await ctx.newPage();
    await r.goto(`http://localhost:3000${reportHref}`, { waitUntil: 'domcontentloaded' });
    const reportH1 = await r.locator('h1').first().textContent();
    const reportTitle = await r.title();
    console.log(`  report page H1: "${reportH1}"`);
    console.log(`  report page <title>: "${reportTitle}"`);
    await r.screenshot({ path: '/tmp/seo-screenshots/saved-report.png', fullPage: true });
    await r.close();
  }
  await auditPage.close();

  await browser.close();

  console.log(`\nFindings: ${findings.length}`);
  findings.forEach((f) => console.log('  ' + f));
}

main().catch((e) => { console.error(e); process.exit(1); });
