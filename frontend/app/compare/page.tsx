import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/app/_components/SiteHeader';
import { SiteFooter } from '@/app/_components/SiteFooter';

export const metadata: Metadata = {
  title: 'SEO Auditor vs. Screaming Frog, SEMrush, Ahrefs, Sitebulb — honest comparisons',
  description:
    'Side-by-side comparisons of SEO Auditor against Screaming Frog, SEMrush, Ahrefs, and Sitebulb. Pricing, features, GEO/AEO support, and honest recommendations on when each tool wins.',
};

interface ComparisonCard {
  slug: string;
  tool: string;
  tagline: string;
  ourPrice: string;
  theirPrice: string;
  freeTier: string;
  geoSupport: 'Yes' | 'No' | 'Partial';
  wedge: string;
  bestFor: string;
}

const COMPARISONS: ComparisonCard[] = [
  {
    slug: 'vs-screaming-frog',
    tool: 'Screaming Frog',
    tagline: 'The classic desktop SEO crawler',
    ourPrice: 'Free',
    theirPrice: '£199/yr',
    freeTier: '500-URL cap, no scheduling',
    geoSupport: 'No',
    wedge: 'No URL cap, no install, GEO checks built in',
    bestFor: 'You need quick, GEO-aware audits without installing software.',
  },
  {
    slug: 'vs-semrush',
    tool: 'SEMrush',
    tagline: 'All-in-one marketing platform',
    ourPrice: 'Free',
    theirPrice: 'from $140/mo',
    freeTier: '10 audits/day, gated',
    geoSupport: 'Partial',
    wedge: 'No signup; deeper JSON-LD + GEO depth',
    bestFor: 'You want technical audit depth without paying for keyword/backlink data.',
  },
  {
    slug: 'vs-ahrefs',
    tool: 'Ahrefs',
    tagline: 'Backlink intelligence leader',
    ourPrice: 'Free',
    theirPrice: 'from $129/mo',
    freeTier: 'Webmaster Tools (verified domains)',
    geoSupport: 'Partial',
    wedge: 'GEO-first, no project setup, free for any URL',
    bestFor: 'You want technical + GEO audits without verifying domain ownership.',
  },
  {
    slug: 'vs-sitebulb',
    tool: 'Sitebulb',
    tagline: 'Visualisation-rich desktop crawler',
    ourPrice: 'Free',
    theirPrice: 'from $35/mo',
    freeTier: '14-day trial only',
    geoSupport: 'No',
    wedge: 'Browser-based, shareable reports, GEO checks',
    bestFor: 'You need shareable audit URLs without per-seat licensing.',
  },
];

const FEATURE_MATRIX: Array<{ feature: string; us: string; sf: string; sem: string; ah: string; sb: string }> = [
  { feature: 'Free tier',                   us: 'Unlimited',    sf: '500 URLs',      sem: '10/day',      ah: 'Verified only', sb: '14 days' },
  { feature: 'No signup',                   us: 'Yes',          sf: 'Install',       sem: 'No',          ah: 'No',            sb: 'Trial' },
  { feature: 'JSON-LD validation',          us: 'Per-type',     sf: 'Yes',           sem: 'Basic',       ah: 'Basic',         sb: 'Yes' },
  { feature: 'llms.txt check',              us: 'Yes',          sf: 'No',            sem: 'No',          ah: 'No',            sb: 'No' },
  { feature: 'AI-crawler accessibility',    us: 'Yes',          sf: 'Partial',       sem: 'No',          ah: 'Partial',       sb: 'No' },
  { feature: 'Island Test (GEO)',           us: 'Yes',          sf: 'No',            sem: 'No',          ah: 'No',            sb: 'No' },
  { feature: 'Shareable report URLs',       us: 'Yes',          sf: 'CSV only',      sem: 'Yes',         ah: 'Yes',           sb: 'PDF' },
  { feature: 'Embeddable SVG badge',        us: 'Yes',          sf: 'No',            sem: 'No',          ah: 'No',            sb: 'No' },
  { feature: 'Live streamed results',       us: 'SSE',          sf: 'Batch',         sem: 'Batch',       ah: 'Batch',         sb: 'Batch' },
  { feature: 'Backlink intelligence',       us: 'No',           sf: 'No',            sem: 'Yes',         ah: 'Best in class', sb: 'No' },
  { feature: 'Keyword/rank tracking',       us: 'No',           sf: 'No',            sem: 'Yes',         ah: 'Yes',           sb: 'No' },
  { feature: 'Open source',                 us: 'MIT',          sf: 'Closed',        sem: 'Closed',      ah: 'Closed',        sb: 'Closed' },
];

export default function CompareIndex() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <p className="page-eyebrow">Comparisons</p>
        <h1 className="page-title">SEO Auditor vs. the rest</h1>
        <p className="page-lede">
          Honest side-by-side breakdowns of how SEO Auditor stacks up against the established
          paid tools. We tell you where they beat us — and where we beat them — so you can
          pick the right tool without buyer&apos;s regret.
        </p>

        {/* Quick-glance cards */}
        <div className="cmp-grid">
          {COMPARISONS.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="cmp-card">
              <div className="cmp-card__head">
                <div>
                  <h2 className="cmp-card__title">vs. {c.tool}</h2>
                  <p className="cmp-card__tag">{c.tagline}</p>
                </div>
                <span className={`cmp-badge cmp-badge--${c.geoSupport.toLowerCase()}`}>
                  GEO: {c.geoSupport}
                </span>
              </div>
              <dl className="cmp-card__rows">
                <div>
                  <dt>Their price</dt>
                  <dd>{c.theirPrice}</dd>
                </div>
                <div>
                  <dt>Their free tier</dt>
                  <dd>{c.freeTier}</dd>
                </div>
                <div>
                  <dt>Our wedge</dt>
                  <dd>{c.wedge}</dd>
                </div>
              </dl>
              <p className="cmp-card__best">
                <strong>Best for: </strong>{c.bestFor}
              </p>
              <span className="cmp-card__cta">Read the full breakdown →</span>
            </Link>
          ))}
        </div>

        {/* Feature matrix */}
        <section className="cmp-matrix-wrap">
          <h2 className="page-subtitle">Feature matrix at a glance</h2>
          <p className="page-sub-lede">
            Twelve key capabilities across the five tools. &ldquo;Yes&rdquo; means a first-class feature,
            &ldquo;Partial&rdquo; means it&apos;s present but limited, &ldquo;No&rdquo; means absent.
          </p>
          <div className="cmp-matrix">
            <table>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col" className="cmp-matrix__us">SEO Auditor</th>
                  <th scope="col">Screaming Frog</th>
                  <th scope="col">SEMrush</th>
                  <th scope="col">Ahrefs</th>
                  <th scope="col">Sitebulb</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_MATRIX.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row">{row.feature}</th>
                    <td className="cmp-matrix__us"><Cell value={row.us} /></td>
                    <td><Cell value={row.sf} /></td>
                    <td><Cell value={row.sem} /></td>
                    <td><Cell value={row.ah} /></td>
                    <td><Cell value={row.sb} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Honest take */}
        <section className="cmp-honest">
          <h2 className="page-subtitle">Where we genuinely lose</h2>
          <p className="page-sub-lede">
            We&apos;re not going to pretend a free tool is best at everything. Here&apos;s where
            you should reach for a paid platform instead:
          </p>
          <ul className="cmp-honest__list">
            <li>
              <strong>Backlink intelligence.</strong> Ahrefs and SEMrush spent years and millions
              building backlink databases. We can&apos;t replicate that. If link-building is
              your channel, pay them.
            </li>
            <li>
              <strong>Keyword research at scale.</strong> Search volume and keyword difficulty
              data comes from clickstream + SERP scraping at scale. Use SEMrush or Ahrefs.
            </li>
            <li>
              <strong>Enterprise-scale crawls.</strong> If you have a 100k-URL site,
              Screaming Frog on a beefy local machine will outperform any free-tier cloud.
            </li>
            <li>
              <strong>Internal-link visualisation.</strong> Sitebulb&apos;s graph view is
              genuinely best-in-class for understanding link equity flow.
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="cmp-cta">
          <h2 className="cmp-cta__title">Try it before you compare</h2>
          <p className="cmp-cta__sub">
            Run a free audit and judge for yourself. 3-5 seconds for a single page,
            ~30 seconds for a 25-page site crawl.
          </p>
          <Link href="/" className="btn-primary">Audit my site →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Cell({ value }: { value: string }) {
  const positive = /^(yes|sse|unlimited|per-type|mit|best in class)$/i.test(value);
  const negative = /^(no|closed|batch)$/i.test(value);
  const partial = /^partial$/i.test(value);
  const cls = positive ? 'cmp-cell--ok' : negative ? 'cmp-cell--no' : partial ? 'cmp-cell--partial' : '';
  return <span className={`cmp-cell ${cls}`}>{value}</span>;
}
