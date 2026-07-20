# TallyBench — Working Rules

Static HTML/CSS/JS calculator site (40 tools), no build step, deployed via GitHub Pages (push to `main` = deploy, live at tallybench.com within ~10 min). Repo: `roshanroy149-droid/rruniversalcalculator`.

This file is a checklist of rules earned the hard way across this project's build sessions. Follow it every time — building something new, fixing a bug, or deploying — even in a brand-new conversation with no memory of how it was learned.

## 0. Brand positioning — finance-first, not "just a calculator site"

- TallyBench's official identity is **a finance site with calculators for everything else too** — not a generic "everyday calculators" site that happens to include finance. This isn't a stretch: 76 of 125 tools (61%) are finance, versus 16 health, 20 education, 13 everyday, so the framing just names what's already true of the tool inventory.
- This is reflected in index.html's title/meta/hero copy, about.html, and manifest.json — if any of those drift back to generic "everyday calculators" language in a future edit, that's a regression, not a style choice; fix it back to the finance-first framing.
- **Articles are finance-primary by the same logic.** Health and education trend articles are fine when a genuinely strong, well-sourced news hook exists (a real policy or curriculum change, not just "there's a health calculator on the site so let's write about health") — but don't put them on a fixed rotation alongside finance. Finance has the highest and steadiest supply of "real news" (rate decisions, tax law, regulatory changes happen constantly); health is much higher-scrutiny YMYL territory that needs more care per article; education has far fewer genuine breaking-news moments to hang articles on. Default to finance; branch out opportunistically, not on a schedule.

## 1. Single source of truth — never hand-edit generated content

- `build/tools.json` is the ONLY place the tool list lives. Every tool needs: `id`, `file`, `category`, `navLabel`, `title`, `icon`, `blurb`.
- `build/articles.json` is the equivalent single source of truth for the **articles/guides** content type (long-form editorial pages, separate from the 125 calculator tools) — each entry needs `id`, `file`, `category`, `tag`, `title`, `dek`, `date` (`YYYY-MM-DD`), `readTime`.
- `build/Sync-Nav.ps1` generates, from `tools.json`/`articles.json`, these things across every HTML page via marker comments:
  - `<!-- TB:NAV:START/END -->` — header category tabs + tool list (desktop ruler / mobile drawer), plus a plain "ARTICLES" link to `articles.html`
  - `<!-- TB:COUNT:START/END -->` — the "N TOOLS · 0 SIGN-UP" header tagline count
  - `<!-- TB:HOMEGRID:START/END -->` — homepage category tool grids (index.html only)
  - `<!-- TB:ARTICLELIST:START/END -->` — the article list, newest-first (articles.html only)
  - `<!-- TB:BREADCRUMB:START/END -->` — BreadcrumbList JSON-LD, derived purely from which list (if any) the filename appears in — every page except index.html
- **Adding, removing, or renaming a tool = edit `tools.json`; adding an article = edit `articles.json` and give the new article page a `<!-- TB:NAV:START/END -->`/`<!-- TB:COUNT:START/END -->`/`<!-- TB:BREADCRUMB:START/END -->` marker set (all three, right before `</head>` for the last one). Either way, then run `powershell -File build/Sync-Nav.ps1` (or `npm run sync-nav`). Never hand-edit content between those markers.**
- This was violated twice before the templating covered everything: the header tool count went stale after two rounds of new tools ("27 TOOLS" shown when there were 40), and the homepage grid silently missed 13 newly-added tools because it was still hand-written HTML. Both are now auto-generated — keep it that way. If a future feature needs "for every tool/article, render X," extend `Sync-Nav.ps1` with a new marker rather than hand-editing every page.
- A "more calculators" footer nav (`TB:MORETOOLS`) used to be part of this same generated system; it was deliberately removed site-wide (see git history) — don't reintroduce it without being asked.
- Every article page's breadcrumb is `TallyBench / Articles / <Article Title>` (the middle segment links to `articles.html`), not directly under the TallyBench home page — this is different from a calculator page's `TallyBench / <Tool Title>`.
- Every article page's `<body>` must use `data-page-cat="articles"`, NOT the article's finance/health/education/everyday `category` value from `articles.json`. `data-page-cat` drives script.js's nav-highlight logic (which nav item lights up copper); a calculator page's category still uses its real category so the matching FINANCE/HEALTH/etc. tab highlights, but an article page should highlight the ARTICLES link instead, or the reader sees the wrong nav item lit up while the ARTICLES link itself stays its default muted color. The article's own category (for its `.article-hero`/`.article-card` accent color) is set separately via the `cat-finance`/etc. class on those elements, so this doesn't affect its visual color scheme.
- After adding a new tool or article: also update `sitemap.xml`, add a disclaimer if it's finance/health advice-adjacent, and cross-link it from related existing tools/articles.
- **Every new tool or article must cross-link at least 3 related pages, in both directions where possible** (the new page links out to related tools/articles, and at least a couple of those existing pages get a matching link back in). This isn't optional polish — internal links are how a new page's authority builds and how readers/crawlers actually discover it; a page with zero inbound internal links from the rest of the site is much slower to get indexed and rank.

## Growth/SEO infrastructure (already set up — don't rebuild, extend)

- **Google Search Console** and **Bing Webmaster Tools** are both verified for tallybench.com (GSC via an uploaded HTML verification file, `google1c14866bc836c1f7.html` at the repo root — never touch or delete this file). Both `sitemap.xml` and `robots.txt` are submitted and confirmed successful in both.
- **IndexNow** is wired up: the verification key file (`cea41b609d124e96b6b760f3d15617cc.txt`) is hosted at the repo root, and `.github/workflows/indexnow.yml` runs on every push to `main`, diffs which `.html` files actually changed in that push, and submits just those URLs to the IndexNow API — so new/updated pages get pushed to Bing (and other IndexNow participants) immediately instead of waiting for their next crawl. Nothing to do here for a normal content push; it's automatic.
- **`og-image.png`** (1200×630, rendered via a one-off Puppeteer + local Chrome script, not hand-drawn) is the shared social-preview image referenced by `og:image`/`twitter:image` on every page. If the brand visual identity changes meaningfully, regenerate it (a headless Chrome binary is already available locally for this — see git history for the render script) rather than leaving it stale.
- Every page uses `twitter:card content="summary_large_image"` (not the smaller `summary` card) now that there's a real image to show.
## 2. CSS rules that have bitten us more than once

- **Source order decides ties.** A media-query override and the base rule it overrides must have the override placed *after* the base rule in the file. Media queries don't add specificity — at equal specificity, whichever rule is later in the file wins, full stop, regardless of which one "sounds more specific." Placing an override before its base rule silently does nothing.
- **`position:fixed` does not escape an ancestor's stacking context.** If an ancestor establishes a stacking context (has `position` + `z-index`, or `transform`, or `opacity<1`, etc.), a `position:fixed` descendant's z-index is only compared against *siblings inside that same context* — it cannot "reach out" and out-rank an element outside the ancestor just by having a bigger number. Check what stacking context a fixed/absolute element actually lives inside before assuming its z-index will win.
- **Flex children can silently clip their own overflow before a scrollable ancestor helps.** A flex item with default `flex-shrink:1` inside a flex column will shrink to fit, and if it has its own `overflow:hidden`, content gets clipped there — before the outer container's `overflow:auto` ever kicks in. If a flex child must render its full natural content height inside a scrollable flex parent, give it `flex-shrink:0`.
- After any responsive CSS change, explicitly verify **both** the changed breakpoint and the untouched one — don't assume the other one is fine.

## 3. Verifying UI changes — don't trust `element.click()` alone

- `document.querySelector(...).click()` in a test script bypasses real hit-testing and pointer-event stacking entirely — it fires the handler regardless of what's visually on top of the element. This can make a genuinely broken (unclickable) UI pass a JS-only test. For anything involving overlays, drawers, or z-index, verify with a real coordinate/ref-based click (hit-testing), not just a programmatic `.click()`.
- This sandbox's screenshot action reliably times out, and raw pixel-coordinate clicks require a screenshot first to calibrate — so in practice only ref-based clicks are usable here. Keep that limitation in mind; it doesn't mean coordinate clicking is broken on a real device.
- CSS transitions/animations: reading `getComputedStyle`/`getBoundingClientRect` immediately after toggling a class (in the same or an immediately-following call) can capture the *pre-transition* state, not the final one. Either add a real wait (`computer{action:"wait"}`) in a separate tool call before measuring, or force a synchronous reflow first: `el.style.transition='none'; void el.offsetHeight;` then read.
- Gated tools (`Bash`, `mcp__Claude_Browser__javascript_tool`, browser `navigate`) can intermittently report "temporarily unavailable" for a bit. When that happens: retry a few times with read-only tools (`Read`, `Grep`, `read_page`, `read_console_messages`) in between rather than blocking silently, and always check `git status`/`git log` before assuming a previous write actually landed.

## 4. Before committing

- Run `npx html-validate "*.html"` and `node --check script.js`. The codebase has pre-existing style-only lint warnings (`no-inline-style`, `no-implicit-button-type`, `long-title`, table `scope`) that are expected and not worth fixing incidentally — only treat parse-errors, duplicate content, or unclosed-tag classes of error as real problems.
- Verify the actual staged diff (`git diff --cached` / `git show <commit> --stat`) matches what the commit message claims, *especially* if a change was made across multiple turns — it's easy to write a commit message describing work that was actually already shipped in a previous commit.
- Any "worked example" numbers written into FAQ/article copy must be checked against what the live calculator actually computes, not hand-estimated — computed values have been off from hand-written examples more than once.
- Never commit `.claude/settings.local.json` (personal local tool-permission allowlist, already gitignored).

## 5. Deploying

- Pushing to `main` **is** the deploy step — GitHub Pages serves directly from `main`, no separate deploy command exists. Allow up to ~10 minutes for the CDN cache to reflect changes live.
- Commit only when the user asks; once committed and verified, push without waiting for separate confirmation (standing rule from 2026-07-14).
