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
          <h1 className="page-title" style={{ marginBottom: 12, maxWidth: 640 }}>
            We don&apos;t send you a PDF.<br />We fix it.
          </h1>
          <p className="page-lede" style={{ margin: '0 0 10px' }}>
            Every SEO tool on the market tells you what&apos;s broken and stops there. We audit your site, then
            implement the fixes ourselves and deliver them as a pull request you review and merge.
          </p>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            Fixed prices, published below. No retainers, no sales calls, no lock-in.
          </p>
        </header>

        {/* Pricing. Deliberately not four equal columns: at this width they
            squeeze to ~215px each and the tier that actually pays the bills is
            no more prominent than the $99 tripwire. The implementation tier
            leads at full width with its complete inclusion list; the rest
            follow as a compact row. */}
        {(() => {
          const lead = SERVICES.find((x) => x.featured)!;
          const rest = SERVICES.filter((x) => !x.featured);
          return (
            <>
              <article className="svc-lead">
                <div className="svc-lead__main">
                  <span className="svc-lead__badge">Most popular</span>
                  <h2 className="svc-lead__name">{lead.name}</h2>
                  <p className="svc-lead__price">
                    <strong>{lead.price}</strong>
                    {lead.priceNote && <span>{lead.priceNote}</span>}
                  </p>
                  <p className="svc-lead__tagline">{lead.tagline}</p>
                  <p className="svc-lead__meta">
                    Turnaround: <strong>{lead.turnaround}</strong>
                  </p>
                  <div className="svc-lead__cta">
                    <Link href={`/quote?tier=${lead.slug}`} className="btn btn-primary">Get a price →</Link>
                    <Link href={`/services/${lead.slug}`} className="btn btn-secondary">Full details</Link>
                  </div>
                </div>
                <ul className="svc-lead__includes">
                  {lead.includes.map((inc) => (
                    <li key={inc}>
                      <span aria-hidden="true">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <section className="svc-row">
                {rest.map((s2) => (
                  <article key={s2.slug} className="glass-card svc-card">
                    <h2 className="svc-card__name">{s2.name}</h2>
                    <p className="svc-card__price">
                      <strong>{s2.price}</strong>
                      {s2.priceNote && <span>{s2.priceNote}</span>}
                    </p>
                    <p className="svc-card__tagline">{s2.tagline}</p>
                    <p className="svc-card__meta">
                      Turnaround: <strong>{s2.turnaround}</strong>
                    </p>
                    <ul className="svc-card__list">
                      {s2.includes.slice(0, 3).map((inc) => (
                        <li key={inc}><span aria-hidden="true">✓</span><span>{inc}</span></li>
                      ))}
                    </ul>
                    <div className="svc-card__cta">
                      <Link href={`/quote?tier=${s2.slug}`} className="btn btn-secondary">Get a price</Link>
                      <Link href={`/services/${s2.slug}`} className="svc-card__details">Details →</Link>
                    </div>
                  </article>
                ))}
              </section>
            </>
          );
        })()}

        {/* The single biggest unanswered objection on this page was "what
            actually happens after I pay?". Answering it here, not only on /quote. */}
        <section className="svc-process">
          <h2 className="svc-process__title">What actually happens</h2>
          <ol className="svc-process__steps">
            <li>
              <span className="svc-process__n">1</span>
              <div>
                <strong>You send the URL. We audit it free.</strong>
                <p>No call, no form-filling ritual. We look at the real site before quoting anything.</p>
              </div>
            </li>
            <li>
              <span className="svc-process__n">2</span>
              <div>
                <strong>We send one fixed price, within a business day.</strong>
                <p>Agreed before any work starts. No hourly billing, no scope creep, no retainer.</p>
              </div>
            </li>
            <li>
              <span className="svc-process__n">3</span>
              <div>
                <strong>We implement, you approve.</strong>
                <p>Changes arrive as a pull request. Nothing reaches production until you merge it — then we re-audit and show the before/after diff.</p>
              </div>
            </li>
          </ol>
          <p className="svc-process__note">
            Scoped, revocable repo access only. We never ask for credentials, API keys or production secrets.
          </p>
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
