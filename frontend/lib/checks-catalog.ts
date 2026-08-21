/**
 * Static catalog of every check the auditor can produce.
 * Used to render per-check explainer pages (/check/[id]) and the
 * sitemap. Keeps these pages indexable even before any audit has run.
 */

export interface CheckCatalogEntry {
  id: string;
  category: string;
  title: string;
  summary: string;
  whyItMatters: string;
  exampleFix?: string;
  docLink: string;
}

export const CHECKS_CATALOG: CheckCatalogEntry[] = [
  {
    id: 'geo.jsRequired.blocking',
    category: 'geo',
    title: 'Page content requires JavaScript to appear',
    summary:
      'The raw HTML contains almost no text — the content only exists after the JavaScript bundle runs. AI crawlers do not run JavaScript, so they receive an empty page.',
    whyItMatters:
      'GPTBot, ClaudeBot, PerplexityBot and OAI-SearchBot do not execute JavaScript. If your content only appears after hydration, those engines see nothing and cannot cite you, no matter how good the writing is. Googlebot does render, but only on a slower second pass, so indexing is delayed too. This is the single highest-impact AI-visibility problem a page can have — and unlike most GEO advice, it is mechanically verifiable rather than speculative: we are reporting exactly what a non-rendering client receives.',
    exampleFix:
      '// Next.js: fetch on the server, not in a client useEffect\nexport default async function Page() {\n  const data = await getData();       // runs server-side\n  return <article>{data.body}</article>;  // ships in the HTML\n}',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
  },
  {
    id: 'jsonld.qaPage.misuse',
    category: 'jsonld',
    title: 'QAPage schema used on a page that does not qualify',
    summary:
      'QAPage markup is only valid for forum-style pages with a single question that users can submit answers to. Using it on a self-authored FAQ, a blog post, or any page with multiple questions is a structured-data spam violation.',
    whyItMatters:
      'Google removed FAQ rich results entirely on 7 May 2026, and a lot of recovery advice since then has been "just switch FAQPage to QAPage". That advice is wrong. Google\'s documentation states verbatim: "Don\'t use QAPage markup for FAQ pages or pages where there are multiple questions per page." Misapplying it is a spam violation that can cost rich-result eligibility across your whole site, not just this page. There is no supported replacement for FAQ rich results — the right move is to keep the questions as visible content and drop the markup.',
    exampleFix:
      '<!-- Remove QAPage from self-authored FAQs. Keep the Q&A as real HTML: -->\n<h2>How long does an SEO audit take?</h2>\n<p>Most single-page audits finish in under ten seconds.</p>',
    docLink: 'https://developers.google.com/search/docs/appearance/structured-data/qapage',
  },
  {
    id: 'metadata.title.missing',
    category: 'metadata',
    title: 'Page is missing a <title> tag',
    summary: 'Every page needs a unique, descriptive <title>. It is the strongest on-page ranking signal and the headline shown in search results.',
    whyItMatters: 'Without a <title>, Google fabricates one — usually badly. Click-through rate drops, and you lose control of how your page appears in search.',
    exampleFix: '<title>Your unique, descriptive page title (50–60 chars)</title>',
    docLink: 'https://developers.google.com/search/docs/appearance/title-link',
  },
  {
    id: 'metadata.description.missing',
    category: 'metadata',
    title: 'Missing meta description',
    summary: 'A 140–160 character meta description summarises the page for search engines and click-through.',
    whyItMatters: 'Google pulls random text from the page when no description is set — often missing your value prop and CTA.',
    exampleFix: '<meta name="description" content="One to two sentences (140–160 chars) summarizing this page." />',
    docLink: 'https://developers.google.com/search/docs/appearance/snippet',
  },
  {
    id: 'metadata.canonical.missing',
    category: 'metadata',
    title: 'No canonical URL declared',
    summary: 'The canonical tag tells Google which URL to consolidate ranking signals to when duplicates exist.',
    whyItMatters: 'Without canonical, Google guesses — and may pick HTTP over HTTPS, or a URL with tracking params.',
    exampleFix: '<link rel="canonical" href="https://example.com/page" />',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
  },
  {
    id: 'metadata.og.missing',
    category: 'metadata',
    title: 'Open Graph tags missing',
    summary: 'OG tags control how your page appears when shared on Slack, LinkedIn, Facebook, WhatsApp, X, etc.',
    whyItMatters: 'Without OG tags, social previews look bare — no image, no description, just a URL. Click-through plummets.',
    docLink: 'https://ogp.me/',
  },
  {
    id: 'jsonld.missing',
    category: 'jsonld',
    title: 'No JSON-LD structured data',
    summary: 'JSON-LD is how you qualify for SERP rich results (stars, FAQs, prices, breadcrumbs) and AI search citations.',
    whyItMatters: 'Pages without structured data leave significant SERP real estate and AI-citation opportunity on the table.',
    docLink: 'https://developers.google.com/search/docs/appearance/structured-data',
  },
  {
    id: 'jsonld.syntaxError',
    category: 'jsonld',
    title: 'JSON-LD syntax error',
    summary: '78% of structured-data errors are syntax (missing comma, smart quotes, unclosed bracket). A single typo invalidates the entire block.',
    whyItMatters: 'Google silently ignores malformed JSON-LD — you get zero benefit from the markup.',
    docLink: 'https://json-ld.org/playground/',
  },
  {
    id: 'content.h1.missing',
    category: 'content',
    title: 'Page has no H1',
    summary: 'Every page should have exactly one H1 that names its primary topic.',
    whyItMatters: 'Without H1, Google falls back to the title, which is less prominent. Screen-reader users also rely on H1 to orient.',
    docLink: 'https://developers.google.com/search/docs/appearance/structured-data',
  },
  {
    id: 'content.images.missingAlt',
    category: 'content',
    title: 'Images missing alt text',
    summary: 'Alt text is required for accessibility (WCAG) and image SEO. Use alt="" for purely decorative images.',
    whyItMatters: 'Missing alt text breaks screen-reader navigation and removes images from Google Images SEO.',
    docLink: 'https://www.w3.org/WAI/tutorials/images/',
  },
  {
    id: 'security.https.missing',
    category: 'security',
    title: 'Page is not served over HTTPS',
    summary: 'HTTPS is mandatory in 2026 — Chrome marks HTTP pages "Not Secure" and Google uses HTTPS as a ranking signal.',
    whyItMatters: 'HTTP destroys user trust, leaks credentials, and tanks rankings.',
    docLink: 'https://letsencrypt.org/getting-started/',
  },
  {
    id: 'security.strict-transport-security.missing',
    category: 'security',
    title: 'Missing HSTS header',
    summary: 'HSTS forces browsers to upgrade HTTP requests to HTTPS automatically, preventing downgrade attacks.',
    whyItMatters: 'Without HSTS, a man-in-the-middle attacker can strip TLS from the very first request.',
    exampleFix: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
  },
  {
    id: 'crawl.robots.missing',
    category: 'crawl',
    title: 'No robots.txt found',
    summary: 'robots.txt is the standard way to tell crawlers which paths to skip and where to find sitemaps.',
    whyItMatters: 'Without robots.txt, you can\'t reference your sitemap or block crawlers from /admin, /api, etc.',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
  },
  {
    id: 'crawl.sitemap.missing',
    category: 'crawl',
    title: 'No sitemap.xml',
    summary: 'Sitemaps give search engines a definitive URL list with lastmod hints.',
    whyItMatters: 'Without a sitemap, large or deeply-nested sites suffer from slow / partial indexing.',
    docLink: 'https://www.sitemaps.org/protocol.html',
  },
  {
    id: 'geo.llmsTxt.missing',
    category: 'geo',
    title: 'No /llms.txt at site root',
    summary: 'llms.txt is the emerging convention (2024-26) for telling AI crawlers what your site is about and what pages matter.',
    whyItMatters: 'Early adopters get a citation advantage in ChatGPT, Claude, and Perplexity.',
    docLink: 'https://llmstxt.org/',
  },
  {
    id: 'geo.aibots.blocked',
    category: 'geo',
    title: 'AI crawlers blocked',
    summary: 'GPTBot, ClaudeBot, PerplexityBot, etc. need access to your content to cite you in AI search answers.',
    whyItMatters: 'If you want AI citations, blocking these bots removes you from their answers entirely.',
    docLink: 'https://platform.openai.com/docs/gptbot',
  },
  {
    id: 'geo.directAnswer.missing',
    category: 'geo',
    title: 'No direct-answer paragraph in opening',
    summary: 'AI engines cite pages that state the answer plainly in the first paragraph. Pages that "set up" the topic before answering get skipped.',
    whyItMatters: 'A direct definitional sentence in the first 200 words is the #1 GEO ranking factor across recent studies.',
    docLink: 'https://en.wikipedia.org/wiki/Featured_snippet',
  },
  {
    id: 'geo.islandTest.weak',
    category: 'geo',
    title: 'Island Test failure — paragraphs lack standalone context',
    summary: 'AI engines lift individual paragraphs as citations. Paragraphs relying on "this", "it", "as mentioned" are less likely to be extracted.',
    whyItMatters: 'Each paragraph that can stand alone is one more potential AI citation.',
    docLink: 'https://www.semrush.com/blog/geo-generative-engine-optimization/',
  },
  {
    id: 'geo.eeat.author.missing',
    category: 'geo',
    title: 'No author signals or Person schema',
    summary: 'Google\'s E-E-A-T framework and AI engines both prefer cited content with clear authorship.',
    whyItMatters: 'Anonymous content gets cited less and ranks lower for YMYL (your money, your life) queries.',
    docLink: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },
];

export function findCheck(id: string): CheckCatalogEntry | null {
  return CHECKS_CATALOG.find((c) => c.id === id) ?? null;
}
