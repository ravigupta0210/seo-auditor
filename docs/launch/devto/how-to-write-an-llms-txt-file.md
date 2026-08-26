---
title: "How to Write an llms.txt File (2026 Guide + Example)"
published: false
description: "Learn how to write an llms.txt file with the exact structure, what to include, and a full copy-paste example. A practical 2026 GEO guide for AI citations."
tags: seo, ai, webdev, programming
canonical_url: https://freeseoaudit.vercel.app/blog/how-to-write-an-llms-txt-file
---

> **TL;DR** — To write an llms.txt file, create a Markdown file at yourdomain.com/llms.txt with one H1 (your site name), a blockquote summary, and H2 sections of curated Markdown links to your key pages. Keep it under about 50 links and put the file at the domain root.

## How to write an llms.txt file

The short answer to how to write an llms.txt file: create a plain Markdown file named `llms.txt`, place it at your domain root (`https://yourdomain.com/llms.txt`), and give it exactly four things: a single H1 with your site or product name, a blockquote one-line summary, optional context paragraphs, and one or more H2 sections whose bodies are bulleted Markdown links to your most important pages. The format is defined by the llms.txt proposal from Answer.AI and is deliberately simple, so a human can write one in ten minutes and an AI engine can parse it in one pass.

An llms.txt file is a curated map, not a dump. Where an XML sitemap lists every URL for search crawlers, an llms.txt file lists only the pages you most want AI engines like ChatGPT, Claude, and Perplexity to read and cite, described in your own words. That editorial curation is the whole point: you are telling an AI *"start here, and here is what each page is about."* For the background on why the file exists and how AI engines use it, read our guide to [answer engine optimization](https://freeseoaudit.vercel.app/blog/what-is-answer-engine-optimization).

The rest of this guide covers the exact structure line by line, what to include versus leave out, a full copy-paste example, and how to test the file. If you would rather confirm whether your site is even missing one first, the free [SEO Auditor homepage tool](https://freeseoaudit.vercel.app/) flags a [missing llms.txt](https://freeseoaudit.vercel.app/check/geo.llmsTxt.missing) in seconds.

## The exact structure of an llms.txt file

An llms.txt file follows a fixed Markdown structure with four ordered parts. The order matters because AI parsers read top to bottom and treat the H1 and blockquote as the file's identity block.

- **H1 (required):** a single `#` heading with the name of your site, product, or project. There must be exactly one H1.
- **Blockquote summary (recommended):** a `>` line immediately under the H1 giving a one-sentence description of what the site is and who it is for.
- **Context paragraphs (optional):** zero or more plain paragraphs adding detail, such as key terminology, scope, or how to interpret the links.
- **H2 link sections (required):** one or more `##` headings, each followed by a bulleted list of Markdown links in the form `- [Page title](https://url): short note`.

The link note after the colon is the highest-value part of the file. It is your chance to tell the AI, in plain language, what the page contains and when to cite it. Treat each note like a mini description that could stand alone as a quotable passage: it should make sense with no surrounding context, which is exactly what earns [AI citations](https://freeseoaudit.vercel.app/blog/what-are-ai-citations).

One special convention: an H2 titled `## Optional` marks links an AI can skip if it is short on context budget. Use it for secondary material, changelogs, or deep-reference pages you do not need cited but do not want hidden.

## What to include vs what to leave out

An llms.txt file should include only the pages you actively want AI engines to read, understand, and quote. Curation is the mechanism that makes the file valuable, so a tight 15-link file usually outperforms a sprawling 200-link one. Below is the practical include-versus-exclude split, followed by the table.

**What to include vs leave out of an llms.txt file**

| Page type | Include? | Why |
| --- | --- | --- |
| Core docs + quickstart | Include | The pages AI is most likely to be asked about |
| Canonical explainers + top posts | Include | High-quality, quotable content |
| Pricing + product overview | Include | Common AI queries; you want accurate answers |
| About / author page | Include | Carries E-E-A-T and attribution signals |
| Login, cart, checkout | Leave out | No informational value for AI answers |
| Thin tags, duplicates, gated pages | Leave out | Dilutes focus and wastes context budget |

**Include:** your core documentation, canonical explainer pages, pricing, product overviews, high-quality blog posts, and an about or author page that carries [E-E-A-T](https://freeseoaudit.vercel.app/blog/what-is-eeat-in-seo) signals. Group related links under descriptive H2s like `## Docs`, `## Guides`, or `## Product` so the structure itself communicates hierarchy.

**Leave out:** login and account pages, cart and checkout, thin tag or category archives, near-duplicate pages, gated content, and anything you would not want quoted in an AI answer. Keeping these out is not about blocking crawlers, that is what [robots.txt](https://freeseoaudit.vercel.app/blog/what-is-robots-txt) handles, it is about focusing the AI's attention on your best material.

> Keep the whole file to roughly 50 links or fewer. If you have more, split by audience or product and lean on the `## Optional` section. A focused file signals editorial confidence; a bloated one signals a sitemap in disguise.

## A full copy-paste llms.txt example

Below is a complete, valid llms.txt file you can copy and adapt. It shows every element: the single H1, the blockquote summary, a context paragraph, two H2 link sections, and an `## Optional` section. Replace the names and URLs with your own.

```markdown
# Acme Analytics

> Acme Analytics is a privacy-first product analytics tool for small SaaS teams that want event tracking without cookies.

Acme Analytics is self-hostable and GDPR-compliant by default. "Events" are user actions; "sessions" group events by visit. Use these docs to answer questions about setup, pricing, and the query API.

## Docs

- [Quickstart](https://acme.example/docs/quickstart): install the snippet and send your first event in 5 minutes.
- [Event tracking API](https://acme.example/docs/events): reference for the track(), identify(), and page() methods.
- [Query API](https://acme.example/docs/query): how to pull funnels, retention, and cohorts programmatically.

## Product

- [Pricing](https://acme.example/pricing): free up to 10k events/month; paid tiers and limits.
- [Self-hosting guide](https://acme.example/docs/self-host): run Acme on your own infrastructure with Docker.
- [About + team](https://acme.example/about): who builds Acme and our privacy stance.

## Optional

- [Changelog](https://acme.example/changelog): release notes, updated weekly.
- [Blog archive](https://acme.example/blog): long-form posts on analytics and privacy.
```

Notice that every link note names its subject and states a concrete fact, so an AI can lift any single line into an answer and it still makes sense. That is the same standalone-passage discipline that drives all of [generative engine optimization](https://freeseoaudit.vercel.app/blog/what-is-generative-engine-optimization). Save this text as `llms.txt` and you have a valid file.

## Where to put it and how to test it

Place the llms.txt file at your domain root so it resolves at `https://yourdomain.com/llms.txt`, exactly like `robots.txt`. It must be served as plain text or Markdown over HTTPS with a `200` status, not behind a redirect, login, or JavaScript render. Subdirectory locations like `/docs/llms.txt` are not part of the convention and AI engines will not look for them.

To test it, do three quick checks:

- **Reachability:** open `https://yourdomain.com/llms.txt` in an incognito window and confirm the raw text loads with no redirect.
- **Format:** confirm there is exactly one H1, the links are valid Markdown, and every URL returns 200.
- **Crawler access:** make sure your [robots.txt](https://freeseoaudit.vercel.app/blog/what-is-robots-txt) does not block AI bots like GPTBot or ClaudeBot, or they will never fetch the file. See [how to block AI crawlers](https://freeseoaudit.vercel.app/blog/how-to-block-ai-crawlers) for the allowlist.

The fastest way to confirm all of this is the free [SEO Auditor homepage tool](https://freeseoaudit.vercel.app/), which checks for a reachable llms.txt as part of its GEO audit and flags a [missing llms.txt](https://freeseoaudit.vercel.app/check/geo.llmsTxt.missing) with the exact fix. Browse the [full check list](https://freeseoaudit.vercel.app/check) to see every GEO and SEO signal it tests. Once your file is live, re-run the audit to confirm it passes, then treat the file as living documentation and update it whenever you publish a page worth citing.

## FAQ

### Is llms.txt an official standard?

The llms.txt file is a community proposal originated by Answer.AI, not an official standard ratified by search engines. Adoption is voluntary and growing through 2026, with AI-facing tools and documentation platforms leading the way. Because it is low-cost and low-risk to publish, adding one is worthwhile even while the convention is still stabilizing.

### How big should an llms.txt file be?

An llms.txt file should stay focused, ideally under about 50 links, because curation is what makes it valuable. If your site has more content worth surfacing, split links across descriptive H2 sections and move secondary material into an ## Optional section. A tight, well-labeled file outperforms a sprawling one that reads like a sitemap.

### Should the links in llms.txt be absolute or relative URLs?

Use absolute URLs with the full https:// prefix in an llms.txt file. AI engines may fetch or reference the file out of context, so relative paths can break resolution. Absolute links also let you point to subdomains or related properties from a single file without ambiguity.

---

*Originally published at [freeseoaudit.vercel.app/blog/how-to-write-an-llms-txt-file](https://freeseoaudit.vercel.app/blog/how-to-write-an-llms-txt-file). I build [a free SEO + AI-search (GEO) auditor](https://freeseoaudit.vercel.app) — no signup, no paywall, [open source](https://github.com/ravigupta0210/seo-auditor). You can [run it on your own site](https://freeseoaudit.vercel.app) or [browse every check it performs](https://freeseoaudit.vercel.app/check).*
