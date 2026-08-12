# Regenerates the shared header nav, header tool count, and (on index.html
# only) the homepage's category tool grids and search data — all from
# build/tools.json, the single source of truth for the tool list. Also
# regenerates the "ARTICLES" nav link and (on articles.html only) the
# article list, from build/articles.json — the equivalent single source of
# truth for the article/guide content type.
#
# Usage:  powershell -File build/Sync-Nav.ps1
#
# How it works: pages carry marker pairs:
#   <!-- TB:NAV:START --> ... <!-- TB:NAV:END -->
#   <!-- TB:COUNT:START --> ... <!-- TB:COUNT:END -->
#   <!-- TB:COUNTINLINE:START -->N<!-- TB:COUNTINLINE:END --> (optional, prose)
#   <!-- TB:HOMEGRID:START --> ... <!-- TB:HOMEGRID:END --> (index.html only)
#   <!-- TB:SEARCHDATA:START --> ... <!-- TB:SEARCHDATA:END --> (index.html only)
#   <!-- TB:ARTICLELIST:START --> ... <!-- TB:ARTICLELIST:END --> (articles.html only)
#   <!-- TB:BREADCRUMB:START --> ... <!-- TB:BREADCRUMB:END --> (every page except index.html)
# On first run (no markers present yet) the script wraps the existing
# hand-written blocks with markers. On every run it regenerates the content
# between the markers from tools.json/articles.json, so adding/renaming/
# reordering a tool or article only ever requires editing the JSON once —
# this used to also require manually updating the "N TOOLS" tagline and the
# homepage's category grids by hand on every page, and both silently went
# stale more than once. Never hand-edit content between marker pairs, or
# hand-add a new article page's link anywhere but articles.json — extend
# this script instead if a new "for every article, render X" need shows up.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$toolsJsonText = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tools.json'), [System.Text.Encoding]::UTF8)
$data = $toolsJsonText | ConvertFrom-Json
$articlesJsonText = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'articles.json'), [System.Text.Encoding]::UTF8)
$articleData = $articlesJsonText | ConvertFrom-Json
# The header panels group tools under editorial sub-headings ("Borrowing",
# "Investing", ...). tools.json only has four flat categories, so that grouping
# needs a home; it is data, not markup, and lives here.
$navGroupsJsonText = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'nav-groups.json'), [System.Text.Encoding]::UTF8)
$navGroups = $navGroupsJsonText | ConvertFrom-Json
$nl = "`r`n"

# Section row + search + the six dropdown panels.
#
# This replaced the two-tier ruler on 2026-08-02. The old one put all 203 tool
# links in the DOM of every page and, opened, stood 322px tall showing 89 links
# at once; its tab row also stopped at x=595 inside a container running to 1236,
# leaving 641px of ruled dead space, which is what made it read as misaligned.
#
# The panels are rendered STATICALLY here rather than built by JS: the links
# then exist for crawlers and for anyone with JS off, and there are ~104 of them
# per page instead of 203 — fewer sitewide nav links means less dilution of the
# pages we are deliberately concentrating authority on.
#
# The 99 tools not surfaced in a panel are not orphaned: each panel foot links
# to that category's zone on the homepage grid (#cat-<id>), which lists all of
# them, and the header search covers every tool and article.
function New-NavBlock($indent) {
    $lines = New-Object System.Collections.Generic.List[string]
    $i2 = "$indent  "
    $i3 = "$indent    "

    $lines.Add("$indent<div class=`"rule`"></div>")
    $lines.Add("$indent<nav class=`"sections`" id=`"sections`" aria-label=`"Sections`">")
    $lines.Add("$i2<a class=`"sec`" href=`"index.html`">HOME</a>")
    $lines.Add("$i2<button class=`"sec`" type=`"button`" data-p=`"articles`" aria-expanded=`"false`">ARTICLES</button>")
    # BOOK stays because the books are finance content — same subject as the
    # site. VENSTOCK was removed 2026-07-29 and moved to venrostech.com: it is
    # inventory software, and carrying an unrelated product in the primary nav
    # muddies what TallyBench is topically about. The rule going forward is
    # "anything topically finance stays; anything else lives on the studio site".
    $lines.Add("$i2<button class=`"sec`" type=`"button`" data-p=`"book`" aria-expanded=`"false`">BOOK</button>")
    foreach ($cat in $data.categories) {
        $lines.Add("$i2<button class=`"sec`" type=`"button`" data-p=`"$($cat.id)`" aria-expanded=`"false`">$($cat.label)</button>")
    }
    $lines.Add("$indent</nav>")
    $lines.Add("$indent<div class=`"rule`"></div>")

    # Search, on every page. It previously existed on index.html alone, so on
    # the other 254 pages there was no way to reach the other 202 tools except
    # the category ruler. No ids here: index.html's hero search already owns
    # #tbSearchInput, and two elements sharing an id is a real bug, so the
    # script wires every .tb-search container by class instead.
    $lines.Add("$indent<div class=`"searchline`">")
    $lines.Add("$i2<div class=`"tb-search nav-search`" role=`"search`">")
    $lines.Add("$i3<div class=`"sfield`">")
    $lines.Add("$i3  <svg class=`"sicon`" width=`"14`" height=`"14`" viewBox=`"0 0 24 24`" fill=`"none`" stroke=`"currentColor`" stroke-width=`"2.5`" aria-hidden=`"true`"><circle cx=`"11`" cy=`"11`" r=`"7`"/><path d=`"M20 20l-3.5-3.5`"/></svg>")
    $lines.Add("$i3  <input class=`"tb-search-input`" type=`"text`" placeholder=`"Search $($data.tools.Count) calculators and $($articleData.articles.Count) guides`" autocomplete=`"off`" aria-label=`"Search calculators and guides`">")
    $lines.Add("$i3  <kbd>/</kbd>")
    $lines.Add("$i3</div>")
    $lines.Add("$i3<div class=`"tb-search-results`" hidden></div>")
    $lines.Add("$i2</div>")
    $lines.Add("$indent</div>")

    # ---- the panels ----
    $lines.Add("$indent<div class=`"nav-panels`" id=`"navPanels`">")

    foreach ($cat in $data.categories) {
        $cols = $navGroups.groups.($cat.id)
        if ($null -eq $cols) { continue }
        $count = @($data.tools | Where-Object { $_.category -eq $cat.id }).Count
        $lines.Add("$i2<div class=`"npanel`" data-p=`"$($cat.id)`" hidden>")
        $lines.Add("$i3<div class=`"wrap`">")
        $lines.Add("$i3  <div class=`"npanel-grid`">")
        foreach ($col in $cols) {
            $lines.Add("$i3    <div class=`"npcol`">")
            $lines.Add("$i3      <h4>$([System.Net.WebUtility]::HtmlEncode($col.h))</h4>")
            foreach ($id in $col.items) {
                $t = $data.tools | Where-Object { $_.file -eq "$id.html" } | Select-Object -First 1
                if ($null -eq $t) { throw "nav-groups.json references unknown tool '$id'" }
                # tools.json titles already carry HTML entities ("FIRE &amp;
                # Coast FIRE"), so encoding here produced "&amp;amp;". Emit the
                # title as stored; only the column heading below needs encoding,
                # because those are written as plain text in nav-groups.json.
                $label = $t.title -replace ' Calculator$', '' -replace ' Converter$', ''
                $lines.Add("$i3      <a href=`"$($t.file)`">$label</a>")
            }
            $lines.Add("$i3    </div>")
        }
        $lines.Add("$i3  </div>")
        $lines.Add("$i3  <div class=`"npanel-foot`"><a href=`"index.html#cat-$($cat.id)`">See all $count $($cat.label.ToLower()) tools &#8594;</a></div>")
        $lines.Add("$i3</div>")
        $lines.Add("$i2</div>")
    }

    # ARTICLES panel — grouped by the topics articles.json already defines, so
    # the structure is the site's own rather than invented here.
    $lines.Add("$i2<div class=`"npanel`" data-p=`"articles`" hidden>")
    $lines.Add("$i3<div class=`"wrap`">")
    $lines.Add("$i3  <div class=`"npanel-grid`">")
    $topicCols = @(
        @{ h = 'Tax &amp; filing'; t = @('tax') },
        @{ h = 'Rates &amp; central banks'; t = @('rates') },
        @{ h = 'Borrowing &amp; student loans'; t = @('borrowing', 'studentloans') },
        @{ h = 'Retirement, markets &amp; health'; t = @('retirement', 'markets', 'health') }
    )
    foreach ($col in $topicCols) {
        $lines.Add("$i3    <div class=`"npcol`">")
        $lines.Add("$i3      <h4>$($col.h)</h4>")
        foreach ($topicId in $col.t) {
            $inTopic = @($articleData.articles | Where-Object { $_.topic -eq $topicId } |
                Sort-Object -Property date -Descending | Select-Object -First 3)
            foreach ($a in $inTopic) {
                $lines.Add("$i3      <a href=`"$($a.file)`">$($a.title)</a>")
            }
        }
        $lines.Add("$i3    </div>")
    }
    $lines.Add("$i3  </div>")
    $lines.Add("$i3  <div class=`"npanel-foot`"><a href=`"articles.html`">See all $($articleData.articles.Count) guides &#8594;</a></div>")
    $lines.Add("$i3</div>")
    $lines.Add("$i2</div>")

    # BOOK panel — two columns, because there are two books; four would leave
    # half the grid empty.
    $lines.Add("$i2<div class=`"npanel npanel-2`" data-p=`"book`" hidden>")
    $lines.Add("$i3<div class=`"wrap`">")
    $lines.Add("$i3  <div class=`"npanel-grid`">")
    $lines.Add("$i3    <div class=`"npcol`">")
    $lines.Add("$i3      <h4>The books</h4>")
    $lines.Add("$i3      <a href=`"book.html`">From Paycheck to Portfolio</a>")
    $lines.Add("$i3      <a href=`"book.html`">Paisa Playbook (India)</a>")
    $lines.Add("$i3    </div>")
    $lines.Add("$i3    <div class=`"npcol`">")
    $lines.Add("$i3      <h4>Start here</h4>")
    $lines.Add("$i3      <a href=`"how-much-you-need-to-retire.html`">How much do you need to retire?</a>")
    $lines.Add("$i3      <a href=`"debt-snowball-vs-avalanche.html`">Debt snowball vs avalanche</a>")
    $lines.Add("$i3      <a href=`"what-moves-your-credit-score.html`">What moves your credit score</a>")
    $lines.Add("$i3    </div>")
    $lines.Add("$i3  </div>")
    $lines.Add("$i3  <div class=`"npanel-foot`"><a href=`"book.html`">Read more about the books &#8594;</a></div>")
    $lines.Add("$i3</div>")
    $lines.Add("$i2</div>")

    $lines.Add("$indent</div>")

    # Search index as an external file so it is fetched and cached once for the
    # whole site rather than inlined into all 256 pages. deferred, so the search
    # code in script.js must read window.TB_SEARCH_DATA lazily, not at init.
    $lines.Add("$indent<script src=`"search-data.js`" defer></script>")

    return ($lines -join $nl)
}

function New-CountBlock($indent) {
    # This line now sits under the wordmark in the masthead rather than beside
    # it, so it leads with what the site IS before quoting a number. Still
    # generated: a hand-typed count here went stale at 49, 60, 125, 137 and 196.
    $dot = [char]0x00B7
    return "PERSONAL FINANCE $dot $($data.tools.Count) TOOLS $dot 0 SIGN-UP"
}

# Just the bare number, for prose that mentions the tool count mid-sentence.
# This exists because hand-written body copy citing the count went stale at
# 49, 60, 125, 137 and 196 — the generated header was right every time while
# the sentence beneath it was wrong. Wrap any such mention in the markers.
function New-CountInlineBlock($indent) {
    return "$($data.tools.Count)"
}

# Same idea for the article/guide count. Added because the hero SVG's second
# readout said "65 new" under the label "UPDATED THIS WEEK" — a claim that was
# both stale and unverifiable, since nothing recomputes it. Replaced with a
# generated count of a thing that actually exists and can be checked.
function New-ArticleCountInlineBlock($indent) {
    return "$($articleData.articles.Count)"
}

# The AdSense site-verification tag. This is a STATIC meta tag rather than the
# ad script on purpose: the ad script in script.js only injects after a visitor
# clicks Accept on the consent banner, and Google's reviewer arrives with an
# empty localStorage and clicks nothing — so before this existed there was no
# way for Google to detect ad code on the site at all. The meta tag is served
# in the HTML regardless of consent, which is what verification needs, while
# the actual ad script stays behind the consent gate where it belongs.
# Generated rather than hand-written so the publisher ID has one definition.
function New-AdsenseBlock($indent) {
    return "$indent<meta name=`"google-adsense-account`" content=`"ca-pub-7800403656727097`">"
}

# Publisher identity, on every page.
#
# Added 2026-08-12 after AdSense rejected the site for "Low value content". The
# site had no machine-readable statement of who publishes it anywhere: no
# Organization, no WebSite, no author, no publisher. For a site whose subject is
# money and health -- the categories Google scrutinises hardest -- an anonymous
# publisher is a trust problem on its own, quite separate from how good any
# individual page is.
#
# publishingPrinciples points at methodology.html, which is the specific
# property Google's own structured-data guidance names for "where this
# publisher states how it works". It is only worth emitting because that page
# genuinely exists and genuinely describes the process; pointing it at a stub
# would be worse than omitting it.
function New-PublisherBlock($indent) {
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("$indent<script type=`"application/ld+json`">")
    $lines.Add("$indent{")
    $lines.Add("$indent  `"@context`": `"https://schema.org`",")
    $lines.Add("$indent  `"@graph`": [")
    $lines.Add("$indent    {")
    $lines.Add("$indent      `"@type`": `"Organization`",")
    $lines.Add("$indent      `"@id`": `"https://tallybench.com/#publisher`",")
    $lines.Add("$indent      `"name`": `"TallyBench`",")
    $lines.Add("$indent      `"legalName`": `"Venros Tech`",")
    $lines.Add("$indent      `"url`": `"https://tallybench.com/`",")
    $lines.Add("$indent      `"logo`": `"https://tallybench.com/icon-192.svg`",")
    $lines.Add("$indent      `"email`": `"helpdesktallybench@gmail.com`",")
    $lines.Add("$indent      `"description`": `"An independent personal finance resource: free calculators and researched guides on loans, mortgages, tax, investing and debt, plus health, education and everyday tools.`",")
    $lines.Add("$indent      `"publishingPrinciples`": `"https://tallybench.com/methodology.html`",")
    $lines.Add("$indent      `"contactPoint`": {")
    $lines.Add("$indent        `"@type`": `"ContactPoint`",")
    $lines.Add("$indent        `"contactType`": `"editorial`",")
    $lines.Add("$indent        `"email`": `"helpdesktallybench@gmail.com`",")
    $lines.Add("$indent        `"url`": `"https://tallybench.com/contact.html`"")
    $lines.Add("$indent      }")
    $lines.Add("$indent    },")
    $lines.Add("$indent    {")
    $lines.Add("$indent      `"@type`": `"WebSite`",")
    $lines.Add("$indent      `"@id`": `"https://tallybench.com/#website`",")
    $lines.Add("$indent      `"url`": `"https://tallybench.com/`",")
    $lines.Add("$indent      `"name`": `"TallyBench`",")
    $lines.Add("$indent      `"publisher`": { `"@id`": `"https://tallybench.com/#publisher`" }")
    $lines.Add("$indent    }")
    $lines.Add("$indent  ]")
    $lines.Add("$indent}")
    $lines.Add("$indent</script>")
    return ($lines -join $nl)
}

# The footer link row.
#
# Contact and Methodology are new here, and the reason they are generated rather
# than hand-added is that the footer is otherwise identical on 249 pages and
# would drift the moment one of them changed. Only the link run is inside the
# markers -- the per-page notes that a couple of pages carry ("estimates only,
# not tax advice" on tax-calculator.html) sit outside and are untouched.
function New-FooterNavBlock($indent) {
    $links = @(
        @('about.html', 'About'),
        @('methodology.html', 'Methodology'),
        @('contact.html', 'Contact'),
        @('privacy-policy.html', 'Privacy Policy'),
        @('terms.html', 'Terms')
    )
    $rendered = $links | ForEach-Object {
        "<a href=`"$($_[0])`" style=`"color:var(--teal-dark);`">$($_[1])</a>"
    }
    return "$indent" + ($rendered -join ' &middot; ')
}

# Social/preview image + the image-preview directive, per page.
#
# Two things gate Google Discover, and before this block the site failed both.
# Discover is a push feed rather than a query ranking, which makes it the one
# channel not gated on the domain authority this site does not yet have — but
# Google cannot show a large preview without max-image-preview:large, and it
# will not surface a page whose image is the same generic asset as every other
# page's. All 259 pages pointed at one shared og-image.png.
#
# Articles now get their own 1200x630 card, generated from articles.json by
# build/gen-cards.js so it cannot drift from the article it represents (the
# Discover policy requires the preview to reflect the page). Tools keep the
# shared brand image — they are not Discover material and a per-tool card
# would be 206 files of noise.
#
# The declared dimensions are the real ones. They previously said 1200x630 for
# an asset that is actually 2400x1260.
#
# Not emitted on the three redirect stubs: they carry their own
# "noindex, follow" robots tag and have no marker, so Sync-Marker skips them.
function New-SocialBlock($indent, $fileName) {
    $article = $articleData.articles | Where-Object { $_.file -eq $fileName } | Select-Object -First 1

    if ($article) {
        $img = 'https://tallybench.com/social/' + ($fileName -replace '\.html$', '.jpg')
        $w = '1200'; $h = '630'
    } else {
        $img = 'https://tallybench.com/og-image.png'
        $w = '2400'; $h = '1260'
    }

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("$indent<meta name=`"robots`" content=`"max-image-preview:large`">")
    $lines.Add("$indent<meta property=`"og:image`" content=`"$img`">")
    $lines.Add("$indent<meta property=`"og:image:width`" content=`"$w`">")
    $lines.Add("$indent<meta property=`"og:image:height`" content=`"$h`">")
    $lines.Add("$indent<meta name=`"twitter:image`" content=`"$img`">")
    return ($lines -join $nl)
}

# Renders the embeddable-calculator list for embed.html. Every tool is
# embeddable — the widget keys off ?embed=1, which any tool page honours — so
# this is a straight projection of tools.json grouped by category.
# The iframe snippet is deliberately NOT emitted per row: 201 textareas would
# bloat the page, and the snippet format already has exactly one definition
# site inside script.js. Each row carries only the filename and display name
# as data attributes, and the page builds the code on click.
function New-EmbedListBlock($indent) {
    $lines = New-Object System.Collections.Generic.List[string]
    $inner = "$indent  "
    foreach ($cat in $data.categories) {
        $toolsInCat = @($data.tools | Where-Object { $_.category -eq $cat.id })
        if ($toolsInCat.Count -eq 0) { continue }
        $label = (Get-Culture).TextInfo.ToTitleCase($cat.label.ToLower())
        $lines.Add("$indent<h3 class=`"emb-cat`" id=`"emb-$($cat.id)`">$label <span>$($toolsInCat.Count) tools</span></h3>")
        $lines.Add("$indent<ul class=`"emb-list`">")
        foreach ($t in $toolsInCat) {
            $safeTitle = $t.title -replace '&', '&amp;' -replace '"', '&quot;'
            $lines.Add("$inner<li><span class=`"emb-name`">$safeTitle</span><button type=`"button`" class=`"ghost emb-copy`" data-file=`"$($t.file)`" data-name=`"$safeTitle`">Copy embed code</button></li>")
        }
        $lines.Add("$indent</ul>")
    }
    return ($lines -join $nl)
}

# Maps a category id to the CSS modifier class used on homepage tool cards.
# "everyday" historically used "cat-utility" rather than "cat-everyday", so
# this isn't a straight "cat-$id" — kept as an explicit map to avoid guessing.
$catCssClass = @{ finance = 'cat-finance'; health = 'cat-health'; education = 'cat-education'; everyday = 'cat-utility' }

function New-HomeGridBlock($indent) {
    $lines = New-Object System.Collections.Generic.List[string]
    $innerIndent = "$indent  "
    $heroCount = 5
    foreach ($cat in $data.categories) {
        $toolsInCat = @($data.tools | Where-Object { $_.category -eq $cat.id })
        if ($toolsInCat.Count -eq 0) { continue }
        $label = (Get-Culture).TextInfo.ToTitleCase($cat.label.ToLower())
        # id anchor so the header panel's "See all N tools" can land on this
        # zone. The panels surface 104 of the 203 tools; the rest stay one
        # click away through here rather than being unreachable from the nav.
        $lines.Add("$indent<section class=`"zone zone-$($cat.id)`" id=`"cat-$($cat.id)`">")
        $lines.Add("$innerIndent<div class=`"wrap`">")
        $lines.Add("$innerIndent<div class=`"zone-head`">")
        $lines.Add("$innerIndent<div class=`"zone-head-left`">")
        $lines.Add("$innerIndent<span class=`"zone-chip`">$($cat.label)</span>")
        $lines.Add("$innerIndent<span class=`"zone-count`">$($toolsInCat.Count) tools</span>")
        $lines.Add("$innerIndent</div>")
        if ($toolsInCat.Count -gt $heroCount) {
            $lines.Add("$innerIndent<button class=`"zone-viewall`" type=`"button`">View all $($toolsInCat.Count) &#8594;</button>")
        }
        $lines.Add("$innerIndent</div>")
        $lines.Add("$innerIndent<h2 class=`"zone-title`">$label</h2>")
        $lines.Add("$innerIndent<p class=`"zone-blurb`">$($cat.blurb)</p>")
        $lines.Add("$innerIndent<div class=`"tool-grid`">")
        $cssClass = $catCssClass[$cat.id]
        $i = 0
        foreach ($tool in $toolsInCat) {
            $i++
            $extraClass = if ($i -gt $heroCount) { " zone-extra" } else { "" }
            $lines.Add("$innerIndent<a class=`"tool-card-link $cssClass$extraClass`" href=`"$($tool.file)`">")
            $lines.Add("$innerIndent<div class=`"tcl-top`"><div class=`"tcl-icon`"><svg><use href=`"icons.svg#$($tool.icon)`"/></svg></div></div>")
            $lines.Add("$innerIndent<h3>$($tool.title)</h3>")
            $lines.Add("$innerIndent<p>$($tool.blurb)</p>")
            $lines.Add("$innerIndent</a>")
        }
        $lines.Add("$innerIndent</div>")
        $lines.Add("$innerIndent</div>")
        $lines.Add("$indent</section>")
    }
    return ($lines -join $nl)
}

# The index itself now lives in search-data.js (written by Write-SearchDataFile
# below) and is loaded by every page from the nav block, so the browser fetches
# it once for the whole site. Inlining it here as well would repeat ~24KB on
# the site's most important page for no benefit.
function New-SearchDataBlock($indent) {
    return "$indent<!-- search index is served from search-data.js, loaded by the nav block -->"
}

# Articles are in the index too. Search that only covered calculators sent
# anyone looking for "RAP vs IBR" or "HRA exemption" to a dead end, even though
# the site has a piece on each.
function Write-SearchDataFile($root) {
    $items = New-Object System.Collections.Generic.List[object]
    foreach ($t in $data.tools) {
        $items.Add([PSCustomObject]@{ t = $t.title; f = $t.file; c = $t.category; b = $t.blurb })
    }
    foreach ($a in $articleData.articles) {
        $items.Add([PSCustomObject]@{ t = $a.title; f = $a.file; c = 'guide'; b = $a.dek })
    }
    # .ToArray() first: passing the generic List straight to ConvertTo-Json
    # throws "Argument types do not match" on Windows PowerShell 5.1.
    $json = ConvertTo-Json -InputObject $items.ToArray() -Compress -Depth 3
    $body = "/* Generated by build/Sync-Nav.ps1 from tools.json + articles.json." + $nl +
            "   Do not edit by hand. */" + $nl +
            "window.TB_SEARCH_DATA = $json;" + $nl
    $path = Join-Path $root 'search-data.js'
    $existing = if (Test-Path $path) { [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8) } else { '' }
    if ($existing -ne $body) {
        [System.IO.File]::WriteAllText($path, $body, (New-Object System.Text.UTF8Encoding $false))
        return $true
    }
    return $false
}

# Articles render grouped by topic rather than as one flat reverse-chronological
# list. Every article stays in the DOM — this is grouping, not JS filtering — so
# the whole archive remains crawlable and each topic heading gives the section
# real structure. Topic order comes from articles.json, newest-first within each.
function New-ArticleListBlock($indent) {
    $lines = New-Object System.Collections.Generic.List[string]
    $innerIndent = "$indent  "

    # A "latest" strip first, so the newest work is visible without scrolling
    # past six topic headings to find it.
    $latest = @($articleData.articles | Sort-Object -Property date -Descending | Select-Object -First 3)
    $lines.Add("$indent<div class=`"topic-block`" id=`"latest`">")
    $lines.Add("$innerIndent<div class=`"zone-head`"><div class=`"zone-head-left`">")
    $lines.Add("$innerIndent  <span class=`"zone-chip`">LATEST</span>")
    $lines.Add("$innerIndent  <span class=`"zone-count`">$($articleData.articles.Count) articles in total</span>")
    $lines.Add("$innerIndent</div></div>")
    foreach ($art in $latest) {
        $lines.Add((New-ArticleCard $innerIndent $art))
    }
    $lines.Add("$indent</div>")

    foreach ($topic in $articleData.topics) {
        $inTopic = @($articleData.articles | Where-Object { $_.topic -eq $topic.id } | Sort-Object -Property date -Descending)
        if ($inTopic.Count -eq 0) { continue }
        $noun = if ($inTopic.Count -eq 1) { 'article' } else { 'articles' }
        $lines.Add("$indent<div class=`"topic-block`" id=`"topic-$($topic.id)`">")
        $lines.Add("$innerIndent<div class=`"zone-head`"><div class=`"zone-head-left`">")
        $lines.Add("$innerIndent  <span class=`"zone-chip`">$($topic.label)</span>")
        $lines.Add("$innerIndent  <span class=`"zone-count`">$($inTopic.Count) $noun</span>")
        $lines.Add("$innerIndent</div></div>")
        $lines.Add("$innerIndent<h2 class=`"zone-title`">$($topic.title)</h2>")
        $lines.Add("$innerIndent<p class=`"zone-blurb`">$($topic.blurb)</p>")
        foreach ($art in $inTopic) {
            $lines.Add((New-ArticleCard $innerIndent $art))
        }
        $lines.Add("$indent</div>")
    }
    return ($lines -join $nl)
}

# The homepage's featured strip: the pieces where we computed something that
# does not exist elsewhere.
#
# Added because the homepage went hero -> 206 calculator tiles -> about, with no
# route to any of it. That buries the only work that can rank now: the generic
# calculators compete on domain authority against Calculator.net and lose, while
# the crossover studies and the India tax cluster compete on being the only good
# answer to a specific question. Same site, two different games, and the winnable
# one was invisible.
#
# Curated via a "featured" rank in articles.json rather than inferred from date
# or tag — "most recent" and "most differentiated" are not the same set, and the
# ordering here is an editorial judgement.
#
# Deliberately text-only. The social cards were tried here and the result read
# as a bug: each card already renders its tag and title into the image, so the
# strip showed both twice. The images exist for Discover and social, where they
# appear alone with no surrounding text; on-page the heading has to be real
# text anyway — selectable, scalable, and still there if the image does not
# load. Two image variants was not worth 46 more renders.
function New-FeaturedBlock($indent) {
    $inner = "$indent  "
    $featured = $articleData.articles | Where-Object { $_.featured } | Sort-Object { [int]$_.featured }
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("$indent<div class=`"featured-grid`">")
    foreach ($art in $featured) {
        $cssClass = $catCssClass[$art.category]
        $lines.Add("$inner<a class=`"article-card $cssClass`" href=`"$($art.file)`">")
        $lines.Add((New-ArticleThumb "$inner  " $art))
        $lines.Add("$inner  <div class=`"article-card-body`">")
        $lines.Add("$inner    <span class=`"article-card-tag`">$($art.tag)</span>")
        $lines.Add("$inner    <h3>$($art.title)</h3>")
        $lines.Add("$inner    <p>$($art.dek)</p>")
        $lines.Add("$inner  </div>")
        $lines.Add("$inner</a>")
    }
    $lines.Add("$indent</div>")
    return ($lines -join $nl)
}

# The thumbnail an article card shows, from social/thumb/ (800x420, written by
# build/gen-cards.js). alt is deliberately empty: the card's own <h3> is the
# accessible name of the same link, so describing the picture as well makes a
# screen reader announce the article twice. The illustration carries no
# information that the heading does not.
# width/height are the intrinsic pixel dimensions so the browser reserves the
# right box before the image arrives — without them a lazy-loaded strip reflows
# as it scrolls.
function New-ArticleThumb($indent, $art) {
    $img = 'social/thumb/' + ($art.file -replace '\.html$', '.jpg')
    return "$indent<img class=`"article-card-img`" src=`"$img`" alt=`"`" width=`"800`" height=`"420`" loading=`"lazy`" decoding=`"async`">"
}

function New-ArticleCard($indent, $art) {
    $inner = "$indent  "
    $cssClass = $catCssClass[$art.category]
    $niceDate = ([datetime]$art.date).ToString('MMMM d, yyyy')
    $card = New-Object System.Collections.Generic.List[string]
    $card.Add("$indent<a class=`"article-card $cssClass`" href=`"$($art.file)`">")
    $card.Add((New-ArticleThumb $inner $art))
    $card.Add("$inner<div class=`"article-card-body`">")
    $card.Add("$inner  <span class=`"article-card-tag`">$($art.tag)</span>")
    $card.Add("$inner  <h3>$($art.title)</h3>")
    $card.Add("$inner  <p>$($art.dek)</p>")
    $card.Add("$inner  <div class=`"article-card-meta`"><span>$niceDate</span><span>&middot;</span><span>$($art.readTime)</span></div>")
    $card.Add("$inner</div>")
    $card.Add("$indent</a>")
    return ($card -join $nl)
}

# Generates a page's BreadcrumbList JSON-LD purely from tools.json/
# articles.json — no need to parse each page's own .crumb HTML, since the
# breadcrumb structure is fully determined by which list (if any) the
# current filename appears in. Titles are stored in tools.json/articles.json
# pre-encoded for raw HTML interpolation elsewhere (e.g. "Break-Even &amp;
# Profit Margin Calculator"), so &amp; is decoded back to a literal & here
# since JSON-LD string values don't need HTML entity escaping.
function New-BreadcrumbBlock($indent, $fileName) {
    $tool = $data.tools | Where-Object { $_.file -eq $fileName } | Select-Object -First 1
    $article = $articleData.articles | Where-Object { $_.file -eq $fileName } | Select-Object -First 1

    $crumbs = New-Object System.Collections.Generic.List[object]
    $crumbs.Add(@{ name = 'TallyBench'; item = 'https://tallybench.com/' })

    if ($tool) {
        $crumbs.Add(@{ name = ($tool.title -replace '&amp;', '&'); item = "https://tallybench.com/$($tool.file)" })
    } elseif ($article) {
        $crumbs.Add(@{ name = 'Articles'; item = 'https://tallybench.com/articles.html' })
        $crumbs.Add(@{ name = ($article.title -replace '&amp;', '&'); item = "https://tallybench.com/$($article.file)" })
    } elseif ($fileName -eq 'articles.html') {
        $crumbs.Add(@{ name = 'Articles'; item = 'https://tallybench.com/articles.html' })
    } elseif ($fileName -eq 'book.html') {
        $crumbs.Add(@{ name = 'The Book'; item = 'https://tallybench.com/book.html' })
    } elseif ($fileName -eq 'about.html') {
        $crumbs.Add(@{ name = 'About'; item = 'https://tallybench.com/about.html' })
    } elseif ($fileName -eq 'privacy-policy.html') {
        $crumbs.Add(@{ name = 'Privacy Policy'; item = 'https://tallybench.com/privacy-policy.html' })
    } elseif ($fileName -eq 'methodology.html') {
        $crumbs.Add(@{ name = 'Methodology'; item = 'https://tallybench.com/methodology.html' })
    } elseif ($fileName -eq 'contact.html') {
        $crumbs.Add(@{ name = 'Contact'; item = 'https://tallybench.com/contact.html' })
    } elseif ($fileName -eq 'terms.html') {
        $crumbs.Add(@{ name = 'Terms'; item = 'https://tallybench.com/terms.html' })
    } else {
        return "$indent<!-- no breadcrumb rule for this page -->"
    }

    $listItems = New-Object System.Collections.Generic.List[object]
    for ($i = 0; $i -lt $crumbs.Count; $i++) {
        $listItems.Add([ordered]@{ '@type' = 'ListItem'; position = ($i + 1); name = $crumbs[$i].name; item = $crumbs[$i].item })
    }
    $obj = [ordered]@{
        '@context' = 'https://schema.org'
        '@type' = 'BreadcrumbList'
        itemListElement = $listItems
    }
    $json = $obj | ConvertTo-Json -Depth 6
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("$indent<script type=`"application/ld+json`">")
    ($json -split "`r?`n") | ForEach-Object { $lines.Add("$indent$_") }
    $lines.Add("$indent</script>")
    return ($lines -join $nl)
}

function Sync-Marker($content, $markerName, $generator) {
    $startTag = "<!-- TB:${markerName}:START -->"
    $endTag = "<!-- TB:${markerName}:END -->"

    if ($content -notmatch [regex]::Escape($startTag)) {
        return $null # marker not present in this file; caller decides whether that's ok
    }

    # Replace EVERY occurrence, not just the first. index.html carries two
    # COUNTINLINE blocks (the hero sentence and the hero SVG readout); when this
    # only rewrote the first match, the second silently kept whatever number was
    # typed the day it was written — which is how the SVG sat at "135" while the
    # site had 200 tools. A marker that is only sometimes generated is worse
    # than no marker, because it looks maintained.
    $pattern = [regex]::Escape($startTag) + '(?s).*?' + [regex]::Escape($endTag)
    $re = [regex]::new($pattern)
    $searchFrom = 0
    $found = $false

    while ($true) {
        $m = $re.Match($content, $searchFrom)
        if (-not $m.Success) { break }
        $found = $true

        # Indentation is resolved per occurrence: take the text between the
        # start of this match's line and the match itself, and use it only if
        # it is pure whitespace (i.e. the marker really does start a line).
        # An inline marker mid-line correctly yields no indent.
        $lineStart = $content.LastIndexOf("`n", $m.Index)
        if ($lineStart -lt 0) { $lineStart = 0 } else { $lineStart++ }
        $prefix = $content.Substring($lineStart, $m.Index - $lineStart)
        $indent = if ($prefix -match '^[ \t]*$') { $prefix } else { '' }

        $body = & $generator $indent
        $replacement = "$startTag$nl$body$nl$indent$endTag"
        $content = $content.Substring(0, $m.Index) + $replacement + $content.Substring($m.Index + $m.Length)
        $searchFrom = $m.Index + $replacement.Length
    }

    if (-not $found) { return $null }
    return $content
}

function Migrate-IfNeeded($content, $markerName, $legacyPattern) {
    $startTag = "<!-- TB:${markerName}:START -->"
    if ($content -match [regex]::Escape($startTag)) { return $content } # already migrated

    $m = [regex]::Match($content, $legacyPattern)
    if (-not $m.Success) { return $content } # this page doesn't have that block at all

    $indentMatch = [regex]::Match($m.Value, '^([ \t]*)')
    $indent = $indentMatch.Groups[1].Value
    $endTag = "<!-- TB:${markerName}:END -->"
    $wrapped = "$indent<!-- TB:${markerName}:START -->$nl$($m.Value)$nl$indent$endTag"
    return $content.Substring(0, $m.Index) + $wrapped + $content.Substring($m.Index + $m.Length)
}

$navLegacyPattern = '[ \t]*<nav class="ruler cat-ruler">(?s).*?</nav>\s*<nav class="ruler sub-ruler" id="subRuler">(?s).*?</nav>'
$countLegacyPattern = '\d+ TOOLS [^<]*SIGN-UP'

$htmlFiles = Get-ChildItem -Path $root -Filter '*.html' -File
$changed = @()
$missingMarkers = @()

foreach ($f in $htmlFiles) {
    $original = [System.IO.File]::ReadAllText($f.FullName)
    $content = $original

    $content = Migrate-IfNeeded $content 'NAV' $navLegacyPattern
    $content = Migrate-IfNeeded $content 'COUNT' $countLegacyPattern

    $navResult = Sync-Marker $content 'NAV' { param($indent) New-NavBlock $indent }
    if ($null -ne $navResult) { $content = $navResult }

    $countResult = Sync-Marker $content 'COUNT' { param($indent) New-CountBlock $indent }
    if ($null -ne $countResult) { $content = $countResult }

    # Optional — only the few pages that cite the count in prose carry these.
    $countInlineResult = Sync-Marker $content 'COUNTINLINE' { param($indent) New-CountInlineBlock $indent }
    if ($null -ne $countInlineResult) { $content = $countInlineResult }

    $articleCountInlineResult = Sync-Marker $content 'ARTICLECOUNTINLINE' { param($indent) New-ArticleCountInlineBlock $indent }
    if ($null -ne $articleCountInlineResult) { $content = $articleCountInlineResult }

    $homeGridResult = Sync-Marker $content 'HOMEGRID' { param($indent) New-HomeGridBlock $indent }
    if ($null -ne $homeGridResult) { $content = $homeGridResult }

    $embedListResult = Sync-Marker $content 'EMBEDLIST' { param($indent) New-EmbedListBlock $indent }
    if ($null -ne $embedListResult) { $content = $embedListResult }

    $searchDataResult = Sync-Marker $content 'SEARCHDATA' { param($indent) New-SearchDataBlock $indent }
    if ($null -ne $searchDataResult) { $content = $searchDataResult }

    $articleListResult = Sync-Marker $content 'ARTICLELIST' { param($indent) New-ArticleListBlock $indent }
    if ($null -ne $articleListResult) { $content = $articleListResult }

    $breadcrumbResult = Sync-Marker $content 'BREADCRUMB' { param($indent) New-BreadcrumbBlock $indent $f.Name }
    if ($null -ne $breadcrumbResult) { $content = $breadcrumbResult }

    $adsenseResult = Sync-Marker $content 'ADSENSE' { param($indent) New-AdsenseBlock $indent }
    if ($null -ne $adsenseResult) { $content = $adsenseResult }

    $socialResult = Sync-Marker $content 'SOCIAL' { param($indent) New-SocialBlock $indent $f.Name }
    if ($null -ne $socialResult) { $content = $socialResult }

    $publisherResult = Sync-Marker $content 'PUBLISHER' { param($indent) New-PublisherBlock $indent }
    if ($null -ne $publisherResult) { $content = $publisherResult }

    $footerNavResult = Sync-Marker $content 'FOOTERNAV' { param($indent) New-FooterNavBlock $indent }
    if ($null -ne $footerNavResult) { $content = $footerNavResult }

    $featuredResult = Sync-Marker $content 'FEATURED' { param($indent) New-FeaturedBlock $indent }
    if ($null -ne $featuredResult) { $content = $featuredResult }

    # A page with no marker is silently skipped by Sync-Marker, so a page that
    # was created without one keeps shipping stale/absent generated content and
    # nothing here complains. That has bitten this project twice (16 article
    # pages missing TB:BREADCRUMB). Collect the gaps and report them below.
    # Legitimate exceptions: the Google Search Console verification file is a
    # bare stub with no site chrome (and must never be edited), and index.html
    # is intentionally the one page with no breadcrumb, since it IS the root.
    # tallystock.html is a deliberate redirect stub left behind by the
    # VenStock rename — bare, no site chrome, and exempt for the same
    # reason as the verification file.
    # Detected by shape rather than by name, so each new rename stub is covered
    # automatically instead of being listed here.
    #
    # The shape test used to be "no <header>" alone, and that was too loose: five
    # real pages (embed.html and three new calculators among them) shipped with
    # the TB:NAV drawer sitting directly under <body> and no <header> wrapper at
    # all — no logo, no tool count, and on mobile no hamburger to open the nav
    # with. The very check meant to catch a page like that exempted them from it.
    # A genuine stub has no nav marker either, so require both to be absent.
    $isVerificationFile = ($f.Name -like 'google*.html') -or
                          (($content -notmatch '<header') -and ($content -notmatch 'TB:NAV:START'))
    if (-not $isVerificationFile) {
        foreach ($m in @('NAV', 'COUNT', 'ADSENSE', 'PUBLISHER', 'FOOTERNAV')) {
            if ($content -notmatch "TB:${m}:START") {
                $missingMarkers += [PSCustomObject]@{ File = $f.Name; Marker = $m }
            }
        }
        if ($f.Name -ne 'index.html' -and $content -notmatch 'TB:BREADCRUMB:START') {
            $missingMarkers += [PSCustomObject]@{ File = $f.Name; Marker = 'BREADCRUMB' }
        }
    }
    if ($f.Name -eq 'index.html') {
        foreach ($m in @('HOMEGRID', 'SEARCHDATA')) {
            if ($content -notmatch "TB:${m}:START") {
                $missingMarkers += [PSCustomObject]@{ File = $f.Name; Marker = $m }
            }
        }
    }
    if ($f.Name -eq 'articles.html' -and $content -notmatch 'TB:ARTICLELIST:START') {
        $missingMarkers += [PSCustomObject]@{ File = $f.Name; Marker = 'ARTICLELIST' }
    }

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($f.FullName, $content, $utf8NoBom)
        $changed += $f.Name
    }
}

$searchDataChanged = Write-SearchDataFile $root

Write-Host "Synced $($htmlFiles.Count) pages. Changed: $($changed.Count)"
if ($searchDataChanged) { Write-Host "  search-data.js rewritten" }
$changed | ForEach-Object { Write-Host "  $_" }

if ($missingMarkers.Count -gt 0) {
    Write-Host ""
    Write-Warning "$($missingMarkers.Count) missing marker(s) - these pages were SKIPPED, not synced:"
    $missingMarkers | ForEach-Object { Write-Host "  $($_.File) is missing TB:$($_.Marker)" -ForegroundColor Yellow }
    Write-Host "Add the marker pair to each page, then re-run this script." -ForegroundColor Yellow
} else {
    Write-Host "All expected markers present."
}
