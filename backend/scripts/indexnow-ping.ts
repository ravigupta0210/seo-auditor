/**
 * IndexNow ping — instantly notify Bing, Yandex, and other IndexNow consumers
 * of new/updated URLs (free, no account). Bing powers ChatGPT's live retrieval,
 * so this is high-leverage for the GEO goal.
 *
 * The key file must be live at https://<host>/<KEY>.txt (see
 * frontend/public/<KEY>.txt). Run after publishing a batch.
 *
 * Run:  cd backend && npx tsx scripts/indexnow-ping.ts [url ...]
 *   - with no args: submits all published blog posts + core pages
 *   - with args: submits exactly those (absolute or path) URLs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(HERE, '../../frontend/content/blog');

const KEY = 'a3f1c9e84b7d4e2f9c6a1b5d8e0f2a47';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://freeseoaudit.vercel.app').replace(/\/+$/, '');
const HOST = new URL(SITE).host;

function publishedBlogUrls(): string[] {
  if (!existsSync(BLOG_DIR)) return [];
  const urls: string[] = [];
  for (const f of readdirSync(BLOG_DIR).filter((x) => x.endsWith('.json'))) {
    try {
      const p = JSON.parse(readFileSync(path.join(BLOG_DIR, f), 'utf8')) as { slug: string; status?: string };
      if ((p.status ?? 'published') === 'published') urls.push(`${SITE}/blog/${p.slug}`);
    } catch {
      /* skip */
    }
  }
  return urls;
}

function toAbsolute(u: string): string {
  if (u.startsWith('http')) return u;
  return `${SITE}${u.startsWith('/') ? '' : '/'}${u}`;
}

async function main() {
  const args = process.argv.slice(2);
  const urlList = args.length
    ? args.map(toAbsolute)
    : [`${SITE}/`, `${SITE}/blog`, `${SITE}/check`, `${SITE}/compare`, ...publishedBlogUrls()];

  if (!urlList.length) {
    console.log('Nothing to submit.');
    return;
  }

  const body = { host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList };
  console.log(`Submitting ${urlList.length} URL(s) to IndexNow for ${HOST}…`);

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    // IndexNow returns 200 or 202 on success; 422 = key/url mismatch, 403 = key not found.
    console.log(`IndexNow responded ${res.status} ${res.statusText}`);
    if (res.status === 403) console.log('  → 403: the key file is not live yet at the keyLocation. Deploy first, then re-run.');
    if (!res.ok && res.status !== 202) process.exitCode = 1;
  } catch (err) {
    console.error('IndexNow request failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}

main();
