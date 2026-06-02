import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { PostHogProvider } from './_components/PostHogProvider';
import './globals.css';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-KPPL9ZCB3B';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display-loaded',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-loaded',
});

const SITE_NAME = 'SEO Auditor';
const SITE_DESCRIPTION =
  'Free, comprehensive SEO + JSON-LD + metadata + GEO audit for any website. No signup, no paywall, no crawl limits.';
// Honors NEXT_PUBLIC_SITE_URL in production; falls back to a sentinel placeholder
// for local dev (and which we never want to hard-code as the canonical domain).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Free Full-Site SEO + JSON-LD + GEO Audit`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'Ravi Gupta' }],
  keywords: [
    'free SEO audit',
    'JSON-LD validator',
    'metadata checker',
    'GEO audit',
    'AI search optimization',
    'llms.txt validator',
    'site-wide SEO crawler',
    'schema markup checker',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free Full-Site SEO + JSON-LD + GEO Audit`,
    description: SITE_DESCRIPTION,
    // images auto-populated from app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Free Full-Site SEO + JSON-LD + GEO Audit`,
    description: SITE_DESCRIPTION,
    // images auto-populated from app/opengraph-image.tsx (twitter falls back to OG)
  },
  robots: { index: true, follow: true },
  verification: {
    google: 'VQViwr4Cn0GVinh7fd-l1kY7Mm_N3iTUtPxUVsuupck',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0f14',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#app`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        applicationCategory: 'WebApplication',
        operatingSystem: 'Any',
        url: SITE_URL,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/og-cover.png`,
          width: 1200,
          height: 630,
        },
        sameAs: [
          'https://github.com/ravigupta0210/seo-auditor',
          'https://github.com/ravigupta0210',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          url: 'https://github.com/ravigupta0210/seo-auditor/issues',
          availableLanguage: ['English'],
        },
        founder: {
          '@type': 'Person',
          name: 'Ravi Gupta',
          url: 'https://github.com/ravigupta0210',
          sameAs: ['https://github.com/ravigupta0210'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { '@id': `${SITE_URL}/#org` },
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/check?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Apply persisted theme before paint to prevent a light-mode flash.
          Runs synchronously in <head>, reads localStorage, and falls back to
          the OS preference. The toggle button hydrates afterwards.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='sa-theme';var s=localStorage.getItem(k);if(s!=='light'&&s!=='dark'){s=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=s;}catch(e){document.documentElement.dataset.theme='dark';}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-display-loaded), var(--font-body)' }}>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        )}
        <noscript>
          <div style={{ maxWidth: 720, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif', color: '#e6edf3', lineHeight: 1.6 }}>
            <h1 style={{ fontSize: 32, margin: '0 0 14px' }}>{SITE_NAME} — Free SEO + GEO Audit</h1>
            <p>{SITE_DESCRIPTION}</p>
            <p>
              <strong>What it checks:</strong> classic SEO (title, description, canonical, Open Graph, Twitter Cards, headings, alt text), JSON-LD structured data (required + recommended fields per type, ISO 8601 dates, absolute URLs), GEO/AEO signals (llms.txt, AI-crawler accessibility, Island Test for citation-worthy paragraphs), Core Web Vitals, accessibility, and security headers — across every public page of your site.
            </p>
            <p>
              This page is interactive — enable JavaScript to run an audit. You can also browse:{' '}
              <a href="/check">all checks</a>, <a href="/compare">tool comparisons</a>, <a href="/blog">blog</a>.
            </p>
          </div>
        </noscript>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
