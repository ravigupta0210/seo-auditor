/**
 * End-to-end driver: opens the running frontend in a real browser, submits
 * audits for several real-world sites, watches the SSE stream, takes
 * screenshots, and reports anything that looks broken.
 *
 * Prereqs: backend on :4000 and frontend on :3000 must be running.
 * Run: npx tsx backend/scripts/e2e-test.ts
 */
import { chromium, type Page, type ConsoleMessage } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
const OUT_DIR = process.env.E2E_OUT || '/tmp/seo-screenshots';
const TARGETS = [
  { name: 'example.com', url: 'https://example.com', scope: 'single' },
  { name: 'github.com', url: 'https://github.com', scope: 'single' },
  { name: 'vercel.com', url: 'https://vercel.com', scope: 'single' },
  { name: 'news.ycombinator.com', url: 'https://news.ycombinator.com', scope: 'single' },
  { name: 'self', url: FRONTEND, scope: 'single' }, // audit our own site
] as const;

interface Finding {
  target: string;
  kind: 'console' | 'page-error' | 'request-fail' | 'response-error' | 'timeout' | 'observation';
  message: string;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const findings: Finding[] = [];
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  try {
    // Landing page sanity check
    const landing = await ctx.newPage();
    wireListeners(landing, 'landing', findings);
    await landing.goto(FRONTEND, { waitUntil: 'networkidle', timeout: 30_000 });
    await landing.screenshot({ path: join(OUT_DIR, '00-landing.png'), fullPage: true });
    const heroH1 = await landing.locator('h1').first().textContent();
    console.log(`[landing] H1: "${heroH1?.trim()}"`);

    const hasForm = await landing.locator('input[placeholder*="example.com"]').count();
    console.log(`[landing] form present: ${hasForm > 0 ? 'yes' : 'no'}`);
    if (hasForm === 0) findings.push({ target: 'landing', kind: 'observation', message: 'Audit form not found on landing' });

    const hasFooter = await landing.locator('footer').count();
    console.log(`[landing] footer present: ${hasFooter > 0 ? 'yes' : 'no'}`);

    await landing.close();

    // Audit each target — never crash on one failure; record and move on
    for (const t of TARGETS) {
      console.log(`\n========== ${t.name} (${t.scope}) ==========`);
      const page = await ctx.newPage();
      wireListeners(page, t.name, findings);
      const start = Date.now();

      try {
        const auditUrl = `${FRONTEND}/audit?url=${encodeURIComponent(t.url)}&scope=${t.scope}`;
        await page.goto(auditUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.screenshot({ path: join(OUT_DIR, `${slug(t.name)}-01-loading.png`), fullPage: true });

        // Wait for "Overall" score bar OR any error-tinted status message
        let outcome: 'done' | 'error' | 'timeout' = 'timeout';
        const overallLocator = page.locator('text=/Overall/').first();
        const errorLocator = page.locator('p').filter({ hasText: /Refus|fail|HTTP \d{3}|Connection closed|exceed|timeout/i }).first();
        try {
          await Promise.race([
            overallLocator.waitFor({ state: 'visible', timeout: 75_000 }),
            errorLocator.waitFor({ state: 'visible', timeout: 75_000 }),
          ]);
          outcome = (await errorLocator.count()) > 0 ? 'error' : 'done';
        } catch {
          outcome = 'timeout';
          findings.push({ target: t.name, kind: 'timeout', message: 'Neither score nor visible error appeared within 75s' });
        }

        await page.waitForTimeout(1500);
        await page.screenshot({ path: join(OUT_DIR, `${slug(t.name)}-02-done.png`), fullPage: true });

        const score = (await page.locator('div').filter({ hasText: /^\d{1,3} \/100$/ }).first().textContent().catch(() => null)) ?? 'n/a';
        const checkCount = await page.locator('article, details').count();
        const errMsg = outcome === 'error' ? (await errorLocator.textContent().catch(() => '')) : '';

        const elapsedMs = Date.now() - start;
        console.log(`[${t.name}] outcome=${outcome} elapsed=${elapsedMs}ms score=${score.trim()} checks=${checkCount}`);
        if (errMsg) console.log(`[${t.name}] error message shown: "${errMsg.trim()}"`);

        if (outcome === 'done') {
          const shareLink = page.locator('a:has-text("View shareable report")');
          if ((await shareLink.count()) > 0) {
            const href = await shareLink.getAttribute('href');
            if (href) {
              const reportPage = await ctx.newPage();
              wireListeners(reportPage, `${t.name}/report`, findings);
              await reportPage.goto(new URL(href, FRONTEND).toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
              await reportPage.waitForTimeout(1500);
              await reportPage.screenshot({ path: join(OUT_DIR, `${slug(t.name)}-03-report.png`), fullPage: true });
              const reportH1 = await reportPage.locator('h1').first().textContent();
              console.log(`[${t.name}/report] H1: "${reportH1?.trim()}"`);
              await reportPage.close();
            }
          } else {
            findings.push({ target: t.name, kind: 'observation', message: '"View shareable report" link missing after done' });
          }
        }
      } catch (err) {
        findings.push({ target: t.name, kind: 'observation', message: `Driver error: ${err instanceof Error ? err.message : String(err)}` });
      } finally {
        await page.close().catch(() => {});
      }
    }

    // Visit programmatic pages
    for (const path of ['/check', '/check/metadata.title.missing', '/compare', '/compare/vs-screaming-frog', '/blog', '/blog/llms-txt-explained']) {
      const p = await ctx.newPage();
      wireListeners(p, path, findings);
      const resp = await p.goto(`${FRONTEND}${path}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      const ok = resp && resp.status() < 400;
      console.log(`[${path}] HTTP ${resp?.status()} ${ok ? 'OK' : 'FAIL'}`);
      await p.screenshot({ path: join(OUT_DIR, `page${path.replace(/\//g, '_')}.png`), fullPage: true });
      await p.close();
    }
  } finally {
    await ctx.close();
    await browser.close();
  }

  // Group findings
  const grouped = findings.reduce<Record<string, Finding[]>>((acc, f) => {
    (acc[f.kind] = acc[f.kind] ?? []).push(f);
    return acc;
  }, {});

  const report = {
    finishedAt: new Date().toISOString(),
    totalFindings: findings.length,
    byKind: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
    findings,
  };
  await writeFile(join(OUT_DIR, 'findings.json'), JSON.stringify(report, null, 2));
  console.log('\n=========== SUMMARY ===========');
  console.log(`Findings: ${findings.length}`);
  for (const [kind, count] of Object.entries(report.byKind)) console.log(`  ${kind}: ${count}`);
  if (findings.length > 0) {
    console.log('\nFirst 20 findings:');
    findings.slice(0, 20).forEach((f) => console.log(`  [${f.target}] ${f.kind}: ${f.message}`));
  }
  console.log(`\nScreenshots in: ${OUT_DIR}`);
}

function slug(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
}

function wireListeners(page: Page, label: string, findings: Finding[]) {
  page.on('console', (msg: ConsoleMessage) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      const text = msg.text();
      // ignore expected dev-only React warnings about hydration of static markup we know is fine
      if (/React DevTools|Download the React DevTools/.test(text)) return;
      findings.push({ target: label, kind: 'console', message: `[${type}] ${text}` });
    }
  });
  page.on('pageerror', (err) => {
    findings.push({ target: label, kind: 'page-error', message: err.message });
  });
  page.on('requestfailed', (req) => {
    if (req.url().startsWith('chrome-extension://') || req.url().includes('/.well-known/')) return;
    findings.push({ target: label, kind: 'request-fail', message: `${req.method()} ${req.url()} — ${req.failure()?.errorText}` });
  });
  page.on('response', (resp) => {
    const url = resp.url();
    if (resp.status() >= 500 && !url.includes('/__next/')) {
      findings.push({ target: label, kind: 'response-error', message: `${resp.status()} ${url}` });
    }
  });
}

main().catch((err) => {
  console.error('e2e test crashed:', err);
  process.exit(1);
});
