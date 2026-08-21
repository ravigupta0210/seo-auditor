/**
 * Export blog posts as Dev.to-ready markdown.
 *
 * Why: our own domain has almost no crawl demand (203 of 205 URLs sit in
 * Search Console as "Discovered - currently not indexed", never fetched).
 * Dev.to is crawled constantly, so a cross-post with `canonical_url` pointing
 * home puts our URLs on a page Googlebot already visits daily — which is what
 * actually pulls them out of the discovery queue.
 *
 * Every relative link is rewritten to an absolute one for the same reason:
 * on Dev.to a relative href would 404, and as an absolute URL it becomes
 * another crawl path back to us.
 *
 * Usage: npx tsx scripts/export-devto.ts <slug> [<slug> ...]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(here, '../..');
const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://freeseoaudit.vercel.app';
const OUT_DIR = resolve(REPO, 'docs/launch/devto');

interface Post {
  slug: string; title: string; date: string; updatedAt?: string;
  tag?: string; cluster?: string; excerpt?: string; description?: string; tldr?: string;
  sections?: { heading: string; body: string[] }[];
  comparisonTable?: { caption?: string; headers: string[]; rows: string[][] };
  faqs?: { q: string; a: string }[];
  internalLinks?: { href: string; anchor: string }[];
}

/** Relative hrefs must become absolute — on Dev.to they would otherwise 404. */
function absolutize(md: string): string {
  return md.replace(/\]\((\/[^)]*)\)/g, (_m, path) => `](${SITE}${path})`);
}

const DEVTO_TAGS: Record<string, string> = {
  geo: 'seo, ai, webdev, programming',
  'ai-search': 'ai, seo, webdev, programming',
  'technical-seo': 'webdev, seo, programming, performance',
};

function renderTable(t: Post['comparisonTable']): string[] {
  if (!t?.headers?.length) return [];
  const out: string[] = [];
  if (t.caption) { out.push(`**${t.caption}**`); out.push(''); }
  out.push(`| ${t.headers.join(' | ')} |`);
  out.push(`| ${t.headers.map(() => '---').join(' | ')} |`);
  for (const row of t.rows ?? []) out.push(`| ${row.map((c) => absolutize(String(c))).join(' | ')} |`);
  out.push('');
  return out;
}

function toMarkdown(p: Post): string {
  const canonical = `${SITE}/blog/${p.slug}`;
  const tags = DEVTO_TAGS[p.cluster ?? ''] ?? 'seo, webdev, ai, programming';

  const out: string[] = [];
  let tableRendered = false;
  // Dev.to front matter. published:false so you review before it goes live.
  out.push('---');
  out.push(`title: ${p.title}`);
  out.push(`published: false`);
  out.push(`description: ${(p.description ?? p.excerpt ?? '').replace(/\n/g, ' ')}`);
  out.push(`tags: ${tags}`);
  out.push(`canonical_url: ${canonical}`);
  out.push('---');
  out.push('');

  if (p.tldr) {
    out.push(`> **TL;DR** — ${absolutize(p.tldr)}`);
    out.push('');
  }

  for (const s of p.sections ?? []) {
    out.push(`## ${s.heading}`);
    out.push('');
    for (const para of s.body ?? []) {
      const token = para.trim();
      // The body references the table in place ("Here are the ones worth
      // knowing"), so render it where the token sits rather than appending it
      // at the end where the surrounding prose no longer makes sense.
      if (token === '[[table]]') {
        out.push(...renderTable(p.comparisonTable));
        tableRendered = true;
        continue;
      }
      // Other custom tokens mean nothing outside our own renderer.
      if (/^\[\[(flowchart|image:\d+)\]\]$/.test(token)) continue;
      out.push(absolutize(para));
      out.push('');
    }
  }

  // Fallback: only if the body had no [[table]] token to anchor it.
  if (!tableRendered) out.push(...renderTable(p.comparisonTable));

  if (p.faqs?.length) {
    out.push('## FAQ');
    out.push('');
    for (const f of p.faqs) {
      out.push(`### ${f.q}`);
      out.push('');
      out.push(absolutize(f.a));
      out.push('');
    }
  }

  out.push('---');
  out.push('');
  out.push(
    `*Originally published at [${canonical.replace(/^https?:\/\//, '')}](${canonical}). ` +
      `I build [a free SEO + AI-search (GEO) auditor](${SITE}) — no signup, no paywall, ` +
      `[open source](https://github.com/ravigupta0210/seo-auditor). ` +
      `You can [run it on your own site](${SITE}) or [browse every check it performs](${SITE}/check).*`,
  );
  out.push('');
  return out.join('\n');
}

const slugs = process.argv.slice(2);
if (slugs.length === 0) {
  console.error('Usage: npx tsx scripts/export-devto.ts <slug> [<slug> ...]');
  process.exit(1);
}

for (const slug of slugs) {
  const src = resolve(REPO, 'frontend/content/blog', `${slug}.json`);
  if (!existsSync(src)) { console.error(`  ✗ ${slug} — no such post`); continue; }
  const post = JSON.parse(readFileSync(src, 'utf8')) as Post;
  const md = toMarkdown(post);
  const dest = resolve(OUT_DIR, `${slug}.md`);
  writeFileSync(dest, md, 'utf8');
  const links = (md.match(new RegExp(`\\]\\(${SITE}`, 'g')) ?? []).length;
  console.log(`  ✓ ${slug.padEnd(30)} ${String(md.split(/\s+/).length).padStart(5)} words, ${links} links back to the site`);
}
console.log(`\nWritten to docs/launch/devto/`);
