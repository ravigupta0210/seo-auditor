# Show HN draft

**Post at:** https://news.ycombinator.com/submit
**Best time:** Tue–Thu, 08:00–10:00 ET (13:00–15:00 UTC). Avoid weekends.
**Rules that matter:** Show HN titles must start with `Show HN:`. No emoji, no marketing adjectives, no "revolutionary/powerful/seamless". HN punishes hype harder than it punishes a rough product.

---

## Option A — the product angle (safe)

**Title** (80 char limit):
```
Show HN: Free SEO auditor that checks if ChatGPT and Perplexity can cite you
```

**URL:** `https://freeseoaudit.vercel.app`

**First comment** (post this immediately after submitting — it's expected, and it's where the real conversation happens):

```
I built this because every SEO tool I tried was still auditing for 2015 Google
and ignoring the thing that actually changed: a growing share of queries now get
answered by an LLM that reads your page and decides whether to quote you.

So alongside the normal checks (metadata, JSON-LD, headings, robots/sitemap,
security headers) it checks things specific to AI answer engines:

- Whether GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot can actually reach
  your pages, and whether you serve them different content than you serve
  Google (it fetches as all five UAs and diffs the body text).
- Whether your content exists at all without JavaScript. Most AI crawlers don't
  execute JS, so a client-rendered page is invisible to them regardless of
  quality. This turned out to be the highest-signal check in the whole tool.
- Whether paragraphs survive being quoted out of context — no leading "This",
  "It", "As mentioned above". An LLM retrieves a chunk, not a page.

Stack is boring on purpose: Next.js 15 static-generated frontend, Express +
cheerio backend, SSE so results stream in as each check finishes. No database
required to run it, no signup, no crawl cap. MIT.

One thing I'd genuinely like pushback on: a lot of published GEO advice does not
survive contact with evidence. Ahrefs ran a controlled study on 1,885 pages
adding schema and found the effect on AI citations was statistically zero, and
Google's own AI-optimization doc says llms.txt "will neither harm nor help".
I'm now leaning toward grading each check by evidence strength
(google-confirmed / measured / heuristic) rather than presenting folklore and
verified facts with equal confidence. Curious whether people think that's
useful or just noise.

Source: https://github.com/ravigupta0210/seo-auditor
```

---

## Option B — the build-in-public angle (higher risk, higher ceiling)

HN responds well to a specific, honest failure. This one is true and unusual.

**Title:**
```
Show HN: I built an SEO tool and Google has never crawled 203 of its 205 pages
```

**First comment:**

```
I built a free SEO + AI-search auditor. Then I opened Search Console and found
203 of 205 URLs sitting in "Discovered – currently not indexed", with
Last crawl: N/A. Not crawled and rejected. Never fetched at all.

What I got wrong: I assumed it was a content-quality judgment, because I had
published 172 blog posts in 17 batches of exactly 10 over 49 days, which is a
textbook scaled-content signature. But Google can't have judged content it never
read. The actual cause was much more boring — zero backlinks on a 3-month-old
*.vercel.app subdomain means zero crawl demand, so Google queued everything and
never came back.

The uncomfortable lesson is that all the on-page work I'd been doing was
optimizing a page nobody was fetching. Crawl demand comes from links, and
nothing else substitutes for it.

The tool itself is at https://freeseoaudit.vercel.app — free, no signup, MIT.
It checks the usual technical SEO surface plus AI-search specifics: whether
GPTBot/ClaudeBot/PerplexityBot can reach you, whether you cloak to them, and
whether your content exists without JavaScript (most AI crawlers don't run JS,
so client-rendered pages are invisible to them).

Source: https://github.com/ravigupta0210/seo-auditor
```

---

## After posting

- **Stay in the thread for the first 2–3 hours.** Reply to everything. Engagement is most of what determines whether it climbs.
- **Never ask for upvotes** anywhere. It's the fastest way to get flagged.
- Expect blunt criticism. Answer it straight; don't get defensive. HN rewards that.
- If it flops, that's normal — most Show HNs do. It still gets you crawled, which is the actual goal here.
