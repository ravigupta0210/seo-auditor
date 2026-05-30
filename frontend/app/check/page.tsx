import type { Metadata } from 'next';
import Link from 'next/link';
import { CHECKS_CATALOG } from '@/lib/checks-catalog';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';

export const metadata: Metadata = {
  title: 'All SEO + JSON-LD + GEO checks we run',
  description: 'Browse every check our auditor performs on your website: metadata, JSON-LD structured data, content quality, crawl & indexing, performance, GEO/AEO, accessibility, and security.',
};

export default function CheckIndex() {
  const grouped = CHECKS_CATALOG.reduce<Record<string, typeof CHECKS_CATALOG>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category]!.push(c);
    return acc;
  }, {});

  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 60px' }}>
        <p style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px', fontWeight: 600 }}>
          Reference
        </p>
        <h1 className="hero-gradient-text" style={{ fontSize: 38, margin: '0 0 10px', letterSpacing: '-0.02em' }}>All checks</h1>
        <p style={{ fontSize: 16, color: 'var(--text-dim)', margin: '0 0 36px', lineHeight: 1.65 }}>
          Every factor we analyse on your website. Each links to a deep-dive explainer.
        </p>

        {Object.entries(grouped).map(([cat, checks]) => (
          <section key={cat} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, margin: '0 0 14px', textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
              {cat} <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 400 }}>· {checks.length}</span>
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {checks.map((c) => (
                <li key={c.id}>
                  <Link href={`/check/${encodeURIComponent(c.id)}`} className="glass-card" style={{ display: 'block', padding: '12px 16px', color: 'inherit', textDecoration: 'none' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>{c.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
