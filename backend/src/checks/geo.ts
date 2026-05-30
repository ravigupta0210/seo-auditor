import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';
import { fetchPage } from '../crawler/fetcher.js';
import type { CheckResult, PageContext } from '../types/check.js';
import type { RobotsTxt } from '../crawler/robots.js';
import { logger } from '../lib/logger.js';

const RULE_VERSION = 'v0.1.0';

const AI_BOTS = [
  { ua: 'gptbot' as const, label: 'GPTBot (OpenAI)', tokens: ['gptbot'] },
  { ua: 'claudebot' as const, label: 'ClaudeBot (Anthropic)', tokens: ['claudebot', 'anthropic'] },
  { ua: 'perplexitybot' as const, label: 'PerplexityBot', tokens: ['perplexitybot'] },
  { ua: 'oaiSearchbot' as const, label: 'OAI-SearchBot', tokens: ['oai-searchbot'] },
  { ua: 'googleExtended' as const, label: 'Google-Extended', tokens: ['google-extended'] },
] as const;

export interface GeoContext {
  page: PageContext;
  robots: RobotsTxt;
  llmsTxt: { found: boolean; raw?: string; status?: number };
}

export async function loadGeoContext(page: PageContext, robots: RobotsTxt): Promise<GeoContext> {
  const origin = new URL(page.url).origin;
  let llmsTxt: GeoContext['llmsTxt'] = { found: false };
  try {
    const llms = await fetchPage(new URL('/llms.txt', origin).toString());
    if (llms.status === 200 && llms.html.length > 0) {
      llmsTxt = { found: true, raw: llms.html, status: llms.status };
    } else {
      llmsTxt = { found: false, status: llms.status };
    }
  } catch (err) {
    logger.debug({ err }, 'llms.txt fetch failed');
  }
  return { page, robots, llmsTxt };
}

export async function runGeoChecks(ctx: GeoContext): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  results.push(checkLlmsTxt(ctx));
  results.push(...checkAIBotsInRobots(ctx.robots));
  results.push(...checkContentSignals(ctx.page));
  results.push(...checkEEAT(ctx.page));
  return results;
}

/**
 * Cloaking detection: re-fetch the page as different AI user agents and
 * compare body-text hashes. Runs only when explicitly requested as it
 * costs extra network round-trips.
 */
export async function runAICloakingCheck(page: PageContext): Promise<CheckResult[]> {
  const defaultHash = bodyTextHash(page.html);
  const results: CheckResult[] = [];

  const fetches = await Promise.all(
    AI_BOTS.map(async (bot) => {
      try {
        const r = await fetchPage(page.url, { ua: bot.ua });
        return { bot, status: r.status, hash: bodyTextHash(r.html), bytes: r.html.length };
      } catch (err) {
        return { bot, status: 0, hash: '', bytes: 0, error: err instanceof Error ? err.message : String(err) };
      }
    })
  );

  const blocked: string[] = [];
  const cloaked: string[] = [];
  const ok: string[] = [];

  for (const f of fetches) {
    if (f.status === 0 || f.status >= 400) {
      blocked.push(f.bot.label);
    } else if (f.hash !== defaultHash && f.bytes > 0) {
      cloaked.push(f.bot.label);
    } else {
      ok.push(f.bot.label);
    }
  }

  if (blocked.length > 0) {
    results.push({
      id: 'geo.aibots.blocked',
      category: 'geo',
      severity: 'warning',
      title: `${blocked.length} AI crawler(s) appear blocked: ${blocked.join(', ')}`,
      evidence: { blocked, statuses: fetches.map((f) => ({ bot: f.bot.label, status: f.status })) },
      whyItMatters:
        'If you want AI search citations (ChatGPT, Claude, Perplexity), these bots must be able to fetch your content. Blocking them removes you from their answers.',
      fix: {
        summary: 'Check robots.txt and your CDN/WAF rules for AI-crawler User-Agent blocks.',
        docLink: 'https://platform.openai.com/docs/gptbot',
      },
      priority: 60,
      ruleVersion: RULE_VERSION,
    });
  }

  if (cloaked.length > 0) {
    results.push({
      id: 'geo.aibots.cloaking',
      category: 'geo',
      severity: 'warning',
      title: `${cloaked.length} AI crawler(s) see different content (possible cloaking): ${cloaked.join(', ')}`,
      evidence: { cloaked, defaultBytes: page.html.length },
      whyItMatters:
        'Different content per User-Agent is "cloaking" — Google penalizes it for regular search and AI engines may distrust your citations.',
      fix: { summary: 'Serve identical content to all User-Agents. Use server-side rendering if your CDN is variant-caching.', docLink: 'https://developers.google.com/search/docs/essentials/spam-policies#cloaking' },
      priority: 75,
      ruleVersion: RULE_VERSION,
    });
  }

  if (ok.length === AI_BOTS.length) {
    results.push({
      id: 'geo.aibots.allOk',
      category: 'geo',
      severity: 'pass',
      title: `All ${AI_BOTS.length} AI crawlers receive identical content`,
      evidence: { bots: ok },
      whyItMatters: 'AI search engines can index this content for citations.',
      fix: { summary: 'No action needed.', docLink: 'https://platform.openai.com/docs/gptbot' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    });
  }

  return results;
}

function checkLlmsTxt(ctx: GeoContext): CheckResult {
  if (!ctx.llmsTxt.found) {
    return {
      id: 'geo.llmsTxt.missing',
      category: 'geo',
      severity: 'warning',
      title: 'No /llms.txt at site root',
      whyItMatters:
        'llms.txt is the emerging convention (2024-26) for telling AI crawlers what your site is about and what pages matter — like robots.txt + sitemap for LLMs. Early adopters get a citation edge.',
      fix: {
        summary: 'Add a /llms.txt at root with site purpose and key pages.',
        snippet: `# Your Site Name

> One-sentence description of what your site does.

## Pages

- [Home](https://example.com/): Overview.
- [Pricing](https://example.com/pricing): Plans and pricing.
- [Docs](https://example.com/docs): Technical documentation.`,
        docLink: 'https://llmstxt.org/',
      },
      priority: 50,
      ruleVersion: RULE_VERSION,
    };
  }

  const raw = ctx.llmsTxt.raw ?? '';
  const hasH1 = /^#\s+/m.test(raw);
  const hasSummary = />\s+\S/.test(raw);
  if (!hasH1 || !hasSummary) {
    return {
      id: 'geo.llmsTxt.malformed',
      category: 'geo',
      severity: 'info',
      title: '/llms.txt exists but does not follow the llmstxt.org spec',
      evidence: { hasH1, hasSummary },
      whyItMatters:
        'The spec asks for an H1 site name and a blockquote summary. Conformant files are more reliably parsed by AI consumers.',
      fix: { summary: 'Add an H1 (# Site Name) and a > blockquote summary at the top.', docLink: 'https://llmstxt.org/' },
      priority: 15,
      ruleVersion: RULE_VERSION,
    };
  }

  return {
    id: 'geo.llmsTxt.ok',
    category: 'geo',
    severity: 'pass',
    title: '/llms.txt present and well-formed',
    whyItMatters: 'AI crawlers can pick up your curated overview of the site.',
    fix: { summary: 'No action needed.', docLink: 'https://llmstxt.org/' },
    priority: 0,
    ruleVersion: RULE_VERSION,
  };
}

function checkAIBotsInRobots(robots: RobotsTxt): CheckResult[] {
  const results: CheckResult[] = [];

  for (const bot of AI_BOTS) {
    const rule = robots.rules.find((r) => bot.tokens.some((t) => r.userAgent.toLowerCase().includes(t)));
    if (rule?.disallow.includes('/')) {
      results.push({
        id: `geo.robots.${bot.ua}.blocked`,
        category: 'geo',
        severity: 'warning',
        title: `robots.txt blocks ${bot.label} from entire site`,
        whyItMatters: 'If this is intentional (privacy, training opt-out) that\'s fine. If you want AI citations, this prevents them.',
        fix: {
          summary: `If you want AI citations, remove the Disallow: / for ${bot.label} or scope the block to specific paths.`,
          docLink: 'https://platform.openai.com/docs/gptbot',
        },
        priority: 40,
        ruleVersion: RULE_VERSION,
      });
    }
  }

  if (results.length === 0) {
    results.push({
      id: 'geo.robots.aiAllowed',
      category: 'geo',
      severity: 'pass',
      title: 'No AI crawlers are blocked in robots.txt',
      whyItMatters: 'AI search engines can crawl your site.',
      fix: { summary: 'No action needed.', docLink: 'https://platform.openai.com/docs/gptbot' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    });
  }
  return results;
}

function checkContentSignals(page: PageContext): CheckResult[] {
  const $ = cheerio.load(page.html);
  const results: CheckResult[] = [];

  // Strip nav/footer for content extraction
  $('script, style, nav, header, footer, aside, noscript').remove();
  const paragraphs = $('p').toArray().map((p) => $(p).text().replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0);

  // Direct-answer detection (top 200 words)
  const topWords = paragraphs.join(' ').split(/\s+/).slice(0, 200).join(' ');
  const definitionalRe = /\b\w+(?:\s+\w+){0,3}\s+(?:is|are|refers to|means)\s+\w+/i;
  if (!definitionalRe.test(topWords)) {
    results.push({
      id: 'geo.directAnswer.missing',
      category: 'geo',
      severity: 'warning',
      title: 'No direct-answer paragraph detected in the first 200 words',
      whyItMatters:
        'AI search engines (Perplexity, ChatGPT, Google AI Overviews) cite pages that state the answer plainly near the top. Pages that "set up" the topic before answering get skipped.',
      fix: {
        summary: 'Add a 30-50 word definitional sentence in the first paragraph that answers the page\'s core question.',
        snippet: 'Example: "X is a [thing] that does [Y]. It works by [mechanism] and is commonly used for [use case]."',
        docLink: 'https://en.wikipedia.org/wiki/Featured_snippet',
      },
      priority: 60,
      ruleVersion: RULE_VERSION,
    });
  } else {
    results.push({
      id: 'geo.directAnswer.found',
      category: 'geo',
      severity: 'pass',
      title: 'Direct-answer pattern found in opening paragraph',
      whyItMatters: 'Page is structured for AI citation.',
      fix: { summary: 'No action needed.', docLink: 'https://en.wikipedia.org/wiki/Featured_snippet' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    });
  }

  // Island Test — paragraph standalone-ness
  if (paragraphs.length > 0) {
    let totalScore = 0;
    let scored = 0;
    for (const p of paragraphs.slice(0, 30)) {
      const score = islandScore(p);
      if (score !== null) {
        totalScore += score;
        scored++;
      }
    }
    const avg = scored > 0 ? totalScore / scored : 0;
    if (avg < 2.5) {
      results.push({
        id: 'geo.islandTest.weak',
        category: 'geo',
        severity: 'warning',
        title: `Island Test score: ${avg.toFixed(1)}/4 — paragraphs need stronger context`,
        evidence: { avg, paragraphsScored: scored },
        whyItMatters:
          'AI engines lift individual paragraphs as citations. Paragraphs that rely on previous context ("this", "it", "as mentioned") are less likely to be extracted.',
        fix: {
          summary: 'Rewrite paragraphs to name their subject explicitly, keep them ≤80 words, and avoid back-references.',
          docLink: 'https://www.semrush.com/blog/geo-generative-engine-optimization/',
        },
        priority: 45,
        ruleVersion: RULE_VERSION,
      });
    } else {
      results.push({
        id: 'geo.islandTest.ok',
        category: 'geo',
        severity: 'pass',
        title: `Island Test score: ${avg.toFixed(1)}/4 — paragraphs are citation-friendly`,
        evidence: { avg, paragraphsScored: scored },
        whyItMatters: 'Paragraphs can stand alone as AI citations.',
        fix: { summary: 'No action needed.', docLink: 'https://www.semrush.com/blog/geo-generative-engine-optimization/' },
        priority: 0,
        ruleVersion: RULE_VERSION,
      });
    }
  }

  // Comparison-table detection
  const goodTables = $('table').filter((_, t) => {
    const $t = $(t);
    const rows = $t.find('tr').length;
    const headerCells = $t.find('th').length;
    return rows >= 3 && headerCells >= 2;
  });
  if (goodTables.length === 0 && paragraphs.length > 5) {
    results.push({
      id: 'geo.tables.missing',
      category: 'geo',
      severity: 'info',
      title: 'No comparison-style tables detected',
      whyItMatters:
        'LLMs cite tables heavily because they\'re structured data that\'s easy to extract and present. Comparison tables on review/listicle pages are especially powerful.',
      fix: { summary: 'Where the content compares options, use a real <table> with <th> headers instead of prose.', docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table' },
      priority: 25,
      ruleVersion: RULE_VERSION,
    });
  } else if (goodTables.length > 0) {
    results.push({
      id: 'geo.tables.found',
      category: 'geo',
      severity: 'pass',
      title: `${goodTables.length} well-structured table(s) found`,
      whyItMatters: 'Structured data is extractable by AI engines.',
      fix: { summary: 'No action needed.', docLink: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    });
  }

  // Text-to-HTML ratio (extractability)
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const ratio = text.length / Math.max(1, page.html.length);
  if (ratio < 0.05) {
    results.push({
      id: 'geo.extractability.low',
      category: 'geo',
      severity: 'warning',
      title: `Text-to-HTML ratio is ${(ratio * 100).toFixed(1)}% — page is heavy on markup, light on content`,
      evidence: { ratio: ratio.toFixed(3), htmlBytes: page.html.length, textChars: text.length },
      whyItMatters:
        'Pages where content is buried under heavy JS/CSS framework markup are harder for AI engines (and old-school crawlers) to extract.',
      fix: { summary: 'Use semantic HTML, reduce inline scripts, server-render content where possible.', docLink: 'https://web.dev/articles/semantics-builtin' },
      priority: 30,
      ruleVersion: RULE_VERSION,
    });
  }

  return results;
}

function checkEEAT(page: PageContext): CheckResult[] {
  const $ = cheerio.load(page.html);
  const results: CheckResult[] = [];

  // Author signals
  const hasAuthorSchema = $('script[type="application/ld+json"]').toArray().some((s) => {
    const raw = $(s).text();
    return /"@type"\s*:\s*"Person"/i.test(raw) || /"author"\s*:/i.test(raw);
  });
  const hasAuthorByline = /by\s+[\w. ]{3,40}/i.test(page.html) || $('[rel="author"], [itemprop="author"], .author').length > 0;

  if (!hasAuthorSchema && !hasAuthorByline) {
    results.push({
      id: 'geo.eeat.author.missing',
      category: 'geo',
      severity: 'warning',
      title: 'No author signals (byline or Person schema) found',
      whyItMatters:
        'Google\'s E-E-A-T framework and AI engines both prefer cited content with clear authorship. Anonymous content gets cited less and trusted less.',
      fix: {
        summary: 'Add a visible author byline and a Person JSON-LD block.',
        snippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jane Doe",
  "url": "https://example.com/author/jane",
  "sameAs": ["https://twitter.com/janedoe", "https://linkedin.com/in/janedoe"]
}
</script>`,
        docLink: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content#author-trust',
      },
      priority: 50,
      ruleVersion: RULE_VERSION,
    });
  } else {
    results.push({
      id: 'geo.eeat.author.ok',
      category: 'geo',
      severity: 'pass',
      title: `Author signals present (schema: ${hasAuthorSchema ? 'yes' : 'no'}, byline: ${hasAuthorByline ? 'yes' : 'no'})`,
      whyItMatters: 'Content is attributable.',
      fix: { summary: 'No action needed.', docLink: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' },
      priority: 0,
      ruleVersion: RULE_VERSION,
    });
  }

  // External citations to authoritative TLDs
  const authoritative = /\.(gov|edu|nih\.gov|who\.int|nature\.com|sciencedirect\.com)\b/i;
  const externalLinks = $('a[href]').toArray()
    .map((a) => $(a).attr('href') ?? '')
    .filter((h) => /^https?:\/\//i.test(h))
    .filter((h) => {
      try { return new URL(h).origin !== new URL(page.url).origin; } catch { return false; }
    });
  const authCount = externalLinks.filter((h) => authoritative.test(h)).length;

  if (externalLinks.length > 0 && authCount === 0) {
    results.push({
      id: 'geo.eeat.citations.weak',
      category: 'geo',
      severity: 'info',
      title: 'No outbound links to authoritative sources (.gov, .edu, journals)',
      evidence: { externalLinks: externalLinks.length, authCount },
      whyItMatters:
        'LLMs trust content that cites primary sources. Linking to .gov/.edu/peer-reviewed sources signals research-backed content.',
      fix: { summary: 'Where you make factual claims, link to the original source.', docLink: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' },
      priority: 20,
      ruleVersion: RULE_VERSION,
    });
  }

  return results;
}

function islandScore(paragraph: string): number | null {
  if (paragraph.length < 20) return null;
  let score = 0;
  // 1. Has explicit subject (capitalized noun in first 6 words)
  const firstWords = paragraph.split(/\s+/).slice(0, 6).join(' ');
  if (/[A-Z][a-zA-Z]{2,}/.test(firstWords) && !/^(The|This|These|That|Those|It|They|We|You|I)\b/.test(firstWords)) {
    score++;
  }
  // 2. No leading anaphora
  if (!/^(this|these|that|those|it|they|such)\b/i.test(paragraph)) score++;
  // 3. ≤80 words
  if (paragraph.split(/\s+/).length <= 80) score++;
  // 4. Factual tone (no interjections / questions / commands at start)
  if (!/^(So|Well|Now|Look|Imagine|Picture|Why|How|What|Try)\b/i.test(paragraph) && !paragraph.endsWith('?')) {
    score++;
  }
  return score;
}

function bodyTextHash(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim().toLowerCase();
  return createHash('sha256').update(text).digest('hex');
}
