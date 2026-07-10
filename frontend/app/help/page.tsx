import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'How We Help — Turn Your Audit Into Traffic & AI Citations',
  description:
    'Your SEO + GEO audit found issues. Here is what they cost you in Google traffic and AI-search citations — and how we help you fix them, free or hands-on.',
  path: '/help',
});

const PILLARS = [
  {
    tag: 'Classic SEO',
    title: 'Get found on Google',
    body: 'Titles, meta descriptions, headings, canonical tags, sitemaps, speed, mobile, indexing. The fundamentals that decide whether Google ranks you — or skips you.',
  },
  {
    tag: 'Structured data',
    title: 'Win rich results',
    body: 'JSON-LD validated against schema.org: Article, Product, FAQ, Organization and more. Correct structured data unlocks rich snippets and helps machines understand your page.',
  },
  {
    tag: 'GEO / AI search',
    title: 'Get cited by AI',
    body: 'llms.txt, AI-crawler access (GPTBot, ClaudeBot, PerplexityBot), the "Island Test" for quotable answers, and E-E-A-T signals — so ChatGPT, Perplexity and Google AI Overviews cite you.',
  },
];

const COSTS = [
  ['Lost organic traffic', 'Every unfixed error is a page Google ranks lower — or not at all. That is clicks going to competitors instead of you.'],
  ['Invisible to AI answers', 'AI engines cite specific, well-structured pages. If yours are blocked or unclear, ChatGPT and Perplexity quote someone else.'],
  ['Wasted content', 'Great content that Google never indexes or AI never finds is effort with zero return. Discoverability is what converts it to traffic.'],
];

export default function HelpPage() {
  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 64px' }}>
        {/* Hero */}
        <header style={{ marginBottom: 40 }}>
          <span className="tag" style={{ marginBottom: 14 }}>How we help</span>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Your audit found issues. Here&apos;s what they{' '}
            <span className="hero-gradient-text">cost you</span> — and how we fix them.
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 17, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 640 }}>
            Every error and warning in your report is a reason Google ranks your page lower — or an AI engine
            like ChatGPT skips it entirely. The good news: they&apos;re all fixable, and we can help either way.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/feedback?topic=help" className="btn btn-primary">Get help with my site →</Link>
            <Link href="/" className="btn btn-secondary">Run a free audit</Link>
          </div>
        </header>

        {/* Pillars */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 16px' }}>What your audit checks — and why it matters</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {PILLARS.map((p) => (
              <div key={p.tag} className="glass-card" style={{ padding: '20px 20px' }}>
                <span className="tag" style={{ marginBottom: 10 }}>{p.tag}</span>
                <h3 style={{ margin: '0 0 8px', fontSize: 16.5, letterSpacing: '-0.01em' }}>{p.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cost of ignoring */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 16px' }}>What it costs to ignore</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {COSTS.map(([t, b]) => (
              <div key={t} className="glass-card" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span aria-hidden style={{ color: 'var(--error)', fontSize: 18, lineHeight: 1.4 }}>✕</span>
                <div>
                  <strong style={{ fontSize: 15 }}>{t}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{b}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How we help */}
        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 16px' }}>Two ways to fix it</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div className="glass-card" style={{ padding: '22px 22px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 17 }}>Do it yourself — free</h3>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                Every issue in your report expands with a plain-English explanation and a copy-paste fix. Plus 100+
                free guides covering SEO, structured data, and GEO.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/" className="btn btn-secondary">Audit your site</Link>
                <Link href="/blog" className="btn btn-secondary">Browse the guides</Link>
              </div>
            </div>
            <div
              className="glass-card"
              style={{ padding: '22px 22px', background: 'var(--accent-grad-soft)', borderColor: 'var(--border-strong)' }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 17 }}>Want a hand? We&apos;ve got you</h3>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                Short on time or not sure where to start? Tell us your site and what you need — SEO fixes,
                structured data, or getting cited in AI search. We can handle it.
              </p>
              <Link href="/feedback?topic=help" className="btn btn-primary">Tell us what you need →</Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          className="glass-card"
          style={{ padding: '32px 26px', textAlign: 'center', background: 'var(--accent-grad-soft)', borderColor: 'var(--border-strong)' }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: 24, letterSpacing: '-0.02em' }}>Ready to fix it?</h2>
          <p style={{ margin: '0 auto 20px', maxWidth: 460, fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Run a free audit to see exactly what to fix — or reach out and we&apos;ll help you get it done.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-primary">Audit my site — free</Link>
            <Link href="/feedback?topic=help" className="btn btn-secondary">Get help</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
