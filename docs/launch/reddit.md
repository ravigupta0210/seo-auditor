# Reddit drafts

Reddit is the highest-crawl-frequency place you can post, but it is also the easiest to get wrong. Read this before posting anything.

## Rules that will get you removed

- **Never post the same text to multiple subreddits.** Reddit's spam filter catches it and it reads as spam to humans too. Each post below is written differently on purpose.
- **Check each sub's self-promo rule first.** r/SEO requires you to be an active participant, not a drive-by. Comment on other people's threads for a few days before posting your own.
- **Lead with the useful thing, not the link.** A post that only exists to carry a URL gets buried.
- **Use your real account.** A fresh account posting a link is auto-removed nearly everywhere.
- **Space the posts out** — one subreddit per day, not four in an hour.

---

## r/SEO — the data angle

r/SEO is allergic to tool promotion but loves contrarian evidence. Lead with the finding.

**Title:**
```
Ahrefs tested 1,885 pages adding schema — the effect on AI citations was statistically zero
```

**Body:**
```
I've been building a GEO/AEO audit tool, which meant reading everything
published about getting cited by AI. A lot of it does not hold up.

Three things I had to change my mind about:

1. Ahrefs ran a difference-in-differences study on 1,885 pages that added
   JSON-LD against 4,000 matched controls. AI Mode +2.4%, ChatGPT +2.2% — both
   indistinguishable from zero. AI Overviews came out at -4.6%.

2. Google published an explicit AI-optimization doc that says llms.txt and
   special markup "will neither harm nor help your site's visibility", and that
   there is "no requirement to break your content into tiny pieces for AI".
   Ahrefs separately found 97% of llms.txt files got zero AI-bot fetches.

3. FAQPage rich results were fully deprecated on 7 May 2026 — removed from the
   structured data gallery entirely, not just restricted like 2023. A lot of
   recovery advice since then says "switch FAQPage to QAPage", which is an
   actual policy violation: Google's docs say verbatim "Don't use QAPage markup
   for FAQ pages or pages where there are multiple questions per page."

The thing that does seem to hold up is much more boring: content has to exist in
the raw HTML. Most AI crawlers don't execute JavaScript, so a client-rendered
page is invisible to them no matter how good it is.

Has anyone here actually measured a schema → AI citation effect on their own
sites? I'd genuinely like a counter-example, because the vendor claims
(40% more citations, 3.2x more AI Overviews) have no published methodology I
could find.
```

Mention the tool **only if someone asks** what you're building. Then link it plainly.

---

## r/juststart — the honest failure angle

This sub rewards transparency about what went wrong.

**Title:**
```
203 of my 205 pages are "Discovered – currently not indexed". Here's what I got wrong.
```

**Body:**
```
Posting this because I misdiagnosed it for weeks and the distinction matters.

Setup: new site, ~3 months old, on a *.vercel.app subdomain. I published 172
blog posts in 17 batches of 10 over 49 days. Search Console shows 2 indexed,
203 not indexed.

My first assumption was scaled-content-abuse — the publishing pattern looks
exactly like a content farm, so I figured Google read them and rejected them.

Then I actually looked at the breakdown:

  Discovered – currently not indexed : 203
  Crawled - currently not indexed    : 0

Zero crawled. URL inspection confirms Last crawl: N/A. Google never fetched a
single one of them. It cannot have judged content it never read.

The real cause is crawl demand. Zero backlinks on a brand-new shared subdomain
means Google has no reason to spend crawl budget, so it discovered everything
from the sitemap and queued it indefinitely.

What I'd tell past me:

- "Discovered" and "Crawled" not-indexed are completely different problems.
  Discovered = nobody links to you. Crawled = your content wasn't worth it.
- Request Indexing does nothing for this. It's ~10-12/day and it doesn't raise
  crawl budget.
- Publishing more posts actively makes it worse. More URLs competing for a
  budget of zero.
- A free platform subdomain is a real handicap, not a rounding error.

Now doing the unglamorous thing: getting actual links, and cutting the post
count instead of growing it.
```

---

## r/SideProject or r/webdev — the build angle

Softer audience, self-promo is fine here if the post has substance.

**Title:**
```
I built a free SEO auditor that checks whether ChatGPT and Perplexity can cite your site
```

**Body:**
```
Free, no signup, no crawl cap, MIT licensed: https://freeseoaudit.vercel.app

The angle is AI search rather than classic SEO. Alongside normal checks
(metadata, JSON-LD, headings, robots/sitemap, security headers) it looks at:

- whether GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot can reach you, and
  whether you serve them different content than Google (it fetches as all five
  user-agents and diffs the body text)
- whether your content exists without JavaScript — most AI crawlers don't run
  JS, so a client-rendered page is invisible to them
- whether paragraphs survive being quoted out of context

Stack: Next.js 15 (fully static-generated), Express + cheerio, SSE so results
stream in as each check completes. No DB needed to run it locally.

Source: https://github.com/ravigupta0210/seo-auditor
Happy to answer anything about the crawler or the check rules.
```

---

## Order and timing

| Day | Sub | Angle |
|---|---|---|
| 1 | r/SideProject | Build angle — friendliest, lowest risk |
| 3 | r/juststart | Honest failure |
| 5 | r/webdev | Build angle, reworded |
| 7+ | r/SEO | Data angle — only after you've commented in the sub a few times |

Reply to every comment for the first few hours. That's what keeps a post alive.
