import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';

interface PricingPlan {
  name: string;
  price: string;
  per: string;
  highlight?: string;
}

interface Comparison {
  tool: string;
  affiliateUrl: string;
  tagline: string;
  intro: string;
  ourPricing: PricingPlan[];
  theirPricing: PricingPlan[];
  wePros: string[];
  theyPros: string[];
  useCaseUs: string[];
  useCaseThem: string[];
  recommendation: string;
  faqs: Array<{ q: string; a: string }>;
}

const COMPARISONS: Record<string, Comparison> = {
  'vs-screaming-frog': {
    tool: 'Screaming Frog',
    affiliateUrl: 'https://www.screamingfrog.co.uk/seo-spider/',
    tagline: 'The classic desktop SEO crawler',
    intro:
      'Screaming Frog SEO Spider is the desktop SEO crawler that power-users have relied on for over a decade. ' +
      'It runs locally, ships with deep customisation, and has shaped the technical SEO toolkit. The free tier ' +
      'caps at 500 URLs and the paid version costs £199 per year per machine. Here is the honest comparison.',
    ourPricing: [
      { name: 'Free', price: '$0', per: 'forever', highlight: 'Unlimited audits, no signup' },
    ],
    theirPricing: [
      { name: 'Free', price: '£0', per: '500 URL cap' },
      { name: 'Paid', price: '£199', per: 'per machine / year', highlight: 'Removes URL cap' },
    ],
    wePros: [
      'Free for any number of pages — no 500-URL cap, no per-machine licensing',
      'Browser-based, zero install — works on any OS without admin rights',
      'GEO/AEO checks (llms.txt, AI-crawler accessibility, Island Test) built into the core',
      'JSON-LD validation includes required + recommended fields per schema.org type',
      'Live SSE-streamed results — see each check complete as the crawl runs',
      'Shareable report URLs with 7-day TTL — send the link to your client',
      'Embeddable SVG score badge for READMEs and about pages',
    ],
    theyPros: [
      'Far deeper crawl customisation: custom extraction, regex match, XPath rules',
      'JavaScript rendering tuning at a level no free tool can match',
      'Direct integrations with Google Search Console, Analytics, and PageSpeed',
      'Decade of feature maturity built around SEO professional workflows',
      'Better suited to very large sites (10k+ URLs) thanks to local CPU/RAM',
      'Robust scheduled-crawl mode for ongoing monitoring',
    ],
    useCaseUs: [
      'You want a one-off audit before a client kickoff call',
      'You need to check if AI search engines can read your site',
      'You\'re publishing a portfolio piece and want a public badge',
      'You\'re a small team without a per-seat budget for SEO tools',
    ],
    useCaseThem: [
      'You\'re a dedicated SEO professional auditing 10+ client sites a month',
      'You need custom extraction (e.g. pulling product prices from every page)',
      'You\'re crawling enterprise-scale sites where local CPU beats free cloud',
      'You want one tool that combines crawl + Search Console + PageSpeed data',
    ],
    recommendation:
      'Use SEO Auditor for the day-to-day audit, especially if you care about AI search visibility ' +
      'and want a shareable report URL. Use Screaming Frog when you need deep custom extraction or ' +
      'are crawling enterprise-scale client sites professionally.',
    faqs: [
      {
        q: 'Can SEO Auditor replace Screaming Frog for client work?',
        a: 'For 80% of small-to-mid-sized client audits, yes. For enterprise SEO consulting that demands custom extraction and JS-rendering tuning, Screaming Frog is still the right tool. We\'re honest about that.',
      },
      {
        q: 'Does Screaming Frog do GEO/AEO checks?',
        a: 'Not at the depth we do. It can read robots.txt for AI crawlers, but it doesn\'t check for llms.txt presence, doesn\'t run the Island Test on paragraph extractability, and doesn\'t compare bot vs. browser content. Those are first-class checks in SEO Auditor.',
      },
      {
        q: 'What if I have a site with 5,000 pages?',
        a: 'Our site crawl samples up to 25 pages from your sitemap by default — enough to catch templating issues that repeat across pages. For genuine site-wide enumeration of 5k+ pages, Screaming Frog or a paid cloud crawler will serve you better.',
      },
    ],
  },
  'vs-semrush': {
    tool: 'SEMrush',
    affiliateUrl: 'https://www.semrush.com/',
    tagline: 'All-in-one digital marketing platform',
    intro:
      'SEMrush is the all-in-one digital marketing platform — keyword research, backlink intelligence, ' +
      'competitive intel, rank tracking, content optimisation, and a site auditor. It starts at $139.95/month ' +
      'and goes up. Here\'s the honest comparison for the technical-audit piece of what they do.',
    ourPricing: [
      { name: 'Free', price: '$0', per: 'forever', highlight: 'Unlimited audits' },
    ],
    theirPricing: [
      { name: 'Pro', price: '$139.95', per: 'per month', highlight: '5 projects, 100k pages/mo' },
      { name: 'Guru', price: '$249.95', per: 'per month' },
      { name: 'Business', price: '$499.95', per: 'per month' },
    ],
    wePros: [
      'Free with no signup or credit card — start auditing in 5 seconds',
      'GEO/AEO depth (llms.txt, AI-crawler accessibility, Island Test) SEMrush doesn\'t cover',
      'Open-source check definitions — every rule and threshold is auditable on GitHub',
      'Streamed live results — no waiting for batch reports to email-back',
      'JSON-LD validation with required + recommended fields per schema type',
      'Shareable report URLs with no account creation required from viewer',
    ],
    theyPros: [
      'Backlink database (200+ billion backlinks tracked) — we cannot build this',
      'Keyword volume + difficulty + competitive rank tracking for 25B keywords',
      'Content Gap analysis vs. specific competitor domains',
      'Position Tracking for daily SERP monitoring (we don\'t do this at all)',
      'Decade of brand recognition and enterprise integrations',
      'Built-in PPC analysis for paid-search teams',
    ],
    useCaseUs: [
      'You want technical SEO without paying for keyword research you won\'t use',
      'You\'re a developer or indie hacker, not a full-time SEO marketer',
      'You need to audit one-off URLs without setting up a "project"',
      'You care specifically about AI search ranking, not just Google',
    ],
    useCaseThem: [
      'You\'re running paid SEO for clients and need backlink + competitor data',
      'You manage 5+ ongoing projects with rank tracking and recrawl schedules',
      'You\'re a marketing team blending SEO with content + PPC strategy',
      'You need brand-name credibility in client proposals',
    ],
    recommendation:
      'Use SEO Auditor for the technical-audit and GEO/AEO piece. Use SEMrush (or Ahrefs) when you ' +
      'need backlink intelligence or competitor research — those require crawl infrastructure we can\'t replicate.',
    faqs: [
      {
        q: 'Is SEMrush worth $140/month for a small business?',
        a: 'If you\'re actively investing in content marketing and backlinks, yes. If you just want a technical audit and your DIY content strategy, save the money — use SEO Auditor for technical health and Google Search Console (free) for keyword data.',
      },
      {
        q: 'What does SEMrush do that you cannot?',
        a: 'Backlink intelligence (who links to you and your competitors), keyword volume data, position tracking, and competitive content-gap analysis. Those all require billions of dollars of crawl infrastructure we don\'t and won\'t have.',
      },
      {
        q: 'What do you do that SEMrush cannot?',
        a: 'GEO/AEO depth (Island Test, llms.txt validation, AI-crawler comparison), open-source rules, no signup friction, live SSE-streamed results, and shareable public report URLs.',
      },
    ],
  },
  'vs-ahrefs': {
    tool: 'Ahrefs',
    affiliateUrl: 'https://ahrefs.com/',
    tagline: 'Backlink intelligence gold standard',
    intro:
      'Ahrefs is the gold-standard for backlink intelligence and a genuinely strong site auditor. It starts at ' +
      '$129/month for the Lite plan, but they also offer Ahrefs Webmaster Tools (AWT) for free if you verify ' +
      'domain ownership. Here\'s the comparison.',
    ourPricing: [
      { name: 'Free', price: '$0', per: 'forever', highlight: 'No verification, any URL' },
    ],
    theirPricing: [
      { name: 'AWT', price: '$0', per: 'verified domains only' },
      { name: 'Lite', price: '$129', per: 'per month' },
      { name: 'Standard', price: '$249', per: 'per month' },
      { name: 'Advanced', price: '$449', per: 'per month' },
    ],
    wePros: [
      'Free for any URL — no domain verification step required',
      'GEO-first design (Ahrefs is adding GEO support but our depth is greater)',
      'Faster for one-off audits — no project setup or recrawl scheduling',
      'AI-crawler cloaking detection (we fetch as GPTBot, ClaudeBot, PerplexityBot and compare)',
      'Per-check explainer pages so non-specialists can act on findings',
      'Live SSE streaming vs. batched report generation',
    ],
    theyPros: [
      'World-class backlink database (DR scores, referring domains, link velocity)',
      'Keyword Explorer with global search volume, difficulty, and SERP analysis',
      'Rank Tracker for daily SERP position monitoring',
      'Content Explorer for finding high-performing content in your niche',
      'Webmaster Tools (free with verification) is genuinely useful and not as gated as competitors',
      'Mature visualisation and reporting templates',
    ],
    useCaseUs: [
      'You don\'t own the site you want to audit (client kickoff, competitor analysis)',
      'You want a public shareable report URL without account walls',
      'You care about AI search readiness, not just Google',
      'You\'re a developer wanting technical SEO without marketing-platform overhead',
    ],
    useCaseThem: [
      'You\'re building a backlink strategy and need link-prospecting data',
      'You\'re tracking keyword rankings as a primary KPI',
      'You manage SEO for multiple verified domains and want consolidated dashboards',
      'You want the most respected SEO brand for client-facing reports',
    ],
    recommendation:
      'We complement Ahrefs rather than replace it. Use SEO Auditor for technical and GEO checks; use ' +
      'Ahrefs Webmaster Tools (free, with domain verification) for backlink and keyword data; pay for the ' +
      'full Ahrefs platform if you do SEO professionally.',
    faqs: [
      {
        q: 'Should I use Ahrefs Webmaster Tools instead of SEO Auditor?',
        a: 'Use both. AWT gives you backlink and keyword data we can\'t. We give you GEO/AEO checks, no-signup auditing, and shareable report URLs. They complement each other.',
      },
      {
        q: 'Can I audit a competitor\'s site with SEO Auditor?',
        a: 'Yes. We don\'t require domain verification — paste any URL and audit it. This is useful for kickoff calls, competitive teardowns, or just learning by inspecting sites you admire.',
      },
      {
        q: 'Does Ahrefs do GEO/AEO checks?',
        a: 'They\'re adding AI-search features but not at the depth we have. As of our last benchmark, Ahrefs doesn\'t check for llms.txt, doesn\'t run the Island Test, and doesn\'t do bot-vs-browser content comparison.',
      },
    ],
  },
  'vs-sitebulb': {
    tool: 'Sitebulb',
    affiliateUrl: 'https://sitebulb.com/',
    tagline: 'Visualisation-rich desktop crawler',
    intro:
      'Sitebulb is a desktop SEO crawler renowned for excellent visualisations of internal linking and crawl ' +
      'issues. It starts at $35/month per user (cloud) or $13.50/month per machine (desktop). Here\'s the comparison.',
    ourPricing: [
      { name: 'Free', price: '$0', per: 'forever', highlight: 'Unlimited audits' },
    ],
    theirPricing: [
      { name: 'Sitebulb Desktop', price: '$13.50', per: 'per machine / month' },
      { name: 'Sitebulb Cloud', price: '$35', per: 'per user / month' },
      { name: 'Cloud Plus', price: '$70', per: 'per user / month' },
    ],
    wePros: [
      'Free, browser-based — no install required, works on any device with a browser',
      'GEO/AEO checks built in (Sitebulb doesn\'t cover llms.txt or Island Test yet)',
      'Public shareable report URLs — anyone with the link can view',
      'Embeddable SVG badge for distribution',
      'Live streamed results vs. wait-for-crawl-to-finish UX',
      'Open source — every rule is auditable on GitHub',
    ],
    theyPros: [
      'Better internal-link visualisation and graph traversal UI',
      'More mature crawl customisation and reporting templates',
      'Hint-based prioritisation engine refined over years of consulting feedback',
      'Direct integrations with Google Search Console and Analytics',
      'Side-by-side crawl comparison (track changes between audits)',
      'Project management features for ongoing client monitoring',
    ],
    useCaseUs: [
      'You\'re doing a quick one-off audit and want it shareable',
      'You care about AI search readiness on top of classic SEO',
      'You\'re building in public and want an embeddable score badge',
      'You don\'t need recurring crawls — just an honest snapshot',
    ],
    useCaseThem: [
      'You\'re an agency monitoring 10+ client sites continuously',
      'You need rich visualisations to explain findings to non-technical stakeholders',
      'You want side-by-side crawl comparison to track SEO improvements over time',
      'You need integrations with the rest of the SEO data stack',
    ],
    recommendation:
      'Use SEO Auditor for quick free audits and GEO depth. Use Sitebulb when you need recurring monitoring, ' +
      'richer internal-link visualisations, and are willing to pay per seat for an agency workflow.',
    faqs: [
      {
        q: 'Why is Sitebulb a desktop app?',
        a: 'It uses your local CPU and RAM, which lets it crawl much larger sites than a free cloud service can. For 100k+ URL crawls, that architecture wins on cost. For 25-page audits, it\'s overkill.',
      },
      {
        q: 'Does Sitebulb do JSON-LD validation?',
        a: 'Yes, it parses JSON-LD blocks and checks for syntax errors. We go a step further with required and recommended field checks per schema.org type — the difference between "valid JSON" and "valid Google rich-result eligibility."',
      },
      {
        q: 'Can I share a Sitebulb report publicly?',
        a: 'You can export PDF reports. We give you a public URL that updates if you re-audit, plus an embeddable SVG badge — better for portfolios and READMEs.',
      },
    ],
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
    title: `SEO Auditor vs. ${c.tool} — pricing, features, honest comparison`,
    description:
      `Side-by-side comparison of SEO Auditor and ${c.tool}: pricing breakdown, feature matrix, ` +
      `where each wins, and honest recommendations.`,
    openGraph: {
      title: `SEO Auditor vs. ${c.tool}`,
      description: c.intro.slice(0, 160),
      type: 'article',
    },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const c = COMPARISONS[slug];
  if (!c) notFound();

  return (
    <>
      <SiteHeader />
      <main className="page-shell page-shell--narrow">
        <p className="page-eyebrow"><Link href="/compare">Comparisons</Link> &middot; {c.tool}</p>
        <h1 className="page-title">SEO Auditor vs. {c.tool}</h1>
        <p className="page-lede">{c.intro}</p>

        {/* Pricing */}
        <section className="cmp-section">
          <h2 className="page-subtitle">Pricing at a glance</h2>
          <div className="cmp-price-grid">
            <PricingCol label="SEO Auditor" plans={c.ourPricing} ours />
            <PricingCol label={c.tool} plans={c.theirPricing} />
          </div>
        </section>

        {/* Pros split */}
        <section className="cmp-section">
          <h2 className="page-subtitle">Where each tool wins</h2>
          <div className="cmp-pros-grid">
            <div className="cmp-pros-card cmp-pros-card--us">
              <h3>Where SEO Auditor wins</h3>
              <ul>
                {c.wePros.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
            <div className="cmp-pros-card">
              <h3>Where {c.tool} wins</h3>
              <ul>
                {c.theyPros.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* When to choose which */}
        <section className="cmp-section">
          <h2 className="page-subtitle">When to pick which</h2>
          <div className="cmp-use-grid">
            <div className="cmp-use-card cmp-use-card--us">
              <h3>Pick SEO Auditor when…</h3>
              <ul>
                {c.useCaseUs.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
            <div className="cmp-use-card">
              <h3>Pick {c.tool} when…</h3>
              <ul>
                {c.useCaseThem.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* Honest recommendation */}
        <section className="cmp-rec">
          <h2 className="cmp-rec__title">Our honest recommendation</h2>
          <p>{c.recommendation}</p>
          <p className="cmp-rec__affiliate">
            Want to try {c.tool}?{' '}
            <a href={c.affiliateUrl} target="_blank" rel="noopener nofollow sponsored">
              Visit {c.tool} ↗
            </a>
            {' '}(affiliate link — same price for you, helps keep this tool free).
          </p>
        </section>

        {/* FAQ */}
        <section className="cmp-section">
          <h2 className="page-subtitle">Frequently asked</h2>
          <div className="cmp-faqs">
            {c.faqs.map((f) => (
              <details key={f.q} className="cmp-faq">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cmp-cta">
          <h2 className="cmp-cta__title">Run a real audit now</h2>
          <p className="cmp-cta__sub">
            No signup, no credit card. See exactly what we catch vs. {c.tool}.
          </p>
          <Link href="/" className="btn-primary">Audit my site →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function PricingCol({ label, plans, ours }: { label: string; plans: PricingPlan[]; ours?: boolean }) {
  return (
    <div className={`cmp-price-col${ours ? ' cmp-price-col--us' : ''}`}>
      <h3>{label}</h3>
      <ul>
        {plans.map((p) => (
          <li key={p.name}>
            <div className="cmp-price-name">{p.name}</div>
            <div className="cmp-price-amt"><span>{p.price}</span> <em>{p.per}</em></div>
            {p.highlight && <div className="cmp-price-hl">{p.highlight}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
