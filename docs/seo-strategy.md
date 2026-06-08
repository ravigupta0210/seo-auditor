# SEO + GEO growth playbook

How `freeseoaudit.vercel.app` grows. GEO-first (the winnable wedge), broad SEO as the funnel. See [audience.md](./audience.md) for who we serve.

> Honest ceiling: we are on a shared `*.vercel.app` subdomain, which Google rate-limits to fight spam. We optimize hard within that, but a ~$10/yr custom domain remains the single biggest unlock if revisited.

---

## 0. Do these in Google Search Console NOW (no code — 5 minutes)

The sitemap is healthy (live `sitemap.xml` returns 200, valid XML, 21+ URLs, fast). The "Couldn't fetch" status is **stale** — left over from before the June 5 fix (the old sitemap awaited a cold-starting backend and timed out). To force Google to re-read it:

1. **Sitemaps → ⋮ on `/sitemap.xml` → Remove**, then re-add `sitemap.xml` → **Submit**.
2. Also submit **`sitemap.xml?v=2`** as a second sitemap — Google treats the new URL as fresh and fetches immediately (the route ignores the query string).
3. **URL Inspection → Test Live URL → Request Indexing** on the homepage and top pages. (Do NOT "request indexing" the sitemap file itself — that's for pages.)
4. Status flips to "Success" with all URLs within ~1–3 days.

## 0b. Bing + IndexNow (free, feeds ChatGPT)

ChatGPT sources ~87% of live citations from Bing's top-10, so Bing visibility ≈ ChatGPT visibility.

1. Add the site to **Bing Webmaster Tools** (free) and submit the sitemap there too.
2. IndexNow is wired: key file lives at `/a3f1c9e84b7d4e2f9c6a1b5d8e0f2a47.txt`. After each deploy/publish, run:
   `cd backend && npx tsx scripts/indexnow-ping.ts` → instantly notifies Bing/Yandex of new URLs.

## 0c. Confirm the production env var

Set `NEXT_PUBLIC_SITE_URL=https://freeseoaudit.vercel.app` in Vercel project settings (canonicals, sitemap, robots, OG all derive from it; code falls back to this value but the env var is authoritative).

---

## 1. Technical foundation (shipped this round)

- **Self-canonical on every route** (`lib/seo.ts` → `pageMetadata`) — stops the random `*.vercel.app` deployment-URL duplicate-content trap.
- **Schema sitewide** (`lib/schema.ts`): BlogPosting + BreadcrumbList on posts, FAQPage on posts + comparison pages, TechArticle on checks. Validate in Google's Rich Results Test.
- **Sitemap enumerates** all blog posts + compare pages with real `lastmod`.
- **Per-post dynamic OG images** (`/blog/[slug]/opengraph-image`).
- Fixed the `og-cover.png` 404 (now points to the real `/opengraph-image`).

## 2. Keyword database

`frontend/content/keywords.json` — 8,000+ keywords (mostly long-tail), classified by intent + clustered (GEO-first). `blog-queue.json` — 400 prioritized post candidates. Regenerate: `cd backend && npx tsx scripts/keyword-research.ts` (Google Autocomplete + combinatorial; free).

Clusters: `geo`, `ai-search`, `structured-data`, `technical-seo`, `metadata`, `content-links`, `seo-basics`, `seo-careers`.

## 3. The "push 10 blogs" pipeline (hybrid; quality-gated)

Cadence is **staged**: ship a strong batch, confirm Google indexes it well, *then* ramp. 10/day of genuinely useful posts — never templated mass content (that triggers Google's scaled-content-abuse penalty).

When you say **"push 10 blogs"**:
1. `cd backend && npx tsx scripts/scaffold-blog-batch.ts 10` → draft skeletons from the queue.
2. Author the batch (Claude / a Workflow) — each post must clear the rules below.
3. `npx tsx scripts/verify-blog-batch.ts` → hard quality gate (fails the batch if any rule is unmet).
4. Commit, deploy, then `npx tsx scripts/indexnow-ping.ts`.

### Per-post quality rules (what ranks + gets cited)
- **Answer-first**: a TL;DR + first paragraph that directly answers the title, with a number/named source (the LLM-citation extraction zone). Keyword in the title **and** first paragraph.
- **Island Test**: section openers + every FAQ/PAA answer stand alone (named subject, no back-references) so AI engines can lift them.
- **≥3 internal links** (topic-cluster funneling) — always link the audit tool `/`.
- **A visual**: an inline-SVG flowchart and/or comparison table (LLMs cite tables heavily). No raster assets needed.
- **FAQ + People-also-ask** blocks, emitted as FAQPage schema.
- **Unique** title + meta description; 900–1400 words.

## 4. Internal-link funneling

Hub-and-spoke topic clusters (`lib/internal-links.ts`): pillar pages (e.g. "What is GEO") link to spokes and back; every post surfaces related posts + a "people also search for" internal-link block. Goal: every page within ~3 clicks of the homepage, authority concentrated per cluster.

## 5. GEO domination layer

- Answer-first openings on homepage, `/check`, and pillar posts.
- Keep all AI crawlers allowed (`robots.ts`) + SSG (already true).
- Curated `llms.txt` (do NOT dump every URL — it's one of our own audit checks).
- Publish fresh + ping IndexNow → target Perplexity first (recency bias), then ChatGPT (Bing), then AI Overviews.

## 6. Authority / off-page (the slow, decisive lever)

- Promote the embeddable **score badge** (`/api/badge`) — every embed is a backlink.
- Launch on **Product Hunt, Show HN, dev.to, r/SEO** (README roadmap).
- Build a linkable **"State of GEO" data report** from aggregate audit data.
- One niche-relevant editorial link beats 50 directory links.

## 7. Measurement loop

- Watch GSC Coverage + Performance weekly; gate the 10/day ramp on healthy indexing.
- **Next upgrade:** wire the GSC API — your real impression/query data is the best free keyword source and beats autocomplete guessing.
- Manually check ChatGPT/Perplexity for citations on target queries every few weeks.

## Realistic expectations

- **Winnable #1 (weeks–months):** GEO/AEO long-tail + mid terms; AI citations in ~4–8 weeks (Perplexity first).
- **Not soon:** head terms like "SEO audit"/"SEO checker" — multi-year, backlink-driven, harder on `vercel.app`.
