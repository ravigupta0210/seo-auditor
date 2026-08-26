---
title: "How to Do a GEO Audit (Free Step-by-Step 2026 Guide)"
published: false
description: "A GEO audit checks whether AI engines like ChatGPT and Perplexity can cite your site. Follow this free step-by-step 2026 guide and run every check in seconds."
tags: seo, ai, webdev, programming
canonical_url: https://freeseoaudit.vercel.app/blog/how-to-do-a-geo-audit
---

> **TL;DR** — A GEO audit is a 6-step check of whether AI answer engines can crawl, parse, and cite your pages: llms.txt, AI-crawler access, answer-first structure, the Island Test, FAQ schema, and E-E-A-T. The free SEO Auditor at the homepage runs all six in one pass in under 30 seconds.

## What is a GEO audit?

A GEO audit is a systematic check of whether AI answer engines, such as ChatGPT, Perplexity, Google AI Overviews, and Microsoft Copilot, can find your content, understand it, and cite it inside the answers they generate. Where a classic SEO audit asks *"will Google rank this page?"*, a GEO audit asks *"if an AI is composing a 120-word answer, can it extract a clean, quotable, attributable claim from my page?"* The two questions overlap but are not the same, and a page can pass an SEO audit while failing a GEO audit completely.

A GEO audit inspects six things: an `llms.txt` file that guides AI crawlers, robots and crawler-access rules that allow AI bots, answer-first content structure, the Island Test (does each passage stand alone?), FAQ and other structured data, and visible E-E-A-T signals like a named author. Each of these is a binary or near-binary signal that an AI either can or cannot use.

You can run a GEO audit by hand, but most of the checks are machine-readable, which is exactly why the free [SEO Auditor homepage tool](https://freeseoaudit.vercel.app/) automates all six. Paste a URL, and it returns each GEO check with a pass/fail and a fix. The rest of this guide walks through what each step looks for and why it matters.

## The 6 steps of a GEO audit

A GEO audit follows six steps in order, from machine access to human-trust signals. The first three decide whether an AI can reach and read your page at all; the last three decide whether it will trust and quote it. Skip an early step and the later ones do not matter, because a page an AI crawler cannot fetch will never be cited no matter how well it is written.

Run the steps top to bottom. Below is what each step checks and the single most common failure SEO Auditor flags for it.

## Steps 1-3: Can an AI reach and read your page?

**Step 1: llms.txt.** An `llms.txt` file is a plain-text file at your domain root that points AI systems to your most important, most quotable pages. In practice it is one of the gaps a GEO audit flags most often, because few sites publish one yet. A GEO audit checks whether `/llms.txt` exists and is reachable; if it is absent, SEO Auditor flags [llms.txt missing](https://freeseoaudit.vercel.app/check/geo.llmsTxt.missing). For the wider strategy, see [what is generative engine optimization](https://freeseoaudit.vercel.app/blog/what-is-generative-engine-optimization).

**Step 2: AI-crawler access.** AI engines use named bots, GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot, to fetch pages. A GEO audit reads your `robots.txt` and checks that these bots are not blocked. Many sites accidentally block them with a broad `Disallow: /` or a stray AI-bot rule; SEO Auditor surfaces this as [AI bots blocked](https://freeseoaudit.vercel.app/check/geo.aibots.blocked). To decide which to allow on purpose, read [how to block AI crawlers](https://freeseoaudit.vercel.app/blog/how-to-block-ai-crawlers).

> Rule of thumb: if you want citations, AI crawlers must be allowed. Blocking them is a valid choice only if you also accept being invisible in AI answers.

**Step 3: Answer-first structure.** AI engines extract the passage that most directly answers a query, usually the first sentence or two after a heading. A GEO audit checks whether your pages lead with a direct answer instead of a throat-clearing intro. A page that buries the answer under 200 words of preamble gives the AI nothing clean to lift; SEO Auditor flags this as [direct answer missing](https://freeseoaudit.vercel.app/check/geo.directAnswer.missing).

## Steps 4-6: Will an AI trust and quote your page?

**Step 4: The Island Test.** The Island Test asks whether each passage on your page makes sense if an AI lifts it out and drops it into an answer with zero surrounding context. A passage that starts with "This is why it matters" fails, because "this" points at something the AI did not copy. A passage that names its subject and states a complete fact passes. A GEO audit scans for context-dependent openers and pronoun-led sentences; SEO Auditor reports a [weak Island Test](https://freeseoaudit.vercel.app/check/geo.islandTest.weak). For more on how AI selects what to quote, see [what are AI citations](https://freeseoaudit.vercel.app/blog/what-are-ai-citations).

**Step 5: FAQ and structured data.** Structured data, especially FAQPage schema, hands AI engines pre-packaged question-and-answer pairs that are trivial to extract and cite. A GEO audit checks for valid JSON-LD and FAQ markup. Missing or malformed schema is a frequent miss; see [how to add FAQ schema](https://freeseoaudit.vercel.app/blog/how-to-add-faq-schema) and [what is schema markup](https://freeseoaudit.vercel.app/blog/what-is-schema-markup) for the exact shape.

**Step 6: E-E-A-T.** AI engines prefer sources that show experience, expertise, authoritativeness, and trust, and the cheapest visible signal is a named author with a real byline. A GEO audit checks for an author entity; a missing one is flagged as [author missing](https://freeseoaudit.vercel.app/check/geo.eeat.author.missing). Read [what is E-E-A-T in SEO](https://freeseoaudit.vercel.app/blog/what-is-eeat-in-seo) for the wider picture.

## How to run a GEO audit free in 30 seconds

Running a GEO audit by hand means opening `robots.txt`, hunting for `llms.txt`, validating schema, and eyeballing every passage for the Island Test, which is slow and easy to get wrong. The free [SEO Auditor homepage tool](https://freeseoaudit.vercel.app/) automates the entire six-step GEO audit plus 40+ classic SEO checks in a single pass. Paste a URL, and within about 30 seconds it returns each GEO signal with a pass/fail status and a specific fix.

Here is the fastest workflow:

- Open the [homepage tool](https://freeseoaudit.vercel.app/) and paste your URL.
- Read the GEO section: llms.txt, AI-bot access, direct answer, Island Test, FAQ schema, and author.
- Click any failing check to see the exact fix.
- Re-run after each fix to confirm it now passes.

GEO and SEO are complementary, not rival, audits. A GEO audit makes you citable; a classic [SEO audit](https://freeseoaudit.vercel.app/blog/how-to-do-an-seo-audit) makes you rankable, and you want both. The table below sums up where they differ.

**GEO audit vs SEO audit: what each one checks**

| Dimension | GEO audit | SEO audit |
| --- | --- | --- |
| Goal | Get cited inside AI answers | Rank in the list of blue links |
| Key file | llms.txt | robots.txt + XML sitemap |
| Crawlers checked | GPTBot, ClaudeBot, PerplexityBot | Googlebot, Bingbot |
| Content signal | Answer-first, passes Island Test | Keywords, headings, internal links |
| Trust signal | Named author (E-E-A-T) | Backlinks + domain authority |
| Free tool | SEO Auditor (homepage) | SEO Auditor (homepage) |

To understand the strategy a GEO audit serves, read [what is generative engine optimization](https://freeseoaudit.vercel.app/blog/what-is-generative-engine-optimization). To see every individual check the tool runs, browse the [full check list](https://freeseoaudit.vercel.app/check).

## FAQ

### How often should I run a GEO audit?

Run a GEO audit whenever you publish or substantially update a page, and do a full-site GEO audit at least quarterly. AI crawler names and llms.txt conventions change quickly in 2026, so a check that passed six months ago may be stale. Re-running the free SEO Auditor takes seconds and catches drift before it costs you citations.

### Do I need an llms.txt file to pass a GEO audit?

An llms.txt file is one of the gaps a GEO audit flags most often, but it is not strictly required for an AI to cite you. AI engines can still crawl and quote allowed pages without it, yet llms.txt makes your best pages easier to discover and signal as canonical. A GEO audit flags a missing llms.txt as a high-value, low-effort fix.

### Will a GEO audit hurt my classic Google rankings?

No. The fixes a GEO audit recommends, answer-first writing, structured data, named authors, and allowing crawlers, also help classic Google rankings and AI Overviews. A GEO audit and an SEO audit reinforce each other rather than conflict. The one exception is crawler access, where blocking AI bots is a deliberate trade-off, not a ranking penalty.

---

*Originally published at [freeseoaudit.vercel.app/blog/how-to-do-a-geo-audit](https://freeseoaudit.vercel.app/blog/how-to-do-a-geo-audit). I build [a free SEO + AI-search (GEO) auditor](https://freeseoaudit.vercel.app) — no signup, no paywall, [open source](https://github.com/ravigupta0210/seo-auditor). You can [run it on your own site](https://freeseoaudit.vercel.app) or [browse every check it performs](https://freeseoaudit.vercel.app/check).*
