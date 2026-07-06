import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeseoaudit.vercel.app';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SEO Auditor',
    short_name: 'SEO Auditor',
    description:
      'Free, comprehensive SEO + JSON-LD + GEO audit for any website. No signup, no paywall, no crawl limits.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0b0c0e',
    theme_color: '#0b0c0e',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['developer', 'productivity', 'utilities'],
    lang: 'en',
    id: SITE_URL,
  };
}
