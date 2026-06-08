import type { Metadata } from 'next';

/**
 * Single source of truth for the production origin. Every route, the sitemap,
 * robots.txt, and all JSON-LD derive their absolute URLs from here.
 *
 * Falls back to the real production domain (not example.com / localhost) so a
 * preview build or a missing env var can never emit a wrong canonical that
 * splits ranking signals — a real risk on the shared *.vercel.app domain,
 * where Google can otherwise treat a random deployment URL as a duplicate.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://freeseoaudit.vercel.app').replace(/\/+$/, '');
export const SITE_NAME = 'SEO Auditor';

/** Absolute canonical URL for a route path (e.g. '/blog/foo'). */
export function canonical(path = '/'): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}

export interface PageMetaInput {
  title: string;
  description: string;
  /** Route path the page lives at, e.g. '/check' or '/blog/how-to-rank-in-chatgpt'. */
  path: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  /** Set to false for pages that should not be indexed (e.g. ephemeral reports). */
  index?: boolean;
}

/**
 * Build a consistent Metadata object: self-canonical + OpenGraph + Twitter,
 * all pointing at the absolute production URL. Use on every route so no page
 * is left inheriting only the site-wide canonical (which would point at '/').
 */
export function pageMetadata(input: PageMetaInput): Metadata {
  const url = canonical(input.path);
  const meta: Metadata = {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      type: input.type ?? 'website',
      url,
      siteName: SITE_NAME,
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
    },
  };
  if (input.keywords?.length) meta.keywords = input.keywords;
  if (input.index === false) meta.robots = { index: false, follow: true };
  return meta;
}
