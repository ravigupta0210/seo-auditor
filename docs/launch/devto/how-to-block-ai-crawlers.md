---
title: How to Block AI Crawlers (and When You Shouldn't) in 2026
published: false
description: How to block AI crawlers like GPTBot, ClaudeBot, and CCBot in robots.txt — plus the trade-off between blocking training bots and the live-search bots that cite you.
tags: ai, seo, webdev, programming
canonical_url: https://freeseoaudit.vercel.app/blog/how-to-block-ai-crawlers
---

> **TL;DR** — To block AI crawlers, add User-agent rules in robots.txt disallowing GPTBot, ClaudeBot, CCBot, PerplexityBot, and Google-Extended. But block selectively: training crawlers like GPTBot take your content, while live-search bots like OAI-SearchBot can send you citation traffic.

## How to block AI crawlers in robots.txt

The short answer to how to block AI crawlers is that you add `User-agent` and `Disallow` rules to the robots.txt file at the root of your domain, naming each bot you want to keep out. The fastest way to block the major ones is a single robots.txt block that names GPTBot (OpenAI), ClaudeBot (Anthropic), CCBot (Common Crawl), PerplexityBot, and Google-Extended (Google's AI training opt-out token). Place the file at `https://yourdomain.com/robots.txt`, and reputable AI companies will honor the directives within a day or two of their next crawl.

Here is a copy-paste robots.txt that blocks the main training and scraping bots while leaving normal search engines untouched:

```
# Block AI training + scraping crawlers
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: anthropic-ai
Disallow: /

# Everyone else (Googlebot, Bingbot, humans) allowed
User-agent: *
Disallow:
```

One critical caveat before you ship that file: **robots.txt is a request, not a wall.** It works because well-behaved companies choose to obey it. It does not stop bots that ignore the standard, and it does not block scrapers using fake or rotating user-agent strings. If you need enforcement, you pair robots.txt with firewall or WAF rules. For the protocol fundamentals, see [what is robots.txt](https://freeseoaudit.vercel.app/blog/what-is-robots-txt).

## The honest trade-off: training bots vs. live-search bots

The hard part of blocking AI crawlers is that "AI crawler" is two very different jobs wearing one label. Some bots scrape your content to train a model — you get nothing back. Other bots fetch your page in real time to answer a live user question, and they cite you with a clickable link. Block the first kind and you lose nothing. Block the second kind and you cut off a growing source of referral traffic.

The clearest example is OpenAI's split fleet. **GPTBot** crawls the open web to gather training data for future models. **OAI-SearchBot** fetches pages live to power ChatGPT's search and inline citations. They are separate user-agents on purpose — so you can block training while keeping search. The same pattern shows up across vendors: training crawlers take, live-search crawlers cite.

> If a bot puts a link back to your site in front of a user, blocking it is usually a mistake. If a bot only feeds a training corpus you'll never be credited in, blocking it costs you nothing.

So the strategy most sites land on is not "block everything" or "allow everything" — it's a deliberate allowlist. Block the pure-training and bulk-scraping bots; allow the live-search and answer bots that can drive clicks. We walk through the exact allow/block split — and how to earn citations from the bots you keep — in [how to get cited by Claude](https://freeseoaudit.vercel.app/blog/how-to-get-cited-by-claude).

## The AI crawler cheat sheet: who's who

Below is the lookup table for the crawlers worth caring about in 2026, what each one does, and the default recommendation. "Block" means it mostly takes for training with no citation upside. "Allow" means it can send you traffic. "Your call" means it depends on whether you want your content used for AI features at all.

A few notes the table can't hold: **Google-Extended** is not a crawler — it's a token Googlebot reads to decide whether your content trains Gemini and feeds AI features. Blocking it does NOT remove you from Google Search or AI Overviews; it only opts you out of model training. **CCBot** belongs to Common Crawl, a nonprofit archive that many AI labs train on indirectly, so blocking it quietly cuts off several downstream models at once.

## Step-by-step: deciding what to block

Don't copy a random robots.txt from a forum. The right answer depends on whether you sell content, want AI citations, or just want to stop bandwidth-eating scrapers. Walk the decision below before you write a single `Disallow` line.

After you publish your rules, verify they actually parse and that you haven't accidentally blocked Googlebot or your own sitemap. A typo like a stray `Disallow: /` under `User-agent: *` can deindex your whole site. Run your domain through our [free SEO + GEO audit](https://freeseoaudit.vercel.app/) to confirm your robots.txt is valid and to see which AI bots you're currently allowing or blocking — the [AI bots blocked check](https://freeseoaudit.vercel.app/check/geo.aibots.blocked) flags this specifically.

If you decide you want AI engines to find AND cite you (the opposite of blocking), the next lever is answer-first content built for AI engines — covered in [how to do AI search optimization](https://freeseoaudit.vercel.app/blog/how-to-do-ai-search-optimization) and [what is generative engine optimization](https://freeseoaudit.vercel.app/blog/what-is-generative-engine-optimization).

## Does blocking AI crawlers hurt your SEO?

Blocking AI crawlers does not hurt traditional SEO, because the user-agents you block for AI (GPTBot, ClaudeBot, CCBot, PerplexityBot, Google-Extended) are separate from the search crawlers that index you (Googlebot, Bingbot). You can block every training bot and keep your full Google ranking — they read different rules. The robots.txt above is explicitly built so `Googlebot` and `Bingbot` fall under the permissive `User-agent: *` line.

Where it gets nuanced is **AI search visibility**, which is a newer, separate channel from blue-link SEO. Blocking the live-search bots — OAI-SearchBot, PerplexityBot, ClaudeBot's user-facing fetches — means you won't appear as a cited source in ChatGPT, Perplexity, or Claude answers. That doesn't dent your Google rank, but in 2026 a meaningful slice of discovery happens inside AI answers, and a blocked site simply isn't eligible to be cited.

So frame the decision honestly: blocking AI crawlers protects your content from uncredited training use at the cost of AI-answer visibility. If your business depends on being the source AI tools quote, block training bots only. If your content is your product (paywalled news, courses, proprietary research), blocking broadly is the rational defensive move. There's no universally correct answer — only the right answer for your model.

**Major AI crawlers in 2026: what each does and whether to block it**

| Bot (User-agent) | Owner | What it does | Default call |
| --- | --- | --- | --- |
| GPTBot | OpenAI | Crawls the web to train future GPT models | Block (training only) |
| OAI-SearchBot | OpenAI | Fetches pages live for ChatGPT search + citations | Allow (sends traffic) |
| ClaudeBot | Anthropic | Crawls for training and live answer fetches | Your call |
| PerplexityBot | Perplexity | Live retrieval for cited Perplexity answers | Allow (sends traffic) |
| Google-Extended | Google | Opt-out token for Gemini training + AI features | Your call (no SEO impact) |
| CCBot | Common Crawl | Bulk archive many AI labs train on indirectly | Block (training only) |
| Bytespider | ByteDance | Aggressive scraping for training | Block |

## FAQ

### Does blocking Google-Extended remove me from Google Search?

No. Google-Extended is a token that only controls whether your content trains Gemini and feeds Google's AI features. Blocking it leaves your normal Google Search and AI Overviews presence fully intact, because Googlebot reads a different set of rules. It is purely a training opt-out, not a search opt-out.

### How do I block all AI crawlers at once?

There is no single wildcard for AI crawlers, so you must name each user-agent in robots.txt with its own Disallow rule — GPTBot, ClaudeBot, CCBot, PerplexityBot, Google-Extended, and others. A `User-agent: *` block would also catch Googlebot and Bingbot, which would damage your search rankings. List the AI bots explicitly and keep the wildcard rule permissive.

### Can I block AI training but still get cited in AI search?

Yes, and that is the recommended setup for most sites. Block the training-only bots like GPTBot and CCBot while allowing the live-search bots like OAI-SearchBot and PerplexityBot that fetch pages to answer queries and cite you. This protects your content from uncredited training use while keeping you eligible for AI-answer citations.

---

*Originally published at [freeseoaudit.vercel.app/blog/how-to-block-ai-crawlers](https://freeseoaudit.vercel.app/blog/how-to-block-ai-crawlers). I build [a free SEO + AI-search (GEO) auditor](https://freeseoaudit.vercel.app) — no signup, no paywall, [open source](https://github.com/ravigupta0210/seo-auditor). You can [run it on your own site](https://freeseoaudit.vercel.app) or [browse every check it performs](https://freeseoaudit.vercel.app/check).*
