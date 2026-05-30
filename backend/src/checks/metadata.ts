import * as cheerio from 'cheerio';
import type { CheckResult, PageContext } from '../types/check.js';

const RULE_VERSION = 'v0.1.0';

export function runMetadataChecks(page: PageContext): CheckResult[] {
  const $ = cheerio.load(page.html);
  const results: CheckResult[] = [];

  results.push(checkTitle($));
  results.push(checkMetaDescription($));
  results.push(checkCanonical($, page.url));
  results.push(checkViewport($));
  results.push(checkCharset($, page.html));
  results.push(checkLangAttribute($));
  results.push(checkOpenGraph($));
  results.push(checkTwitterCard($));
  results.push(checkFavicon($));
  results.push(checkRobotsMeta($));

  return results;
}

function checkTitle($: cheerio.CheerioAPI): CheckResult {
  const title = $('head > title').first().text().trim();
  const len = title.length;

  if (!title) {
    return {
      id: 'metadata.title.missing',
      category: 'metadata',
      severity: 'error',
      title: 'Page is missing a <title> tag',
      evidence: { title },
      whyItMatters:
        'The <title> is the strongest on-page ranking signal and the headline shown in search results. A missing title means Google may auto-generate one — usually badly.',
      fix: {
        summary: 'Add a descriptive 50–60 character <title> in the <head>.',
        snippet: '<title>Your unique, descriptive page title (50–60 chars)</title>',
        docLink:
          'https://developers.google.com/search/docs/appearance/title-link',
      },
      priority: 95,
      ruleVersion: RULE_VERSION,
    };
  }

  if (len < 30) {
    return {
      id: 'metadata.title.tooShort',
      category: 'metadata',
      severity: 'warning',
      title: `<title> is only ${len} characters (recommended 50–60)`,
      evidence: { title, length: len },
      whyItMatters:
        'Very short titles waste valuable SERP real estate and rarely capture intent-bearing keywords.',
      fix: {
        summary: 'Expand the title to 50–60 characters with primary keyword + brand.',
        snippet: `<title>${title} — [Add descriptive modifier] | YourBrand</title>`,
        docLink:
          'https://developers.google.com/search/docs/appearance/title-link',
      },
      priority: 60,
      ruleVersion: RULE_VERSION,
    };
  }

  if (len > 65) {
    return {
      id: 'metadata.title.tooLong',
      category: 'metadata',
      severity: 'warning',
      title: `<title> is ${len} characters; Google likely truncates after ~60`,
      evidence: { title, length: len },
      whyItMatters:
        'Google truncates titles around 580px (≈60 chars) on mobile; words past the cutoff are hidden from searchers.',
      fix: {
        summary: 'Trim to under 60 characters; put the primary keyword in the first 50 chars.',
        docLink:
          'https://developers.google.com/search/docs/appearance/title-link',
      },
      priority: 55,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'metadata.title.ok',
    category: 'metadata',
    severity: 'pass',
    title: `<title> looks good (${len} chars)`,
    evidence: { title, length: len },
    whyItMatters: 'Title length is within Google\'s display limits.',
    fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/appearance/title-link' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkMetaDescription($: cheerio.CheerioAPI): CheckResult {
  const desc = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const len = desc.length;

  if (!desc) {
    return {
      id: 'metadata.description.missing',
      category: 'metadata',
      severity: 'error',
      title: 'Missing <meta name="description">',
      whyItMatters:
        'Without a description, Google fabricates a snippet from page text — often missing CTAs and reducing click-through rate.',
      fix: {
        summary: 'Add a 140–160 character meta description summarizing the page and including the primary keyword once.',
        snippet:
          '<meta name="description" content="One to two sentences (140–160 chars) summarizing this page\'s value and inviting clicks." />',
        docLink:
          'https://developers.google.com/search/docs/appearance/snippet#meta-descriptions',
      },
      priority: 90,
      ruleVersion: RULE_VERSION,
    };
  }

  if (len < 70) {
    return {
      id: 'metadata.description.tooShort',
      category: 'metadata',
      severity: 'warning',
      title: `Meta description is only ${len} chars (recommended 140–160)`,
      evidence: { description: desc, length: len },
      whyItMatters:
        'Short descriptions leave SERP real estate empty; Google may pad them with random page text.',
      fix: { summary: 'Expand to 140–160 chars with value prop and call-to-action.', docLink: 'https://developers.google.com/search/docs/appearance/snippet' },
      priority: 50,
      ruleVersion: RULE_VERSION,
    };
  }

  if (len > 165) {
    return {
      id: 'metadata.description.tooLong',
      category: 'metadata',
      severity: 'warning',
      title: `Meta description is ${len} chars; Google truncates after ~160`,
      evidence: { description: desc, length: len },
      whyItMatters:
        'Anything past ~160 chars is hidden with an ellipsis on the SERP, including any CTA at the end.',
      fix: { summary: 'Trim to ≤160 chars; front-load the value prop.', docLink: 'https://developers.google.com/search/docs/appearance/snippet' },
      priority: 45,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'metadata.description.ok',
    category: 'metadata',
    severity: 'pass',
    title: `Meta description length is good (${len} chars)`,
    evidence: { description: desc, length: len },
    whyItMatters: 'Description is within Google\'s display range.',
    fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/appearance/snippet' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkCanonical($: cheerio.CheerioAPI, currentUrl: string): CheckResult {
  const canonical = $('link[rel="canonical"]').attr('href')?.trim();

  if (!canonical) {
    return {
      id: 'metadata.canonical.missing',
      category: 'metadata',
      severity: 'warning',
      title: 'No <link rel="canonical"> declared',
      whyItMatters:
        'Without a canonical, Google chooses one itself when duplicate URLs exist (HTTP/HTTPS, trailing slash, tracking params) — sometimes the wrong one.',
      fix: {
        summary: 'Add a self-referential canonical to consolidate duplicate URLs.',
        snippet: `<link rel="canonical" href="${currentUrl}" />`,
        docLink:
          'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      },
      priority: 70,
      ruleVersion: RULE_VERSION,
    };
  }

  try {
    const canonURL = new URL(canonical, currentUrl);
    const sameOrigin = canonURL.hostname === new URL(currentUrl).hostname;
    if (!sameOrigin) {
      return {
        id: 'metadata.canonical.crossDomain',
        category: 'metadata',
        severity: 'warning',
        title: 'Canonical points to a different domain',
        evidence: { canonical, currentUrl },
        whyItMatters:
          'A cross-domain canonical effectively tells Google to ignore this page in favor of another site — confirm this is intentional.',
        fix: { summary: 'If unintentional, set canonical to a same-domain URL.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls' },
        priority: 75,
        ruleVersion: RULE_VERSION,
      };
    }

    return {
      id: 'metadata.canonical.ok',
      category: 'metadata',
      severity: 'pass',
      title: 'Canonical URL declared',
      evidence: { canonical: canonURL.toString() },
      whyItMatters: 'Search engines know the preferred version of this URL.',
      fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    };
  } catch {
    return {
      id: 'metadata.canonical.invalid',
      category: 'metadata',
      severity: 'error',
      title: 'Canonical URL is malformed',
      evidence: { canonical },
      whyItMatters: 'Google may ignore the entire canonical hint when the URL is invalid.',
      fix: {
        summary: 'Use an absolute, well-formed URL.',
        snippet: `<link rel="canonical" href="${currentUrl}" />`,
        docLink:
          'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
      },
      priority: 80,
      ruleVersion: RULE_VERSION,
    };
  }
}

function checkViewport($: cheerio.CheerioAPI): CheckResult {
  const viewport = $('meta[name="viewport"]').attr('content')?.trim();
  if (!viewport) {
    return {
      id: 'metadata.viewport.missing',
      category: 'metadata',
      severity: 'error',
      title: 'Missing viewport meta tag — site will look broken on mobile',
      whyItMatters:
        'Google has used mobile-first indexing since 2019. A missing viewport causes desktop-width rendering on mobile, hurting Core Web Vitals + rankings.',
      fix: {
        summary: 'Add the standard mobile viewport meta tag in <head>.',
        snippet: '<meta name="viewport" content="width=device-width, initial-scale=1" />',
        docLink: 'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
      },
      priority: 90,
      ruleVersion: RULE_VERSION,
    };
  }
  return {
    id: 'metadata.viewport.ok',
    category: 'metadata',
    severity: 'pass',
    title: 'Mobile viewport configured',
    evidence: { viewport },
    whyItMatters: 'Mobile rendering will scale correctly.',
    fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkCharset($: cheerio.CheerioAPI, html: string): CheckResult {
  const charset =
    $('meta[charset]').attr('charset') ??
    $('meta[http-equiv="Content-Type"]').attr('content');

  if (!charset) {
    return {
      id: 'metadata.charset.missing',
      category: 'metadata',
      severity: 'warning',
      title: 'No charset declared in <head>',
      whyItMatters:
        'Browsers must guess the encoding, risking mojibake for non-ASCII content (Hindi, accented characters, emojis).',
      fix: {
        summary: 'Add <meta charset="utf-8" /> as the first child of <head>.',
        snippet: '<meta charset="utf-8" />',
        docLink: 'https://html.spec.whatwg.org/multipage/semantics.html#charset',
      },
      priority: 35,
      ruleVersion: RULE_VERSION,
    };
  }

  const isUtf8 = /utf-?8/i.test(charset);
  // Check declaration is within the first 1024 bytes (HTML spec requirement)
  const charsetIdx = html.toLowerCase().indexOf('charset');
  const lateDeclaration = charsetIdx > 1024;

  if (!isUtf8) {
    return {
      id: 'metadata.charset.notUtf8',
      category: 'metadata',
      severity: 'warning',
      title: `Charset is "${charset}" — UTF-8 is recommended`,
      evidence: { charset },
      whyItMatters: 'Non-UTF-8 encodings can corrupt user-submitted content and break copy-paste.',
      fix: { summary: 'Migrate to UTF-8.', snippet: '<meta charset="utf-8" />', docLink: 'https://html.spec.whatwg.org/multipage/semantics.html#charset' },
      priority: 30,
      ruleVersion: RULE_VERSION,
    };
  }

  if (lateDeclaration) {
    return {
      id: 'metadata.charset.lateDeclaration',
      category: 'metadata',
      severity: 'info',
      title: 'Charset declared after first 1024 bytes',
      whyItMatters: 'The HTML spec requires the charset declaration to appear within the first 1024 bytes; later declarations may be ignored.',
      fix: { summary: 'Move <meta charset="utf-8" /> to be the first child of <head>.', docLink: 'https://html.spec.whatwg.org/multipage/semantics.html#charset' },
      priority: 20,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'metadata.charset.ok',
    category: 'metadata',
    severity: 'pass',
    title: 'UTF-8 charset declared',
    evidence: { charset },
    whyItMatters: 'Browsers will decode the page correctly.',
    fix: { summary: 'No action needed.', docLink: 'https://html.spec.whatwg.org/multipage/semantics.html#charset' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkLangAttribute($: cheerio.CheerioAPI): CheckResult {
  const lang = $('html').attr('lang');
  if (!lang) {
    return {
      id: 'metadata.lang.missing',
      category: 'metadata',
      severity: 'warning',
      title: 'Missing <html lang=""> attribute',
      whyItMatters:
        'Search engines use the lang attribute to serve the right regional results; screen readers use it to pick pronunciation. Both downgrade without it.',
      fix: {
        summary: 'Set the lang attribute on <html>.',
        snippet: '<html lang="en">',
        docLink: 'https://www.w3.org/International/questions/qa-html-language-declarations',
      },
      priority: 50,
      ruleVersion: RULE_VERSION,
    };
  }
  return {
    id: 'metadata.lang.ok',
    category: 'metadata',
    severity: 'pass',
    title: `Page language declared as "${lang}"`,
    evidence: { lang },
    whyItMatters: 'Screen readers and search engines know the page language.',
    fix: { summary: 'No action needed.', docLink: 'https://www.w3.org/International/questions/qa-html-language-declarations' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkOpenGraph($: cheerio.CheerioAPI): CheckResult {
  const required = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
  const missing: string[] = [];
  const found: Record<string, string> = {};

  for (const tag of required) {
    const val = $(`meta[property="${tag}"]`).attr('content')?.trim();
    if (val) found[tag] = val;
    else missing.push(tag);
  }

  if (missing.length === required.length) {
    return {
      id: 'metadata.og.missing',
      category: 'metadata',
      severity: 'warning',
      title: 'No Open Graph tags — link previews on social will be poor',
      whyItMatters:
        'When users share this URL on LinkedIn, Slack, Facebook, WhatsApp, or X, the preview card is built from OG tags. Without them, you get a bare URL and a guessed image.',
      fix: {
        summary: 'Add the five core OG tags in <head>.',
        snippet: `<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://example.com/preview.png" />
<meta property="og:url" content="https://example.com/this-page" />
<meta property="og:type" content="website" />`,
        docLink: 'https://ogp.me/',
      },
      priority: 65,
      ruleVersion: RULE_VERSION,
    };
  }

  if (missing.length > 0) {
    return {
      id: 'metadata.og.incomplete',
      category: 'metadata',
      severity: 'warning',
      title: `Open Graph is missing ${missing.length} required tag(s): ${missing.join(', ')}`,
      evidence: { missing, found },
      whyItMatters:
        'Partial OG data leads to inconsistent previews across platforms — some scrape, others fall back to <title>/<meta description>.',
      fix: { summary: `Add the missing OG tags: ${missing.join(', ')}.`, docLink: 'https://ogp.me/' },
      priority: 50,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'metadata.og.ok',
    category: 'metadata',
    severity: 'pass',
    title: 'All five core Open Graph tags present',
    evidence: { found },
    whyItMatters: 'Social previews will render properly.',
    fix: { summary: 'No action needed.', docLink: 'https://ogp.me/' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkTwitterCard($: cheerio.CheerioAPI): CheckResult {
  const card = $('meta[name="twitter:card"]').attr('content')?.trim();
  if (!card) {
    return {
      id: 'metadata.twitter.missing',
      category: 'metadata',
      severity: 'info',
      title: 'No Twitter Card meta tag',
      whyItMatters:
        'X (Twitter) falls back to OG tags, but defining twitter:card explicitly gives you control over the preview layout (summary vs. summary_large_image).',
      fix: {
        summary: 'Add twitter:card for richer X previews.',
        snippet: '<meta name="twitter:card" content="summary_large_image" />',
        docLink: 'https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards',
      },
      priority: 25,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'metadata.twitter.ok',
    category: 'metadata',
    severity: 'pass',
    title: `Twitter card declared (${card})`,
    evidence: { card },
    whyItMatters: 'X previews will use the configured card style.',
    fix: { summary: 'No action needed.', docLink: 'https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkFavicon($: cheerio.CheerioAPI): CheckResult {
  const favicons = $(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  if (favicons.length === 0) {
    return {
      id: 'metadata.favicon.missing',
      category: 'metadata',
      severity: 'info',
      title: 'No favicon links found',
      whyItMatters:
        'Google now shows favicons next to organic results on mobile. A missing favicon means a generic globe icon and lower brand recognition.',
      fix: {
        summary: 'Add a 32×32 favicon and an apple-touch-icon.',
        snippet: `<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
        docLink: 'https://developers.google.com/search/docs/appearance/favicon-in-search',
      },
      priority: 30,
      ruleVersion: RULE_VERSION,
    };
  }
  return {
    id: 'metadata.favicon.ok',
    category: 'metadata',
    severity: 'pass',
    title: `Favicon declared (${favicons.length} link(s))`,
    whyItMatters: 'Browser tabs and SERP results will show your icon.',
    fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/appearance/favicon-in-search' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkRobotsMeta($: cheerio.CheerioAPI): CheckResult {
  const robots = $('meta[name="robots"]').attr('content')?.trim().toLowerCase() ?? '';
  if (!robots) {
    return {
      id: 'metadata.robotsMeta.default',
      category: 'metadata',
      severity: 'pass',
      title: 'No restrictive robots meta tag (page is indexable)',
      whyItMatters: 'Without explicit directives, the page defaults to indexable + follow — usually what you want.',
      fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    };
  }

  if (robots.includes('noindex')) {
    return {
      id: 'metadata.robotsMeta.noindex',
      category: 'metadata',
      severity: 'warning',
      title: 'Page has <meta name="robots" content="noindex"> — Google will NOT index it',
      evidence: { robots },
      whyItMatters:
        'noindex completely removes the page from Google results. Confirm this is intentional — staging environments often ship noindex into production by accident.',
      fix: { summary: 'If you want this page indexed, remove "noindex" from the robots meta.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag' },
      priority: 95,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'metadata.robotsMeta.ok',
    category: 'metadata',
    severity: 'pass',
    title: `Robots meta: ${robots}`,
    evidence: { robots },
    whyItMatters: 'Crawl directives are explicitly declared.',
    fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}
