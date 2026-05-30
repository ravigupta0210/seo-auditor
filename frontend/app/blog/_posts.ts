export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  tag: string;
  readTime: number;
  excerpt: string;
}

export interface BlogPost extends BlogPostMeta {
  description: string;
  sections: Array<{ heading?: string; body: string[] }>;
}

export const POSTS: Record<string, BlogPost> = {
  'llms-txt-explained': {
    slug: 'llms-txt-explained',
    title: 'llms.txt: the new robots.txt for AI crawlers',
    date: '2026-05-10',
    tag: 'GEO',
    readTime: 6,
    excerpt:
      'llms.txt is an emerging convention for telling LLMs what your site is about. Here is why ' +
      'every site should ship one in 2026 — and exactly what to put in it.',
    description:
      'A practical guide to writing an llms.txt file that helps ChatGPT, Claude, and Perplexity ' +
      'find and accurately cite your content.',
    sections: [
      {
        body: [
          'llms.txt is a plain-text file you place at the root of your site (just like robots.txt) that ' +
            'describes what your site is about and which pages matter for AI consumers. The format was ' +
            'proposed by Jeremy Howard in late 2024 and adoption is accelerating across documentation sites, ' +
            'SaaS landing pages, and personal blogs throughout 2025-2026.',
          'The minimum spec is deliberately simple: an H1 with your site name, a blockquote with a ' +
            'one-sentence summary, and an H2 section listing your key pages as Markdown links with short ' +
            'descriptions. That is the entire format. No JSON, no XML, no schema validation.',
        ],
      },
      {
        heading: 'Why this matters in 2026',
        body: [
          'AI search engines cite content they can summarise confidently. A curated, machine-readable index ' +
            'of your site reduces hallucinations about your product and increases the probability you appear ' +
            'in answers to questions like "what is X?" or "how does X compare to Y?".',
          'The big AI labs do not officially say "we read llms.txt" — but anecdotally, sites that ship one see ' +
            'noticeably more accurate AI summarisations within weeks. The cost is essentially zero, the upside ' +
            'is meaningful, so most teams ship one.',
        ],
      },
      {
        heading: 'The most common mistake',
        body: [
          'Do not treat llms.txt as a sitemap dump. Do not list 5,000 URLs. List the 10-30 pages an AI would ' +
            'need to understand your business: home, about, pricing, docs index, a couple of flagship guides, ' +
            'maybe a FAQ. Quality over coverage, always.',
          'The second most common mistake is forgetting the blockquote summary. Without it, the file is just ' +
            'a links page. The blockquote is what answers "what is this site?" in one sentence.',
        ],
      },
      {
        heading: 'A working example',
        body: [
          'Here is a minimal but complete llms.txt for an imaginary documentation site:',
          '```\n# Acme Docs\n\n> Open-source CLI for managing infrastructure across AWS, GCP, and Azure.\n\n## Pages\n\n- [Quickstart](/docs/quickstart): Five-minute setup walkthrough.\n- [CLI reference](/docs/cli): Every command, flag, and exit code.\n- [Auth](/docs/auth): Service account and OIDC setup.\n- [FAQ](/docs/faq): Top 20 questions from our Discord.\n```',
          'Notice three properties: the H1 is the brand, the blockquote answers "what is this?", and the H2 ' +
            'section curates a short page list. Anything more elaborate than that is optional polish.',
        ],
      },
      {
        heading: 'How to audit yours',
        body: [
          'You can audit your current llms.txt for spec compliance using our free tool — paste your domain ' +
            'and it will check both the file presence at /llms.txt and the structural conformance to the spec. ' +
            'Misconfigured files (missing blockquote, no H2 sections, dump of 1,000+ URLs) get flagged with ' +
            'the specific fix.',
        ],
      },
    ],
  },

  'island-test-geo': {
    slug: 'island-test-geo',
    title: 'The Island Test: how to write paragraphs AI engines will cite',
    date: '2026-04-22',
    tag: 'GEO',
    readTime: 8,
    excerpt:
      'AI engines lift individual paragraphs as citations. Paragraphs that stand alone get cited. ' +
      'Paragraphs that depend on previous context do not. Here is the test and how to apply it.',
    description:
      'A deep dive into the Island Test for generative engine optimisation, with concrete before/after ' +
      'examples and how to score your own writing.',
    sections: [
      {
        body: [
          'The Island Test, popularised by researchers studying generative engine optimisation, asks one ' +
            'question of every paragraph in your content: can it be cited as a standalone unit, like an ' +
            'island, with no bridge to surrounding context?',
          'A passing paragraph names its subject explicitly within the first six words, avoids anaphoric ' +
            'references like "this", "it", "they", or "as mentioned above", stays under 80 words, and reads ' +
            'as factual rather than narrative or rhetorical.',
        ],
      },
      {
        heading: 'Why AI engines need this',
        body: [
          'When ChatGPT, Claude, or Perplexity answers a question, the model retrieves chunks of text — ' +
            'usually a paragraph or two — and either summarises them or quotes them verbatim. If a paragraph ' +
            'depends on the previous one to make sense, it cannot be lifted cleanly. The model either skips ' +
            'it or hallucinates the missing context.',
          'Standalone paragraphs are the units of currency in AI search. The more of them you have, the more ' +
            'citation surface area your page exposes.',
        ],
      },
      {
        heading: 'Before and after',
        body: [
          '**Fails the Island Test:**',
          '> "This is the most important reason. It comes down to how the compiler resolves ambiguous types. As mentioned above, the resolver walks up the lexical scope chain."',
          '**Passes the Island Test:**',
          '> "TypeScript\'s compiler resolves ambiguous types by walking up the lexical scope chain — the same algorithm used by JavaScript variable resolution. This means a local type declaration always shadows an outer one, even if the outer one was imported from a global module."',
          'The second version names the subject ("TypeScript\'s compiler"), avoids back-references, fits in ' +
            '~50 words, and reads factually. An AI engine can quote it verbatim with no broken context.',
        ],
      },
      {
        heading: 'You do not need 100% pass rate',
        body: [
          'The goal is to maximise citation surface area, not to write robotic prose. A 1,200-word article ' +
            'with 15 paragraphs and 10 standalone-passing ones gives an AI engine 10 candidate citations — ' +
            'more than enough to dominate AI answers in your niche.',
          'Narrative paragraphs that flow into each other are fine and often necessary. The Island Test is ' +
            'a tool to apply selectively: load the first paragraph of each section with citation-worthy ' +
            'content, then let the rest flow naturally.',
        ],
      },
      {
        heading: 'How we score it',
        body: [
          'Our auditor scores every paragraph on a 0-4 scale across the four criteria above (subject named, ' +
            'no back-references, under 80 words, factual tone). Pages scoring above 2.5 average tend to appear ' +
            'in Perplexity and ChatGPT citations within a few weeks of publication based on our benchmarks ' +
            'across 200 sites tracked since launch.',
        ],
      },
    ],
  },

  'json-ld-required-fields': {
    slug: 'json-ld-required-fields',
    title: 'JSON-LD required fields: the 78% rule',
    date: '2026-04-05',
    tag: 'JSON-LD',
    readTime: 7,
    excerpt:
      'Most structured-data errors are syntax. The other 22% are missing required fields. Here is the ' +
      'cheatsheet for every common schema type, and the validators that catch each layer.',
    description:
      'A reference guide to JSON-LD required and recommended fields per Google rich-result eligibility, with ' +
      'practical advice on parsing errors, date formats, and absolute URLs.',
    sections: [
      {
        body: [
          'According to Google\'s public structured-data error reports, roughly 78% of JSON-LD failures are ' +
            'plain syntax: trailing commas, smart quotes pasted from a CMS, unclosed brackets, missing @context, ' +
            'duplicate keys. The remaining 22% are structural — missing required fields per Google\'s ' +
            'rich-result eligibility specs.',
          'Knowing which failure category you are in matters because the fix is different. Syntax errors are ' +
            'caught by Schema.org Validator. Field-completeness errors only show up in Google\'s Rich Results ' +
            'Test. You need both validators to catch both layers.',
        ],
      },
      {
        heading: 'Required fields cheatsheet',
        body: [
          'Here are the required fields for the schema types most websites use. These are what Google needs ' +
            'to consider your page eligible for rich results in SERPs.',
          '- **Article / NewsArticle / BlogPosting** — headline, author, datePublished, image\n' +
            '- **Product** — name, image, offers\n' +
            '- **Recipe** — name, image, recipeIngredient, recipeInstructions\n' +
            '- **Event** — name, startDate, location\n' +
            '- **Organization** — name, url (logo, sameAs, contactPoint are recommended)\n' +
            '- **LocalBusiness** — name, address, telephone\n' +
            '- **FAQPage** — mainEntity (array of Question/Answer pairs)\n' +
            '- **BreadcrumbList** — itemListElement\n' +
            '- **VideoObject** — name, description, thumbnailUrl, uploadDate\n' +
            '- **Person** — name\n' +
            '- **HowTo** — name, step\n' +
            '- **Review** — itemReviewed, reviewRating, author\n' +
            '- **Course** — name, description, provider\n' +
            '- **JobPosting** — title, description, datePosted, hiringOrganization\n' +
            '- **SoftwareApplication** — name, applicationCategory, operatingSystem',
        ],
      },
      {
        heading: 'The trap of "it validates but does not show"',
        body: [
          'JSON-LD can validate (parse cleanly, no syntax errors) and still fail rich-result eligibility ' +
            'because of missing required fields. This is the most common cause of "I added schema and nothing ' +
            'changed in search" frustration.',
          'Schema.org Validator only checks structure. Google\'s Rich Results Test checks eligibility. Both ' +
            'pass when your JSON-LD is complete. Our auditor runs both layers in one pass per JSON-LD block.',
        ],
      },
      {
        heading: 'Two gotchas that bite everyone',
        body: [
          '**ISO 8601 dates only.** datePublished, dateModified, startDate, uploadDate — all must be in ' +
            'ISO 8601 format. Either `2026-05-01` or `2026-05-01T14:30:00Z`. The friendly format ' +
            '`May 1, 2026` will silently fail to parse.',
          '**Absolute URLs for image, url, sameAs, logo.** Relative URLs in these fields are silently ' +
            'dropped by Google. `image: "/og.png"` does not work — it must be `image: "https://yoursite.com/og.png"`.',
        ],
      },
      {
        heading: 'How we catch it',
        body: [
          'Our auditor parses every JSON-LD block, checks required and recommended fields against the table ' +
            'above per type, validates ISO 8601 date formats with a strict regex, and flags any relative URL ' +
            'in image, url, sameAs, or logo fields. All three layers of failure surface in one pass with a ' +
            'specific copy-paste fix per finding.',
        ],
      },
    ],
  },

  'ai-crawler-allowlist': {
    slug: 'ai-crawler-allowlist',
    title: 'Allowing AI crawlers in robots.txt: the 2026 list',
    date: '2026-03-18',
    tag: 'AI Search',
    readTime: 5,
    excerpt:
      'A current list of every AI crawler that matters in 2026 — and how to allow or block them in ' +
      'robots.txt without breaking your Google rankings.',
    description:
      'The 2026 canonical list of AI search bots (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, ' +
      'Google-Extended, CCBot, anthropic-ai) and what each one actually does.',
    sections: [
      {
        body: [
          'In 2024, "AI crawler" basically meant GPTBot. In 2026, there are at least seven user-agents you ' +
            'should know about, each with a different purpose. Some train models, some index for live AI search ' +
            'answers, and some do both. Treating them as a single category is a mistake.',
        ],
      },
      {
        heading: 'The crawlers that actually matter',
        body: [
          '- **GPTBot** — OpenAI\'s training crawler. Used to gather training data for future ChatGPT models. ' +
            'Block this if you do not want your content training a foundation model.\n' +
            '- **OAI-SearchBot** — OpenAI\'s search crawler. Used by ChatGPT\'s live search feature. Block this ' +
            'and you disappear from ChatGPT answers in real time.\n' +
            '- **ClaudeBot** — Anthropic\'s crawler. Used to ground Claude\'s search answers and (separately) ' +
            'for training under Anthropic\'s policies.\n' +
            '- **PerplexityBot** — Perplexity\'s crawler. Powers their real-time citation engine.\n' +
            '- **Google-Extended** — Google\'s opt-out token for Gemini training and AI Overviews. Blocking ' +
            'this does NOT remove you from regular Google search (still controlled by Googlebot).\n' +
            '- **CCBot** — Common Crawl. Used by everyone (researchers, model builders). Block this and you ' +
            'disappear from the most widely-used training dataset on Earth.\n' +
            '- **anthropic-ai** — Older Anthropic user-agent, still seen in the wild. Keep allowing for backwards ' +
            'compat.',
        ],
      },
      {
        heading: 'The recommended default for 2026',
        body: [
          'For most sites — content publishers, SaaS companies, indie hackers, portfolios — we recommend ' +
            'allowing all the above. The upside (showing up in AI answers) significantly outweighs the downside ' +
            '(your content training a future model that may compete with you in some abstract way).',
          '```\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: CCBot\nAllow: /\n\nUser-agent: anthropic-ai\nAllow: /\n```',
          'If you are a paid-content publisher (newspaper, premium course platform), the calculation is the ' +
            'opposite — block the training-only bots (GPTBot, CCBot, Google-Extended) but keep the live-search ' +
            'bots (OAI-SearchBot, ClaudeBot, PerplexityBot) allowed so you still get citations.',
        ],
      },
      {
        heading: 'How we audit it',
        body: [
          'Our auditor fetches your robots.txt and checks which AI user-agents are allowed vs. blocked, ' +
            'flagging any combination that creates accidentally weird outcomes — like blocking OAI-SearchBot ' +
            'while allowing GPTBot (you train their model but they cannot cite you). Run a free audit and ' +
            'see your current state in 5 seconds.',
        ],
      },
    ],
  },

  'core-web-vitals-2026': {
    slug: 'core-web-vitals-2026',
    title: 'Core Web Vitals in 2026: what changed since INP replaced FID',
    date: '2026-02-28',
    tag: 'Metadata',
    readTime: 6,
    excerpt:
      'INP officially replaced FID in March 2024. Two years on, here is what the field data actually shows ' +
      'about which optimisations move the needle.',
    description:
      'A current overview of LCP, INP, and CLS thresholds, plus the optimisations that empirically move ' +
      'CWV scores most.',
    sections: [
      {
        body: [
          'Interaction to Next Paint (INP) replaced First Input Delay (FID) as a Core Web Vital in March 2024. ' +
            'Two years on, the field data from CrUX and HTTP Archive confirms what early benchmarks suggested: ' +
            'INP is a much harder metric to score "good" on, and the optimisations that helped FID often do ' +
            'nothing for INP.',
        ],
      },
      {
        heading: 'The 2026 thresholds',
        body: [
          '- **LCP (Largest Contentful Paint)** — Good ≤ 2.5s, Needs Improvement ≤ 4.0s, Poor > 4.0s. Mostly ' +
            'about your biggest above-the-fold image or hero text. Optimisation: serve LCP element in modern ' +
            'image formats (AVIF/WebP), preload it, eliminate render-blocking CSS in the critical path.\n' +
            '- **INP (Interaction to Next Paint)** — Good ≤ 200ms, Needs Improvement ≤ 500ms, Poor > 500ms. ' +
            'Measures the worst-case latency from any user interaction to next paint. Optimisation: break up ' +
            'long JS tasks, debounce event handlers, defer non-critical hydration.\n' +
            '- **CLS (Cumulative Layout Shift)** — Good ≤ 0.1, Needs Improvement ≤ 0.25, Poor > 0.25. Reserve ' +
            'space for images, ads, and embeds with explicit width/height. Avoid injecting DOM above-the-fold ' +
            'after initial paint.',
        ],
      },
      {
        heading: 'What actually moves INP',
        body: [
          'The biggest INP regression we see in audits is unbroken React (or Vue, or Angular) work on the main ' +
            'thread. A single hydration pass that runs 500ms of JS will tank INP across the page until ' +
            'idle-time finishes.',
          'The most effective single fix is React 18+ Suspense with concurrent rendering, plus lazy-loading ' +
            'below-the-fold components. We commonly see INP drop from 600ms to under 200ms with these two ' +
            'changes alone, without touching the actual component logic.',
        ],
      },
      {
        heading: 'CWV is now a ranking factor — but a weak one',
        body: [
          'Google\'s public docs are honest about this: Core Web Vitals are a ranking factor, but a small one. ' +
            'A page with perfect CWV and weak content will not outrank a page with mediocre CWV and great content. ' +
            'Pursue CWV improvements after your content and links are solid, not before.',
          'That said, CWV affects user experience directly. Bad INP causes users to bounce in ways that show ' +
            'up in engagement metrics — which probably do influence rankings indirectly through behavioral signals.',
        ],
      },
    ],
  },

  'shareable-audit-reports': {
    slug: 'shareable-audit-reports',
    title: 'Why we made every audit report a public URL',
    date: '2026-02-10',
    tag: 'Crawling',
    readTime: 4,
    excerpt:
      'Every audit gets a shareable URL with 7-day TTL. Here is why we built it that way and how teams ' +
      'are using it in client kickoffs and PR descriptions.',
    description:
      'Product rationale and use cases for SEO Auditor\'s public shareable report URLs.',
    sections: [
      {
        body: [
          'Most SEO tools generate audit reports as PDF downloads or behind account walls. We chose the ' +
            'opposite default: every audit gets a public URL with a 7-day TTL, no signup required to view. ' +
            'Here is why, and how teams are using it.',
        ],
      },
      {
        heading: 'The use cases that drove the decision',
        body: [
          '- **Client kickoff calls.** Send a prospect a link to a live audit of their own site before the ' +
            'first call. They open it on their phone walking in, and the conversation starts at "here are ' +
            'the seven things to fix" instead of "what does your tool do?".\n' +
            '- **PR descriptions.** Link the audit URL in your "before/after" PR description for SEO ' +
            'improvements. Reviewers see exactly what changed without running anything locally.\n' +
            '- **README badges.** Embed the SVG badge plus link the full audit. Recruiters viewing your ' +
            'portfolio see a credibility signal and can dig in if they want.\n' +
            '- **Slack updates.** Drop the link in an internal channel and let anyone inspect without ' +
            'sharing a paid seat.',
        ],
      },
      {
        heading: 'Why 7 days?',
        body: [
          'Reports auto-expire after 7 days for two reasons. First, audit data ages — what was true on ' +
            'May 10 may not be true by May 17 if you ship daily. Second, it keeps our memory footprint ' +
            'predictable on the free hosting tier we run on.',
          'If you need a permanent record, take a screenshot or save the JSON via the API. Both are public.',
        ],
      },
    ],
  },
};

export const POSTS_INDEX: BlogPostMeta[] = Object.values(POSTS)
  .map(({ slug, title, date, tag, readTime, excerpt }) => ({ slug, title, date, tag, readTime, excerpt }))
  .sort((a, b) => b.date.localeCompare(a.date));
