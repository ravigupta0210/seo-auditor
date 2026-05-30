import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });

  console.log('Capturing VitalFlow landing…');
  const vf = await ctx.newPage();
  await vf.goto('https://vitalflow-black.vercel.app/login', { waitUntil: 'networkidle', timeout: 30_000 });
  await vf.waitForTimeout(1500);
  await vf.screenshot({ path: '/tmp/portfolio-vitalflow.png', fullPage: false });
  console.log('  → /tmp/portfolio-vitalflow.png');
  await vf.close();
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
