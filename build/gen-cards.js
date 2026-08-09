/* Generates social/<article>.jpg — the 1200x630 card used as og:image and
   twitter:image, and the thing Google Discover shows as a thumbnail.
   Run:  node build/gen-cards.js            (all articles)
         node build/gen-cards.js <id>       (one, for iterating on a design)

   Why this exists: Discover will not show a large preview without
   max-image-preview:large AND an image that is not the same asset every other
   page uses. All 259 pages previously pointed at one shared og-image.png.

   Everything on the card comes from articles.json — motif, figure and label —
   so a card cannot drift from the article it represents, which the Discover
   policy requires. The label is deliberately NOT the headline: in the feed the
   headline already appears as text beside the thumbnail, so repeating it there
   wastes the only visual slot you get. That was the flaw in the first version.

   Illustration is original vector, drawn in build/art-motifs.js. Nothing is
   licensed from anyone and nothing is photographic. */
const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', 'node_modules', 'puppeteer-core'));

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'social');
const MOTIFS = require('./art-motifs.js');
const articles = JSON.parse(fs.readFileSync(path.join(__dirname, 'articles.json'), 'utf8')).articles;

/* Palette is keyed to TOPIC, not category.
   Category gave only two colours — 39 of 46 cards came out the same brown, and
   in a feed the eye reads colour before it reads the drawing, so the whole set
   looked identical no matter how different the illustrations were. Seven topics
   means seven genuinely different cards, and it is also what stops a repeated
   shape from reading as a repeat.
   All are deep, saturated grounds with one light accent, so they still read as
   one family rather than seven unrelated designs. */
const PAL = {
  tax:          { g: ['#7A5620', '#4A3212'], accent: '#E8B65A', deep: '#3A2610' },
  rates:        { g: ['#2A4A6B', '#16293D'], accent: '#7FB2E0', deep: '#101E2C' },
  borrowing:    { g: ['#7A3327', '#4A1C14'], accent: '#F0937A', deep: '#38140E' },
  retirement:   { g: ['#2C5A3A', '#16301F'], accent: '#7FCB96', deep: '#0F2416' },
  markets:      { g: ['#463A78', '#241E45'], accent: '#A79BE8', deep: '#1B1636' },
  health:       { g: ['#234F4A', '#112824'], accent: '#6FD0C3', deep: '#0D201D' },
  studentloans: { g: ['#6B4060', '#3A2032'], accent: '#D79CC6', deep: '#2C1826' }
};
const FALLBACK = PAL.tax;

const esc = s => String(s == null ? '' : s)
  .replace(/&amp;/g, '&').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function card(a) {
  const c = PAL[a.topic] || FALLBACK;
  const draw = MOTIFS[a.cardArt];
  if (!draw) throw new Error('no motif "' + a.cardArt + '" for ' + a.id);
  const fig = a.cardFigure;
  // Bigger than the first pass. A thumbnail competes against photographs in the
  // feed, and restraint is the wrong instinct there — the figure is the thing
  // that has to carry at 300px wide.
  const figSize = !fig ? 0 : fig.length > 10 ? 88 : fig.length > 7 ? 106 : 138;
  const labelSize = fig ? 28 : 42;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Space Grotesk';src:url('file:///${ROOT.replace(/\\/g, '/')}/fonts/space-grotesk-latin.woff2') format('woff2');font-weight:400 700;font-display:block;}
@font-face{font-family:'JetBrains Mono';src:url('file:///${ROOT.replace(/\\/g, '/')}/fonts/jetbrains-mono-latin.woff2') format('woff2');font-weight:400 700;font-display:block;}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1200px;height:630px;overflow:hidden;}
.card{width:1200px;height:630px;background:linear-gradient(140deg,${c.g[0]},${c.g[1]});
  display:grid;grid-template-columns:1fr 540px;position:relative;overflow:hidden;}
.card::before{content:'';position:absolute;inset:0;
  background:radial-gradient(90% 70% at 88% 12%, rgba(255,255,255,0.13), transparent 62%);}
.left{padding:54px 0 54px 64px;display:flex;flex-direction:column;position:relative;z-index:1;}
.right{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;}
.tag{font-family:'JetBrains Mono',monospace;font-size:18px;letter-spacing:0.15em;
  text-transform:uppercase;color:${c.accent};}
.rule{height:4px;width:72px;background:${c.accent};border-radius:2px;margin:24px 0 22px;}
.fig{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:${figSize}px;line-height:0.96;
  color:#F7F2E6;letter-spacing:-0.035em;}
.label{font-family:'Space Grotesk',sans-serif;font-weight:400;font-size:${labelSize}px;line-height:1.28;
  color:rgba(247,242,230,0.82);margin-top:${fig ? 18 : 0}px;max-width:470px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.bot{margin-top:auto;}
.mark{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:26px;letter-spacing:0.04em;color:#F7F2E6;}
.mark i{font-style:normal;color:${c.accent};}
</style></head><body><div class="card">
  <div class="left">
    <div class="tag">${esc(a.tag)}</div>
    <div class="rule"></div>
    ${fig ? `<div class="fig">${esc(fig)}</div>` : ''}
    <div class="label">${esc(a.cardLabel)}</div>
    <div class="bot"><div class="mark">TALLYBENCH<i>.</i></div></div>
  </div>
  <div class="right"><svg width="520" height="520" viewBox="0 0 520 520">${draw(c)}</svg></div>
</div></body></html>`;
}

/* The same card at 800x420, written to social/thumb/.
   The on-page article cards show these at roughly 230-370px wide, so serving
   the full 1200x630 there would ship ~1.7MB of pixels to render a strip of
   thumbnails. 800px still covers a 370px slot on a 2x display. The 1200px
   original stays exactly as it is — Discover and the social platforms want the
   large one, and they read it from og:image, not from the page. */
const THUMB = path.join(OUT, 'thumb');
const THUMB_SCALE = 2 / 3;

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(THUMB)) fs.mkdirSync(THUMB, { recursive: true });
  const only = process.argv[2];
  const list = only ? articles.filter(a => a.id === only) : articles;
  if (!list.length) { console.log('no article matched "' + only + '"'); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  let bytes = 0, thumbBytes = 0;
  for (const a of list) {
    const name = a.file.replace(/\.html$/, '.jpg');
    const file = path.join(OUT, name);
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(card(a), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 70));
    await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
    bytes += fs.statSync(file).size;

    // Re-rendered rather than downscaled, so the type is rasterised at the
    // target size instead of being resampled — text this small goes mushy if
    // you shrink a 1200px bitmap.
    const thumb = path.join(THUMB, name);
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: THUMB_SCALE });
    await new Promise(r => setTimeout(r, 60));
    await page.screenshot({ path: thumb, type: 'jpeg', quality: 82 });
    thumbBytes += fs.statSync(thumb).size;

    if (only) console.log('  ' + name + '  ' + a.cardArt + '  ' + (a.cardFigure || '(no figure)'));
  }
  await browser.close();
  console.log(list.length + ' cards, ' + (bytes / 1024 / 1024).toFixed(1) + 'MB, avg ' +
    (bytes / list.length / 1024).toFixed(0) + 'KB');
  console.log(list.length + ' thumbs, ' + (thumbBytes / 1024 / 1024).toFixed(2) + 'MB, avg ' +
    (thumbBytes / list.length / 1024).toFixed(0) + 'KB');
})();
