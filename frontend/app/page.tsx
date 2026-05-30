import Link from 'next/link';
import { AuditForm } from './_components/AuditForm';
import { SiteFooter } from './_components/SiteFooter';
import { SiteHeader } from './_components/SiteHeader';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 80px' }}>
        <section style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <span className="tag" style={{ marginBottom: 18 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pass)', boxShadow: '0 0 8px var(--pass-glow)' }} />
            Free · No signup · Built for AI search
          </span>
          <h1
            className="hero-gradient-text"
            style={{
              fontSize: 'clamp(36px, 6vw, 60px)',
              lineHeight: 1.05,
              margin: '0 0 18px',
              letterSpacing: '-0.03em',
              fontWeight: 700,
            }}
          >
            Audit every public page<br />for SEO, schema, and AI search
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-dim)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
            One report covers classic SEO, JSON-LD validation, metadata, llms.txt, AI-crawler accessibility, and the Island Test. No paywall, no crawl cap.
          </p>

          <div style={{ maxWidth: 620, margin: '0 auto' }}>
            <AuditForm />
          </div>

          <p style={{ marginTop: 14, fontSize: 12, color: 'var(--text-faint)' }}>
            Try a domain like <code style={{ color: 'var(--text-dim)' }}>vercel.com</code> · audits finish in ~3-5 seconds
          </p>
        </section>

        <Section
          eyebrow="What we check"
          heading="40+ checks across 8 categories"
          subheading="Everything Google's starter guide names — plus the AI-search angle most tools haven't caught up with."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <FeatureCard
              icon="◆"
              href="/check"
              title="Classic SEO"
              body="Title, meta description, canonical, hreflang, Open Graph, Twitter Cards, headings, alt text, robots."
            />
            <FeatureCard
              icon="✦"
              href="/check"
              title="JSON-LD validation"
              body="Parses every schema.org block, checks required + recommended fields per type, catches the 78% of errors that are syntax."
            />
            <FeatureCard
              icon="✸"
              href="/check"
              title="GEO / AEO"
              body="llms.txt, AI-crawler accessibility (GPTBot, ClaudeBot, Perplexity), Island Test for citation-worthy content."
            />
            <FeatureCard
              icon="✓"
              href="/check"
              title="Actionable fixes"
              body="Every issue ships with a copy-paste snippet and a link to the authoritative doc. Not just 'something is wrong'."
            />
          </div>
        </Section>

        <Section eyebrow="How it works" heading="From URL to fix list in seconds">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <StepCard step="1" title="Enter a URL" body="Single page for a deep dive, or full site to crawl up to 25 pages from your sitemap." />
            <StepCard step="2" title="We crawl & analyse" body="Render, fetch as GPTBot/ClaudeBot, validate schema, score Core Web Vitals, check the Island Test." />
            <StepCard step="3" title="Get a fix list" body="Sorted by severity. Each finding has a copy-paste fix and a link to the canonical doc." />
          </div>
        </Section>

        <Section eyebrow="Honest about scope" heading="What we don't do (and where to go for it)">
          <div className="glass-card" style={{ padding: '20px 22px' }}>
            <p style={{ margin: '0 0 10px', color: 'var(--text-dim)', fontSize: 14 }}>
              We audit what is on your site. For backlink intelligence, keyword volume, and competitor traffic data — things that need millions in crawl infrastructure — these tools are still worth their price:
            </p>
            <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9, fontSize: 14 }}>
              <li><a href="https://ahrefs.com/" target="_blank" rel="noopener nofollow sponsored">Ahrefs</a> — backlink profile + competitor keywords</li>
              <li><a href="https://www.semrush.com/" target="_blank" rel="noopener nofollow sponsored">SEMrush</a> — keyword tracking + competitive intelligence</li>
              <li><a href="https://surferseo.com/" target="_blank" rel="noopener nofollow sponsored">Surfer SEO</a> — content optimization with topical scoring</li>
            </ul>
            <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              Some links above are affiliate. Same price for you; helps keep this tool free.
            </p>
          </div>
        </Section>

        <section style={{ marginTop: 56, textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Ready when you are.</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 22px' }}>Free forever. Audit your first site in under 5 seconds.</p>
          <Link href="#top" className="btn-primary" style={{ textDecoration: 'none' }}>
            Audit my site →
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({
  eyebrow,
  heading,
  subheading,
  children,
}: {
  eyebrow: string;
  heading: string;
  subheading?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 80 }}>
      <header style={{ marginBottom: 22 }}>
        <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
          {eyebrow}
        </p>
        <h2 style={{ fontSize: 24, margin: 0, letterSpacing: '-0.02em' }}>{heading}</h2>
        {subheading && <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14, maxWidth: 600 }}>{subheading}</p>}
      </header>
      {children}
    </section>
  );
}

function FeatureCard({ title, body, href, icon }: { title: string; body: string; href?: string; icon: string }) {
  const inner = (
    <>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--accent-grad-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: 'var(--accent)', marginBottom: 14,
        border: '1px solid var(--border)',
      }}>
        {icon}
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{body}</p>
    </>
  );
  const baseStyle = { display: 'block', padding: '18px 18px 20px', color: 'inherit', textDecoration: 'none' } as const;
  return href
    ? <Link href={href} className="glass-card" style={baseStyle}>{inner}</Link>
    : <div className="glass-card" style={baseStyle}>{inner}</div>;
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="glass-card" style={{ padding: '18px 18px 20px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', marginBottom: 8, letterSpacing: '0.08em' }}>
        STEP {step}
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}
