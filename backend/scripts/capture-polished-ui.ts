import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = '/tmp/seo-polished';

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });

  // 1. Landing
  console.log('Capturing landing…');
  const landing = await ctx.newPage();
  await landing.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await landing.waitForTimeout(500);
  await landing.screenshot({ path: `${OUT}/01-landing.png`, fullPage: true });
  await landing.close();

  // 2. Audit running (mid-stream)
  console.log('Capturing audit mid-stream…');
  const midstream = await ctx.newPage();
  await midstream.goto('http://localhost:3000/audit?url=https%3A%2F%2Fvercel.com&scope=single', { waitUntil: 'domcontentloaded' });
  await midstream.waitForTimeout(800);
  await midstream.screenshot({ path: `${OUT}/02-audit-running.png`, fullPage: true });
  // Wait for completion
  await midstream.waitForSelector('text=View shareable report', { timeout: 60_000 });
  await midstream.waitForTimeout(800);
  await midstream.screenshot({ path: `${OUT}/03-audit-done-vercel.png`, fullPage: true });
  const reportHref = await midstream.locator('a:has-text("View shareable report")').getAttribute('href');
  await midstream.close();

  // 3. Audit results for different score grades
  for (const target of [
    { url: 'https://example.com', label: 'lowscore' },
    { url: 'https://github.com', label: 'midscore' },
  ]) {
    console.log(`Capturing audit for ${target.url}…`);
    const p = await ctx.newPage();
    await p.goto(`http://localhost:3000/audit?url=${encodeURIComponent(target.url)}&scope=single`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('text=View shareable report', { timeout: 60_000 });
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/04-audit-${target.label}.png`, fullPage: true });
    await p.close();
  }

  // 4. Saved shareable report
  if (reportHref) {
    console.log('Capturing saved report…');
    const report = await ctx.newPage();
    await report.goto(`http://localhost:3000${reportHref}`, { waitUntil: 'networkidle' });
    await report.waitForTimeout(500);
    await report.screenshot({ path: `${OUT}/05-shareable-report.png`, fullPage: true });
    await report.close();
  }

  // 5. Error state
  console.log('Capturing error state…');
  const err = await ctx.newPage();
  await err.goto('http://localhost:3000/audit?url=http%3A%2F%2Flocalhost%3A3000&scope=single', { waitUntil: 'domcontentloaded' });
  await err.waitForSelector('text=Audit failed', { timeout: 30_000 });
  await err.waitForTimeout(500);
  await err.screenshot({ path: `${OUT}/06-error-state.png`, fullPage: true });
  await err.close();

  // 6. Check index + check explainer
  console.log('Capturing check pages…');
  const checkIdx = await ctx.newPage();
  await checkIdx.goto('http://localhost:3000/check', { waitUntil: 'networkidle' });
  await checkIdx.waitForTimeout(400);
  await checkIdx.screenshot({ path: `${OUT}/07-check-index.png`, fullPage: true });
  await checkIdx.close();

  const checkPage = await ctx.newPage();
  await checkPage.goto('http://localhost:3000/check/jsonld.syntaxError', { waitUntil: 'networkidle' });
  await checkPage.waitForTimeout(400);
  await checkPage.screenshot({ path: `${OUT}/08-check-explainer.png`, fullPage: true });
  await checkPage.close();

  await browser.close();
  console.log(`\nAll screenshots saved to ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
