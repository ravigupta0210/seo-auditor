# SEO Auditor — free SEO + AI-search (GEO) audit for any URL

**Is your site visible to ChatGPT, Claude, Perplexity and Google's AI answers?** Most SEO tools can't tell you. This one can.

Paste a URL, get a full technical SEO + JSON-LD + **GEO/AEO** audit in about ten seconds. Every finding comes with a copy-paste fix. No signup, no paywall, no crawl cap, no account. MIT licensed.

### ▶︎ **[Run a free audit →](https://freeseoaudit.vercel.app)**

[![Live](https://img.shields.io/badge/live-freeseoaudit.vercel.app-6366f1)](https://freeseoaudit.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Node 20](https://img.shields.io/badge/Node-20-339933)](https://nodejs.org/)

---

## Why this exists

Classic SEO tools were built for a web where Google's ten blue links were the only destination. That's no longer true — a growing share of queries are answered by an LLM that reads your page, decides whether it's quotable, and cites you or doesn't.

Optimising for that is a different job, and it has a name: **Generative Engine Optimization (GEO)**, sometimes **Answer Engine Optimization (AEO)**. It's the pillar this tool is built around, and it's the part the big tools don't cover.

Concretely, we check things like:

- Can [AI crawlers](https://freeseoaudit.vercel.app/blog/what-is-an-ai-crawler) — GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot — actually reach your pages? ([why this matters](https://freeseoaudit.vercel.app/check/geo.aibots.blocked))
- **Does your content even exist without JavaScript?** Most AI crawlers don't execute JS, so a client-rendered page is invisible to them no matter how good it is. ([check](https://freeseoaudit.vercel.app/check/geo.jsRequired.blocking))
- Are your paragraphs *self-contained* enough to be quoted out of context — the ["Island Test"](https://freeseoaudit.vercel.app/check/geo.islandTest.weak)?
- Do you answer the question in the opening paragraph, or bury it? ([check](https://freeseoaudit.vercel.app/check/geo.directAnswer.missing))
- Are your [E-E-A-T signals](https://freeseoaudit.vercel.app/check/geo.eeat.author.missing) present — real author, real dates, real citations?
- Is your `/llms.txt` present and well-formed? ([what llms.txt actually is](https://freeseoaudit.vercel.app/blog/what-is-llmstxt))
- Do you serve AI crawlers different content than you serve Google? (**cloaking detection** — we fetch as five different AI user-agents and diff the results.)

Plus the whole classic surface: metadata, structured data, content, crawl/indexing, performance and security.

**[Browse every check we perform →](https://freeseoaudit.vercel.app/check)**

## What makes it different

| | Typical SEO tool | This |
|---|---|---|
| Signup | Required | **None** |
| Free tier | Crawl-capped | **Uncapped** |
| AI-search / GEO checks | Rarely | **Core pillar** |
| Cloaking detection for AI bots | No | **Yes — 5 user-agents** |
| Fix for each finding | Generic advice | **Copy-paste snippet** |
| Source | Closed | **[MIT, open](https://github.com/ravigupta0210/seo-auditor)** |

See the detailed breakdowns: [vs Screaming Frog](https://freeseoaudit.vercel.app/compare/vs-screaming-frog) · [vs Semrush](https://freeseoaudit.vercel.app/compare/vs-semrush) · [vs Ahrefs](https://freeseoaudit.vercel.app/compare/vs-ahrefs) · [vs Sitebulb](https://freeseoaudit.vercel.app/compare/vs-sitebulb)

## Guides

Long-form explainers on getting cited by AI answer engines:

- [What Is Generative Engine Optimization (GEO)?](https://freeseoaudit.vercel.app/blog/what-is-generative-engine-optimization)
- [How to Rank in ChatGPT: Get Cited in AI Answers](https://freeseoaudit.vercel.app/blog/how-to-rank-in-chatgpt)
- [How to Get Cited by Perplexity](https://freeseoaudit.vercel.app/blog/how-to-get-cited-by-perplexity)
- [How to Get Cited by Claude](https://freeseoaudit.vercel.app/blog/how-to-get-cited-by-claude)
- [How to Block AI Crawlers (and When You Shouldn't)](https://freeseoaudit.vercel.app/blog/how-to-block-ai-crawlers)
- [What Is an AI Crawler?](https://freeseoaudit.vercel.app/blog/what-is-an-ai-crawler)
- [GEO vs SEO: Do You Need Both?](https://freeseoaudit.vercel.app/blog/geo-vs-seo)
- [How to Do a GEO Audit](https://freeseoaudit.vercel.app/blog/how-to-do-a-geo-audit)

**[All guides →](https://freeseoaudit.vercel.app/blog)**

## What it checks

**Metadata** — title, meta description, canonical, Open Graph, Twitter Cards, viewport, charset, `lang`, favicon, robots meta

**Structured data** — parses every `application/ld+json` block, validates `@type` against 17 rich-result types, checks required + recommended fields, ISO-8601 dates, absolute URLs. Flags [`QAPage` misuse](https://freeseoaudit.vercel.app/check/jsonld.qaPage.misuse) — a Google policy violation that spread after FAQ rich results were retired in May 2026.

**Content** — H1 presence/multiplicity, heading-hierarchy skips, H1↔title alignment, image alt quality, generic anchor text, thin content, internal link count

**Crawl & indexing** — robots.txt validity, sitemap freshness, hreflang, cross-page duplicate titles/descriptions

**GEO / AEO** — llms.txt conformance, AI-crawler access, cloaking detection, JS-dependency, Island Test, direct-answer detection, comparison tables, E-E-A-T, extractability ratio

**Performance** — Core Web Vitals via PageSpeed Insights (optional key)

**Security** — HTTPS, HSTS, CSP, X-Frame-Options, Referrer-Policy, compression

## Quick start

```bash
git clone https://github.com/ravigupta0210/seo-auditor.git
cd seo-auditor
npm run install:all
npm run dev
# frontend → http://localhost:3000
# backend  → http://localhost:4000
```

Open http://localhost:3000, paste a URL, pick *single page* or *full site*, and watch results stream in over SSE.

## Architecture

```
frontend/   Next.js 15 · React 19 · App Router · TypeScript
            Landing · /audit (live SSE) · /audit/[id] (shareable report)
            /check + /check/[id] · /compare · /blog · /services
            Dynamic sitemap.xml, robots.txt, llms.txt, OG images

backend/    Node 20 · Express · TypeScript (ESM)
            SSRF-hardened fetcher · optional Playwright renderer
            robots/sitemap parsers · BFS crawler
            ~60 check rules across 7 categories
            SSE streaming + JSON API · SVG score badge
            Postgres persistence (falls back to in-memory)
```

Pipeline: `fetcher` → `renderer` → `checks/*` → `summarize` → `store`.

Every audit is scored `100 − (errors×12 + warnings×4 + info×1)`, floored at 0. Site audits blend per-page scores (70%) with site-wide checks (30%).

## Environment variables

All optional — the app degrades gracefully with none of them set.

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Backend port |
| `CORS_ORIGIN` | `*` | Frontend origin allowlist |
| `LOG_LEVEL` | `info` | pino level |
| `RENDER_JS` | unset | `1` enables Playwright JS rendering |
| `PAGESPEED_API_KEY` | unset | Enables Core Web Vitals ([free key](https://developers.google.com/speed/docs/insights/v5/get-started)) |
| `DATABASE_URL` | unset | Postgres for persistent reports; unset → in-memory, 7-day TTL |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` | Frontend → backend |
| `NEXT_PUBLIC_SITE_URL` | production URL | Canonicals, sitemap, OG |

## API

```bash
# Single-page audit (JSON)
curl "http://localhost:4000/api/audit?url=https://example.com"

# With cloaking probe + PageSpeed
curl "http://localhost:4000/api/audit?url=https://example.com&cloaking=1&perf=1"

# Live SSE stream
curl -N "http://localhost:4000/api/audit/stream?url=https://example.com"

# Full-site crawl
curl -N "http://localhost:4000/api/audit/site/stream?url=https://example.com&maxPages=25&maxDepth=2"

# Saved report
curl "http://localhost:4000/api/audit/{id}"
```

## Contributing

Adding a check is two files: a `CheckResult` in the relevant `backend/src/checks/*.ts`, and a matching entry in `frontend/lib/checks-catalog.ts` so its explainer page exists. Issues and PRs welcome — especially new GEO/AEO rules.

## License

MIT — see [LICENSE](LICENSE).
