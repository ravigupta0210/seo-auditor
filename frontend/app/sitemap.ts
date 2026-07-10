import type { MetadataRoute } from 'next';
import { CHECKS_CATALOG } from '@/lib/checks-catalog';
import { getAllPosts } from '@/lib/blog';
import { COMPARE_SLUGS } from '@/lib/compares';
import { SITE_URL } from '@/lib/seo';

// Fully static: generated at build time (when the content/blog/*.json files are
// readable on the build machine) and regenerated on EVERY deploy. Do NOT add
// `revalidate` here: at runtime on Vercel the blog JSON files are not in the
// serverless function bundle, so a runtime regeneration silently drops every
// JSON post — leaving only the ~6 legacy posts in the sitemap. Static build-time
// generation is what keeps all ~150 URLs in the sitemap.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/check`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/feedback`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const checkEntries: MetadataRoute.Sitemap = CHECKS_CATALOG.map((c) => ({
    url: `${SITE_URL}/check/${encodeURIComponent(c.id)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const compareEntries: MetadataRoute.Sitemap = COMPARE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/compare/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Blog posts use each post's real publish/update date as lastmod — Google
  // distrusts sitemaps where every entry shares a constantly-changing date.
  const blogEntries: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt ?? p.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Saved audit reports are deliberately omitted: they auto-expire after 7 days
  // (indexing them would create soft-404s once expired).
  return [...staticEntries, ...checkEntries, ...compareEntries, ...blogEntries];
}
