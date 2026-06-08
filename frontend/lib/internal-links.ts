import { getAllPosts, type BlogPost } from './blog';

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

/**
 * Related posts for a given post: same-cluster siblings first, then most
 * recent others, excluding the post itself.
 */
export function relatedPosts(slug: string, limit = 3): RelatedPost[] {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === slug);
  const cluster = current?.cluster;
  const others = all.filter((p) => p.slug !== slug);
  const sameCluster = cluster ? others.filter((p) => p.cluster === cluster) : [];
  const rest = others.filter((p) => !sameCluster.includes(p));
  const ordered = [...sameCluster, ...rest].slice(0, limit);
  return ordered.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, tag: p.tag }));
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
