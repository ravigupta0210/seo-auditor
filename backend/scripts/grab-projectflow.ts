import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('https://projectflow-omega.vercel.app', { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/portfolio-projectflow.png', fullPage: false });
  console.log('captured /tmp/portfolio-projectflow.png');
  await browser.close();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
