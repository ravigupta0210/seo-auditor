# SEO Auditor

Free, comprehensive SEO + JSON-LD + metadata + GEO/AEO auditor for any website. No signup, no paywall, no crawl cap. Built for the AI-search era.

## What it checks

### Classic SEO (Google starter guide coverage)
- **Metadata** — title, meta description, canonical, Open Graph, Twitter Cards, viewport, charset, lang, favicon, robots meta
- **Content** — H1 presence + multiplicity, heading hierarchy skips, H1/title alignment, image alt text quality, generic anchor text, thin content, internal link count
- **Crawl & indexing** — robots.txt validity, sitemap.xml freshness, hreflang annotations, duplicate titles/descriptions across pages
- **Performance** — optional PageSpeed Insights integration for Core Web Vitals (LCP, INP, CLS) — set `PAGESPEED_API_KEY`
- **Security** — HTTPS, HSTS, CSP, X-Frame-Options, Referrer-Policy, compression

### Structured data
- Parses every `<script type="application/ld+json">` block
- Validates schema.org `@type` against 16+ rich-result types (Article, Product, Recipe, Event, etc.)
- Checks required + recommended fields per type (Google rich-result spec)
- ISO 8601 date format validation
- Absolute URL validation for `image`, `url`, `sameAs`, `logo`
- Catches the 78% of structured-data errors that are JSON syntax

### GEO / AEO (the differentiator)
- `/llms.txt` presence + spec conformance ([llmstxt.org](https://llmstxt.org/))
- AI-crawler accessibility — fetches the page as GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended and compares content hashes for cloaking
- AI-crawler directives in robots.txt
- Island Test paragraph scoring (subject explicit, no anaphora, ≤80 words, factual tone)
- Direct-answer detection in opening 200 words
- Comparison-table detection (LLMs cite tables heavily)
- E-E-A-T signals — author byline + Person schema
- Citation outbound to authoritative TLDs
- Text-to-HTML extractability ratio

### Multi-page (full-site crawl)
- BFS from homepage seeded by sitemap.xml
- Configurable max pages + depth
- Respects robots.txt
- Cross-page duplicate detection (titles, descriptions)
- All single-page checks run per crawled URL

## Architecture

```
frontend/   Next.js 15 + TypeScript + App Router
            - Landing, /audit (live SSE view), /audit/[id] (shareable report)
            - /check (all-checks index), /check/[id] (per-check explainer)
            - /compare (tool comparisons), /blog (long-form posts)
            - Dynamic /sitemap.xml, /llms.txt, /robots.txt

backend/    Node 20 + Express + TypeScript
            - SSRF-hardened fetcher, optional Playwright JS renderer
            - sitemap/robots parsers, BFS crawler
            - 40+ check rules across 8 categories
            - SSE streaming + JSON endpoints
            - In-memory report store (7-day TTL; Postgres swap-in ready)
            - SVG badge endpoint for distribution
```

## Quick start

```bash
cd seo-auditor
npm install
npm run dev
# → http://localhost:3000  (frontend)
# → http://localhost:4000  (backend API)
```

Try it:
- Open http://localhost:3000
- Enter a URL (e.g. `example.com`)
- Choose "Single page" or "Full site"
- Watch results stream in live

## Environment variables

All optional — sensible defaults for local dev:

| Var | Default | Purpose |
|---|---|---|
| `PORT` | 4000 | Backend port |
| `CORS_ORIGIN` | `*` | Frontend origin allowlist |
| `LOG_LEVEL` | `info` | pino log level |
| `RENDER_JS` | unset | Set to `1` to enable Playwright JS rendering (requires `npm i playwright && npx playwright install chromium`) |
| `PAGESPEED_API_KEY` | unset | Enables Core Web Vitals checks via PageSpeed Insights ([free key](https://developers.google.com/speed/docs/insights/v5/get-started)) |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` | Frontend → backend URL |
| `NEXT_PUBLIC_SITE_URL` | `https://example.com` | Used in sitemap, OG tags |
| `NEXT_PUBLIC_ADS_ENABLED` | unset | Set to `1` once Carbon/EthicalAds is approved |

## API

### Single-page audit (JSON)
```bash
curl "http://localhost:4000/api/audit?url=https://example.com"
curl "http://localhost:4000/api/audit?url=https://example.com&cloaking=1&perf=1"
```

### Single-page audit (live SSE stream)
```bash
curl -N "http://localhost:4000/api/audit/stream?url=https://example.com"
```

### Full-site crawl (SSE stream)
```bash
curl -N "http://localhost:4000/api/audit/site/stream?url=https://example.com&maxPages=25&maxDepth=2"
```

### Retrieve a saved report
```bash
curl "http://localhost:4000/api/audit/{id}"
```

### SVG badge (for users to embed on their sites)
```bash
http://localhost:4000/api/badge?score=92&host=example.com
```

## Deployment

### Frontend (Vercel — free tier)
```bash
cd frontend
vercel
```
Set `NEXT_PUBLIC_BACKEND_URL` in Vercel project settings.

### Backend (Render.com — free worker tier)
1. Push this repo to GitHub
2. Create a new Web Service on Render pointing to `backend/`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Environment: Node 20

For Playwright on Render free tier, you will need a Docker setup:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.48.0-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci --workspaces --include-workspace-root --workspace=backend
COPY backend ./backend
RUN npm --workspace backend run build
EXPOSE 4000
CMD ["npm", "--workspace", "backend", "start"]
```

## Monetization (planned)

Per the project plan, this stays 100% free forever. Revenue comes from:
1. **Affiliate** — Ahrefs, SEMrush, Surfer, Cloudflare etc. linked from "what we cannot show" footer and `/compare` pages
2. **Display ads** — Carbon Ads or EthicalAds (set `NEXT_PUBLIC_ADS_ENABLED=1`)
3. **Sponsored placements** — once traffic crosses ~50k monthly visitors
4. **GitHub Sponsors** — wired into the footer
5. **Lead generation** — referrals to vetted SEO agencies (later)

## Roadmap

- [x] Phase 1 — backbone (metadata + JSON-LD)
- [x] Phase 2 — crawl + persistence (sitemap/robots/BFS, optional Playwright)
- [x] Phase 3 — content, crawl, performance, security checks
- [x] Phase 4 — GEO/AEO pillar (llms.txt, cloaking, Island Test, E-E-A-T)
- [x] Phase 5 — programmatic SEO pages (per-check, comparisons, blog, badges, sitemap)
- [x] Phase 6 — monetization hooks (affiliate, ads slot, footer, GitHub Sponsors)
- [ ] Phase 7 — production deploy (Vercel + Render)
- [ ] Phase 8 — launch (Product Hunt, Show HN, dev.to)
- [ ] Phase 9 — Supabase persistence + email signup for crawl history
- [ ] Phase 10 — quarterly "State of GEO" data report

## License

MIT.
