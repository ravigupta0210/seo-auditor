# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A free, no-signup SEO + JSON-LD + metadata + **GEO/AEO** (Generative Engine Optimization / AI-search) auditor for any URL. The GEO pillar — llms.txt conformance, AI-crawler cloaking detection, "Island Test" paragraph scoring, E-E-A-T signals — is the deliberate differentiator vs. classic SEO tools. There is no auth, no database, and no paywall by design; revenue is planned via affiliate links and ads.

> Note: the parent directory's `CLAUDE.md` (`/Users/ravigupta/personal-project/CLAUDE.md`) describes an unrelated Jira-clone idea and does **not** apply to this repo. This file governs.

## Commands

Run from the repo root unless noted. This is an npm-workspaces-style layout but the root `package.json` shells into each subdir rather than using workspace protocol.

```bash
npm run install:all   # install root + backend + frontend deps (first-time setup)
npm run dev           # concurrently runs backend (:4000) + frontend (:3000)
npm run build         # builds backend (tsc) then frontend (next build)
npm run lint          # backend `tsc --noEmit` + frontend `next lint`
```

Single-side dev: `npm run dev:backend` / `npm run dev:frontend`.

There is **no unit test runner**. "Tests" are standalone Playwright/E2E scripts in `backend/scripts/*.ts` (e.g. `e2e-test.ts`, `verify-crawl.ts`). Run one with `cd backend && npx tsx scripts/e2e-test.ts`. They hit a running backend and/or drive a browser, so start `npm run dev` first.

`lint` is the closest thing to a typecheck/CI gate — run it before considering work done.

## Architecture

Two independently deployed apps. The frontend never imports backend code; they share shapes only by hand-mirrored TypeScript interfaces (`backend/src/types/check.ts` ↔ `frontend/lib/api.ts`). **If you change `CheckResult` / `AuditReport` shape, update both sides.**

### Backend (`backend/`, Node 20 + Express, ESM)

Pipeline for an audit: `fetcher` → `renderer` → `checks/*` → `summarize` → `store`.

- **`crawler/fetcher.ts`** — the only thing that touches the network for target sites. Always goes through `lib/ssrf.ts` `assertPublicHostname()` first (DNS-resolves and rejects private/loopback/link-local IPs — **never bypass this for user-supplied URLs**). Exposes `AI_USER_AGENTS` (GPTBot, ClaudeBot, PerplexityBot, etc.) used for cloaking probes.
- **`crawler/renderer.ts`** — wraps the fetcher. With `RENDER_JS=1` it lazy-imports Playwright (via a non-statically-resolvable `import()` so the project builds without playwright installed) and renders JS; otherwise and on any failure it falls back to raw fetch. Default is raw fetch.
- **`crawler/crawl.ts`** — BFS multi-page crawler, seeded by sitemap URLs, bounded by `maxPages`/`maxDepth`, respects robots.txt.
- **`checks/*.ts`** — one module per category (`metadata`, `jsonld`, `content`, `security`, `crawl`, `performance`, `geo`). Each exports `runXChecks(...)` returning `CheckResult[]`. This is where almost all domain logic lives and where new audit rules go.
- **`routes/audit.ts`** — the orchestrator. Three response modes over the same check pipeline: SSE stream (`/stream`, `/site/stream`), one-shot JSON (`/`), and report retrieval (`/:id`). Also holds `summarize()`/`summarizeSite()` scoring and `crossPageChecks()` (site-wide dup-title/description detection). `RULE_VERSION` is stamped on every check here.
- **`lib/store.ts`** — `ReportStore` interface with an in-memory `Map` impl (7-day TTL, 500-report cap). Reports are **not persistent** — they vanish on restart. Swap-in point for Postgres/Supabase (see roadmap); preserve the interface.
- **`routes/badge.ts`** — generates an embeddable SVG score badge.

**Scoring model** (`routes/audit.ts`): each check has a `severity` (`error`/`warning`/`info`/`pass`) and a `priority`. Overall score = `100 − (errors×12 + warnings×4 + info×1)`, floored at 0. Site audits average per-page scores (70%) with site-wide checks (30%) so one repeated error across 25 pages doesn't zero the score.

### Frontend (`frontend/`, Next.js 15 App Router + React 19, TypeScript)

- Consumes the backend purely over HTTP. `lib/api.ts` holds the typed client + `grade()`/`sevColor()` helpers; `BACKEND_URL` comes from `NEXT_PUBLIC_BACKEND_URL`.
- **Live audit (`app/audit/_view.tsx`)** is a client component using the browser `EventSource` API against the SSE endpoints, accumulating `check` events into state as they stream. `app/audit/[id]/page.tsx` renders a saved report by id.
- Heavy on **programmatic SEO**: `/check/[id]` (per-check explainers driven by `lib/checks-catalog.ts` — a static mirror of every check, so pages are indexable before any audit runs), `/compare/[slug]`, `/blog/[slug]`. Dynamic `sitemap.ts`, `robots.ts`, `manifest.ts`, and OG/icon image routes use Next file conventions.
- Security headers + CSP and a PostHog analytics reverse-proxy (`/ingest/*` rewrites, to dodge ad-blockers) live in `next.config.js`. If you add an external script/origin, update the CSP `script-src`/`connect-src` there or it will be blocked.

## Deployment

- **Frontend → Vercel** (`frontend/vercel.json`). Set `NEXT_PUBLIC_BACKEND_URL` in project settings.
- **Backend → Render free tier** (`backend/render.yaml`). The free tier **cold-starts (~30s+)** after idling — this is why server-side fetches to the backend (e.g. `listRecentReports`) use a short `AbortController` timeout and degrade gracefully rather than blocking SSR. Keep that pattern for any new SSR→backend call.
- Playwright is not installed on Render free tier (RAM); `RENDER_JS=0` there.

## Conventions

- Backend is **ESM** — relative imports must use the `.js` extension (e.g. `import { logger } from '../lib/logger.js'`) even though the source is `.ts`.
- All inbound query params are validated with **zod** schemas at the route boundary.
- Logging is **pino** (`lib/logger.ts`), with per-request child loggers (`logger.child({ auditId, url })`). Don't `console.log`.
- A new audit rule = add a `CheckResult` in the relevant `checks/*.ts` **and** a matching catalog entry in `frontend/lib/checks-catalog.ts` so its explainer page exists.
