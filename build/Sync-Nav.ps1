# Regenerates the shared header nav and "more calculators" blocks in every
# HTML page from build/tools.json, the single source of truth for the tool list.
#
# Usage:  powershell -File build/Sync-Nav.ps1
#
# How it works: each page carries two marker pairs:
#   <!-- TB:NAV:START --> ... <!-- TB:NAV:END -->
#   <!-- TB:MORETOOLS:START --> ... <!-- TB:MORETOOLS:END -->
# On first run (no markers present yet) the script wraps the existing
# hand-written blocks with markers. On every run it regenerates the content
# between the markers from tools.json, so adding/renaming/reordering a tool
# only ever requires editing tools.json once.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$data = Get-Content (Join-Path $PSScriptRoot 'tools.json') -Raw | ConvertFrom-Json
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$nl = "`r`n"

function New-NavBlock($indent) {
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("$indent<nav class=`"ruler cat-ruler`" aria-label=`"Category`">")
    $lines.Add("$indent  <a class=`"tick`" href=`"index.html`">HOME</a>")
    foreach ($cat in $data.categories) {
        $lines.Add("$indent  <button class=`"tick cat-tab`" type=`"button`" data-cat=`"$($cat.id)`">$($cat.label)</button>")
    }
    $lines.Add("$indent</nav>")
    $lines.Add("$indent<nav class=`"ruler sub-ruler`" id=`"subRuler`" aria-label=`"Tools`">")
    foreach ($tool in $data.tools) {
        $lines.Add("$indent  <a class=`"tick sub-tick`" data-cat=`"$($tool.category)`" href=`"$($tool.file)`">$($tool.navLabel)</a>")
    }
    $lines.Add("$indent</nav>")
    return ($lines -join $nl)
}

function New-MoreToolsBlock($indent, $selfId) {
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("$indent<nav class=`"more-tools`" aria-label=`"More calculators`">")
    $lines.Add("$indent  <h2>More calculators</h2>")
    $lines.Add("$indent  <ul>")
    foreach ($tool in $data.tools) {
        if ($tool.id -eq $selfId) { continue }
        $lines.Add("$indent    <li><a href=`"$($tool.file)`">$($tool.title)</a></li>")
    }
    $lines.Add("$indent  </ul>")
    $lines.Add("$indent</nav>")
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
$moreToolsLegacyPattern = '[ \t]*<(?:nav|section) class="more-tools">(?s).*?</(?:nav|section)>'

$htmlFiles = Get-ChildItem -Path $root -Filter '*.html' -File
$changed = @()

foreach ($f in $htmlFiles) {
    $original = [System.IO.File]::ReadAllText($f.FullName)
    $content = $original

    $content = Migrate-IfNeeded $content 'NAV' $navLegacyPattern
    $content = Migrate-IfNeeded $content 'MORETOOLS' $moreToolsLegacyPattern

    $selfId = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)

    $navResult = Sync-Marker $content 'NAV' { param($indent) New-NavBlock $indent }
    if ($null -ne $navResult) { $content = $navResult }

    $moreToolsResult = Sync-Marker $content 'MORETOOLS' { param($indent) New-MoreToolsBlock $indent $selfId }
    if ($null -ne $moreToolsResult) { $content = $moreToolsResult }

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($f.FullName, $content, $utf8NoBom)
        $changed += $f.Name
    }
}

Write-Host "Synced $($htmlFiles.Count) pages. Changed: $($changed.Count)"
$changed | ForEach-Object { Write-Host "  $_" }
