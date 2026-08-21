import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CHECKS_CATALOG, findCheck } from '@/lib/checks-catalog';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { JsonLd } from '@/app/_components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { techArticle, breadcrumbList } from '@/lib/schema';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return CHECKS_CATALOG.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const check = findCheck(decodeURIComponent(id));
  if (!check) return { title: 'Check not found', robots: { index: false } };
  return pageMetadata({
    title: `${check.title} — what it means and how to fix it`,
    description: check.summary,
    path: `/check/${encodeURIComponent(check.id)}`,
    type: 'article',
  });
}

export default async function CheckPage({ params }: PageProps) {
  const { id } = await params;
  const check = findCheck(decodeURIComponent(id));
  if (!check) notFound();

  const related = CHECKS_CATALOG.filter((c) => c.category === check.category && c.id !== check.id).slice(0, 4);

  const ld = [
    techArticle({ title: check.title, description: check.summary, path: `/check/${encodeURIComponent(check.id)}` }),
    breadcrumbList([
      { name: 'Home', path: '/' },
      { name: 'Checks', path: '/check' },
      { name: check.title, path: `/check/${encodeURIComponent(check.id)}` },
    ]),
  ];

  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 60px' }}>
        <JsonLd data={ld} />
        <Link href="/check" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← All checks</Link>
        <p style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '20px 0 8px', fontWeight: 600 }}>
          {check.category} · {check.id}
        </p>
        <h1 style={{ fontSize: 'clamp(24px, 6vw, 34px)', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>{check.title}</h1>
        <p style={{ fontSize: 17, color: 'var(--text-dim)', lineHeight: 1.65, margin: '0 0 26px' }}>{check.summary}</p>

        <section className="glass-card" style={{ padding: '18px 22px', marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, margin: '0 0 8px', fontWeight: 600 }}>Why it matters</h2>
          <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.65 }}>{check.whyItMatters}</p>
        </section>

        {check.exampleFix && (
          <section style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 15, margin: '0 0 8px', fontWeight: 600 }}>Example fix</h2>
            <pre>{check.exampleFix}</pre>
          </section>
        )}

        <section style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 15, margin: '0 0 8px', fontWeight: 600 }}>Authoritative reference</h2>
          <p style={{ margin: 0, fontSize: 13 }}>
            <a href={check.docLink} target="_blank" rel="noopener">{check.docLink}</a>
          </p>
        </section>

        <section className="glass-card" style={{
          marginTop: 32,
          padding: '22px 26px',
          background: 'var(--accent-grad-soft)',
          borderColor: 'rgba(124, 140, 255, 0.25)',
        }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 17, color: 'var(--text)', letterSpacing: '-0.01em' }}>Run a full audit of your site</h2>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-dim)' }}>
            Free, no signup, no crawl cap. Check this and 90+ other factors across every public page.
          </p>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>
            Audit my site →
          </Link>
        </section>

        {related.length > 0 && (
          <section style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 15, margin: '0 0 12px', fontWeight: 600 }}>Related checks in {check.category}</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, lineHeight: 1.9 }}>
              {related.map((r) => (
                <li key={r.id}>
                  · <Link href={`/check/${encodeURIComponent(r.id)}`}>{r.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
