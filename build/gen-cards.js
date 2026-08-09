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

/* Deeper than the .article-hero gradients so white illustration reads cleanly
   on top; same hues, so the card and the page still look like one family. */
const PAL = {
  finance:   { g: ['#7A5620', '#4A3212'], accent: '#E8B65A', deep: '#3A2610' },
  health:    { g: ['#234F4A', '#112824'], accent: '#6FD0C3', deep: '#0D201D' },
  education: { g: ['#6B4060', '#3A2032'], accent: '#D79CC6', deep: '#2C1826' },
  everyday:  { g: ['#39566E', '#22364A'], accent: '#9CC0DC', deep: '#1A2A3A' }
};

const esc = s => String(s == null ? '' : s)
  .replace(/&amp;/g, '&').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function card(a) {
  const c = PAL[a.category] || PAL.finance;
  const draw = MOTIFS[a.cardArt];
  if (!draw) throw new Error('no motif "' + a.cardArt + '" for ' + a.id);
  const fig = a.cardFigure;
  // A long figure ("₹12.75 lakh") needs to come down or it collides with the
  // illustration; a short one ("21%") can run big.
  const figSize = !fig ? 0 : fig.length > 10 ? 76 : fig.length > 7 ? 92 : 118;
  const labelSize = fig ? 27 : 38;

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

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv[2];
  const list = only ? articles.filter(a => a.id === only) : articles;
  if (!list.length) { console.log('no article matched "' + only + '"'); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  let bytes = 0;
  for (const a of list) {
    const file = path.join(OUT, a.file.replace(/\.html$/, '.jpg'));
    await page.setContent(card(a), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 70));
    await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
    bytes += fs.statSync(file).size;
    if (only) console.log('  ' + path.basename(file) + '  ' + a.cardArt + '  ' + (a.cardFigure || '(no figure)'));
  }
  await browser.close();
  console.log(list.length + ' cards, ' + (bytes / 1024 / 1024).toFixed(1) + 'MB, avg ' +
    (bytes / list.length / 1024).toFixed(0) + 'KB');
})();
