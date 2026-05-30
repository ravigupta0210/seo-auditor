import { fetchPage, type FetchOptions } from './fetcher.js';
import type { PageContext } from '../types/check.js';
import { logger } from '../lib/logger.js';

let playwrightAvailable: boolean | null = null;
let browserPromise: Promise<unknown> | null = null;

/**
 * Optional Playwright renderer. Falls back to raw fetch when Playwright
 * isn't installed (which is the default — Playwright adds ~300MB to install
 * size, so we keep it optional and load on demand).
 */
export async function renderPage(url: string, opts: FetchOptions = {}): Promise<PageContext> {
  const useJs = process.env.RENDER_JS === '1';
  if (!useJs) return fetchPage(url, opts);

  if (playwrightAvailable === false) return fetchPage(url, opts);

  try {
    if (playwrightAvailable === null) {
      // Lazy import — only loaded when RENDER_JS=1 is set. We use a dynamic
      // import expression that TS can't statically resolve so the project
      // builds without the playwright package installed.
      const moduleName = 'playwright';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pw: any = await import(/* @vite-ignore */ moduleName).catch(() => null);
      if (!pw?.chromium) {
        playwrightAvailable = false;
        logger.info('Playwright not installed; falling back to raw fetch');
        return fetchPage(url, opts);
      }
      playwrightAvailable = true;
      browserPromise = pw.chromium.launch({
        headless: true,
        args: ['--disable-dev-shm-usage', '--no-sandbox'],
      });
    }

    const browser = (await browserPromise) as {
      newContext(opts: unknown): Promise<unknown>;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = (await browser.newContext({ userAgent: opts.ua ?? undefined })) as any;
    const page = await context.newPage();
    let status = 0;
    const headers: Record<string, string> = {};
    page.on('response', (resp: { url: () => string; status: () => number; headers: () => Record<string, string> }) => {
      if (resp.url() === url || resp.url() === url + '/') {
        status = resp.status();
        Object.assign(headers, resp.headers());
      }
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    const html = await page.content();
    const finalUrl = page.url();
    await context.close();
    return {
      url,
      finalUrl,
      status: status || 200,
      html,
      headers,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.warn({ err }, 'Playwright render failed; falling back to raw fetch');
    return fetchPage(url, opts);
  }
}

export async function shutdownRenderer(): Promise<void> {
  if (browserPromise) {
    try {
      const browser = (await browserPromise) as { close(): Promise<void> };
      await browser.close();
    } catch {
      // ignore
    }
    browserPromise = null;
    playwrightAvailable = null;
  }
}
