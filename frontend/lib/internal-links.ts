import { getAllPosts, type BlogPost } from './blog';
import { CHECKS_CATALOG } from './checks-catalog';

/**
 * Internal-link funneling. Topic clusters (hub-and-spoke) are what Google
 * rewards as topical authority, so every post should link to siblings in its
 * cluster + the audit tool. These helpers compute those links at build time.
 */

export interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
}

/** Stable 32-bit string hash. Same input always yields the same number, so
 *  builds are reproducible and the sitemap/HTML don't churn between deploys. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function terms(p: BlogPost): Set<string> {
  return new Set(
    [...(p.relatedKeywords ?? []), ...(p.secondaryKeywords ?? []), p.keyword ?? '']
      .filter(Boolean)
      .map((t) => t.toLowerCase().trim()),
  );
}

/**
 * Related posts for a given post.
 *
 * The previous implementation was `[...sameCluster, ...rest].slice(0, limit)`
 * over a globally date-sorted list, which handed *every* post in a cluster the
 * identical three links — all 53 seo-basics posts pointed at the same three
 * targets. That wastes the link graph and gives readers nowhere new to go.
 *
 * Now candidates are scored on genuine topical overlap, with a deterministic
 * per-pair tiebreak so different posts surface different siblings.
 */
export function relatedPosts(slug: string, limit = 3): RelatedPost[] {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const mine = terms(current);

  const scored = all
    .filter((p) => p.slug !== slug)
    .map((p) => {
      let score = 0;
      if (current.cluster && p.cluster === current.cluster) score += 30;
      if (p.tag === current.tag) score += 8;
      const theirs = terms(p);
      for (const t of mine) if (theirs.has(t)) score += 12;
      // Deterministic jitter: breaks ties differently for each (source, target)
      // pair, so cluster siblings fan out instead of collapsing onto the same
      // three most-recent posts.
      score += (hash(slug + '::' + p.slug) % 1000) / 1000;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Orphan guarantee. Scoring alone still left a couple of posts with zero
  // inbound links, because nothing happened to rank them into anyone's top 3.
  // Linking each post to its successor in a stable slug-sorted ring forms a
  // cycle over every post, so each one is guaranteed at least one inbound
  // link no matter how the scores fall.
  const ring = [...all].sort((a, b) => a.slug.localeCompare(b.slug));
  const idx = ring.findIndex((p) => p.slug === slug);
  const successor = ring[(idx + 1) % ring.length];
  if (successor && successor.slug !== slug && !scored.some(({ p }) => p.slug === successor.slug)) {
    scored[scored.length - 1] = { p: successor, score: 0 };
  }

  return scored.map(({ p }) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, tag: p.tag }));
}

/** Routes that always exist, for validating authored internal links. */
const STATIC_ROUTES = new Set(['/', '/check', '/blog', '/compare', '/services', '/quote', '/feedback']);

/**
 * The authored `internalLinks` on each post, filtered to targets that actually
 * resolve.
 *
 * These 954 links were written by hand and then never rendered — the field was
 * declared on BlogPost and read by nothing. Rendering them unvalidated would
 * ship real 404s (one target, /blog/how-to-recover-from-google-penalty, was
 * never written), and `dynamicParams = false` turns a missing slug into a hard
 * 404 rather than a soft one.
 */
export function resolvedInternalLinks(post: BlogPost, limit = 6): Array<{ label: string; href: string }> {
  const slugs = new Set(getAllPosts().map((p) => p.slug));
  const checkIds = new Set(CHECKS_CATALOG.map((c) => c.id));
  const seen = new Set<string>();
  const out: Array<{ label: string; href: string }> = [];

  for (const link of post.internalLinks ?? []) {
    const href = (link.href ?? '').trim();
    const label = (link.anchor ?? '').trim();
    if (!href || !label || seen.has(href)) continue;
    if (href === `/blog/${post.slug}`) continue; // never link a post to itself

    const valid =
      STATIC_ROUTES.has(href) ||
      href.startsWith('/compare/') ||
      (href.startsWith('/blog/') && slugs.has(href.slice(6))) ||
      (href.startsWith('/check/') && checkIds.has(href.slice(7)));
    if (!valid) continue;

    seen.add(href);
    out.push({ label, href });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * "People also search for" anchors. Prefers the post's authored
 * relatedKeywords (mapped to sibling posts where a slug match exists), and
 * falls back to same-cluster post titles. Every anchor is an internal link —
 * the whole point is to keep crawl + authority inside the cluster.
 */
export function peopleAlsoSearchFor(post: BlogPost, limit = 6): Array<{ label: string; href: string }> {
  const all = getAllPosts();
  const out: Array<{ label: string; href: string }> = [];
  const seen = new Set<string>();

  const pushPost = (p: { slug: string; title: string }) => {
    if (seen.has(p.slug) || p.slug === post.slug) return;
    seen.add(p.slug);
    out.push({ label: p.title, href: `/blog/${p.slug}` });
  };

  // 1) relatedKeywords that match an existing post slug/keyword
  for (const kw of post.relatedKeywords ?? []) {
    const match = all.find(
      (p) => p.slug !== post.slug && (p.keyword?.toLowerCase() === kw.toLowerCase() || p.title.toLowerCase().includes(kw.toLowerCase())),
    );
    if (match) pushPost(match);
    if (out.length >= limit) return out;
  }

  // 2) same-cluster siblings
  for (const p of all.filter((p) => p.cluster && p.cluster === post.cluster)) {
    pushPost(p);
    if (out.length >= limit) break;
  }

  return out.slice(0, limit);
}
