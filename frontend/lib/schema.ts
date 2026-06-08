import { SITE_URL, SITE_NAME, canonical } from './seo';

/**
 * JSON-LD builders. Each returns a plain object you render through the
 * <JsonLd> component. Emitting several separate <script type="application/ld+json">
 * blocks on one page is valid — Google merges them.
 *
 * The publisher/organization logo points at the dynamic /opengraph-image route
 * (a real 1200x630 PNG) rather than the historical /og-cover.png, which 404s.
 */
const LOGO_URL = `${SITE_URL}/opengraph-image`;

export const PERSON_AUTHOR = {
  '@type': 'Person' as const,
  name: 'Ravi Gupta',
  url: 'https://github.com/ravigupta0210',
};

export const ORG_PUBLISHER = {
  '@type': 'Organization' as const,
  name: SITE_NAME,
  url: SITE_URL,
  logo: { '@type': 'ImageObject' as const, url: LOGO_URL },
};

export function breadcrumbList(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: canonical(it.path),
    })),
  };
}

export function faqPage(faqs: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function blogPosting(opts: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    image: opts.image ?? LOGO_URL,
    author: PERSON_AUTHOR,
    publisher: ORG_PUBLISHER,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical(opts.path) },
  };
}

export function techArticle(opts: { title: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: opts.title,
    description: opts.description,
    author: ORG_PUBLISHER,
    publisher: ORG_PUBLISHER,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical(opts.path) },
  };
}
