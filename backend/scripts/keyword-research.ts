/**
 * Keyword research engine.
 *
 * Produces two artifacts under frontend/content/:
 *   - keywords.json    — the full keyword database (5,000+), classified + clustered
 *   - blog-queue.json  — curated, prioritized post candidates (GEO-first) that the
 *                        "push N blogs" pipeline draws from
 *
 * Strategy (free, no API key):
 *   1. Combinatorial expansion of curated GEO-first + broad-SEO seeds × question
 *      prefixes × modifiers. This alone guarantees a large, on-topic DB even if
 *      the network is unavailable.
 *   2. Live enrichment from Google Autocomplete (the unofficial but public
 *      complete/search endpoint) for the highest-value seeds — real queries
 *      people actually type. Best-effort + rate-limited; failures are ignored.
 *
 * Run:  cd backend && npx tsx scripts/keyword-research.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(HERE, '../../frontend/content');

// ----------------------------------------------------------------------------
// Seeds — GEO weighted first (our winnable wedge), then broad SEO (the funnel),
// then the exact People-Also-Ask / People-also-search-for terms the user gave.
// ----------------------------------------------------------------------------
const GEO_SEEDS = [
  'generative engine optimization', 'GEO', 'AEO', 'answer engine optimization',
  'AI search optimization', 'how to rank in ChatGPT', 'how to rank in AI overviews',
  'how to get cited by AI', 'how to get cited by Perplexity', 'how to appear in ChatGPT',
  'llms.txt', 'ChatGPT SEO', 'Perplexity SEO', 'Google AI overviews', 'Bing AI SEO',
  'AI crawler', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'optimize for LLM',
  'AI citations', 'structured data for AI search', 'FAQ schema', 'schema markup for AI',
  'is SEO dead', 'will AI replace SEO', 'GEO vs SEO', 'AEO vs SEO',
  'how do AI search engines work', 'how to optimize for generative AI', 'AI overview optimization',
];

const SEO_SEEDS = [
  'SEO', 'SEO audit', 'free SEO audit', 'SEO checker', 'technical SEO', 'on page SEO',
  'off page SEO', 'SEO checklist', 'meta description', 'title tag', 'canonical tag',
  'robots.txt', 'sitemap', 'core web vitals', 'JSON-LD', 'structured data',
  'rich results', 'rich snippets', 'backlinks', 'keyword research', 'internal linking',
  'duplicate content', 'hreflang', 'page speed', 'mobile SEO', 'local SEO',
  'ecommerce SEO', 'SEO tools', 'how to do SEO', 'what is SEO', 'how SEO works',
  'SEO for beginners', 'types of SEO', 'pillars of SEO', 'learn SEO', 'SEO strategy',
];

// The exact People-Also-Ask + People-also-search-for terms supplied by the user.
// These are real SERP questions → top-priority blog candidates.
const CURATED_QUESTIONS = [
  'How to SEO for beginners', 'How do I do SEO on my own', 'Can ChatGPT do SEO',
  'What is SEO and how to start', 'Can I self learn SEO', 'What is a SEO salary',
  'What are the 4 types of SEO', 'Can ChatGPT do an SEO audit', 'Is SEO an IT skill',
  'Which type of SEO is best', 'What are the 5 pillars of SEO', 'How many SEO tools are there',
  'Which AI is better for SEO', 'Who is the god of SEO', 'Which language is best for SEO',
  'Is SEO replaced by AI', 'Is SEO higher than CEO', 'Which 3 jobs will survive AI',
  'Is SEO dead or evolving in 2026', 'How to do SEO for website step by step',
  'How to do SEO for free', 'How to do SEO in digital marketing',
  'What is SEO and how it works', 'How to do SEO on Google',
  'How to do SEO optimization for website', 'SEO marketing',
];

const QUESTION_PREFIXES = [
  'how to', 'what is', 'why', 'can', 'does', 'is', 'are', 'which', 'how do i',
  'how does', 'what are', 'best way to', 'how much', 'when to', 'should i', 'do i need',
  'how can i', 'what does', 'where to', 'who',
];

const MODIFIERS = [
  'for beginners', 'for free', 'free', '2026', 'tool', 'tools', 'software', 'checklist',
  'guide', 'tutorial', 'examples', 'step by step', 'meaning', 'definition', 'best practices',
  'without coding', 'for small business', 'for ecommerce', 'vs SEO', 'explained',
  'mistakes', 'tips', 'how long', 'cost', 'price', 'reddit', 'course', 'certification',
  'jobs', 'salary', 'for website', 'for blog', 'for youtube', 'template', 'audit',
  'analyzer', 'score', 'checker', 'best', 'top', 'comparison', 'pdf', 'cheat sheet',
  'in digital marketing', 'for startups', 'for saas', 'requirements', 'strategy',
];

// ----------------------------------------------------------------------------
// Classification
// ----------------------------------------------------------------------------
type Intent = 'informational' | 'commercial' | 'navigational';
type RouteType = 'blog' | 'compare' | 'check';
type Cluster =
  | 'geo' | 'ai-search' | 'structured-data' | 'technical-seo'
  | 'metadata' | 'content-links' | 'seo-basics' | 'seo-careers';

interface Keyword {
  keyword: string;
  words: number;
  type: 'short-tail' | 'long-tail';
  intent: Intent;
  cluster: Cluster;
  targetRouteType: RouteType;
  isQuestion: boolean;
  source: 'combinatorial' | 'autocomplete' | 'curated-paa';
}

const CLUSTER_RULES: Array<{ cluster: Cluster; tokens: string[] }> = [
  { cluster: 'geo', tokens: ['geo', 'generative engine', 'aeo', 'answer engine', 'llms.txt', 'cited by', 'get cited'] },
  { cluster: 'ai-search', tokens: ['chatgpt', 'perplexity', 'claude', 'gptbot', 'claudebot', 'ai overview', 'ai search', 'ai crawler', 'llm', 'bing ai', 'generative ai', 'replace seo', 'replaced by ai', 'ai better for seo', 'survive ai'] },
  { cluster: 'structured-data', tokens: ['json-ld', 'json ld', 'schema', 'structured data', 'rich result', 'rich snippet', 'faqpage', 'breadcrumb'] },
  { cluster: 'technical-seo', tokens: ['robots.txt', 'robots txt', 'sitemap', 'canonical', 'hreflang', 'crawl', 'index', 'core web vitals', 'page speed', 'redirect', 'http'] },
  { cluster: 'metadata', tokens: ['title tag', 'meta description', 'open graph', 'twitter card', 'meta tag', 'favicon'] },
  { cluster: 'content-links', tokens: ['backlink', 'keyword research', 'internal link', 'anchor text', 'heading', 'alt text', 'duplicate content', 'content'] },
  { cluster: 'seo-careers', tokens: ['salary', 'jobs', 'career', 'it skill', 'higher than ceo', 'expert in india', 'god of seo', 'survive ai', 'elon musk'] },
];

function classifyCluster(kw: string): Cluster {
  const l = kw.toLowerCase();
  for (const rule of CLUSTER_RULES) {
    if (rule.tokens.some((t) => l.includes(t))) return rule.cluster;
  }
  return 'seo-basics';
}

const QUESTION_WORDS = ['how', 'what', 'why', 'can', 'does', 'is', 'are', 'which', 'who', 'when', 'where', 'do '];
function isQuestion(kw: string): boolean {
  const l = kw.toLowerCase().trim();
  return l.endsWith('?') || QUESTION_WORDS.some((w) => l.startsWith(w));
}

function classifyIntent(kw: string): Intent {
  const l = kw.toLowerCase();
  if (/\bvs\b|\balternative|best |top \d|pricing|cheap|tool|software|checker|free/.test(l)) return 'commercial';
  if (isQuestion(kw)) return 'informational';
  return 'informational';
}

function routeType(kw: string): RouteType {
  const l = kw.toLowerCase();
  if (/\bvs\b|alternative to|compared to/.test(l)) return 'compare';
  return 'blog';
}

function normalize(kw: string): string {
  return kw.toLowerCase().replace(/\s+/g, ' ').replace(/[?.!]+$/, '').trim();
}

function makeKeyword(raw: string, source: Keyword['source']): Keyword | null {
  const k = raw.replace(/\s+/g, ' ').trim();
  if (k.length < 3 || k.length > 90) return null;
  const words = k.split(' ').length;
  return {
    keyword: k,
    words,
    type: words <= 2 ? 'short-tail' : 'long-tail',
    intent: classifyIntent(k),
    cluster: classifyCluster(k),
    targetRouteType: routeType(k),
    isQuestion: isQuestion(k),
    source,
  };
}

// ----------------------------------------------------------------------------
// Google Autocomplete (best-effort)
// ----------------------------------------------------------------------------
async function autocomplete(query: string): Promise<string[]> {
  const url = `https://www.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(query)}`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 6000);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; SEOAuditorKW/0.1)' },
    });
    if (!res.ok) return [];
    const data = JSON.parse(await res.text()) as [string, string[]];
    return Array.isArray(data?.[1]) ? data[1] : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Autocomplete is noisy: expanding a short seed like "GEO a", "GEO b" surfaces
// "georgia", "geometry dash", etc. Keep only suggestions anchored to our niche.
const ANCHOR_WORD = /\b(seo|geo|aeo|ai|gpt|llm|llms|serp)\b/i;
const ANCHOR_SUB = [
  'search', 'chatgpt', 'perplexity', 'claude', 'schema', 'json', 'sitemap', 'robots',
  'crawl', 'index', 'rank', 'keyword', 'backlink', 'metadata', 'meta ', 'content',
  'google', 'bing', 'optimiz', 'structured', 'snippet', 'audit', 'overview',
  'generative', 'answer engine', 'canonical', 'hreflang', 'core web', 'website',
  'digital marketing', 'page speed', 'rich result',
];
function isOnTopic(s: string): boolean {
  const l = s.toLowerCase();
  return ANCHOR_WORD.test(l) || ANCHOR_SUB.some((t) => l.includes(t));
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
async function main() {
  const map = new Map<string, Keyword>();
  const add = (raw: string, source: Keyword['source']) => {
    const kw = makeKeyword(raw, source);
    if (!kw) return;
    const key = normalize(kw.keyword);
    if (!map.has(key)) map.set(key, kw);
  };

  const allSeeds = [...GEO_SEEDS, ...SEO_SEEDS];

  // 1) Curated PAA questions (highest value)
  for (const q of CURATED_QUESTIONS) add(q, 'curated-paa');

  // 2) Combinatorial expansion
  for (const seed of allSeeds) {
    add(seed, 'combinatorial');
    for (const p of QUESTION_PREFIXES) add(`${p} ${seed}`, 'combinatorial');
    for (const m of MODIFIERS) add(`${seed} ${m}`, 'combinatorial');
    // selective triple combos with the most natural modifiers
    for (const m of ['for beginners', '2026', 'free', 'step by step', 'without coding', 'for small business', 'guide', 'examples']) {
      add(`how to ${seed} ${m}`, 'combinatorial');
      add(`best ${seed} ${m}`, 'combinatorial');
    }
  }
  const afterCombinatorial = map.size;
  console.log(`[kw] combinatorial + curated: ${afterCombinatorial} keywords`);

  // 3) Autocomplete enrichment — cap requests to stay polite + fast.
  const REQUEST_BUDGET = 700;
  const enrichSeeds = [
    ...GEO_SEEDS,
    ...SEO_SEEDS,
    ...CURATED_QUESTIONS,
  ];
  // alphabetic expansion ("seed a", "seed b"...) on every GEO seed + strong SEO seeds
  const alphaSeeds = [...GEO_SEEDS, 'how to do SEO', 'free SEO audit', 'SEO audit', 'technical SEO', 'keyword research', 'what is SEO', 'on page SEO', 'local SEO'];
  const queries: string[] = [...enrichSeeds];
  for (const s of alphaSeeds) for (const c of 'abcdefghijklmnopqrstuvwxyz') queries.push(`${s} ${c}`);

  let used = 0;
  let live = 0;
  for (const q of queries) {
    if (used >= REQUEST_BUDGET) break;
    used++;
    const suggestions = await autocomplete(q);
    if (suggestions.length) live++;
    for (const s of suggestions) if (isOnTopic(s)) add(s, 'autocomplete');
    await sleep(120); // be polite
  }
  console.log(`[kw] autocomplete: ${used} requests, ${live} returned data, total now ${map.size}`);

  const keywords = [...map.values()];

  // Cluster / type / intent distributions for the log
  const byCluster: Record<string, number> = {};
  for (const k of keywords) byCluster[k.cluster] = (byCluster[k.cluster] ?? 0) + 1;
  const longTail = keywords.filter((k) => k.type === 'long-tail').length;

  mkdirSync(CONTENT_DIR, { recursive: true });
  writeFileSync(
    path.join(CONTENT_DIR, 'keywords.json'),
    JSON.stringify({
      generatedFrom: 'combinatorial + google-autocomplete',
      total: keywords.length,
      longTail,
      shortTail: keywords.length - longTail,
      byCluster,
      keywords,
    }, null, 2),
  );
  console.log(`[kw] wrote keywords.json — ${keywords.length} total (${longTail} long-tail), clusters:`, byCluster);

  // --------------------------------------------------------------------------
  // Build the curated blog queue: question keywords → post candidates.
  // GEO-first priority, dedupe by slug, attach sibling questions as FAQ/PAA.
  // --------------------------------------------------------------------------
  const CLUSTER_PRIORITY: Record<Cluster, number> = {
    geo: 0, 'ai-search': 1, 'structured-data': 2, 'technical-seo': 3,
    metadata: 4, 'content-links': 5, 'seo-basics': 6, 'seo-careers': 7,
  };

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
  const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

  const questionsByCluster = new Map<Cluster, string[]>();
  for (const k of keywords) {
    if (!k.isQuestion) continue;
    const arr = questionsByCluster.get(k.cluster) ?? [];
    arr.push(k.keyword);
    questionsByCluster.set(k.cluster, arr);
  }

  interface QueueItem {
    slug: string;
    title: string;
    keyword: string;
    cluster: Cluster;
    priority: number;
    intent: Intent;
    peopleAlsoAsk: string[];
    relatedKeywords: string[];
    internalLinks: Array<{ href: string; anchor: string }>;
  }

  const seenSlugs = new Set<string>();
  const queue: QueueItem[] = [];
  const candidates = keywords
    .filter((k) => k.targetRouteType === 'blog' && (k.isQuestion || k.source === 'curated-paa'))
    .sort((a, b) => {
      // curated PAA first, then by cluster priority, then shorter (cleaner) first
      const ap = a.source === 'curated-paa' ? -1 : 0;
      const bp = b.source === 'curated-paa' ? -1 : 0;
      if (ap !== bp) return ap - bp;
      if (CLUSTER_PRIORITY[a.cluster] !== CLUSTER_PRIORITY[b.cluster]) return CLUSTER_PRIORITY[a.cluster] - CLUSTER_PRIORITY[b.cluster];
      return a.words - b.words;
    });

  for (const k of candidates) {
    const slug = slugify(k.keyword);
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const siblings = (questionsByCluster.get(k.cluster) ?? []).filter((q) => normalize(q) !== normalize(k.keyword));
    const paa = siblings.slice(0, 5).map(titleCase);
    const related = siblings.slice(5, 11);

    const internalLinks: Array<{ href: string; anchor: string }> = [{ href: '/', anchor: 'run a free SEO + GEO audit' }];
    if (k.cluster === 'geo' || k.cluster === 'ai-search') {
      internalLinks.push({ href: '/check/geo.llmsTxt.missing', anchor: 'llms.txt check' });
    }
    if (k.cluster === 'structured-data') internalLinks.push({ href: '/check', anchor: 'all structured-data checks' });

    queue.push({
      slug,
      title: titleCase(k.keyword),
      keyword: k.keyword,
      cluster: k.cluster,
      priority: CLUSTER_PRIORITY[k.cluster] + (k.source === 'curated-paa' ? -10 : 0),
      intent: k.intent,
      peopleAlsoAsk: paa,
      relatedKeywords: related,
      internalLinks,
    });
    if (queue.length >= 400) break;
  }

  writeFileSync(
    path.join(CONTENT_DIR, 'blog-queue.json'),
    JSON.stringify({ total: queue.length, queue }, null, 2),
  );
  const queueByCluster: Record<string, number> = {};
  for (const q of queue) queueByCluster[q.cluster] = (queueByCluster[q.cluster] ?? 0) + 1;
  console.log(`[kw] wrote blog-queue.json — ${queue.length} candidates, by cluster:`, queueByCluster);
}

main().catch((err) => {
  console.error('keyword-research failed:', err);
  process.exit(1);
});
