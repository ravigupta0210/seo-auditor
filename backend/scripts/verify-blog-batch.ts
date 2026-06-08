/**
 * Quality gate for blog content. Run before publishing/deploying a batch.
 *
 * Enforces the rules that make a post genuinely useful (and Google/GEO-friendly)
 * rather than thin scaled content:
 *   - primary keyword present, and in the title + first paragraph
 *   - answer-first TL;DR present
 *   - description 70–170 chars; title + description unique across all posts
 *   - >= 3 internal links (array entries + inline /-links in body)
 *   - >= 1 visual (image, flowchart, or comparison table)
 *   - >= 3 FAQ/PAA pairs with non-empty answers
 *   - >= 600 words of body
 * Plus cross-post duplicate-title/description detection (mirrors the backend
 * crossPageChecks in routes/audit.ts).
 *
 * Exits non-zero if any published post fails — wire into the deploy step.
 * Run:  cd backend && npx tsx scripts/verify-blog-batch.ts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(HERE, '../../frontend/content/blog');

interface Post {
  slug: string;
  title: string;
  description: string;
  keyword?: string;
  tldr?: string;
  status?: string;
  sections: Array<{ heading?: string; body: string[] }>;
  faqs?: Array<{ q: string; a: string }>;
  peopleAlsoAsk?: Array<{ q: string; a: string }>;
  internalLinks?: Array<{ href: string; anchor: string }>;
  images?: unknown[];
  flowchart?: { steps?: unknown[] };
  comparisonTable?: { rows?: unknown[] };
}

function bodyText(p: Post): string {
  return p.sections.flatMap((s) => s.body).join('\n');
}
function firstParagraph(p: Post): string {
  for (const s of p.sections) for (const b of s.body) if (b.trim() && !b.startsWith('```')) return b;
  return '';
}
function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}
function countInternalLinks(p: Post): number {
  const inline = (bodyText(p).match(/\]\(\/[^)]*\)/g) ?? []).length;
  return (p.internalLinks?.length ?? 0) + inline;
}

function checkPost(p: Post): string[] {
  const errs: string[] = [];
  const kw = (p.keyword ?? '').toLowerCase();
  if (!kw) errs.push('missing primary keyword');
  else {
    if (!p.title.toLowerCase().includes(kw)) errs.push('keyword not in title');
    if (!firstParagraph(p).toLowerCase().includes(kw)) errs.push('keyword not in first paragraph');
  }
  if (!p.tldr || wordCount(p.tldr) < 8) errs.push('missing/short TL;DR');
  const dlen = (p.description ?? '').length;
  if (dlen < 70 || dlen > 170) errs.push(`description length ${dlen} (want 70–170)`);
  if (!p.title || p.title.length < 15) errs.push('title too short');
  if (countInternalLinks(p) < 3) errs.push(`only ${countInternalLinks(p)} internal links (want >=3)`);
  const visuals = (p.images?.length ?? 0) + (p.flowchart?.steps?.length ? 1 : 0) + (p.comparisonTable?.rows?.length ? 1 : 0);
  if (visuals < 1) errs.push('no visual (image / flowchart / table)');
  const qa = [...(p.faqs ?? []), ...(p.peopleAlsoAsk ?? [])].filter((x) => x.a && x.a.trim().length > 10);
  if (qa.length < 3) errs.push(`only ${qa.length} answered FAQ/PAA (want >=3)`);
  const wc = wordCount(bodyText(p));
  if (wc < 600) errs.push(`body ${wc} words (want >=600)`);
  return errs;
}

function main() {
  if (!existsSync(BLOG_DIR)) {
    console.error('content/blog not found.');
    process.exit(1);
  }
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.json'));
  const posts: Post[] = [];
  for (const f of files) {
    try {
      posts.push(JSON.parse(readFileSync(path.join(BLOG_DIR, f), 'utf8')) as Post);
    } catch {
      console.error(`✗ ${f}: invalid JSON`);
      process.exitCode = 1;
    }
  }

  const published = posts.filter((p) => (p.status ?? 'published') === 'published');
  const drafts = posts.filter((p) => p.status === 'draft');

  let failures = 0;
  for (const p of published) {
    const errs = checkPost(p);
    if (errs.length) {
      failures++;
      console.log(`✗ ${p.slug}`);
      for (const e of errs) console.log(`    - ${e}`);
    } else {
      console.log(`✓ ${p.slug}`);
    }
  }

  // Cross-post duplicate detection
  const byTitle = new Map<string, string[]>();
  const byDesc = new Map<string, string[]>();
  for (const p of published) {
    (byTitle.get(p.title.toLowerCase()) ?? byTitle.set(p.title.toLowerCase(), []).get(p.title.toLowerCase())!).push(p.slug);
    if (p.description) (byDesc.get(p.description.toLowerCase()) ?? byDesc.set(p.description.toLowerCase(), []).get(p.description.toLowerCase())!).push(p.slug);
  }
  for (const [title, slugs] of byTitle) if (slugs.length > 1) { failures++; console.log(`✗ duplicate title "${title}" in: ${slugs.join(', ')}`); }
  for (const [, slugs] of byDesc) if (slugs.length > 1) { failures++; console.log(`✗ duplicate description in: ${slugs.join(', ')}`); }

  console.log(`\n${published.length} published, ${drafts.length} draft, ${failures} failure(s).`);
  if (drafts.length) console.log(`Drafts (not yet publishable): ${drafts.map((d) => d.slug).join(', ')}`);
  if (failures > 0) process.exit(1);
}

main();
