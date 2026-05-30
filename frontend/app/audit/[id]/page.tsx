import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getReport, sevColor, type Check, type PageReport } from '@/lib/api';
import { ScoreRing } from '@/app/_components/ScoreRing';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return { title: 'Report not found', robots: { index: false } };
  const host = safeHost(report.url);
  return {
    title: `SEO audit of ${host} — score ${report.summary.overall}/100`,
    description: `Comprehensive SEO + JSON-LD + metadata + GEO audit of ${host}. ${report.summary.totals.error} errors, ${report.summary.totals.warning} warnings, ${report.summary.totals.pass} passing.`,
    openGraph: {
      title: `SEO audit of ${host}`,
      description: `Overall score: ${report.summary.overall}/100`,
      type: 'article',
    },
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const host = safeHost(report.url);

  // Group checks by id — same finding across N pages becomes one card.
  const byId = new Map<string, Check & { affectedPages: string[] }>();
  for (const p of report.pages) {
    for (const c of p.checks) {
      const existing = byId.get(c.id);
      if (!existing) byId.set(c.id, { ...c, affectedPages: [p.url] });
      else if (!existing.affectedPages.includes(p.url)) existing.affectedPages.push(p.url);
    }
  }
  for (const c of report.siteChecks) {
    if (!byId.has(c.id)) byId.set(c.id, { ...c, affectedPages: [] });
  }
  const sevOrder = { error: 0, warning: 1, info: 2, pass: 3 } as const;
  const sortedChecks = [...byId.values()].sort((a, b) => {
    const s = sevOrder[a.severity] - sevOrder[b.severity];
    if (s !== 0) return s;
    return b.priority - a.priority;
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `SEO audit of ${host}`,
    datePublished: report.createdAt,
    dateModified: report.finishedAt ?? report.createdAt,
    author: { '@type': 'Organization', name: 'SEO Auditor' },
    publisher: { '@type': 'Organization', name: 'SEO Auditor' },
  };

  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 60px' }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← New audit</Link>

        <header style={{ margin: '20px 0 28px' }}>
          <span className="tag" style={{ marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pass)', boxShadow: '0 0 8px var(--pass-glow)' }} />
            {report.scope === 'site' ? `${report.meta.pagesAnalyzed} pages` : 'Single page'} · {new Date(report.createdAt).toLocaleDateString()}
          </span>
          <h1 style={{ fontSize: 32, margin: '0 0 6px', wordBreak: 'break-all', letterSpacing: '-0.02em' }}>{host}</h1>
          <a href={report.url} target="_blank" rel="noopener" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{report.url} ↗</a>
        </header>

        <div className="glass-card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          padding: '24px 28px',
          marginBottom: 22,
          flexWrap: 'wrap',
        }}>
          <ScoreRing score={report.summary.overall} size={130} />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {(['error', 'warning', 'info', 'pass'] as const).map((s) => (
              <div key={s}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{s}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: sevColor(s), lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  {report.summary.totals[s]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <CategoryBreakdown summary={report.summary} />

        <div style={{ marginBottom: 24 }}>
          <BadgeEmbed reportId={report.id} host={host} score={report.summary.overall} />
        </div>

        <h2 style={{ fontSize: 22, margin: '32px 0 14px', letterSpacing: '-0.02em' }}>Findings</h2>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedChecks.map((c, i) => (
            <StaticCheckCard key={`${c.id}-${i}`} check={c} />
          ))}
        </section>

        {report.scope === 'site' && report.pages.length > 1 && (
          <>
            <h2 style={{ fontSize: 22, margin: '40px 0 14px', letterSpacing: '-0.02em' }}>Pages analyzed ({report.pages.length})</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              {report.pages.map((p: PageReport, i: number) => (
                <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: p.status < 300 ? 'var(--pass)' : 'var(--warning)' }}>
                    {p.status}
                  </span>
                  <span style={{ wordBreak: 'break-all' }}>{p.url}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <RecommendedTools />
      </main>
      <SiteFooter />
    </>
  );
}

function safeHost(url: string): string {
  try { return new URL(url).host; } catch { return url; }
}

function CategoryBreakdown({ summary }: { summary: { byCategory: Record<string, { score: number; checks: number }> } }) {
  const entries = Object.entries(summary.byCategory);
  if (entries.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
      {entries.map(([cat, info]) => {
        const color =
          info.score >= 90 ? 'var(--pass)' :
          info.score >= 75 ? '#86efac' :
          info.score >= 60 ? 'var(--warning)' :
          info.score >= 40 ? '#fb923c' :
          'var(--error)';
        return (
          <div key={cat} className="glass-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600 }}>
              {cat}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{info.score}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{info.checks} checks</div>
            <div style={{ marginTop: 10, height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${info.score}%`, background: color, borderRadius: 999 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StaticCheckCard({ check }: { check: Check & { affectedPages?: string[] } }) {
  const sev = check.severity;
  return (
    <details
      open={sev === 'error'}
      className={`check-card check-card--${sev}`}
    >
      <summary style={{ cursor: 'pointer', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, listStyle: 'none' }}>
        <span className={`severity-badge severity-badge--${sev}`}>{sev}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>{check.title}</span>
        {check.affectedPages && check.affectedPages.length > 1 && (
          <span className="tag" style={{ background: 'rgba(124, 140, 255, 0.08)', borderColor: 'rgba(124, 140, 255, 0.25)', color: 'var(--accent)' }}>
            {check.affectedPages.length} pages
          </span>
        )}
        <span className="category-chip">{check.category}</span>
      </summary>
      <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--text-dim)', margin: '14px 0 16px', fontSize: 13, lineHeight: 1.65 }}>{check.whyItMatters}</p>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>
            ↗ Fix
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.55 }}>{check.fix.summary}</p>
          {check.fix.snippet && <pre style={{ margin: 0, fontSize: 12.5 }}>{check.fix.snippet}</pre>}
          <p style={{ margin: '12px 0 0', fontSize: 12 }}>
            <a href={check.fix.docLink} target="_blank" rel="noopener">Read the docs →</a>
            {' · '}
            <Link href={`/check/${encodeURIComponent(check.id)}`}>Learn more</Link>
          </p>
        </div>
      </div>
    </details>
  );
}

function BadgeEmbed({ reportId, host, score }: { reportId: string; host: string; score: number }) {
  const badgeUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/badge?score=${score}&host=${encodeURIComponent(host)}`;
  const embed = `<a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/audit/${reportId}"><img src="${badgeUrl}" alt="SEO score for ${host}" /></a>`;
  return (
    <details className="glass-card" style={{ padding: '14px 18px' }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-dim)' }}>
        ◆ Embed this score on your site
      </summary>
      <p style={{ margin: '10px 0 8px', fontSize: 12, color: 'var(--text-muted)' }}>Paste this into any blog post or README:</p>
      <pre style={{ margin: 0, fontSize: 11.5 }}>{embed}</pre>
    </details>
  );
}

function RecommendedTools() {
  return (
    <section style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
      <h2 style={{ fontSize: 18, margin: '0 0 8px', letterSpacing: '-0.01em' }}>What we cannot show (and where to go for it)</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
        We audit what is on your site. For backlink and competitor traffic intelligence, these tools earn their price:
      </p>
      <ul style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.8, paddingLeft: 18 }}>
        <li><a href="https://ahrefs.com/" target="_blank" rel="noopener nofollow sponsored">Ahrefs</a> — backlink profile + competitor keywords</li>
        <li><a href="https://www.semrush.com/" target="_blank" rel="noopener nofollow sponsored">SEMrush</a> — keyword tracking + competitive intelligence</li>
        <li><a href="https://surferseo.com/" target="_blank" rel="noopener nofollow sponsored">Surfer SEO</a> — content optimization with topical scoring</li>
      </ul>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        Some links above are affiliate. Same price for you; helps keep this tool free.
      </p>
    </section>
  );
}
