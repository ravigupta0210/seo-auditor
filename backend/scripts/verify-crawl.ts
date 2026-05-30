import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  console.log('Auditing schema.org (full-site, up to 25 pages)…');
  await page.goto('http://localhost:3000/audit?url=https%3A%2F%2Fschema.org&scope=site', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Overall', { timeout: 180_000 });
  await page.waitForTimeout(2000);
  const score = await page.locator('div').filter({ hasText: /^\d{1,3} \/100$/ }).first().textContent();
  const checkCards = await page.locator('article').count();
  const pageCountBadges = await page.locator('text=/\\d+ pages/').count();
  const totalsRow = await page.locator('div').filter({ hasText: /^ERRORS$|^WARNINGS$|^INFO$|^PASS$/i }).count();

  console.log(`  Score: ${score?.trim()}`);
  console.log(`  Check cards rendered: ${checkCards}`);
  console.log(`  Cards with "N pages" badge: ${pageCountBadges}`);
  await page.screenshot({ path: '/tmp/seo-screenshots/sitecrawl-fixed.png', fullPage: true });
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
