import type { MetadataRoute } from 'next';
import { CHECKS_CATALOG } from '@/lib/checks-catalog';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

// Regenerate the sitemap at most once per hour. The Render free-tier backend
// cold-starts in ~30s, which previously caused Google's sitemap fetcher to
// time out before this route responded. The sitemap is now purely static
// so it never blocks on backend availability.
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE}/check`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const checkEntries: MetadataRoute.Sitemap = CHECKS_CATALOG.map((c) => ({
    url: `${SITE}/check/${encodeURIComponent(c.id)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Saved audit reports are deliberately omitted: they auto-expire after
  // 7 days, have no organic-search value, and the backend call to enumerate
  // them is what was blocking Google from fetching the sitemap.
  return [...staticEntries, ...checkEntries];
}
