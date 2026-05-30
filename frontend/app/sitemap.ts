import type { MetadataRoute } from 'next';
import { CHECKS_CATALOG } from '@/lib/checks-catalog';
import { listRecentReports } from '@/lib/api';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  let reportEntries: MetadataRoute.Sitemap = [];
  try {
    const recent = await listRecentReports(50);
    reportEntries = recent.map((r) => ({
      url: `${SITE}/audit/${r.id}`,
      lastModified: r.finishedAt ? new Date(r.finishedAt) : new Date(r.createdAt),
      changeFrequency: 'yearly',
      priority: 0.4,
    }));
  } catch {
    // ignore — backend may not be up at build time
  }

  return [...staticEntries, ...checkEntries, ...reportEntries];
}
