/**
 * The paid-service catalogue — single source of truth for pricing.
 *
 * Prices are published deliberately. Every agency in this space hides behind
 * "contact us"; transparency plus fixed scope is what lets us sit above the
 * freelance marketplaces while undercutting agencies (who charge $1,500–$5,000
 * for the same one-time GEO/AEO audit).
 *
 * Consumed by /services, /services/[slug], the /quote form, and the outreach
 * email templates, so all four can never drift apart.
 */

export type ServiceSlug = 'report' | 'implementation' | 'analytics' | 'monitoring';

export interface Service {
  slug: ServiceSlug;
  name: string;
  /** Display price. Kept as a string because these are ranges, not numbers. */
  price: string;
  priceNote?: string;
  turnaround: string;
  /** One line, in the customer's language, about the problem this solves. */
  tagline: string;
  bestFor: string;
  includes: string[];
  excludes: string[];
  /** Ordering + emphasis on the services page. */
  featured?: boolean;
}

export const SERVICES: Service[] = [
  {
    slug: 'report',
    name: 'AI Visibility Report',
    price: '$99',
    priceNote: 'one-off, up to 25 pages',
    turnaround: '48 hours',
    tagline:
      "Find out exactly why ChatGPT, Perplexity and Google's AI answers aren't citing your site — and what to change.",
    bestFor: 'Founders who want the diagnosis before deciding whether to hire anyone.',
    includes: [
      'Full GEO/AEO + technical SEO audit of your site',
      'Every finding ranked by impact, with a copy-paste fix',
      'AI-crawler access + cloaking check (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot)',
      'llms.txt, structured-data and E-E-A-T review',
      'Branded PDF you can forward to your team',
      '30 minutes of follow-up questions over email',
    ],
    excludes: ['We do not implement the fixes at this tier', 'No ongoing monitoring'],
  },
  {
    slug: 'implementation',
    name: 'GEO + SEO Fix Implementation',
    price: '$799',
    priceNote: 'from — final price quoted after we see the site',
    turnaround: '72 hours from repo access',
    tagline: 'We do not hand you a PDF and wish you luck. We implement the fixes and send you a pull request.',
    bestFor: 'Teams who already know something is broken and want it fixed without spending their own dev time.',
    includes: [
      'Everything in the AI Visibility Report',
      'We implement the fixes ourselves',
      'Delivered as a pull request you review and merge — nothing goes live without your approval',
      'Structured data, metadata, llms.txt, crawler access, headings and internal linking',
      'Re-audit after merge, with a before/after score diff as proof of work',
      'Scoped repo access only, revoked the moment we are done',
    ],
    excludes: [
      'No traffic or ranking guarantees — see below',
      'Content writing is quoted separately',
      'We never ask for production credentials, API keys or secrets',
    ],
    featured: true,
  },
  {
    slug: 'analytics',
    name: 'Analytics Foundation',
    price: '$299',
    priceNote: 'one-off',
    turnaround: '48 hours',
    tagline: "Most sites we audit cannot actually measure anything. We set the measurement layer up properly, once.",
    bestFor: 'Anyone who has GA4 installed but has never trusted a number that came out of it.',
    includes: [
      'GA4 set up correctly, with real conversion events — not just pageviews',
      'Google Search Console + Bing Webmaster Tools verified and submitted',
      'Sitemap and robots.txt validated, IndexNow wired up',
      'Key user actions instrumented so the funnel is actually visible',
      'A short walkthrough of what to look at each week',
    ],
    excludes: ['No dashboard-building or ongoing reporting at this tier'],
  },
  {
    slug: 'monitoring',
    name: 'Monthly Monitoring',
    price: '$149',
    priceNote: 'per month, cancel any time',
    turnaround: 'Weekly',
    tagline: 'SEO breaks silently. A deploy strips a canonical, a robots rule blocks a crawler, nobody notices for months.',
    bestFor: 'Teams shipping frequently who want to know the week it breaks, not the quarter.',
    includes: [
      'Weekly full re-audit of your site',
      'Alerts the moment a score drops or a new error appears',
      'AI-crawler access monitored — we catch it if GPTBot or ClaudeBot gets blocked',
      'Monthly summary of what changed and what to do about it',
      'No lock-in, cancel whenever',
    ],
    excludes: ['Fixes are quoted separately unless bundled with implementation'],
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

/** Options for the /quote tier picker — services plus an escape hatch. */
export const QUOTE_TIER_OPTIONS: { value: string; label: string }[] = [
  ...SERVICES.map((s) => ({ value: s.slug, label: `${s.name} — from ${s.price}` })),
  { value: 'custom', label: "Something else / I'm not sure yet" },
];

/**
 * The honest-positioning statement. Shown on every service page, the quote form
 * and the acknowledgement email. It is the pitch, not a disclaimer — every
 * competitor promises rankings and most cannot deliver.
 */
export const NO_GUARANTEE = {
  headline: "We don't sell rankings.",
  body:
    'Nobody can honestly guarantee traffic — it depends on your market, your competitors and your content. ' +
    'What we guarantee is a technically correct, AI-citable website, delivered on a fixed price, with a ' +
    'before/after diff showing exactly what changed.',
};
