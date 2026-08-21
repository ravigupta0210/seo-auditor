# Getting crawled — click-by-click

**The problem this solves:** Search Console shows `Discovered – currently not indexed: 203` and `Crawled – currently not indexed: 0`. Google has never fetched 203 of your 205 pages. That is a **crawl demand** problem, and crawl demand comes from links on pages Googlebot already visits daily.

Everything below exists to put your URLs on those pages.

**Time:** ~30 min on day 0, then ~30–45 min a day for a week.
**Cost:** $0 (except the domain, which is separate).

---

## Day 0 — 30 minutes, do this before anything else

### 1. Add GitHub topics (2 min)

Topics are how anyone finds your repo, and awesome-list maintainers check the repo before merging a PR.

1. Go to https://github.com/ravigupta0210/seo-auditor
2. On the right, next to **About**, click the **⚙️ gear icon**
3. In **Topics**, paste these one at a time (press Enter after each):
   `seo` · `seo-audit` · `seo-tools` · `geo` · `aeo` · `generative-engine-optimization` · `llms-txt` · `structured-data` · `json-ld` · `nextjs` · `typescript` · `ai-search`
4. Confirm **Website** reads `https://freeseoaudit.vercel.app` (it already does)
5. Tick **Releases**, **Packages** off if unused — cleaner sidebar
6. Click **Save changes**

### 2. Deploy the current work (10 min)

Two README links point at check pages that only exist locally, and the `/services` pages aren't live. Deploy before you send anyone to the repo.

```bash
cd /Users/ravigupta/personal-project/seo-auditor
npm run build          # must pass — do NOT run while `npm run dev` is running
git add -A
git commit -m "Add quote funnel, services pages, JS-rendering + QAPage checks, verified badge"
git push
```

Vercel and Render auto-deploy from `main`. Wait ~2 min, then check:
- https://freeseoaudit.vercel.app/services → should be 200
- https://freeseoaudit.vercel.app/check/geo.jsRequired.blocking → should be 200

### 3. Push the new README (already written)

It's rewritten and committed by the step above. Check it renders correctly at the repo root — it now links to 22 distinct pages on your site, which is 22 crawl paths from a domain Googlebot hits constantly.

---

## Day 1 — Dev.to (20 min) ← highest value, do this first

Dev.to is crawled very frequently. Three posts are already generated and waiting, each with `canonical_url` pointing back at your blog, and **31 absolute links** back to your site between them.

1. Create an account at https://dev.to/enter (GitHub login is fine)
2. Click **Create Post** (top right)
3. Click the **⚙️ settings icon** in the editor toolbar → **Switch to Markdown editor** if not already
4. Open `docs/launch/devto/what-is-an-ai-crawler.md` in your editor
5. **Select all, copy, paste into Dev.to.** The front matter block at the top (`title:`, `canonical_url:` …) is read by Dev.to — leave it exactly as-is
6. Change `published: false` → `published: true` when you're ready
7. Click **Publish**
8. Repeat for `how-to-block-ai-crawlers.md` and `how-to-rank-in-chatgpt.md` — **one per day**, not all three at once

> **Why the canonical matters:** it tells Google your blog is the original. You get the crawl benefit without competing against yourself.

To generate more later:
```bash
cd backend && npx tsx scripts/export-devto.ts <slug> <slug>
```

---

## Day 2 — Awesome lists (30 min)

Full instructions and the exact entry text: **`awesome-lists.md`**

Short version, for `awesome-seo`:

1. Go to https://github.com/marcobiedermann/search-engine-optimization
2. **Read `CONTRIBUTING.md` first** — format rules are strict
3. Click `README.md` → the **pencil ✏️ icon** to edit
4. Find the **Tools** section, add your line alphabetically:
   ```
   - [SEO Auditor](https://freeseoaudit.vercel.app) - Free SEO, JSON-LD and AI-search (GEO/AEO) audit for any URL. Checks whether GPTBot, ClaudeBot and PerplexityBot can reach and cite your pages. No signup.
   ```
5. Scroll down → **Propose changes** → **Create pull request**
6. Paste the PR description from `awesome-lists.md`
7. Repeat for `awesome-selfhosted` and `awesome-nextjs` (different formats — check the file)

Expect days to weeks. Some will be ignored. Submit to all of them.

---

## Day 3 — Reddit (20 min)

Full drafts: **`reddit.md`**. Read the rules section at the top before posting — r/SEO will remove you otherwise.

1. Log in with your **real, existing** account (new accounts get auto-filtered)
2. Start with **r/SideProject** — friendliest, lowest risk
3. Use the "build angle" draft
4. **Reply to every comment for the first 2–3 hours**
5. Wait 2 days before the next subreddit. Never repost the same text.

---

## Day 4 — Show HN (15 min)

Full drafts, both angles: **`hacker-news.md`**

1. Go to https://news.ycombinator.com/submit
2. **Title** must start with `Show HN:` — copy from the file
3. **URL:** `https://freeseoaudit.vercel.app`
4. Leave the text field **empty**
5. Submit, then **immediately** post the first comment from the file as a reply to your own post
6. Stay in the thread for 2–3 hours

Post **Tue–Thu, 08:00–10:00 ET**. Never ask anyone to upvote — that gets you banned.

---

## Week 2 — Directories + Product Hunt

Full list and reusable copy: **`directories.md`**

Work down the tiers. Product Hunt deserves its own day — create the account a week ahead and comment on other launches first, or you'll be filtered.

---

## Ongoing — the loop that runs itself

Once anyone embeds your score badge, that's a backlink you didn't ask for. The badge is now **server-verified** — the score is read from the stored report, so it can't be faked, which is what makes it worth displaying.

Add to every audit report you share, and to the README of anything you build.

---

## How to tell it's working

Check weekly in Search Console → **Indexing → Pages**:

| Signal | Meaning |
|---|---|
| `Discovered` count starts dropping | **It's working.** Google is crawling. |
| `Crawled – currently not indexed` starts rising | Also progress — Google is now *reading* pages. Content quality becomes the next fight. |
| `Indexed` rises above 2 | The actual win. |
| Nothing moves after 3–4 weeks | Not enough links yet. Keep going; don't add more pages. |

**Expect weeks, not days.** There is no fast version of this.

---

## Do not do these

- ❌ **Request Indexing** in Search Console — ~10–12/day quota, doesn't raise crawl budget, you've already hit the limit twice
- ❌ **Publish more blog posts** — 203 URLs are already queued unfetched; more just dilutes a budget of zero
- ❌ **Buy links or use "submit to 100 directories" services** — real penalty risk, no crawl demand
- ❌ **Ask for upvotes** on HN/Reddit — fastest route to a ban
- ❌ **Post the same text to multiple subreddits** — auto-flagged as spam
