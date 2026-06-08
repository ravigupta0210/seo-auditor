/**
 * Canonical list of /compare/[slug] pages, used by the sitemap. Kept here (not
 * derived from the page modules) so the sitemap never imports page components.
 * Keep in sync with the COMPARISONS maps in app/compare/[slug]/page.tsx.
 */
export const COMPARE_SLUGS = [
  'vs-screaming-frog',
  'vs-semrush',
  'vs-ahrefs',
  'vs-sitebulb',
] as const;
