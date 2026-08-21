import * as cheerio from 'cheerio';
import type { CheckResult, PageContext } from '../types/check.js';

const RULE_VERSION = 'v0.1.0';

// Required-fields map per schema.org type for Google rich-result eligibility.
// Source: https://developers.google.com/search/docs/appearance/structured-data
const REQUIRED_FIELDS: Record<string, string[]> = {
  Article: ['headline', 'author', 'datePublished', 'image'],
  NewsArticle: ['headline', 'author', 'datePublished', 'image'],
  BlogPosting: ['headline', 'author', 'datePublished', 'image'],
  Product: ['name', 'image', 'offers'],
  Recipe: ['name', 'image', 'recipeIngredient', 'recipeInstructions'],
  Event: ['name', 'startDate', 'location'],
  Organization: ['name', 'url'],
  LocalBusiness: ['name', 'address', 'telephone'],
  FAQPage: ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
  VideoObject: ['name', 'description', 'thumbnailUrl', 'uploadDate'],
  Person: ['name'],
  HowTo: ['name', 'step'],
  Review: ['itemReviewed', 'reviewRating', 'author'],
  Course: ['name', 'description', 'provider'],
  JobPosting: ['title', 'description', 'datePosted', 'hiringOrganization'],
  SoftwareApplication: ['name', 'applicationCategory', 'operatingSystem'],
};

const RECOMMENDED_FIELDS: Record<string, string[]> = {
  Article: ['dateModified', 'publisher', 'mainEntityOfPage'],
  NewsArticle: ['dateModified', 'publisher', 'mainEntityOfPage'],
  BlogPosting: ['dateModified', 'publisher', 'mainEntityOfPage'],
  Product: ['description', 'brand', 'sku', 'aggregateRating', 'review'],
  Organization: ['logo', 'sameAs', 'contactPoint'],
  WebSite: ['potentialAction'],
};

const URL_FIELDS = new Set(['image', 'url', 'sameAs', 'logo', 'thumbnailUrl']);
const DATE_FIELDS = new Set(['datePublished', 'dateModified', 'uploadDate', 'startDate', 'endDate', 'datePosted']);

interface ParsedBlock {
  index: number;
  raw: string;
  data?: unknown;
  parseError?: string;
}

export function runJsonLdChecks(page: PageContext): CheckResult[] {
  const $ = cheerio.load(page.html);
  const blocks: ParsedBlock[] = [];

  $('script[type="application/ld+json"]').each((i, el) => {
    const raw = $(el).text();
    const block: ParsedBlock = { index: i, raw };
    try {
      block.data = JSON.parse(raw);
    } catch (err) {
      block.parseError = err instanceof Error ? err.message : String(err);
    }
    blocks.push(block);
  });

  const results: CheckResult[] = [];

  if (blocks.length === 0) {
    results.push({
      id: 'jsonld.missing',
      category: 'jsonld',
      severity: 'warning',
      title: 'No JSON-LD structured data found',
      whyItMatters:
        'JSON-LD is how you qualify for rich results (stars, FAQs, prices, breadcrumbs) and is the strongest signal for AI search citations. Pages without it leave significant SERP real estate on the table.',
      fix: {
        summary: 'Add at least a WebSite/Organization/BreadcrumbList JSON-LD block.',
        snippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Your site name",
  "url": "${page.url}"
}
</script>`,
        docLink: 'https://developers.google.com/search/docs/appearance/structured-data',
      },
      priority: 75,
      ruleVersion: RULE_VERSION,
    });
    return results;
  }

  // Syntax errors first
  const parseErrors = blocks.filter((b) => b.parseError);
  if (parseErrors.length > 0) {
    for (const err of parseErrors) {
      results.push({
        id: 'jsonld.syntaxError',
        category: 'jsonld',
        severity: 'error',
        title: `JSON-LD block #${err.index + 1} has a syntax error`,
        evidence: { error: err.parseError, snippet: err.raw.slice(0, 200) },
        whyItMatters:
          '78% of structured-data errors are syntax (trailing comma, unclosed bracket, smart quotes). A single typo invalidates the entire block — Google silently ignores it.',
        fix: {
          summary: 'Run the block through jsonlint.com and fix the parse error. Avoid smart quotes (use straight " ).',
          docLink: 'https://json-ld.org/playground/',
        },
        priority: 92,
        ruleVersion: RULE_VERSION,
      });
    }
  }

  // Flatten — JSON-LD may be an array or use @graph
  const flatItems = blocks
    .filter((b) => b.data && !b.parseError)
    .flatMap((b) => flatten(b.data));

  if (flatItems.length === 0 && parseErrors.length === blocks.length) {
    return results;
  }

  results.push({
    id: 'jsonld.found',
    category: 'jsonld',
    severity: 'pass',
    title: `Found ${flatItems.length} JSON-LD item(s) across ${blocks.length - parseErrors.length} block(s)`,
    evidence: { types: flatItems.map((i) => i['@type']).filter(Boolean) },
    whyItMatters: 'Structured data is present — checking quality next.',
    fix: { summary: 'No action needed at this step.', docLink: 'https://developers.google.com/search/docs/appearance/structured-data' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  });

  // Per-item validation
  for (const item of flatItems) {
    const type = normalizeType(item['@type']);
    if (!type) {
      results.push({
        id: 'jsonld.typeMissing',
        category: 'jsonld',
        severity: 'error',
        title: 'JSON-LD item missing @type',
        evidence: { item },
        whyItMatters: 'Without @type, Google has no way to interpret the data — the block is effectively ignored.',
        fix: {
          summary: 'Add an @type field naming a schema.org type.',
          snippet: '"@type": "Article"',
          docLink: 'https://schema.org/docs/full.html',
        },
        priority: 85,
        ruleVersion: RULE_VERSION,
      });
      continue;
    }

    // Required fields
    const required = REQUIRED_FIELDS[type];
    if (required) {
      const missing = required.filter((f) => !hasField(item, f));
      if (missing.length > 0) {
        results.push({
          id: `jsonld.${type}.missingRequired`,
          category: 'jsonld',
          severity: 'error',
          title: `${type} JSON-LD is missing required field(s): ${missing.join(', ')}`,
          evidence: { type, missing, item },
          whyItMatters: `Google requires these fields to render ${type} rich results. Without them the markup is parsed but ineligible for enhanced SERP features.`,
          fix: {
            summary: `Add ${missing.join(', ')} to the ${type} block.`,
            docLink: `https://developers.google.com/search/docs/appearance/structured-data/${type.toLowerCase()}`,
          },
          priority: 88,
          ruleVersion: RULE_VERSION,
        });
      }
    }

    // Recommended fields
    const recommended = RECOMMENDED_FIELDS[type];
    if (recommended) {
      const missing = recommended.filter((f) => !hasField(item, f));
      if (missing.length > 0) {
        results.push({
          id: `jsonld.${type}.missingRecommended`,
          category: 'jsonld',
          severity: 'warning',
          title: `${type} is missing recommended field(s): ${missing.join(', ')}`,
          evidence: { type, missing },
          whyItMatters:
            'Recommended fields aren\'t required for eligibility but materially improve rich-result presentation and AI citation quality.',
          fix: { summary: `Consider adding: ${missing.join(', ')}.`, docLink: `https://developers.google.com/search/docs/appearance/structured-data/${type.toLowerCase()}` },
          priority: 40,
          ruleVersion: RULE_VERSION,
        });
      }
    }

    // Date format checks
    for (const field of DATE_FIELDS) {
      const value = item[field];
      if (typeof value === 'string' && !isIso8601(value)) {
        results.push({
          id: `jsonld.${type}.invalidDate`,
          category: 'jsonld',
          severity: 'error',
          title: `${type}.${field} is not in ISO 8601 format`,
          evidence: { field, value },
          whyItMatters:
            'Google requires ISO 8601 dates (YYYY-MM-DD or full RFC 3339). Other formats fail validation silently.',
          fix: {
            summary: 'Convert to ISO 8601.',
            snippet: `"${field}": "${new Date(value).toISOString().slice(0, 10)}"`,
            docLink: 'https://en.wikipedia.org/wiki/ISO_8601',
          },
          priority: 70,
          ruleVersion: RULE_VERSION,
        });
      }
    }

    // URL absoluteness
    for (const field of URL_FIELDS) {
      const value = item[field];
      const urls = Array.isArray(value) ? value : value !== undefined ? [value] : [];
      for (const v of urls) {
        if (typeof v === 'string' && !isAbsoluteUrl(v)) {
          results.push({
            id: `jsonld.${type}.relativeUrl`,
            category: 'jsonld',
            severity: 'error',
            title: `${type}.${field} contains a relative URL: "${v}"`,
            evidence: { field, value: v },
            whyItMatters:
              'Google requires absolute URLs in structured data. Relative URLs are treated as invalid and the field is ignored.',
            fix: { summary: 'Use absolute URLs (including protocol and host).', docLink: 'https://developers.google.com/search/docs/appearance/structured-data' },
            priority: 75,
            ruleVersion: RULE_VERSION,
          });
        }
      }
    }
  }

  results.push(...checkQAPageMisuse(flatItems, page, $));

  return results;
}

// ---------- helpers ----------

interface JsonObj {
  '@type'?: string | string[];
  '@graph'?: unknown[];
  [k: string]: unknown;
}

function flatten(data: unknown): JsonObj[] {
  if (Array.isArray(data)) return data.flatMap(flatten);
  if (!data || typeof data !== 'object') return [];
  const obj = data as JsonObj;
  if (Array.isArray(obj['@graph'])) {
    return obj['@graph'].flatMap(flatten);
  }
  return [obj];
}

function normalizeType(t: unknown): string | null {
  if (typeof t === 'string') return t;
  if (Array.isArray(t) && typeof t[0] === 'string') return t[0];
  return null;
}

function hasField(obj: JsonObj, field: string): boolean {
  const v = obj[field];
  if (v === undefined || v === null) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

function isIso8601(s: string): boolean {
  // Permissive ISO 8601: YYYY-MM-DD, with optional T...Z time
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s);
}

function isAbsoluteUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * QAPage misuse — an explicit, quotable Google structured-data violation.
 *
 * Google deprecated FAQ rich results entirely on 2026-05-07, and a lot of
 * recovery advice since then has been "just switch FAQPage to QAPage". That is
 * a spam violation. Google's QAPage documentation says verbatim: "Don't use
 * QAPage markup for FAQ pages or pages where there are multiple questions per
 * page", and explicitly disqualifies self-authored FAQs, blog posts, essays and
 * how-to guides. QAPage is only for forum-style pages with ONE question that
 * users can submit alternative answers to.
 *
 * Evidence strength: google-confirmed. This is quoted policy, not inference.
 */
function checkQAPageMisuse(items: JsonObj[], page: PageContext, $: cheerio.CheerioAPI): CheckResult[] {
  const qaPages = items.filter((it) => normalizeType(it['@type']) === 'QAPage');
  if (qaPages.length === 0) return [];

  const reasons: string[] = [];

  // Multiple questions on one page — the single most common misuse.
  const questionCount = items.filter((it) => normalizeType(it['@type']) === 'Question').length;
  if (questionCount > 1) {
    reasons.push(`${questionCount} Question entities on one page (QAPage allows exactly one)`);
  }

  // Article-shaped page — blog posts and guides are explicitly disqualified.
  const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle', 'TechArticle']);
  if (items.some((it) => ARTICLE_TYPES.has(normalizeType(it['@type']) ?? ''))) {
    reasons.push('the page also declares Article/BlogPosting schema, which Google disqualifies from QAPage');
  }

  // No way for users to submit an answer — i.e. it is really an FAQ.
  const hasSuggested = qaPages.some((qp) => {
    const me = qp.mainEntity as JsonObj | undefined;
    return Boolean(me && me.suggestedAnswer);
  });
  const hasForm = $('form').length > 0;
  if (!hasSuggested && !hasForm) {
    reasons.push('no user-submitted answers and no answer submission form — this is a self-authored FAQ, not a Q&A page');
  }

  if (reasons.length === 0) return [];

  return [
    {
      id: 'jsonld.qaPage.misuse',
      category: 'jsonld',
      severity: 'error',
      title: 'QAPage schema used on a page that does not qualify',
      evidence: { reasons, questionCount, url: page.finalUrl ?? page.url },
      whyItMatters:
        'Google\'s QAPage documentation states: "Don\'t use QAPage markup for FAQ pages or pages where there are ' +
        'multiple questions per page." QAPage is only for forum-style pages with a single question that users can ' +
        'answer. Misapplying it is a structured-data spam violation that can cost you rich-result eligibility ' +
        'site-wide, not just on this page. This pattern spread after Google removed FAQ rich results in May 2026 ' +
        'and people swapped FAQPage for QAPage as a workaround.',
      fix: {
        summary:
          'Remove the QAPage markup. If this is a self-authored FAQ, there is no supported replacement — FAQ rich results were retired in May 2026 — so keep the questions as visible content and drop the markup.',
        snippet: `<!-- Remove QAPage from self-authored FAQ pages. -->
<!-- QAPage is ONLY valid for forum-style pages: ONE question, user-submitted answers. -->
<!-- For a normal FAQ section, no structured data is needed. Keep the Q&A as -->
<!-- real headings and paragraphs so search engines and AI crawlers can read it: -->
<h2>How long does an SEO audit take?</h2>
<p>Most single-page audits finish in under ten seconds...</p>`,
        steps: [
          'Delete the QAPage JSON-LD block from this page.',
          'Keep every question and answer as visible HTML — a question as the heading, the answer in the paragraph directly beneath it.',
          'Do not substitute FAQPage: its rich results were deprecated on 2026-05-07, so it gains you nothing.',
          'Reserve QAPage for genuine forum or community pages with one question and user-submitted answers.',
        ],
        docLink: 'https://developers.google.com/search/docs/appearance/structured-data/qapage',
      },
      priority: 80,
      ruleVersion: RULE_VERSION,
    },
  ];
}
