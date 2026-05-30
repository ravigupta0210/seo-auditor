import * as cheerio from 'cheerio';
import type { CheckResult, PageContext } from '../types/check.js';

const RULE_VERSION = 'v0.1.0';

const GENERIC_ANCHORS = new Set([
  'click here', 'read more', 'here', 'link', 'this', 'more', 'learn more',
  'continue', 'click', 'go', 'see more', 'see here',
]);

const JUNK_ALT_RE = /^(image|img|photo|picture|untitled|\d+|[a-f0-9-]{8,}|[\w-]+\.(jpg|jpeg|png|gif|webp|svg))$/i;

export function runContentChecks(page: PageContext): CheckResult[] {
  const $ = cheerio.load(page.html);
  const results: CheckResult[] = [];

  results.push(checkHeadingHierarchy($));
  results.push(checkH1TitleAlignment($));
  results.push(checkImageAltText($));
  results.push(checkAnchorText($));
  results.push(checkWordCount($));
  results.push(checkInternalLinks($, page.url));

  return results;
}

function checkHeadingHierarchy($: cheerio.CheerioAPI): CheckResult {
  const headings: Array<{ level: number; text: string }> = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = parseInt(el.tagName[1]!, 10);
    headings.push({ level, text: $(el).text().trim().slice(0, 80) });
  });

  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) {
    return {
      id: 'content.h1.missing',
      category: 'content',
      severity: 'error',
      title: 'Page has no <h1>',
      whyItMatters:
        'The <h1> is the primary topic signal for both humans and search engines. Without it, Google falls back to the <title>, which is less prominent in-page.',
      fix: {
        summary: 'Add exactly one <h1> that names the page\'s main topic.',
        snippet: '<h1>Your page\'s primary topic</h1>',
        docLink: 'https://developers.google.com/search/docs/appearance/structured-data',
      },
      priority: 85,
      ruleVersion: RULE_VERSION,
    };
  }

  if (h1Count > 1) {
    return {
      id: 'content.h1.multiple',
      category: 'content',
      severity: 'warning',
      title: `Page has ${h1Count} <h1> tags — should have exactly one`,
      evidence: { h1s: headings.filter((h) => h.level === 1).map((h) => h.text) },
      whyItMatters:
        'Multiple H1s split topical relevance signals. While HTML5 technically allows multiple H1s inside <section>, in practice Google penalizes the ambiguity.',
      fix: {
        summary: 'Keep one <h1> per page; demote others to <h2> or <h3>.',
        docLink: 'https://developers.google.com/search/docs/appearance/structured-data',
      },
      priority: 60,
      ruleVersion: RULE_VERSION,
    };
  }

  // Check for skipped levels
  const skipped: string[] = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1]!.level;
    const cur = headings[i]!.level;
    if (cur > prev + 1) {
      skipped.push(`H${prev} → H${cur} ("${headings[i]!.text}")`);
    }
  }

  if (skipped.length > 0) {
    return {
      id: 'content.heading.skipped',
      category: 'content',
      severity: 'warning',
      title: `Heading hierarchy skips levels ${skipped.length} time(s)`,
      evidence: { skips: skipped },
      whyItMatters:
        'Skipping heading levels (e.g., H2 → H4) breaks semantic structure for screen readers and confuses search engines about content hierarchy.',
      fix: {
        summary: 'Use sequential heading levels (H1 → H2 → H3) without skips.',
        docLink: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
      },
      priority: 45,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'content.headings.ok',
    category: 'content',
    severity: 'pass',
    title: `Heading hierarchy is well-structured (${headings.length} headings)`,
    evidence: { count: headings.length },
    whyItMatters: 'Semantic structure is clean for both users and crawlers.',
    fix: { summary: 'No action needed.', docLink: 'https://www.w3.org/WAI/tutorials/page-structure/headings/' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkH1TitleAlignment($: cheerio.CheerioAPI): CheckResult {
  const h1 = $('h1').first().text().trim();
  const title = $('head > title').first().text().trim();
  if (!h1 || !title) {
    return {
      id: 'content.h1Title.skip',
      category: 'content',
      severity: 'info',
      title: 'Cannot compare H1 and <title> — one is missing',
      whyItMatters: 'Both are needed to evaluate topical alignment.',
      fix: { summary: 'Ensure both a <title> and an <h1> exist.', docLink: 'https://developers.google.com/search/docs/appearance/title-link' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    };
  }
  const overlap = jaccardSimilarity(h1.toLowerCase(), title.toLowerCase());
  if (overlap < 0.2) {
    return {
      id: 'content.h1Title.mismatch',
      category: 'content',
      severity: 'warning',
      title: 'H1 and <title> share very few words',
      evidence: { h1, title, jaccard: overlap.toFixed(2) },
      whyItMatters:
        'When H1 and title diverge, Google may rewrite your SERP title — sometimes badly. Consistent topical signals across <title>, H1, and URL slug strengthen rankings.',
      fix: { summary: 'Align the H1 wording with the <title>; they should share the primary keyword.', docLink: 'https://developers.google.com/search/docs/appearance/title-link' },
      priority: 35,
      ruleVersion: RULE_VERSION,
    };
  }
  return {
    id: 'content.h1Title.ok',
    category: 'content',
    severity: 'pass',
    title: 'H1 and <title> are topically aligned',
    whyItMatters: 'Consistent topical signaling.',
    fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/appearance/title-link' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkImageAltText($: cheerio.CheerioAPI): CheckResult {
  const imgs = $('img').toArray();
  if (imgs.length === 0) {
    return {
      id: 'content.images.none',
      category: 'content',
      severity: 'info',
      title: 'No <img> tags on this page',
      whyItMatters: 'Nothing to audit for alt text.',
      fix: { summary: 'N/A', docLink: 'https://www.w3.org/WAI/tutorials/images/' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    };
  }

  const missing: string[] = [];
  const junk: Array<{ alt: string; src: string }> = [];

  for (const img of imgs) {
    const $img = $(img);
    const src = $img.attr('src') ?? $img.attr('data-src') ?? '';
    const alt = $img.attr('alt');
    if (alt === undefined) {
      missing.push(src.slice(0, 60));
    } else if (alt && JUNK_ALT_RE.test(alt.trim())) {
      junk.push({ alt, src: src.slice(0, 60) });
    }
  }

  if (missing.length > 0) {
    return {
      id: 'content.images.missingAlt',
      category: 'content',
      severity: 'error',
      title: `${missing.length} of ${imgs.length} <img> tag(s) missing alt attribute`,
      evidence: { missing: missing.slice(0, 10), totalImages: imgs.length },
      whyItMatters:
        'Alt text is required for accessibility (WCAG) and helps Google understand image context. Decorative images need alt="" (empty), but the attribute must exist.',
      fix: {
        summary: 'Add descriptive alt text or alt="" for decorative images.',
        snippet: '<img src="..." alt="Descriptive text explaining what the image shows" />',
        docLink: 'https://www.w3.org/WAI/tutorials/images/',
      },
      priority: 80,
      ruleVersion: RULE_VERSION,
    };
  }

  if (junk.length > 0) {
    return {
      id: 'content.images.poorAlt',
      category: 'content',
      severity: 'warning',
      title: `${junk.length} image(s) have low-quality alt text (filenames or generic words)`,
      evidence: { junk: junk.slice(0, 5) },
      whyItMatters:
        'Alt text like "image1.jpg" or "photo" tells search engines and screen readers nothing about content.',
      fix: { summary: 'Replace generic alt with a 5–15 word description of what the image shows.', docLink: 'https://www.w3.org/WAI/tutorials/images/' },
      priority: 45,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'content.images.altOk',
    category: 'content',
    severity: 'pass',
    title: `All ${imgs.length} image(s) have alt text`,
    whyItMatters: 'Images are accessible and indexable.',
    fix: { summary: 'No action needed.', docLink: 'https://www.w3.org/WAI/tutorials/images/' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkAnchorText($: cheerio.CheerioAPI): CheckResult {
  const anchors = $('a[href]').toArray();
  const generic: string[] = [];
  for (const a of anchors) {
    const text = $(a).text().trim().toLowerCase();
    if (text && GENERIC_ANCHORS.has(text)) generic.push(text);
  }
  if (generic.length === 0) {
    return {
      id: 'content.anchorText.ok',
      category: 'content',
      severity: 'pass',
      title: 'No generic anchor text detected',
      whyItMatters: 'Link text describes the destination, helping both users and Google.',
      fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    };
  }
  return {
    id: 'content.anchorText.generic',
    category: 'content',
    severity: 'warning',
    title: `${generic.length} link(s) use generic anchor text (e.g. "${[...new Set(generic)].slice(0, 3).join('", "')}")`,
    evidence: { samples: [...new Set(generic)].slice(0, 10) },
    whyItMatters:
      'Generic anchor text passes weak topical signals and is bad for screen-reader users navigating by links.',
    fix: {
      summary: 'Use descriptive link text that names the destination.',
      snippet: '<!-- Bad -->\n<a href="/seo-guide">click here</a>\n\n<!-- Good -->\n<a href="/seo-guide">comprehensive SEO guide for 2026</a>',
      docLink: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable',
    },
    priority: 40,
    ruleVersion: RULE_VERSION,
  };
}

function checkWordCount($: cheerio.CheerioAPI): CheckResult {
  // Strip script/style/nav/footer
  const clone = $.html();
  const $$ = cheerio.load(clone);
  $$('script, style, nav, header, footer, aside, noscript').remove();
  const text = $$('body').text().replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean).length;

  if (words < 100) {
    return {
      id: 'content.wordCount.thin',
      category: 'content',
      severity: 'warning',
      title: `Only ${words} words of body content (thin content)`,
      evidence: { words },
      whyItMatters:
        'Pages with very little body content rarely rank — Google\'s helpful-content guidelines flag thin pages as low-value.',
      fix: { summary: 'Add substantive content (≥300 words for content pages, ideally 800+).', docLink: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' },
      priority: 55,
      ruleVersion: RULE_VERSION,
    };
  }
  return {
    id: 'content.wordCount.ok',
    category: 'content',
    severity: 'pass',
    title: `${words} words of body content`,
    evidence: { words },
    whyItMatters: 'Sufficient content depth.',
    fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkInternalLinks($: cheerio.CheerioAPI, currentUrl: string): CheckResult {
  const origin = new URL(currentUrl).origin;
  let internal = 0;
  let external = 0;
  for (const a of $('a[href]').toArray()) {
    const href = $(a).attr('href');
    if (!href) continue;
    try {
      const url = new URL(href, currentUrl);
      if (url.origin === origin) internal++;
      else external++;
    } catch {
      // ignore
    }
  }

  if (internal === 0) {
    return {
      id: 'content.internalLinks.none',
      category: 'content',
      severity: 'warning',
      title: 'Page has no internal links',
      whyItMatters:
        'Internal links distribute PageRank and help users (and Googlebot) discover related content. Orphan-like pages tend to underperform.',
      fix: { summary: 'Add 3–10 contextual internal links to related pages.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable' },
      priority: 50,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'content.internalLinks.ok',
    category: 'content',
    severity: 'pass',
    title: `${internal} internal, ${external} external link(s)`,
    evidence: { internal, external },
    whyItMatters: 'Page is linked into the site graph.',
    fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  const setB = new Set(b.split(/\s+/).filter((w) => w.length > 2));
  const inter = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}
