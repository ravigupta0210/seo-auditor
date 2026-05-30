import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  const cspViolations: string[] = [];
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      consoleErrors.push(t);
      if (/Content Security Policy|CSP/i.test(t)) cspViolations.push(t);
    }
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/seo-polished/post-csp-landing.png', fullPage: true });

  // Also check that an audit still works (EventSource through CSP connect-src)
  await page.goto('http://localhost:3000/audit?url=https%3A%2F%2Fexample.com&scope=single', { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('text=View shareable report', { timeout: 30_000 });
    console.log('✓ audit completed end-to-end with new CSP');
  } catch {
    console.log('✗ audit failed to complete — CSP may be blocking EventSource');
  }
  await page.screenshot({ path: '/tmp/seo-polished/post-csp-audit.png', fullPage: true });

  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`CSP violations: ${cspViolations.length}`);
  if (cspViolations.length > 0) {
    console.log('Violations:');
    cspViolations.slice(0, 5).forEach((v) => console.log('  ' + v.slice(0, 200)));
  }
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 3).forEach((e) => console.log('  err: ' + e.slice(0, 200)));
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
