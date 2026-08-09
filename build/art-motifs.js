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
      return `<rect x="${188+Math.cos(a)*104-9}" y="${183+Math.sin(a)*104-9}" width="18" height="18" rx="4" fill="${c.accent}" opacity="0.7"/>`;}).join('')}</g>`
};
