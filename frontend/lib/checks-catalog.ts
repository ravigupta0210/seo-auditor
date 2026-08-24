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
    id: 'metadata.viewport.missing',
    category: 'metadata',
    title: 'No viewport meta tag',
    summary:
      'Without a viewport tag, mobile browsers render the page at desktop width and scale it down — unreadable, and penalised under mobile-first indexing.',
    whyItMatters:
      'Google has used mobile-first indexing since 2019. A missing viewport causes desktop-width rendering on mobile, hurting Core Web Vitals and rankings.',
    exampleFix:
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
  },
  {
    id: 'metadata.robotsMeta.noindex',
    category: 'metadata',
    title: 'Page is set to noindex',
    summary:
      'A noindex directive removes this page from search results entirely. Usually intentional on staging — frequently shipped to production by accident.',
    whyItMatters:
      'noindex completely removes the page from Google results. Confirm this is intentional — staging environments often ship noindex into production by accident.',
    exampleFix:
      '<!-- Remove this to allow indexing -->\\n<meta name="robots" content="noindex" />\\n\\n<!-- Replace with -->\\n<meta name="robots" content="index, follow" />',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
  },
  {
    id: 'metadata.lang.missing',
    category: 'metadata',
    title: 'No lang attribute on <html>',
    summary:
      'The lang attribute tells search engines which regional results to serve, and screen readers which pronunciation to use.',
    whyItMatters:
      'Search engines use the lang attribute to serve the right regional results; screen readers use it to pick pronunciation. Both downgrade without it.',
    exampleFix:
      '<html lang="en">',
    docLink: 'https://www.w3.org/International/questions/qa-html-language-declarations',
  },
  {
    id: 'metadata.favicon.missing',
    category: 'metadata',
    title: 'No favicon declared',
    summary:
      'Google shows favicons beside organic results on mobile. Without one you get a generic globe and lose brand recognition in the SERP.',
    whyItMatters:
      'Google now shows favicons next to organic results on mobile. A missing favicon means a generic globe icon and lower brand recognition.',
    exampleFix:
      '<link rel="icon" href="/favicon.ico" sizes="any" />\\n<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    docLink: 'https://developers.google.com/search/docs/appearance/favicon-in-search',
  },
  {
    id: 'metadata.canonical.invalid',
    category: 'metadata',
    title: 'Canonical URL is invalid',
    summary:
      'A malformed canonical URL can make Google discard the canonical hint entirely, leaving duplicate resolution to guesswork.',
    whyItMatters:
      'Google may ignore the entire canonical hint when the URL is invalid.',
    exampleFix:
      '<link rel="canonical" href="https://example.com/page" />',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
  },
  {
    id: 'metadata.canonical.crossDomain',
    category: 'metadata',
    title: 'Canonical points to another domain',
    summary:
      'A cross-domain canonical tells Google to rank a different site instead of this page. Occasionally deliberate — usually a syndication mistake.',
    whyItMatters:
      'A cross-domain canonical effectively tells Google to ignore this page in favor of another site — confirm this is intentional.',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
  },
  {
    id: 'metadata.charset.notUtf8',
    category: 'metadata',
    title: 'Charset is not UTF-8',
    summary:
      'Non-UTF-8 encodings corrupt user-submitted text, break copy-paste, and mangle emoji and non-Latin scripts.',
    whyItMatters:
      'Non-UTF-8 encodings can corrupt user-submitted content and break copy-paste.',
    exampleFix:
      '<meta charset="utf-8" />',
    docLink: 'https://html.spec.whatwg.org/multipage/semantics.html#charset',
  },
  {
    id: 'metadata.charset.lateDeclaration',
    category: 'metadata',
    title: 'Charset declared too late in <head>',
    summary:
      'The HTML spec requires the charset within the first 1024 bytes. Declared later, browsers may ignore it and guess instead.',
    whyItMatters:
      'The HTML spec requires the charset declaration to appear within the first 1024 bytes; later declarations may be ignored.',
    exampleFix:
      '<head>\\n  <meta charset="utf-8" />  <!-- must be first -->\\n  <title>…</title>\\n</head>',
    docLink: 'https://html.spec.whatwg.org/multipage/semantics.html#charset',
  },
  {
    id: 'content.h1.multiple',
    category: 'content',
    title: 'More than one H1 on the page',
    summary:
      'Multiple H1s split the topical signal and leave crawlers guessing which one describes the page.',
    whyItMatters:
      'Multiple H1s split topical relevance signals. While HTML5 technically allows multiple H1s inside <section>, in practice Google penalizes the ambiguity.',
    docLink: 'https://developers.google.com/search/docs/appearance/structured-data',
  },
  {
    id: 'content.images.poorAlt',
    category: 'content',
    title: 'Images have unhelpful alt text',
    summary:
      'Alt text like "image1.jpg" or "photo" describes nothing — it fails both screen-reader users and image search.',
    whyItMatters:
      'Alt text like "image1.jpg" or "photo" tells search engines and screen readers nothing about content.',
    exampleFix:
      '<!-- Bad -->\\n<img src="/chart.png" alt="chart.png" />\\n\\n<!-- Good -->\\n<img src="/chart.png" alt="Organic traffic growth from 1k to 40k monthly visits over 12 months" />',
    docLink: 'https://www.w3.org/WAI/tutorials/images/',
  },
  {
    id: 'crawl.duplicateTitles',
    category: 'crawl',
    title: 'Duplicate title tags across pages',
    summary:
      'When several pages share a title, Google picks one to surface for a query — and you do not get to choose which.',
    whyItMatters:
      'Duplicate titles confuse Google about which URL to surface for a query — only one wins, and you can\'t pick which.',
    docLink: 'https://developers.google.com/search/docs/appearance/title-link',
  },
  {
    id: 'crawl.duplicateDescriptions',
    category: 'crawl',
    title: 'Duplicate meta descriptions across pages',
    summary:
      'Identical descriptions waste the chance to differentiate each page in the SERP, and Google often rewrites them anyway.',
    whyItMatters:
      'Duplicate descriptions waste an opportunity to differentiate SERP snippets.',
    docLink: 'https://developers.google.com/search/docs/appearance/snippet',
  },
  {
    id: 'crawl.robots.disallowAll',
    category: 'crawl',
    title: 'robots.txt blocks all crawlers',
    summary:
      'A blanket Disallow: / removes the entire site from search. Correct on staging, catastrophic on production.',
    whyItMatters:
      'User-agent: * with Disallow: / blocks Google completely. If this is a staging environment that\'s fine; on production it deletes you from search.',
    exampleFix:
      '# Blocks everything — remove on production\\nUser-agent: *\\nDisallow: /\\n\\n# Allow crawling instead\\nUser-agent: *\\nAllow: /',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
  },
  {
    id: 'crawl.robots.syntaxErrors',
    category: 'crawl',
    title: 'robots.txt has syntax errors',
    summary:
      'Malformed directives are handled inconsistently between crawlers — some ignore the line, others misread the whole file.',
    whyItMatters:
      'Malformed lines may be ignored or, worse, change crawler behavior unpredictably across user agents.',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
  },
  {
    id: 'crawl.sitemap.stale',
    category: 'crawl',
    title: 'Sitemap lastmod dates are stale',
    summary:
      'Old lastmod values tell Google there is nothing new to fetch. Fresh content behind a stale date gets skipped.',
    whyItMatters:
      'Stale lastmod signals tell Google there\'s no point re-crawling — but fresh content with old lastmod gets ignored. Either update lastmod when content changes or remove it.',
    docLink: 'https://www.sitemaps.org/protocol.html#lastmod',
  },
  {
    id: 'jsonld.typeMissing',
    category: 'jsonld',
    title: 'JSON-LD block has no @type',
    summary:
      'Without @type there is nothing to interpret — the structured data block is silently discarded.',
    whyItMatters:
      'Without @type, Google has no way to interpret the data — the block is effectively ignored.',
    exampleFix:
      '{\\n  "@context": "https://schema.org",\\n  "@type": "Article",\\n  "headline": "…"\\n}',
    docLink: 'https://schema.org/docs/full.html',
  },
  {
    id: 'geo.aibots.cloaking',
    category: 'geo',
    title: 'Different content served to AI crawlers',
    summary:
      'The page returns different content to GPTBot or PerplexityBot than to a normal browser. Usually a CDN or firewall rule, not a deliberate choice.',
    whyItMatters:
      'Different content per User-Agent is "cloaking" — Google penalizes it for regular search and AI engines may distrust your citations.',
    docLink: 'https://developers.google.com/search/docs/essentials/spam-policies#cloaking',
  },
  {
    id: 'geo.jsRequired.partial',
    category: 'geo',
    title: 'Most content requires JavaScript',
    summary:
      'Only a fraction of this page exists in the raw HTML. AI crawlers do not execute JavaScript, so they see very little of it.',
    whyItMatters:
      'Most of this page appears to be rendered client-side. Crawlers that do not run JavaScript — which includes every major AI answer engine — see only a fraction of the content, so there is very little for them to quote.',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
  },
  {
    id: 'geo.llmsTxt.malformed',
    category: 'geo',
    title: 'llms.txt does not follow the spec',
    summary:
      'The spec expects an H1 site name and a blockquote summary. Note that Google states llms.txt neither helps nor harms visibility — treat this as hygiene, not a ranking lever.',
    whyItMatters:
      'The spec asks for an H1 site name and a blockquote summary. Conformant files are more reliably parsed by AI consumers.',
    exampleFix:
      '# Your Site Name\\n\\n> One-sentence description of what this site is.\\n\\n## Docs\\n- [Getting started](https://example.com/docs)',
    docLink: 'https://llmstxt.org/',
  },
  {
    id: 'performance.score.poor',
    category: 'performance',
    title: 'Poor performance score',
    summary:
      'A Lighthouse performance score under 50 means severe Core Web Vitals problems — most mobile users leave before the page renders.',
    whyItMatters:
      'Performance scores below 50 indicate severe Core Web Vitals issues. Mobile users will abandon before the page renders.',
    docLink: 'https://web.dev/articles/lcp',
  },
  {
    id: 'metadata.title.tooShort',
    category: 'metadata',
    title: 'Title tag is too short',
    summary:
      'A <title> under ~50 characters wastes SERP real estate and rarely captures the keywords people actually search.',
    whyItMatters:
      'Very short titles waste valuable SERP real estate and rarely capture intent-bearing keywords.',
    exampleFix:
      '<title>Example Domain — [Add descriptive modifier] | YourBrand</title>',
    docLink: 'https://developers.google.com/search/docs/appearance/title-link',
  },
  {
    id: 'metadata.title.tooLong',
    category: 'metadata',
    title: 'Title tag is too long',
    summary:
      'Google truncates titles around 60 characters on mobile. Anything past the cutoff is invisible to searchers.',
    whyItMatters:
      'Google truncates titles around 580px (≈60 chars) on mobile; words past the cutoff are hidden from searchers.',
    docLink: 'https://developers.google.com/search/docs/appearance/title-link',
  },
  {
    id: 'metadata.description.tooShort',
    category: 'metadata',
    title: 'Meta description is too short',
    summary:
      'A description under ~140 characters leaves SERP space empty, and Google may pad it with random page text.',
    whyItMatters:
      'Short descriptions leave SERP real estate empty; Google may pad them with random page text.',
    docLink: 'https://developers.google.com/search/docs/appearance/snippet',
  },
  {
    id: 'metadata.description.tooLong',
    category: 'metadata',
    title: 'Meta description is too long',
    summary:
      'Google truncates descriptions after ~160 characters — including any call-to-action you put at the end.',
    whyItMatters:
      'Anything past ~160 chars is hidden with an ellipsis on the SERP, including any CTA at the end.',
    docLink: 'https://developers.google.com/search/docs/appearance/snippet',
  },
  {
    id: 'metadata.og.incomplete',
    category: 'metadata',
    title: 'Open Graph tags are incomplete',
    summary:
      'Partial Open Graph data produces inconsistent link previews: some platforms scrape it, others fall back to the title tag.',
    whyItMatters:
      'Partial OG data leads to inconsistent previews across platforms — some scrape, others fall back to <title>/<meta description>.',
    docLink: 'https://ogp.me/',
  },
  {
    id: 'metadata.charset.missing',
    category: 'metadata',
    title: 'No charset declared in <head>',
    summary:
      'Without an explicit charset the browser guesses the encoding, which garbles non-ASCII text and emoji.',
    whyItMatters:
      'Browsers must guess the encoding, risking mojibake for non-ASCII content (Hindi, accented characters, emojis).',
    exampleFix:
      '<meta charset="utf-8" />',
    docLink: 'https://html.spec.whatwg.org/multipage/semantics.html#charset',
  },
  {
    id: 'metadata.twitter.missing',
    category: 'metadata',
    title: 'No Twitter Card meta tag',
    summary:
      'X falls back to Open Graph, but declaring twitter:card explicitly gives you control over the preview layout.',
    whyItMatters:
      'X (Twitter) falls back to OG tags, but defining twitter:card explicitly gives you control over the preview layout (summary vs. summary_large_image).',
    exampleFix:
      '<meta name="twitter:card" content="summary_large_image" />',
    docLink: 'https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards',
  },
  {
    id: 'content.anchorText.generic',
    category: 'content',
    title: 'Links use generic anchor text',
    summary:
      'Anchors like "click here" and "learn more" pass no topical signal and are useless to screen-reader users navigating by link.',
    whyItMatters:
      'Generic anchor text passes weak topical signals and is bad for screen-reader users navigating by links.',
    exampleFix:
      '<!-- Bad -->\n<a href="/seo-guide">click here</a>\n\n<!-- Good -->\n<a href="/seo-guide">comprehensive SEO guide for 2026</a>',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable',
  },
  {
    id: 'content.h1Title.mismatch',
    category: 'content',
    title: 'H1 and title tag don\'t match',
    summary:
      'When the H1 and <title> share few words, Google may rewrite your SERP title — often worse than your own.',
    whyItMatters:
      'When H1 and title diverge, Google may rewrite your SERP title — sometimes badly. Consistent topical signals across <title>, H1, and URL slug strengthen rankings.',
    docLink: 'https://developers.google.com/search/docs/appearance/title-link',
  },
  {
    id: 'content.heading.skipped',
    category: 'content',
    title: 'Heading hierarchy skips levels',
    summary:
      'Jumping from H2 straight to H4 breaks the document outline for screen readers and muddies content hierarchy for crawlers.',
    whyItMatters:
      'Skipping heading levels (e.g., H2 → H4) breaks semantic structure for screen readers and confuses search engines about content hierarchy.',
    docLink: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
  },
  {
    id: 'content.internalLinks.none',
    category: 'content',
    title: 'Page has no internal links',
    summary:
      'Internal links distribute ranking signals and are how crawlers discover related pages. Orphan pages consistently underperform.',
    whyItMatters:
      'Internal links distribute PageRank and help users (and Googlebot) discover related content. Orphan-like pages tend to underperform.',
    docLink: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable',
  },
  {
    id: 'content.wordCount.thin',
    category: 'content',
    title: 'Thin content — too few words',
    summary:
      'Pages with very little body text rarely rank, and Google\'s helpful-content guidance treats them as low value.',
    whyItMatters:
      'Pages with very little body content rarely rank — Google\'s helpful-content guidelines flag thin pages as low-value.',
    docLink: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },
  {
    id: 'crawl.hreflang.noXDefault',
    category: 'crawl',
    title: 'hreflang is missing x-default',
    summary:
      'x-default tells Google what to serve when no language matches. Without it, unmatched regions land on the wrong locale.',
    whyItMatters:
      'x-default tells Google which page to serve when no language matches. Without it, users from unmatched regions may land on the wrong locale.',
    exampleFix:
      '<link rel="alternate" hreflang="x-default" href="https://example.com/" />',
    docLink: 'https://developers.google.com/search/docs/specialized/international/localized-versions#xdefault',
  },
  {
    id: 'crawl.hreflang.none',
    category: 'crawl',
    title: 'No hreflang annotations',
    summary:
      'Only relevant for multi-language or multi-region sites. Single-locale sites can ignore this safely.',
    whyItMatters:
      'Only required for multi-language/multi-region sites. If you serve a single locale, ignore this.',
    docLink: 'https://developers.google.com/search/docs/specialized/international/localized-versions',
  },
  {
    id: 'crawl.robots.noSitemap',
    category: 'crawl',
    title: 'robots.txt doesn\'t reference a sitemap',
    summary:
      'The Sitemap directive is how every search engine — not just Google — discovers your URL inventory automatically.',
    whyItMatters:
      'The Sitemap directive helps every search engine (not just Google) find your URL inventory automatically.',
    exampleFix:
      'Sitemap: https://your-domain.com/sitemap.xml',
    docLink: 'https://www.sitemaps.org/protocol.html#submit_robots',
  },
  {
    id: 'geo.eeat.citations.weak',
    category: 'geo',
    title: 'No outbound citations to authoritative sources',
    summary:
      'AI engines favour content that cites primary sources. Linking to .gov, .edu and peer-reviewed pages signals research-backed writing.',
    whyItMatters:
      'LLMs trust content that cites primary sources. Linking to .gov/.edu/peer-reviewed sources signals research-backed content.',
    exampleFix:
      '<!-- Link the claim to its original source -->\n<p>Zero-click searches reached\n  <a href="https://www.example-study.gov/report">68% of Google queries in 2026</a>.\n</p>',
    docLink: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },
  {
    id: 'geo.extractability.low',
    category: 'geo',
    title: 'Low text-to-HTML ratio',
    summary:
      'When content is buried under framework markup, AI engines and crawlers struggle to extract the actual text.',
    whyItMatters:
      'Pages where content is buried under heavy JS/CSS framework markup are harder for AI engines (and old-school crawlers) to extract.',
    exampleFix:
      '<main>\n  <article>\n    <h1>Page title</h1>\n    <p>Your actual content — present in the server HTML, not injected later by JS.</p>\n  </article>\n</main>',
    docLink: 'https://web.dev/articles/semantics-builtin',
  },
  {
    id: 'geo.tables.missing',
    category: 'geo',
    title: 'No comparison tables detected',
    summary:
      'LLMs lift tables directly into answers because they are structured and easy to extract. Comparison content without a table gets cited less.',
    whyItMatters:
      'LLMs cite tables heavily because they\'re structured data that\'s easy to extract and present. Comparison tables on review/listicle pages are especially powerful.',
    exampleFix:
      '<table>\n  <thead>\n    <tr><th>Option</th><th>Price</th><th>Best for</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Plan A</td><td>$0</td><td>Solo / testing</td></tr>\n    <tr><td>Plan B</td><td>$29/mo</td><td>Small teams</td></tr>\n  </tbody>\n</table>',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table',
  },
  {
    id: 'security.compression.missing',
    category: 'performance',
    title: 'Response is not compressed',
    summary:
      'Uncompressed HTML can be 4–10× larger over the wire, hurting Largest Contentful Paint and mobile data costs.',
    whyItMatters:
      'Uncompressed HTML can be 4-10× larger over the wire, hurting LCP and mobile data costs.',
    docLink: 'https://web.dev/articles/reduce-network-payloads-using-text-compression',
  },
  {
    id: 'security.content-security-policy.missing',
    category: 'security',
    title: 'Missing Content-Security-Policy header',
    summary:
      'CSP restricts which scripts may run. Without it, any reflected or stored XSS executes unmitigated.',
    whyItMatters:
      'CSP prevents XSS by restricting which scripts can run. Without it, any reflected/stored XSS hits unmitigated.',
    exampleFix:
      'Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy',
  },
  {
    id: 'security.x-frame-options.missing',
    category: 'security',
    title: 'Missing X-Frame-Options header',
    summary:
      'Without it your pages can be embedded in an invisible iframe for clickjacking attacks.',
    whyItMatters:
      'X-Frame-Options (or frame-ancestors CSP) prevents your site being embedded in iframes for clickjacking attacks.',
    exampleFix:
      'X-Frame-Options: SAMEORIGIN',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
  },
  {
    id: 'security.referrer-policy.missing',
    category: 'security',
    title: 'Missing Referrer-Policy header',
    summary:
      'Referrer-Policy controls how much of your URL leaks to other sites in the Referer header.',
    whyItMatters:
      'Referrer-Policy controls how much URL info leaks to other sites in the Referer header.',
    exampleFix:
      'Referrer-Policy: strict-origin-when-cross-origin',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy',
  },
  {
    id: 'security.x-content-type-options.missing',
    category: 'security',
    title: 'Missing X-Content-Type-Options header',
    summary:
      'nosniff stops browsers MIME-sniffing a response into an executable type.',
    whyItMatters:
      'X-Content-Type-Options: nosniff prevents MIME-type sniffing attacks.',
    exampleFix:
      'X-Content-Type-Options: nosniff',
    docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options',
  },
  {
    id: 'geo.robots.gptbot.blocked',
    category: 'geo',
    title: 'robots.txt blocks GPTBot (OpenAI)',
    summary:
      'Your robots.txt disallows GPTBot (OpenAI) across the whole site, so it cannot read or cite any of your pages.',
    whyItMatters:
      'If this is intentional (privacy, training opt-out) that\'s fine. If you want AI citations, this prevents them.',
    exampleFix:
      '# robots.txt — let GPTBot (OpenAI) crawl the site\nUser-agent: gptbot\nAllow: /\n\n# ...or block only specific sections instead of everything:\n# User-agent: gptbot\n# Disallow: /admin/',
    docLink: 'https://platform.openai.com/docs/gptbot',
  },
  {
    id: 'geo.robots.claudebot.blocked',
    category: 'geo',
    title: 'robots.txt blocks ClaudeBot (Anthropic)',
    summary:
      'Your robots.txt disallows ClaudeBot (Anthropic) across the whole site, so it cannot read or cite any of your pages.',
    whyItMatters:
      'If this is intentional (privacy, training opt-out) that\'s fine. If you want AI citations, this prevents them.',
    exampleFix:
      '# robots.txt — let ClaudeBot (Anthropic) crawl the site\nUser-agent: claudebot\nAllow: /\n\n# ...or block only specific sections instead of everything:\n# User-agent: claudebot\n# Disallow: /admin/',
    docLink: 'https://platform.openai.com/docs/gptbot',
  },
  {
    id: 'geo.robots.perplexitybot.blocked',
    category: 'geo',
    title: 'robots.txt blocks PerplexityBot',
    summary:
      'Your robots.txt disallows PerplexityBot across the whole site, so it cannot read or cite any of your pages.',
    whyItMatters:
      'If this is intentional (privacy, training opt-out) that\'s fine. If you want AI citations, this prevents them.',
    exampleFix:
      '# robots.txt — let PerplexityBot crawl the site\nUser-agent: perplexitybot\nAllow: /\n\n# ...or block only specific sections instead of everything:\n# User-agent: perplexitybot\n# Disallow: /admin/',
    docLink: 'https://platform.openai.com/docs/gptbot',
  },
  {
    id: 'geo.robots.oaiSearchbot.blocked',
    category: 'geo',
    title: 'robots.txt blocks OAI-SearchBot',
    summary:
      'Your robots.txt disallows OAI-SearchBot across the whole site, so it cannot read or cite any of your pages.',
    whyItMatters:
      'If this is intentional (privacy, training opt-out) that\'s fine. If you want AI citations, this prevents them.',
    exampleFix:
      '# robots.txt — let OAI-SearchBot crawl the site\nUser-agent: oaiSearchbot\nAllow: /\n\n# ...or block only specific sections instead of everything:\n# User-agent: oaiSearchbot\n# Disallow: /admin/',
    docLink: 'https://platform.openai.com/docs/gptbot',
  },
  {
    id: 'geo.robots.googleExtended.blocked',
    category: 'geo',
    title: 'robots.txt blocks Google-Extended',
    summary:
      'Your robots.txt disallows Google-Extended across the whole site, so it cannot read or cite any of your pages.',
    whyItMatters:
      'If this is intentional (privacy, training opt-out) that\'s fine. If you want AI citations, this prevents them.',
    exampleFix:
      '# robots.txt — let Google-Extended crawl the site\nUser-agent: googleExtended\nAllow: /\n\n# ...or block only specific sections instead of everything:\n# User-agent: googleExtended\n# Disallow: /admin/',
    docLink: 'https://platform.openai.com/docs/gptbot',
  },
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
