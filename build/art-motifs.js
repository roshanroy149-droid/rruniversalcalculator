/* Flat-vector motifs for the article cards, drawn to a 520x520 box.
   Each takes the article's palette so the same drawing reads differently in
   finance amber vs health teal. Bold and simple on purpose: in a Discover feed
   the card is a thumbnail, so an iconic shape survives the scale and a detailed
   scene does not. */
module.exports = {

  // a date that matters — deadlines, instalments, meeting days
  calendar: c => `<g transform="translate(60,44)">
    <rect x="26" y="34" width="368" height="356" rx="26" fill="${c.deep}" opacity="0.55"/>
    <rect x="8" y="16" width="368" height="356" rx="26" fill="#F6F1E6"/>
    <rect x="8" y="16" width="368" height="84" rx="26" fill="${c.accent}"/>
    <rect x="8" y="74" width="368" height="26" fill="${c.accent}"/>
    <rect x="86" y="0" width="26" height="52" rx="13" fill="${c.deep}"/>
    <rect x="272" y="0" width="26" height="52" rx="13" fill="${c.deep}"/>
    ${[0,1,2,3].map(r=>[0,1,2,3,4].map(k=>(r===2&&k===3)?'':
      `<circle cx="${58+k*68}" cy="${148+r*58}" r="11" fill="${c.g[0]}" opacity="${0.18+r*0.04}"/>`).join('')).join('')}
    <circle cx="262" cy="264" r="34" fill="none" stroke="${c.g[0]}" stroke-width="7"/>
    <circle cx="262" cy="264" r="13" fill="${c.g[0]}"/></g>`,

  // a filing — returns, forms, notifications
  document: c => `<g transform="translate(78,40)">
    <rect x="34" y="40" width="286" height="368" rx="20" fill="${c.deep}" opacity="0.5"/>
    <path d="M14 20 h206 l66 66 v302 a20 20 0 0 1 -20 20 H14 a20 20 0 0 1 -20 -20 V40 a20 20 0 0 1 20 -20 z" fill="#F6F1E6"/>
    <path d="M220 20 l66 66 h-46 a20 20 0 0 1 -20 -20 z" fill="${c.accent}"/>
    ${[0,1,2,3,4].map(i=>`<rect x="42" y="${132+i*40}" width="${i===4?110:186}" height="12" rx="6" fill="${c.g[0]}" opacity="0.20"/>`).join('')}
    <circle cx="214" cy="326" r="58" fill="${c.accent}"/>
    <text x="214" y="352" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="66" fill="${c.deep}">&#8377;</text></g>`,

  // a threshold you cross — slabs, bands, limits.
  // Redrawn as a solid staircase: the first version was bars plus a rising
  // line, which was indistinguishable from `rise` at thumbnail size.
  steps: c => `<g transform="translate(52,116)">
    ${[0,1,2,3].map(i=>`<rect x="${i*104}" y="${272-i*72}" width="96" height="${72+i*72}" rx="10"
      fill="${i===3?c.accent:'#F6F1E6'}" opacity="${i===3?1:0.34+i*0.16}"/>`).join('')}
    <circle cx="360" cy="24" r="20" fill="${c.accent}"/>
    <path d="M348 24 l9 11 l20 -23" fill="none" stroke="${c.deep}" stroke-width="7"
      stroke-linecap="round" stroke-linejoin="round"/></g>`,

  // two paths that diverge — comparisons, either/or
  fork: c => `<g transform="translate(48,110)">
    <path d="M16 156 C 120 156, 150 156, 200 156 C 268 156, 300 42, 396 42" fill="none" stroke="${c.accent}" stroke-width="11" stroke-linecap="round"/>
    <path d="M200 156 C 268 156, 300 268, 396 268" fill="none" stroke="#F6F1E6" stroke-width="11" stroke-linecap="round" opacity="0.55"/>
    <path d="M200 156 C 268 156, 300 42, 396 42 L396 268 C 300 268, 268 156, 200 156 z" fill="${c.accent}" opacity="0.13"/>
    <circle cx="200" cy="156" r="20" fill="${c.deep}"/><circle cx="200" cy="156" r="10" fill="${c.accent}"/>
    <circle cx="396" cy="42" r="17" fill="${c.accent}"/><circle cx="396" cy="268" r="17" fill="#F6F1E6" opacity="0.6"/></g>`,

  // money accumulating — rebuilt: stacks now RISE with the arrow. The first
  // version had them descending under a rising arrow, which read as a
  // contradiction, and the overlapping ellipses rendered muddy.
  coins: c => `<g transform="translate(74,110)">
    ${[0,1,2].map(s=>{const x=s*126, n=s+2, base=316;
      return Array.from({length:n}).map((_,k)=>{const y=base-k*34;
        return `<ellipse cx="${x+82}" cy="${y+20}" rx="70" ry="21" fill="${c.deep}" opacity="0.30"/>
                <rect x="${x+12}" y="${y-6}" width="140" height="26" fill="${c.accent}" opacity="${0.72+k*0.06}"/>
                <ellipse cx="${x+82}" cy="${y-6}" rx="70" ry="21" fill="${c.accent}" opacity="${0.86+k*0.05}"/>
                <ellipse cx="${x+82}" cy="${y-6}" rx="42" ry="12" fill="#F6F1E6" opacity="0.30"/>`;}).join('');
    }).join('')}
    <path d="M30 128 L156 84 L282 26" fill="none" stroke="#F6F1E6" stroke-width="10" stroke-linecap="round" opacity="0.92"/>
    <path d="M246 20 L288 22 L282 64" fill="none" stroke="#F6F1E6" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/></g>`,

  // cover / protection — health schemes, insurance
  shield: c => `<g transform="translate(96,52)">
    <path d="M180 36 L338 96 v150 c0 108 -76 172 -158 200 c-82 -28 -158 -92 -158 -200 V96 z" fill="${c.deep}" opacity="0.5" transform="translate(20,22)"/>
    <path d="M180 16 L338 76 v150 c0 108 -76 172 -158 200 c-82 -28 -158 -92 -158 -200 V76 z" fill="#F6F1E6"/>
    <path d="M180 66 L292 108 v122 c0 78 -54 124 -112 146 c-58 -22 -112 -68 -112 -146 V108 z" fill="${c.accent}"/>
    <path d="M118 224 l44 46 l84 -100" fill="none" stroke="${c.deep}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/></g>`,

  // weighing two things — old vs new, this vs that
  balance: c => `<g transform="translate(60,70)">
    <rect x="188" y="60" width="22" height="290" rx="11" fill="#F6F1E6"/>
    <rect x="104" y="352" width="190" height="26" rx="13" fill="#F6F1E6"/>
    <rect x="46" y="88" width="306" height="16" rx="8" fill="${c.accent}"/>
    <circle cx="199" cy="70" r="24" fill="${c.accent}"/>
    <path d="M46 104 L4 190 h84 z" fill="#F6F1E6" opacity="0.85"/>
    <path d="M352 104 L310 214 h84 z" fill="${c.accent}"/>
    <ellipse cx="46" cy="196" rx="52" ry="14" fill="#F6F1E6" opacity="0.5"/>
    <ellipse cx="352" cy="220" rx="52" ry="14" fill="${c.accent}" opacity="0.6"/></g>`,

  // a discontinuity — a cliff edge, a cut-off, a rebate that stops.
  // Redrawn as a solid plateau with a broken-off edge; the first version was
  // a thin bare L-shape that read as nothing at thumbnail size.
  // Two plateaus at different heights with the drop between them. Third attempt:
  // the first was a bare L-shape, the second a block with a detached bar, and
  // neither read as anything at thumbnail size. Solid masses and a single
  // arrow are what make it legible small.
  cliff: c => `<g transform="translate(26,96)">
    <rect x="18" y="152" width="196" height="228" fill="#F6F1E6" opacity="0.26"/>
    <rect x="18" y="136" width="196" height="20" rx="6" fill="${c.accent}"/>
    <rect x="272" y="316" width="196" height="64" fill="#F6F1E6" opacity="0.16"/>
    <rect x="272" y="300" width="196" height="20" rx="6" fill="${c.accent}" opacity="0.55"/>
    <path d="M243 168 L243 274" stroke="#F6F1E6" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="2 26" opacity="0.75"/>
    <path d="M243 296 L219 258 h48 z" fill="#F6F1E6" opacity="0.85"/>
    <circle cx="214" cy="146" r="17" fill="${c.accent}"/>
    <circle cx="214" cy="146" r="7" fill="${c.deep}"/>
    <circle cx="272" cy="310" r="14" fill="#F6F1E6" opacity="0.6"/></g>`,

  // a record / a peak — index highs
  peak: c => `<g transform="translate(50,120)">
    <path d="M16 320 L142 128 L226 236 L340 44 L420 320 z" fill="#F6F1E6" opacity="0.22"/>
    <path d="M16 320 L142 128 L226 236 L340 44" fill="none" stroke="${c.accent}" stroke-width="11"
      stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="4" y="320" width="428" height="16" rx="8" fill="#F6F1E6" opacity="0.45"/>
    <circle cx="340" cy="44" r="21" fill="${c.accent}"/>
    <path d="M340 12 l9 22 h-18 z" fill="${c.accent}"/>
    <circle cx="142" cy="128" r="12" fill="#F6F1E6" opacity="0.65"/>
    <circle cx="226" cy="236" r="12" fill="#F6F1E6" opacity="0.45"/></g>`,

  // a listings board — indices, tickers, tables of numbers
  board: c => `<g transform="translate(56,96)">
    <rect x="34" y="42" width="366" height="290" rx="20" fill="${c.deep}" opacity="0.5"/>
    <rect x="10" y="18" width="366" height="290" rx="20" fill="#F6F1E6"/>
    <rect x="10" y="18" width="366" height="56" rx="20" fill="${c.accent}"/>
    <rect x="10" y="58" width="366" height="16" fill="${c.accent}"/>
    ${[0,1,2,3].map(i=>`
      <rect x="42" y="${104+i*50}" width="${132-i*14}" height="14" rx="7" fill="${c.g[0]}" opacity="0.22"/>
      <rect x="${232+i*10}" y="${104+i*50}" width="${104-i*10}" height="14" rx="7" fill="${c.accent}" opacity="${0.85-i*0.16}"/>`).join('')}
    <rect x="10" y="330" width="366" height="14" rx="7" fill="${c.accent}" opacity="0.3"/>
    <rect x="176" y="344" width="34" height="46" rx="6" fill="#F6F1E6" opacity="0.5"/>
    <rect x="120" y="386" width="146" height="16" rx="8" fill="#F6F1E6" opacity="0.5"/></g>`,

  // going up — hikes, records, growth
  rise: c => `<g transform="translate(58,96)">
    ${[0,1,2,3,4].map(i=>`<rect x="${i*82}" y="${300-i*58}" width="60" height="${44+i*58}" rx="10" fill="${i===4?c.accent:'#F6F1E6'}" opacity="${i===4?1:0.26+i*0.14}"/>`).join('')}
    <path d="M22 250 L104 200 L186 156 L268 96 L350 40" fill="none" stroke="${c.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M312 34 L356 34 L356 78" fill="none" stroke="${c.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>`,

  // coming down — cuts, easing, falling costs
  fall: c => `<g transform="translate(58,96)">
    ${[0,1,2,3,4].map(i=>`<rect x="${i*82}" y="${68+i*58}" width="60" height="${276-i*58}" rx="10" fill="${i===4?c.accent:'#F6F1E6'}" opacity="${i===4?1:0.26+i*0.14}"/>`).join('')}
    <path d="M22 46 L104 108 L186 160 L268 216 L350 272" fill="none" stroke="${c.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M312 278 L356 278 L356 234" fill="none" stroke="${c.accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>`,

  // held flat — holds, pauses, unchanged
  hold: c => `<g transform="translate(50,120)">
    <path d="M14 180 L406 180" stroke="${c.accent}" stroke-width="14" stroke-linecap="round"/>
    ${[0,1,2,3].map(i=>`<circle cx="${64+i*98}" cy="180" r="26" fill="${c.deep}"/><circle cx="${64+i*98}" cy="180" r="26" fill="none" stroke="${c.accent}" stroke-width="8"/>`).join('')}
    <rect x="150" y="34" width="26" height="90" rx="13" fill="#F6F1E6" opacity="0.55"/>
    <rect x="244" y="34" width="26" height="90" rx="13" fill="#F6F1E6" opacity="0.55"/></g>`,

  // a home — mortgages, housing, rent
  house: c => `<g transform="translate(70,86)">
    <path d="M196 20 L384 178 v212 a16 16 0 0 1 -16 16 H24 a16 16 0 0 1 -16 -16 V178 z" fill="${c.deep}" opacity="0.5" transform="translate(18,18)"/>
    <path d="M196 8 L384 166 v212 a16 16 0 0 1 -16 16 H24 a16 16 0 0 1 -16 -16 V166 z" fill="#F6F1E6"/>
    <path d="M196 8 L392 172 L376 192 L196 42 L16 192 L0 172 z" fill="${c.accent}"/>
    <rect x="150" y="256" width="92" height="138" rx="8" fill="${c.accent}"/>
    <rect x="66" y="212" width="66" height="66" rx="8" fill="${c.g[0]}" opacity="0.22"/>
    <rect x="260" y="212" width="66" height="66" rx="8" fill="${c.g[0]}" opacity="0.22"/></g>`,

  // plastic — credit cards, borrowing
  card: c => `<g transform="translate(48,140)">
    <rect x="40" y="46" width="368" height="228" rx="26" fill="${c.deep}" opacity="0.5"/>
    <rect x="16" y="22" width="368" height="228" rx="26" fill="#F6F1E6"/>
    <rect x="16" y="76" width="368" height="42" fill="${c.g[0]}" opacity="0.24"/>
    <rect x="50" y="152" width="88" height="62" rx="10" fill="${c.accent}"/>
    ${[0,1,2].map(i=>`<rect x="${168+i*56}" y="${196}" width="40" height="12" rx="6" fill="${c.g[0]}" opacity="0.24"/>`).join('')}
    <circle cx="316" cy="176" r="30" fill="${c.accent}" opacity="0.9"/>
    <circle cx="352" cy="176" r="30" fill="${c.accent}" opacity="0.55"/></g>`,

  // study — student loans, education
  cap: c => `<g transform="translate(50,120)">
    <path d="M208 26 L410 106 L208 186 L6 106 z" fill="#F6F1E6"/>
    <path d="M208 62 L318 106 L208 150 L98 106 z" fill="${c.accent}" opacity="0.5"/>
    <path d="M96 132 v96 c0 32 50 58 112 58 s112 -26 112 -58 v-96 l-112 44 z" fill="${c.accent}"/>
    <path d="M396 112 v118" stroke="#F6F1E6" stroke-width="10" stroke-linecap="round"/>
    <circle cx="396" cy="246" r="20" fill="#F6F1E6"/></g>`,

  // time — compounding, tenure, waiting
  clock: c => `<g transform="translate(80,80)">
    <circle cx="200" cy="200" r="180" fill="${c.deep}" opacity="0.5" transform="translate(18,18)"/>
    <circle cx="200" cy="200" r="180" fill="#F6F1E6"/>
    <circle cx="200" cy="200" r="146" fill="none" stroke="${c.g[0]}" stroke-width="6" opacity="0.16"/>
    <path d="M200 200 L200 86" stroke="${c.g[0]}" stroke-width="18" stroke-linecap="round"/>
    <path d="M200 200 L286 244" stroke="${c.accent}" stroke-width="18" stroke-linecap="round"/>
    <circle cx="200" cy="200" r="20" fill="${c.accent}"/>
    ${[0,3,6,9].map(h=>{const a=(h/12)*2*Math.PI-Math.PI/2;
      return `<circle cx="${200+Math.cos(a)*150}" cy="${200+Math.sin(a)*150}" r="10" fill="${c.g[0]}" opacity="0.30"/>`;}).join('')}</g>`,

  // a jurisdiction — country-specific policy
  globe: c => `<g transform="translate(80,80)">
    <circle cx="200" cy="200" r="180" fill="${c.deep}" opacity="0.5" transform="translate(16,16)"/>
    <circle cx="200" cy="200" r="180" fill="${c.accent}"/>
    <path d="M20 200 h360" stroke="#F6F1E6" stroke-width="8" opacity="0.75"/>
    <path d="M60 108 h280 M60 292 h280" stroke="#F6F1E6" stroke-width="7" opacity="0.5"/>
    <ellipse cx="200" cy="200" rx="86" ry="180" fill="none" stroke="#F6F1E6" stroke-width="8" opacity="0.75"/>
    <path d="M200 20 v360" stroke="#F6F1E6" stroke-width="8" opacity="0.75"/></g>`,

  // treatment cost — drugs, prescriptions
  pill: c => `<g transform="translate(70,120)">
    <g transform="rotate(-32 200 140)">
      <rect x="26" y="70" width="348" height="140" rx="70" fill="${c.deep}" opacity="0.45" transform="translate(16,18)"/>
      <rect x="26" y="70" width="348" height="140" rx="70" fill="#F6F1E6"/>
      <path d="M200 70 h104 a70 70 0 0 1 0 140 h-104 z" fill="${c.accent}"/>
      <path d="M26 140 h348" stroke="${c.g[0]}" stroke-width="5" opacity="0.16"/>
    </g>
    <circle cx="86" cy="330" r="22" fill="${c.accent}" opacity="0.55"/>
    <circle cx="150" cy="356" r="14" fill="${c.accent}" opacity="0.35"/></g>`,

  // put away — savings, retirement corpus
  vault: c => `<g transform="translate(66,80)">
    <rect x="34" y="42" width="356" height="330" rx="30" fill="${c.deep}" opacity="0.5"/>
    <rect x="10" y="18" width="356" height="330" rx="30" fill="#F6F1E6"/>
    <circle cx="188" cy="183" r="118" fill="none" stroke="${c.g[0]}" stroke-width="12" opacity="0.18"/>
    <circle cx="188" cy="183" r="80" fill="${c.accent}"/>
    <circle cx="188" cy="183" r="30" fill="${c.deep}"/>
    ${[0,1,2,3].map(i=>{const a=(i/4)*2*Math.PI+Math.PI/4;
      return `<rect x="${188+Math.cos(a)*104-9}" y="${183+Math.sin(a)*104-9}" width="18" height="18" rx="4" fill="${c.accent}" opacity="0.7"/>`;}).join('')}</g>`,

  // ---- one drawing per article from here, so no motif is ever reused ----

  snowball: c => `<g transform="translate(40,120)">
    ${[0,1,2,3].map(i=>`<circle cx="${58+i*104}" cy="${240-i*22}" r="${34+i*20}" fill="${i===3?c.accent:'#F6F1E6'}" opacity="${i===3?1:0.30+i*0.16}"/>`).join('')}
    <path d="M10 316 h430" stroke="${c.accent}" stroke-width="10" stroke-linecap="round" opacity="0.55"/></g>`,

  lawbook: c => `<g transform="translate(64,92)">
    <rect x="26" y="52" width="330" height="286" rx="16" fill="${c.deep}" opacity="0.5"/>
    <rect x="6" y="32" width="330" height="286" rx="16" fill="#F6F1E6"/>
    <rect x="6" y="32" width="66" height="286" rx="16" fill="${c.accent}"/>
    ${[0,1,2].map(i=>`<rect x="104" y="${96+i*56}" width="${196-i*40}" height="14" rx="7" fill="${c.g[0]}" opacity="0.22"/>`).join('')}
    <circle cx="252" cy="268" r="52" fill="${c.accent}"/>
    <path d="M252 240 v56 M228 254 h48" stroke="${c.deep}" stroke-width="12" stroke-linecap="round"/></g>`,

  briefcase: c => `<g transform="translate(56,128)">
    <rect x="30" y="70" width="368" height="242" rx="22" fill="${c.deep}" opacity="0.5"/>
    <rect x="10" y="50" width="368" height="242" rx="22" fill="#F6F1E6"/>
    <path d="M138 50 v-22 a20 20 0 0 1 20 -20 h72 a20 20 0 0 1 20 20 v22" fill="none" stroke="#F6F1E6" stroke-width="18"/>
    <rect x="10" y="146" width="368" height="34" fill="${c.accent}"/>
    <rect x="164" y="140" width="60" height="46" rx="8" fill="${c.deep}"/></g>`,

  arrowUp: c => `<g transform="translate(130,80)">
    <path d="M130 380 V116" stroke="#F6F1E6" stroke-width="46" stroke-linecap="round" opacity="0.30"/>
    <path d="M130 380 V116" stroke="${c.accent}" stroke-width="26" stroke-linecap="round"/>
    <path d="M22 176 L130 40 L238 176 z" fill="${c.accent}"/>
    <path d="M60 176 L130 88 L200 176 z" fill="${c.deep}" opacity="0.28"/></g>`,

  diverge: c => `<g transform="translate(48,120)">
    <path d="M20 180 h130" stroke="#F6F1E6" stroke-width="12" stroke-linecap="round" opacity="0.5"/>
    <path d="M150 180 L340 60" stroke="${c.accent}" stroke-width="13" stroke-linecap="round"/>
    <path d="M290 46 L352 52 L344 114" stroke="${c.accent}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M150 180 L340 300" stroke="#F6F1E6" stroke-width="13" stroke-linecap="round" opacity="0.6"/>
    <path d="M290 314 L352 308 L344 246" stroke="#F6F1E6" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.6"/>
    <circle cx="150" cy="180" r="20" fill="${c.accent}"/></g>`,

  receipt: c => `<g transform="translate(90,60)">
    <path d="M20 20 h300 v380 l-37 -26 l-38 26 l-37 -26 l-38 26 l-37 -26 l-38 26 l-37 -26 z" fill="${c.deep}" opacity="0.5" transform="translate(18,18)"/>
    <path d="M20 20 h300 v380 l-37 -26 l-38 26 l-37 -26 l-38 26 l-37 -26 l-38 26 l-37 -26 z" fill="#F6F1E6"/>
    <rect x="20" y="20" width="300" height="52" fill="${c.accent}"/>
    ${[0,1,2].map(i=>`<rect x="52" y="${112+i*54}" width="${150-i*22}" height="13" rx="6" fill="${c.g[0]}" opacity="0.22"/>
      <rect x="${232+i*14}" y="${112+i*54}" width="${56-i*10}" height="13" rx="6" fill="${c.accent}" opacity="${0.9-i*0.2}"/>`).join('')}
    <rect x="52" y="292" width="216" height="16" rx="8" fill="${c.accent}"/></g>`,

  hospital: c => `<g transform="translate(60,86)">
    <rect x="34" y="112" width="356" height="270" rx="18" fill="${c.deep}" opacity="0.5"/>
    <rect x="14" y="92" width="356" height="270" rx="18" fill="#F6F1E6"/>
    <path d="M192 6 L370 92 H14 z" fill="${c.accent}"/>
    <rect x="160" y="150" width="64" height="150" rx="10" fill="${c.accent}"/>
    <rect x="117" y="193" width="150" height="64" rx="10" fill="${c.accent}"/>
    ${[0,1].map(r=>[0,1].map(k=>`<rect x="${44+k*250}" y="${150+r*80}" width="52" height="52" rx="8" fill="${c.g[0]}" opacity="0.18"/>`).join('')).join('')}</g>`,

  stethoscope: c => `<g transform="translate(70,80)">
    <path d="M70 40 v128 a96 96 0 0 0 192 0 V40" fill="none" stroke="#F6F1E6" stroke-width="20" stroke-linecap="round"/>
    <circle cx="70" cy="34" r="24" fill="${c.accent}"/><circle cx="262" cy="34" r="24" fill="${c.accent}"/>
    <path d="M166 264 v54 a74 74 0 0 0 148 0 v-26" fill="none" stroke="#F6F1E6" stroke-width="20" stroke-linecap="round"/>
    <circle cx="314" cy="252" r="52" fill="${c.accent}"/>
    <circle cx="314" cy="252" r="22" fill="${c.deep}" opacity="0.5"/></g>`,

  priceTags: c => `<g transform="translate(56,110)">
    ${[0,1,2,3].map(i=>`<g transform="translate(${i*98},${i*22})">
      <path d="M20 40 h130 l60 62 l-60 62 H20 a14 14 0 0 1 -14 -14 V54 a14 14 0 0 1 14 -14 z"
        fill="${i===3?c.accent:'#F6F1E6'}" opacity="${i===3?1:0.34+i*0.16}"/>
      <circle cx="44" cy="102" r="13" fill="${c.deep}" opacity="0.55"/></g>`).join('')}</g>`,

  chip: c => `<g transform="translate(84,84)">
    <rect x="76" y="76" width="200" height="200" rx="18" fill="${c.deep}" opacity="0.5" transform="translate(14,14)"/>
    <rect x="76" y="76" width="200" height="200" rx="18" fill="#F6F1E6"/>
    <rect x="122" y="122" width="108" height="108" rx="10" fill="${c.accent}"/>
    ${[0,1,2,3].map(i=>`
      <rect x="${104+i*44}" y="26" width="18" height="50" rx="6" fill="${c.accent}" opacity="0.8"/>
      <rect x="${104+i*44}" y="276" width="18" height="50" rx="6" fill="${c.accent}" opacity="0.8"/>
      <rect x="26" y="${104+i*44}" width="50" height="18" rx="6" fill="${c.accent}" opacity="0.8"/>
      <rect x="276" y="${104+i*44}" width="50" height="18" rx="6" fill="${c.accent}" opacity="0.8"/>`).join('')}</g>`,

  candles: c => `<g transform="translate(56,96)">
    ${[[40,120,210],[118,60,170],[196,150,300],[274,40,140],[352,96,236]].map((v,i)=>{
      const [x,top,bot]=v, up=i%2===0;
      return `<path d="M${x+16} ${top-28} V${bot+28}" stroke="#F6F1E6" stroke-width="6" stroke-linecap="round" opacity="0.45"/>
              <rect x="${x}" y="${top}" width="32" height="${bot-top}" rx="6" fill="${up?c.accent:'#F6F1E6'}" opacity="${up?1:0.5}"/>`;
    }).join('')}</g>`,

  turbine: c => `<g transform="translate(80,80)">
    <circle cx="200" cy="200" r="176" fill="#F6F1E6" opacity="0.16"/>
    ${[0,1,2,3,4,5,6,7].map(i=>{const a=(i/8)*2*Math.PI;
      return `<path d="M200 200 L${200+Math.cos(a-0.22)*168} ${200+Math.sin(a-0.22)*168} L${200+Math.cos(a+0.22)*168} ${200+Math.sin(a+0.22)*168} z"
        fill="${i%2?c.accent:'#F6F1E6'}" opacity="${i%2?0.9:0.55}"/>`;}).join('')}
    <circle cx="200" cy="200" r="62" fill="#F6F1E6"/>
    <circle cx="200" cy="200" r="30" fill="${c.accent}"/></g>`,

  percentCircle: c => `<g transform="translate(80,80)">
    <circle cx="200" cy="200" r="172" fill="none" stroke="#F6F1E6" stroke-width="30" opacity="0.24"/>
    <circle cx="200" cy="200" r="172" fill="none" stroke="${c.accent}" stroke-width="30"
      stroke-linecap="round" stroke-dasharray="740 1080" transform="rotate(-90 200 200)"/>
    <circle cx="152" cy="152" r="38" fill="none" stroke="#F6F1E6" stroke-width="20"/>
    <circle cx="250" cy="250" r="38" fill="none" stroke="#F6F1E6" stroke-width="20"/>
    <path d="M266 132 L136 268" stroke="#F6F1E6" stroke-width="20" stroke-linecap="round"/></g>`,

  pillars: c => `<g transform="translate(56,102)">
    <path d="M206 6 L406 92 H6 z" fill="${c.accent}"/>
    <rect x="6" y="92" width="400" height="22" fill="#F6F1E6"/>
    ${[0,1,2,3].map(i=>`<rect x="${40+i*98}" y="122" width="56" height="184" rx="6" fill="#F6F1E6" opacity="${0.65+i*0.06}"/>`).join('')}
    <rect x="6" y="306" width="400" height="26" rx="6" fill="#F6F1E6"/>
    <rect x="-14" y="332" width="440" height="26" rx="8" fill="${c.accent}"/></g>`,

  ladder: c => `<g transform="translate(112,66)">
    <rect x="44" y="20" width="26" height="368" rx="13" fill="#F6F1E6" opacity="0.7"/>
    <rect x="226" y="20" width="26" height="368" rx="13" fill="#F6F1E6" opacity="0.7"/>
    ${[0,1,2,3,4].map(i=>`<rect x="44" y="${68+i*72}" width="208" height="22" rx="11"
      fill="${i===0?c.accent:'#F6F1E6'}" opacity="${i===0?1:0.42+i*0.06}"/>`).join('')}
    <circle cx="148" cy="79" r="30" fill="${c.accent}"/>
    <path d="M134 79 l11 12 l22 -26" fill="none" stroke="${c.deep}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>`,

  skyline: c => `<g transform="translate(46,110)">
    ${[[0,150,90],[104,80,140],[196,190,110],[300,120,128]].map((v,i)=>{
      const [x,top,w]=v;
      return `<rect x="${x}" y="${top}" width="${w}" height="${300-top}" rx="8" fill="${i===1?c.accent:'#F6F1E6'}" opacity="${i===1?1:0.34+i*0.14}"/>
        ${[0,1,2].map(r=>[0,1].map(k=>`<rect x="${x+18+k*(w/2)}" y="${top+28+r*46}" width="20" height="26" rx="4" fill="${c.deep}" opacity="0.3"/>`).join('')).join('')}`;
    }).join('')}
    <rect x="-16" y="300" width="460" height="20" rx="10" fill="${c.accent}" opacity="0.6"/></g>`,

  threeJars: c => `<g transform="translate(48,116)">
    ${[0,1,2].map(i=>{const x=i*146, fill=[0.4,0.62,0.86][i];
      return `<rect x="${x+24}" y="80" width="104" height="200" rx="18" fill="#F6F1E6" opacity="0.30"/>
        <rect x="${x+24}" y="${280-200*fill}" width="104" height="${200*fill}" rx="18" fill="${c.accent}" opacity="${0.55+i*0.2}"/>
        <rect x="${x+12}" y="56" width="128" height="30" rx="12" fill="#F6F1E6" opacity="0.8"/>`;}).join('')}
    <rect x="0" y="292" width="428" height="18" rx="9" fill="${c.accent}" opacity="0.5"/></g>`,

  funnel: c => `<g transform="translate(70,80)">
    <path d="M10 40 h372 L242 214 v128 l-92 44 V214 z" fill="#F6F1E6" opacity="0.28"/>
    <path d="M10 40 h372 L242 214 v128 l-92 44 V214 z" fill="none" stroke="#F6F1E6" stroke-width="10" stroke-linejoin="round"/>
    <path d="M10 40 h372 l-56 70 H66 z" fill="${c.accent}"/>
    ${[0,1,2].map(i=>`<circle cx="${196}" cy="${420+i*0}" r="0"/>`).join('')}
    <circle cx="196" cy="416" r="18" fill="${c.accent}"/>
    <circle cx="150" cy="404" r="9" fill="${c.accent}" opacity="0.6"/>
    <circle cx="242" cy="404" r="9" fill="${c.accent}" opacity="0.6"/></g>`,

  crossover: c => `<g transform="translate(50,120)">
    <path d="M16 300 C 140 300, 180 60, 404 60" fill="none" stroke="${c.accent}" stroke-width="13" stroke-linecap="round"/>
    <path d="M16 60 C 140 60, 180 300, 404 300" fill="none" stroke="#F6F1E6" stroke-width="13" stroke-linecap="round" opacity="0.62"/>
    <circle cx="210" cy="180" r="30" fill="${c.deep}"/>
    <circle cx="210" cy="180" r="15" fill="${c.accent}"/>
    <path d="M210 30 v40 M210 290 v40" stroke="#F6F1E6" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16" opacity="0.6"/></g>`,

  band: c => `<g transform="translate(48,120)">
    <rect x="14" y="120" width="404" height="112" rx="12" fill="${c.accent}" opacity="0.22"/>
    <path d="M14 120 h404" stroke="${c.accent}" stroke-width="12" stroke-linecap="round"/>
    <path d="M14 232 h404" stroke="${c.accent}" stroke-width="12" stroke-linecap="round" opacity="0.6"/>
    <path d="M14 40 h404" stroke="#F6F1E6" stroke-width="10" stroke-linecap="round" opacity="0.30"/>
    <path d="M14 312 h404" stroke="#F6F1E6" stroke-width="10" stroke-linecap="round" opacity="0.30"/>
    <circle cx="216" cy="120" r="20" fill="${c.accent}"/>
    <circle cx="216" cy="232" r="20" fill="#F6F1E6"/>
    <path d="M216 148 v56" stroke="#F6F1E6" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 14"/></g>`,

  rupeeSeal: c => `<g transform="translate(80,80)">
    ${[0,1].map(r=>`<circle cx="200" cy="200" r="${180-r*22}" fill="none" stroke="${r?c.accent:'#F6F1E6'}" stroke-width="${r?10:26}" opacity="${r?0.9:0.35}"/>`).join('')}
    <circle cx="200" cy="200" r="128" fill="${c.accent}"/>
    <text x="200" y="252" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-weight="700" font-size="150" fill="${c.deep}">&#8377;</text>
    ${[0,1,2,3,4,5,6,7].map(i=>{const a=(i/8)*2*Math.PI;
      return `<circle cx="${200+Math.cos(a)*158}" cy="${200+Math.sin(a)*158}" r="8" fill="#F6F1E6" opacity="0.55"/>`;}).join('')}</g>`,

  hourglass: c => `<g transform="translate(112,66)">
    <rect x="20" y="10" width="256" height="26" rx="13" fill="${c.accent}"/>
    <rect x="20" y="352" width="256" height="26" rx="13" fill="${c.accent}"/>
    <path d="M50 36 h196 L164 194 l82 158 H50 l82 -158 z" fill="#F6F1E6" opacity="0.30"/>
    <path d="M50 36 h196 L164 194 l82 158 H50 l82 -158 z" fill="none" stroke="#F6F1E6" stroke-width="9"/>
    <path d="M74 60 h148 L148 194 z" fill="${c.accent}"/>
    <path d="M104 328 h88 L148 250 z" fill="${c.accent}" opacity="0.75"/>
    <path d="M148 194 v46" stroke="${c.accent}" stroke-width="8" stroke-linecap="round"/></g>`,

  votes: c => `<g transform="translate(56,120)">
    ${[0,1,2,3,4,5].map(i=>{const x=(i%3)*140, y=Math.floor(i/3)*160, no=i>=3;
      return `<circle cx="${x+70}" cy="${y+70}" r="56" fill="${no?'#F6F1E6':c.accent}" opacity="${no?0.42:1}"/>
        ${no?`<path d="M${x+48} ${y+48} l44 44 M${x+92} ${y+48} l-44 44" stroke="${c.deep}" stroke-width="12" stroke-linecap="round" opacity="0.7"/>`
            :`<path d="M${x+46} ${y+70} l16 18 l30 -36" fill="none" stroke="${c.deep}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`}`;
    }).join('')}</g>`,

  twoDoors: c => `<g transform="translate(60,80)">
    ${[0,1].map(i=>`<g transform="translate(${i*212},0)">
      <rect x="16" y="30" width="168" height="330" rx="14" fill="${i?c.accent:'#F6F1E6'}" opacity="${i?1:0.42}"/>
      <rect x="40" y="56" width="120" height="150" rx="10" fill="${c.deep}" opacity="0.22"/>
      <circle cx="${i?52:148}" cy="222" r="13" fill="${c.deep}" opacity="0.55"/></g>`).join('')}
    <rect x="-10" y="360" width="440" height="20" rx="10" fill="${c.accent}" opacity="0.5"/></g>`,

  // regular instalments against one lump — SIP vs lump sum.
  // Redrawn: the first version stacked overlapping drops diagonally and read
  // as a caterpillar rather than as separate payments.
  drip: c => `<g transform="translate(56,70)">
    ${[0,1,2,3,4].map(i=>`<path d="M84 ${34+i*66} c-20 26 -32 40 -32 54 a32 32 0 0 0 64 0 c0 -14 -12 -28 -32 -54 z"
      fill="${c.accent}" opacity="${0.5+i*0.12}"/>`).join('')}
    <path d="M300 40 c-58 78 -92 120 -92 166 a92 92 0 0 0 184 0 c0 -46 -34 -88 -92 -166 z" fill="#F6F1E6" opacity="0.92"/>
    <path d="M300 132 c-28 38 -46 58 -46 82 a46 46 0 0 0 92 0 c0 -24 -18 -44 -46 -82 z" fill="${c.accent}"/>
    <rect x="30" y="372" width="108" height="16" rx="8" fill="${c.accent}" opacity="0.55"/>
    <rect x="216" y="372" width="168" height="16" rx="8" fill="#F6F1E6" opacity="0.45"/></g>`,

  gauge: c => `<g transform="translate(60,116)">
    <path d="M22 280 a178 178 0 0 1 356 0" fill="none" stroke="#F6F1E6" stroke-width="46" opacity="0.24" stroke-linecap="round"/>
    <path d="M22 280 a178 178 0 0 1 356 0" fill="none" stroke="${c.accent}" stroke-width="46"
      stroke-linecap="round" stroke-dasharray="392 560"/>
    <circle cx="200" cy="280" r="32" fill="#F6F1E6"/>
    <path d="M200 280 L306 176" stroke="#F6F1E6" stroke-width="20" stroke-linecap="round"/>
    <circle cx="200" cy="280" r="15" fill="${c.accent}"/>
    <rect x="24" y="304" width="352" height="18" rx="9" fill="${c.accent}" opacity="0.45"/></g>`,

  fileStack: c => `<g transform="translate(70,84)">
    ${[0,1,2].map(i=>`<g transform="translate(${i*22},${(2-i)*54})">
      <rect x="10" y="60" width="300" height="220" rx="16" fill="${i===2?c.accent:'#F6F1E6'}" opacity="${i===2?1:0.34+i*0.2}"/>
      <path d="M10 76 a16 16 0 0 1 16 -16 h86 l24 30 h158 a16 16 0 0 1 16 16 v-6 H10 z" fill="${c.deep}" opacity="0.22"/></g>`).join('')}
    <circle cx="300" cy="330" r="44" fill="${c.accent}"/>
    <path d="M300 306 v48 M276 330 h48" stroke="${c.deep}" stroke-width="11" stroke-linecap="round"/></g>`,

  toggle: c => `<g transform="translate(46,150)">
    <rect x="10" y="60" width="410" height="180" rx="90" fill="#F6F1E6" opacity="0.26"/>
    <rect x="10" y="60" width="410" height="180" rx="90" fill="none" stroke="#F6F1E6" stroke-width="8" opacity="0.4"/>
    <circle cx="330" cy="150" r="72" fill="${c.accent}"/>
    <circle cx="330" cy="150" r="30" fill="${c.deep}" opacity="0.3"/>
    <path d="M96 150 h56" stroke="#F6F1E6" stroke-width="14" stroke-linecap="round" opacity="0.55"/>
    <circle cx="196" cy="150" r="18" fill="#F6F1E6" opacity="0.35"/></g>`
};
