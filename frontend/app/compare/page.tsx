import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SEO Auditor vs. other SEO tools — honest comparisons',
  description: 'How our free SEO auditor compares to Screaming Frog, SEMrush, Ahrefs, and Sitebulb. We are honest about where we are stronger and where they win.',
};

const COMPARISONS = [
  { slug: 'vs-screaming-frog', tool: 'Screaming Frog', wedge: 'No 500-URL cap, no desktop install, GEO checks built in' },
  { slug: 'vs-semrush', tool: 'SEMrush', wedge: 'Free with no signup; they own backlink intelligence, we own technical depth' },
  { slug: 'vs-ahrefs', tool: 'Ahrefs', wedge: 'Free, GEO-first; Ahrefs wins on backlink + keyword data we do not have' },
  { slug: 'vs-sitebulb', tool: 'Sitebulb', wedge: 'Browser-based vs. desktop, free vs. paid, GEO checks' },
];

export default function CompareIndex() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Home</Link>
      <h1 style={{ fontSize: 32, margin: '20px 0 8px' }}>Comparisons</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 28px' }}>
        Honest comparisons against the established SEO tools. Including where they beat us.
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {COMPARISONS.map((c) => (
          <li key={c.slug} style={{ padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <Link href={`/compare/${c.slug}`} style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
              SEO Auditor vs. {c.tool}
            </Link>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>{c.wedge}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
