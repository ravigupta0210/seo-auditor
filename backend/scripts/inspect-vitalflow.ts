import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });

  // Human view (JS executed)
  const human = await ctx.newPage();
  await human.goto('https://vitalflow-black.vercel.app/login', { waitUntil: 'networkidle', timeout: 30_000 });
  await human.waitForTimeout(1500);
  await human.screenshot({ path: '/tmp/vitalflow-human.png', fullPage: true });

  const renderedHtml = await human.content();
  const bodyText = await human.locator('body').innerText();
  const h1Count = await human.locator('h1').count();
  const h1Text = h1Count > 0 ? await human.locator('h1').first().textContent() : null;
  const buttonsCount = await human.locator('button').count();
  const linksCount = await human.locator('a').count();
  const imgsCount = await human.locator('img').count();

  console.log('=== HUMAN VIEW (after JS) ===');
  console.log(`Rendered HTML size: ${renderedHtml.length} bytes`);
  console.log(`Body text length:   ${bodyText.length} chars`);
  console.log(`Body preview:       ${bodyText.slice(0, 200).replace(/\s+/g, ' ')}`);
  console.log(`<h1> tags:          ${h1Count}${h1Text ? ` ("${h1Text.trim()}")` : ''}`);
  console.log(`<button> tags:      ${buttonsCount}`);
  console.log(`<a> tags:           ${linksCount}`);
  console.log(`<img> tags:         ${imgsCount}`);

  await human.close();
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
