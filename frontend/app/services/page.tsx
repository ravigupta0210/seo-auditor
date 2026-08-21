import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { JsonLd } from '@/app/_components/JsonLd';
import { pageMetadata, SITE_URL, SITE_NAME } from '@/lib/seo';
import { SERVICES, NO_GUARANTEE } from '@/lib/services';

export const metadata: Metadata = pageMetadata({
  title: 'Pricing — SEO + AI-search (GEO) fixes, from $99',
  description:
    'Fixed-price SEO and AI-search (GEO) work. We audit, then implement the fixes and send them as a pull request. From $99. Published prices, no retainers, no ranking promises.',
  path: '/services',
  keywords: ['GEO services', 'AI search optimization pricing', 'SEO audit cost', 'AEO agency alternative'],
});

const AGENCY_COMPARISON = [
  { label: 'Price for a one-time AI-search audit', agency: '$1,500 – $5,000', us: 'From $99' },
  { label: 'Turnaround', agency: '2 – 4 weeks', us: '48 – 72 hours' },
  { label: 'What you actually receive', agency: 'A PDF of problems', us: 'A pull request that fixes them' },
  { label: 'Pricing', agency: '“Contact us”', us: 'Published on this page' },
  { label: 'Commitment', agency: '3 – 12 month retainer', us: 'One-off, no lock-in' },
];

export default function ServicesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'SEO and GEO services',
    itemListElement: SERVICES.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: s.name,
        description: s.tagline,
        url: `${SITE_URL}/services/${s.slug}`,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        areaServed: 'Worldwide',
        offers: {
          '@type': 'Offer',
          price: s.price.replace(/[^0-9.]/g, ''),
          priceCurrency: 'USD',
          url: `${SITE_URL}/services/${s.slug}`,
        },
      },
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />
      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 24px 64px' }}>
        <header style={{ marginBottom: 32, maxWidth: 700 }}>
          <span className="page-eyebrow">Pricing</span>
          <h1 className="page-title" style={{ marginBottom: 12 }}>We don&apos;t send you a PDF. We fix it.</h1>
          <p className="page-lede" style={{ margin: '0 0 10px' }}>
            Every SEO tool on the market tells you what&apos;s broken and stops there. We audit your site, then
            implement the fixes ourselves and deliver them as a pull request you review and merge.
          </p>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            Fixed prices, published below. No retainers, no sales calls, no lock-in.
          </p>
        </header>

        {/* Pricing cards */}
        <section
          className="services-grid"
          style={{ display: 'grid', gap: 18, marginBottom: 40 }}
        >
          {SERVICES.map((s) => (
            <article
              key={s.slug}
              className="glass-card"
              style={{
                padding: '24px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                ...(s.featured
                  ? { borderColor: 'var(--border-strong)', background: 'var(--accent-grad-soft)' }
                  : {}),
              }}
            >
              {s.featured && <span className="tag" style={{ alignSelf: 'flex-start', margin: 0 }}>Most popular</span>}
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 17, letterSpacing: '-0.01em' }}>{s.name}</h2>
                <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <strong style={{ fontSize: 30, letterSpacing: '-0.03em' }}>{s.price}</strong>
                  {s.priceNote && (
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{s.priceNote}</span>
                  )}
                </p>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>{s.tagline}</p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
                Turnaround: <strong style={{ color: 'var(--text-dim)' }}>{s.turnaround}</strong>
              </p>
              <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {s.includes.slice(0, 4).map((inc) => (
                  <li key={inc} style={{ display: 'flex', gap: 8, fontSize: 13.2, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    <span aria-hidden="true" style={{ color: 'var(--pass)', flex: '0 0 auto', fontWeight: 700 }}>✓</span>
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                <Link href={`/quote?tier=${s.slug}`} className={s.featured ? 'btn btn-primary' : 'btn btn-secondary'}>
                  Get a price
                </Link>
                <Link href={`/services/${s.slug}`} className="btn btn-secondary">Details</Link>
              </div>
            </article>
          ))}
        </section>

        {/* The honest-positioning band. This is the pitch, not a disclaimer. */}
        <section
          className="glass-card"
          style={{ padding: '26px 26px', marginBottom: 40, background: 'var(--accent-grad-soft)', borderColor: 'var(--border-strong)' }}
        >
          <h2 style={{ margin: '0 0 10px', fontSize: 21, letterSpacing: '-0.02em' }}>{NO_GUARANTEE.headline}</h2>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 720 }}>
            {NO_GUARANTEE.body}
          </p>
        </section>

        {/* Why we're cheaper — answering the obvious objection head-on. */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Why we cost so much less</h2>
          <p style={{ margin: '0 0 18px', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 720 }}>
            Not because we cut corners. Agencies bill you for analyst hours spent manually checking things. We built
            the auditor that does that part in seconds, so you only pay for the judgement and the implementation.
          </p>
          <div className="cmp-matrix-wrap">
            <table className="cmp-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: 'left' }}>&nbsp;</th>
                  <th scope="col">Typical agency</th>
                  <th scope="col" className="cmp-matrix__us">Us</th>
                </tr>
              </thead>
              <tbody>
                {AGENCY_COMPARISON.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" style={{ textAlign: 'left', fontWeight: 500 }}>{r.label}</th>
                    <td className="cmp-cell">{r.agency}</td>
                    <td className="cmp-cell cmp-cell--ok"><strong>{r.us}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="glass-card" style={{ padding: '26px 26px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 21, letterSpacing: '-0.02em' }}>Not sure which one you need?</h2>
          <p style={{ margin: '0 auto 18px', maxWidth: 520, fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.65 }}>
            Run the free audit first — it takes about ten seconds and tells you exactly what&apos;s wrong. Then ask us
            for a price against those real results.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-primary">Run the free audit →</Link>
            <Link href="/quote" className="btn btn-secondary">Just get a price</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
