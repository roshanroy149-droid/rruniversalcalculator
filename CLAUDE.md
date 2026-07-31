# TallyBench — Working Rules

Static HTML/CSS/JS calculator site (40 tools), no build step, deployed via GitHub Pages (push to `main` = deploy, live at tallybench.com within ~10 min). Repo: `roshanroy149-droid/rruniversalcalculator`.

This file is a checklist of rules earned the hard way across this project's build sessions. Follow it every time — building something new, fixing a bug, or deploying — even in a brand-new conversation with no memory of how it was learned.

## 0. Brand positioning — finance-first, not "just a calculator site"

- TallyBench's official identity is **a personal finance resource that also has calculators for everything else** — not a generic "everyday calculators" site that happens to include finance. Calculators are the evidence, not the pitch.
- **The tool ratio has to be actively defended, because it drifts.** As of 2026-07-29: 200 tools = finance 86 (43%), education 45, everyday 43, health 26 (13%). It was 61% finance at 125 tools. It fell to 43% because a single session added 31 tools of which only 4 were finance — the positioning claim in this file stayed the same while the inventory underneath it quietly stopped supporting it. **New tools should be finance unless there is a specific reason otherwise. If a batch would push finance below 40%, that is a signal to write articles instead of building tools.**
- **Health is a supporting category, not a co-headline.** It is 13% of tools and 6 of 36 articles. Do not position TallyBench as a health site: health is the highest-scrutiny YMYL category, and the site has no named author, stated credentials or medical review process. The current framing — calculators with honest disclaimers — is defensible; "a health authority" is not, and claiming it would invite evaluation against a bar the site cannot presently clear.
- This is reflected in index.html's title/meta/hero copy, about.html, and manifest.json — if any of those drift back to generic "everyday calculators" language in a future edit, that's a regression, not a style choice; fix it back to the finance-first framing.
- **Do not put a tool count in a meta description, `manifest.json`, or any other place that cannot carry a `TB:COUNTINLINE` marker.** Those went stale repeatedly (manifest.json still said 135 at 200 tools). Counts belong in generated blocks or nowhere.
- **Non-finance products do not live on TallyBench.** VenStock was moved to venrostech.com on 2026-07-29 for this reason; `venstock.html` is now a redirect stub. The books stay, because they are finance content on the same subject as the site — that is the test. Anything topically finance stays; anything else goes on the studio site.
- **Articles are finance-primary by the same logic.** Health and education trend articles are fine when a genuinely strong, well-sourced news hook exists (a real policy or curriculum change, not just "there's a health calculator on the site so let's write about health") — but don't put them on a fixed rotation alongside finance. Finance has the highest and steadiest supply of "real news" (rate decisions, tax law, regulatory changes happen constantly); health is much higher-scrutiny YMYL territory that needs more care per article; education has far fewer genuine breaking-news moments to hang articles on. Default to finance; branch out opportunistically, not on a schedule.

## 0.5 Editorial cadence — event-driven, never clock-driven

**The rule: articles are scheduled against events that are already on a published calendar, not against a publishing frequency.** This is a deliberate replacement for the "daily/weekly recap" model, which was tried and failed here — five stock-market recaps were published on 2026-07-24 for "week of July 20", and the week-of-July-27 edition never appeared. That is one edition before it lapsed.

**Do not start a daily or weekly market summary.** Four reasons, all still true: it is the most commoditised content in finance (Reuters, Bloomberg, Moneycontrol publish within minutes of the close); the site is static on GitHub Pages with no market data feed and no scheduled job, so every edition is manual; a recap is stale in 24 hours and a year of them is ~250 thin dated pages that dilute site quality; and a section that visibly lapses is worse than one that never existed. If asked for one, say this rather than agreeing.

### The calendar (verify dates before relying on them — these were confirmed 2026-07-29)

**RBI MPC, FY 2026-27** — announced 23 March 2026, six meetings:
`6–8 Apr 2026` · `3–5 Jun 2026` · `3–5 Aug 2026` · `5–7 Oct 2026` · `2–4 Dec 2026` · `3–5 Feb 2027`

**India tax dates, AY 2026-27:**
`31 Jul 2026` ITR-1/ITR-2 · `31 Aug 2026` ITR-3/ITR-4 non-audit · `31 Oct 2026` audit cases · `30 Nov 2026` transfer pricing · `31 Dec 2026` belated · `31 Mar 2027` revised

**US student loans:** `1 Jul 2027` new PAYE enrolments close · `1 Jul 2028` PAYE and ICR sunset, default placement is RAP

**Not yet verified — confirm the published schedule before diarising:** Fed FOMC (8/year), ECB (8/year), BoE MPC (8/year), UK Budget, US tax season dates. Don't write these from memory.

That is roughly 30–40 diarisable pieces a year without inventing a single obligation.

### How to work it

- **Prefer evergreen-with-updates over dated recaps.** One URL — "RBI repo rate: what each change does to your EMI" — updated after every decision accumulates authority. Six dated pages each start from zero. `rbi-mpc-august-2026-preview.html` is written to be *updated* on the decision day, not replaced.
- **Write the framework piece before the event, update it after.** The analysis of why a decision is hard does not depend on the outcome.
- **A missed event costs nothing.** No promise was made to a reader, no section looks abandoned. That is the entire advantage of this model over a cadence.

## 1. Single source of truth — never hand-edit generated content

- `build/tools.json` is the ONLY place the tool list lives. Every tool needs: `id`, `file`, `category`, `navLabel`, `title`, `icon`, `blurb`.
- `build/articles.json` is the equivalent single source of truth for the **articles/guides** content type (long-form editorial pages, separate from the calculator tools) — each entry needs `id`, `file`, `category`, `topic`, `tag`, `title`, `dek`, `date` (`YYYY-MM-DD`), `readTime`. `category` is `finance` or `health` and drives the card accent colour; **`topic` is separate and drives which cluster the article is grouped under on articles.html** — one of `tax`, `rates`, `borrowing`, `studentloans`, `retirement`, `markets`, `health`, defined in the file's `topics` array. An article with no `topic` silently disappears from the grouped list, so it is not optional.
- `build/Sync-Nav.ps1` generates, from `tools.json`/`articles.json`, these things across every HTML page via marker comments:
  - `<!-- TB:NAV:START/END -->` — header category tabs + tool list (desktop ruler / mobile drawer), plus a plain "ARTICLES" link to `articles.html`
  - `<!-- TB:COUNT:START/END -->` — the "N TOOLS · 0 SIGN-UP" header tagline count
  - `<!-- TB:COUNTINLINE:START/END -->` — the bare tool count for **prose** that cites it mid-sentence (optional; currently only `index.html` and `book.html`). Added 2026-07-29 because hand-written body copy citing the count went stale at 49, 60, 125, 137 *and* 196 — the generated header was right every time while the sentence under it was wrong. **If you ever write the tool count into visible copy, wrap it in these markers rather than typing the number.**
  - `<!-- TB:HOMEGRID:START/END -->` — homepage category tool grids (index.html only)
  - `<!-- TB:ARTICLELIST:START/END -->` — the article list, **grouped by topic** (articles.html only). A "Latest" strip of the three newest comes first, then one block per topic in the order given by `articles.json`'s `topics` array, newest-first within each. Every article stays in the DOM — this is grouping, not JS filtering, so the whole archive stays crawlable and each topic heading adds real structure. The `.topic-nav` jump links at the top of `articles.html` are hand-written but derive their anchors (`#topic-<id>`) from the same list; if you add a topic, add its link there too.
  - `<!-- TB:BREADCRUMB:START/END -->` — BreadcrumbList JSON-LD, derived purely from which list (if any) the filename appears in — every page except index.html
- **Adding, removing, or renaming a tool = edit `tools.json`; adding an article = edit `articles.json` and give the new article page a `<!-- TB:NAV:START/END -->`/`<!-- TB:COUNT:START/END -->`/`<!-- TB:BREADCRUMB:START/END -->` marker set (all three, right before `</head>` for the last one). Either way, then run `powershell -File build/Sync-Nav.ps1` (or `npm run sync-nav`). Never hand-edit content between those markers.**
- This was violated twice before the templating covered everything: the header tool count went stale after two rounds of new tools ("27 TOOLS" shown when there were 40), and the homepage grid silently missed 13 newly-added tools because it was still hand-written HTML. Both are now auto-generated — keep it that way. If a future feature needs "for every tool/article, render X," extend `Sync-Nav.ps1` with a new marker rather than hand-editing every page.
- A "more calculators" footer nav (`TB:MORETOOLS`) used to be part of this same generated system; it was deliberately removed site-wide (see git history) — don't reintroduce it without being asked.
- Every article page's breadcrumb is `TallyBench / Articles / <Article Title>` (the middle segment links to `articles.html`), not directly under the TallyBench home page — this is different from a calculator page's `TallyBench / <Tool Title>`.
- Every article page's `<body>` must use `data-page-cat="articles"`, NOT the article's finance/health/education/everyday `category` value from `articles.json`. `data-page-cat` drives script.js's nav-highlight logic (which nav item lights up copper); a calculator page's category still uses its real category so the matching FINANCE/HEALTH/etc. tab highlights, but an article page should highlight the ARTICLES link instead, or the reader sees the wrong nav item lit up while the ARTICLES link itself stays its default muted color. The article's own category (for its `.article-hero`/`.article-card` accent color) is set separately via the `cat-finance`/etc. class on those elements, so this doesn't affect its visual color scheme.
- After adding a new tool or article: also update `sitemap.xml`, add a disclaimer if it's finance/health advice-adjacent, and cross-link it from related existing tools/articles.
- **Every new tool or article must cross-link at least 3 related pages, in both directions where possible** (the new page links out to related tools/articles, and at least a couple of those existing pages get a matching link back in). This isn't optional polish — internal links are how a new page's authority builds and how readers/crawlers actually discover it; a page with zero inbound internal links from the rest of the site is much slower to get indexed and rank.
- **New calculators must be as universal as possible wherever it's applicable** — a currency dropdown (reuse the same USD/EUR/GBP/INR/JPY/AUD/CAD/CHF/CNY/SGD/AED/NZD/ZAR/BRL/MXN/HKD/KRW/SEK-NOK option list already used on `loan-calculator.html` etc.) for any tool involving a money amount, and a metric/imperial unit toggle for any tool involving weight/height/distance/volume. Don't hardcode a single country's currency or unit system into a new tool unless the tool is inherently country-specific (e.g. an HRA or Gratuity calculator, which are India-only by definition) — in that case, say so in the title/copy instead of pretending it's universal.
- **Batch tool builds: commit locally after each finished tool, push once at the end.** When asked to build several new calculators/pages in one go, treat each finished-and-validated tool (HTML + script.js logic + tools.json entry + cross-links) as its own local commit as soon as it's done — don't wait until the whole batch is finished to make the first commit. Only run `git push` once, after the full batch is built, wired (`Sync-Nav.ps1` re-run, `sitemap.xml` updated), validated, and the user has confirmed deploy. This means a session interruption mid-batch loses at most the one tool in progress, not the whole batch, and nothing new goes live until the user actually approves the deploy.

## Growth/SEO infrastructure (already set up — don't rebuild, extend)

- **Google Search Console** and **Bing Webmaster Tools** are both verified for tallybench.com (GSC via an uploaded HTML verification file, `google1c14866bc836c1f7.html` at the repo root — never touch or delete this file). Both `sitemap.xml` and `robots.txt` are submitted and confirmed successful in both.
- **IndexNow** is wired up: the verification key file (`46a0b132c8604b83aaa2f70b99ab89ad.txt`, generated by Bing's own key generator — the older self-generated `cea41b6…` key was rejected with HTTP 403 for its entire life and is retained only as a dead fallback) is hosted at the repo root, and `.github/workflows/indexnow.yml` runs on every push to `main`, diffs which `.html` files actually changed in that push, and submits just those URLs to the IndexNow API — so new/updated pages get pushed to Bing (and other IndexNow participants) immediately instead of waiting for their next crawl. Nothing to do here for a normal content push; it's automatic.
  - **The workflow compares files with the `TB:` marker blocks stripped out, and this matters.** Adding one tool changes the count in the header of every page, so a plain `git diff` reports ~190 changed files when only a handful actually changed content. Before this filter existed, a single-tool push submitted 193 URLs to IndexNow of which 14 were real — repeatedly telling Bing the entire site had changed. If you ever touch this workflow, keep the strip-and-compare step; submitting the whole inventory on every push is worse than not submitting at all.
- **`og-image.png`** (1200×630, rendered via a one-off Puppeteer + local Chrome script, not hand-drawn) is the shared social-preview image referenced by `og:image`/`twitter:image` on every page. If the brand visual identity changes meaningfully, regenerate it (a headless Chrome binary is already available locally for this — see git history for the render script) rather than leaving it stale.
- Every page uses `twitter:card content="summary_large_image"` (not the smaller `summary` card) now that there's a real image to show.
## 1.5 Alignment and symmetry — the owner's top visual priority

**Stated 2026-07-30 as a standing rule for TallyBench and every other site built for this owner, not one-off feedback on one page:** *"alignments are very important to me. Where the line ends, where the line starts, boxes, everything. There needs to be a proper alignment. Symmetry is topmost important thing for me, visually."*

Treat this as a hard acceptance criterion, at the same level as "the calculator returns the right number". Several visual directions were rejected as "just okay" before this surfaced, and misalignment is the most likely reason.

- **One spacing scale, no exceptions.** Adopt an 8px base and take every padding, margin and gap from it. A one-off `13px` is a defect even if it looks fine. (`style.css` predates this rule and is not yet on a strict scale — apply it to new work and normalise opportunistically rather than in one sweep.)
- **One container for every section**, so the left and right edges form an unbroken line from nav to footer. Verify by measuring, not by eye.
- **Pick a column count and make the maths land on whole pixels.** With 12 columns and 16px gutters, `--container:1172px` gives content 1124px → columns of exactly 79px. Fractional column widths put box edges on sub-pixel boundaries, which is what makes a technically-correct grid still read as faintly ragged.
- **Rows are uniform.** Use `grid-auto-rows:<fixed>` on card grids rather than letting content set each row's height — one row 18px taller than its neighbours breaks the rhythm visibly. Add `overflow:hidden` and check nothing clips.
- **Side-by-side columns share a top AND a bottom edge.** `align-items:center` on a hero grid leaves both edges mismatched; use `stretch` and push the inner block down with `margin-top:auto`.
- **Verify with `getBoundingClientRect()`, never by eye.** Collect the left edges of every major block, the right edges of every trailing element, and the heights within each grid row, then assert each set has exactly one distinct value. This is checkable, so check it before showing the work — a build-time grid overlay in a prototype is worth the ten minutes it costs.
- **Light-on-light inverts the usual instinct.** Raising a translucent panel's white alpha *lowers* contrast for white text on it. Measure light-on-light separately from dark-on-light; a change that helps one can break the other (caught this way on `.article-tag`, 5.15:1 → 4.44:1).

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
