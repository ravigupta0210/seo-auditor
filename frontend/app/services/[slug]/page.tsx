import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { JsonLd } from '@/app/_components/JsonLd';
import { pageMetadata, SITE_URL, SITE_NAME } from '@/lib/seo';
import { SERVICES, getService, NO_GUARANTEE } from '@/lib/services';

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) return pageMetadata({ title: 'Not found', description: 'Service not found.', path: '/services', index: false });
  return pageMetadata({
    title: `${svc.name} — from ${svc.price} | ${SITE_NAME}`,
    description: `${svc.tagline} Fixed price from ${svc.price}, delivered in ${svc.turnaround.toLowerCase()}.`,
    path: `/services/${svc.slug}`,
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) notFound();

  const others = SERVICES.filter((s) => s.slug !== svc.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: svc.name,
        description: svc.tagline,
        url: `${SITE_URL}/services/${svc.slug}`,
        serviceType: 'Search engine optimization',
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        areaServed: 'Worldwide',
        offers: {
          '@type': 'Offer',
          price: svc.price.replace(/[^0-9.]/g, ''),
          priceCurrency: 'USD',
          url: `${SITE_URL}/services/${svc.slug}`,
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${SITE_URL}/services` },
          { '@type': 'ListItem', position: 3, name: svc.name, item: `${SITE_URL}/services/${svc.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px 64px' }}>
        <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }} aria-label="Breadcrumb">
          <Link href="/">Home</Link> <span aria-hidden="true">·</span> <Link href="/services">Pricing</Link>{' '}
          <span aria-hidden="true">·</span> {svc.name}
        </nav>

        <header style={{ marginBottom: 28 }}>
          <h1 className="page-title" style={{ marginBottom: 12 }}>{svc.name}</h1>
          <p className="page-lede" style={{ margin: '0 0 16px' }}>{svc.tagline}</p>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <strong style={{ fontSize: 34, letterSpacing: '-0.03em' }}>{svc.price}</strong>
              {svc.priceNote && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{svc.priceNote}</span>}
            </p>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
              Turnaround: <strong style={{ color: 'var(--text-dim)' }}>{svc.turnaround}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <Link href={`/quote?tier=${svc.slug}`} className="btn btn-primary">Get a price →</Link>
            <Link href="/" className="btn btn-secondary">Run the free audit first</Link>
          </div>
        </header>

        <section className="glass-card" style={{ padding: '22px 24px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Best for
          </p>
          <p style={{ margin: 0, fontSize: 15.5, color: 'var(--text-dim)', lineHeight: 1.65 }}>{svc.bestFor}</p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 14px', letterSpacing: '-0.02em' }}>What you get</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {svc.includes.map((inc) => (
              <li key={inc} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                <span aria-hidden="true" style={{ color: 'var(--pass)', fontWeight: 700, flex: '0 0 auto' }}>✓</span>
                <span>{inc}</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 8px', letterSpacing: '-0.02em' }}>What this does not include</h2>
          <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Stated up front so there are no surprises after you&apos;ve paid.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {svc.excludes.map((ex) => (
              <li key={ex} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <span aria-hidden="true" style={{ color: 'var(--text-faint)', fontWeight: 700, flex: '0 0 auto' }}>—</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="glass-card"
          style={{ padding: '24px 26px', marginBottom: 28, background: 'var(--accent-grad-soft)', borderColor: 'var(--border-strong)' }}
        >
          <h2 style={{ margin: '0 0 10px', fontSize: 19, letterSpacing: '-0.02em' }}>{NO_GUARANTEE.headline}</h2>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7 }}>{NO_GUARANTEE.body}</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 14px', letterSpacing: '-0.02em' }}>Other things we do</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/services/${o.slug}`}
                className="glass-card"
                style={{ padding: '16px 18px', textDecoration: 'none', display: 'block' }}
              >
                <p style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 600 }}>{o.name}</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>from {o.price}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="glass-card" style={{ padding: '26px 26px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, letterSpacing: '-0.02em' }}>Ready when you are</h2>
          <p style={{ margin: '0 auto 18px', maxWidth: 460, fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.65 }}>
            Tell us about your site and we&apos;ll send a fixed price within one business day. No call required.
          </p>
          <Link href={`/quote?tier=${svc.slug}`} className="btn btn-primary">Get a price →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
