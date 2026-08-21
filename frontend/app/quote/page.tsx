import type { Metadata } from 'next';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { pageMetadata } from '@/lib/seo';
import { SERVICES } from '@/lib/services';
import { QuoteForm } from './_QuoteForm';

export const metadata: Metadata = pageMetadata({
  title: 'Get a fixed price — SEO + AI-search (GEO) fixes',
  description:
    'Tell us what your site needs and we send back a fixed price within one business day. We implement the fixes and deliver them as a pull request. No retainers, no ranking promises.',
  path: '/quote',
});

const STEPS = [
  { n: '1', title: 'You tell us what you need', body: 'Two minutes. If you ran an audit, we quote against your real results rather than guessing.' },
  { n: '2', title: 'We send a fixed price', body: 'Within one business day. Agreed up front — no hourly billing, no scope creep, no retainer trap.' },
  { n: '3', title: 'We implement and prove it', body: 'Changes arrive as a pull request you review and merge. Then we re-audit and show the before/after diff.' },
];

export default function QuotePage() {
  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 64px' }}>
        <header style={{ marginBottom: 28, maxWidth: 680 }}>
          <span className="page-eyebrow">Paid help</span>
          <h1 className="page-title" style={{ marginBottom: 12 }}>Get a fixed price for fixing your site</h1>
          <p className="page-lede" style={{ margin: 0 }}>
            Agencies charge $1,500–$5,000 for a one-time AI-search audit and hand you a PDF. We charge a fraction
            of that, turn it around in days rather than weeks, and we actually implement the fixes.
          </p>
        </header>

        <div style={{ display: 'grid', gap: 26, gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)', alignItems: 'start' }} className="quote-grid">
          <QuoteForm />

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <section className="glass-card" style={{ padding: '22px 22px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 16, letterSpacing: '-0.01em' }}>How this works</h2>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 15 }}>
                {STEPS.map((s) => (
                  <li key={s.n} style={{ display: 'flex', gap: 12 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        flex: '0 0 26px', height: 26, borderRadius: 999,
                        background: 'var(--accent-grad-soft)', border: '1px solid var(--border)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12.5, fontWeight: 700, color: 'var(--accent)',
                      }}
                    >
                      {s.n}
                    </span>
                    <div>
                      <p style={{ margin: '3px 0 4px', fontSize: 14, fontWeight: 600 }}>{s.title}</p>
                      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="glass-card" style={{ padding: '22px 22px' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 16, letterSpacing: '-0.01em' }}>What things cost</h2>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Published, because nobody else does.
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SERVICES.map((s) => (
                  <li key={s.slug} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', fontSize: 13.5 }}>
                    <span style={{ color: 'var(--text-dim)' }}>{s.name}</span>
                    <strong style={{ whiteSpace: 'nowrap' }}>
                      from {s.price}
                      {s.slug === 'monitoring' ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span> : null}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
