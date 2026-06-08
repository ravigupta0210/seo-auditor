import fs from 'node:fs';
import path from 'node:path';
import { POSTS as LEGACY_POSTS } from '@/app/blog/_posts';

/**
 * Blog content model + build-time loader.
 *
 * Posts live as one JSON file per post under `content/blog/<slug>.json` so the
 * collection scales to thousands of posts without one giant module ballooning
 * build memory. The 7 original hand-written posts still live in `_posts.ts`
 * and are merged in here, so nothing is lost. New posts (richer schema below)
 * are authored as JSON by the "push N blogs" pipeline.
 *
 * fs runs at build time (every blog route is statically generated via
 * generateStaticParams), so there is no runtime filesystem dependency.
 */

export interface BlogImage {
  /** Absolute URL or inline-SVG marker. Use /api or data: only — no local raster assets exist. */
  src: string;
  alt: string;
  caption?: string;
}
export interface FaqItem {
  q: string;
  a: string;
}
export interface InternalLink {
  href: string;
  anchor: string;
}
export interface FlowStep {
  title: string;
  detail?: string;
}
export interface Flowchart {
  title?: string;
  steps: FlowStep[];
}
export interface ComparisonTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}
export interface BlogSection {
  heading?: string;
  /** Markdown-ish paragraphs: supports ```code```, > quote, - lists, **bold**, `code`, ![alt](src). */
  body: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  updatedAt?: string;
  tag: string;
  readTime: number;
  excerpt: string;
  description: string;
  /** Primary target keyword — must appear in the title and the first paragraph. */
  keyword?: string;
  secondaryKeywords?: string[];
  /** Topic-cluster id for internal-link funneling (e.g. 'geo', 'seo-basics'). */
  cluster?: string;
  /** Answer-first one/two-sentence summary shown up top — the LLM extraction zone. */
  tldr?: string;
  sections: BlogSection[];
  faqs?: FaqItem[];
  /** "People also ask" — rendered + emitted as FAQ schema. */
  peopleAlsoAsk?: FaqItem[];
  /** "People also search for" — internal-link funnel anchors. */
  relatedKeywords?: string[];
  internalLinks?: InternalLink[];
  images?: BlogImage[];
  flowchart?: Flowchart;
  comparisonTable?: ComparisonTable;
  status?: 'draft' | 'published';
}

export type BlogPostMeta = Pick<
  BlogPost,
  'slug' | 'title' | 'date' | 'tag' | 'readTime' | 'excerpt' | 'cluster'
>;

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');

function readJsonPosts(): BlogPost[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return []; // directory may not exist yet
  }
  const posts: BlogPost[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
      const post = JSON.parse(raw) as BlogPost;
      if (post?.slug && (post.status ?? 'published') === 'published') posts.push(post);
    } catch {
      // skip malformed files rather than failing the whole build
    }
  }
  return posts;
}

function legacyPosts(): BlogPost[] {
  return Object.values(LEGACY_POSTS).map((p) => ({ ...p, status: 'published' as const }));
}

let cache: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
  if (cache) return cache;
  const json = readJsonPosts();
  const jsonSlugs = new Set(json.map((p) => p.slug));
  // JSON posts win over a same-slug legacy post.
  const merged = [...json, ...legacyPosts().filter((p) => !jsonSlugs.has(p.slug))];
  merged.sort((a, b) => (b.updatedAt ?? b.date).localeCompare(a.updatedAt ?? a.date));
  cache = merged;
  return merged;
}

export function getPost(slug: string): BlogPost | undefined {
  const decoded = decodeURIComponent(slug);
  return getAllPosts().find((p) => p.slug === decoded);
}

export function getPostIndex(): BlogPostMeta[] {
  return getAllPosts().map(({ slug, title, date, tag, readTime, excerpt, cluster }) => ({
    slug,
    title,
    date,
    tag,
    readTime,
    excerpt,
    cluster,
  }));
}

/** Distinct tags present across all posts, in a stable display order. */
export function getTags(): string[] {
  const preferred = ['GEO', 'AI Search', 'JSON-LD', 'Metadata', 'Crawling'];
  const present = new Set(getAllPosts().map((p) => p.tag));
  const ordered = preferred.filter((t) => present.has(t));
  for (const t of present) if (!ordered.includes(t)) ordered.push(t);
  return ordered;
}
