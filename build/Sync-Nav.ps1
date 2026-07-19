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
#   <!-- TB:HOMEGRID:START --> ... <!-- TB:HOMEGRID:END --> (index.html only)
#   <!-- TB:SEARCHDATA:START --> ... <!-- TB:SEARCHDATA:END --> (index.html only)
#   <!-- TB:ARTICLELIST:START --> ... <!-- TB:ARTICLELIST:END --> (articles.html only)
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
$nl = "`r`n"

function New-NavBlock($indent) {
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("$indent<div class=`"nav-drawer`" id=`"navDrawer`">")
    $lines.Add("$indent  <div class=`"nav-drawer-head`">")
    $lines.Add("$indent    <span>Menu</span>")
    $lines.Add("$indent    <button class=`"nav-close`" id=`"navClose`" type=`"button`" aria-label=`"Close menu`">&#10005;</button>")
    $lines.Add("$indent  </div>")
    $lines.Add("$indent  <nav class=`"ruler cat-ruler`" aria-label=`"Category`">")
    $lines.Add("$indent    <a class=`"tick`" href=`"index.html`">HOME</a>")
    $lines.Add("$indent    <a class=`"tick`" href=`"articles.html`">ARTICLES</a>")
    foreach ($cat in $data.categories) {
        $lines.Add("$indent    <button class=`"tick cat-tab`" type=`"button`" data-cat=`"$($cat.id)`">$($cat.label)</button>")
    }
    $lines.Add("$indent  </nav>")
    $lines.Add("$indent  <nav class=`"ruler sub-ruler`" id=`"subRuler`" aria-label=`"Tools`">")
    foreach ($tool in $data.tools) {
        $lines.Add("$indent    <a class=`"tick sub-tick`" data-cat=`"$($tool.category)`" href=`"$($tool.file)`">$($tool.navLabel)</a>")
    }
    $lines.Add("$indent  </nav>")
    $lines.Add("$indent</div>")
    return ($lines -join $nl)
}

function New-CountBlock($indent) {
    return "$($data.tools.Count) TOOLS " + [char]0x00B7 + " 0 SIGN-UP"
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
        $lines.Add("$indent<section class=`"zone zone-$($cat.id)`">")
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

function New-SearchDataBlock($indent) {
    $items = @($data.tools | ForEach-Object {
        [PSCustomObject]@{ t = $_.title; f = $_.file; c = $_.category; b = $_.blurb }
    })
    $json = ConvertTo-Json -InputObject $items -Compress -Depth 3
    return "$indent<script>window.TB_SEARCH_DATA = $json;</script>"
}

function New-ArticleListBlock($indent) {
    $lines = New-Object System.Collections.Generic.List[string]
    $innerIndent = "$indent  "
    $sorted = @($articleData.articles | Sort-Object -Property date -Descending)
    foreach ($art in $sorted) {
        $cssClass = $catCssClass[$art.category]
        $niceDate = ([datetime]$art.date).ToString('MMMM d, yyyy')
        $lines.Add("$indent<a class=`"article-card $cssClass`" href=`"$($art.file)`">")
        $lines.Add("$innerIndent<span class=`"article-card-tag`">$($art.tag)</span>")
        $lines.Add("$innerIndent<h3>$($art.title)</h3>")
        $lines.Add("$innerIndent<p>$($art.dek)</p>")
        $lines.Add("$innerIndent<div class=`"article-card-meta`"><span>$niceDate</span><span>&middot;</span><span>$($art.readTime)</span></div>")
        $lines.Add("$indent</a>")
    }
    return ($lines -join $nl)
}

function Sync-Marker($content, $markerName, $generator) {
    $startTag = "<!-- TB:${markerName}:START -->"
    $endTag = "<!-- TB:${markerName}:END -->"

    if ($content -notmatch [regex]::Escape($startTag)) {
        return $null # marker not present in this file; caller decides whether that's ok
    }

    $pattern = [regex]::Escape($startTag) + '(?s).*?' + [regex]::Escape($endTag)
    $m = [regex]::Match($content, $pattern)

    $indentMatch = [regex]::Match($content, '(?m)^([ \t]*)' + [regex]::Escape($startTag))
    $indent = $indentMatch.Groups[1].Value

    $body = & $generator $indent
    $replacement = "$startTag$nl$body$nl$indent$endTag"
    return $content.Substring(0, $m.Index) + $replacement + $content.Substring($m.Index + $m.Length)
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

foreach ($f in $htmlFiles) {
    $original = [System.IO.File]::ReadAllText($f.FullName)
    $content = $original

    $content = Migrate-IfNeeded $content 'NAV' $navLegacyPattern
    $content = Migrate-IfNeeded $content 'COUNT' $countLegacyPattern

    $navResult = Sync-Marker $content 'NAV' { param($indent) New-NavBlock $indent }
    if ($null -ne $navResult) { $content = $navResult }

    $countResult = Sync-Marker $content 'COUNT' { param($indent) New-CountBlock $indent }
    if ($null -ne $countResult) { $content = $countResult }

    $homeGridResult = Sync-Marker $content 'HOMEGRID' { param($indent) New-HomeGridBlock $indent }
    if ($null -ne $homeGridResult) { $content = $homeGridResult }

    $searchDataResult = Sync-Marker $content 'SEARCHDATA' { param($indent) New-SearchDataBlock $indent }
    if ($null -ne $searchDataResult) { $content = $searchDataResult }

    $articleListResult = Sync-Marker $content 'ARTICLELIST' { param($indent) New-ArticleListBlock $indent }
    if ($null -ne $articleListResult) { $content = $articleListResult }

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($f.FullName, $content, $utf8NoBom)
        $changed += $f.Name
    }
}

Write-Host "Synced $($htmlFiles.Count) pages. Changed: $($changed.Count)"
$changed | ForEach-Object { Write-Host "  $_" }
