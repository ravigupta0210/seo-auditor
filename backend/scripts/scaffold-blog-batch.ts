/**
 * Scaffold the next N blog drafts from the keyword queue.
 *
 * Picks the next N queue candidates (GEO-first ordering preserved) whose slug
 * doesn't already have a content file, and writes a draft skeleton for each to
 * frontend/content/blog/<slug>.json with status:"draft". The authoring step
 * (Claude / the push-10-blogs workflow) then fills in the prose, FAQ answers,
 * flowchart, and TL;DR and flips status to "published".
 *
 * Run:  cd backend && npx tsx scripts/scaffold-blog-batch.ts [N]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(HERE, '../../frontend/content');
const BLOG_DIR = path.join(CONTENT, 'blog');

const CLUSTER_TAG: Record<string, string> = {
  geo: 'GEO',
  'ai-search': 'AI Search',
  'structured-data': 'JSON-LD',
  'technical-seo': 'Technical SEO',
  metadata: 'Metadata',
  'content-links': 'Content',
  'seo-basics': 'SEO',
  'seo-careers': 'Careers',
};

interface QueueItem {
  slug: string;
  title: string;
  keyword: string;
  cluster: string;
  peopleAlsoAsk: string[];
  relatedKeywords: string[];
  internalLinks: Array<{ href: string; anchor: string }>;
}

function main() {
  const n = Math.max(1, Math.min(50, Number(process.argv[2]) || 10));
  const queuePath = path.join(CONTENT, 'blog-queue.json');
  if (!existsSync(queuePath)) {
    console.error('blog-queue.json not found — run keyword-research.ts first.');
    process.exit(1);
  }
  mkdirSync(BLOG_DIR, { recursive: true });

  const { queue } = JSON.parse(readFileSync(queuePath, 'utf8')) as { queue: QueueItem[] };
  const existing = new Set(readdirSync(BLOG_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')));

  const today = new Date().toISOString().slice(0, 10);
  const picked: string[] = [];

  for (const item of queue) {
    if (picked.length >= n) break;
    if (existing.has(item.slug)) continue;

    const draft = {
      slug: item.slug,
      title: item.title,
      date: today,
      updatedAt: today,
      tag: CLUSTER_TAG[item.cluster] ?? 'SEO',
      cluster: item.cluster,
      keyword: item.keyword,
      secondaryKeywords: [] as string[],
      readTime: 0,
      excerpt: '',
      description: '',
      tldr: '',
      status: 'draft',
      sections: [] as Array<{ heading?: string; body: string[] }>,
      peopleAlsoAsk: item.peopleAlsoAsk.map((q) => ({ q, a: '' })),
      faqs: [] as Array<{ q: string; a: string }>,
      relatedKeywords: item.relatedKeywords,
      internalLinks: item.internalLinks,
      images: [] as Array<{ src: string; alt: string; caption?: string }>,
    };

    writeFileSync(path.join(BLOG_DIR, `${item.slug}.json`), JSON.stringify(draft, null, 2));
    picked.push(item.slug);
  }

  console.log(`Scaffolded ${picked.length} draft(s):`);
  for (const s of picked) console.log(`  - ${s}`);
  if (picked.length < n) console.log(`(queue exhausted or all remaining already scaffolded)`);
}

main();
