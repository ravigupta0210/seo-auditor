import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/audit?url=http%3A%2F%2Flocalhost%3A3000&scope=single', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Audit failed', { timeout: 30_000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/seo-screenshots/self-after-fix.png', fullPage: true });
  const errorTexts = await page.locator('text=/Refusing to fetch/').allTextContents();
  console.log('occurrences of "Refusing to fetch":', errorTexts.length);
  console.log('texts:', JSON.stringify(errorTexts));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
