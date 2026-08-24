import type { Metadata } from 'next';
import Link from 'next/link';
import { CHECKS_CATALOG , categoryLabel } from '@/lib/checks-catalog';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'All 90+ SEO + JSON-LD + GEO checks — reference catalog',
  description:
    'Browse every check our auditor performs on your website: metadata, JSON-LD structured data, content quality, ' +
    'crawl & indexing, performance, GEO/AEO (llms.txt, Island Test), and security. Click any check for a deep-dive.',
  path: '/check',
});

const CATEGORY_META: Record<string, { icon: string; description: string; color: string }> = {
  metadata: {
    icon: '◆',
    description: 'Title, meta description, canonical, Open Graph, Twitter Cards, lang, charset, robots.',
    color: 'sky',
  },
  jsonld: {
    icon: '✦',
    description: 'Schema.org block validation, required + recommended fields per type, syntax errors.',
    color: 'violet',
  },
  content: {
    icon: '✎',
    description: 'Heading hierarchy, H1/title alignment, image alt text, anchor text, word count, internal links.',
    color: 'emerald',
  },
  security: {
    icon: '⛨',
    description: 'HTTPS, HSTS, CSP, X-Frame-Options, Referrer-Policy, X-Content-Type-Options.',
    color: 'amber',
  },
  performance: {
    icon: '⚡',
    description: 'Response compression, Core Web Vitals signals, payload size, render-blocking resources.',
    color: 'orange',
  },
  crawl: {
    icon: '⤳',
    description: 'robots.txt presence, sitemap.xml validity, hreflang, redirect chains, indexability.',
    color: 'cyan',
  },
  geo: {
    icon: '✸',
    description: 'llms.txt presence, AI-crawler accessibility, Island Test, E-E-A-T signals, text extractability.',
    color: 'pink',
  },
};

export default function CheckIndex() {
  const grouped = CHECKS_CATALOG.reduce<Record<string, typeof CHECKS_CATALOG>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category]!.push(c);
    return acc;
  }, {});

  const categoriesInOrder = ['metadata', 'jsonld', 'content', 'security', 'performance', 'crawl', 'geo']
    .filter((c) => grouped[c]);

  // The engine runs ~92 distinct checks; the catalog documents a growing
  // subset of them with full explainers. Show both honestly rather than
  // implying the catalog is the whole engine.
  const documented = CHECKS_CATALOG.length;

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <p className="page-eyebrow">Reference</p>
        <h1 className="page-title">The 90+ checks we run</h1>
        <p className="page-lede">
          Every factor we analyse on your website, grouped by category. {documented} of them have a
          deep-dive explainer with why it matters, how to fix it, and a copy-paste snippet — and
          we&apos;re writing the rest.
        </p>

        {/* Category overview cards */}
        <section className="chk-overview">
          {categoriesInOrder.map((cat) => {
            const meta = CATEGORY_META[cat];
            if (!meta) return null;
            return (
              <a key={cat} href={`#${cat}`} className={`chk-cat-card chk-cat-card--${meta.color}`}>
                <div className="chk-cat-card__icon">{meta.icon}</div>
                <div className="chk-cat-card__body">
                  <h2 className="chk-cat-card__title">
                    <span className="chk-cat-card__name">{categoryLabel(cat)}</span>
                    <span className="chk-cat-card__count">{grouped[cat]!.length} checks</span>
                  </h2>
                  <p className="chk-cat-card__desc">{meta.description}</p>
                </div>
              </a>
            );
          })}
        </section>

        {/* Detailed catalog */}
        {categoriesInOrder.map((cat) => {
          const meta = CATEGORY_META[cat];
          const checks = grouped[cat]!;
          return (
            <section key={cat} id={cat} className="chk-section">
              <header className="chk-section__head">
                <span className={`chk-section__icon chk-section__icon--${meta?.color || 'sky'}`}>
                  {meta?.icon || '•'}
                </span>
                <div>
                  <h2 className="chk-section__title">{categoryLabel(cat)}</h2>
                  <p className="chk-section__sub">{meta?.description}</p>
                </div>
                <span className="chk-section__count">{checks.length}</span>
              </header>

              <ul className="chk-list">
                {checks.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/check/${encodeURIComponent(c.id)}`}
                      className="chk-item glass-card"
                    >
                      <div className="chk-item__main">
                        <div className="chk-item__title">{c.title}</div>
                        <p className="chk-item__summary">{c.summary}</p>
                      </div>
                      <span className="chk-item__arrow" aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* CTA */}
        <section className="cmp-cta">
          <h2 className="cmp-cta__title">Run all these checks on your site</h2>
          <p className="cmp-cta__sub">
            Free, no signup. Audit a single page or your full site in under a minute.
          </p>
          <Link href="/" className="btn-primary">Audit my site →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}


