import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Comparison {
  tool: string;
  affiliateUrl: string;
  intro: string;
  wePros: string[];
  theyPros: string[];
  recommendation: string;
}

const COMPARISONS: Record<string, Comparison> = {
  'vs-screaming-frog': {
    tool: 'Screaming Frog',
    affiliateUrl: 'https://www.screamingfrog.co.uk/seo-spider/',
    intro: 'Screaming Frog is the desktop SEO crawler power-users have relied on for over a decade. Its free version caps at 500 URLs and the paid version is GBP 199/yr per machine. Here is how we compare.',
    wePros: [
      'Free for any number of pages — no 500-URL cap',
      'Browser-based, no install, works on any OS',
      'GEO/AEO checks (llms.txt, AI-crawler accessibility, Island Test) built in',
      'JSON-LD validation includes required + recommended fields per type',
      'Live SSE-streamed results — see checks complete as the crawl runs',
    ],
    theyPros: [
      'Far deeper crawl customisation (custom extraction, JavaScript rendering tuning)',
      'Integrations with Search Console, Analytics, PageSpeed for cross-data',
      'Decade of mature features for SEO professionals',
      'Better at very large sites (10k+ pages) due to local CPU/RAM',
    ],
    recommendation: 'Use us for the day-to-day audit, especially if you care about AI search visibility. Use Screaming Frog when you need deep custom extraction or are crawling enterprise-scale sites.',
  },
  'vs-semrush': {
    tool: 'SEMrush',
    affiliateUrl: 'https://www.semrush.com/',
    intro: 'SEMrush is the all-in-one SEO marketing platform — keywords, backlinks, competitive intel, and a site auditor. Starts at USD 140/month. Here is the honest split.',
    wePros: [
      'Free, no signup, no crawl cap',
      'GEO/AEO pillar (llms.txt, AI-crawler accessibility, Island Test) — SEMrush does not cover this depth',
      'Open-source check definitions — every rule is auditable',
      'Streamed live results, no waiting for batch reports',
    ],
    theyPros: [
      'Backlink database — we do not have this and cannot build it without millions in crawl infra',
      'Keyword volume + difficulty + competitive rank tracking',
      'Content gap analysis vs. competitors',
      'Decade of brand and integrations',
    ],
    recommendation: 'Use us for the technical audit and GEO/AEO. Use SEMrush when you need backlink intel or competitor research — those are tasks we cannot help with.',
  },
  'vs-ahrefs': {
    tool: 'Ahrefs',
    affiliateUrl: 'https://ahrefs.com/',
    intro: 'Ahrefs is the gold standard for backlink intelligence and a strong site auditor. Starts at USD 129/month. Here is the comparison.',
    wePros: [
      'Free, GEO-first, no signup',
      'Faster for one-off audits — no project setup or recrawl scheduling',
      'AI-crawler cloaking detection (we fetch as GPTBot, ClaudeBot, PerplexityBot and compare)',
      'Per-check explainer pages so non-specialists can act on findings',
    ],
    theyPros: [
      'World-class backlink database (DR scores, referring domains, link velocity)',
      'Keyword Explorer with global search volume and difficulty',
      'Rank Tracker for daily SERP position monitoring',
      'Webmaster Tools tier is free if you verify the domain — close to but not as restrictive as paid',
    ],
    recommendation: 'We complement Ahrefs rather than replace it. Use us for technical + GEO; use Ahrefs Webmaster Tools (free) for backlink and keyword data, or pay for the full platform if you do this professionally.',
  },
  'vs-sitebulb': {
    tool: 'Sitebulb',
    affiliateUrl: 'https://sitebulb.com/',
    intro: 'Sitebulb is a desktop SEO crawler known for excellent visualisations of internal linking and crawl issues. Starts at USD 35/month. Here is how we compare.',
    wePros: [
      'Free, browser-based — no install required',
      'GEO/AEO checks built in (Sitebulb does not cover llms.txt or AI-crawler accessibility yet)',
      'Public shareable report URLs',
      'Embed-friendly SVG badge for distribution',
    ],
    theyPros: [
      'Better internal-link visualisation and graph traversal UI',
      'More mature crawl customisation and reporting templates',
      'Hint-based prioritisation engine refined over years',
      'Integrations with Search Console and Analytics',
    ],
    recommendation: 'Use us for quick free audits and GEO. Use Sitebulb when you need richer visual analytics and are crawling client sites regularly.',
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(COMPARISONS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = COMPARISONS[slug];
  if (!c) return { title: 'Not found', robots: { index: false } };
  return {
    title: `SEO Auditor vs. ${c.tool} — honest comparison`,
    description: c.intro.slice(0, 160),
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const c = COMPARISONS[slug];
  if (!c) notFound();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Link href="/compare" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← All comparisons</Link>
      <h1 style={{ fontSize: 32, margin: '20px 0 8px' }}>SEO Auditor vs. {c.tool}</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 28px' }}>{c.intro}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
        <section style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <h2 style={{ fontSize: 16, margin: '0 0 10px' }}>Where we win</h2>
          <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14, lineHeight: 1.7 }}>
            {c.wePros.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
        <section style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <h2 style={{ fontSize: 16, margin: '0 0 10px' }}>Where {c.tool} wins</h2>
          <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14, lineHeight: 1.7 }}>
            {c.theyPros.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      </div>

      <section style={{ padding: '16px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 22 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 10px' }}>Our honest recommendation</h2>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{c.recommendation}</p>
      </section>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '12px 0' }}>
        Want to try {c.tool}?{' '}
        <a href={c.affiliateUrl} target="_blank" rel="noopener nofollow sponsored">Visit {c.tool} ↗</a>
        {' '}(affiliate link — same price for you, supports this free tool).
      </p>

      <section style={{ marginTop: 32, padding: '18px 22px', background: 'var(--accent-strong)', borderRadius: 'var(--radius)' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, color: '#fff' }}>Try our auditor now</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
          Free, no signup. See what we catch that {c.tool} might miss.
        </p>
        <Link href="/" style={{ background: '#fff', color: '#000', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Audit my site →
        </Link>
      </section>
    </main>
  );
}
