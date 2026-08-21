# Awesome-list submissions

These are curated GitHub lists. Googlebot crawls popular ones constantly, the links are real, and an MIT-licensed open-source tool genuinely qualifies — this is not a growth hack, you belong on them.

**Before you submit anything:** read that repo's `CONTRIBUTING.md`. Every list has its own format rules and maintainers close PRs that ignore them.

---

## Step 0 — make the repo presentable first

A maintainer will look at your repo before merging. Right now it has 1 star, 0 topics and no description beyond the default. Fix that first (2 minutes, see `CHECKLIST.md` step 1) or your PR gets rejected on sight.

---

## Target lists

| List | Repo | Fit | Notes |
|---|---|---|---|
| **Awesome SEO** | `marcobiedermann/search-engine-optimization` | Strong | The big one. Has a "Tools" section. |
| **Awesome Selfhosted** | `awesome-selfhosted/awesome-selfhosted` | Good | You qualify — MIT, self-hostable, no mandatory SaaS. Strict format; read CONTRIBUTING. |
| **Awesome Next.js** | `unicodeveloper/awesome-nextjs` | Good | Under "Open Source Projects / Apps". |
| **Awesome Node.js** | `sindresorhus/awesome-nodejs` | Moderate | Very high bar. Try after you have some stars. |
| **Public APIs** | `public-apis/public-apis` | Weak | Only if you document the audit API as a public endpoint. Skip for now. |

---

## Entry text

Most lists want one line: `[Name](url) - Description.` — note the single hyphen and the trailing period. Match the surrounding entries exactly.

**Awesome SEO** (Tools section):
```
- [SEO Auditor](https://freeseoaudit.vercel.app) - Free SEO, JSON-LD and AI-search (GEO/AEO) audit for any URL. Checks whether GPTBot, ClaudeBot and PerplexityBot can reach and cite your pages. No signup.
```

**Awesome Selfhosted** (format is stricter — language and license are required):
```
- [SEO Auditor](https://freeseoaudit.vercel.app) - SEO, structured-data and AI-search (GEO) auditor for any website, with a copy-paste fix for every finding. ([Source Code](https://github.com/ravigupta0210/seo-auditor)) `MIT` `Node.js`
```

**Awesome Next.js**:
```
- [SEO Auditor](https://github.com/ravigupta0210/seo-auditor) - Free SEO + AI-search auditor built with Next.js 15 App Router, streaming results over SSE.
```

---

## PR description template

```
Adds SEO Auditor to the Tools section.

It's a free, MIT-licensed SEO + structured-data auditor with a focus on
AI-search (GEO/AEO) — it checks whether AI crawlers like GPTBot, ClaudeBot and
PerplexityBot can reach a site, detects cloaking to those user-agents, and
flags content that only renders with JavaScript (which AI crawlers can't read).

No signup, no paywall, no crawl cap. Runs locally with `npm run dev`.

Live: https://freeseoaudit.vercel.app
Source: https://github.com/ravigupta0210/seo-auditor

I've followed the contribution guidelines: entry is alphabetised within its
section, uses the required format, and the project is open source under MIT.
```

Adjust that last line to whatever the list actually requires.

---

## Realistic expectations

Popular lists get a lot of PRs and maintainers are volunteers. Expect **days to weeks**, and expect one or two to be closed without comment. Submit to all of them; treat any merge as a win. Do not chase maintainers.
