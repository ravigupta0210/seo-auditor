# Project status — read this first

Last updated: 2026-08-24

## The one-paragraph version

This started as a free SEO/GEO audit tool chasing 1,000 visitors/day. That goal
was dropped: 1k/day on ads is worth ~$50–150/month, while 2 service clients a
month is $3,000. The tool is now the **lead magnet for a productized service
business**. The KPI is `quote_submitted`, not pageviews.

## Why traffic is zero, and what actually fixes it

Search Console: **203 "Discovered – currently not indexed", 0 "Crawled – not
indexed"**. Google has never *fetched* 203 of 205 URLs. This is a **crawl
demand** problem, not a content-quality one — an important distinction, because
it means the blog is not the blocker.

Cause: zero backlinks on a `*.vercel.app` subdomain. Crawl demand comes from
links on pages Googlebot already visits daily.

Fix, in order:
1. **Backlinks** — the entire fix. Nothing substitutes.
2. Custom domain (~$10/yr) — removes the shared-subdomain ceiling. Not bought yet.
3. Internal link graph — **done**, 48 orphans → 0.
4. Blog consolidation 178 → 65 — **not done**, and lower priority than first assumed.

Do NOT: click Request Indexing (quota ~10–12/day, doesn't raise crawl budget),
or publish more blog posts (more URLs competing for a budget of zero).

## Security incident — resolved 2026-08-21

`main` was force-pushed on **15 Aug** (commit metadata backdated to 27 Jul) with
an obfuscated 32KB payload appended to `frontend/next.config.js` — a file that
executes on every build. It read `process.env`, spawned child processes, and
exfiltrated via an Ethereum-RPC-fronted C2. It also removed `.env` from
`.gitignore` so the next `git add -A` would commit secrets.

- Vercel **did** build it (Production, 15 Aug) → treat Vercel env vars as stolen.
- Backend was never affected: Render builds only `backend/`, and zero backend
  files were touched. Supabase/Gmail/Admin secrets were not exposed by this.
- Clean history restored, branch protection on (force pushes blocked, enforced
  on admins), secret scanning + push protection on, `scripts/check-injected-code.sh`
  + CI workflow added and verified against the real payload.
- **Still unresolved:** how they got push access. Check GitHub security log for
  15 Aug ~15:10 UTC, and the EC2 boxes (all 74 commits originate from EC2).

## Done

- Quote funnel: `/quote`, `POST /api/quotes`, `quote_requests` table, owner +
  prospect emails
- `/services` + 4 tier pages, published pricing ($99 tripwire → $799 money tier)
- 2 new checks: `geo.jsRequired.*`, `jsonld.qaPage.misuse`
- Badge made spoof-proof (`?report=<id>`, server-derived score, TTL cache)
- Rate limiting on audit endpoints + 2-slot global crawl cap
- Checks catalog 19 → 67 (harvested from live engine runs, not hand-written)
- Internal link graph: 48 orphans → 0, 178 distinct "Keep reading" sets
- Tailwind v4 + shadcn wired (no preflight; tokens mapped in `--color-*`)
- Homepage: product preview, hero fixed, equal-card grid broken
- `/services`: lead tier dominant, process section added
- Dev.to post #1 live with 11 links back, canonical correct

## Next up

**UI (in progress):**
- `/check` — 67 pages, still equal-card pattern
- Audit result page — highest-intent screen, visually untouched
- Depth pass: shadows/background zones instead of flat borders

**Then:**
- Blog consolidation 178 → 65
- Free API wiring: Gemini grounding (1,500/day free — the real "is AI citing
  you" feature), CrUX, Ahrefs free DR, Cloudflare Radar
- Outreach machine (`docs/launch/` has the copy; US-only for CAN-SPAM)
- DIY guided track (Gemini free tier, offline/batched only)
- Fix-PR workflow — the thing that justifies $799

## Waiting on the user

1. Dev.to posts #2 (`how-to-block-ai-crawlers`) and #3 (`how-to-rank-in-chatgpt`)
   — text ready in `docs/launch/devto/`. Use the **v1 markdown editor**; the
   rich editor strips markdown links.
2. Awesome-list PR — copy in `docs/launch/awesome-lists.md`
3. Buy the domain (brand + a separate cold-email sending domain)
4. GitHub security log + EC2 check (see incident above)
5. Restart Claude Code to activate the shadcn MCP (`.mcp.json` is configured)

## Facts worth not re-deriving

- Google deprecated **FAQPage rich results entirely on 2026-05-07**.
- Google's own AI-optimization doc says llms.txt "will neither harm nor help".
  Ahrefs: 97% of llms.txt files get zero AI-bot fetches. The catalog copy
  reflects this — don't make it bullish again.
- Ahrefs' controlled study: schema had ~zero effect on AI citations.
- Brave Search API: no free tier since Feb 2026, and caching results is
  forbidden — incompatible with `ReportStore`. Don't wire it.
- Gemini free tier is the one genuinely useful free AI: ~1,500 grounded
  requests/day. Offline/batch only — quotas are too tight for the request path.
- rating.so runs on Ahrefs' free Domain Rating endpoint + cold outreach.
- `npm run lint` is broken (no ESLint config, drops into an interactive prompt).
  The real gates are `tsc --noEmit` (backend) and `next build`.
- Never add `revalidate` to `app/sitemap.ts` — it silently drops every JSON blog post.
- Pushing requires `gh auth switch --user ravigupta0210` (repo owner); the
  machine defaults to `ravigupta0202`.

Full business plan: `~/.claude/plans/so-in-my-current-polymorphic-whistle.md`
Launch checklist: `docs/launch/CHECKLIST.md`
