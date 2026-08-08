// ---- Embed-mode flag (?embed=1) — read once, checked by other IIFEs below ----
// A page loaded this way is meant to be shown inside someone else's <iframe>,
// so ads, the cookie gate, and the feedback chatbot all skip themselves here —
// serving AdSense into a third-party embed without an arrangement risks
// violating AdSense policy, and a cookie/chat popup makes no sense in a widget.
window.__TB_EMBED__ = new URLSearchParams(window.location.search).get('embed') === '1';

// ---- Cookie consent gate (Google AdSense advertising cookies) ----
(function(){
  if (window.__TB_EMBED__) return;
  var CONSENT_KEY = 'tb_ad_consent'; // 'accepted' | 'rejected'
  var ADSENSE_CLIENT = 'ca-pub-7800403656727097';

  function loadAdsense(){
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  function showBanner(){
    var banner = document.createElement('div');
    banner.id = 'cookieConsent';
    banner.innerHTML =
      '<p>This site uses cookies for ad personalization via Google AdSense. See the <a href="privacy-policy.html">Privacy Policy</a> for details and opt-out links.</p>' +
      '<div class="btn-row">' +
        '<button id="cookieAccept" type="button">Accept</button>' +
        '<button class="ghost" id="cookieReject" type="button">Reject</button>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('cookieAccept').addEventListener('click', function(){
      localStorage.setItem(CONSENT_KEY, 'accepted');
      banner.remove();
      loadAdsense();
    });
    document.getElementById('cookieReject').addEventListener('click', function(){
      localStorage.setItem(CONSENT_KEY, 'rejected');
      banner.remove();
    });
  }

  var consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'accepted') {
    loadAdsense();
  } else if (consent !== 'rejected') {
    if (document.body) showBanner();
    else document.addEventListener('DOMContentLoaded', showBanner);
  }
})();

// ---- Section nav with dropdown panels ----
// Replaced the two-tier ruler + mobile drawer on 2026-08-02. The panels are
// rendered into the page by Sync-Nav.ps1, so every link exists in the HTML
// whether or not this runs — all this does is show and hide them.
(function(){
  const sections = document.getElementById('sections');
  const panels = document.getElementById('navPanels');
  if(!sections || !panels) return;
  const header = document.querySelector('header');
  const backdrop = document.getElementById('navBackdrop');
  const secs = Array.from(sections.querySelectorAll('.sec[data-p]'));

  let openKey = null;
  // Which section the reader deliberately CLICKED, as opposed to merely
  // hovered. A plain boolean is not enough: hover fires before click, so
  // moving onto ARTICLES while FINANCE was pinned switched the panel first
  // and the click then read "already open and pinned" and closed it.
  let pinnedKey = null;
  let openT = null, closeT = null;

  function show(key){
    let found = false;
    panels.querySelectorAll('.npanel').forEach(p=>{
      const match = p.dataset.p === key;
      p.hidden = !match;
      if(match) found = true;
    });
    if(!found) return false;
    secs.forEach(s=>{
      const on = s.dataset.p === key;
      s.classList.toggle('open', on);
      s.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    // The scrim tracks PINNED state, not how this particular call was made.
    // Deriving it from a "was this a hover?" argument meant a click's own
    // pending hover timer fired ~90ms later and stripped the scrim off the
    // panel just pinned, after which clicking away hit nothing.
    document.body.classList.toggle('nav-open', pinnedKey === key);
    openKey = key;
    return true;
  }

  function close(){
    clearTimeout(openT); clearTimeout(closeT);
    panels.querySelectorAll('.npanel').forEach(p=>{ p.hidden = true; });
    secs.forEach(s=>{ s.classList.remove('open'); s.setAttribute('aria-expanded','false'); });
    document.body.classList.remove('nav-open');
    openKey = null;
    pinnedKey = null;
  }

  sections.addEventListener('click', e=>{
    const s = e.target.closest('.sec[data-p]');
    if(!s) return;
    e.preventDefault();
    clearTimeout(openT); clearTimeout(closeT);
    if(pinnedKey === s.dataset.p){ close(); return; }
    pinnedKey = s.dataset.p;
    show(s.dataset.p);
  });

  if(backdrop) backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') close(); });

  // ---- hover ----
  // Only where hovering is real. A coarse pointer reports a phantom hover on
  // tap, which would open a panel the reader then has to dismiss before their
  // tap lands on what they were actually aiming at.
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    secs.forEach(s=>{
      s.addEventListener('mouseenter', ()=>{
        clearTimeout(closeT); clearTimeout(openT);
        if(s.dataset.p !== pinnedKey) pinnedKey = null;
        // Switching between open panels must be instant; a delay there reads
        // as lag. The delay only exists to stop a pointer travelling ACROSS
        // the row from opening everything it brushes.
        if(openKey){ show(s.dataset.p); return; }
        openT = setTimeout(()=>show(s.dataset.p), 90);
      });
    });
    sections.addEventListener('mouseleave', ()=>{ if(!openKey) clearTimeout(openT); });
    // Watch the whole <header>, not the section row: the search bar sits
    // BETWEEN the sections and the panel, so a pointer travelling down into
    // the panel leaves the row on the way. Watching the header means that
    // journey never exits the element being watched.
    header.addEventListener('mouseleave', ()=>{
      clearTimeout(openT);
      if(pinnedKey) return;           // clicked open — only another click closes it
      closeT = setTimeout(close, 160);
    });
    header.addEventListener('mouseenter', ()=>clearTimeout(closeT));
  }

  // ---- "you are here" ----
  // Calculator pages carry their real category in data-page-cat so the matching
  // section lights up; article pages use "articles" and book.html "book", so the
  // reader sees the section they are actually in highlighted rather than a
  // category tab that has nothing to do with the page.
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const pageCat = document.body.dataset.pageCat;
  if(pageCat){
    const match = secs.find(s=>s.dataset.p === pageCat);
    if(match) match.classList.add('active');
  }
  if(path === 'index.html' || path === ''){
    const home = sections.querySelector('a.sec[href="index.html"]');
    if(home) home.classList.add('active');
  }

  // "/" focuses search, as the key hint in the field promises.
  document.addEventListener('keydown', e=>{
    if(e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if(document.activeElement.isContentEditable) return;
    const field = document.querySelector('.nav-search .tb-search-input');
    if(!field) return;
    e.preventDefault();
    close();
    field.focus();
  });
})();

// ---- Tip ----
(function(){
  if(!document.getElementById('tipBill')) return;
  const roundEl = document.getElementById('tipRound');
  const presets = document.getElementById('tipPresets');

  function calcTip(){
    const cur = document.getElementById('tipCur').value;
    const bill = parseFloat(document.getElementById('tipBill').value)||0;
    const pct = parseFloat(document.getElementById('tipPct').value)||0;
    const peopleRaw = parseInt(document.getElementById('tipPeople').value);
    const people = (peopleRaw && peopleRaw>0) ? peopleRaw : 1;
    let tip = bill*pct/100;
    let total = bill+tip;

    const effEl = document.getElementById('tipEffective');
    if(roundEl && roundEl.checked){
      const rounded = Math.ceil(total);
      if(effEl) effEl.textContent = bill>0 ? (((rounded-bill)/bill)*100).toFixed(2)+'%' : '—';
      tip = rounded-bill;
      total = rounded;
    } else if(effEl){
      effEl.textContent = '—';
    }

    document.getElementById('tipAmt').textContent = cur+tip.toFixed(2);
    document.getElementById('tipTotal').textContent = cur+total.toFixed(2);
    document.getElementById('tipEach').textContent = cur+(total/people).toFixed(2);

    const warnEl = document.getElementById('tipWarning');
    if(warnEl){
      let msg = null;
      if(peopleRaw!==undefined && peopleRaw<=0) msg = 'Number of people must be at least 1 — using 1 for this calculation.';
      else if(bill<0) msg = 'Bill amount is negative — enter a positive amount.';
      else if(pct<0) msg = 'Tip percent is negative — enter 0 or a positive percentage.';
      if(msg){ warnEl.textContent = msg; warnEl.classList.add('show'); }
      else { warnEl.textContent=''; warnEl.classList.remove('show'); }
    }
  }
  if(presets){
    presets.addEventListener('click',(e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      document.getElementById('tipPct').value = btn.dataset.pct;
      calcTip();
    });
  }
  if(roundEl) roundEl.addEventListener('change',calcTip);
  ['tipBill','tipPct','tipPeople','tipCur'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input',calcTip);
    el.addEventListener('change',calcTip);
  });
  calcTip();
})();

// ---- Percentage (6 modes) ----
(function(){
  if(!document.getElementById('pcOfPct')) return;
  const $ = id => document.getElementById(id);
  const num = id => parseFloat($(id).value)||0;
  const fmt = v => {
    if(!isFinite(v)) return '—';
    return Math.abs(v) >= 1e12 ? v.toExponential(2) : parseFloat(v.toFixed(4)).toLocaleString();
  };

  function setWarn(id, msg){
    const el = $(id);
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function calcAll(){
    // 1. X% of Y
    $('pcOfOut').textContent = fmt(num('pcOfNum')*num('pcOfPct')/100);

    // 2. A is what % of B
    const b = num('pcWhatB');
    $('pcWhatOut').textContent = b===0 ? '—' : fmt(num('pcWhatA')/b*100)+'%';
    setWarn('pcWhatWarning', b===0 ? 'The "whole" (B) is zero — a percentage of zero is undefined, so there\'s nothing to calculate.' : null);

    // 3. X% of what is Z (reverse)
    const rp = num('pcRevPct');
    $('pcRevOut').textContent = rp===0 ? '—' : fmt(num('pcRevVal')/(rp/100));
    setWarn('pcRevWarning', rp===0 ? 'The percent is zero — "0% of what number is Z" has no solution unless Z is also zero.' : null);

    // 4. Percentage change (old -> new)
    const oldV = num('pcChgOld'), newV = num('pcChgNew');
    if(oldV===0){
      $('pcChgOut').textContent='—';
      $('pcChgDir').textContent='Old value must be non-zero';
    } else {
      const chg = (newV-oldV)/oldV*100;
      $('pcChgOut').textContent = (chg>0?'+':'')+fmt(chg)+'%';
      $('pcChgDir').textContent = chg>0?'Increase':(chg<0?'Decrease':'No change');
    }

    // 5. Increase / decrease Y by X%
    const base = num('pcAdjNum'), pct = num('pcAdjPct');
    $('pcAdjUp').textContent = fmt(base*(1+pct/100));
    $('pcAdjDown').textContent = fmt(base*(1-pct/100));

    // 6. Percentage difference (vs average, symmetric)
    const d1 = num('pcDiffA'), d2 = num('pcDiffB');
    const avg = (d1+d2)/2;
    $('pcDiffOut').textContent = avg===0 ? '—' : fmt(Math.abs(d1-d2)/Math.abs(avg)*100)+'%';
    setWarn('pcDiffWarning', avg===0 ? 'The average of these two values is zero (e.g. one positive, one equally negative) — percentage difference is undefined in that case.' : null);
  }

  ['pcOfPct','pcOfNum','pcWhatA','pcWhatB','pcRevPct','pcRevVal',
   'pcChgOld','pcChgNew','pcAdjNum','pcAdjPct','pcDiffA','pcDiffB'
  ].forEach(id=>$(id).addEventListener('input',calcAll));
  calcAll();
})();

// ---- BMI ----
(function(){
  if(!document.getElementById('bmiH')) return;
  const unitSel = document.getElementById('bmiUnit');
  const cmWrap = document.getElementById('bmiCmWrap');
  const ftWrap = document.getElementById('bmiFtWrap');
  const wUnitSel = document.getElementById('bmiWUnit');
  const standardSeg = document.getElementById('bmiStandardSeg');
  const sexSeg = document.getElementById('bmiSexSeg');
  let standard = 'who'; // 'who' = 25/30 thresholds, 'apac' = 23/25 (WHO Asia-Pacific)
  let sex = 'male';

  function getHeightMeters(){
    if(unitSel.value === 'ft'){
      const ft = parseFloat(document.getElementById('bmiFt').value)||0;
      const inches = parseFloat(document.getElementById('bmiIn').value)||0;
      const totalInches = (ft*12)+inches;
      return totalInches*0.0254;
    }
    return (parseFloat(document.getElementById('bmiH').value)||0)/100;
  }
  function getWeightKg(){
    const w = parseFloat(document.getElementById('bmiW').value)||0;
    return (wUnitSel && wUnitSel.value==='lb') ? w/2.20462 : w;
  }
  function calcBMI(){
    const h = getHeightMeters();
    const w = getWeightKg();
    const bmi = h>0 ? w/(h*h) : 0;
    document.getElementById('bmiVal').textContent = bmi.toFixed(1);

    const overweightAt = standard==='apac' ? 23 : 25;
    const obeseAt = standard==='apac' ? 25 : 30;
    const healthyLowerBound = 18.5;

    let cat='—';
    if(bmi>0){
      if(bmi<healthyLowerBound) cat='Underweight';
      else if(bmi<overweightAt) cat='Healthy range';
      else if(bmi<obeseAt) cat='Overweight';
      else cat='Obese';
    }
    document.getElementById('bmiCat').textContent = cat;

    const primeEl = document.getElementById('bmiPrime');
    if(primeEl) primeEl.textContent = bmi>0 ? (bmi/overweightAt).toFixed(2) : '—';

    const idealEl = document.getElementById('bmiIdeal');
    if(idealEl){
      if(h>0){
        const lowKg = healthyLowerBound*h*h, highKg = overweightAt===23 ? 22.9*h*h : 24.9*h*h;
        const isLb = wUnitSel && wUnitSel.value==='lb';
        const lo = isLb ? lowKg*2.20462 : lowKg;
        const hi = isLb ? highKg*2.20462 : highKg;
        const unit = isLb ? 'lb' : 'kg';
        idealEl.textContent = lo.toFixed(1)+' – '+hi.toFixed(1)+' '+unit;
      } else {
        idealEl.textContent = '—';
      }
    }

    const devineEl = document.getElementById('bmiDevine');
    if(devineEl){
      const totalInches = h/0.0254;
      if(totalInches>0){
        const base = sex==='male' ? 50 : 45.5;
        const kg = Math.max(base + 2.3*(totalInches-60), 0);
        const isLb = wUnitSel && wUnitSel.value==='lb';
        devineEl.textContent = isLb ? (kg*2.20462).toFixed(1)+' lb' : kg.toFixed(1)+' kg';
      } else {
        devineEl.textContent = '—';
      }
    }
  }
  unitSel.addEventListener('change',()=>{
    const isFt = unitSel.value === 'ft';
    cmWrap.style.display = isFt ? 'none' : 'flex';
    ftWrap.style.display = isFt ? 'grid' : 'none';
    calcBMI();
  });
  if(wUnitSel) wUnitSel.addEventListener('change',calcBMI);
  if(standardSeg){
    standardSeg.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      standard = btn.dataset.standard;
      standardSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      calcBMI();
    });
  }
  const bfHipWrap = document.getElementById('bfHipWrap');
  if(sexSeg){
    sexSeg.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      sex = btn.dataset.sex;
      sexSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if(bfHipWrap) bfHipWrap.style.display = sex==='female' ? 'flex' : 'none';
      calcBMI();
      calcBodyFat();
    });
  }
  ['bmiH','bmiW','bmiFt','bmiIn'].forEach(id=>document.getElementById(id).addEventListener('input',calcBMI));
  calcBMI();

  // Body fat % — US Navy method (needs neck/waist, plus hip for women)
  function calcBodyFat(){
    const pctEl = document.getElementById('bfPct');
    const catEl = document.getElementById('bfCat');
    if(!pctEl) return;
    const h = getHeightMeters()*100; // cm
    const neck = parseFloat(document.getElementById('bfNeck').value)||0;
    const waist = parseFloat(document.getElementById('bfWaist').value)||0;
    const hip = parseFloat(document.getElementById('bfHip').value)||0;

    let pct = null;
    if(h>0 && neck>0 && waist>neck){
      if(sex==='male'){
        pct = 495/(1.0324 - 0.19077*Math.log10(waist-neck) + 0.15456*Math.log10(h)) - 450;
      } else if(hip>0 && (waist+hip)>neck){
        pct = 495/(1.29579 - 0.35004*Math.log10(waist+hip-neck) + 0.22100*Math.log10(h)) - 450;
      }
    }
    if(pct===null || !isFinite(pct) || pct<=0){
      pctEl.textContent = '—';
      catEl.textContent = 'Enter valid measurements above';
      return;
    }
    pctEl.textContent = pct.toFixed(1)+'%';
    const ranges = sex==='male'
      ? [[6,'Essential fat'],[14,'Athletic'],[18,'Fitness'],[25,'Average'],[Infinity,'Above average']]
      : [[14,'Essential fat'],[21,'Athletic'],[25,'Fitness'],[32,'Average'],[Infinity,'Above average']];
    catEl.textContent = ranges.find(([max])=>pct<max)[1];
  }
  ['bfNeck','bfWaist','bfHip'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', calcBodyFat);
  });
  calcBodyFat();
})();

// ---- Age ----
(function(){
  if(!document.getElementById('ageBtn')) return;
  function calc(){
    const dobVal = document.getElementById('ageDob').value;
    if(!dobVal) return;
    const dob = new Date(dobVal);
    const asOfVal = document.getElementById('ageAsOf') ? document.getElementById('ageAsOf').value : '';
    const now = asOfVal ? new Date(asOfVal) : new Date();
    let y = now.getFullYear()-dob.getFullYear();
    let m = now.getMonth()-dob.getMonth();
    let d = now.getDate()-dob.getDate();
    if(d<0){ m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if(m<0){ y--; m+=12; }
    document.getElementById('ageY').textContent=y;
    document.getElementById('ageM').textContent=m;
    document.getElementById('ageD').textContent=d;

    const msPerDay = 86400000;
    const totalDays = Math.floor((now-dob)/msPerDay);
    const totalDaysEl = document.getElementById('ageTotalDays');
    const totalWeeksEl = document.getElementById('ageTotalWeeks');
    if(totalDaysEl) totalDaysEl.textContent = totalDays.toLocaleString()+' days';
    if(totalWeeksEl) totalWeeksEl.textContent = Math.floor(totalDays/7).toLocaleString()+' weeks';

    const nextBdayEl = document.getElementById('ageNextBday');
    if(nextBdayEl){
      let next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if(next < now) next = new Date(now.getFullYear()+1, dob.getMonth(), dob.getDate());
      const daysToGo = Math.ceil((next-now)/msPerDay);
      nextBdayEl.textContent = next.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})+' ('+daysToGo+' days away)';
    }
  }
  document.getElementById('ageBtn').addEventListener('click', calc);
  const asOfEl = document.getElementById('ageAsOf');
  if(asOfEl) asOfEl.addEventListener('change', calc);
})();

// ---- Loan ----
(function(){
  if(!document.getElementById('loanAmt')) return;
  let tenureUnit = 'months';
  const seg = document.getElementById('loanTenureSeg');
  const unitLabel = document.getElementById('loanTenureUnitLabel');

  function fmtMonths(m){
    const y = Math.floor(m/12), rem = m%12;
    if(y===0) return rem+' mo';
    return rem===0 ? y+' yr' : y+' yr '+rem+' mo';
  }

  function calcLoan(){
    const cur = document.getElementById('loanCur').value;
    const P = parseFloat(document.getElementById('loanAmt').value)||0;
    const annual = parseFloat(document.getElementById('loanRate').value)||0;
    const termInput = parseFloat(document.getElementById('loanTerm').value)||0;
    const extraEl = document.getElementById('loanExtra');
    const extra = extraEl ? (parseFloat(extraEl.value)||0) : 0;
    const n = Math.round(tenureUnit==='years' ? termInput*12 : termInput);

    const base = buildAmortization(P, annual, n, 0);
    const acc  = extra>0 ? buildAmortization(P, annual, n, extra) : base;

    document.getElementById('loanPay').textContent = cur+(base.pay+extra).toFixed(2);
    document.getElementById('loanTotal').textContent = cur+(P+acc.totalInterest).toFixed(2);
    document.getElementById('loanInt').textContent = cur+acc.totalInterest.toFixed(2);

    const payoffEl = document.getElementById('loanPayoff');
    const savedEl = document.getElementById('loanSaved');
    if(payoffEl) payoffEl.textContent = (n>0&&P>0) ? fmtMonths(acc.monthsTaken) : '—';
    if(savedEl) savedEl.textContent = extra>0
      ? cur+Math.max(base.totalInterest-acc.totalInterest,0).toFixed(2)+' · '+fmtMonths(Math.max(base.monthsTaken-acc.monthsTaken,0))+' sooner'
      : '—';
  }

  if(seg){
    seg.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      tenureUnit = btn.dataset.unit;
      seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      unitLabel.textContent = tenureUnit;
      calcLoan();
    });
  }

  ['loanAmt','loanRate','loanTerm','loanCur','loanExtra'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input',calcLoan);
    el.addEventListener('change',calcLoan);
  });
  calcLoan();
})();

// ---- Unit converter ----
(function(){
  if(!document.getElementById('unitCat')) return;
  const unitDefs = {
    length:  { m:1, km:1000, cm:0.01, mm:0.001, mi:1609.34, yd:0.9144, ft:0.3048, in:0.0254, nmi:1852 },
    weight:  { kg:1, g:0.001, mg:0.000001, lb:0.453592, oz:0.0283495, ton:1000, stone:6.35029 },
    volume:  { l:1, ml:0.001, m3:1000, cm3:0.001, gal:3.78541, qt:0.946353, pt:0.473176, cup:0.24, fl_oz:0.0295735 },
    cooking: { l:1, ml:0.001, tsp:0.00492892, tbsp:0.01478676, fl_oz:0.02957353, cup:0.236588, pt:0.473176, qt:0.946353, gal:3.78541 },
    area:    { m2:1, km2:1000000, cm2:0.0001, ha:10000, acre:4046.86, ft2:0.092903, mi2:2589988.11, yd2:0.836127 },
    speed:   { mps:1, kmh:0.277778, mph:0.44704, knot:0.514444, fps:0.3048 },
    time:    { sec:1, min:60, hr:3600, day:86400, week:604800, month:2629800, year:31557600 },
    data:    { bit:0.125, byte:1, kb:1000, mb:1000000, gb:1000000000, tb:1000000000000, kib:1024, mib:1048576, gib:1073741824 },
    pressure:{ pa:1, kpa:1000, bar:100000, psi:6894.76, atm:101325, mmhg:133.322 },
    energy:  { j:1, kj:1000, cal:4.184, kcal:4184, wh:3600, kwh:3600000, btu:1055.06 }
  };
  const labels = {
    m:'m', km:'km', cm:'cm', mm:'mm', mi:'mi', yd:'yd', ft:'ft', in:'in', nmi:'nautical mi',
    kg:'kg', g:'g', mg:'mg', lb:'lb', oz:'oz', ton:'metric ton', stone:'stone',
    l:'L', ml:'mL', m3:'m³', cm3:'cm³', gal:'gal (US)', qt:'qt (US)', pt:'pt (US)', cup:'cup (US)', fl_oz:'fl oz (US)',
    tsp:'tsp', tbsp:'tbsp',
    m2:'m²', km2:'km²', cm2:'cm²', ha:'hectare', acre:'acre', ft2:'ft²', mi2:'mi²', yd2:'yd²',
    mps:'m/s', kmh:'km/h', mph:'mph', knot:'knot', fps:'ft/s',
    sec:'sec', min:'min', hr:'hr', day:'day', week:'week', month:'month', year:'year',
    bit:'bit', byte:'byte', kb:'KB', mb:'MB', gb:'GB', tb:'TB', kib:'KiB', mib:'MiB', gib:'GiB',
    c:'°C', f:'°F', k:'K',
    pa:'Pa', kpa:'kPa', bar:'bar', psi:'PSI', atm:'atm', mmhg:'mmHg',
    j:'J', kj:'kJ', cal:'cal', kcal:'kcal', wh:'Wh', kwh:'kWh', btu:'BTU'
  };
  function tempToCelsius(v,u){ if(u==='f') return (v-32)*5/9; if(u==='k') return v-273.15; return v; }
  function celsiusTo(v,u){ if(u==='f') return v*9/5+32; if(u==='k') return v+273.15; return v; }

  function populateUnits(){
    const cat = document.getElementById('unitCat').value;
    const from = document.getElementById('unitFrom');
    const to = document.getElementById('unitTo');
    from.innerHTML=''; to.innerHTML='';
    const keys = cat==='temperature' ? ['c','f','k'] : Object.keys(unitDefs[cat]);
    keys.forEach(u=>{
      from.innerHTML+=`<option value="${u}">${labels[u]}</option>`;
      to.innerHTML+=`<option value="${u}">${labels[u]}</option>`;
    });
    to.selectedIndex = 1;
    calcUnit();
  }
  function calcUnit(){
    const cat = document.getElementById('unitCat').value;
    const val = parseFloat(document.getElementById('unitVal').value)||0;
    const from = document.getElementById('unitFrom').value;
    const to = document.getElementById('unitTo').value;
    let result;
    if(cat==='temperature'){
      result = celsiusTo(tempToCelsius(val, from), to);
    } else {
      const base = val*unitDefs[cat][from];
      result = base/unitDefs[cat][to];
    }
    document.getElementById('unitOut').textContent = result.toFixed(4)+' '+(labels[to]||to);

    const warnEl = document.getElementById('unitWarning');
    if(warnEl){
      let msg = null;
      if(cat==='temperature'){
        if(from==='k' && val<0) msg = 'Kelvin can\'t go below 0 (absolute zero) — this value isn\'t physically possible.';
      } else if(val<0){
        msg = 'Negative value entered — most physical quantities in this category (like length or weight) can\'t be negative in the real world, though the math still computes correctly.';
      }
      if(msg){ warnEl.textContent = msg; warnEl.classList.add('show'); }
      else { warnEl.textContent=''; warnEl.classList.remove('show'); }
    }
  }
  document.getElementById('unitCat').addEventListener('change',populateUnits);
  ['unitVal','unitFrom','unitTo'].forEach(id=>document.getElementById(id).addEventListener('input',calcUnit));
  const swapBtn = document.getElementById('unitSwap');
  if(swapBtn){
    swapBtn.addEventListener('click',()=>{
      const from = document.getElementById('unitFrom');
      const to = document.getElementById('unitTo');
      const tmp = from.value;
      from.value = to.value;
      to.value = tmp;
      calcUnit();
    });
  }
  populateUnits();
})();

// ---- CM to inches (dedicated converter page) ----
(function(){
  const cmEl = document.getElementById('ctiCm');
  if(!cmEl) return;
  const inEl = document.getElementById('ctiIn');
  const resultEl = document.getElementById('ctiResult');
  const warnEl = document.getElementById('ctiWarning');

  function setWarn(msg){
    if(!warnEl) return;
    if(msg){ warnEl.textContent = msg; warnEl.classList.add('show'); }
    else { warnEl.textContent = ''; warnEl.classList.remove('show'); }
  }

  function fromCm(){
    const cm = parseFloat(cmEl.value)||0;
    setWarn(cm < 0 ? 'Length can\'t be negative.' : null);
    const inches = cm/2.54;
    inEl.value = inches.toFixed(2);
    resultEl.textContent = cm.toLocaleString()+' cm equals '+inches.toFixed(2)+' in';
  }
  function fromIn(){
    const inches = parseFloat(inEl.value)||0;
    setWarn(inches < 0 ? 'Length can\'t be negative.' : null);
    const cm = inches*2.54;
    cmEl.value = cm.toFixed(2);
    resultEl.textContent = cm.toLocaleString()+' cm equals '+inches.toFixed(2)+' in';
  }
  cmEl.addEventListener('input', fromCm);
  inEl.addEventListener('input', fromIn);

  const tbody = document.querySelector('#ctiTable tbody');
  if(tbody){
    const vals = [1,2,5,10,20,30,50,75,100,150,160,170,180,190,200];
    tbody.innerHTML = vals.map(cm=>'<tr><td>'+cm+' cm</td><td>'+(cm/2.54).toFixed(2)+' in</td></tr>').join('');
  }
  fromCm();
})();

// ---- KG to pounds (dedicated converter page) ----
(function(){
  const kgEl = document.getElementById('ktpKg');
  if(!kgEl) return;
  const lbEl = document.getElementById('ktpLb');
  const resultEl = document.getElementById('ktpResult');
  const warnEl = document.getElementById('ktpWarning');

  function setWarn(msg){
    if(!warnEl) return;
    if(msg){ warnEl.textContent = msg; warnEl.classList.add('show'); }
    else { warnEl.textContent = ''; warnEl.classList.remove('show'); }
  }

  function fromKg(){
    const kg = parseFloat(kgEl.value)||0;
    setWarn(kg < 0 ? 'Weight can\'t be negative.' : null);
    const lb = kg*2.20462;
    lbEl.value = lb.toFixed(2);
    resultEl.textContent = kg.toLocaleString()+' kg equals '+lb.toFixed(2)+' lb';
  }
  function fromLb(){
    const lb = parseFloat(lbEl.value)||0;
    setWarn(lb < 0 ? 'Weight can\'t be negative.' : null);
    const kg = lb*0.453592;
    kgEl.value = kg.toFixed(2);
    resultEl.textContent = kg.toFixed(2)+' kg equals '+lb.toLocaleString()+' lb';
  }
  kgEl.addEventListener('input', fromKg);
  lbEl.addEventListener('input', fromLb);

  const tbody = document.querySelector('#ktpTable tbody');
  if(tbody){
    const vals = [1,5,10,20,30,40,50,60,70,80,90,100,150];
    tbody.innerHTML = vals.map(kg=>'<tr><td>'+kg+' kg</td><td>'+(kg*2.20462).toFixed(2)+' lb</td></tr>').join('');
  }
  fromKg();
})();

// ---- Celsius to Fahrenheit (dedicated converter page) ----
(function(){
  const cEl = document.getElementById('ctfC');
  if(!cEl) return;
  const fEl = document.getElementById('ctfF');
  const resultEl = document.getElementById('ctfResult');

  function fromC(){
    const c = parseFloat(cEl.value)||0;
    const f = c*9/5+32;
    fEl.value = f.toFixed(1);
    resultEl.textContent = c.toLocaleString()+'°C equals '+f.toFixed(1)+'°F';
  }
  function fromF(){
    const f = parseFloat(fEl.value)||0;
    const c = (f-32)*5/9;
    cEl.value = c.toFixed(1);
    resultEl.textContent = c.toFixed(1)+'°C equals '+f.toLocaleString()+'°F';
  }
  cEl.addEventListener('input', fromC);
  fEl.addEventListener('input', fromF);

  const tbody = document.querySelector('#ctfTable tbody');
  if(tbody){
    const vals = [-20,-10,0,10,20,25,30,37,40,50,75,100];
    tbody.innerHTML = vals.map(c=>'<tr><td>'+c+'°C</td><td>'+(c*9/5+32).toFixed(1)+'°F</td></tr>').join('');
  }
  fromC();
})();

// ---- Currency converter (live rates via frankfurter.dev, ECB data) ----
(function(){
  if(!document.getElementById('curAmt')) return;
  const amtEl = document.getElementById('curAmt');
  const fromEl = document.getElementById('curFrom');
  const toEl = document.getElementById('curTo');
  const outEl = document.getElementById('curOut');
  const rateEl = document.getElementById('curRateLine');
  const dateEl = document.getElementById('curDate');
  const swapBtn = document.getElementById('curSwap');
  const fallbackCurrencies = ['USD','EUR','GBP','INR','JPY','AUD','CAD','CHF','CNY','SGD','NZD','ZAR','SEK','NOK','MXN','BRL','HKD','KRW','THB','PLN'];

  let ratesUSD = null;   // all rates relative to 1 USD
  let asOfDate = '';

  function fillSelect(select, list, def){
    select.innerHTML = list.map(c=>`<option value="${c}">${c}</option>`).join('');
    select.value = list.includes(def) ? def : list[0];
  }

  function convert(){
    const amt = parseFloat(amtEl.value)||0;
    const from = fromEl.value, to = toEl.value;
    if(!from || !to) return;

    const warnEl = document.getElementById('curWarning');
    if(warnEl){
      if(amt<0){ warnEl.textContent = 'Amount is negative — enter a positive value.'; warnEl.classList.add('show'); }
      else { warnEl.textContent=''; warnEl.classList.remove('show'); }
    }

    if(!ratesUSD){
      outEl.textContent = 'Rate unavailable';
      rateEl.textContent = 'Exchange rate data has not loaded yet.';
      return;
    }
    if(!(from in ratesUSD) || !(to in ratesUSD)){
      outEl.textContent = 'Unsupported pair';
      rateEl.textContent = '';
      return;
    }
    const rate = ratesUSD[to]/ratesUSD[from];
    const value = amt*rate;
    outEl.textContent = value.toFixed(2)+' '+to;
    rateEl.textContent = '1 '+from+' = '+rate.toFixed(4)+' '+to;
    dateEl.textContent = 'Rates as of '+asOfDate+' · source: European Central Bank via frankfurter.dev';
  }

  function renderCurChart(dates, values, from, to){
    const el = document.getElementById('curChart');
    if(!el) return;
    if(!values.length){ el.innerHTML = '<p style="font-size:12px;color:var(--graphite);">Trend data unavailable right now.</p>'; return; }
    const W=700, H=180, pad=36;
    const min = Math.min(...values), max = Math.max(...values);
    const range = (max-min)||1;
    const n = values.length;
    const x = i => pad + (i/(Math.max(n-1,1)))*(W-pad-16);
    const y = v => H-24 - ((v-min)/range)*(H-40);
    let path = `M ${x(0)} ${y(values[0])}`;
    values.forEach((v,i)=>{ path += ` L ${x(i)} ${y(v)}`; });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;background:var(--card-hi);border:1px solid var(--paper-line);border-radius:6px;">
      <path d="${path}" fill="none" stroke="var(--teal)" stroke-width="2"/>
      <text x="${pad}" y="14" font-size="10" font-family="JetBrains Mono,monospace" fill="var(--graphite)">1 ${from} IN ${to} — LAST 30 DAYS</text>
      <text x="${pad}" y="${H-6}" font-size="9" font-family="JetBrains Mono,monospace" fill="var(--graphite)">${dates[0]}</text>
      <text x="${W-16}" y="${H-6}" text-anchor="end" font-size="9" font-family="JetBrains Mono,monospace" fill="var(--graphite)">${dates[dates.length-1]}</text>
    </svg>`;
  }

  function loadHistory(){
    const chartEl = document.getElementById('curChart');
    if(!chartEl) return;
    const from = fromEl.value, to = toEl.value;
    if(!from || !to) return;
    if(from===to){ chartEl.innerHTML = '<p style="font-size:12px;color:var(--graphite);">Pick two different currencies to see a trend.</p>'; return; }
    chartEl.innerHTML = '<p style="font-size:12px;color:var(--graphite);">Loading trend…</p>';
    const end = new Date();
    const start = new Date(end); start.setDate(start.getDate()-30);
    const fmt = d => d.toISOString().slice(0,10);
    fetch(`https://api.frankfurter.dev/v1/${fmt(start)}..${fmt(end)}?base=${from}&symbols=${to}`)
      .then(r=>{ if(!r.ok) throw new Error('bad response'); return r.json(); })
      .then(data=>{
        const dates = Object.keys(data.rates).sort();
        const values = dates.map(d=>data.rates[d][to]);
        renderCurChart(dates, values, from, to);
      })
      .catch(()=> renderCurChart([], [], from, to));
  }

  fetch('https://api.frankfurter.dev/v1/latest?base=USD')
    .then(r=>{ if(!r.ok) throw new Error('bad response'); return r.json(); })
    .then(data=>{
      ratesUSD = Object.assign({USD:1}, data.rates);
      asOfDate = data.date;
      const codes = Object.keys(ratesUSD).sort();
      fillSelect(fromEl, codes, 'USD');
      fillSelect(toEl, codes, 'INR');
      convert();
      loadHistory();
    })
    .catch(()=>{
      fillSelect(fromEl, fallbackCurrencies, 'USD');
      fillSelect(toEl, fallbackCurrencies, 'INR');
      outEl.textContent = 'Rate unavailable';
      rateEl.textContent = 'Could not reach the exchange rate service — check your connection and try again.';
      dateEl.textContent = '';
    });

  amtEl.addEventListener('input', convert);
  fromEl.addEventListener('change', ()=>{ convert(); loadHistory(); });
  toEl.addEventListener('change', ()=>{ convert(); loadHistory(); });
  const curPresets = document.getElementById('curPresets');
  if(curPresets){
    curPresets.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      amtEl.value = btn.dataset.amt;
      convert();
    });
  }
  swapBtn.addEventListener('click', ()=>{
    const tmp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = tmp;
    convert();
    loadHistory();
  });
})();

// ---- Scientific calculator: expression tokenizer / parser / evaluator ----
(function(){
  const grid = document.getElementById('sciGrid');
  if(!grid) return;
  const exprEl = document.getElementById('sciExpr');
  const valEl = document.getElementById('sciVal');
  const degBtn = document.getElementById('sciDeg');
  const radBtn = document.getElementById('sciRad');
  const copyBtn = document.getElementById('sciCopy');

  let expr = '';          // the live expression being typed
  let lastAnswer = 0;
  let memory = 0;
  let degMode = true;
  let justEvaluated = false;

  // ---- Tokenizer ----
  function tokenize(str){
    const tokens = [];
    let i = 0;
    const funcs = ['sin','cos','tan','log','ln','sqrt','cbrt'];
    while(i < str.length){
      const c = str[i];
      if(/\s/.test(c)){ i++; continue; }
      if(/[0-9.]/.test(c)){
        let j = i;
        while(j<str.length && /[0-9.]/.test(str[j])) j++;
        tokens.push({type:'num', value: parseFloat(str.slice(i,j))});
        i = j; continue;
      }
      if(c==='π'){ tokens.push({type:'const', value: Math.PI}); i++; continue; }
      if(c==='e'){ tokens.push({type:'const', value: Math.E}); i++; continue; }
      if(str.slice(i,i+3)==='Ans'){ tokens.push({type:'ans'}); i+=3; continue; }
      const mf = funcs.find(f => str.slice(i, i+f.length).toLowerCase()===f);
      if(mf){ tokens.push({type:'func', value: mf}); i += mf.length; continue; }
      if(c==='√'){ tokens.push({type:'func', value:'sqrt'}); i++; continue; }
      if(c==='∛'){ tokens.push({type:'func', value:'cbrt'}); i++; continue; }
      if(c==='('){ tokens.push({type:'lparen'}); i++; continue; }
      if(c===')'){ tokens.push({type:'rparen'}); i++; continue; }
      if(c==='+'){ tokens.push({type:'op', value:'+'}); i++; continue; }
      if(c==='-'||c==='−'){ tokens.push({type:'op', value:'-'}); i++; continue; }
      if(c==='*'||c==='×'){ tokens.push({type:'op', value:'*'}); i++; continue; }
      if(c==='/'||c==='÷'){ tokens.push({type:'op', value:'/'}); i++; continue; }
      if(c==='^'){ tokens.push({type:'op', value:'^'}); i++; continue; }
      if(c==='²'){ tokens.push({type:'postfix', value:'sq'}); i++; continue; }
      if(c==='³'){ tokens.push({type:'postfix', value:'cube'}); i++; continue; }
      if(c==='!'){ tokens.push({type:'postfix', value:'fact'}); i++; continue; }
      if(str.slice(i,i+2)==='⁻¹'){ tokens.push({type:'postfix', value:'inv'}); i+=2; continue; }
      throw new Error('Unexpected character: '+c);
    }
    const out = [];
    for(const t of tokens){
      if(out.length){
        const prev = out[out.length-1];
        const prevEndsValue = ['num','const','ans','rparen','postfix'].includes(prev.type);
        const startsValue = ['num','const','ans','func','lparen'].includes(t.type);
        if(prevEndsValue && startsValue) out.push({type:'op', value:'*'});
      }
      out.push(t);
    }
    return out;
  }

  // ---- Recursive-descent parser ----
  function parse(tokens){
    let pos = 0;
    const peek = () => tokens[pos];
    const advance = () => tokens[pos++];
    function parseExpression(){
      let node = parseTerm();
      while(peek() && peek().type==='op' && (peek().value==='+'||peek().value==='-')){
        const op = advance().value;
        node = {type:'binary', op, left:node, right:parseTerm()};
      }
      return node;
    }
    function parseTerm(){
      let node = parsePower();
      while(peek() && peek().type==='op' && (peek().value==='*'||peek().value==='/')){
        const op = advance().value;
        node = {type:'binary', op, left:node, right:parsePower()};
      }
      return node;
    }
    function parsePower(){
      let node = parseUnary();
      if(peek() && peek().type==='op' && peek().value==='^'){
        advance();
        node = {type:'binary', op:'^', left:node, right:parsePower()}; // right-assoc
      }
      return node;
    }
    function parseUnary(){
      if(peek() && peek().type==='op' && peek().value==='-'){
        advance();
        return {type:'unary', op:'-', operand: parseUnary()};
      }
      return parsePostfix();
    }
    function parsePostfix(){
      let node = parsePrimary();
      while(peek() && peek().type==='postfix'){
        node = {type:'postfixop', op: advance().value, operand: node};
      }
      return node;
    }
    function parsePrimary(){
      const t = peek();
      if(!t) throw new Error('Unexpected end of expression');
      if(t.type==='num' || t.type==='const'){ advance(); return {type:'num', value:t.value}; }
      if(t.type==='ans'){ advance(); return {type:'ans'}; }
      if(t.type==='lparen'){
        advance();
        const node = parseExpression();
        if(peek() && peek().type==='rparen') advance();
        return node;
      }
      if(t.type==='func'){
        advance();
        if(peek() && peek().type==='lparen'){
          advance();
          const arg = parseExpression();
          if(peek() && peek().type==='rparen') advance();
          return {type:'func', name:t.value, arg};
        }
        return {type:'func', name:t.value, arg: parsePostfix()};
      }
      throw new Error('Unexpected token');
    }
    const result = parseExpression();
    if(pos < tokens.length) throw new Error('Unexpected trailing input');
    return result;
  }

  function factorial(n){
    n = Math.round(n);
    if(n<0) return NaN;
    if(n>170) return Infinity;
    let r=1; for(let i=2;i<=n;i++) r*=i;
    return r;
  }

  function evalNode(node){
    switch(node.type){
      case 'num': return node.value;
      case 'ans': return lastAnswer;
      case 'unary': return -evalNode(node.operand);
      case 'postfixop': {
        const v = evalNode(node.operand);
        if(node.op==='sq') return v*v;
        if(node.op==='cube') return v*v*v;
        if(node.op==='fact') return factorial(v);
        if(node.op==='inv') return v===0 ? NaN : 1/v;
        break;
      }
      case 'binary': {
        const a = evalNode(node.left), b = evalNode(node.right);
        if(node.op==='+') return a+b;
        if(node.op==='-') return a-b;
        if(node.op==='*') return a*b;
        if(node.op==='/') return b===0 ? NaN : a/b;
        if(node.op==='^') return Math.pow(a,b);
        break;
      }
      case 'func': {
        const v = evalNode(node.arg);
        const toRad = x => degMode ? x*Math.PI/180 : x;
        switch(node.name){
          case 'sin': return Math.sin(toRad(v));
          case 'cos': return Math.cos(toRad(v));
          case 'tan': return Math.tan(toRad(v));
          case 'log': return Math.log10(v);
          case 'ln': return Math.log(v);
          case 'sqrt': return Math.sqrt(v);
          case 'cbrt': return Math.cbrt(v);
        }
        break;
      }
    }
    throw new Error('Cannot evaluate');
  }

  function fmt(n){
    if(typeof n!=='number' || !isFinite(n)) return 'Error';
    if(Math.abs(n) < 1e-12) n = 0;
    return parseFloat(n.toPrecision(12)).toString();
  }

  function evaluateExpr(str){
    const opens = (str.match(/\(/g)||[]).length;
    const closes = (str.match(/\)/g)||[]).length;
    if(opens>closes) str += ')'.repeat(opens-closes);
    const tokens = tokenize(str);
    const tree = parse(tokens);
    return evalNode(tree);
  }

  function render(){ valEl.textContent = expr || '0'; }

  function insert(str){
    if(justEvaluated){ expr=''; justEvaluated=false; exprEl.textContent='\u00A0'; }
    expr += str;
    render();
  }
  function insertDigit(d){ insert(d); }
  function insertDot(){
    // only block a second dot within the current numeric run
    const m = expr.match(/(\d*\.?\d*)$/);
    if(m && m[0].includes('.')) return;
    insert('.');
  }
  function clearAll(){ expr=''; justEvaluated=false; exprEl.textContent='\u00A0'; render(); }
  function backspace(){
    if(justEvaluated){ clearAll(); return; }
    expr = expr.slice(0,-1);
    render();
  }
  function doEquals(){
    if(!expr){ return; }
    try{
      const r = evaluateExpr(expr);
      if(typeof r!=='number' || !isFinite(r)) throw new Error('Math error');
      exprEl.textContent = expr+' =';
      lastAnswer = r;
      expr = fmt(r);
      valEl.textContent = expr;
      justEvaluated = true;
    } catch(err){
      exprEl.textContent = expr+' =';
      valEl.textContent = 'Error';
      expr = '';
      justEvaluated = true;
    }
  }

  const actions = {
    ac: clearAll,
    back: backspace,
    dot: insertDot,
    eq: doEquals,
    sq: ()=>insert('²'),
    cube: ()=>insert('³'),
    fact: ()=>insert('!'),
    inv: ()=>insert('⁻¹'),
    sqrt: ()=>insert('√('),
    cbrt: ()=>insert('∛('),
    sin: ()=>insert('sin('),
    cos: ()=>insert('cos('),
    tan: ()=>insert('tan('),
    log: ()=>insert('log('),
    ln: ()=>insert('ln('),
    pi: ()=>insert('π'),
    e: ()=>insert('e'),
    ans: ()=>insert('Ans'),
    mc: ()=>{ memory = 0; },
    mr: ()=>insert(fmt(memory)),
    'm+': ()=>{ try{ memory += evaluateExpr(expr||valEl.textContent); }catch(e){} },
    'm-': ()=>{ try{ memory -= evaluateExpr(expr||valEl.textContent); }catch(e){} }
  };

  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    if(btn.dataset.num !== undefined){ insertDigit(btn.dataset.num); return; }
    if(btn.dataset.ins !== undefined){ insert(btn.dataset.ins); return; }
    const act = btn.dataset.act;
    if(act && actions[act]) actions[act]();
  });

  degBtn.addEventListener('click', ()=>{ degMode=true; degBtn.classList.add('active'); radBtn.classList.remove('active'); });
  radBtn.addEventListener('click', ()=>{ degMode=false; radBtn.classList.add('active'); degBtn.classList.remove('active'); });

  if(copyBtn){
    copyBtn.addEventListener('click', ()=>{
      const txt = valEl.textContent;
      if(txt && txt!=='0' && txt!=='Error') navigator.clipboard.writeText(txt);
    });
  }

  // ---- Keyboard support ----
  document.addEventListener('keydown', (e)=>{
    // only act when the scientific calculator is the visible tool on this page
    if(!document.getElementById('scientific')) return;
    const k = e.key;
    if(/^[0-9]$/.test(k)){ insertDigit(k); e.preventDefault(); return; }
    if(k==='.'){ insertDot(); e.preventDefault(); return; }
    if(k==='+'){ insert('+'); e.preventDefault(); return; }
    if(k==='-'){ insert('−'); e.preventDefault(); return; }
    if(k==='*'){ insert('×'); e.preventDefault(); return; }
    if(k==='/'){ insert('÷'); e.preventDefault(); return; }
    if(k==='^'){ insert('^'); e.preventDefault(); return; }
    if(k==='('){ insert('('); e.preventDefault(); return; }
    if(k===')'){ insert(')'); e.preventDefault(); return; }
    if(k==='Enter' || k==='='){ doEquals(); e.preventDefault(); return; }
    if(k==='Backspace'){ backspace(); e.preventDefault(); return; }
    if(k==='Escape'){ clearAll(); e.preventDefault(); return; }
  });

  render();
})();
// ---- Investment calculator (SIP / SWP / Compound growth) ----
(function(){
  const tabs = document.getElementById('invTabs');
  if(!tabs) return;

  tabs.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    tabs.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
  });

  function money(n){
    const cur = document.getElementById('invCur') ? document.getElementById('invCur').value : '$';
    return cur+n.toLocaleString(undefined,{maximumFractionDigits:0});
  }
  const curSel = document.getElementById('invCur');
  if(curSel) curSel.addEventListener('change', ()=>{ calcSIP(); calcSWP(); calcCompound(); });

  function setWarning(id, msg){
    const el = document.getElementById(id);
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  // SIP
  function calcSIP(){
    const P = parseFloat(document.getElementById('sipAmt').value)||0;
    const annual = parseFloat(document.getElementById('sipRate').value)||0;
    const years = parseFloat(document.getElementById('sipYears').value)||0;
    const stepUpEl = document.getElementById('sipStepUp');
    const stepUp = stepUpEl ? (parseFloat(stepUpEl.value)||0) : 0;
    const n = Math.round(years*12);
    const r = annual/100/12;

    if(P < 0){
      setWarning('sipWarning', 'Monthly investment can\'t be negative.');
    } else if(years <= 0){
      setWarning('sipWarning', 'Duration must be greater than zero years.');
    } else if(annual <= -100){
      setWarning('sipWarning', 'An annual return of -100% or lower means the investment loses everything — enter a realistic expected return.');
    } else {
      setWarning('sipWarning', null);
    }

    let maturity, invested, finalMonthAmt;
    if(stepUp === 0){
      maturity = r===0 ? P*n : P*((Math.pow(1+r,n)-1)/r)*(1+r);
      invested = P*n;
      finalMonthAmt = P;
    } else {
      // Simulate month by month: contribution rises by stepUp% at each anniversary
      maturity = 0; invested = 0; finalMonthAmt = P;
      for(let m=1; m<=n; m++){
        const yearIndex = Math.floor((m-1)/12);
        const monthlyAmt = P * Math.pow(1+stepUp/100, yearIndex);
        invested += monthlyAmt;
        finalMonthAmt = monthlyAmt;
        const remainingMonths = n - m + 1;
        maturity += r===0 ? monthlyAmt : monthlyAmt * Math.pow(1+r, remainingMonths);
      }
    }

    document.getElementById('sipInvested').textContent = money(invested);
    document.getElementById('sipReturns').textContent = money(Math.max(maturity-invested,0));
    document.getElementById('sipMaturity').textContent = money(maturity);

    const finalAmtEl = document.getElementById('sipFinalMonthAmt');
    if(finalAmtEl) finalAmtEl.textContent = stepUp>0 ? money(finalMonthAmt)+'/mo by the final year' : '—';

    const inflEl = document.getElementById('sipInflation');
    const realEl = document.getElementById('sipRealValue');
    if(inflEl && realEl){
      const infl = parseFloat(inflEl.value)||0;
      const real = maturity/Math.pow(1+infl/100, years);
      realEl.textContent = money(real);
    }
  }
  ['sipAmt','sipRate','sipYears','sipInflation','sipStepUp'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', calcSIP);
  });
  if(document.getElementById('sipAmt')) calcSIP();

  // SWP
  function calcSWP(){
    let bal = parseFloat(document.getElementById('swpPrincipal').value)||0;
    const withdraw = parseFloat(document.getElementById('swpWithdraw').value)||0;
    const annual = parseFloat(document.getElementById('swpRate').value)||0;
    const years = parseFloat(document.getElementById('swpYears').value)||0;
    const months = Math.round(years*12);

    if(bal < 0){
      setWarning('swpWarning', 'Initial investment can\'t be negative.');
    } else if(withdraw < 0){
      setWarning('swpWarning', 'Monthly withdrawal can\'t be negative.');
    } else if(years <= 0){
      setWarning('swpWarning', 'Duration must be greater than zero years.');
    } else {
      setWarning('swpWarning', null);
    }
    const r = annual/100/12;
    let totalWithdrawn = 0;
    let depletedAt = null;
    for(let m=1; m<=months; m++){
      bal = bal*(1+r) - withdraw;
      totalWithdrawn += withdraw;
      if(bal <= 0){ depletedAt = m; bal = 0; break; }
    }
    document.getElementById('swpWithdrawn').textContent = money(totalWithdrawn);
    document.getElementById('swpBalance').textContent = money(Math.max(bal,0));
    document.getElementById('swpStatus').textContent = depletedAt
      ? 'Funds depleted at month '+depletedAt+' of '+months
      : 'Balance lasts full '+years+'-year term';
  }
  ['swpPrincipal','swpWithdraw','swpRate','swpYears'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', calcSWP);
  });
  if(document.getElementById('swpPrincipal')) calcSWP();

  // Compound growth
  function calcCompound(){
    const P = parseFloat(document.getElementById('cmpPrincipal').value)||0;
    const annual = parseFloat(document.getElementById('cmpRate').value)||0;
    const years = parseFloat(document.getElementById('cmpYears').value)||0;
    const n = parseFloat(document.getElementById('cmpFreq').value)||1;

    if(P < 0){
      setWarning('cmpWarning', 'Principal can\'t be negative.');
    } else if(years <= 0){
      setWarning('cmpWarning', 'Duration must be greater than zero years.');
    } else if(annual <= -100*n){
      setWarning('cmpWarning', 'That interest rate implies losing more than the full principal each compounding period — enter a realistic rate.');
    } else {
      setWarning('cmpWarning', null);
    }

    const maturity = P*Math.pow(1+(annual/100)/n, n*years);
    document.getElementById('cmpPrincipalOut').textContent = money(P);
    document.getElementById('cmpInterest').textContent = money(Math.max(maturity-P,0));
    document.getElementById('cmpMaturity').textContent = money(maturity);
  }
  ['cmpPrincipal','cmpRate','cmpYears','cmpFreq'].forEach(id=>{
    const el = document.getElementById(id);
    if(el){ el.addEventListener('input', calcCompound); el.addEventListener('change', calcCompound); }
  });
  if(document.getElementById('cmpPrincipal')) calcCompound();

  // CAGR
  function calcCAGR(){
    const start = parseFloat(document.getElementById('cagrStart').value)||0;
    const end = parseFloat(document.getElementById('cagrEnd').value)||0;
    const years = parseFloat(document.getElementById('cagrYears').value)||0;

    if(start <= 0){
      setWarning('cagrWarning', 'Starting value must be greater than zero — CAGR is undefined from a zero or negative base.');
    } else if(end < 0){
      setWarning('cagrWarning', 'Ending value can\'t be negative.');
    } else if(years <= 0){
      setWarning('cagrWarning', 'Duration must be greater than zero years.');
    } else {
      setWarning('cagrWarning', null);
    }

    const valid = start > 0 && end >= 0 && years > 0;
    const cagr = valid ? (Math.pow(end/start, 1/years) - 1) * 100 : 0;
    const growth = valid ? ((end-start)/start) * 100 : 0;
    const multiple = valid ? end/start : 0;

    document.getElementById('cagrOut').textContent = valid ? cagr.toFixed(2)+'%' : '—';
    document.getElementById('cagrGrowth').textContent = valid ? (growth>0?'+':'')+growth.toFixed(2)+'%' : '—';
    document.getElementById('cagrMultiple').textContent = valid ? multiple.toFixed(2)+'x' : '—';
  }
  ['cagrStart','cagrEnd','cagrYears'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', calcCAGR);
  });
  if(document.getElementById('cagrStart')) calcCAGR();
})();

// ---- Tax calculator: shared bracket data + pure calculation helpers ----
// Hoisted out of the main calculator IIFE so the comparison-mode module below
// can reuse the exact same numbers — one source of truth, not a duplicated copy.
const taxFlatSchemes = {
  ca: { symbol:'C$', brackets:[[57375,0.15],[114750,0.205],[177882,0.26],[253414,0.29],[Infinity,0.33]], dedLabel:'RRSP contributions & other deductions' },
  uk: { symbol:'£', brackets:[[12570,0],[50270,0.20],[125140,0.40],[Infinity,0.45]], dedLabel:'Pension contributions & Gift Aid' },
  de: { symbol:'€', brackets:[[11604,0],[66760,0.30],[277825,0.42],[Infinity,0.45]], dedLabel:'Werbungskosten & other deductions (simplified)' },
  fr: { symbol:'€', brackets:[[11497,0],[29315,0.11],[83823,0.30],[180294,0.41],[Infinity,0.45]], dedLabel:'Deductible expenses & abatements' },
  au: { symbol:'A$', brackets:[[18200,0],[45000,0.16],[135000,0.30],[190000,0.37],[Infinity,0.45]], dedLabel:'Work-related & other deductions' },
  sg: { symbol:'S$', brackets:[[20000,0],[30000,0.02],[40000,0.035],[80000,0.07],[120000,0.115],[160000,0.15],[200000,0.18],[240000,0.19],[280000,0.195],[320000,0.20],[Infinity,0.24]], dedLabel:'Reliefs (CPF, course fees, etc.)' },
  ae: { symbol:'AED ', brackets:[[Infinity,0]], dedLabel:'Not applicable' }
};
// Tax year 2026 (IRS Rev. Proc. inflation adjustments, incl. OBBB amendments).
const taxUsFiling = {
  single: { standardDeduction:16100, brackets:[[12400,0.10],[50400,0.12],[105700,0.22],[201775,0.24],[256225,0.32],[640600,0.35],[Infinity,0.37]] },
  mfj:    { standardDeduction:32200, brackets:[[24800,0.10],[100800,0.12],[211400,0.22],[403550,0.24],[512450,0.32],[768700,0.35],[Infinity,0.37]] },
  hoh:    { standardDeduction:24150, brackets:[[17700,0.10],[67450,0.12],[105700,0.22],[201775,0.24],[256200,0.32],[640600,0.35],[Infinity,0.37]] }
};
const taxIndiaRegimes = {
  new: { standardDeduction:75000, brackets:[[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]], rebateThreshold:1200000 },
  old: { standardDeduction:50000, brackets:[[250000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]], rebateThreshold:500000 }
};

function calcBracketTax(income, brackets){
  let tax = 0, lower = 0;
  const rows = [];
  for(const [ceiling, rate] of brackets){
    if(income > lower){
      const taxableInBand = Math.min(income, ceiling) - lower;
      const bandTax = taxableInBand*rate;
      tax += bandTax;
      rows.push({lower, ceiling, rate, bandTax});
    } else {
      rows.push({lower, ceiling, rate, bandTax:0});
    }
    lower = ceiling;
  }
  return {tax, rows};
}
function taxFmtMoney(sym, n){ return sym+Math.round(Math.max(n,0)).toLocaleString(); }

// Returns a scheme using ONLY the standard/default deduction (no itemized
// fields) for a given country + filing status/regime — used by comparison
// mode, where Scenario B intentionally stays simple rather than duplicating
// every itemized deduction field from Scenario A.
function getStandardTaxScheme(country, filingStatus, indiaRegime){
  if(country==='us'){
    const fs = taxUsFiling[filingStatus] || taxUsFiling.single;
    return { symbol:'$', standardDeduction:fs.standardDeduction, brackets:fs.brackets, extraDed:0, rebateThreshold:0 };
  }
  if(country==='in'){
    const rg = taxIndiaRegimes[indiaRegime] || taxIndiaRegimes.new;
    return { symbol:'₹', standardDeduction:rg.standardDeduction, brackets:rg.brackets, extraDed:0, rebateThreshold:rg.rebateThreshold, isIndia:true };
  }
  const scheme = taxFlatSchemes[country] || taxFlatSchemes.uk;
  return { symbol:scheme.symbol, standardDeduction:0, brackets:scheme.brackets, extraDed:0, rebateThreshold:0 };
}

// Computes final tax/take-home/effective-rate from a scheme + gross income —
// shared by both the main calculator and comparison mode.
function computeTaxFromScheme(scheme, gross){
  const totalDed = scheme.standardDeduction + (scheme.extraDed||0);
  const taxable = Math.max(gross-totalDed, 0);
  let { tax, rows } = calcBracketTax(taxable, scheme.brackets);
  if(scheme.rebateThreshold && taxable <= scheme.rebateThreshold){
    tax = 0;
  } else if(scheme.isIndia){
    tax = tax*1.04; // 4% health & education cess
  }
  const takeHome = Math.max(gross-tax,0);
  const effRate = gross>0 ? (tax/gross*100) : 0;
  return { tax, taxable, takeHome, effRate, totalDed, rows };
}

// Simplified payroll-tax add-ons (beyond income tax) for the Paycheck Calculator.
// Only modeled where the deduction is a major, well-known share of a paycheck —
// other countries get income tax only, disclosed as such on the page.
const payrollTaxes = {
  us: (annualGross)=>{
    const ssWageBase = 168600;
    const ss = Math.min(annualGross, ssWageBase) * 0.062;
    const medicare = annualGross * 0.0145;
    return ss + medicare;
  },
  in: (annualGross)=> annualGross * 0.12, // simplified EPF employee contribution
  uk: (annualGross)=>{
    const primaryThreshold = 12570, upperLimit = 50270;
    let ni = 0;
    if(annualGross > primaryThreshold) ni += (Math.min(annualGross, upperLimit) - primaryThreshold) * 0.08;
    if(annualGross > upperLimit) ni += (annualGross - upperLimit) * 0.02;
    return ni;
  },
  ca: (annualGross)=>{
    const cppMax = 68500, eiMax = 63200;
    return Math.min(annualGross, cppMax)*0.0595 + Math.min(annualGross, eiMax)*0.0164;
  }
};
function getPayrollTax(country, annualGross){
  const fn = payrollTaxes[country];
  return fn ? fn(annualGross) : 0;
}
const payrollTaxLabels = { us:'Social Security + Medicare', in:'EPF contribution (simplified)', uk:'National Insurance', ca:'CPP + EI' };

// ---- Tax calculator ----
(function(){
  const countrySel = document.getElementById('taxCountry');
  if(!countrySel) return;

  const flatSchemes = taxFlatSchemes;
  const usFiling = taxUsFiling;
  const indiaRegimes = taxIndiaRegimes;

  const countrySel_ = countrySel;
  const filingWrap = document.getElementById('taxFilingWrap');
  const filingSel = document.getElementById('taxFilingStatus');
  const regimeWrap = document.getElementById('taxRegimeWrap');
  const regimeSeg = document.getElementById('taxRegimeSeg');
  const indiaOldFields = document.getElementById('taxIndiaOldFields');
  const genericWrap = document.getElementById('taxGenericDedWrap');
  const genericLabel = document.getElementById('taxGenericDedLabel');
  const stdDedLine = document.getElementById('taxStandardDedVal');
  const salaryEl = document.getElementById('taxSalary');
  const otherEl = document.getElementById('taxOtherIncome');
  const curLabels = document.querySelectorAll('.tax-cur-label');
  const grossEl = document.getElementById('taxGross');
  const dedEl = document.getElementById('taxDeductions');
  const taxableEl = document.getElementById('taxTaxable');
  const amtEl = document.getElementById('taxAmt');
  const takeHomeEl = document.getElementById('taxTakeHome');
  const effEl = document.getElementById('taxEffRate');
  const tbody = document.getElementById('taxTableBody');

  let indiaRegime = 'new';

  function fmtMoney(sym, n){ return taxFmtMoney(sym, n); }
  function fmtBand(sym, lower, ceiling){
    const upper = ceiling===Infinity ? '+' : fmtMoney(sym, ceiling);
    return fmtMoney(sym, lower)+' – '+upper;
  }

  function updateFieldVisibility(){
    const country = countrySel_.value;
    filingWrap.style.display = country==='us' ? '' : 'none';
    regimeWrap.style.display = country==='in' ? '' : 'none';
    indiaOldFields.style.display = (country==='in' && indiaRegime==='old') ? '' : 'none';
    genericWrap.style.display = (country==='us' || country==='in') ? 'none' : '';

    let symbol = '$';
    if(country==='us') symbol = '$';
    else if(country==='in') symbol = '₹';
    else symbol = flatSchemes[country] ? flatSchemes[country].symbol.trim() : '$';
    curLabels.forEach(el=>el.textContent = symbol);

    if(flatSchemes[country]) genericLabel.textContent = flatSchemes[country].dedLabel;
  }

  function getScheme(){
    const country = countrySel_.value;
    if(country==='us'){
      const fs = usFiling[filingSel.value] || usFiling.single;
      return { symbol:'$', standardDeduction:fs.standardDeduction, brackets:fs.brackets, extraDed:0, rebateThreshold:0 };
    }
    if(country==='in'){
      const rg = indiaRegimes[indiaRegime];
      let extraDed = 0;
      if(indiaRegime==='old'){
        const c80 = Math.min(parseFloat(document.getElementById('tax80c').value)||0, 150000);
        const d80 = Math.min(parseFloat(document.getElementById('tax80d').value)||0, 25000);
        const home = Math.min(parseFloat(document.getElementById('taxHomeLoan').value)||0, 200000);
        const hra = Math.max(parseFloat(document.getElementById('taxHRA').value)||0, 0);
        extraDed = c80+d80+home+hra;
      }
      return { symbol:'₹', standardDeduction:rg.standardDeduction, brackets:rg.brackets, extraDed, rebateThreshold:rg.rebateThreshold, isIndia:true };
    }
    const scheme = flatSchemes[country];
    const extraDed = Math.max(parseFloat(document.getElementById('taxGenericDed').value)||0, 0);
    return { symbol:scheme.symbol, standardDeduction:0, brackets:scheme.brackets, extraDed, rebateThreshold:0 };
  }

  function setWarning(msg){
    const el = document.getElementById('taxWarning');
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function calc(){
    updateFieldVisibility();
    const scheme = getScheme();
    const salary = parseFloat(salaryEl.value)||0;
    const other = parseFloat(otherEl.value)||0;
    const gross = salary+other;
    const totalDed = scheme.standardDeduction + scheme.extraDed;
    const taxable = Math.max(gross-totalDed, 0);

    if(salary < 0 || other < 0){
      setWarning('Income can\'t be negative — enter positive amounts for salary and other income.');
    } else if(countrySel_.value==='in' && indiaRegime==='old'){
      const rawC = parseFloat(document.getElementById('tax80c').value)||0;
      const rawD = parseFloat(document.getElementById('tax80d').value)||0;
      const rawHome = parseFloat(document.getElementById('taxHomeLoan').value)||0;
      const capped = [];
      if(rawC > 150000) capped.push('80C (capped at ₹1,50,000)');
      if(rawD > 25000) capped.push('80D (capped at ₹25,000)');
      if(rawHome > 200000) capped.push('Section 24 home loan interest (capped at ₹2,00,000)');
      setWarning(capped.length ? 'You entered more than the statutory limit for: '+capped.join(', ')+'. The excess isn\'t deductible, so the calculation applies the cap automatically.' : null);
    } else {
      setWarning(null);
    }

    stdDedLine.textContent = fmtMoney(scheme.symbol, scheme.standardDeduction);

    let { tax, rows } = calcBracketTax(taxable, scheme.brackets);

    if(scheme.rebateThreshold && taxable <= scheme.rebateThreshold){
      tax = 0;
    } else if(scheme.isIndia){
      tax = tax*1.04; // 4% health & education cess
    }

    const takeHome = Math.max(gross-tax,0);
    const effRate = gross>0 ? (tax/gross*100) : 0;

    grossEl.textContent = fmtMoney(scheme.symbol, gross);
    dedEl.textContent = fmtMoney(scheme.symbol, totalDed);
    taxableEl.textContent = fmtMoney(scheme.symbol, taxable);
    amtEl.textContent = fmtMoney(scheme.symbol, tax);
    takeHomeEl.textContent = fmtMoney(scheme.symbol, takeHome);
    effEl.textContent = effRate.toFixed(2)+'%';

    tbody.innerHTML = rows.map(r=>{
      return '<tr><td>'+fmtBand(scheme.symbol, r.lower, r.ceiling)+'</td><td>'+(r.rate*100).toFixed(1)+'%</td><td>'+fmtMoney(scheme.symbol, r.bandTax)+'</td></tr>';
    }).join('');
  }

  countrySel_.addEventListener('change', calc);
  filingSel.addEventListener('change', calc);
  salaryEl.addEventListener('input', calc);
  otherEl.addEventListener('input', calc);
  ['tax80c','tax80d','taxHomeLoan','taxHRA','taxGenericDed'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', calc);
  });
  regimeSeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    indiaRegime = btn.dataset.regime;
    regimeSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });

  updateFieldVisibility();
  calc();
})();

// ---- Tax: compare two scenarios ----
(function(){
  const toggle = document.getElementById('taxCompareToggle');
  if(!toggle) return;
  const wrap = document.getElementById('taxCompareWrap');
  const countryBSel = document.getElementById('taxCountryB');
  const filingWrapB = document.getElementById('taxFilingWrapB');
  const filingSelB = document.getElementById('taxFilingStatusB');
  const regimeWrapB = document.getElementById('taxRegimeWrapB');
  const regimeSegB = document.getElementById('taxRegimeSegB');
  let indiaRegimeB = 'new';

  function updateVisibilityB(){
    const country = countryBSel.value;
    filingWrapB.style.display = country==='us' ? '' : 'none';
    regimeWrapB.style.display = country==='in' ? '' : 'none';
  }

  function calcCompare(){
    if(wrap.style.display === 'none') return;
    updateVisibilityB();

    const salaryEl = document.getElementById('taxSalary');
    const otherEl = document.getElementById('taxOtherIncome');
    const gross = (parseFloat(salaryEl.value)||0) + (parseFloat(otherEl.value)||0);

    // Scenario A: read directly from the already-computed main calculator output
    const amtAText = document.getElementById('taxAmt').textContent;
    const takeHomeAText = document.getElementById('taxTakeHome').textContent;
    const effRateAText = document.getElementById('taxEffRate').textContent;

    // Scenario B: compute independently using the shared standard-deduction-only engine
    const countryB = countryBSel.value;
    const schemeB = getStandardTaxScheme(countryB, filingSelB.value, indiaRegimeB);
    const resultB = computeTaxFromScheme(schemeB, gross);

    document.getElementById('taxAmtB').textContent = taxFmtMoney(schemeB.symbol, resultB.tax);
    document.getElementById('taxTakeHomeB').textContent = taxFmtMoney(schemeB.symbol, resultB.takeHome);
    document.getElementById('taxEffRateB').textContent = resultB.effRate.toFixed(2)+'%';

    document.getElementById('taxCompAmt').textContent = amtAText+' vs '+taxFmtMoney(schemeB.symbol, resultB.tax);
    document.getElementById('taxCompTakeHome').textContent = takeHomeAText+' vs '+taxFmtMoney(schemeB.symbol, resultB.takeHome);
    document.getElementById('taxCompRate').textContent = effRateAText+' vs '+resultB.effRate.toFixed(2)+'%';

    // Parse A's numeric tax back out for comparison (strip currency symbol/commas)
    const amtANum = parseFloat(amtAText.replace(/[^0-9.]/g,''))||0;
    const diff = amtANum - resultB.tax;
    let winner;
    if(Math.abs(diff) < 1) winner = 'Roughly equal';
    else if(diff > 0) winner = 'Scenario B has the lower estimated tax';
    else winner = 'Scenario A has the lower estimated tax';
    document.getElementById('taxCompWinner').textContent = winner;
  }

  toggle.addEventListener('change', ()=>{
    wrap.style.display = toggle.checked ? 'block' : 'none';
    calcCompare();
  });
  countryBSel.addEventListener('change', calcCompare);
  filingSelB.addEventListener('change', calcCompare);
  regimeSegB.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    indiaRegimeB = btn.dataset.regime;
    regimeSegB.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calcCompare();
  });
  // Recalculate whenever Scenario A's inputs change too, since B shares the income figure
  ['taxSalary','taxOtherIncome','taxCountry','taxFilingStatus','tax80c','tax80d','taxHomeLoan','taxHRA','taxGenericDed'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calcCompare);
    el.addEventListener('change', calcCompare);
  });
  const regimeSegA = document.getElementById('taxRegimeSeg');
  if(regimeSegA) regimeSegA.addEventListener('click', ()=>setTimeout(calcCompare,0));

  updateVisibilityB();
})();

// ---- Password generator ----
(function(){
  if(!document.getElementById('pwGen')) return;
  const pwLen = document.getElementById('pwLen');
  pwLen.addEventListener('input',()=>{document.getElementById('pwLenVal').textContent=pwLen.value; genPassword();});

  const AMBIG = /[Il1O0]/g;

  function fmtCrackTime(seconds){
    if(!isFinite(seconds)) return '—';
    const units = [
      [31557600000000, 'million+ years'],
      [31557600, 'years'],
      [2629800, 'months'],
      [86400, 'days'],
      [3600, 'hours'],
      [60, 'minutes']
    ];
    if(seconds > 31557600*1e6) return 'longer than the age of the universe';
    for(const [secs,label] of units){
      if(seconds >= secs) return (seconds/secs).toFixed(seconds/secs>100?0:1)+' '+label;
    }
    return Math.round(seconds)+' seconds';
  }

  function genPassword(){
    const len = parseInt(pwLen.value);
    const excludeAmbig = document.getElementById('pwAmbig').checked;
    let sets = [];
    if(document.getElementById('pwUpper').checked) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if(document.getElementById('pwLower').checked) sets.push('abcdefghijklmnopqrstuvwxyz');
    if(document.getElementById('pwNum').checked) sets.push('0123456789');
    if(document.getElementById('pwSym').checked) sets.push('!@#$%^&*-_=+?');
    if(sets.length===0){ document.getElementById('pwOut').textContent='Select at least one option'; return; }
    if(excludeAmbig) sets = sets.map(s=>s.replace(AMBIG,''));
    const all = sets.join('');
    let pw='';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for(let i=0;i<len;i++){ pw += all[arr[i]%all.length]; }
    document.getElementById('pwOut').textContent = pw;

    const poolSize = all.length;
    const entropy = len * Math.log2(poolSize);
    const entropyEl = document.getElementById('pwEntropy');
    if(entropyEl){
      let label = entropy<40?'Weak':entropy<60?'Moderate':entropy<80?'Strong':'Very strong';
      entropyEl.textContent = Math.round(entropy)+' bits ('+label+')';
    }
    const crackEl = document.getElementById('pwCrackTime');
    if(crackEl){
      const guesses = Math.pow(2, entropy) / 2; // average case
      const seconds = guesses / 1e10; // 10B guesses/sec offline attack
      crackEl.textContent = fmtCrackTime(seconds);
    }
  }
  document.getElementById('pwGen').addEventListener('click',genPassword);
  document.getElementById('pwAmbig').addEventListener('change',genPassword);
  ['pwUpper','pwLower','pwNum','pwSym'].forEach(id=>{
    document.getElementById(id).addEventListener('change',genPassword);
  });
  document.getElementById('pwCopy').addEventListener('click',()=>{
    const txt = document.getElementById('pwOut').textContent;
    if(txt && txt!=='—') navigator.clipboard.writeText(txt);
  });
  genPassword();
})();

// ---- Word counter ----
(function(){
  if(!document.getElementById('wcText')) return;
  function fmtTime(totalSeconds){
    if(totalSeconds < 60) return Math.round(totalSeconds)+' sec';
    const m = Math.floor(totalSeconds/60), s = Math.round(totalSeconds%60);
    return m+' min'+(s>0 ? ' '+s+' sec' : '');
  }
  function countSyllables(word){
    const w = word.toLowerCase().replace(/[^a-z]/g,'');
    if(!w) return 0;
    const groups = w.match(/[aeiouy]+/g) || [];
    let count = groups.length;
    if(w.endsWith('e') && count>1) count--;
    return Math.max(count,1);
  }
  function calcWords(){
    const text = document.getElementById('wcText').value;
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g,'').length;
    const sentences = trimmed ? ((text.match(/[.!?]+(\s|$)/g)||[]).length || 1) : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(p=>p.trim().length>0).length : 0;

    document.getElementById('wcWords').textContent = words;
    document.getElementById('wcChars').textContent = chars;
    const noSpaceEl = document.getElementById('wcCharsNoSpace');
    if(noSpaceEl) noSpaceEl.textContent = charsNoSpace;
    document.getElementById('wcSent').textContent = sentences;
    const paraEl = document.getElementById('wcPara');
    if(paraEl) paraEl.textContent = paragraphs;
    const readEl = document.getElementById('wcReadTime');
    if(readEl) readEl.textContent = fmtTime(words/225*60);
    const speakEl = document.getElementById('wcSpeakTime');
    if(speakEl) speakEl.textContent = fmtTime(words/140*60);

    const fleschEl = document.getElementById('wcFlesch');
    const fleschLabelEl = document.getElementById('wcFleschLabel');
    if(fleschEl && fleschLabelEl){
      if(words===0 || sentences===0){
        fleschEl.textContent = '—';
        fleschLabelEl.textContent = '—';
      } else {
        const syllables = trimmed.split(/\s+/).reduce((sum,w)=>sum+countSyllables(w),0);
        const score = 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words);
        const clamped = Math.max(0, Math.min(100, score));
        fleschEl.textContent = clamped.toFixed(1);
        let label;
        if(clamped>=90) label = 'Very easy (5th grade)';
        else if(clamped>=70) label = 'Easy (7th grade)';
        else if(clamped>=60) label = 'Standard (8th-9th grade)';
        else if(clamped>=50) label = 'Fairly difficult (high school)';
        else if(clamped>=30) label = 'Difficult (college)';
        else label = 'Very difficult (college graduate)';
        fleschLabelEl.textContent = label;
      }
    }
  }
  document.getElementById('wcText').addEventListener('input',calcWords);
  const exampleBtn = document.getElementById('wcExample');
  if(exampleBtn){
    exampleBtn.addEventListener('click', ()=>{
      const textEl = document.getElementById('wcText');
      textEl.value = 'A blog post rarely needs to be long to be useful — it needs to answer the reader\'s question quickly and clearly.\n\nAim for short paragraphs, concrete examples, and a title that matches what someone would actually type into a search bar. Reading time matters more than word count on its own: a dense 400-word post can take longer to read than a loosely written 700-word one.\n\nCheck this against your own draft above, then paste your actual text in to see the real numbers.';
      textEl.dispatchEvent(new Event('input', {bubbles:true}));
    });
  }
})();

// ---- Days Between Dates ----
(function(){
  const startEl = document.getElementById('daysStart');
  if(!startEl) return;
  const endEl = document.getElementById('daysEnd');
  const bizCheck = document.getElementById('daysExcludeWeekends');
  const inclusiveCheck = document.getElementById('daysInclusive');

  function calc(){
    const s = startEl.value ? new Date(startEl.value+'T00:00:00') : null;
    const e = endEl.value ? new Date(endEl.value+'T00:00:00') : null;
    if(!s || !e){ return; }
    let d1 = s, d2 = e;
    if(d1 > d2){ const t=d1; d1=d2; d2=t; }

    const msPerDay = 86400000;
    const inclusive = inclusiveCheck && inclusiveCheck.checked;
    let totalDays = Math.round((d2-d1)/msPerDay);
    if(inclusive) totalDays += 1;
    const weeks = (totalDays/7).toFixed(1);

    // Y/M/D breakdown (always the plain calendar difference, inclusive/exclusive doesn't apply here)
    let y = d2.getFullYear()-d1.getFullYear();
    let m = d2.getMonth()-d1.getMonth();
    let day = d2.getDate()-d1.getDate();
    if(day<0){ m--; day += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate(); }
    if(m<0){ y--; m+=12; }

    // business days
    let biz = 0;
    const cursor = new Date(d1);
    const bizEndExclusive = inclusive ? new Date(d2.getTime()+msPerDay) : d2;
    while(cursor < bizEndExclusive){
      const dow = cursor.getDay();
      if(dow!==0 && dow!==6) biz++;
      cursor.setDate(cursor.getDate()+1);
    }

    document.getElementById('daysTotal').textContent = totalDays.toLocaleString();
    document.getElementById('daysWeeks').textContent = weeks;
    document.getElementById('daysYMD').textContent = y+'y '+m+'m '+day+'d';
    document.getElementById('daysBusiness').textContent = biz.toLocaleString();
  }

  startEl.addEventListener('input', calc);
  endEl.addEventListener('input', calc);
  if(bizCheck) bizCheck.addEventListener('change', calc);
  if(inclusiveCheck) inclusiveCheck.addEventListener('change', calc);

  // sensible defaults: today and 30 days from today
  const today = new Date();
  const future = new Date(today.getTime()+30*86400000);
  startEl.value = today.toISOString().slice(0,10);
  endEl.value = future.toISOString().slice(0,10);
  calc();
})();

// ---- Week number calculator ----
(function(){
  const dateEl = document.getElementById('wnDate');
  if(!dateEl) return;

  function isLeap(y){ return (y%4===0 && y%100!==0) || y%400===0; }

  function getISOWeekInfo(date){
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
    const isoYear = d.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
    const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
    const week = 1 + Math.round((d - firstThursday) / (7*86400000));
    return { week, isoYear };
  }

  function calc(){
    const val = dateEl.value;
    const warnEl = document.getElementById('wnWarning');
    if(!val){
      if(warnEl){ warnEl.textContent = 'Enter a date.'; warnEl.classList.add('show'); }
      ['wnWeek','wnWeekday','wnDayOfYear','wnIsoYear'].forEach(id=>document.getElementById(id).textContent='—');
      return;
    }
    if(warnEl){ warnEl.textContent = ''; warnEl.classList.remove('show'); }

    const date = new Date(val+'T00:00:00');
    const { week, isoYear } = getISOWeekInfo(date);
    const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const startOfYear = new Date(date.getFullYear(),0,1);
    const dayOfYear = Math.round((date-startOfYear)/86400000) + 1;

    document.getElementById('wnWeek').textContent = 'Week '+week;
    document.getElementById('wnWeekday').textContent = weekdayNames[date.getDay()];
    document.getElementById('wnDayOfYear').textContent = dayOfYear+' of '+(isLeap(date.getFullYear())?366:365);
    document.getElementById('wnIsoYear').textContent = isoYear;
  }

  if(!dateEl.value) dateEl.value = new Date().toISOString().slice(0,10);
  dateEl.addEventListener('input', calc);
  calc();
})();

// ---- Add/subtract days from a date ----
(function(){
  const startEl = document.getElementById('addStart');
  if(!startEl) return;
  const daysEl = document.getElementById('addDays');
  const seg = document.getElementById('addDirSeg');
  let dir = 'add';

  function calc(){
    if(!startEl.value) return;
    const base = new Date(startEl.value+'T00:00:00');
    const n = parseInt(daysEl.value)||0;
    const result = new Date(base);
    result.setDate(result.getDate() + (dir==='add' ? n : -n));
    document.getElementById('addResult').textContent = result.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
    document.getElementById('addDow').textContent = result.toLocaleDateString(undefined,{weekday:'long'});
  }
  if(seg){
    seg.addEventListener('click',(e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      dir = btn.dataset.dir;
      seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      calc();
    });
  }
  startEl.addEventListener('input', calc);
  daysEl.addEventListener('input', calc);
  startEl.value = new Date().toISOString().slice(0,10);
  calc();
})();

// ---- Mortgage calculator ----
(function(){
  const priceEl = document.getElementById('mtgPrice');
  if(!priceEl) return;
  const curEl = document.getElementById('mtgCur');
  const downEl = document.getElementById('mtgDown');
  const rateEl = document.getElementById('mtgRate');
  const termEl = document.getElementById('mtgTerm');
  const taxEl = document.getElementById('mtgTax');
  const insEl = document.getElementById('mtgInsurance');
  const pmiRateEl = document.getElementById('mtgPmiRate');
  const hoaEl = document.getElementById('mtgHoa');
  const extraEl = document.getElementById('mtgExtra');

  function fmtMonths(m){
    const y = Math.floor(m/12), rem = m%12;
    if(y===0) return rem+' mo';
    return rem===0 ? y+' yr' : y+' yr '+rem+' mo';
  }

  function setWarning(msg){
    const el = document.getElementById('mtgWarning');
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function calc(){
    const cur = curEl.value;
    const price = parseFloat(priceEl.value)||0;
    const down = parseFloat(downEl.value)||0;
    const principal = Math.max(price-down, 0);
    const annualRate = parseFloat(rateEl.value)||0;
    const years = parseFloat(termEl.value)||1;
    const n = Math.round(years*12);
    const extra = extraEl ? (parseFloat(extraEl.value)||0) : 0;

    if(price <= 0){
      setWarning('Home price must be greater than zero.');
    } else if(down < 0){
      setWarning('Down payment can\'t be negative.');
    } else if(down >= price){
      setWarning('Down payment can\'t be greater than or equal to the home price — there would be nothing left to borrow.');
    } else if(annualRate < 0){
      setWarning('Interest rate can\'t be negative.');
    } else if(years <= 0){
      setWarning('Loan term must be greater than zero years.');
    } else {
      setWarning(null);
    }

    const base = buildAmortization(principal, annualRate, n, 0);
    const acc  = extra>0 ? buildAmortization(principal, annualRate, n, extra) : base;
    const pi = base.pay;

    const downPct = price>0 ? down/price*100 : 0;
    const pmiAnnualRate = parseFloat(pmiRateEl.value)||0;
    const pmiMonthly = downPct < 20 ? (principal*pmiAnnualRate/100)/12 : 0;

    const taxMonthly = (parseFloat(taxEl.value)||0)/12;
    const insMonthly = (parseFloat(insEl.value)||0)/12;
    const hoaMonthly = hoaEl ? (parseFloat(hoaEl.value)||0) : 0;

    const extras = taxMonthly+insMonthly+pmiMonthly+hoaMonthly;
    const total = pi+extras+extra;

    document.getElementById('mtgPI').textContent = cur+pi.toFixed(2);
    document.getElementById('mtgExtras').textContent = cur+extras.toFixed(2);
    document.getElementById('mtgTotal').textContent = cur+total.toFixed(2);
    document.getElementById('mtgTotalInterest').textContent = cur+Math.max(acc.totalInterest,0).toFixed(2);

    const payoffEl = document.getElementById('mtgPayoff');
    const savedEl = document.getElementById('mtgSaved');
    if(payoffEl) payoffEl.textContent = (n>0&&principal>0) ? fmtMonths(acc.monthsTaken) : '—';
    if(savedEl) savedEl.textContent = extra>0
      ? cur+Math.max(base.totalInterest-acc.totalInterest,0).toFixed(2)+' · '+fmtMonths(Math.max(base.monthsTaken-acc.monthsTaken,0))+' sooner'
      : '—';
  }

  [priceEl, curEl, downEl, rateEl, termEl, taxEl, insEl, pmiRateEl, hoaEl, extraEl].forEach(el=>{
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- GST / VAT calculator ----
(function(){
  const amtEl = document.getElementById('gstAmt');
  if(!amtEl) return;
  const presetEl = document.getElementById('gstPreset');
  const customWrap = document.getElementById('gstCustomWrap');
  const customRateEl = document.getElementById('gstCustomRate');
  const modeSeg = document.getElementById('gstModeSeg');
  let mode = 'add';

  function getRate(){
    if(presetEl.value === 'custom') return parseFloat(customRateEl.value)||0;
    if(presetEl.value === '5ca') return 5;
    return parseFloat(presetEl.value)||0;
  }

  function calc(){
    customWrap.style.display = presetEl.value==='custom' ? '' : 'none';
    const amt = parseFloat(amtEl.value)||0;
    const rate = getRate();
    let base, tax, total;
    if(mode==='add'){
      base = amt;
      tax = amt*rate/100;
      total = base+tax;
    } else {
      total = amt;
      base = amt/(1+rate/100);
      tax = total-base;
    }
    document.getElementById('gstBase').textContent = base.toFixed(2);
    document.getElementById('gstTax').textContent = tax.toFixed(2);
    document.getElementById('gstTotal').textContent = total.toFixed(2);

    const splitEl = document.getElementById('gstSplit');
    if(splitEl){
      const isIndiaFlat = ['5','12','18','28'].includes(presetEl.value);
      splitEl.textContent = isIndiaFlat
        ? (tax/2).toFixed(2)+' CGST + '+(tax/2).toFixed(2)+' SGST'
        : '—';
    }

    const warnEl = document.getElementById('gstWarning');
    if(warnEl){
      let msg = null;
      if(amt<0) msg = 'Amount is negative — enter a positive value.';
      else if(rate<0) msg = 'Tax rate is negative — enter 0 or a positive percentage.';
      if(msg){ warnEl.textContent = msg; warnEl.classList.add('show'); }
      else { warnEl.textContent=''; warnEl.classList.remove('show'); }
    }
  }

  amtEl.addEventListener('input', calc);
  presetEl.addEventListener('change', calc);
  customRateEl.addEventListener('input', calc);
  modeSeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    mode = btn.dataset.mode;
    modeSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  calc();
})();

// ---- Calorie / BMR calculator ----
(function(){
  const ageEl = document.getElementById('calAge');
  if(!ageEl) return;
  const weightEl = document.getElementById('calWeight');
  const weightUnitEl = document.getElementById('calWeightUnit');
  const unitEl = document.getElementById('calHeightUnit');
  const cmWrap = document.getElementById('calCmWrap');
  const ftWrap = document.getElementById('calFtWrap');
  const cmEl = document.getElementById('calHeightCm');
  const ftEl = document.getElementById('calHeightFt');
  const inEl = document.getElementById('calHeightIn');
  const activityEl = document.getElementById('calActivity');
  const sexSeg = document.getElementById('calSexSeg');
  const macroStyleEl = document.getElementById('calMacroStyle');
  let sex = 'male';

  const macroSplits = {
    balanced:    {p:0.30, c:0.40, f:0.30},
    highprotein: {p:0.40, c:0.30, f:0.30},
    lowcarb:     {p:0.35, c:0.20, f:0.45}
  };

  function getHeightCm(){
    if(unitEl.value==='ft'){
      const ft = parseFloat(ftEl.value)||0;
      const inch = parseFloat(inEl.value)||0;
      return (ft*12+inch)*2.54;
    }
    return parseFloat(cmEl.value)||0;
  }
  function getWeightKg(){
    const w = parseFloat(weightEl.value)||0;
    return (weightUnitEl && weightUnitEl.value==='lb') ? w/2.20462 : w;
  }

  function calc(){
    const isFt = unitEl.value==='ft';
    cmWrap.style.display = isFt ? 'none' : 'flex';
    ftWrap.style.display = isFt ? 'grid' : 'none';

    const age = parseFloat(ageEl.value)||0;
    const weight = getWeightKg();
    const height = getHeightCm();
    const activity = parseFloat(activityEl.value)||1.2;

    let bmr = 10*weight + 6.25*height - 5*age;
    bmr += (sex==='male') ? 5 : -161;
    bmr = Math.max(bmr, 0);

    const tdee = bmr*activity;

    document.getElementById('calBMR').textContent = Math.round(bmr).toLocaleString()+' kcal';
    document.getElementById('calTDEE').textContent = Math.round(tdee).toLocaleString()+' kcal';
    document.getElementById('calLoss').textContent = Math.round(Math.max(tdee-500,0)).toLocaleString()+' kcal';
    document.getElementById('calGain').textContent = Math.round(tdee+500).toLocaleString()+' kcal';

    const macrosEl = document.getElementById('calMacros');
    if(macrosEl){
      const style = macroSplits[macroStyleEl ? macroStyleEl.value : 'balanced'] || macroSplits.balanced;
      const pG = Math.round(tdee*style.p/4);
      const cG = Math.round(tdee*style.c/4);
      const fG = Math.round(tdee*style.f/9);
      macrosEl.textContent = pG+'g / '+cG+'g / '+fG+'g';
    }
  }

  sexSeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    sex = btn.dataset.sex;
    sexSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  [ageEl, weightEl, weightUnitEl, unitEl, cmEl, ftEl, inEl, activityEl, macroStyleEl].forEach(el=>{
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Discount calculator ----
(function(){
  const tabs = document.getElementById('discTabs');
  if(!tabs) return;

  tabs.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    tabs.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
  });

  function cur(){ return document.getElementById('discCur').value; }

  function setWarning(id, msg){
    const el = document.getElementById(id);
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function calcSale(){
    const c = cur();
    const original = parseFloat(document.getElementById('discOriginal').value)||0;
    const pct = parseFloat(document.getElementById('discPct').value)||0;
    const taxEl = document.getElementById('discTax');
    const tax = taxEl ? (parseFloat(taxEl.value)||0) : 0;
    const saved = original*pct/100;
    const salePrice = original-saved;
    document.getElementById('discSaved').textContent = c+saved.toFixed(2);
    document.getElementById('discSalePrice').textContent = c+salePrice.toFixed(2);
    const withTaxEl = document.getElementById('discFinalWithTax');
    if(withTaxEl) withTaxEl.textContent = tax>0 ? c+(salePrice*(1+tax/100)).toFixed(2) : '—';

    if(pct > 100) setWarning('discSaleWarning', 'A discount over 100% means the customer is paid to take the item — double-check this figure.');
    else if(pct === 100) setWarning('discSaleWarning', 'A 100% discount means the item is free — the sale price is correctly $0.');
    else if(original < 0) setWarning('discSaleWarning', 'Original price is negative — enter a positive amount.');
    else setWarning('discSaleWarning', null);
  }
  function calcOriginal(){
    const c = cur();
    const sale = parseFloat(document.getElementById('discSale').value)||0;
    const pct = parseFloat(document.getElementById('discPct2').value)||0;
    const original = pct<100 ? sale/(1-pct/100) : 0;
    const saved = original-sale;
    document.getElementById('discOriginalOut').textContent = pct<100 ? c+original.toFixed(2) : '—';
    document.getElementById('discSavedOut').textContent = pct<100 ? c+Math.max(saved,0).toFixed(2) : '—';

    if(pct >= 100) setWarning('discOriginalWarning', 'A discount of 100% or more can\'t be reversed this way — there\'s no original price that produces a $0 (or negative) sale price through a percentage discount alone.');
    else if(sale < 0) setWarning('discOriginalWarning', 'Sale price is negative — enter a positive amount.');
    else setWarning('discOriginalWarning', null);
  }
  function calcStack(){
    const c = cur();
    const original = parseFloat(document.getElementById('discStackOriginal').value)||0;
    const p1 = parseFloat(document.getElementById('discStack1').value)||0;
    const p2 = parseFloat(document.getElementById('discStack2').value)||0;
    const mid = original*(1-p1/100);
    const final = mid*(1-p2/100);
    const combined = original>0 ? (1-final/original)*100 : 0;
    document.getElementById('discStackMid').textContent = c+mid.toFixed(2);
    document.getElementById('discStackFinal').textContent = c+final.toFixed(2);
    document.getElementById('discStackCombined').textContent = combined.toFixed(1)+'% off (not '+(p1+p2)+'%)';

    if(p1 > 100 || p2 > 100) setWarning('discStackWarning', 'A discount over 100% means the customer is paid to take the item — double-check these figures.');
    else if(original < 0) setWarning('discStackWarning', 'Original price is negative — enter a positive amount.');
    else setWarning('discStackWarning', null);
  }

  ['discOriginal','discPct','discCur','discTax'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', ()=>{calcSale(); calcOriginal();});
    el.addEventListener('change', ()=>{calcSale(); calcOriginal();});
  });
  ['discSale','discPct2'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', calcOriginal);
  });
  ['discStackOriginal','discStack1','discStack2'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calcStack);
  });
  calcSale();
  calcOriginal();
  calcStack();
})();

// ---- Break-even & profit margin calculator ----
(function(){
  const tabs = document.getElementById('beTabs');
  if(!tabs) return;

  tabs.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    tabs.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
  });

  function setWarning(id, msg){
    const el = document.getElementById(id);
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function calcBreakEven(){
    const fixed = parseFloat(document.getElementById('beFixed').value)||0;
    const price = parseFloat(document.getElementById('bePrice').value)||0;
    const varCost = parseFloat(document.getElementById('beVarCost').value)||0;
    const contribution = price - varCost;

    if(fixed < 0){
      setWarning('beWarning', 'Fixed costs can\'t be negative.');
    } else if(price <= varCost){
      setWarning('beWarning', 'Price per unit must be greater than variable cost per unit — otherwise every sale loses money and there\'s no break-even point.');
    } else {
      setWarning('beWarning', null);
    }

    const valid = fixed >= 0 && contribution > 0;
    const units = valid ? fixed/contribution : null;
    const revenue = valid ? units*price : null;
    const ratio = price>0 ? (contribution/price)*100 : 0;

    document.getElementById('beUnits').textContent = valid ? Math.ceil(units).toLocaleString() : '—';
    document.getElementById('beRevenue').textContent = valid ? revenue.toLocaleString(undefined,{maximumFractionDigits:2}) : '—';
    document.getElementById('beContribution').textContent = contribution.toLocaleString(undefined,{maximumFractionDigits:2});
    document.getElementById('beRatio').textContent = ratio.toFixed(1)+'%';
  }
  ['beFixed','bePrice','beVarCost'].forEach(id=>{
    document.getElementById(id).addEventListener('input', calcBreakEven);
  });
  calcBreakEven();

  function calcMargin(){
    const cost = parseFloat(document.getElementById('mgCost').value)||0;
    const sell = parseFloat(document.getElementById('mgSell').value)||0;
    const profit = sell - cost;

    if(cost <= 0){
      setWarning('mgWarning', 'Cost price must be greater than zero.');
    } else if(sell < 0){
      setWarning('mgWarning', 'Selling price can\'t be negative.');
    } else {
      setWarning('mgWarning', null);
    }

    const margin = sell>0 ? (profit/sell)*100 : 0;
    const markup = cost>0 ? (profit/cost)*100 : 0;

    document.getElementById('mgProfit').textContent = profit.toLocaleString(undefined,{maximumFractionDigits:2});
    document.getElementById('mgMargin').textContent = (cost>0 && sell>0) ? margin.toFixed(1)+'%' : '—';
    document.getElementById('mgMarkup').textContent = cost>0 ? markup.toFixed(1)+'%' : '—';
  }
  ['mgCost','mgSell'].forEach(id=>{
    document.getElementById(id).addEventListener('input', calcMargin);
  });
  calcMargin();
})();

// ---- GPA calculator ----
(function(){
  const rowsWrap = document.getElementById('gpaRows');
  if(!rowsWrap) return;
  const addBtn = document.getElementById('gpaAddRow');
  const scaleEl = document.getElementById('gpaScale');
  const weightedEl = document.getElementById('gpaWeighted');

  const gradePoints = {
    4:  [['A',4.0],['A-',3.7],['B+',3.3],['B',3.0],['B-',2.7],['C+',2.3],['C',2.0],['C-',1.7],['D',1.0],['F',0.0]],
    5:  [['A',5.0],['A-',4.7],['B+',4.3],['B',4.0],['B-',3.7],['C+',3.3],['C',3.0],['C-',2.7],['D',2.0],['F',0.0]],
    10: [['O/A+',10],['A',9],['B+',8],['B',7],['C+',6],['C',5],['D',4],['F',0]]
  };

  let rowId = 0;
  function addRow(credits){
    rowId++;
    const id = 'gpaRow'+rowId;
    const scale = scaleEl.value;
    const opts = gradePoints[scale].map(([label])=>`<option value="${label}">${label}</option>`).join('');
    const row = document.createElement('div');
    row.className = 'row3';
    row.id = id;
    row.style.marginBottom = '10px';
    row.innerHTML = `
      <div class="field"><label>Course</label><input type="text" class="gpaCourseName" placeholder="e.g. Calculus I"></div>
      <div class="field"><label>Grade</label><select class="gpaGrade">${opts}</select></div>
      <div class="field"><label>Credit hours</label><input type="number" class="gpaCredits" value="${credits||3}" min="0" step="0.5"></div>
    `;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'ghost';
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginBottom = '14px';
    removeBtn.addEventListener('click', ()=>{ row.remove(); calc(); });
    row.querySelector('.gpaCredits').closest('.field').after(removeBtn);
    rowsWrap.appendChild(row);
    row.querySelectorAll('input,select').forEach(el=>{
      el.addEventListener('input', calc);
      el.addEventListener('change', calc);
    });
    updateWeightedUI();
  }

  function updateWeightedUI(){
    const weighted = weightedEl.checked;
    document.querySelectorAll('.gpaCredits').forEach(el=>{
      el.closest('.field').style.display = weighted ? '' : 'none';
    });
    const creditsLabel = document.getElementById('gpaCreditsLabel');
    if(creditsLabel) creditsLabel.textContent = weighted ? 'Total credit hours' : 'Number of courses';
    const remLabel = document.getElementById('tgRemainingLabel');
    if(remLabel) remLabel.textContent = weighted ? 'Credit hours remaining (courses not yet in the list above)' : 'Courses remaining (not yet in the list above)';
  }

  function rebuildGradeOptions(){
    const scale = scaleEl.value;
    const opts = gradePoints[scale].map(([label])=>`<option value="${label}">${label}</option>`).join('');
    document.querySelectorAll('.gpaGrade').forEach(sel=>{ sel.innerHTML = opts; });
    calc();
  }

  let lastCredits = 0, lastPoints = 0, lastScale = '4';
  function calc(){
    const scale = scaleEl.value;
    const weighted = weightedEl.checked;
    const map = Object.fromEntries(gradePoints[scale]);
    let totalCredits = 0, totalPoints = 0;
    document.querySelectorAll('#gpaRows .row3').forEach(row=>{
      const grade = row.querySelector('.gpaGrade').value;
      const credits = weighted ? (parseFloat(row.querySelector('.gpaCredits').value)||0) : 1;
      const points = map[grade] !== undefined ? map[grade] : 0;
      totalCredits += credits;
      totalPoints += credits*points;
    });
    const gpa = totalCredits>0 ? totalPoints/totalCredits : 0;
    document.getElementById('gpaCredits').textContent = totalCredits.toString();
    document.getElementById('gpaResult').textContent = gpa.toFixed(2);
    lastCredits = totalCredits; lastPoints = totalPoints; lastScale = scale;
    calcTarget(totalCredits, totalPoints, scale);
  }

  function calcTarget(totalCredits, totalPoints, scale){
    const targetEl = document.getElementById('tgTarget');
    if(!targetEl) return;
    const remEl = document.getElementById('tgRemaining');
    const neededEl = document.getElementById('tgNeeded');
    const feasibleEl = document.getElementById('tgFeasible');
    const target = parseFloat(targetEl.value)||0;
    const remaining = parseFloat(remEl.value)||0;

    if(remaining<=0){
      neededEl.textContent = '—';
      feasibleEl.textContent = weightedEl.checked ? 'Enter remaining credit hours to plan ahead' : 'Enter remaining courses to plan ahead';
      return;
    }
    const neededPoints = target*(totalCredits+remaining) - totalPoints;
    const neededAvg = neededPoints/remaining;
    neededEl.textContent = neededAvg.toFixed(2);

    const maxPoint = Math.max(...gradePoints[scale].map(([,p])=>p));
    if(neededAvg > maxPoint){
      feasibleEl.textContent = 'Not achievable on this scale — would need above '+maxPoint.toFixed(1)+', the maximum possible';
    } else if(neededAvg <= 0){
      feasibleEl.textContent = 'Already locked in — your target is met even with the lowest possible grades remaining';
    } else {
      feasibleEl.textContent = 'Achievable';
    }
  }

  addBtn.addEventListener('click', ()=>addRow());
  scaleEl.addEventListener('change', rebuildGradeOptions);
  weightedEl.addEventListener('change', ()=>{ updateWeightedUI(); calc(); });
  ['tgTarget','tgRemaining'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', calc);
  });

  addRow(3);
  addRow(4);
  calc();

  // ---- Semester history (localStorage) ----
  const HISTORY_KEY = 'tb_gpa_history';
  const historySection = document.getElementById('gpaHistory');
  const historyBody = document.getElementById('gpaHistoryBody');
  const saveBtn = document.getElementById('gpaSaveSemester');
  const clearBtn = document.getElementById('gpaClearHistory');
  const labelEl = document.getElementById('gpaSemesterLabel');

  function loadHistory(){
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch(e) { return []; }
  }
  function saveHistory(list){
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  }
  function renderHistory(){
    const list = loadHistory();
    if(!historySection) return;
    historySection.hidden = list.length===0;
    if(!historyBody) return;
    historyBody.innerHTML = list.map((s,i)=>
      `<tr><td>${s.label}</td><td>${s.credits}</td><td>${s.credits>0 ? (s.points/s.credits).toFixed(2) : '0.00'}</td><td><button type="button" class="ghost" data-idx="${i}" style="font-size:10px;padding:4px 8px;">Remove</button></td></tr>`
    ).join('');
    let cumCredits=0, cumPoints=0;
    list.forEach(s=>{ cumCredits+=s.credits; cumPoints+=s.points; });
    const cumEl = document.getElementById('gpaCumulative');
    if(cumEl) cumEl.textContent = cumCredits>0 ? (cumPoints/cumCredits).toFixed(2) : '—';
  }
  if(saveBtn){
    saveBtn.addEventListener('click', ()=>{
      if(lastCredits<=0) return;
      const list = loadHistory();
      const label = (labelEl && labelEl.value.trim()) || ('Semester '+(list.length+1));
      list.push({label, credits: lastCredits, points: lastPoints, scale: lastScale});
      saveHistory(list);
      if(labelEl) labelEl.value = '';
      renderHistory();
    });
  }
  if(historyBody){
    historyBody.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-idx]');
      if(!btn) return;
      const list = loadHistory();
      list.splice(parseInt(btn.dataset.idx,10), 1);
      saveHistory(list);
      renderHistory();
    });
  }
  if(clearBtn){
    clearBtn.addEventListener('click', ()=>{
      saveHistory([]);
      renderHistory();
    });
  }
  renderHistory();
})();

// ---- Dedicated SIP Calculator ----
(function(){
  const anchorEl = document.getElementById('dsipAmt');
  if(!anchorEl) return;
  const curSel = document.getElementById('dsipCur');
  function money(n){
    const cur = curSel ? curSel.value : '₹';
    return cur+Math.round(n).toLocaleString();
  }
  function setWarning(id, msg){
    const w = document.getElementById(id);
    if(!w) return;
    if(msg){ w.textContent = msg; w.classList.add('show'); } else { w.textContent=''; w.classList.remove('show'); }
  }
  function calc(){
    const P = parseFloat(document.getElementById('dsipAmt').value)||0;
    const annual = parseFloat(document.getElementById('dsipRate').value)||0;
    const years = parseFloat(document.getElementById('dsipYears').value)||0;
    const stepUp = parseFloat(document.getElementById('dsipStepUp').value)||0;
    const infl = parseFloat(document.getElementById('dsipInflation').value)||0;
    const n = Math.round(years*12);
    const r = annual/100/12;

    if(P<0) setWarning('dsipWarning', "Monthly investment can't be negative.");
    else if(years<=0) setWarning('dsipWarning', 'Duration must be greater than zero years.');
    else if(annual<=-100) setWarning('dsipWarning', 'An annual return of -100% or lower means the investment loses everything — enter a realistic expected return.');
    else setWarning('dsipWarning', null);

    let invested=0, balance=0, finalMonthAmt=P;
    const yearRows=[];
    for(let m=1;m<=n;m++){
      const yearIndex = Math.floor((m-1)/12);
      const monthlyAmt = P*Math.pow(1+stepUp/100, yearIndex);
      balance = balance*(1+r) + monthlyAmt;
      invested += monthlyAmt;
      finalMonthAmt = monthlyAmt;
      if(m%12===0 || m===n) yearRows.push({year:Math.ceil(m/12), invested, value:balance});
    }
    const maturity = balance;

    document.getElementById('dsipInvested').textContent = money(invested);
    document.getElementById('dsipReturns').textContent = money(Math.max(maturity-invested,0));
    document.getElementById('dsipMaturity').textContent = money(maturity);
    const finalAmtEl = document.getElementById('dsipFinalMonthAmt');
    if(finalAmtEl) finalAmtEl.textContent = stepUp>0 ? money(finalMonthAmt)+'/mo by the final year' : '—';
    const realEl = document.getElementById('dsipRealValue');
    if(realEl) realEl.textContent = years>0 ? money(maturity/Math.pow(1+infl/100, years)) : '—';

    const body = document.getElementById('dsipGrowthBody');
    if(body) body.innerHTML = yearRows.map(r=>`<tr><td>${r.year}</td><td>${money(r.invested)}</td><td>${money(r.value)}</td><td>${money(r.value-r.invested)}</td></tr>`).join('');
  }
  ['dsipAmt','dsipRate','dsipYears','dsipStepUp','dsipInflation','dsipCur'].forEach(id=>{
    const e = document.getElementById(id);
    if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); }
  });
  calc();
})();

// ---- Dedicated Compound Interest Calculator ----
(function(){
  const anchorEl = document.getElementById('dcmpPrincipal');
  if(!anchorEl) return;
  const curSel = document.getElementById('dcmpCur');
  function money(n){
    const cur = curSel ? curSel.value : '$';
    return cur+Math.round(n).toLocaleString();
  }
  function setWarning(id, msg){
    const w = document.getElementById(id);
    if(!w) return;
    if(msg){ w.textContent = msg; w.classList.add('show'); } else { w.textContent=''; w.classList.remove('show'); }
  }
  function calc(){
    const P = parseFloat(document.getElementById('dcmpPrincipal').value)||0;
    const annual = parseFloat(document.getElementById('dcmpRate').value)||0;
    const years = parseFloat(document.getElementById('dcmpYears').value)||0;
    const n = parseFloat(document.getElementById('dcmpFreq').value)||1;
    const monthlyContribution = parseFloat(document.getElementById('dcmpMonthly').value)||0;

    if(P<0) setWarning('dcmpWarning', "Principal can't be negative.");
    else if(years<=0) setWarning('dcmpWarning', 'Duration must be greater than zero years.');
    else if(annual<=-100*n) setWarning('dcmpWarning', 'That interest rate implies losing more than the full principal each compounding period — enter a realistic rate.');
    else setWarning('dcmpWarning', null);

    const months = Math.round(years*12);
    const rMonthly = Math.pow(1+(annual/100)/n, n/12) - 1;
    let balance = P, invested = P;
    const yearRows = [];
    for(let m=1;m<=months;m++){
      balance = balance*(1+rMonthly) + monthlyContribution;
      invested += monthlyContribution;
      if(m%12===0 || m===months) yearRows.push({year:Math.ceil(m/12), invested, value:balance});
    }
    const maturity = balance;

    document.getElementById('dcmpPrincipalOut').textContent = money(invested);
    document.getElementById('dcmpInterest').textContent = money(Math.max(maturity-invested,0));
    document.getElementById('dcmpMaturity').textContent = money(maturity);

    const body = document.getElementById('dcmpGrowthBody');
    if(body) body.innerHTML = yearRows.map(r=>`<tr><td>${r.year}</td><td>${money(r.invested)}</td><td>${money(r.value)}</td><td>${money(r.value-r.invested)}</td></tr>`).join('');
  }
  ['dcmpPrincipal','dcmpRate','dcmpYears','dcmpFreq','dcmpMonthly','dcmpCur'].forEach(id=>{
    const e = document.getElementById(id);
    if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); }
  });
  calc();
})();

// ---- Macro Calculator ----
(function(){
  const ageEl = document.getElementById('macroAge');
  if(!ageEl) return;
  const unitEl = document.getElementById('macroUnit');
  const weightEl = document.getElementById('macroWeight');
  const weightUnitEl = document.getElementById('macroWeightUnit');
  const cmEl = document.getElementById('macroHeightCm');
  const ftEl = document.getElementById('macroHeightFt');
  const inEl = document.getElementById('macroHeightIn');
  const cmWrap = document.getElementById('macroCmWrap');
  const ftWrap = document.getElementById('macroFtWrap');
  const activityEl = document.getElementById('macroActivity');
  const sexSeg = document.getElementById('macroSexSeg');
  const goalSeg = document.getElementById('macroGoalSeg');
  const styleEl = document.getElementById('macroStyle');
  let sex = 'male', goal = 'maintain';

  const goalAdjust = { lose:-500, maintain:0, gain:500 };
  const splits = {
    balanced:    {p:0.30, c:0.40, f:0.30},
    highprotein: {p:0.40, c:0.30, f:0.30},
    lowcarb:     {p:0.35, c:0.20, f:0.45},
    keto:        {p:0.25, c:0.05, f:0.70}
  };

  function getHeightCm(){
    if(unitEl.value==='ft'){
      const ft = parseFloat(ftEl.value)||0;
      const inch = parseFloat(inEl.value)||0;
      return (ft*12+inch)*2.54;
    }
    return parseFloat(cmEl.value)||0;
  }
  function getWeightKg(){
    const w = parseFloat(weightEl.value)||0;
    return (weightUnitEl && weightUnitEl.value==='lb') ? w/2.20462 : w;
  }

  function calc(){
    const isFt = unitEl.value==='ft';
    cmWrap.style.display = isFt ? 'none' : 'flex';
    ftWrap.style.display = isFt ? 'grid' : 'none';

    const age = parseFloat(ageEl.value)||0;
    const weight = getWeightKg();
    const height = getHeightCm();
    const activity = parseFloat(activityEl.value)||1.2;

    let bmr = 10*weight + 6.25*height - 5*age;
    bmr += (sex==='male') ? 5 : -161;
    bmr = Math.max(bmr,0);
    const tdee = bmr*activity;
    const target = Math.max(tdee + goalAdjust[goal], 0);

    document.getElementById('macroTDEE').textContent = Math.round(tdee).toLocaleString()+' kcal';
    document.getElementById('macroTarget').textContent = Math.round(target).toLocaleString()+' kcal';

    const style = splits[styleEl.value] || splits.balanced;
    document.getElementById('macroProtein').textContent = Math.round(target*style.p/4)+' g';
    document.getElementById('macroCarbs').textContent = Math.round(target*style.c/4)+' g';
    document.getElementById('macroFat').textContent = Math.round(target*style.f/9)+' g';
  }

  sexSeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    sex = btn.dataset.sex;
    sexSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  goalSeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    goal = btn.dataset.goal;
    goalSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  [ageEl, weightEl, weightUnitEl, unitEl, cmEl, ftEl, inEl, activityEl, styleEl].forEach(e=>{
    if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); }
  });
  calc();
})();

// ---- Pregnancy Due Date Calculator ----
(function(){
  const methodEl = document.getElementById('pregMethod');
  if(!methodEl) return;
  const dateEl = document.getElementById('pregDate');
  const cycleEl = document.getElementById('pregCycle');
  const cycleWrap = document.getElementById('pregCycleWrap');

  function addDays(date, days){ const d = new Date(date); d.setDate(d.getDate()+days); return d; }
  function fmt(d){ return d.toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'}); }

  function calc(){
    const method = methodEl.value;
    cycleWrap.style.display = method==='lmp' ? 'flex' : 'none';
    const raw = dateEl.value;
    if(!raw) return;
    const inputDate = new Date(raw+'T00:00:00');
    if(isNaN(inputDate)) return;
    const cycleLen = parseFloat(cycleEl.value)||28;

    let lmpDate;
    if(method==='lmp') lmpDate = inputDate;
    else if(method==='conception') lmpDate = addDays(inputDate, -14);
    else lmpDate = addDays(inputDate, -19); // 5-day (blastocyst) IVF transfer

    const cycleAdjust = method==='lmp' ? (cycleLen-28) : 0;
    const dueDate = addDays(lmpDate, 280 + cycleAdjust);

    const today = new Date(); today.setHours(0,0,0,0);
    const gestationDays = Math.round((today - lmpDate)/86400000);
    const daysToDue = Math.round((dueDate - today)/86400000);
    const weeksPregnant = Math.floor(Math.max(gestationDays,0)/7);
    const daysExtra = Math.max(gestationDays,0)%7;
    let trimester = 1;
    if(weeksPregnant>=27) trimester = 3; else if(weeksPregnant>=13) trimester = 2;

    document.getElementById('pregDueDate').textContent = fmt(dueDate);
    document.getElementById('pregWeeks').textContent = gestationDays>=0 ? (weeksPregnant+'w '+daysExtra+'d') : 'Not yet started';
    document.getElementById('pregTrimester').textContent = gestationDays>=0 ? ('Trimester '+trimester) : '—';
    document.getElementById('pregDaysLeft').textContent = daysToDue>=0 ? (daysToDue+' days') : 'Due date has passed';

    const milestones = document.getElementById('pregMilestones');
    if(milestones){
      const rows = [
        {label:'End of 1st trimester (week 13)', date: addDays(lmpDate, 13*7)},
        {label:'Viability milestone (week 24)', date: addDays(lmpDate, 24*7)},
        {label:'Full term begins (week 37)', date: addDays(lmpDate, 37*7)},
        {label:'Estimated due date (week 40)', date: dueDate}
      ];
      milestones.innerHTML = rows.map(r=>`<tr><td>${r.label}</td><td>${fmt(r.date)}</td></tr>`).join('');
    }
  }
  [methodEl, dateEl, cycleEl].forEach(e=>{ if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); } });
  calc();
})();

// ---- Ovulation Calculator ----
(function(){
  const lmpEl = document.getElementById('ovuLmp');
  if(!lmpEl) return;
  const cycleEl = document.getElementById('ovuCycle');
  const lutealEl = document.getElementById('ovuLuteal');

  function addDays(date, days){ const d = new Date(date); d.setDate(d.getDate()+days); return d; }
  function fmt(d){ return d.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}); }

  function calc(){
    const raw = lmpEl.value;
    if(!raw) return;
    const lmp = new Date(raw+'T00:00:00');
    if(isNaN(lmp)) return;
    const cycleLen = parseFloat(cycleEl.value)||28;
    const luteal = parseFloat(lutealEl.value)||14;

    const ovulationDay = addDays(lmp, cycleLen-luteal);
    const fertileStart = addDays(ovulationDay, -5);
    const fertileEnd = addDays(ovulationDay, 1);
    const nextPeriod = addDays(lmp, cycleLen);

    document.getElementById('ovuDate').textContent = fmt(ovulationDay);
    document.getElementById('ovuFertile').textContent = fmt(fertileStart)+' – '+fmt(fertileEnd);
    document.getElementById('ovuNextPeriod').textContent = fmt(nextPeriod);

    const body = document.getElementById('ovuCycleBody');
    if(body){
      const rows = [];
      for(let i=0;i<6;i++){
        const cycleStart = addDays(lmp, cycleLen*i);
        const ov = addDays(cycleStart, cycleLen-luteal);
        rows.push({n:i+1, period:cycleStart, ovulation:ov, fertileStart:addDays(ov,-5), fertileEnd:addDays(ov,1)});
      }
      body.innerHTML = rows.map(r=>`<tr><td>Cycle ${r.n}</td><td>${fmt(r.period)}</td><td>${fmt(r.fertileStart)} – ${fmt(r.fertileEnd)}</td><td>${fmt(r.ovulation)}</td></tr>`).join('');
    }
  }
  [lmpEl, cycleEl, lutealEl].forEach(e=>{ if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); } });
  calc();
})();

// ---- Refinance Calculator ----
(function(){
  const balanceEl = document.getElementById('refBalance');
  if(!balanceEl) return;
  const curSel = document.getElementById('refCur');
  function money(n){
    const cur = curSel ? curSel.value : '$';
    return cur+Math.round(n).toLocaleString();
  }
  function setWarning(id, msg){
    const w = document.getElementById(id);
    if(!w) return;
    if(msg){ w.textContent = msg; w.classList.add('show'); } else { w.textContent=''; w.classList.remove('show'); }
  }
  function calc(){
    const balance = parseFloat(balanceEl.value)||0;
    const curRate = parseFloat(document.getElementById('refCurRate').value)||0;
    const remainingYears = parseFloat(document.getElementById('refRemainingYears').value)||0;
    const newRate = parseFloat(document.getElementById('refNewRate').value)||0;
    const newTermYears = parseFloat(document.getElementById('refNewTerm').value)||0;
    const closingCosts = parseFloat(document.getElementById('refClosing').value)||0;

    if(balance<=0 || remainingYears<=0 || newTermYears<=0){
      setWarning('refWarning', 'Enter a positive loan balance and term to see a comparison.');
      return;
    }
    setWarning('refWarning', null);

    const curMonths = Math.round(remainingYears*12);
    const newMonths = Math.round(newTermYears*12);
    const current = buildAmortization(balance, curRate, curMonths, 0);
    const refi = buildAmortization(balance, newRate, newMonths, 0);

    const monthlySavings = current.pay - refi.pay;
    const breakEvenMonths = monthlySavings>0 ? Math.ceil(closingCosts/monthlySavings) : Infinity;

    document.getElementById('refCurrentPay').textContent = money(current.pay);
    document.getElementById('refNewPay').textContent = money(refi.pay);
    document.getElementById('refMonthlySavings').textContent = (monthlySavings>=0?'':'-')+money(Math.abs(monthlySavings));
    document.getElementById('refCurrentInterest').textContent = money(current.totalInterest);
    document.getElementById('refNewInterest').textContent = money(refi.totalInterest);
    document.getElementById('refInterestDiff').textContent = money(Math.abs(current.totalInterest-refi.totalInterest)) + (refi.totalInterest<current.totalInterest ? ' saved' : ' more');
    document.getElementById('refBreakEven').textContent = isFinite(breakEvenMonths) ? (breakEvenMonths+' months') : "Never — payment doesn't decrease at this rate";

    const verdict = document.getElementById('refVerdict');
    if(verdict){
      if(monthlySavings<=0) verdict.textContent = "This refinance raises your monthly payment — only worth it if you specifically want a shorter term.";
      else if(breakEvenMonths <= newMonths*0.5) verdict.textContent = 'Likely worth it — you recover the closing costs well within the new loan\'s term.';
      else verdict.textContent = "Marginal — you'd need to stay in the loan a long time to recover the closing costs.";
    }
  }
  ['refBalance','refCurRate','refRemainingYears','refNewRate','refNewTerm','refClosing','refCur'].forEach(id=>{
    const e = document.getElementById(id);
    if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); }
  });
  calc();
})();

// ---- Paycheck / Take-Home Pay Calculator ----
(function(){
  const countryEl = document.getElementById('payCountry');
  if(!countryEl) return;
  function money(sym, n){ return sym+Math.round(Math.max(n,0)).toLocaleString(); }

  function calc(){
    const country = countryEl.value;
    const filingWrap = document.getElementById('payFilingWrap');
    const regimeWrap = document.getElementById('payRegimeWrap');
    filingWrap.style.display = country==='us' ? '' : 'none';
    regimeWrap.style.display = country==='in' ? '' : 'none';

    const filingStatus = document.getElementById('payFiling').value;
    const regime = document.getElementById('payRegime').value;
    const annualGross = parseFloat(document.getElementById('payGross').value)||0;
    const frequency = document.getElementById('payFrequency').value;

    const scheme = getStandardTaxScheme(country, filingStatus, regime);
    const result = computeTaxFromScheme(scheme, annualGross);
    const payrollTax = getPayrollTax(country, annualGross);
    const netAnnual = Math.max(annualGross - result.tax - payrollTax, 0);

    const periodsPerYear = {weekly:52, biweekly:26, semimonthly:24, monthly:12}[frequency] || 12;

    document.getElementById('payGrossPeriod').textContent = money(scheme.symbol, annualGross/periodsPerYear);
    document.getElementById('payTaxPeriod').textContent = money(scheme.symbol, result.tax/periodsPerYear);
    document.getElementById('payPayrollPeriod').textContent = money(scheme.symbol, payrollTax/periodsPerYear);
    document.getElementById('payNetPeriod').textContent = money(scheme.symbol, netAnnual/periodsPerYear);

    document.getElementById('payGrossAnnual').textContent = money(scheme.symbol, annualGross);
    document.getElementById('payTaxAnnual').textContent = money(scheme.symbol, result.tax);
    document.getElementById('payPayrollAnnual').textContent = money(scheme.symbol, payrollTax);
    document.getElementById('payNetAnnual').textContent = money(scheme.symbol, netAnnual);
    document.getElementById('payEffRate').textContent = (annualGross>0 ? (((result.tax+payrollTax)/annualGross)*100).toFixed(1) : '0') + '%';

    const payrollLabel = document.getElementById('payPayrollLabel');
    if(payrollLabel) payrollLabel.textContent = payrollTaxLabels[country] || 'Payroll tax (not modeled for this country)';
  }
  ['payCountry','payFiling','payRegime','payGross','payFrequency'].forEach(id=>{
    const e = document.getElementById(id);
    if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); }
  });
  calc();
})();

// ---- Debt Payoff Calculator (snowball vs avalanche) ----
(function(){
  const rowsWrap = document.getElementById('debtRows');
  if(!rowsWrap) return;
  const addBtn = document.getElementById('debtAddRow');
  const strategySeg = document.getElementById('debtStrategySeg');
  const extraEl = document.getElementById('debtExtra');
  const curSel = document.getElementById('debtCur');
  let strategy = 'avalanche';
  let rowId = 0;

  function money(n){
    const cur = curSel ? curSel.value : '$';
    return cur+Math.round(n).toLocaleString();
  }

  function addRow(name, balance, apr, minPay){
    rowId++;
    const row = document.createElement('div');
    row.className = 'row3';
    row.id = 'debtRow'+rowId;
    row.style.marginBottom = '10px';
    row.innerHTML = `
      <div class="field"><label>Debt name</label><input type="text" class="debtName" placeholder="e.g. Credit card" value="${name||''}"></div>
      <div class="field"><label>Balance</label><input type="number" class="debtBalance" value="${balance||1000}" min="0" step="10"></div>
      <div class="field"><label>APR (%)</label><input type="number" class="debtApr" value="${apr||18}" min="0" step="0.1"></div>
      <div class="field"><label>Min. payment</label><input type="number" class="debtMinPay" value="${minPay||25}" min="0" step="5"></div>
    `;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'ghost';
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginBottom = '14px';
    removeBtn.addEventListener('click', ()=>{ row.remove(); calc(); });
    row.appendChild(removeBtn);
    rowsWrap.appendChild(row);
    row.querySelectorAll('input').forEach(inp=>inp.addEventListener('input', calc));
  }

  function simulate(debts, extra, strat){
    const list = debts.map(d=>({...d, paidOff:null}));
    if(strat==='avalanche') list.sort((a,b)=>b.apr-a.apr);
    else list.sort((a,b)=>a.balance-b.balance);

    let month = 0, totalInterest = 0;
    const maxMonths = 1200;
    let remaining = list.filter(d=>d.balance>0);
    while(remaining.length>0 && month<maxMonths){
      month++;
      let freedUp = extra;
      for(const d of list){
        if(d.balance<=0) continue;
        const interest = d.balance*(d.apr/100/12);
        totalInterest += interest;
        d.balance += interest;
        const pay = Math.min(d.minPay, d.balance);
        d.balance -= pay;
      }
      for(const d of list){
        if(d.balance<=0 || freedUp<=0) continue;
        const pay = Math.min(freedUp, d.balance);
        d.balance -= pay;
        freedUp -= pay;
      }
      for(const d of list){
        if(d.balance<=0.01 && d.paidOff===null) d.paidOff = month;
      }
      remaining = list.filter(d=>d.balance>0.01);
    }
    return { months: month, totalInterest, order: list.slice().sort((a,b)=>(a.paidOff||Infinity)-(b.paidOff||Infinity)) };
  }

  function calc(){
    const debts = [];
    rowsWrap.querySelectorAll('.row3').forEach(row=>{
      const name = row.querySelector('.debtName').value || 'Debt';
      const balance = parseFloat(row.querySelector('.debtBalance').value)||0;
      const apr = parseFloat(row.querySelector('.debtApr').value)||0;
      const minPay = parseFloat(row.querySelector('.debtMinPay').value)||0;
      if(balance>0) debts.push({name, balance, apr, minPay});
    });
    const extra = parseFloat(extraEl.value)||0;

    if(debts.length===0){
      document.getElementById('debtMonths').textContent = '—';
      document.getElementById('debtInterest').textContent = '—';
      document.getElementById('debtOrderBody').innerHTML = '';
      return;
    }

    const result = simulate(debts, extra, strategy);
    document.getElementById('debtMonths').textContent = result.months+' months';
    document.getElementById('debtInterest').textContent = money(result.totalInterest);
    document.getElementById('debtPayoffDate').textContent = (function(){
      const d = new Date(); d.setMonth(d.getMonth()+result.months);
      return d.toLocaleDateString(undefined,{year:'numeric',month:'long'});
    })();

    const otherStrat = strategy==='avalanche' ? 'snowball' : 'avalanche';
    const otherResult = simulate(debts, extra, otherStrat);
    const diff = otherResult.totalInterest - result.totalInterest;
    const compareEl = document.getElementById('debtCompare');
    if(compareEl){
      compareEl.textContent = diff > 0.5
        ? (strategy==='avalanche' ? 'Avalanche' : 'Snowball')+' saves you '+money(diff)+' in interest vs. '+otherStrat+' on these numbers.'
        : 'Both strategies cost about the same in interest for these numbers — pick whichever keeps you motivated.';
    }

    const body = document.getElementById('debtOrderBody');
    if(body) body.innerHTML = result.order.map((d,i)=>`<tr><td>${i+1}. ${d.name}</td><td>${d.paidOff?('Month '+d.paidOff):('Not paid off within '+result.months+' months')}</td></tr>`).join('');
  }

  addBtn.addEventListener('click', ()=>addRow());
  strategySeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    strategy = btn.dataset.strategy;
    strategySeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  extraEl.addEventListener('input', calc);
  if(curSel) curSel.addEventListener('change', calc);

  addRow('Credit card', 4000, 22, 100);
  addRow('Car loan', 12000, 7, 250);
  calc();
})();

// ---- Net Worth Calculator ----
(function(){
  const assetsWrap = document.getElementById('nwAssets');
  if(!assetsWrap) return;
  const liabWrap = document.getElementById('nwLiabilities');
  const curSel = document.getElementById('nwCur');
  function money(n){
    const cur = curSel ? curSel.value : '$';
    return (n<0?'-':'')+cur+Math.round(Math.abs(n)).toLocaleString();
  }
  function addRow(wrap, name, amount){
    const row = document.createElement('div');
    row.className = 'row2';
    row.style.marginBottom = '10px';
    row.innerHTML = `
      <div class="field"><label>Item</label><input type="text" class="nwName" placeholder="e.g. Savings account" value="${name||''}"></div>
      <div class="field"><label>Value</label><input type="number" class="nwAmount" value="${amount||0}" step="100"></div>
    `;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'ghost';
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginBottom = '14px';
    removeBtn.addEventListener('click', ()=>{ row.remove(); calc(); });
    row.appendChild(removeBtn);
    wrap.appendChild(row);
    row.querySelectorAll('input').forEach(inp=>inp.addEventListener('input', calc));
  }
  function sumWrap(wrap){
    let total = 0;
    wrap.querySelectorAll('.row2').forEach(row=>{
      total += parseFloat(row.querySelector('.nwAmount').value)||0;
    });
    return total;
  }
  function calc(){
    const assets = sumWrap(assetsWrap);
    const liabilities = sumWrap(liabWrap);
    document.getElementById('nwTotalAssets').textContent = money(assets);
    document.getElementById('nwTotalLiabilities').textContent = money(liabilities);
    document.getElementById('nwNetWorth').textContent = money(assets-liabilities);
  }
  document.getElementById('nwAddAsset').addEventListener('click', ()=>addRow(assetsWrap));
  document.getElementById('nwAddLiability').addEventListener('click', ()=>addRow(liabWrap));
  if(curSel) curSel.addEventListener('change', calc);

  addRow(assetsWrap, 'Cash & savings', 10000);
  addRow(assetsWrap, 'Investments', 20000);
  addRow(liabWrap, 'Credit card debt', 2000);
  addRow(liabWrap, 'Student loan', 15000);
  calc();
})();

// ---- Savings Goal Calculator ----
(function(){
  const tabs = document.getElementById('sgTabs');
  if(!tabs) return;
  tabs.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    tabs.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#savingsgoal .tab-panel').forEach(p=>p.classList.remove('active'));
    document.getElementById('panel-sg-'+btn.dataset.tab).classList.add('active');
  });
  const curSel = document.getElementById('sgCur');
  function money(n){
    const cur = curSel ? curSel.value : '$';
    return cur+Math.round(n).toLocaleString();
  }

  function calcTime(){
    const goal = parseFloat(document.getElementById('sgtGoal').value)||0;
    const current = parseFloat(document.getElementById('sgtCurrent').value)||0;
    const monthly = parseFloat(document.getElementById('sgtMonthly').value)||0;
    const annual = parseFloat(document.getElementById('sgtRate').value)||0;
    const r = annual/100/12;
    let balance = current, months = 0;
    const maxMonths = 1200;
    const warnEl = document.getElementById('sgtWarning');
    const resultEl = document.getElementById('sgtResult');
    if(balance>=goal){
      resultEl.textContent = 'Goal already met';
      if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }
      return;
    }
    while(balance<goal && months<maxMonths){
      balance = balance*(1+r) + monthly;
      months++;
    }
    if(balance<goal){
      resultEl.textContent = 'Not reachable';
      if(warnEl){ warnEl.textContent = 'At this contribution and rate, the goal is never reached within 100 years — increase your monthly contribution or return rate.'; warnEl.classList.add('show'); }
    } else {
      const yrs = Math.floor(months/12), rem = months%12;
      resultEl.textContent = (yrs>0 ? yrs+'y ' : '')+rem+'mo';
      if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }
    }
  }
  function calcMonthly(){
    const goal = parseFloat(document.getElementById('sgmGoal').value)||0;
    const current = parseFloat(document.getElementById('sgmCurrent').value)||0;
    const years = parseFloat(document.getElementById('sgmYears').value)||0;
    const annual = parseFloat(document.getElementById('sgmRate').value)||0;
    const n = Math.round(years*12);
    const r = annual/100/12;
    const warnEl = document.getElementById('sgmWarning');
    if(years<=0){
      if(warnEl){ warnEl.textContent = 'Enter a timeframe greater than zero.'; warnEl.classList.add('show'); }
      document.getElementById('sgmResult').textContent = '—';
      return;
    }
    if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }
    const futureCurrent = current*Math.pow(1+r, n);
    const remaining = goal-futureCurrent;
    let monthly;
    if(remaining<=0) monthly = 0;
    else if(r===0) monthly = remaining/n;
    else monthly = remaining / (((Math.pow(1+r,n)-1)/r)*(1+r));
    document.getElementById('sgmResult').textContent = money(Math.max(monthly,0));
  }
  ['sgtGoal','sgtCurrent','sgtMonthly','sgtRate'].forEach(id=>{
    const e = document.getElementById(id);
    if(e) e.addEventListener('input', calcTime);
  });
  ['sgmGoal','sgmCurrent','sgmYears','sgmRate'].forEach(id=>{
    const e = document.getElementById(id);
    if(e) e.addEventListener('input', calcMonthly);
  });
  if(curSel) curSel.addEventListener('change', ()=>{ calcTime(); calcMonthly(); });
  calcTime();
  calcMonthly();
})();

// ---- Rent vs Buy Calculator ----
(function(){
  const priceEl = document.getElementById('rvbHomePrice');
  if(!priceEl) return;
  const curSel = document.getElementById('rvbCur');
  function money(n){
    const cur = curSel ? curSel.value : '$';
    return (n<0?'-':'')+cur+Math.round(Math.abs(n)).toLocaleString();
  }

  function calc(){
    const price = parseFloat(priceEl.value)||0;
    const down = parseFloat(document.getElementById('rvbDown').value)||0;
    const rate = parseFloat(document.getElementById('rvbRate').value)||0;
    const termYears = parseFloat(document.getElementById('rvbTerm').value)||30;
    const taxRate = parseFloat(document.getElementById('rvbTaxRate').value)||0;
    const insurance = parseFloat(document.getElementById('rvbInsurance').value)||0;
    const maintRate = parseFloat(document.getElementById('rvbMaint').value)||0;
    const hoa = parseFloat(document.getElementById('rvbHoa').value)||0;
    const appreciation = parseFloat(document.getElementById('rvbAppreciation').value)||0;
    const closingPct = parseFloat(document.getElementById('rvbClosingPct').value)||0;
    const sellingPct = parseFloat(document.getElementById('rvbSellingPct').value)||0;
    const rent = parseFloat(document.getElementById('rvbRent').value)||0;
    const rentIncrease = parseFloat(document.getElementById('rvbRentIncrease').value)||0;
    const investReturn = parseFloat(document.getElementById('rvbInvestReturn').value)||0;
    const years = parseFloat(document.getElementById('rvbYears').value)||7;

    const loanAmt = Math.max(price-down, 0);
    const closingCosts = price*closingPct/100;
    const termMonths = Math.round(termYears*12);
    const amort = buildAmortization(loanAmt, rate, termMonths, 0);
    const monthlyPI = amort.pay;
    const monthlyExtras = (price*taxRate/100)/12 + insurance/12 + (price*maintRate/100)/12 + hoa;
    const monthlyBuyCost = monthlyPI + monthlyExtras;

    function balanceAtYear(y){
      if(y<=0) return loanAmt;
      if(y>=termYears) return 0;
      const row = amort.years.find(r=>r.year===Math.round(y));
      return row ? row.balance : 0;
    }
    function buyNetCost(y){
      const homeValue = price*Math.pow(1+appreciation/100, y);
      const balance = balanceAtYear(y);
      const sellingCosts = homeValue*sellingPct/100;
      const equity = homeValue - balance - sellingCosts;
      const totalPaid = down + closingCosts + monthlyBuyCost*12*y;
      return totalPaid - equity;
    }
    function rentNetCost(y){
      let totalRent = 0;
      for(let i=0;i<y;i++){
        totalRent += rent*Math.pow(1+rentIncrease/100, i)*12;
      }
      const investPrincipal = down+closingCosts;
      const investFV = investPrincipal*Math.pow(1+investReturn/100, y);
      const investGain = investFV-investPrincipal;
      return totalRent - investGain;
    }

    const buyCost = buyNetCost(years);
    const rentCost = rentNetCost(years);
    document.getElementById('rvbBuyCost').textContent = money(buyCost);
    document.getElementById('rvbRentCost').textContent = money(rentCost);
    document.getElementById('rvbMonthlyBuy').textContent = money(monthlyBuyCost);
    document.getElementById('rvbMonthlyRent').textContent = money(rent);
    const diff = rentCost-buyCost;
    const verdictEl = document.getElementById('rvbVerdict');
    if(verdictEl){
      verdictEl.textContent = diff>0
        ? `Buying looks cheaper by ${money(Math.abs(diff))} over ${years} years, on these numbers.`
        : `Renting looks cheaper by ${money(Math.abs(diff))} over ${years} years, on these numbers.`;
    }

    let breakEven = null;
    for(let y=1;y<=30;y++){
      if(buyNetCost(y) <= rentNetCost(y)){ breakEven = y; break; }
    }
    const breakEvenEl = document.getElementById('rvbBreakEven');
    if(breakEvenEl) breakEvenEl.textContent = breakEven ? (breakEven+' years') : 'Not within 30 years at these numbers';
  }
  ['rvbHomePrice','rvbDown','rvbRate','rvbTerm','rvbTaxRate','rvbInsurance','rvbMaint','rvbHoa','rvbAppreciation','rvbClosingPct','rvbSellingPct','rvbRent','rvbRentIncrease','rvbInvestReturn','rvbYears','rvbCur'].forEach(id=>{
    const e = document.getElementById(id);
    if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); }
  });
  calc();
})();

// ---- Car Loan Calculator ----
(function(){
  const priceEl = document.getElementById('clPrice');
  if(!priceEl) return;
  const curSel = document.getElementById('clCur');
  function money(n){
    const cur = curSel ? curSel.value : '$';
    return cur+Math.round(n).toLocaleString();
  }
  function setWarning(id, msg){
    const w = document.getElementById(id);
    if(!w) return;
    if(msg){ w.textContent = msg; w.classList.add('show'); } else { w.textContent=''; w.classList.remove('show'); }
  }
  let lastYears = [], lastCur = '$';
  function calc(){
    const price = parseFloat(priceEl.value)||0;
    const down = parseFloat(document.getElementById('clDown').value)||0;
    const tradeIn = parseFloat(document.getElementById('clTradeIn').value)||0;
    const taxRate = parseFloat(document.getElementById('clTaxRate').value)||0;
    const rate = parseFloat(document.getElementById('clRate').value)||0;
    const termMonths = parseFloat(document.getElementById('clTerm').value)||60;

    const taxableAmt = Math.max(price-tradeIn, 0);
    const tax = taxableAmt*taxRate/100;
    const loanAmt = Math.max(price-down-tradeIn+tax, 0);

    setWarning('clWarning', loanAmt<=0 ? 'Down payment plus trade-in covers the full price — no loan needed.' : null);

    const amort = buildAmortization(loanAmt, rate, termMonths, 0);
    document.getElementById('clLoanAmt').textContent = money(loanAmt);
    document.getElementById('clPayment').textContent = money(amort.pay);
    document.getElementById('clTotalInterest').textContent = money(amort.totalInterest);
    document.getElementById('clTotalCost').textContent = money(loanAmt+amort.totalInterest);

    lastYears = amort.years;
    lastCur = curSel ? curSel.value : '$';
    renderAmortChart('clChart', amort.years, loanAmt, lastCur);
    renderAmortTable('clScheduleBody', amort.years, lastCur);
  }
  ['clPrice','clDown','clTradeIn','clTaxRate','clRate','clTerm','clCur'].forEach(id=>{
    const e = document.getElementById(id);
    if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); }
  });
  const csvBtn = document.getElementById('clCsvBtn');
  if(csvBtn) csvBtn.addEventListener('click', ()=>downloadCSV('car-loan-amortization.csv', amortizationToCSV(lastYears, lastCur)));
  calc();
})();

// ---- Retirement Calculator ----
(function(){
  const ageEl = document.getElementById('retCurrentAge');
  if(!ageEl) return;
  const curSel = document.getElementById('retCur');
  function money(n){
    const cur = curSel ? curSel.value : '$';
    return cur+Math.round(n).toLocaleString();
  }
  function calc(){
    const currentAge = parseFloat(ageEl.value)||0;
    const retireAge = parseFloat(document.getElementById('retRetireAge').value)||0;
    const current = parseFloat(document.getElementById('retCurrentSavings').value)||0;
    const monthly = parseFloat(document.getElementById('retMonthly').value)||0;
    const matchPct = parseFloat(document.getElementById('retMatchPct').value)||0;
    const matchCap = parseFloat(document.getElementById('retMatchCap').value)||0;
    const annual = parseFloat(document.getElementById('retRate').value)||0;
    const infl = parseFloat(document.getElementById('retInflation').value)||0;
    const withdrawRate = parseFloat(document.getElementById('retWithdrawRate').value)||4;

    const years = Math.max(retireAge-currentAge, 0);
    const n = Math.round(years*12);
    const r = annual/100/12;
    const employerMatch = Math.min(monthly*matchPct/100, matchCap);
    const totalMonthly = monthly+employerMatch;

    let balance = current, invested = current;
    const yearRows = [];
    for(let m=1; m<=n; m++){
      balance = balance*(1+r) + totalMonthly;
      invested += totalMonthly;
      if(m%12===0 || m===n) yearRows.push({year:Math.ceil(m/12), invested, value:balance});
    }
    const nominal = balance;
    const real = years>0 ? nominal/Math.pow(1+infl/100, years) : nominal;
    const annualIncome = nominal*withdrawRate/100;

    document.getElementById('retNominal').textContent = money(nominal);
    document.getElementById('retReal').textContent = money(real);
    document.getElementById('retAnnualIncome').textContent = money(annualIncome);
    document.getElementById('retMonthlyIncome').textContent = money(annualIncome/12);
    const matchEl = document.getElementById('retEmployerMatch');
    if(matchEl) matchEl.textContent = money(employerMatch)+'/mo';

    const body = document.getElementById('retGrowthBody');
    if(body) body.innerHTML = yearRows.map(r=>`<tr><td>${r.year}</td><td>${money(r.invested)}</td><td>${money(r.value)}</td><td>${money(r.value-r.invested)}</td></tr>`).join('');
  }
  ['retCurrentAge','retRetireAge','retCurrentSavings','retMonthly','retMatchPct','retMatchCap','retRate','retInflation','retWithdrawRate','retCur'].forEach(id=>{
    const e = document.getElementById(id);
    if(e){ e.addEventListener('input', calc); e.addEventListener('change', calc); }
  });
  calc();
})();

// ---- PWA: register service worker for offline/instant-load support ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ---- Shared: amortization schedule + SVG chart renderer ----
function buildAmortization(P, annualRate, months, extra){
  extra = extra||0;
  const r = annualRate/100/12;
  const pay = (r===0||months<=0) ? (months>0?P/months:0) : P*r/(1-Math.pow(1+r,-months));
  let bal = P; const years = [];
  let yp=0, yi=0, totalInterest=0, monthsTaken=0;
  for(let m=1;m<=months;m++){
    const interest = bal*r;
    const principal = Math.min(pay+extra-interest, bal);
    bal = Math.max(bal-principal,0);
    yp+=principal; yi+=interest; totalInterest+=interest;
    monthsTaken = m;
    if(m%12===0 || m===months || bal<=0){
      years.push({year:Math.ceil(m/12), principal:yp, interest:yi, balance:bal});
      yp=0; yi=0;
    }
    if(bal<=0) break;
  }
  return {pay, years, monthsTaken, totalInterest};
}

function renderAmortChart(containerId, years, P, cur){
  const el = document.getElementById(containerId);
  if(!el || !years.length) return;
  const W=700, H=220, pad=40;
  const maxBal = P;
  const n = years.length;
  const x = i => pad + (i/(Math.max(n-1,1)))*(W-pad-16);
  const y = v => H-30 - (v/maxBal)*(H-50);
  let path = `M ${x(0)} ${y(years[0].balance+years[0].principal)}`;
  years.forEach((yr,i)=>{ path += ` L ${x(i)} ${y(yr.balance)}`; });
  const lastX = x(n-1);
  const gridLines = [0.25,0.5,0.75,1].map(f=>
    `<line x1="${pad}" y1="${y(maxBal*f)}" x2="${W-16}" y2="${y(maxBal*f)}" stroke="var(--paper-line)" stroke-width="1"/>
     <text x="${pad-6}" y="${y(maxBal*f)+4}" text-anchor="end" font-size="9" font-family="JetBrains Mono,monospace" fill="var(--graphite)">${Math.round(maxBal*f/1000)}k</text>`
  ).join('');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;background:var(--card-hi);border:1px solid var(--paper-line);border-radius:6px;">
    ${gridLines}
    <path d="${path} L ${lastX} ${y(0)} L ${x(0)} ${y(0)} Z" fill="rgba(192,138,52,0.15)"/>
    <path d="${path}" fill="none" stroke="var(--orange)" stroke-width="2"/>
    <text x="${pad}" y="14" font-size="10" font-family="JetBrains Mono,monospace" fill="var(--graphite)">REMAINING BALANCE (${cur.trim()}) BY YEAR</text>
    <text x="${pad}" y="${H-8}" font-size="9" font-family="JetBrains Mono,monospace" fill="var(--graphite)">Year 1</text>
    <text x="${lastX}" y="${H-8}" text-anchor="end" font-size="9" font-family="JetBrains Mono,monospace" fill="var(--graphite)">Year ${years[n-1].year}</text>
  </svg>`;
}

function renderAmortTable(bodyId, years, cur){
  const tbody = document.getElementById(bodyId);
  if(!tbody) return;
  const f = v => cur + Math.round(v).toLocaleString();
  tbody.innerHTML = years.map(y=>
    `<tr><td>${y.year}</td><td>${f(y.principal)}</td><td>${f(y.interest)}</td><td>${f(y.balance)}</td></tr>`
  ).join('');
}

// ---- Shared CSV export ----
// Triggers a client-side file download — no server involved, nothing leaves
// the browser except the file itself landing in the user's downloads folder.
function downloadCSV(filename, csvContent){
  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function amortizationToCSV(years, cur){
  const esc = s => String(s);
  const headers = ['Year','Principal Paid ('+cur.trim()+')','Interest Paid ('+cur.trim()+')','Balance ('+cur.trim()+')'];
  const rows = years.map(y => [y.year, Math.round(y.principal), Math.round(y.interest), Math.round(y.balance)]);
  return [headers.join(','), ...rows.map(r=>r.map(esc).join(','))].join('\r\n');
}

// ---- Loan amortization hookup ----
(function(){
  if(!document.getElementById('loanScheduleBody')) return;
  let lastYears = [], lastCur = '$';
  function update(){
    const cur = document.getElementById('loanCur').value;
    const P = parseFloat(document.getElementById('loanAmt').value)||0;
    const rate = parseFloat(document.getElementById('loanRate').value)||0;
    const termInput = parseFloat(document.getElementById('loanTerm').value)||0;
    const seg = document.getElementById('loanTenureSeg');
    const unit = seg ? (seg.querySelector('.active')?.dataset.unit||'months') : 'months';
    const months = Math.round(unit==='years' ? termInput*12 : termInput);
    if(P<=0||months<=0) return;
    const extraEl = document.getElementById('loanExtra');
    const extra = extraEl ? (parseFloat(extraEl.value)||0) : 0;
    const {years} = buildAmortization(P, rate, months, extra);
    lastYears = years; lastCur = cur;
    renderAmortChart('loanChart', years, P, cur);
    renderAmortTable('loanScheduleBody', years, cur);
  }
  ['loanAmt','loanRate','loanTerm','loanCur','loanExtra'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('input',update); el.addEventListener('change',update);
  });
  const seg=document.getElementById('loanTenureSeg');
  if(seg) seg.addEventListener('click',()=>setTimeout(update,0));
  const csvBtn = document.getElementById('loanCsvBtn');
  if(csvBtn) csvBtn.addEventListener('click', ()=>{
    if(!lastYears.length) return;
    downloadCSV('loan-amortization-schedule.csv', amortizationToCSV(lastYears, lastCur));
  });
  update();
})();

// ---- Loan: compare two scenarios ----
(function(){
  const toggle = document.getElementById('loanCompareToggle');
  if(!toggle) return;
  const wrap = document.getElementById('loanCompareWrap');
  const segB = document.getElementById('loanTenureSegB');
  const unitLabelB = document.getElementById('loanTenureUnitLabelB');

  function fmtMonths(m){
    const y = Math.floor(m/12), rem = m%12;
    if(y===0) return rem+' mo';
    return rem===0 ? y+' yr' : y+' yr '+rem+' mo';
  }
  function getUnit(segEl){
    const active = segEl ? segEl.querySelector('button.active') : null;
    return active ? active.dataset.unit : 'months';
  }
  function scenarioFromIds(curId, amtId, rateId, termId, segEl, extraId){
    const cur = document.getElementById(curId).value;
    const P = parseFloat(document.getElementById(amtId).value)||0;
    const rate = parseFloat(document.getElementById(rateId).value)||0;
    const termInput = parseFloat(document.getElementById(termId).value)||0;
    const unit = getUnit(segEl);
    const n = Math.round(unit==='years' ? termInput*12 : termInput);
    const extraEl = document.getElementById(extraId);
    const extra = extraEl ? (parseFloat(extraEl.value)||0) : 0;
    const result = buildAmortization(P, rate, n, extra);
    return { cur, P, n, extra, pay: result.pay+extra, totalInterest: result.totalInterest, monthsTaken: result.monthsTaken, valid: P>0 && n>0 };
  }

  function calcCompare(){
    if(wrap.style.display === 'none') return;
    const a = scenarioFromIds('loanCur','loanAmt','loanRate','loanTerm', document.getElementById('loanTenureSeg'), 'loanExtra');
    const b = scenarioFromIds('loanCur','loanAmtB','loanRateB','loanTermB', segB, 'loanExtraB');

    const curB = document.getElementById('loanCur').value;
    document.getElementById('loanPayB').textContent = curB+b.pay.toFixed(2);
    document.getElementById('loanIntB').textContent = curB+b.totalInterest.toFixed(2);
    document.getElementById('loanPayoffB').textContent = b.valid ? fmtMonths(b.monthsTaken) : '—';

    if(!a.valid || !b.valid){
      ['loanCompPay','loanCompInt'].forEach(id=>document.getElementById(id).textContent='—');
      document.getElementById('loanCompTime').textContent='—';
      document.getElementById('loanCompWinner').textContent='—';
      return;
    }

    const payDiff = a.pay - b.pay;
    const intDiff = a.totalInterest - b.totalInterest;
    const timeDiff = a.monthsTaken - b.monthsTaken;

    document.getElementById('loanCompPay').textContent =
      a.cur+a.pay.toFixed(2)+' vs '+curB+b.pay.toFixed(2)+' ('+(payDiff>=0?'+':'')+a.cur+Math.abs(payDiff).toFixed(2)+(payDiff>=0?' more for A':' more for B')+')';
    document.getElementById('loanCompInt').textContent =
      a.cur+a.totalInterest.toFixed(2)+' vs '+curB+b.totalInterest.toFixed(2);
    document.getElementById('loanCompTime').textContent =
      fmtMonths(a.monthsTaken)+' vs '+fmtMonths(b.monthsTaken);

    // "Cheaper" judged by total interest paid, the fairest single number for comparing loan cost
    let winner;
    if(Math.abs(intDiff) < 0.01) winner = 'Roughly equal total cost';
    else if(intDiff > 0) winner = 'Scenario B — saves '+a.cur+Math.abs(intDiff).toFixed(2)+' in interest';
    else winner = 'Scenario A — saves '+a.cur+Math.abs(intDiff).toFixed(2)+' in interest';
    document.getElementById('loanCompWinner').textContent = winner;
  }

  toggle.addEventListener('change', ()=>{
    wrap.style.display = toggle.checked ? 'block' : 'none';
    calcCompare();
  });
  if(segB){
    segB.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      segB.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      unitLabelB.textContent = btn.dataset.unit;
      calcCompare();
    });
  }
  ['loanAmt','loanRate','loanTerm','loanExtra','loanCur',
   'loanAmtB','loanRateB','loanTermB','loanExtraB'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calcCompare);
    el.addEventListener('change', calcCompare);
  });
  const segA = document.getElementById('loanTenureSeg');
  if(segA) segA.addEventListener('click', ()=>setTimeout(calcCompare,0));
})();
(function(){
  if(!document.getElementById('mtgScheduleBody')) return;
  let lastYears = [], lastCur = '$';
  function update(){
    const cur = document.getElementById('mtgCur').value;
    const price = parseFloat(document.getElementById('mtgPrice').value)||0;
    const down = parseFloat(document.getElementById('mtgDown').value)||0;
    const P = Math.max(price-down,0);
    const rate = parseFloat(document.getElementById('mtgRate').value)||0;
    const years = parseFloat(document.getElementById('mtgTerm').value)||0;
    const months = Math.round(years*12);
    if(P<=0||months<=0) return;
    const extraEl = document.getElementById('mtgExtra');
    const extra = extraEl ? (parseFloat(extraEl.value)||0) : 0;
    const {years:sched} = buildAmortization(P, rate, months, extra);
    lastYears = sched; lastCur = cur;
    renderAmortChart('mtgChart', sched, P, cur);
    renderAmortTable('mtgScheduleBody', sched, cur);
  }
  ['mtgPrice','mtgDown','mtgRate','mtgTerm','mtgCur','mtgExtra'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('input',update); el.addEventListener('change',update);
  });
  const csvBtn = document.getElementById('mtgCsvBtn');
  if(csvBtn) csvBtn.addEventListener('click', ()=>{
    if(!lastYears.length) return;
    downloadCSV('mortgage-amortization-schedule.csv', amortizationToCSV(lastYears, lastCur));
  });
  update();
})();

// ---- Mortgage: compare two scenarios ----
(function(){
  const toggle = document.getElementById('mtgCompareToggle');
  if(!toggle) return;
  const wrap = document.getElementById('mtgCompareWrap');

  function fmtMonths(m){
    const y = Math.floor(m/12), rem = m%12;
    if(y===0) return rem+' mo';
    return rem===0 ? y+' yr' : y+' yr '+rem+' mo';
  }

  function scenario(prefix){
    const price = parseFloat(document.getElementById('mtgPrice'+prefix).value)||0;
    const down = parseFloat(document.getElementById('mtgDown'+prefix).value)||0;
    const principal = Math.max(price-down, 0);
    const rate = parseFloat(document.getElementById('mtgRate'+prefix).value)||0;
    const years = parseFloat(document.getElementById('mtgTerm'+prefix).value)||1;
    const n = Math.round(years*12);
    const extra = parseFloat(document.getElementById('mtgExtra'+prefix).value)||0;

    const result = buildAmortization(principal, rate, n, extra);
    const pi = buildAmortization(principal, rate, n, 0).pay;

    const downPct = price>0 ? down/price*100 : 0;
    const pmiRate = parseFloat(document.getElementById('mtgPmiRate'+prefix).value)||0;
    const pmiMonthly = downPct < 20 ? (principal*pmiRate/100)/12 : 0;
    const taxMonthly = (parseFloat(document.getElementById('mtgTax'+prefix).value)||0)/12;
    const insMonthly = (parseFloat(document.getElementById('mtgInsurance'+prefix).value)||0)/12;
    const hoaMonthly = parseFloat(document.getElementById('mtgHoa'+prefix).value)||0;

    const extrasTotal = taxMonthly+insMonthly+pmiMonthly+hoaMonthly;
    const totalMonthly = pi+extrasTotal+extra;

    return {
      totalMonthly, totalInterest: result.totalInterest, monthsTaken: result.monthsTaken,
      valid: principal>0 && n>0
    };
  }

  function calcCompare(){
    if(wrap.style.display === 'none') return;
    const cur = document.getElementById('mtgCur').value;
    const a = scenario('');
    const b = scenario('B');

    document.getElementById('mtgTotalB').textContent = cur+b.totalMonthly.toFixed(2);
    document.getElementById('mtgIntB').textContent = cur+b.totalInterest.toFixed(2);
    document.getElementById('mtgPayoffB').textContent = b.valid ? fmtMonths(b.monthsTaken) : '—';

    if(!a.valid || !b.valid){
      ['mtgCompPay','mtgCompInt'].forEach(id=>document.getElementById(id).textContent='—');
      document.getElementById('mtgCompTime').textContent='—';
      document.getElementById('mtgCompWinner').textContent='—';
      return;
    }

    const intDiff = a.totalInterest - b.totalInterest;

    document.getElementById('mtgCompPay').textContent =
      cur+a.totalMonthly.toFixed(2)+' vs '+cur+b.totalMonthly.toFixed(2);
    document.getElementById('mtgCompInt').textContent =
      cur+a.totalInterest.toFixed(2)+' vs '+cur+b.totalInterest.toFixed(2);
    document.getElementById('mtgCompTime').textContent =
      fmtMonths(a.monthsTaken)+' vs '+fmtMonths(b.monthsTaken);

    let winner;
    if(Math.abs(intDiff) < 0.01) winner = 'Roughly equal total cost';
    else if(intDiff > 0) winner = 'Scenario B — saves '+cur+Math.abs(intDiff).toFixed(2)+' in interest';
    else winner = 'Scenario A — saves '+cur+Math.abs(intDiff).toFixed(2)+' in interest';
    document.getElementById('mtgCompWinner').textContent = winner;
  }

  toggle.addEventListener('change', ()=>{
    wrap.style.display = toggle.checked ? 'block' : 'none';
    calcCompare();
  });
  ['mtgPrice','mtgDown','mtgRate','mtgTerm','mtgTax','mtgInsurance','mtgPmiRate','mtgHoa','mtgExtra','mtgCur',
   'mtgPriceB','mtgDownB','mtgRateB','mtgTermB','mtgTaxB','mtgInsuranceB','mtgPmiRateB','mtgHoaB','mtgExtraB'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calcCompare);
    el.addEventListener('change', calcCompare);
  });
})();

// ---- Investment year-by-year growth table ----
(function(){
  const tbody = document.getElementById('invGrowthBody');
  if(!tbody) return;
  function cur(){ return document.getElementById('invCur') ? document.getElementById('invCur').value : '₹'; }
  function fm(v){ return cur()+Math.round(v).toLocaleString(); }
  function activeTab(){
    const t = document.querySelector('#invTabs button.active');
    return t ? t.dataset.tab : 'sip';
  }
  function update(){
    const tab = activeTab();
    const wrap = document.getElementById('invGrowthWrap');
    if(tab==='cagr'){
      if(wrap) wrap.style.display = 'none';
      return;
    }
    if(wrap) wrap.style.display = '';
    let rows = [];
    if(tab==='sip'){
      const amt = parseFloat(document.getElementById('sipAmt').value)||0;
      const rate = (parseFloat(document.getElementById('sipRate').value)||0)/100/12;
      const yrs = parseInt(document.getElementById('sipYears').value)||0;
      let val=0;
      for(let y=1;y<=yrs;y++){
        for(let m=0;m<12;m++){ val = (val+amt)*(1+rate); }
        rows.push({year:y, invested:amt*12*y, value:val});
      }
    } else if(tab==='compound'){
      const P = parseFloat(document.getElementById('cmpPrincipal').value)||0;
      const rate = (parseFloat(document.getElementById('cmpRate').value)||0)/100;
      const freq = parseFloat(document.getElementById('cmpFreq').value)||12;
      const yrs = parseInt(document.getElementById('cmpYears').value)||0;
      for(let y=1;y<=yrs;y++){
        const val = P*Math.pow(1+rate/freq, freq*y);
        rows.push({year:y, invested:P, value:val});
      }
    } else if(tab==='swp'){
      const P = parseFloat(document.getElementById('swpPrincipal').value)||0;
      const wd = parseFloat(document.getElementById('swpWithdraw').value)||0;
      const rate = (parseFloat(document.getElementById('swpRate').value)||0)/100/12;
      const yrs = parseInt(document.getElementById('swpYears').value)||0;
      let bal=P, withdrawn=0;
      for(let y=1;y<=yrs;y++){
        for(let m=0;m<12;m++){
          bal = bal*(1+rate);
          const take = Math.min(wd, bal);
          bal -= take; withdrawn += take;
        }
        rows.push({year:y, invested:withdrawn, value:bal, swp:true});
      }
    }
    const isSwp = tab==='swp';
    const thead = tbody.closest('table').querySelector('thead tr');
    thead.innerHTML = isSwp
      ? '<th>Year</th><th>Withdrawn (cumulative)</th><th>Balance</th><th>—</th>'
      : '<th>Year</th><th>Invested (cumulative)</th><th>Value</th><th>Growth</th>';
    tbody.innerHTML = rows.map(r=>{
      const growth = r.swp ? '' : fm(r.value - r.invested);
      return `<tr><td>${r.year}</td><td>${fm(r.invested)}</td><td>${fm(r.value)}</td><td>${growth||'—'}</td></tr>`;
    }).join('');
  }
  document.querySelectorAll('#invGrowthWrap, #panel-sip input, #panel-swp input, #panel-compound input, #panel-compound select, #invCur').forEach(el=>{
    el.addEventListener('input', update); el.addEventListener('change', update);
  });
  const tabs = document.getElementById('invTabs');
  if(tabs) tabs.addEventListener('click', ()=>setTimeout(update,0));
  update();
})();

// ---- Generic: copy-result + share-link buttons on every readout ----
(function(){
  const readouts = document.querySelectorAll('.readout');
  if(!readouts.length) return;

  // Restore inputs from URL params on load
  const params = new URLSearchParams(window.location.search);
  let restored = false;
  params.forEach((val, key)=>{
    const el = document.getElementById(key);
    if(el && (el.tagName==='INPUT' || el.tagName==='SELECT')){
      el.value = val; restored = true;
    }
  });
  if(restored){
    document.querySelectorAll('input,select').forEach(el=>{
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }

  readouts.forEach(r=>{
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;margin-top:12px;';
    const copyBtn = document.createElement('button');
    copyBtn.type='button'; copyBtn.className='ghost';
    copyBtn.style.cssText='font-size:10px;padding:6px 10px;border-color:rgba(242,236,221,0.3);color:rgba(242,236,221,0.7);';
    copyBtn.textContent='Copy result';
    copyBtn.addEventListener('click',()=>{
      const text = Array.from(r.querySelectorAll('.r-row')).map(row=>{
        const l=row.querySelector('.r-label'), v=row.querySelector('.r-value');
        return (l?l.textContent+': ':'')+(v?v.textContent:'');
      }).filter(Boolean).join('\n') || r.textContent.trim();
      navigator.clipboard.writeText(text).then(()=>{
        copyBtn.textContent='Copied!'; setTimeout(()=>copyBtn.textContent='Copy result',1500);
      });
    });
    const shareBtn = document.createElement('button');
    shareBtn.type='button'; shareBtn.className='ghost';
    shareBtn.style.cssText=copyBtn.style.cssText;
    shareBtn.textContent='Share link';
    shareBtn.addEventListener('click',()=>{
      const p = new URLSearchParams();
      document.querySelectorAll('input[id],select[id]').forEach(el=>{
        if(el.type==='checkbox'||el.type==='range') return;
        if(el.value!=='') p.set(el.id, el.value);
      });
      const url = window.location.origin + window.location.pathname + '?' + p.toString();
      navigator.clipboard.writeText(url).then(()=>{
        shareBtn.textContent='Link copied!'; setTimeout(()=>shareBtn.textContent='Share link',1500);
      });
    });
    bar.appendChild(copyBtn); bar.appendChild(shareBtn);
    r.appendChild(bar);
  });
})();

// ---- FD calculator ----
(function(){
  if(!document.getElementById('fdAmt')) return;
  function calc(){
    const P = parseFloat(document.getElementById('fdAmt').value)||0;
    let r = (parseFloat(document.getElementById('fdRate').value)||0)/100;
    const seniorEl = document.getElementById('fdSenior');
    if(seniorEl && seniorEl.checked) r += 0.005;
    const t = parseFloat(document.getElementById('fdYears').value)||0;
    const n = parseFloat(document.getElementById('fdFreq').value)||4;
    const maturity = P*Math.pow(1+r/n, n*t);
    document.getElementById('fdInvested').textContent = '₹'+Math.round(P).toLocaleString('en-IN');
    document.getElementById('fdInterest').textContent = '₹'+Math.round(maturity-P).toLocaleString('en-IN');
    document.getElementById('fdMaturity').textContent = '₹'+Math.round(maturity).toLocaleString('en-IN');
  }
  ['fdAmt','fdRate','fdYears','fdFreq','fdSenior'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('input',calc); el.addEventListener('change',calc);
  });
  calc();
})();

// ---- RD calculator ----
(function(){
  if(!document.getElementById('rdAmt')) return;
  function calc(){
    const R = parseFloat(document.getElementById('rdAmt').value)||0;
    let rate = (parseFloat(document.getElementById('rdRate').value)||0)/100;
    const seniorEl = document.getElementById('rdSenior');
    if(seniorEl && seniorEl.checked) rate += 0.005;
    const months = parseInt(document.getElementById('rdMonths').value)||0;
    const stepUpEl = document.getElementById('rdStepUp');
    const stepUp = stepUpEl ? (parseFloat(stepUpEl.value)||0) : 0;
    // Each installment compounds quarterly for its remaining months
    let maturity = 0, invested = 0, finalMonthAmt = R;
    const iq = rate/4;
    for(let m=1;m<=months;m++){
      const yearIndex = Math.floor((m-1)/12);
      const amt = stepUp>0 ? R*Math.pow(1+stepUp/100, yearIndex) : R;
      finalMonthAmt = amt;
      invested += amt;
      const quartersLeft = (months - m + 1)/3;
      maturity += amt*Math.pow(1+iq, quartersLeft);
    }
    document.getElementById('rdInvested').textContent = '₹'+Math.round(invested).toLocaleString('en-IN');
    document.getElementById('rdInterest').textContent = '₹'+Math.round(maturity-invested).toLocaleString('en-IN');
    document.getElementById('rdMaturity').textContent = '₹'+Math.round(maturity).toLocaleString('en-IN');
    const finalAmtEl = document.getElementById('rdFinalMonthAmt');
    if(finalAmtEl) finalAmtEl.textContent = stepUp>0 ? '₹'+Math.round(finalMonthAmt).toLocaleString('en-IN')+'/mo by the final year' : '—';
  }
  ['rdAmt','rdRate','rdMonths','rdSenior','rdStepUp'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener('input',calc);
  });
  calc();
})();

// ---- PPF calculator ----
(function(){
  if(!document.getElementById('ppfAmt')) return;
  function calc(){
    const A = Math.min(parseFloat(document.getElementById('ppfAmt').value)||0, 150000);
    const r = (parseFloat(document.getElementById('ppfRate').value)||0)/100;
    const yrs = Math.max(parseInt(document.getElementById('ppfYears').value)||15, 1);
    let bal = 0;
    for(let y=0;y<yrs;y++){ bal = (bal + A)*(1+r); }
    const invested = A*yrs;
    document.getElementById('ppfInvested').textContent = '₹'+Math.round(invested).toLocaleString('en-IN');
    document.getElementById('ppfInterest').textContent = '₹'+Math.round(bal-invested).toLocaleString('en-IN');
    document.getElementById('ppfMaturity').textContent = '₹'+Math.round(bal).toLocaleString('en-IN');
  }
  ['ppfAmt','ppfRate','ppfYears'].forEach(id=>{
    const el=document.getElementById(id);
    el.addEventListener('input',calc);
  });
  calc();
})();

// ---- HRA exemption calculator ----
(function(){
  if(!document.getElementById('hraBasic')) return;
  let city = 'metro';
  const seg = document.getElementById('hraCitySeg');
  function setWarning(msg){
    const el = document.getElementById('hraWarning');
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }
  function calc(){
    const basic = parseFloat(document.getElementById('hraBasic').value)||0;
    const received = parseFloat(document.getElementById('hraReceived').value)||0;
    const rent = parseFloat(document.getElementById('hraRent').value)||0;

    if(basic < 0 || received < 0 || rent < 0){
      setWarning('Salary, HRA received, and rent can\'t be negative — enter positive amounts.');
    } else if(basic === 0 && received > 0){
      setWarning('Basic salary is zero, so the 50%/40%-of-basic test contributes nothing — exemption is limited to actual HRA received or rent paid, whichever is lower.');
    } else {
      setWarning(null);
    }

    const t1 = received;
    const t2 = Math.max(rent - 0.10*basic, 0);
    const t3 = (city==='metro'?0.50:0.40)*basic;
    const exempt = Math.max(Math.min(t1,t2,t3), 0);
    const taxable = Math.max(received-exempt,0);
    let rule = '—';
    if(exempt===t1) rule='Actual HRA received';
    else if(exempt===t2) rule='Rent − 10% of basic';
    else rule=(city==='metro'?'50%':'40%')+' of basic';
    document.getElementById('hraExempt').textContent = '₹'+Math.round(exempt).toLocaleString('en-IN');
    document.getElementById('hraTaxable').textContent = '₹'+Math.round(taxable).toLocaleString('en-IN');
    document.getElementById('hraRule').textContent = rule;
  }
  seg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    city = btn.dataset.city;
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  ['hraBasic','hraReceived','hraRent'].forEach(id=>{
    document.getElementById(id).addEventListener('input',calc);
  });
  calc();
})();

// ---- Residential status (India, Income-tax Act 2025 s.6) ----
// Substance carries over unchanged from s.6 of the 1961 Act; only the
// numbering and the "tax year" wording changed. Tests, in order:
//   6(2)(a) 182+ days this tax year
//   6(2)(b) 60+ days this year AND 365+ across the four preceding years
//   6(3)    Indian citizen leaving for employment abroad / crew of an Indian
//           ship: read that 60 as 182
//   6(4)    Indian citizen or PIO visiting India: read that 60 as 182
//   6(5)    ...unless their non-foreign-source income tops Rs 15 lakh, when it
//           is 120 instead
//   6(7)    Indian citizen over Rs 15 lakh who is liable to tax nowhere else is
//           deemed resident whatever the day count
//   6(13)   a resident is "not ordinarily resident" if non-resident in 9 of the
//           last 10 tax years, or in India 729 days or fewer over the last 7,
//           or resident only via the 120-day route, or deemed resident
(function(){
  if(!document.getElementById('resDays')) return;
  const THRESHOLD = 1500000;
  let who = 'citizen', why = 'resident', taxedAbroad = true;

  function determine(o, noMargin){
    const days = o.days, days4 = o.days4, days7 = o.days7, nrOf10 = o.nrOf10;
    const highIncome = o.income > THRESHOLD;
    const isCitizen = o.who === 'citizen', isPio = o.who === 'pio';

    let limitB = 60, limitRef = 's.6(2)(b)';
    if(isCitizen && o.why === 'employment'){ limitB = 182; limitRef = 's.6(3)'; }
    else if((isCitizen || isPio) && o.why === 'visiting'){
      if(highIncome){ limitB = 120; limitRef = 's.6(5)'; }
      else { limitB = 182; limitRef = 's.6(4)'; }
    }

    const condA = days >= 182;
    const condB = days >= limitB && days4 >= 365;
    const via120 = !condA && condB && limitB === 120;

    let resident = condA || condB, deemed = false;
    if(!resident && isCitizen && highIncome && !o.taxedAbroad){ resident = true; deemed = true; }

    const tests = [
      {label:'182 days or more in India this tax year', ref:'s.6(2)(a)',
       got:days+' days', pass:condA},
      {label:limitB+' days this year, and 365 or more across the last four', ref:limitRef,
       got:days+' days / '+days4+' days', pass:condB},
      {label:'Indian citizen over ₹15 lakh and taxed in no other country', ref:'s.6(7)',
       got:deemed?'applies':'does not apply', pass:deemed}
    ];

    if(!resident){
      return {status:'NR', title:'Non-Resident',
        rule:'Neither day-count test in s.6(2) is met'+(limitB!==60?', on the '+limitB+'-day threshold':''),
        scope:'Only income received, accruing or arising in India. Foreign income is outside the net.',
        tests:tests, deemed:false, via120:via120,
        margin: noMargin ? '' : margin(o, days, false)};
    }

    const nrTest = nrOf10 >= 9, dayTest = days7 <= 729;
    const rnor = nrTest || dayTest || via120 || deemed;

    tests.push({label:'Non-resident in 9 or more of the last 10 tax years', ref:'s.6(13)',
      got:nrOf10+' of 10', pass:nrTest});
    tests.push({label:'729 days or fewer in India across the last 7 tax years', ref:'s.6(13)',
      got:days7+' days', pass:dayTest});
    if(via120) tests.push({label:'Resident only via the 120-day visiting route', ref:'s.6(13)',
      got:'applies', pass:true});
    if(deemed) tests.push({label:'A deemed resident is always not ordinarily resident', ref:'s.6(13)',
      got:'applies', pass:true});

    let rule;
    if(deemed) rule = 'Deemed resident under s.6(7)';
    else if(via120) rule = 'The 120-day visiting route, s.6(5)';
    else if(condA) rule = '182 days or more in India, s.6(2)(a)';
    else rule = limitB+' days here plus 365 over four years, '+limitRef;
    if(rnor && !deemed && !via120){
      rule += nrTest && dayTest ? '; RNOR on both s.6(13) tests'
            : nrTest ? '; RNOR (9 of 10 years non-resident)'
            : '; RNOR (729 days or fewer in seven years)';
    }

    return {status:rnor?'RNOR':'ROR',
      title:rnor?'Resident but Not Ordinarily Resident':'Resident and Ordinarily Resident',
      rule:rule,
      scope: rnor
        ? 'Indian income, plus foreign income only from a business controlled in, or profession set up in, India.'
        : 'Your worldwide income, wherever it arises.',
      tests:tests, deemed:deemed, via120:via120,
      margin: noMargin ? '' : margin(o, days, true)};
  }

  // How far the day count sits from flipping the answer. Re-runs the whole test
  // at each day count rather than doing arithmetic on whichever threshold looks
  // binding: the thresholds interact, so a visiting NRI who drops below 120 days
  // can still land on s.6(7) and stay resident. Reasoning from one threshold
  // produced a sentence that was simply untrue in that case.
  function margin(o, days, isResident){
    const at = d => determine(Object.assign({}, o, {days:d}), true).status;
    if(isResident){
      for(let d = days - 1; d >= 0; d--){
        if(at(d) === 'NR'){
          const n = days - d;
          return n+' fewer day'+(n===1?'':'s')+' in India and you would have been non-resident.';
        }
      }
      return 'Not your day count — you stay resident even at zero days in India.';
    }
    for(let d = days + 1; d <= 366; d++){
      if(at(d) !== 'NR'){
        const n = d - days;
        return n+' more day'+(n===1?'':'s')+' in India would make you resident.';
      }
    }
    return 'No day count this year would make you resident on these figures.';
  }

  function setWarning(msg){
    const el = document.getElementById('resWarning');
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function num(id, max){
    const v = Math.floor(parseFloat(document.getElementById(id).value)||0);
    return Math.max(0, max === undefined ? v : Math.min(v, max));
  }

  function calc(){
    const o = {
      who: who, why: why, taxedAbroad: taxedAbroad,
      days: num('resDays', 366), days4: num('resDays4', 1461),
      days7: num('resDays7', 2557), nrOf10: num('resNr10', 10),
      income: num('resIncome')
    };

    // The seven-year window contains the four-year one, so days4 above days7 is
    // arithmetically impossible and would otherwise produce a confident wrong answer.
    if(o.days7 < o.days4){
      setWarning('Days across seven years cannot be fewer than days across four — the four-year window sits inside the seven-year one.');
    } else if(who === 'foreign' && why === 'employment'){
      setWarning('The substituted 182-day threshold in s.6(3) is for Indian citizens leaving India for employment. A foreign national keeps the 60-day threshold, which is what has been applied.');
    } else if(who === 'foreign' && why === 'visiting'){
      setWarning('The visiting relaxation in s.6(4) covers Indian citizens and persons of Indian origin. A foreign national keeps the 60-day threshold, which is what has been applied.');
    } else if(o.days > 365){
      setWarning('A tax year runs 1 April to 31 March, so the count cannot exceed 365 days (366 in a leap year).');
    } else {
      setWarning(null);
    }

    const r = determine(o, false);
    document.getElementById('resStatus').textContent = r.status;
    document.getElementById('resStatusFull').textContent = r.title;
    document.getElementById('resRule').textContent = r.rule;
    document.getElementById('resScope').textContent = r.scope;
    document.getElementById('resMargin').textContent = r.margin || '—';

    const body = document.getElementById('resTraceBody');
    if(body){
      body.innerHTML = '';
      r.tests.forEach(t=>{
        const tr = document.createElement('tr');
        [t.label, t.ref, t.got, t.pass ? 'Met' : 'Not met'].forEach((cell,i)=>{
          const td = document.createElement('td');
          td.textContent = cell;
          if(i === 3) td.style.color = t.pass ? 'var(--teal-dark)' : 'var(--ink-muted)';
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
    }
  }

  function wireSeg(id, fn){
    const seg = document.getElementById(id);
    if(!seg) return;
    seg.addEventListener('click',(e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      fn(btn);
      seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      calc();
    });
  }
  wireSeg('resWhoSeg', b => { who = b.dataset.who; });
  wireSeg('resWhySeg', b => { why = b.dataset.why; });
  wireSeg('resTaxedSeg', b => { taxedAbroad = b.dataset.taxed === 'yes'; });

  ['resDays','resDays4','resDays7','resNr10','resIncome'].forEach(id=>{
    document.getElementById(id).addEventListener('input',calc);
  });
  calc();
})();

// ---- Universal Reset + Copy Result + Deep-linkable URL state ----
// Adds "Reset", "Copy result", and "Copy link" buttons to every calculator
// card that has a .readout, using only the inputs/segmented-controls that
// belong to it. Also reads/writes calculator state to the URL query string,
// so a link with parameters pre-fills the calculator exactly as it was when
// shared — no localStorage involved, state lives only in the URL itself.
// Skipped on the scientific calculator page, which has its own AC/Copy
// controls suited to its expression-based model rather than a fixed form.
(function(){
  if(document.getElementById('sciGrid')) return;

  const cards = document.querySelectorAll('.tool .card');
  if(!cards.length) return;

  // Flat, page-wide registry used for URL state (separate from the per-card
  // Reset/Copy wiring below, since URL state covers the whole page at once).
  const pageInputs = [];
  const pageSegs = [];

  cards.forEach(card => {
    const readout = card.querySelector('.readout');
    if(!readout) return; // output-only or input-only card with nothing to attach to

    // Decide the scope to pull default values from: normally this card, but
    // if this card has no inputs of its own (e.g. tax calculator's separate
    // output card), fall back to the whole .tool section instead.
    let scope = card;
    if(card.querySelectorAll('input, select').length === 0){
      const toolSection = card.closest('.tool');
      if(toolSection && toolSection.querySelectorAll('input, select').length > 0){
        scope = toolSection;
      }
    }

    const formInputs = Array.from(scope.querySelectorAll('input, select'));
    const segGroups = Array.from(scope.querySelectorAll('.seg'));

    // Register every id'd input/seg once for page-wide URL state, even if
    // this card turns out to have nothing resettable (formInputs.length===0
    // just skips the Reset/Copy button creation below, not URL tracking).
    formInputs.forEach(el => {
      if(!el.id) return;
      let kind = 'value', defaultValue;
      if(el.tagName === 'SELECT'){
        const opts = Array.from(el.options);
        const defOpt = opts.find(o => o.defaultSelected) || opts[0];
        defaultValue = defOpt ? defOpt.value : '';
      } else if(el.type === 'checkbox' || el.type === 'radio'){
        kind = 'checkbox'; defaultValue = el.defaultChecked;
      } else {
        defaultValue = el.defaultValue;
      }
      pageInputs.push({el, id:el.id, kind, defaultValue});
    });
    segGroups.forEach(seg => {
      if(!seg.id) return;
      pageSegs.push({seg, id:seg.id});
    });

    if(formInputs.length === 0) return; // nothing resettable via buttons (e.g. password generator)

    const defaults = formInputs.map(el => {
      if(el.tagName === 'SELECT'){
        const opts = Array.from(el.options);
        const defOpt = opts.find(o => o.defaultSelected) || opts[0];
        return {el, kind:'value', value: defOpt ? defOpt.value : ''};
      }
      if(el.type === 'checkbox' || el.type === 'radio'){
        return {el, kind:'checkbox', value: el.defaultChecked};
      }
      return {el, kind:'value', value: el.defaultValue};
    });

    const segDefaults = segGroups.map(seg => ({
      seg, activeBtn: seg.querySelector('button.active') || seg.querySelector('button')
    }));

    // Special case: age calculator uses a manual "Calculate" button rather
    // than live recalculation on input.
    const calcBtn = scope.querySelector('#ageBtn');

    const row = document.createElement('div');
    row.className = 'result-actions';
    row.style.cssText = 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;';
    row.innerHTML =
      '<button type="button" class="ghost result-reset" style="font-size:12px;padding:8px 14px;">Reset</button>'+
      '<button type="button" class="ghost result-copy" style="font-size:12px;padding:8px 14px;">Copy result</button>'+
      '<button type="button" class="ghost result-link" style="font-size:12px;padding:8px 14px;">Copy link</button>';
    readout.appendChild(row);

    const resetBtn = row.querySelector('.result-reset');
    const copyBtn = row.querySelector('.result-copy');
    const linkBtn = row.querySelector('.result-link');

    resetBtn.addEventListener('click', () => {
      defaults.forEach(d => {
        if(d.kind === 'checkbox') d.el.checked = d.value;
        else d.el.value = d.value;
        d.el.dispatchEvent(new Event('input', {bubbles:true}));
        d.el.dispatchEvent(new Event('change', {bubbles:true}));
      });
      segDefaults.forEach(({activeBtn}) => { if(activeBtn) activeBtn.click(); });
      if(calcBtn) calcBtn.click();
    });

    copyBtn.addEventListener('click', () => {
      const labels = Array.from(readout.querySelectorAll('.r-label'));
      const lines = [];
      labels.forEach(label => {
        const val = label.nextElementSibling;
        if(val && (val.classList.contains('r-value') || val.classList.contains('r-sub'))){
          const text = val.textContent.trim();
          if(text) lines.push(label.textContent.trim() + ': ' + text);
        }
      });
      const text = lines.length ? lines.join('\n') : readout.textContent.replace(/\s+/g,' ').trim();
      if(!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = orig; }, 1500);
      }).catch(() => {});
    });

    linkBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        const orig = linkBtn.textContent;
        linkBtn.textContent = 'Link copied!';
        setTimeout(() => { linkBtn.textContent = orig; }, 1500);
      }).catch(() => {});
    });
  });

  // Top-level tab groups (discount, investment) sit outside .card, as
  // siblings of the tab-panel wrapper — tracked separately so a shared link
  // can also open directly to a specific tab.
  const pageTabs = Array.from(document.querySelectorAll('.tabs'))
    .filter(t => t.id)
    .map(t => ({tabs:t, id:t.id}));

  // ---- Load state from the URL on page load ----
  function loadFromURL(){
    const params = new URLSearchParams(window.location.search);
    if([...params].length === 0) return;

    pageTabs.forEach(({tabs, id}) => {
      const val = params.get(id);
      if(val==null) return;
      const btn = Array.from(tabs.querySelectorAll('button')).find(b => b.dataset.tab === val);
      if(btn) btn.click();
    });
    pageSegs.forEach(({seg, id}) => {
      const val = params.get(id);
      if(val==null) return;
      const btn = Array.from(seg.querySelectorAll('button')).find(b => Object.values(b.dataset).includes(val));
      if(btn) btn.click();
    });
    pageInputs.forEach(({el, id, kind}) => {
      if(!params.has(id)) return;
      const val = params.get(id);
      if(kind === 'checkbox') el.checked = (val === '1');
      else el.value = val;
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
    });
  }

  // ---- Sync current state to the URL (replaceState, no new history entries) ----
  let urlSyncTimer = null;
  function syncToURL(){
    clearTimeout(urlSyncTimer);
    urlSyncTimer = setTimeout(() => {
      const params = new URLSearchParams();
      pageTabs.forEach(({tabs, id}) => {
        const active = tabs.querySelector('button.active');
        if(active && active.dataset.tab) params.set(id, active.dataset.tab);
      });
      pageSegs.forEach(({seg, id}) => {
        const active = seg.querySelector('button.active');
        if(active){
          const val = Object.values(active.dataset)[0];
          if(val!=null) params.set(id, val);
        }
      });
      pageInputs.forEach(({el, id, kind, defaultValue}) => {
        const current = kind==='checkbox' ? el.checked : el.value;
        if(kind==='checkbox'){
          if(current !== defaultValue) params.set(id, current ? '1' : '0');
        } else if(String(current) !== String(defaultValue)){
          params.set(id, current);
        }
      });
      const qs = params.toString();
      const newUrl = window.location.pathname + (qs ? '?'+qs : '');
      window.history.replaceState(null, '', newUrl);
    }, 300);
  }

  loadFromURL();

  pageInputs.forEach(({el}) => {
    el.addEventListener('input', syncToURL);
    el.addEventListener('change', syncToURL);
  });
  pageSegs.forEach(({seg}) => seg.addEventListener('click', () => setTimeout(syncToURL, 0)));
  pageTabs.forEach(({tabs}) => tabs.addEventListener('click', () => setTimeout(syncToURL, 0)));
})();

// ---- Salary calculator ----
(function(){
  if(!document.getElementById('salAmt')) return;
  function money(n){
    const cur = document.getElementById('salCur').value;
    return cur+n.toLocaleString(undefined,{maximumFractionDigits:2});
  }
  function calc(){
    const amt = parseFloat(document.getElementById('salAmt').value)||0;
    const period = document.getElementById('salPeriod').value;
    const hours = parseFloat(document.getElementById('salHours').value)||0;
    const days = parseFloat(document.getElementById('salDays').value)||0;
    const weeks = parseFloat(document.getElementById('salWeeks').value)||0;

    let annual = 0;
    if(period==='hour') annual = amt*hours*weeks;
    else if(period==='day') annual = amt*days*weeks;
    else if(period==='week') annual = amt*weeks;
    else if(period==='biweek') annual = amt*(weeks/2);
    else if(period==='semimonth') annual = amt*24;
    else if(period==='month') annual = amt*12;
    else if(period==='year') annual = amt;

    const hourly = (hours*weeks)>0 ? annual/(hours*weeks) : 0;
    const daily = (days*weeks)>0 ? annual/(days*weeks) : 0;
    const weekly = weeks>0 ? annual/weeks : 0;
    const biweekly = weeks>0 ? annual/(weeks/2) : 0;
    const semimonth = annual/24;
    const monthly = annual/12;

    document.getElementById('salHourly').textContent = money(hourly);
    document.getElementById('salDaily').textContent = money(daily);
    document.getElementById('salWeekly').textContent = money(weekly);
    document.getElementById('salBiweekly').textContent = money(biweekly);
    document.getElementById('salSemimonth').textContent = money(semimonth);
    document.getElementById('salMonthly').textContent = money(monthly);
    document.getElementById('salAnnual').textContent = money(annual);
  }
  ['salAmt','salCur','salPeriod','salHours','salDays','salWeeks'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Sales tax calculator ----
(function(){
  if(!document.getElementById('stAmt')) return;
  const seg = document.getElementById('stModeSeg');
  const amtLabel = document.getElementById('stAmtLabel');
  function money(n){
    const cur = document.getElementById('stCur').value;
    return cur+n.toLocaleString(undefined,{maximumFractionDigits:2});
  }
  function mode(){
    const btn = seg.querySelector('button.active');
    return btn ? btn.dataset.mode : 'add';
  }
  function calc(){
    const amt = parseFloat(document.getElementById('stAmt').value)||0;
    const rate = (parseFloat(document.getElementById('stRate').value)||0)/100;
    let before, tax, total;
    if(mode()==='add'){
      before = amt; tax = before*rate; total = before+tax;
    } else {
      total = amt; before = total/(1+rate); tax = total-before;
    }
    document.getElementById('stBefore').textContent = money(before);
    document.getElementById('stTax').textContent = money(tax);
    document.getElementById('stTotal').textContent = money(total);
  }
  seg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    amtLabel.textContent = btn.dataset.mode==='add' ? 'Price before tax' : 'Total price (tax included)';
    calc();
  });
  ['stAmt','stCur','stRate'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- CD calculator ----
(function(){
  if(!document.getElementById('cdAmt')) return;
  let lastInterest = 0, lastYears = 1;
  function calc(){
    const P = parseFloat(document.getElementById('cdAmt').value)||0;
    const apy = (parseFloat(document.getElementById('cdRate').value)||0)/100;
    const months = parseFloat(document.getElementById('cdTerm').value)||12;
    const years = months/12;
    const maturity = P*Math.pow(1+apy, years);
    const interest = maturity-P;
    document.getElementById('cdInvested').textContent = '$'+Math.round(P).toLocaleString();
    document.getElementById('cdInterest').textContent = '$'+interest.toFixed(2);
    document.getElementById('cdMaturity').textContent = '$'+maturity.toFixed(2);
    lastInterest = interest; lastYears = years;
    calcPenalty(maturity);
  }
  function calcPenalty(maturity){
    const penEl = document.getElementById('cdPenaltyMonths');
    if(!penEl) return;
    const penaltyMonths = parseFloat(penEl.value)||0;
    const monthlyInterest = lastYears>0 ? (lastInterest/lastYears)/12 : 0;
    const penaltyAmt = monthlyInterest*penaltyMonths;
    document.getElementById('cdPenaltyAmt').textContent = '$'+penaltyAmt.toFixed(2);
    document.getElementById('cdPenaltyNet').textContent = '$'+Math.max(maturity-penaltyAmt,0).toFixed(2);
  }
  ['cdAmt','cdRate','cdTerm'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  const penEl = document.getElementById('cdPenaltyMonths');
  if(penEl){
    penEl.addEventListener('input', calc);
    penEl.addEventListener('change', calc);
  }
  calc();
})();

// ---- Ideal weight calculator ----
(function(){
  if(!document.getElementById('iwH')) return;
  const sexSeg = document.getElementById('iwSexSeg');
  const unitEl = document.getElementById('iwUnit');
  const cmWrap = document.getElementById('iwCmWrap');
  const ftWrap = document.getElementById('iwFtWrap');

  function fmt(kg){
    if(kg<=0) return '—';
    const lb = kg*2.20462;
    return kg.toFixed(1)+' kg ('+lb.toFixed(1)+' lb)';
  }

  function heightCm(){
    if(unitEl.value==='cm'){
      return parseFloat(document.getElementById('iwH').value)||0;
    }
    const ft = parseFloat(document.getElementById('iwFt').value)||0;
    const inch = parseFloat(document.getElementById('iwIn').value)||0;
    return (ft*12+inch)*2.54;
  }

  function calc(){
    const cm = heightCm();
    const totalInches = cm/2.54;
    const overFeet = totalInches-60;
    const sexBtn = sexSeg.querySelector('button.active');
    const male = !sexBtn || sexBtn.dataset.sex==='male';

    if(cm<=0){
      ['iwDevine','iwRobinson','iwMiller','iwHamwi','iwAvg'].forEach(id=>{
        document.getElementById(id).textContent = '—';
      });
      document.getElementById('iwBmiRange').textContent = '—';
      return;
    }

    const devine = male ? 50+2.3*overFeet : 45.5+2.3*overFeet;
    const robinson = male ? 52+1.9*overFeet : 49+1.7*overFeet;
    const miller = male ? 56.2+1.41*overFeet : 53.1+1.36*overFeet;
    const hamwi = male ? 48+2.7*overFeet : 45.5+2.2*overFeet;
    const avg = (devine+robinson+miller+hamwi)/4;

    document.getElementById('iwDevine').textContent = fmt(devine);
    document.getElementById('iwRobinson').textContent = fmt(robinson);
    document.getElementById('iwMiller').textContent = fmt(miller);
    document.getElementById('iwHamwi').textContent = fmt(hamwi);
    document.getElementById('iwAvg').textContent = fmt(avg);

    const m = cm/100;
    const low = 18.5*m*m, high = 24.9*m*m;
    document.getElementById('iwBmiRange').textContent = fmt(low).split(' (')[0]+' – '+fmt(high);
  }

  if(sexSeg){
    sexSeg.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      sexSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      calc();
    });
  }
  unitEl.addEventListener('change', ()=>{
    const isCm = unitEl.value==='cm';
    cmWrap.style.display = isCm ? '' : 'none';
    ftWrap.style.display = isCm ? 'none' : '';
    calc();
  });
  ['iwH','iwFt','iwIn'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Grade calculator ----
(function(){
  const rowsWrap = document.getElementById('gcRows');
  if(!rowsWrap) return;
  const addBtn = document.getElementById('gcAddRow');

  function letterFor(pct){
    if(pct>=90) return 'A';
    if(pct>=80) return 'B';
    if(pct>=70) return 'C';
    if(pct>=60) return 'D';
    return 'F';
  }

  let rowId = 0;
  function addRow(name, weight, score){
    rowId++;
    const id = 'gcRow'+rowId;
    const row = document.createElement('div');
    row.className = 'row3';
    row.id = id;
    row.style.marginBottom = '10px';
    row.innerHTML = `
      <div class="field"><label>Category</label><input type="text" class="gcCatName" value="${name||''}" placeholder="e.g. Homework"></div>
      <div class="field"><label>Weight (%)</label><input type="number" class="gcWeight" value="${weight!=null?weight:20}" min="0" step="1"></div>
      <div class="field"><label>Score (%)</label><input type="number" class="gcScore" value="${score!=null?score:90}" min="0" step="0.1"></div>
    `;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'ghost';
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginBottom = '14px';
    removeBtn.addEventListener('click', ()=>{ row.remove(); calc(); });
    row.querySelector('.gcScore').closest('.field').after(removeBtn);
    rowsWrap.appendChild(row);
    row.querySelectorAll('input').forEach(el=>{
      el.addEventListener('input', calc);
      el.addEventListener('change', calc);
    });
  }

  function calc(){
    let totalWeight = 0, totalPoints = 0;
    document.querySelectorAll('#gcRows .row3').forEach(row=>{
      const weight = parseFloat(row.querySelector('.gcWeight').value)||0;
      const score = parseFloat(row.querySelector('.gcScore').value)||0;
      totalWeight += weight;
      totalPoints += weight*score;
    });
    const grade = totalWeight>0 ? totalPoints/totalWeight : 0;
    document.getElementById('gcTotalWeight').textContent = totalWeight.toFixed(1)+'%';
    document.getElementById('gcResult').textContent = grade.toFixed(1)+'%';
    document.getElementById('gcLetter').textContent = totalWeight>0 ? letterFor(grade) : '—';
  }

  addBtn.addEventListener('click', ()=>addRow());
  addRow('Homework', 20, 92);
  addRow('Midterm', 30, 85);
  addRow('Quizzes', 15, 88);
  calc();

  // ---- Final exam grade needed ----
  function calcFinal(){
    const currentEl = document.getElementById('fnCurrent');
    if(!currentEl) return;
    const current = parseFloat(currentEl.value)||0;
    const target = parseFloat(document.getElementById('fnTarget').value)||0;
    const weight = (parseFloat(document.getElementById('fnWeight').value)||0)/100;
    const neededEl = document.getElementById('fnNeeded');
    const feasibleEl = document.getElementById('fnFeasible');
    if(weight<=0){
      neededEl.textContent = '—';
      feasibleEl.textContent = 'Enter the final\'s weight to calculate';
      return;
    }
    const needed = (target - current*(1-weight))/weight;
    neededEl.textContent = needed.toFixed(1)+'%';
    if(needed>100){
      feasibleEl.textContent = 'Not achievable — would need above 100%';
    } else if(needed<=0){
      feasibleEl.textContent = 'Already locked in, even with a 0% on the final';
    } else {
      feasibleEl.textContent = 'Achievable';
    }
  }
  ['fnCurrent','fnTarget','fnWeight'].forEach(id=>{
    const el = document.getElementById(id);
    if(el){ el.addEventListener('input', calcFinal); el.addEventListener('change', calcFinal); }
  });
  calcFinal();
})();

// ---- Fraction calculator ----
(function(){
  if(!document.getElementById('frA1')) return;

  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a||1; }

  function simplify(num, den){
    if(den===0) return null;
    if(den<0){ num=-num; den=-den; }
    const g = gcd(num, den);
    return [num/g, den/g];
  }

  function toMixed(num, den){
    const sign = (num<0) !== (den<0) ? '-' : '';
    num = Math.abs(num); den = Math.abs(den);
    const whole = Math.floor(num/den);
    const rem = num%den;
    if(rem===0) return sign+whole;
    if(whole===0) return sign+num+'/'+den;
    return sign+whole+' '+rem+'/'+den;
  }

  function opSeg(){
    const seg = document.getElementById('frOpSeg');
    const btn = seg.querySelector('button.active');
    return btn ? btn.dataset.op : 'add';
  }

  function calc(){
    const a1 = parseInt(document.getElementById('frA1').value)||0;
    const b1 = parseInt(document.getElementById('frB1').value)||0;
    const a2 = parseInt(document.getElementById('frA2').value)||0;
    const b2 = parseInt(document.getElementById('frB2').value)||0;
    const resEl = document.getElementById('frResult');
    const decEl = document.getElementById('frDecimal');
    const mixEl = document.getElementById('frMixed');
    if(b1===0 || b2===0){
      resEl.textContent = 'Undefined (denominator is 0)';
      decEl.textContent = '—'; mixEl.textContent = '—';
      return;
    }
    const op = opSeg();
    let num, den;
    if(op==='add'){ num = a1*b2 + a2*b1; den = b1*b2; }
    else if(op==='sub'){ num = a1*b2 - a2*b1; den = b1*b2; }
    else if(op==='mul'){ num = a1*a2; den = b1*b2; }
    else { if(a2===0){ resEl.textContent='Undefined (divide by zero)'; decEl.textContent='—'; mixEl.textContent='—'; return; } num = a1*b2; den = b1*a2; }

    const simp = simplify(num, den);
    resEl.textContent = simp[0]+'/'+simp[1];
    decEl.textContent = (simp[1]!==0 ? (simp[0]/simp[1]) : 0).toLocaleString(undefined,{maximumFractionDigits:6});
    mixEl.textContent = toMixed(simp[0], simp[1]);
  }

  const seg = document.getElementById('frOpSeg');
  seg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  ['frA1','frB1','frA2','frB2'].forEach(id=>{
    document.getElementById(id).addEventListener('input', calc);
  });
  calc();

  // ---- Simplify a fraction ----
  function calcSimplify(){
    const a = parseInt(document.getElementById('smA').value)||0;
    const b = parseInt(document.getElementById('smB').value)||0;
    const resEl = document.getElementById('smResult');
    const decEl = document.getElementById('smDecimal');
    if(b===0){ resEl.textContent='Undefined (denominator is 0)'; decEl.textContent='—'; return; }
    const simp = simplify(a, b);
    resEl.textContent = simp[0]+'/'+simp[1];
    decEl.textContent = (simp[0]/simp[1]).toLocaleString(undefined,{maximumFractionDigits:6});
  }
  ['smA','smB'].forEach(id=>{
    document.getElementById(id).addEventListener('input', calcSimplify);
  });
  calcSimplify();
})();

// ---- Statistics calculator ----
(function(){
  const input = document.getElementById('statInput');
  if(!input) return;

  function parseNums(text){
    return text.split(/[,\s]+/).map(s=>parseFloat(s)).filter(n=>!isNaN(n));
  }

  function calc(){
    const nums = parseNums(input.value);
    const n = nums.length;
    if(n===0){
      ['statCount','statSum','statMean','statMedian','statRange'].forEach(id=>{ document.getElementById(id).textContent='0'; });
      ['statMode','statMinMax','statVariance','statStdDev'].forEach(id=>{ document.getElementById(id).textContent='—'; });
      return;
    }
    const sum = nums.reduce((a,b)=>a+b,0);
    const mean = sum/n;
    const sorted = [...nums].sort((a,b)=>a-b);
    const mid = Math.floor(n/2);
    const median = n%2===0 ? (sorted[mid-1]+sorted[mid])/2 : sorted[mid];
    const min = sorted[0], max = sorted[n-1];

    const freq = {};
    nums.forEach(x=>{ freq[x] = (freq[x]||0)+1; });
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.keys(freq).filter(k=>freq[k]===maxFreq).map(Number);
    const modeText = maxFreq<=1 ? 'None (all values unique)' : modes.sort((a,b)=>a-b).join(', ');

    const sqDiffs = nums.reduce((a,x)=>a+Math.pow(x-mean,2),0);
    const popVar = sqDiffs/n;
    const sampVar = n>1 ? sqDiffs/(n-1) : 0;
    const popStd = Math.sqrt(popVar);
    const sampStd = Math.sqrt(sampVar);

    const fmt = x => Number.isInteger(x) ? x.toString() : x.toLocaleString(undefined,{maximumFractionDigits:4});

    document.getElementById('statCount').textContent = n.toString();
    document.getElementById('statSum').textContent = fmt(sum);
    document.getElementById('statMean').textContent = fmt(mean);
    document.getElementById('statMedian').textContent = fmt(median);
    document.getElementById('statMode').textContent = modeText;
    document.getElementById('statMinMax').textContent = fmt(min)+' / '+fmt(max);
    document.getElementById('statRange').textContent = fmt(max-min);
    document.getElementById('statVariance').textContent = fmt(popVar)+' / '+(n>1?fmt(sampVar):'—');
    document.getElementById('statStdDev').textContent = fmt(popStd)+' / '+(n>1?fmt(sampStd):'—');
  }

  input.addEventListener('input', calc);
  calc();
})();

// ---- Time calculator (duration add/subtract + hours worked) ----
(function(){
  if(!document.getElementById('tcH1')) return;
  const seg = document.getElementById('tcOpSeg');

  function fmtHMS(totalSeconds){
    const sign = totalSeconds<0 ? '-' : '';
    totalSeconds = Math.abs(Math.round(totalSeconds));
    const h = Math.floor(totalSeconds/3600);
    const m = Math.floor((totalSeconds%3600)/60);
    const s = totalSeconds%60;
    return sign+h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  }

  function calc(){
    const h1 = parseFloat(document.getElementById('tcH1').value)||0;
    const m1 = parseFloat(document.getElementById('tcM1').value)||0;
    const s1 = parseFloat(document.getElementById('tcS1').value)||0;
    const h2 = parseFloat(document.getElementById('tcH2').value)||0;
    const m2 = parseFloat(document.getElementById('tcM2').value)||0;
    const s2 = parseFloat(document.getElementById('tcS2').value)||0;
    const op = (seg.querySelector('button.active')||{}).dataset ? seg.querySelector('button.active').dataset.op : 'add';

    const t1 = h1*3600+m1*60+s1;
    const t2 = h2*3600+m2*60+s2;
    const total = op==='add' ? t1+t2 : t1-t2;

    document.getElementById('tcResult').textContent = fmtHMS(total);
    document.getElementById('tcTotalMin').textContent = (total/60).toLocaleString(undefined,{maximumFractionDigits:2});
    document.getElementById('tcTotalHours').textContent = (total/3600).toLocaleString(undefined,{maximumFractionDigits:4});
  }

  seg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  ['tcH1','tcM1','tcS1','tcH2','tcM2','tcS2'].forEach(id=>{
    document.getElementById(id).addEventListener('input', calc);
  });
  calc();

  // ---- Hours worked between two clock times ----
  function calcHours(){
    const startEl = document.getElementById('hwStart');
    if(!startEl) return;
    const [sh,sm] = startEl.value.split(':').map(Number);
    const [eh,em] = document.getElementById('hwEnd').value.split(':').map(Number);
    if([sh,sm,eh,em].some(v=>isNaN(v))) return;
    const breakMin = parseFloat(document.getElementById('hwBreak').value)||0;
    const rate = parseFloat(document.getElementById('hwRate').value)||0;

    let startMin = sh*60+sm;
    let endMin = eh*60+em;
    if(endMin<startMin) endMin += 24*60;
    const workedMin = Math.max(endMin-startMin-breakMin, 0);
    const workedHours = workedMin/60;

    document.getElementById('hwHM').textContent = Math.floor(workedMin/60)+':'+String(Math.round(workedMin%60)).padStart(2,'0');
    document.getElementById('hwDecimal').textContent = workedHours.toLocaleString(undefined,{maximumFractionDigits:2});
    document.getElementById('hwPay').textContent = rate>0 ? '$'+(workedHours*rate).toFixed(2) : '—';
  }
  ['hwStart','hwEnd','hwBreak','hwRate'].forEach(id=>{
    const el = document.getElementById(id);
    if(el){ el.addEventListener('input', calcHours); el.addEventListener('change', calcHours); }
  });
  calcHours();
})();

// ---- Random number generator ----
(function(){
  const genBtn = document.getElementById('rngGenerate');
  if(!genBtn) return;

  function randInt(min, max){
    return Math.floor(Math.random()*(max-min+1))+min;
  }

  function generate(){
    let min = parseInt(document.getElementById('rngMin').value)||0;
    let max = parseInt(document.getElementById('rngMax').value)||0;
    if(min>max){ [min,max]=[max,min]; }
    const count = Math.max(parseInt(document.getElementById('rngCount').value)||1, 1);
    const unique = document.getElementById('rngUnique').checked;
    const sort = document.getElementById('rngSort').checked;
    const warnEl = document.getElementById('rngWarning');
    const rangeSize = max-min+1;

    if(unique && count>rangeSize){
      warnEl.textContent = `Can't generate ${count} unique numbers — the range ${min}–${max} only has ${rangeSize} possible values.`;
      document.getElementById('rngResult').textContent = '—';
      return;
    }
    warnEl.textContent = '';

    let results = [];
    if(unique){
      const pool = [];
      for(let i=min;i<=max;i++) pool.push(i);
      for(let i=pool.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [pool[i],pool[j]] = [pool[j],pool[i]];
      }
      results = pool.slice(0,count);
    } else {
      for(let i=0;i<count;i++) results.push(randInt(min,max));
    }
    if(sort) results.sort((a,b)=>a-b);
    document.getElementById('rngResult').textContent = results.join(', ');
  }

  genBtn.addEventListener('click', generate);
  generate();

  // ---- Coin flip & dice roll ----
  const coinBtn = document.getElementById('coinFlip');
  if(coinBtn){
    coinBtn.addEventListener('click', ()=>{
      document.getElementById('coinResult').textContent = Math.random()<0.5 ? 'Heads' : 'Tails';
    });
  }
  const diceBtn = document.getElementById('diceRoll');
  if(diceBtn){
    diceBtn.addEventListener('click', ()=>{
      const count = Math.max(parseInt(document.getElementById('diceCount').value)||1, 1);
      const sides = parseInt(document.getElementById('diceSides').value)||6;
      const rolls = [];
      for(let i=0;i<count;i++) rolls.push(randInt(1,sides));
      document.getElementById('diceResult').textContent = rolls.join(', ');
      document.getElementById('diceSum').textContent = rolls.reduce((a,b)=>a+b,0).toString();
    });
  }
})();

// ---- Feedback chatbot widget (injected on every page) ----
(function(){
  if (window.__TB_EMBED__) return;
  // --- Fill these in after creating a free EmailJS account (emailjs.com):
  // 1. Add an Email Service connected to helpdesktallybench@gmail.com.
  // 2. Create an Email Template with a fixed "To email" of helpdesktallybench@gmail.com
  //    and template variables: {{category}} {{message}} {{contact_email}} {{page_url}} {{user_agent}} {{sent_at}}
  // 3. Paste your Public Key, Service ID, and Template ID below.
  const EMAILJS_PUBLIC_KEY = 'Ag-smkHrLW_YQrNJF';
  const EMAILJS_SERVICE_ID = 'service_32kwcs6';
  const EMAILJS_TEMPLATE_ID = 'template_wn7kbdk';
  const TEAM_EMAIL = 'helpdesktallybench@gmail.com';
  const isConfigured = () =>
    EMAILJS_PUBLIC_KEY.indexOf('YOUR_') !== 0 &&
    EMAILJS_SERVICE_ID.indexOf('YOUR_') !== 0 &&
    EMAILJS_TEMPLATE_ID.indexOf('YOUR_') !== 0;

  const FAQS = [
    { kw:['free','cost','price','pay','subscription'], a:"Every calculator on TallyBench is free, with no sign-up." },
    { kw:['data','privacy','store','stored','saved','tracking'], a:'Your calculator inputs never leave your browser — nothing is stored on our servers. See the <a href="privacy-policy.html">Privacy Policy</a> for how ad cookies work.' },
    { kw:['advice','professional','doctor','lawyer','financial advisor'], a:"These tools are for quick estimates and general math, not professional financial, tax, medical, or legal advice — please check anything important with a qualified professional." },
    { kw:['accurate','accuracy','correct','formula','trust'], a:"We aim for accurate, well-sourced formulas across every calculator, but always double check anything with real financial or health stakes. Spotted something that looks off? Tell me below and I'll pass it to the team." },
    { kw:['country','region','currency','india','us','uk','europe'], a:"Several calculators support multiple countries or currencies (tax, GST/VAT, retirement, and more) — look for a country or currency dropdown on the tool itself." },
    { kw:['app','download','install','mobile'], a:'TallyBench works great in your mobile browser — use "Add to Home Screen" for an app-like icon, no app store needed.' },
    { kw:['contact','email','reach','support'], a:'You can always reach the team directly at <a href="mailto:'+TEAM_EMAIL+'">'+TEAM_EMAIL+'</a>, or just tell me here and I\'ll send it for you.' }
  ];

  function matchFaq(text){
    const t = text.toLowerCase();
    let best = null, bestScore = 0;
    FAQS.forEach(f=>{
      let score = 0;
      f.kw.forEach(k=>{ if(t.indexOf(k) !== -1) score++; });
      if(score > bestScore){ bestScore = score; best = f; }
    });
    return bestScore > 0 ? best : null;
  }

  // ---- Rate limiting (protects the free EmailJS quota from abuse) ----
  const LIMIT_KEY = 'tb_feedback_limit';
  const MAX_PER_DAY = 5;
  const MIN_GAP_MS = 20000;
  function canSend(){
    let state;
    try { state = JSON.parse(localStorage.getItem(LIMIT_KEY)) || {}; } catch(e){ state = {}; }
    const today = new Date().toISOString().slice(0,10);
    if(state.day !== today){ state = { day: today, count: 0, last: 0 }; }
    if(state.count >= MAX_PER_DAY) return { ok:false, reason:'daily' };
    if(Date.now() - (state.last||0) < MIN_GAP_MS) return { ok:false, reason:'fast' };
    return { ok:true, state };
  }
  function recordSend(state){
    state.count = (state.count||0) + 1;
    state.last = Date.now();
    localStorage.setItem(LIMIT_KEY, JSON.stringify(state));
  }

  // ---- EmailJS lazy loader ----
  let emailjsReady = null;
  function loadEmailJS(){
    if(emailjsReady) return emailjsReady;
    emailjsReady = new Promise((resolve, reject)=>{
      if(window.emailjs){ resolve(window.emailjs); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload = ()=>{
        try{
          window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
          resolve(window.emailjs);
        } catch(e){ reject(e); }
      };
      s.onerror = ()=> reject(new Error('EmailJS failed to load'));
      document.head.appendChild(s);
    });
    return emailjsReady;
  }

  // ---- Widget DOM ----
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'tb-chat-toggle';
  toggle.setAttribute('aria-label', 'Feedback and help');
  toggle.textContent = '💬';

  const panel = document.createElement('div');
  panel.className = 'tb-chat-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="tb-chat-head">' +
      '<div><strong>TallyBench Help</strong><span>Usually replies by email</span></div>' +
      '<button type="button" class="tb-chat-close" aria-label="Close">&#10005;</button>' +
    '</div>' +
    '<div class="tb-chat-log" id="tbChatLog"></div>' +
    '<div class="tb-quick-replies" id="tbQuickReplies"></div>' +
    '<div class="tb-chat-form" id="tbChatForm" hidden></div>';

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  const logEl = panel.querySelector('#tbChatLog');
  const quickEl = panel.querySelector('#tbQuickReplies');
  const formEl = panel.querySelector('#tbChatForm');
  const closeBtn = panel.querySelector('.tb-chat-close');

  function addMsg(html, sender){
    const div = document.createElement('div');
    div.className = 'tb-msg ' + (sender === 'user' ? 'tb-msg-user' : 'tb-msg-bot');
    div.innerHTML = html;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function showQuickReplies(options){
    quickEl.innerHTML = '';
    formEl.hidden = true;
    options.forEach(opt=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt.label;
      btn.addEventListener('click', opt.onClick);
      quickEl.appendChild(btn);
    });
  }

  function clearQuickReplies(){ quickEl.innerHTML = ''; }

  function showTextForm(opts){
    clearQuickReplies();
    formEl.hidden = false;
    formEl.innerHTML =
      '<textarea placeholder="' + opts.placeholder + '"></textarea>' +
      '<input type="text" class="tb-chat-honeypot" tabindex="-1" autocomplete="off">' +
      '<div class="btn-row"><button type="button" class="tb-submit">' + (opts.submitLabel||'Send') + '</button></div>';
    const textarea = formEl.querySelector('textarea');
    const honeypot = formEl.querySelector('.tb-chat-honeypot');
    const submit = () => {
      const val = textarea.value.trim();
      if(!val) return;
      if(honeypot.value){ return; } // bot filled the hidden field — silently drop
      opts.onSubmit(val);
    };
    formEl.querySelector('.tb-submit').addEventListener('click', submit);
    textarea.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); submit(); }
    });
    textarea.focus();
  }

  function showEmailForm(onSubmit){
    clearQuickReplies();
    formEl.hidden = false;
    formEl.innerHTML =
      '<input type="email" placeholder="you@example.com (optional)">' +
      '<p class="tb-chat-hint">Leave blank to send anonymously — we\'ll only use this to reply.</p>' +
      '<div class="btn-row"><button type="button" class="tb-submit">Send feedback</button><button type="button" class="ghost tb-skip">Skip</button></div>';
    const input = formEl.querySelector('input');
    formEl.querySelector('.tb-submit').addEventListener('click', ()=> onSubmit(input.value.trim()));
    formEl.querySelector('.tb-skip').addEventListener('click', ()=> onSubmit(''));
    input.focus();
  }

  function categoryPlaceholder(category){
    if(category === 'bug') return 'Which calculator, and what happened?';
    if(category === 'suggestion') return 'What calculator or feature would help?';
    return 'Type your message…';
  }

  function categoryPrompt(category){
    if(category === 'bug') return "Sorry about that — tell me which calculator and what went wrong.";
    if(category === 'suggestion') return "I like it already. What should we build?";
    if(category === 'question') return "Got it, I'll pass this question straight to the team.";
    return "Go ahead — tell me what's on your mind.";
  }

  function startFeedback(category, prefillMessage){
    if(prefillMessage){
      askForEmail(category, prefillMessage);
      return;
    }
    addMsg(categoryPrompt(category), 'bot');
    showTextForm({
      placeholder: categoryPlaceholder(category),
      onSubmit: (text)=>{ addMsg(text, 'user'); askForEmail(category, text); }
    });
  }

  function askForEmail(category, message){
    addMsg("Want us to be able to reply? Leave your email, or skip.", 'bot');
    showEmailForm((email)=> sendFeedback(category, message, email));
  }

  function sendFeedback(category, message, email){
    formEl.hidden = true;
    clearQuickReplies();

    const gate = canSend();
    if(!gate.ok){
      const reason = gate.reason === 'daily'
        ? "You've hit today's feedback limit on this device."
        : "That was quick — give it a few seconds and try again.";
      addMsg(reason + ' In the meantime, email us directly at <a href="mailto:'+TEAM_EMAIL+'">'+TEAM_EMAIL+'</a>.', 'bot');
      showQuickReplies([{ label: 'Close', onClick: closePanel }]);
      return;
    }

    if(!isConfigured()){
      const subject = encodeURIComponent('TallyBench feedback: ' + category);
      const body = encodeURIComponent(message + (email ? ('\n\nReply to: ' + email) : ''));
      addMsg('Thanks! The team inbox isn\'t fully wired up yet — please send this directly: <a href="mailto:'+TEAM_EMAIL+'?subject='+subject+'&body='+body+'">email us your message</a>.', 'bot');
      showQuickReplies([{ label: 'Close', onClick: closePanel }]);
      return;
    }

    addMsg('Sending…', 'bot');
    loadEmailJS().then(emailjs=>{
      return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        category: category,
        message: message,
        contact_email: email || '(not provided)',
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        sent_at: new Date().toLocaleString()
      });
    }).then(()=>{
      recordSend(gate.state);
      addMsg("Thanks — that's on its way to our team. 🎉", 'bot');
      showQuickReplies([
        { label: 'Send another', onClick: startOver },
        { label: 'Close', onClick: closePanel }
      ]);
    }).catch(()=>{
      addMsg('That didn\'t go through. Please email us directly at <a href="mailto:'+TEAM_EMAIL+'">'+TEAM_EMAIL+'</a> — sorry for the hassle.', 'bot');
      showQuickReplies([{ label: 'Close', onClick: closePanel }]);
    });
  }

  function startQuestion(){
    clearQuickReplies();
    showTextForm({
      placeholder: 'Type your question…',
      onSubmit: handleQuestion
    });
  }

  function handleQuestion(text){
    addMsg(text, 'user');
    const match = matchFaq(text);
    if(match){
      addMsg(match.a, 'bot');
      showQuickReplies([
        { label: 'That answers it', onClick: ()=>{ addMsg('Glad I could help! 🎉', 'bot'); showQuickReplies([{ label:'Ask something else', onClick:startQuestion }, { label:'Close', onClick:closePanel }]); } },
        { label: 'Send to the team instead', onClick: ()=> startFeedback('question', text) }
      ]);
    } else {
      addMsg("I don't have a canned answer for that — want me to send it to the team instead?", 'bot');
      showQuickReplies([
        { label: 'Yes, send it', onClick: ()=> startFeedback('question', text) },
        { label: 'Try again', onClick: startQuestion }
      ]);
    }
  }

  function startOver(greeting){
    logEl.innerHTML = '';
    addMsg(greeting || "Hi again! 👋 What can I do for you?", 'bot');
    showQuickReplies([
      { label: '🐛 Report a bug', onClick: ()=> startFeedback('bug') },
      { label: '💡 Suggest a calculator', onClick: ()=> startFeedback('suggestion') },
      { label: '❓ Ask a question', onClick: startQuestion },
      { label: '💬 General feedback', onClick: ()=> startFeedback('general') }
    ]);
  }

  function closePanel(){ panel.hidden = true; }

  let opened = false;
  toggle.addEventListener('click', ()=>{
    panel.hidden = !panel.hidden;
    if(!panel.hidden && !opened){
      opened = true;
      startOver("Hi! 👋 I'm the TallyBench helper. What can I do for you?");
    }
  });
  closeBtn.addEventListener('click', closePanel);

  // ---- Keep the widget clear of the cookie/install banners at the bottom ----
  function isVisible(el){
    if(!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }
  function updateOffset(){
    const lifted = isVisible(document.getElementById('cookieConsent')) || isVisible(document.getElementById('installBanner'));
    toggle.classList.toggle('tb-lifted', lifted);
    panel.classList.toggle('tb-lifted', lifted);
  }
  updateOffset();
  new MutationObserver(updateOffset).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class'] });
})();

// ---- Embed widget: "Embed this calculator" (normal view) + stripped embed view (?embed=1) ----
(function(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const toolId = path.replace(/\.html$/, '');
  const canonicalUrl = 'https://tallybench.com/' + path;

  if (window.__TB_EMBED__) {
    // ---- Running inside someone else's <iframe>: strip the site chrome ----
    document.body.classList.add('tb-embed-mode');

    const robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    robotsMeta.content = 'noindex';
    document.head.appendChild(robotsMeta);

    const creditBar = document.createElement('a');
    creditBar.className = 'tb-embed-credit';
    creditBar.href = canonicalUrl;
    creditBar.target = '_top';
    creditBar.rel = 'noopener';
    creditBar.textContent = 'Powered by TallyBench.com';
    document.body.appendChild(creditBar);

    function reportHeight(){
      if (window.parent === window) return;
      window.parent.postMessage({ tbEmbedId: toolId, tbEmbedHeight: document.documentElement.scrollHeight }, '*');
    }
    window.addEventListener('load', reportHeight);
    if (window.ResizeObserver) {
      new ResizeObserver(reportHeight).observe(document.body);
    } else {
      window.addEventListener('resize', reportHeight);
    }
    return;
  }

  // ---- Normal page view: offer an "Embed this calculator" button ----
  const hero = document.querySelector('.hero');
  const firstTool = document.querySelector('.tool .card');
  if (!hero || !firstTool) return; // only on actual calculator pages, not index/about/privacy

  const crumbEl = document.querySelector('.crumb');
  const toolName = crumbEl ? crumbEl.textContent.split('/').pop().trim() : document.title;
  const embedUrl = canonicalUrl + '?embed=1';
  const iframeId = 'tb-embed-' + toolId;

  // The credit line is part of the ONE snippet, not a separate optional step.
  //
  // It used to be step 2 with its own textarea and copy button, and that made
  // it effectively optional — most people paste the first box and stop. That
  // matters more than it sounds: the "Powered by TallyBench" bar rendered
  // inside the iframe is on tallybench.com, not on the host's page, and the
  // embed view is noindex, so it is a self-link worth nothing. This credit
  // line, sitting in the host's own HTML, is the only thing an embed
  // contributes back. One box, one button, credit included by default.
  const creditSnippet = '<p style="font-size:13px;margin:8px 0 0;">Calculator by ' +
    '<a href="' + canonicalUrl + '" rel="noopener">TallyBench</a></p>';

  const iframeSnippet =
    '<iframe id="' + iframeId + '" src="' + embedUrl + '" width="100%" height="640" ' +
    'style="border:0;max-width:640px;" loading="lazy" title="' + toolName + ' — TallyBench"></iframe>\n' +
    '<script>window.addEventListener("message",function(e){if(e.data&&e.data.tbEmbedId==="' + toolId + '"){' +
    'var f=document.getElementById("' + iframeId + '");if(f)f.style.height=e.data.tbEmbedHeight+"px";}});<' + '/script>\n' +
    creditSnippet;

  const row = document.createElement('div');
  row.className = 'tb-embed-row';
  // The embed.html link is added here rather than hand-written into 201 pages:
  // one string change gives every tool page an inbound link to the directory.
  // The old wording — "no attribution beyond the credit link required" — read
  // as though the bar inside the widget was the attribution. It is not; the
  // credit link in the snippet is.
  row.innerHTML = '<span class="tb-embed-hint">Free to use on your own site, including commercially — just keep the credit line that comes with the code. <a href="embed.html">See all embeddable calculators</a>.</span><button type="button" class="ghost" id="tbEmbedOpen">&lt;/&gt; Embed this calculator</button>';
  hero.insertAdjacentElement('afterend', row);

  const backdrop = document.createElement('div');
  backdrop.className = 'tb-embed-backdrop';
  backdrop.hidden = true;
  backdrop.innerHTML =
    '<div class="tb-embed-modal">' +
      '<div class="tb-embed-modal-head"><strong>Embed <span id="tbEmbedToolName"></span></strong>' +
        '<button type="button" class="tb-embed-close" aria-label="Close">&#10005;</button></div>' +
      '<div class="tb-embed-modal-body">' +
        '<label>Paste this where you want the calculator to appear</label>' +
        '<textarea readonly id="tbEmbedIframeCode"></textarea>' +
        '<button type="button" class="ghost tb-embed-copy" data-target="tbEmbedIframeCode">Copy code</button>' +
        '<p class="tb-chat-hint">Includes the credit line — please keep it, it is the only thing we ask in return. The widget reports its own height automatically as visitors use it, so there is no size to guess.</p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(backdrop);

  document.getElementById('tbEmbedToolName').textContent = toolName;
  document.getElementById('tbEmbedIframeCode').value = iframeSnippet;

  document.getElementById('tbEmbedOpen').addEventListener('click', ()=>{ backdrop.hidden = false; });
  backdrop.querySelector('.tb-embed-close').addEventListener('click', ()=>{ backdrop.hidden = true; });
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) backdrop.hidden = true; });
  backdrop.querySelectorAll('.tb-embed-copy').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const ta = document.getElementById(btn.dataset.target);
      ta.select();
      navigator.clipboard.writeText(ta.value).then(()=>{
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(()=>{ btn.textContent = original; }, 1500);
      }).catch(()=>{ /* selection above still lets the user copy manually */ });
    });
  });
})();

// ---- Embed widget on article pages: they have no .hero/.tool .card of
// their own to embed (they're editorial content, not a live tool), so the
// IIFE above skips them entirely. Instead, offer to embed whichever
// calculator the article's own first CTA button already points to — the
// article was written specifically to lead into that tool, so it's the
// natural thing a reader (or a blogger citing the article) would want to
// drop into their own page. Deliberately a separate, self-contained block
// rather than a shared refactor of the logic above, so this can't regress
// the already-working calculator-page embed feature. ----
(function(){
  if (window.__TB_EMBED__) return;
  // Gate on the actual article page-cat, not just the presence of these CSS
  // classes — book.html and venstock.html reuse .article-cta-row/.article-cta-btn
  // for their own CTA styling but aren't articles, and their first CTA (an
  // Amazon link, a mailto: link) isn't a calculator this widget can embed.
  if (document.body.dataset.pageCat !== 'articles') return;
  const ctaRow = document.querySelector('.article-cta-row');
  const firstCta = ctaRow ? ctaRow.querySelector('.article-cta-btn[href]') : null;
  if (!ctaRow || !firstCta) return; // nothing to embed

  const targetFile = firstCta.getAttribute('href');
  if (!/^[\w-]+\.html$/.test(targetFile)) return; // not a local calculator page
  // The primary CTA's own text is an action phrase ("Run your India tax
  // estimate →"), not a clean tool name — fine as a link label, but reads
  // oddly prefixed with "Embed the ". Derive an actual name from the
  // filename instead (with overrides for the handful of tools whose name
  // is an acronym a naive title-case would mangle).
  const toolNameOverrides = {
    'gst-vat-calculator.html':'GST / VAT Calculator', 'hra-calculator.html':'HRA Calculator',
    'ppf-calculator.html':'PPF Calculator', 'fd-calculator.html':'FD Calculator',
    'rd-calculator.html':'RD Calculator', 'cd-calculator.html':'CD Calculator',
    'ira-calculator.html':'IRA & Roth IRA Calculator', 'apr-calculator.html':'APR Calculator',
    'fha-loan-calculator.html':'FHA Loan Calculator', 'va-mortgage-calculator.html':'VA Mortgage Calculator',
    'heloc-calculator.html':'HELOC Calculator', 'rmd-calculator.html':'RMD Calculator',
    'roi-calculator.html':'ROI Calculator', 'irr-calculator.html':'IRR Calculator',
    '401k-calculator.html':'401(k) Calculator', 'gpa-calculator.html':'GPA Calculator',
    'bmi-calculator.html':'BMI Calculator'
  };
  const targetName = toolNameOverrides[targetFile] || targetFile
    .replace(/\.html$/, '').split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const targetUrl = 'https://tallybench.com/' + targetFile;
  const embedUrl = targetUrl + '?embed=1';
  const toolId = targetFile.replace(/\.html$/, '');
  const iframeId = 'tb-embed-' + toolId;

  // Same single-snippet rule as the calculator-page embed above: the credit
  // link ships inside the one block people copy, because a separate "step 2"
  // is a step most people skip, and it is the only part of an embed that
  // actually links back from the host's domain.
  const creditSnippet = '<p style="font-size:13px;margin:8px 0 0;">Calculator by ' +
    '<a href="' + targetUrl + '" rel="noopener">TallyBench</a></p>';

  const iframeSnippet =
    '<iframe id="' + iframeId + '" src="' + embedUrl + '" width="100%" height="640" ' +
    'style="border:0;max-width:640px;" loading="lazy" title="' + targetName + ' — TallyBench"></iframe>\n' +
    '<script>window.addEventListener("message",function(e){if(e.data&&e.data.tbEmbedId==="' + toolId + '"){' +
    'var f=document.getElementById("' + iframeId + '");if(f)f.style.height=e.data.tbEmbedHeight+"px";}});<' + '/script>\n' +
    creditSnippet;

  const row = document.createElement('div');
  row.className = 'tb-embed-row';
  row.innerHTML = '<span class="tb-embed-hint">Citing this? Embed the calculator it’s based on.</span>' +
    '<button type="button" class="ghost" id="tbArticleEmbedOpen">&lt;/&gt; Embed the ' + targetName + '</button>';
  ctaRow.insertAdjacentElement('afterend', row);

  const backdrop = document.createElement('div');
  backdrop.className = 'tb-embed-backdrop';
  backdrop.hidden = true;
  backdrop.innerHTML =
    '<div class="tb-embed-modal">' +
      '<div class="tb-embed-modal-head"><strong>Embed <span id="tbArticleEmbedToolName"></span></strong>' +
        '<button type="button" class="tb-embed-close" aria-label="Close">&#10005;</button></div>' +
      '<div class="tb-embed-modal-body">' +
        '<label>Paste this where you want the calculator to appear</label>' +
        '<textarea readonly id="tbArticleEmbedIframeCode"></textarea>' +
        '<button type="button" class="ghost tb-embed-copy" data-target="tbArticleEmbedIframeCode">Copy code</button>' +
        '<p class="tb-chat-hint">Includes the credit line — please keep it, it is the only thing we ask in return. The widget reports its own height automatically as visitors use it, so there is no size to guess.</p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(backdrop);

  document.getElementById('tbArticleEmbedToolName').textContent = targetName;
  document.getElementById('tbArticleEmbedIframeCode').value = iframeSnippet;

  document.getElementById('tbArticleEmbedOpen').addEventListener('click', ()=>{ backdrop.hidden = false; });
  backdrop.querySelector('.tb-embed-close').addEventListener('click', ()=>{ backdrop.hidden = true; });
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) backdrop.hidden = true; });
  backdrop.querySelectorAll('.tb-embed-copy').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const ta = document.getElementById(btn.dataset.target);
      ta.select();
      navigator.clipboard.writeText(ta.value).then(()=>{
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(()=>{ btn.textContent = original; }, 1500);
      }).catch(()=>{ /* selection above still lets the user copy manually */ });
    });
  });
})();

// ---- Amortization Schedule Calculator ----
(function () {
  var amAmt = document.getElementById('amLoanAmt');
  var amRate = document.getElementById('amRate');
  var amYears = document.getElementById('amYears');
  var amSeg = document.getElementById('amViewSeg');
  if (!amAmt || !amRate || !amYears) return; // not on this page

  var amMonthly = document.getElementById('amMonthly');
  var amPrincipalOut = document.getElementById('amPrincipal');
  var amInterestOut = document.getElementById('amInterest');
  var amTotalOut = document.getElementById('amTotal');
  var amThead = document.getElementById('amThead');
  var amTbody = document.getElementById('amTbody');

  var currentView = 'yearly';

  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function buildSchedule(P, rate, years) {
    var i = rate / 100 / 12;
    var n = Math.round(years * 12);
    var M = (i === 0) ? (P / n) : (P * i / (1 - Math.pow(1 + i, -n)));
    var balance = P;
    var rows = [];
    var totalInterest = 0;
    for (var m = 1; m <= n; m++) {
      var interest = balance * i;
      var principal = M - interest;
      balance -= principal;
      if (m === n) balance = 0; // clamp final-month floating point residue
      totalInterest += interest;
      rows.push({ month: m, payment: M, principal: principal, interest: interest, balance: balance });
    }
    return { M: M, n: n, rows: rows, totalInterest: totalInterest };
  }

  function aggregateYearly(rows) {
    var years = [];
    var yearNum = 0;
    for (var idx = 0; idx < rows.length; idx++) {
      if (idx % 12 === 0) {
        yearNum++;
        years.push({ year: yearNum, principal: 0, interest: 0, balance: 0 });
      }
      var y = years[years.length - 1];
      y.principal += rows[idx].principal;
      y.interest += rows[idx].interest;
      y.balance = rows[idx].balance;
    }
    return years;
  }

  function renderTable(schedule) {
    if (currentView === 'yearly') {
      amThead.innerHTML = '<tr><th>Year</th><th>Principal Paid</th><th>Interest Paid</th><th>Ending Balance</th></tr>';
      var years = aggregateYearly(schedule.rows);
      var html = '';
      for (var y = 0; y < years.length; y++) {
        var row = years[y];
        html += '<tr><td>' + row.year + '</td><td>' + fmt(row.principal) + '</td><td>' + fmt(row.interest) + '</td><td>' + fmt(row.balance) + '</td></tr>';
      }
      amTbody.innerHTML = html;
    } else {
      amThead.innerHTML = '<tr><th>Month</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Ending Balance</th></tr>';
      var html2 = '';
      for (var r = 0; r < schedule.rows.length; r++) {
        var row2 = schedule.rows[r];
        html2 += '<tr><td>' + row2.month + '</td><td>' + fmt(row2.payment) + '</td><td>' + fmt(row2.principal) + '</td><td>' + fmt(row2.interest) + '</td><td>' + fmt(row2.balance) + '</td></tr>';
      }
      amTbody.innerHTML = html2;
    }
  }

  function calc() {
    var P = parseFloat(amAmt.value) || 0;
    var rate = parseFloat(amRate.value) || 0;
    var years = parseFloat(amYears.value) || 0;
    if (P <= 0 || years <= 0) {
      amMonthly.textContent = '$0';
      amPrincipalOut.textContent = '$0';
      amInterestOut.textContent = '$0';
      amTotalOut.textContent = '$0';
      amThead.innerHTML = '';
      amTbody.innerHTML = '';
      return;
    }
    var schedule = buildSchedule(P, rate, years);
    amMonthly.textContent = fmt(schedule.M);
    amPrincipalOut.textContent = fmt(P);
    amInterestOut.textContent = fmt(schedule.totalInterest);
    amTotalOut.textContent = fmt(P + schedule.totalInterest);
    renderTable(schedule);
  }

  [amAmt, amRate, amYears].forEach(function (el) {
    el.addEventListener('input', calc);
  });

  if (amSeg) {
    var segButtons = amSeg.querySelectorAll('button');
    segButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        segButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentView = btn.getAttribute('data-view');
        calc();
      });
    });
  }

  calc();
})();

// ---- 401(k) Calculator ----
(function () {
  var kAge = document.getElementById('kAge');
  var kRetAge = document.getElementById('kRetAge');
  var kBalance = document.getElementById('kBalance');
  var kSalary = document.getElementById('kSalary');
  var kContribPct = document.getElementById('kContribPct');
  var kMatchRate = document.getElementById('kMatchRate');
  var kMatchLimit = document.getElementById('kMatchLimit');
  var kGrowth = document.getElementById('kGrowth');
  var kReturn = document.getElementById('kReturn');
  if (!kAge || !kRetAge || !kBalance || !kSalary) return; // not on this page

  var kFinalBalance = document.getElementById('kFinalBalance');
  var kTotalEmployee = document.getElementById('kTotalEmployee');
  var kTotalEmployer = document.getElementById('kTotalEmployer');
  var kTotalGrowth = document.getElementById('kTotalGrowth');

  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function calc() {
    var age = parseFloat(kAge.value) || 0;
    var retAge = parseFloat(kRetAge.value) || 0;
    var balance = parseFloat(kBalance.value) || 0;
    var salary = parseFloat(kSalary.value) || 0;
    var yourPct = parseFloat(kContribPct.value) || 0;
    var matchRate = parseFloat(kMatchRate.value) || 0;
    var matchLimitPct = parseFloat(kMatchLimit.value) || 0;
    var growthRate = parseFloat(kGrowth.value) || 0;
    var returnRate = parseFloat(kReturn.value) || 0;

    if (retAge <= age) {
      kFinalBalance.textContent = fmt(balance);
      kTotalEmployee.textContent = '$0';
      kTotalEmployer.textContent = '$0';
      kTotalGrowth.textContent = '$0';
      return;
    }

    var totalEmployee = 0;
    var totalEmployer = 0;

    for (var a = age; a < retAge; a++) {
      var employeeContrib = salary * yourPct / 100;
      var matchedPct = Math.min(yourPct, matchLimitPct);
      var employerContrib = salary * matchedPct / 100 * matchRate / 100;
      balance = (balance + employeeContrib + employerContrib) * (1 + returnRate / 100);
      totalEmployee += employeeContrib;
      totalEmployer += employerContrib;
      salary *= (1 + growthRate / 100);
    }

    var totalGrowth = balance - totalEmployee - totalEmployer;

    kFinalBalance.textContent = fmt(balance);
    kTotalEmployee.textContent = fmt(totalEmployee);
    kTotalEmployer.textContent = fmt(totalEmployer);
    kTotalGrowth.textContent = fmt(totalGrowth);
  }

  [kAge, kRetAge, kBalance, kSalary, kContribPct, kMatchRate, kMatchLimit, kGrowth, kReturn].forEach(function (el) {
    el.addEventListener('input', calc);
  });

  calc();
})();

// ---- IRA & Roth IRA Calculator ----
(function(){
  if(!document.getElementById('iraAge')) return;

  function money(n){
    return (n<0?'-':'')+'$'+Math.round(Math.abs(n)).toLocaleString();
  }

  function calc(){
    const age = parseFloat(document.getElementById('iraAge').value)||0;
    const retAge = parseFloat(document.getElementById('iraRetAge').value)||0;
    const startBalance = parseFloat(document.getElementById('iraBalance').value)||0;
    const contrib = parseFloat(document.getElementById('iraContrib').value)||0;
    const ret = parseFloat(document.getElementById('iraReturn').value)||0;
    const curTax = parseFloat(document.getElementById('iraCurTax').value)||0;
    const retTax = parseFloat(document.getElementById('iraRetTax').value)||0;

    const years = Math.max(0, Math.round(retAge - age));

    let balance = startBalance;
    for(let i=0; i<years; i++){
      balance = (balance + contrib) * (1 + ret/100);
    }

    const totalContributions = contrib * years;

    const tradAfterTax = balance * (1 - retTax/100);
    const tradTaxPaid = balance - tradAfterTax;

    const rothTaxPaidToday = totalContributions * curTax/100;
    const rothAfterTax = balance;

    document.getElementById('iraTradBalance').textContent = money(balance);
    document.getElementById('iraTradTax').textContent = money(tradTaxPaid);
    document.getElementById('iraTradAfterTax').textContent = money(tradAfterTax);

    document.getElementById('iraRothBalance').textContent = money(balance);
    document.getElementById('iraRothTax').textContent = money(rothTaxPaidToday);
    document.getElementById('iraRothAfterTax').textContent = money(rothAfterTax);

    const yearsEl = document.getElementById('iraYears');
    if(yearsEl) yearsEl.textContent = years;
    const totalContribEl = document.getElementById('iraTotalContrib');
    if(totalContribEl) totalContribEl.textContent = money(totalContributions);
  }

  ['iraAge','iraRetAge','iraBalance','iraContrib','iraReturn','iraCurTax','iraRetTax'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- House Affordability Calculator ----
(function(){
  if(!document.getElementById('affIncome')) return;

  function money(n){
    return (n<0?'-':'')+'$'+Math.round(Math.abs(n)).toLocaleString();
  }

  function setWarning(msg){
    const el = document.getElementById('affWarning');
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function calc(){
    const income = parseFloat(document.getElementById('affIncome').value)||0;
    const debts = parseFloat(document.getElementById('affDebts').value)||0;
    const down = parseFloat(document.getElementById('affDown').value)||0;
    const rate = parseFloat(document.getElementById('affRate').value)||0;
    const term = parseFloat(document.getElementById('affTerm').value)||30;
    const dti = parseFloat(document.getElementById('affDTI').value)||0;
    const taxRate = parseFloat(document.getElementById('affTaxRate').value)||0;
    const insRate = parseFloat(document.getElementById('affInsRate').value)||0;
    const hoa = parseFloat(document.getElementById('affHoa').value)||0;

    const i = rate/100/12;
    const n = term*12;
    const k = i===0 ? 1/n : i/(1-Math.pow(1+i,-n));
    const m = (taxRate + insRate)/1200;

    const maxMonthlyDebtPayment = (income/12) * (dti/100) - debts;
    const D = down;
    const numerator = maxMonthlyDebtPayment - hoa + D*k;

    let maxPrice = 0, maxLoan = 0, monthlyPayment = 0, downPct = 0;

    if(numerator <= 0 || (k+m) <= 0){
      setWarning('Your existing debts already exceed the allowed debt-to-income ratio at this income level, so the calculated maximum home price is $0. Try lowering existing debts, raising the allowed DTI ratio, or increasing income.');
    } else {
      maxPrice = numerator / (k+m);
      maxLoan = Math.max(maxPrice - D, 0);
      const pi = maxLoan*k;
      const taxIns = maxPrice*m;
      monthlyPayment = pi + taxIns + hoa;
      downPct = maxPrice>0 ? (D/maxPrice)*100 : 0;
      setWarning(null);
    }

    document.getElementById('affMaxPrice').textContent = money(maxPrice);
    document.getElementById('affMaxLoan').textContent = money(maxLoan);
    document.getElementById('affMonthly').textContent = money(monthlyPayment);
    document.getElementById('affDownPct').textContent = downPct.toFixed(1)+'%';
  }

  ['affIncome','affDebts','affDown','affRate','affTerm','affDTI','affTaxRate','affInsRate','affHoa'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Down Payment Calculator ----
(function(){
  const priceEl = document.getElementById('dpPrice');
  if(!priceEl) return;
  const modeSeg = document.getElementById('dpModeSeg');
  const downEl = document.getElementById('dpDownInput');
  const downLabel = document.getElementById('dpDownLabel');
  const pmiRateEl = document.getElementById('dpPmiRate');
  const pmiWrap = document.getElementById('dpPmiRateWrap');
  let mode = 'percent';

  function setWarning(msg){
    const el = document.getElementById('dpWarning');
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function calc(){
    const price = parseFloat(priceEl.value)||0;
    const inputVal = parseFloat(downEl.value)||0;
    let downAmt, downPct;

    if(mode === 'percent'){
      downPct = inputVal;
      downAmt = price * downPct/100;
    } else {
      downAmt = inputVal;
      downPct = price>0 ? (downAmt/price*100) : 0;
    }

    if(price <= 0){
      setWarning('Home price must be greater than zero.');
    } else if(downAmt < 0){
      setWarning('Down payment can\'t be negative.');
    } else if(downAmt >= price){
      setWarning('Down payment can\'t be greater than or equal to the home price — there would be nothing left to borrow.');
    } else {
      setWarning(null);
    }

    const loanAmt = Math.max(price - downAmt, 0);
    const pmiRequired = downPct < 20;
    if(pmiWrap) pmiWrap.style.display = pmiRequired ? '' : 'none';
    const pmiRate = parseFloat(pmiRateEl.value)||0;
    const monthlyPmi = pmiRequired ? (loanAmt*pmiRate/100)/12 : 0;

    document.getElementById('dpDownAmt').textContent = '$'+downAmt.toLocaleString(undefined,{maximumFractionDigits:0});
    document.getElementById('dpDownPct').textContent = downPct.toFixed(2)+'%';
    document.getElementById('dpLoanAmt').textContent = '$'+loanAmt.toLocaleString(undefined,{maximumFractionDigits:0});
    document.getElementById('dpPmiRequired').textContent = pmiRequired ? 'Yes' : 'No';
    document.getElementById('dpMonthlyPmi').textContent = pmiRequired
      ? '$'+monthlyPmi.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+'/mo'
      : '$0 — 20%+ down avoids PMI';
  }

  function setMode(newMode){
    mode = newMode;
    if(mode === 'percent'){
      downLabel.textContent = 'Down payment (%)';
      downEl.step = '0.1';
      downEl.value = 10;
    } else {
      downLabel.textContent = 'Down payment ($)';
      downEl.step = '100';
      downEl.value = 40000;
    }
    calc();
  }

  if(modeSeg){
    modeSeg.addEventListener('click', (e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      modeSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      setMode(btn.dataset.mode);
    });
  }

  [priceEl, downEl, pmiRateEl].forEach(el=>{
    if(!el) return;
    el.addEventListener('input', calc);
  });
  calc();
})();

// ---- Debt-to-Income Ratio Calculator ----
(function(){
  const incomeEl = document.getElementById('dtiIncome');
  if(!incomeEl) return;
  const rentEl = document.getElementById('dtiRent');
  const carEl = document.getElementById('dtiCar');
  const studentEl = document.getElementById('dtiStudent');
  const cardEl = document.getElementById('dtiCard');
  const otherEl = document.getElementById('dtiOther');

  function band(dti){
    if(dti <= 36) return 'Healthy — well within typical lending guidelines';
    if(dti <= 43) return 'Manageable — near the upper limit many mortgage lenders allow';
    if(dti <= 49) return 'High — you may have trouble qualifying for new credit';
    return 'Very high — lenders will likely decline new credit applications';
  }

  function calc(){
    const income = parseFloat(incomeEl.value)||0;
    const debtEls = [rentEl, carEl, studentEl, cardEl, otherEl];
    const totalDebt = debtEls.reduce((sum, el)=> sum + (parseFloat(el.value)||0), 0);
    const dti = income>0 ? (totalDebt/income*100) : 0;

    document.getElementById('dtiTotalDebt').textContent = '$'+totalDebt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    document.getElementById('dtiIncomeOut').textContent = '$'+income.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    document.getElementById('dtiRatio').textContent = dti.toFixed(2)+'%';
    document.getElementById('dtiAssessment').textContent = income>0 ? band(dti) : '—';
  }

  [incomeEl, rentEl, carEl, studentEl, cardEl, otherEl].forEach(el=>{
    if(!el) return;
    el.addEventListener('input', calc);
  });
  calc();
})();

// ---- Simple Interest Calculator ----
(function(){
  const principalEl = document.getElementById('siPrincipal');
  if(!principalEl) return;
  const rateEl = document.getElementById('siRate');
  const timeEl = document.getElementById('siTime');

  function calc(){
    const principal = parseFloat(principalEl.value)||0;
    const rate = parseFloat(rateEl.value)||0;
    const time = parseFloat(timeEl.value)||0;
    const interest = principal*rate/100*time;
    const total = principal+interest;

    document.getElementById('siPrincipalOut').textContent = '$'+principal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    document.getElementById('siInterest').textContent = '$'+interest.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    document.getElementById('siTotal').textContent = '$'+total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  [principalEl, rateEl, timeEl].forEach(el=>{
    if(!el) return;
    el.addEventListener('input', calc);
  });
  calc();
})();

// ---- ROI Calculator ----
(function(){
  if(!document.getElementById('roiInitial')) return;

  function fmtMoney(v){
    const sign = v<0 ? '-' : '';
    return sign+'$'+Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function calc(){
    const initial = parseFloat(document.getElementById('roiInitial').value)||0;
    const finalValue = parseFloat(document.getElementById('roiFinal').value)||0;
    const costs = parseFloat(document.getElementById('roiCosts').value)||0;
    const years = parseFloat(document.getElementById('roiYears').value)||0;
    const warnEl = document.getElementById('roiWarning');

    const gain = finalValue - initial - costs;
    const roiPercent = initial>0 ? (gain/initial*100) : null;
    const annualized = (years>0 && initial>0 && finalValue>0)
      ? (Math.pow(finalValue/initial, 1/years)-1)*100
      : null;

    if(warnEl){
      if(initial<=0){
        warnEl.textContent = 'Enter an initial investment greater than zero to compute ROI.';
        warnEl.classList.add('show');
      } else {
        warnEl.textContent = '';
        warnEl.classList.remove('show');
      }
    }

    document.getElementById('roiGain').textContent = fmtMoney(gain);
    document.getElementById('roiPercent').textContent = roiPercent===null ? '—' : roiPercent.toFixed(2)+'%';
    document.getElementById('roiAnnualized').textContent = annualized===null ? '—' : annualized.toFixed(2)+'%';
  }

  ['roiInitial','roiFinal','roiCosts','roiYears'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Credit Card Payoff Calculator ----
(function(){
  if(!document.getElementById('ccpModeSeg')) return;
  const modeSeg = document.getElementById('ccpModeSeg');
  const fixedFields = document.getElementById('ccpFixedFields');
  const targetFields = document.getElementById('ccpTargetFields');
  const fixedReadout = document.getElementById('ccpFixedReadout');
  const targetReadout = document.getElementById('ccpTargetReadout');
  let mode = 'fixed';

  function fmtMoney(v){
    return '$'+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function calcFixed(){
    const balance0 = parseFloat(document.getElementById('ccpBalanceA').value)||0;
    const apr = parseFloat(document.getElementById('ccpAprA').value)||0;
    const payment = parseFloat(document.getElementById('ccpPayment').value)||0;
    const warnEl = document.getElementById('ccpWarningA');
    const i = apr/100/12;
    let balance = balance0, months = 0, totalInterest = 0, tooLow = false;

    for(let k=0;k<600;k++){
      if(balance<=0) break;
      const interestThisMonth = balance*i;
      if(payment<=interestThisMonth){ tooLow = true; break; }
      balance = balance + interestThisMonth - payment;
      months++;
      totalInterest += interestThisMonth;
      if(balance<=0){ balance = 0; break; }
    }

    if(tooLow || balance0<=0){
      if(warnEl){
        warnEl.textContent = balance0<=0
          ? 'Enter a balance greater than zero.'
          : 'This payment is too low — the balance will never shrink at this rate. Increase your payment.';
        warnEl.classList.add('show');
      }
      document.getElementById('ccpMonths').textContent = '—';
      document.getElementById('ccpTotalInterestA').textContent = '—';
      document.getElementById('ccpTotalPaidA').textContent = '—';
      return;
    }
    if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }
    document.getElementById('ccpMonths').textContent = months;
    document.getElementById('ccpTotalInterestA').textContent = fmtMoney(totalInterest);
    document.getElementById('ccpTotalPaidA').textContent = fmtMoney(balance0+totalInterest);
  }

  function calcTarget(){
    const balance = parseFloat(document.getElementById('ccpBalanceB').value)||0;
    const apr = parseFloat(document.getElementById('ccpAprB').value)||0;
    const n = parseFloat(document.getElementById('ccpTargetMonths').value)||0;
    const i = apr/100/12;

    if(n<=0 || balance<=0){
      document.getElementById('ccpRequiredPayment').textContent = '—';
      document.getElementById('ccpTotalInterestB').textContent = '—';
      document.getElementById('ccpTotalPaidB').textContent = '—';
      return;
    }
    const requiredPayment = i===0 ? (balance/n) : (balance*i/(1-Math.pow(1+i,-n)));
    const totalPaid = requiredPayment*n;
    const totalInterest = totalPaid - balance;
    document.getElementById('ccpRequiredPayment').textContent = fmtMoney(requiredPayment);
    document.getElementById('ccpTotalInterestB').textContent = fmtMoney(totalInterest);
    document.getElementById('ccpTotalPaidB').textContent = fmtMoney(totalPaid);
  }

  modeSeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    mode = btn.dataset.mode;
    modeSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    fixedFields.style.display = mode==='fixed' ? 'block' : 'none';
    targetFields.style.display = mode==='target' ? 'block' : 'none';
    fixedReadout.style.display = mode==='fixed' ? 'block' : 'none';
    targetReadout.style.display = mode==='target' ? 'block' : 'none';
  });

  ['ccpBalanceA','ccpAprA','ccpPayment'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calcFixed);
    el.addEventListener('change', calcFixed);
  });
  ['ccpBalanceB','ccpAprB','ccpTargetMonths'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calcTarget);
    el.addEventListener('change', calcTarget);
  });

  calcFixed();
  calcTarget();
})();

// ---- Body Fat Calculator (US Navy method) ----
(function(){
  if(!document.getElementById('bfSexSeg')) return;
  const sexSeg = document.getElementById('bfSexSeg');
  const unitSel = document.getElementById('bfUnit');
  const metricWrap = document.getElementById('bfMetricWrap');
  const imperialWrap = document.getElementById('bfImperialWrap');
  const hipWrapCm = document.getElementById('bfHipWrapCm');
  const hipWrapIn = document.getElementById('bfHipWrapIn');
  let sex = 'male';

  function getInches(){
    if(unitSel.value==='in'){
      return {
        h: parseFloat(document.getElementById('bfHeightIn').value)||0,
        n: parseFloat(document.getElementById('bfNeckIn').value)||0,
        w: parseFloat(document.getElementById('bfWaistIn').value)||0,
        hip: parseFloat(document.getElementById('bfHipIn').value)||0
      };
    }
    return {
      h: (parseFloat(document.getElementById('bfHeightCm').value)||0)/2.54,
      n: (parseFloat(document.getElementById('bfNeckCm').value)||0)/2.54,
      w: (parseFloat(document.getElementById('bfWaistCm').value)||0)/2.54,
      hip: (parseFloat(document.getElementById('bfHipCm').value)||0)/2.54
    };
  }

  function calc(){
    const vals = getInches();
    const h = vals.h, n = vals.n, w = vals.w, hip = vals.hip;
    const warnEl = document.getElementById('bfWarning');
    const pctEl = document.getElementById('bfPercent');
    const catEl = document.getElementById('bfCategory');
    let pct = null;

    if(sex==='male'){
      if(h>0 && (w-n)>0) pct = 86.010*Math.log10(w-n) - 70.041*Math.log10(h) + 36.76;
    } else {
      if(h>0 && (w+hip-n)>0) pct = 163.205*Math.log10(w+hip-n) - 97.684*Math.log10(h) - 78.387;
    }

    if(pct===null || !isFinite(pct) || isNaN(pct) || pct<0){
      if(warnEl){
        warnEl.textContent = 'Check your measurements — waist should be larger than neck (plus hip for women) to get a valid result.';
        warnEl.classList.add('show');
      }
      pctEl.textContent = '—';
      catEl.textContent = '—';
      return;
    }
    if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }
    pct = Math.min(Math.max(pct,0),70);
    pctEl.textContent = pct.toFixed(1)+'%';

    const ranges = sex==='male'
      ? [[6,'Essential Fat'],[14,'Athletes'],[18,'Fitness'],[25,'Average'],[Infinity,'Obese']]
      : [[14,'Essential Fat'],[21,'Athletes'],[25,'Fitness'],[32,'Average'],[Infinity,'Obese']];
    catEl.textContent = ranges.find(pair=>pct<pair[0])[1];
  }

  sexSeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    sex = btn.dataset.sex;
    sexSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const show = sex==='female' ? 'flex' : 'none';
    if(hipWrapCm) hipWrapCm.style.display = show;
    if(hipWrapIn) hipWrapIn.style.display = show;
    calc();
  });

  unitSel.addEventListener('change', ()=>{
    const isIn = unitSel.value==='in';
    metricWrap.style.display = isIn ? 'none' : 'block';
    imperialWrap.style.display = isIn ? 'block' : 'none';
    calc();
  });

  ['bfHeightCm','bfNeckCm','bfWaistCm','bfHipCm','bfHeightIn','bfNeckIn','bfWaistIn','bfHipIn'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Pace Calculator ----
(function(){
  if(!document.getElementById('paceModeSeg')) return;
  const modeSeg = document.getElementById('paceModeSeg');
  const unitSel = document.getElementById('paceUnit');
  const fieldsPace = document.getElementById('pcFieldsPace');
  const fieldsTime = document.getElementById('pcFieldsTime');
  const fieldsDistance = document.getElementById('pcFieldsDistance');
  const resultLabel = document.getElementById('pcResultLabel');
  const resultValue = document.getElementById('pcResultValue');
  const warnEl = document.getElementById('pcWarning');
  let mode = 'pace';
  let paceSecPerUnit = 0;

  function num(id){ return parseFloat(document.getElementById(id).value)||0; }
  function toSeconds(h,m,s){ return h*3600+m*60+s; }
  function fmtTime(totalSec){
    if(!isFinite(totalSec) || totalSec<0) totalSec = 0;
    totalSec = Math.round(totalSec);
    const h = Math.floor(totalSec/3600);
    const m = Math.floor((totalSec%3600)/60);
    const s = totalSec%60;
    const mm = String(m).padStart(2,'0');
    const ss = String(s).padStart(2,'0');
    return h>0 ? (h+':'+mm+':'+ss) : (m+':'+ss);
  }
  function setWarning(msg){
    if(!warnEl) return;
    if(msg){ warnEl.textContent = msg; warnEl.classList.add('show'); }
    else { warnEl.textContent=''; warnEl.classList.remove('show'); }
  }

  function updateRacePredictions(unit){
    const races = {pcPred5k:5, pcPred10k:10, pcPredHalf:21.0975, pcPredFull:42.195};
    if(!(paceSecPerUnit>0)){
      Object.keys(races).forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent='—'; });
      return;
    }
    const paceSecPerKm = unit==='mi' ? (paceSecPerUnit/1.60934) : paceSecPerUnit;
    Object.keys(races).forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.textContent = fmtTime(paceSecPerKm*races[id]);
    });
  }

  function calc(){
    const unit = unitSel.value;
    if(mode==='pace'){
      const distance = num('pcDistance1');
      const timeSec = toSeconds(num('pcH1'), num('pcM1'), num('pcS1'));
      if(distance>0){
        paceSecPerUnit = timeSec/distance;
        setWarning('');
        resultLabel.textContent = 'Pace';
        resultValue.textContent = fmtTime(paceSecPerUnit)+' /'+unit;
      } else {
        paceSecPerUnit = 0;
        setWarning('Enter a distance greater than zero.');
        resultValue.textContent = '—';
      }
    } else if(mode==='time'){
      const distance = num('pcDistance2');
      paceSecPerUnit = toSeconds(0, num('pcPaceM2'), num('pcPaceS2'));
      if(distance>0){
        setWarning('');
        resultLabel.textContent = 'Finish Time';
        resultValue.textContent = fmtTime(paceSecPerUnit*distance);
      } else {
        setWarning('Enter a distance greater than zero.');
        resultValue.textContent = '—';
      }
    } else {
      const timeSec = toSeconds(num('pcH3'), num('pcM3'), num('pcS3'));
      paceSecPerUnit = toSeconds(0, num('pcPaceM3'), num('pcPaceS3'));
      if(paceSecPerUnit>0){
        setWarning('');
        resultLabel.textContent = 'Distance';
        resultValue.textContent = (timeSec/paceSecPerUnit).toFixed(2)+' '+unit;
      } else {
        setWarning('Enter a pace greater than zero.');
        resultValue.textContent = '—';
      }
    }
    updateRacePredictions(unit);
  }

  modeSeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    mode = btn.dataset.mode;
    modeSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    fieldsPace.style.display = mode==='pace' ? 'block' : 'none';
    fieldsTime.style.display = mode==='time' ? 'block' : 'none';
    fieldsDistance.style.display = mode==='distance' ? 'block' : 'none';
    calc();
  });

  unitSel.addEventListener('change', calc);

  ['pcDistance1','pcH1','pcM1','pcS1','pcDistance2','pcPaceM2','pcPaceS2','pcH3','pcM3','pcS3','pcPaceM3','pcPaceS3'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();


// =====================================================================
// WAVE 1 — 50 new finance/health calculators
// =====================================================================

// ---- Batch W1-F1: Mortgage / Real Estate cluster ----
(function(){
// ===================================================================
// TallyBench — scratch JS for 9 new finance calculators (batch W1-F1)
// Append each IIFE below into script.js in the appropriate place.
// ===================================================================

function tbMoney(n){
  if(!isFinite(n)) n = 0;
  return '$'+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}

function tbPmt(principal, annualRatePct, years){
  const i = annualRatePct/100/12, n = years*12;
  if(n<=0) return 0;
  if(i===0) return principal/n;
  return principal*i/(1-Math.pow(1+i,-n));
}

// ---- Mortgage payoff calculator ----
(function(){
  if(!document.getElementById('mpoBalance')) return;
  function calc(){
    const balance = parseFloat(document.getElementById('mpoBalance').value)||0;
    const years = parseFloat(document.getElementById('mpoTerm').value)||0;
    const rate = parseFloat(document.getElementById('mpoRate').value)||0;
    const extra = parseFloat(document.getElementById('mpoExtra').value)||0;
    const oneTime = parseFloat(document.getElementById('mpoOneTime').value)||0;

    const i = rate/100/12;
    const n = Math.round(years*12);
    const M = tbPmt(balance, rate, years);
    const baselineInterest = Math.max(M*n - balance, 0);

    let bal = balance, months = 0, totalInterest = 0;
    while(bal > 0.01 && months < 1200){
      months++;
      const interest = bal*i;
      let payment = M + extra + (months===1 ? oneTime : 0);
      let principal = payment - interest;
      if(principal > bal){ principal = bal; }
      bal -= principal;
      totalInterest += interest;
    }

    const newYears = months/12;
    const timeSavedMonths = Math.max(n - months, 0);
    const interestSaved = Math.max(baselineInterest - totalInterest, 0);

    document.getElementById('mpoNewPayoff').textContent = months>0 ? (Math.floor(months/12)+'y '+(months%12)+'m') : '0y 0m';
    document.getElementById('mpoTimeSaved').textContent = timeSavedMonths>0 ? (Math.floor(timeSavedMonths/12)+'y '+(timeSavedMonths%12)+'m') : '0y 0m';
    document.getElementById('mpoInterestSaved').textContent = tbMoney(interestSaved);
    document.getElementById('mpoNewTotalInterest').textContent = tbMoney(totalInterest);
  }
  ['mpoBalance','mpoTerm','mpoRate','mpoExtra','mpoOneTime'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Rent affordability calculator ----
(function(){
  if(!document.getElementById('raIncome')) return;
  function calc(){
    const income = parseFloat(document.getElementById('raIncome').value)||0;
    const debts = parseFloat(document.getElementById('raDebts').value)||0;

    const r25 = income*0.25;
    const r30 = income*0.30;
    const r35 = income*0.35;
    const combined = r30+debts;
    const combinedPct = income>0 ? (combined/income*100) : 0;

    document.getElementById('raRent25').textContent = tbMoney(r25);
    document.getElementById('raRent30').textContent = tbMoney(r30);
    document.getElementById('raRent35').textContent = tbMoney(r35);
    document.getElementById('raCombined').textContent = tbMoney(combined)+' ('+combinedPct.toFixed(1)+'% of income)';

    const warnEl = document.getElementById('raWarning');
    if(combinedPct > 40){
      warnEl.textContent = 'At the 30% rent level, rent + existing debts come to '+combinedPct.toFixed(1)+'% of your gross income — above the common 40% combined-debt ceiling lenders and landlords watch for. Consider the 25% rent scenario instead.';
      warnEl.classList.add('show');
    } else {
      warnEl.textContent = '';
      warnEl.classList.remove('show');
    }
  }
  ['raIncome','raDebts'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Real estate investment calculator ----
(function(){
  if(!document.getElementById('reiPrice')) return;
  function calc(){
    const price = parseFloat(document.getElementById('reiPrice').value)||0;
    const downPct = parseFloat(document.getElementById('reiDown').value)||0;
    const closing = parseFloat(document.getElementById('reiClosing').value)||0;
    const rent = parseFloat(document.getElementById('reiRent').value)||0;
    const taxM = parseFloat(document.getElementById('reiTax').value)||0;
    const insM = parseFloat(document.getElementById('reiIns').value)||0;
    const hoaM = parseFloat(document.getElementById('reiHoa').value)||0;
    const maintPct = parseFloat(document.getElementById('reiMaint').value)||0;
    const vacPct = parseFloat(document.getElementById('reiVac').value)||0;
    const rate = parseFloat(document.getElementById('reiRate').value)||0;
    const term = parseFloat(document.getElementById('reiTerm').value)||0;

    const annualRent = rent*12;
    const annualOpEx = (taxM+insM+hoaM)*12 + (maintPct/100)*annualRent + (vacPct/100)*annualRent;
    const NOI = annualRent - annualOpEx;
    const capRate = price>0 ? (NOI/price*100) : 0;

    const loanAmt = price*(1-downPct/100);
    const M = tbPmt(loanAmt, rate, term);
    const annualDebtService = M*12;
    const annualCashFlow = NOI - annualDebtService;
    const monthlyCashFlow = annualCashFlow/12;

    const downDollar = price*downPct/100;
    const cashInvested = downDollar+closing;
    const CoC = cashInvested>0 ? (annualCashFlow/cashInvested*100) : 0;

    document.getElementById('reiNOI').textContent = tbMoney(NOI);
    document.getElementById('reiCapRate').textContent = capRate.toFixed(2)+'%';
    document.getElementById('reiCashFlow').textContent = tbMoney(monthlyCashFlow);
    document.getElementById('reiCoC').textContent = CoC.toFixed(2)+'%';
  }
  ['reiPrice','reiDown','reiClosing','reiRent','reiTax','reiIns','reiHoa','reiMaint','reiVac','reiRate','reiTerm'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Rental property calculator ----
(function(){
  if(!document.getElementById('rpRent')) return;
  function calc(){
    const rent = parseFloat(document.getElementById('rpRent').value)||0;
    const vacPct = parseFloat(document.getElementById('rpVac').value)||0;
    const mgmtPct = parseFloat(document.getElementById('rpMgmt').value)||0;
    const maintPct = parseFloat(document.getElementById('rpMaint').value)||0;
    const taxM = parseFloat(document.getElementById('rpTax').value)||0;
    const insM = parseFloat(document.getElementById('rpIns').value)||0;
    const hoaM = parseFloat(document.getElementById('rpHoa').value)||0;
    const mortgagePmt = parseFloat(document.getElementById('rpMortgage').value)||0;

    const EGI = rent*(1-vacPct/100);
    const totalExpenses = (mgmtPct/100)*EGI + (maintPct/100)*EGI + taxM+insM+hoaM;
    const monthlyCF = EGI - totalExpenses - mortgagePmt;
    const annualCF = monthlyCF*12;

    document.getElementById('rpEGI').textContent = tbMoney(EGI);
    document.getElementById('rpExpenses').textContent = tbMoney(totalExpenses);
    document.getElementById('rpMonthlyCF').textContent = tbMoney(monthlyCF);
    document.getElementById('rpAnnualCF').textContent = tbMoney(annualCF);
  }
  ['rpRent','rpVac','rpMgmt','rpMaint','rpTax','rpIns','rpHoa','rpMortgage'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- APR calculator ----
(function(){
  if(!document.getElementById('aprLoanAmt')) return;
  function calc(){
    const loanAmount = parseFloat(document.getElementById('aprLoanAmt').value)||0;
    const statedRate = parseFloat(document.getElementById('aprStatedRate').value)||0;
    const years = parseFloat(document.getElementById('aprTerm').value)||0;
    const fees = parseFloat(document.getElementById('aprFees').value)||0;

    const n = Math.round(years*12);
    const statedPayment = tbPmt(loanAmount, statedRate, years);

    const netAmount = Math.max(loanAmount - fees, 0.01);
    let lo = 0, hi = 1;
    for(let iter=0; iter<100; iter++){
      const mid = (lo+hi)/2;
      const p = n>0 ? (mid===0 ? netAmount/n : netAmount*mid/(1-Math.pow(1+mid,-n))) : 0;
      if(p > statedPayment) hi = mid; else lo = mid;
    }
    const x = (lo+hi)/2;
    const apr = x*12*100;

    document.getElementById('aprStatedOut').textContent = statedRate.toFixed(3)+'%';
    document.getElementById('aprMonthlyPayment').textContent = tbMoney(statedPayment);
    document.getElementById('aprTrueApr').textContent = apr.toFixed(3)+'%';
    document.getElementById('aprSpread').textContent = (apr-statedRate).toFixed(3)+' pts';
  }
  ['aprLoanAmt','aprStatedRate','aprTerm','aprFees'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- FHA loan calculator ----
(function(){
  if(!document.getElementById('fhaPrice')) return;
  function calc(){
    const homePrice = parseFloat(document.getElementById('fhaPrice').value)||0;
    let downPct = parseFloat(document.getElementById('fhaDown').value)||0;
    if(downPct < 3.5) downPct = 3.5;
    const rate = parseFloat(document.getElementById('fhaRate').value)||0;
    const term = parseFloat(document.getElementById('fhaTerm').value)||30;
    const upfrontMIPpct = parseFloat(document.getElementById('fhaUpfrontMip').value)||0;
    const annualMIPpct = parseFloat(document.getElementById('fhaAnnualMip').value)||0;

    const baseLoan = homePrice*(1-downPct/100);
    const upfrontMIP = baseLoan*upfrontMIPpct/100;
    const totalLoan = baseLoan+upfrontMIP;
    const PI = tbPmt(totalLoan, rate, term);
    const monthlyMIP = totalLoan*annualMIPpct/100/12;
    const totalMonthly = PI+monthlyMIP;

    document.getElementById('fhaBaseLoan').textContent = tbMoney(baseLoan);
    document.getElementById('fhaUpfrontMipOut').textContent = tbMoney(upfrontMIP);
    document.getElementById('fhaTotalLoan').textContent = tbMoney(totalLoan);
    document.getElementById('fhaPI').textContent = tbMoney(PI);
    document.getElementById('fhaMonthlyMip').textContent = tbMoney(monthlyMIP);
    document.getElementById('fhaTotalMonthly').textContent = tbMoney(totalMonthly);
  }
  ['fhaPrice','fhaDown','fhaRate','fhaTerm','fhaUpfrontMip','fhaAnnualMip'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- VA mortgage calculator ----
(function(){
  if(!document.getElementById('vaPrice')) return;
  function calc(){
    const homePrice = parseFloat(document.getElementById('vaPrice').value)||0;
    const downPct = parseFloat(document.getElementById('vaDown').value)||0;
    const rate = parseFloat(document.getElementById('vaRate').value)||0;
    const term = parseFloat(document.getElementById('vaTerm').value)||30;
    const fundingFeePct = parseFloat(document.getElementById('vaFundingFee').value)||0;

    const baseLoan = homePrice*(1-downPct/100);
    const fundingFee = baseLoan*fundingFeePct/100;
    const totalLoan = baseLoan+fundingFee;
    const PI = tbPmt(totalLoan, rate, term);

    document.getElementById('vaBaseLoan').textContent = tbMoney(baseLoan);
    document.getElementById('vaFundingFeeOut').textContent = tbMoney(fundingFee);
    document.getElementById('vaTotalLoan').textContent = tbMoney(totalLoan);
    document.getElementById('vaPI').textContent = tbMoney(PI);
  }
  ['vaPrice','vaDown','vaRate','vaTerm','vaFundingFee'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Home equity loan calculator ----
(function(){
  if(!document.getElementById('helHomeValue')) return;
  function calc(){
    const homeValue = parseFloat(document.getElementById('helHomeValue').value)||0;
    const existingBal = parseFloat(document.getElementById('helExistingBal').value)||0;
    const maxCLTV = parseFloat(document.getElementById('helMaxCltv').value)||0;
    const desiredLoan = parseFloat(document.getElementById('helDesiredLoan').value)||0;
    const rate = parseFloat(document.getElementById('helRate').value)||0;
    const term = parseFloat(document.getElementById('helTerm').value)||0;

    const maxEquity = Math.max(homeValue*maxCLTV/100 - existingBal, 0);
    const M = tbPmt(desiredLoan, rate, term);
    const totalPaid = M*term*12;
    const totalInterest = Math.max(totalPaid - desiredLoan, 0);

    document.getElementById('helMaxEquity').textContent = tbMoney(maxEquity);
    document.getElementById('helRequested').textContent = tbMoney(desiredLoan);
    document.getElementById('helMonthly').textContent = tbMoney(M);
    document.getElementById('helTotalInterest').textContent = tbMoney(totalInterest);

    const warnEl = document.getElementById('helWarning');
    if(desiredLoan > maxEquity){
      warnEl.textContent = 'Your requested loan amount of '+tbMoney(desiredLoan)+' exceeds the estimated max available equity of '+tbMoney(maxEquity)+' at a '+maxCLTV+'% combined loan-to-value limit. Lenders are unlikely to approve the full amount requested.';
      warnEl.classList.add('show');
    } else {
      warnEl.textContent = '';
      warnEl.classList.remove('show');
    }
  }
  ['helHomeValue','helExistingBal','helMaxCltv','helDesiredLoan','helRate','helTerm'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- HELOC calculator ----
(function(){
  if(!document.getElementById('helocHomeValue')) return;
  function calc(){
    const homeValue = parseFloat(document.getElementById('helocHomeValue').value)||0;
    const existingBal = parseFloat(document.getElementById('helocExistingBal').value)||0;
    const maxCLTV = parseFloat(document.getElementById('helocMaxCltv').value)||0;
    const drawAmount = parseFloat(document.getElementById('helocDrawAmt').value)||0;
    const rate = parseFloat(document.getElementById('helocRate').value)||0;
    const drawYears = parseFloat(document.getElementById('helocDrawYears').value)||0;
    const repayYears = parseFloat(document.getElementById('helocRepayYears').value)||0;

    const availableCredit = Math.max(homeValue*maxCLTV/100 - existingBal, 0);
    const ioPayment = drawAmount*rate/100/12;
    const amortPayment = tbPmt(drawAmount, rate, repayYears);
    const totalInterestDraw = ioPayment*drawYears*12;

    document.getElementById('helocAvailable').textContent = tbMoney(availableCredit);
    document.getElementById('helocIoPayment').textContent = tbMoney(ioPayment);
    document.getElementById('helocAmortPayment').textContent = tbMoney(amortPayment);
    document.getElementById('helocTotalInterestDraw').textContent = tbMoney(totalInterestDraw);
  }
  ['helocHomeValue','helocExistingBal','helocMaxCltv','helocDrawAmt','helocRate','helocDrawYears','helocRepayYears'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();
})();

// ---- Batch W1-F2: Auto / TVM cluster ----
// =====================================================================
// Scratch JS for 8 new TallyBench finance calculators (batch w1-f2).
// Each block is a standalone IIFE guarded by an element-existence check,
// matching the exact style used throughout the main script.js file.
// These blocks are meant to be merged into script.js centrally — do not
// wire them up any other way.
// =====================================================================

// ---- Auto Lease Calculator ----
(function(){
  if(!document.getElementById('alzPrice')) return;

  function fmtMoney(n){ return '$'+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }

  function calc(){
    const price = parseFloat(document.getElementById('alzPrice').value)||0;
    const residualPct = parseFloat(document.getElementById('alzResidualPct').value)||0;
    const mf = parseFloat(document.getElementById('alzMoneyFactor').value)||0;
    const term = parseFloat(document.getElementById('alzTerm').value)||0;
    const down = parseFloat(document.getElementById('alzDown').value)||0;
    const taxRate = parseFloat(document.getElementById('alzTax').value)||0;
    const warnEl = document.getElementById('alzWarning');

    if(term<=0 || price<=0){
      if(warnEl){ warnEl.textContent = 'Enter a vehicle price and a lease term greater than zero.'; warnEl.classList.add('show'); }
      ['alzDepFee','alzFinFee','alzBase','alzWithTax'].forEach(id=>{ document.getElementById(id).textContent='—'; });
      document.getElementById('alzAprEquiv').textContent = '';
      return;
    }
    if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }

    const adjCapCost = price - down;
    const residualValue = price * residualPct/100;
    const depFee = (adjCapCost - residualValue) / term;
    const finFee = (adjCapCost + residualValue) * mf;
    const base = depFee + finFee;
    const withTax = base * (1 + taxRate/100);
    const aprEquiv = mf*2400;

    document.getElementById('alzDepFee').textContent = fmtMoney(depFee);
    document.getElementById('alzFinFee').textContent = fmtMoney(finFee);
    document.getElementById('alzBase').textContent = fmtMoney(base);
    document.getElementById('alzWithTax').textContent = fmtMoney(withTax);
    document.getElementById('alzAprEquiv').textContent = 'Money factor ≈ '+aprEquiv.toFixed(2)+'% APR-equivalent';
  }

  ['alzPrice','alzResidualPct','alzMoneyFactor','alzTerm','alzDown','alzTax'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();


// ---- Finance Calculator (general TVM solver: N, I/Y, PV, PMT, FV) ----
(function(){
  if(!document.getElementById('tvmSolveSeg')) return;
  const seg = document.getElementById('tvmSolveSeg');
  const fields = {
    n:   { id:'tvmN',   label:'N — Number of Periods',    fmt:v=>v.toFixed(4).replace(/\.?0+$/,'') },
    iy:  { id:'tvmIY',  label:'I/Y — Rate per Period (%)', fmt:v=>v.toFixed(4)+'%' },
    pv:  { id:'tvmPV',  label:'PV — Present Value',        fmt:v=>'$'+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) },
    pmt: { id:'tvmPMT', label:'PMT — Payment per Period',  fmt:v=>'$'+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) },
    fv:  { id:'tvmFV',  label:'FV — Future Value',         fmt:v=>'$'+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }
  };
  let solveFor = 'fv';

  function fvOf(PV,PMT,i,N){
    if(i===0) return PV + PMT*N;
    const x = Math.pow(1+i, N);
    return PV*x + PMT*(x-1)/i;
  }
  function solvePV(FV,PMT,i,N){
    if(i===0) return FV - PMT*N;
    const x = Math.pow(1+i, N);
    return (FV - PMT*(x-1)/i) / x;
  }
  function solvePMT(FV,PV,i,N){
    if(i===0) return N===0 ? NaN : (FV-PV)/N;
    const x = Math.pow(1+i, N);
    if(x===1) return NaN;
    return (FV - PV*x) / ((x-1)/i);
  }
  function solveN(FV,PV,PMT,i){
    if(i===0) return PMT===0 ? NaN : (FV-PV)/PMT;
    const denom = PV + PMT/i;
    if(denom===0) return NaN;
    const ratio = (FV + PMT/i) / denom;
    if(ratio<=0) return NaN;
    return Math.log(ratio) / Math.log(1+i);
  }
  function solveRate(FV,PV,PMT,N){
    function f(iVal){ return fvOf(PV,PMT,iVal,N) - FV; }
    let lo=-0.99, hi=10;
    let flo=f(lo), fhi=f(hi);
    if((flo>0 && fhi>0) || (flo<0 && fhi<0)) return NaN;
    for(let k=0;k<100;k++){
      const mid=(lo+hi)/2;
      const fm=f(mid);
      if((fm>0)===(flo>0)){ lo=mid; flo=fm; } else { hi=mid; }
    }
    return (lo+hi)/2;
  }

  function calc(){
    const warnEl = document.getElementById('tvmWarning');
    const N   = parseFloat(document.getElementById('tvmN').value)||0;
    const IY  = parseFloat(document.getElementById('tvmIY').value)||0;
    const PV  = parseFloat(document.getElementById('tvmPV').value)||0;
    const PMT = parseFloat(document.getElementById('tvmPMT').value)||0;
    const FV  = parseFloat(document.getElementById('tvmFV').value)||0;
    const i = IY/100;

    let result = NaN;
    if(solveFor==='fv')      result = fvOf(PV,PMT,i,N);
    else if(solveFor==='pv') result = solvePV(FV,PMT,i,N);
    else if(solveFor==='pmt')result = solvePMT(FV,PV,i,N);
    else if(solveFor==='n')  result = solveN(FV,PV,PMT,i);
    else if(solveFor==='iy') result = solveRate(FV,PV,PMT,N)*100;

    const f = fields[solveFor];
    const outEl = document.getElementById(f.id);
    const resultLabel = document.getElementById('tvmResultLabel');
    const resultValue = document.getElementById('tvmResultValue');
    const resultSub = document.getElementById('tvmResultSub');
    resultLabel.textContent = f.label;

    if(!isFinite(result) || isNaN(result)){
      if(warnEl){ warnEl.textContent = 'No valid solution for these inputs — check the sign and size of your values.'; warnEl.classList.add('show'); }
      resultValue.textContent = '—';
      if(outEl) outEl.value = '';
      if(resultSub) resultSub.textContent = '';
      return;
    }
    if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }
    resultValue.textContent = f.fmt(result);
    if(outEl) outEl.value = (solveFor==='n') ? Math.round(result*1000)/1000 : Math.round(result*100)/100;
    if(resultSub) resultSub.textContent = 'Solved from the other four TVM inputs.';
  }

  seg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    solveFor = btn.dataset.solve;
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    Object.keys(fields).forEach(key=>{
      const el = document.getElementById(fields[key].id);
      if(el) el.disabled = (key===solveFor);
    });
    calc();
  });

  Object.keys(fields).forEach(key=>{
    const el = document.getElementById(fields[key].id);
    if(!el) return;
    el.disabled = (key===solveFor);
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();


// ---- Interest Rate Calculator ----
(function(){
  if(!document.getElementById('ircPrincipal')) return;

  function calc(){
    const principal = parseFloat(document.getElementById('ircPrincipal').value)||0;
    const payment = parseFloat(document.getElementById('ircPayment').value)||0;
    const term = parseFloat(document.getElementById('ircTerm').value)||0;
    const warnEl = document.getElementById('ircWarning');

    if(principal<=0 || term<=0 || payment<=0){
      if(warnEl){ warnEl.textContent = 'Enter a principal, payment, and term greater than zero.'; warnEl.classList.add('show'); }
      document.getElementById('ircAnnualRate').textContent = '—';
      document.getElementById('ircMonthlyRate').textContent = '—';
      document.getElementById('ircTotalInterest').textContent = '—';
      return;
    }
    if(payment*term <= principal){
      if(warnEl){ warnEl.textContent = 'This payment is too low to cover the loan even at 0% interest — increase the payment, term, or lower the principal.'; warnEl.classList.add('show'); }
      document.getElementById('ircAnnualRate').textContent = '—';
      document.getElementById('ircMonthlyRate').textContent = '—';
      document.getElementById('ircTotalInterest').textContent = '$'+Math.max(payment*term-principal,0).toFixed(2);
      return;
    }
    if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }

    function pay(iRate, n){
      if(iRate===0) return principal/n;
      return principal*iRate / (1-Math.pow(1+iRate,-n));
    }
    let lo=0, hi=0.5; // 0% to 600% annual, monthly rate range
    for(let k=0;k<100;k++){
      const mid=(lo+hi)/2;
      const p = pay(mid, term);
      if(p<payment) lo=mid; else hi=mid;
    }
    const iRate = (lo+hi)/2;
    const annualPct = iRate*12*100;
    const totalInterest = payment*term - principal;

    document.getElementById('ircAnnualRate').textContent = annualPct.toFixed(2)+'%';
    document.getElementById('ircMonthlyRate').textContent = (iRate*100).toFixed(4)+'%';
    document.getElementById('ircTotalInterest').textContent = '$'+totalInterest.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  ['ircPrincipal','ircPayment','ircTerm'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();


// ---- Bond Calculator ----
(function(){
  if(!document.getElementById('bndFace')) return;

  function fmtMoney(n){ return '$'+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }

  function calc(){
    const face = parseFloat(document.getElementById('bndFace').value)||0;
    const couponRate = parseFloat(document.getElementById('bndCoupon').value)||0;
    const years = parseFloat(document.getElementById('bndYears').value)||0;
    const freq = parseFloat(document.getElementById('bndFreq').value)||1;
    const marketRate = parseFloat(document.getElementById('bndMarket').value)||0;

    const n = Math.round(years*freq);
    const couponPmt = face*couponRate/100/freq;
    const periodRate = marketRate/100/freq;

    let price = 0;
    if(n>0){
      for(let t=1;t<=n;t++){
        price += couponPmt / Math.pow(1+periodRate, t);
      }
      price += face / Math.pow(1+periodRate, n);
    } else {
      price = face;
    }

    const totalCouponIncome = couponPmt*n;
    const currentYield = price>0 ? (face*couponRate/100)/price*100 : 0;

    let status;
    if(Math.abs(price-face) < 0.005) status = 'Trading at Par';
    else if(price>face) status = 'Trading at a Premium';
    else status = 'Trading at a Discount';

    document.getElementById('bndPrice').textContent = fmtMoney(price);
    document.getElementById('bndStatus').textContent = status;
    document.getElementById('bndTotalCoupon').textContent = fmtMoney(totalCouponIncome);
    document.getElementById('bndCurrentYield').textContent = currentYield.toFixed(2)+'%';
  }

  ['bndFace','bndCoupon','bndYears','bndFreq','bndMarket'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();


// ---- Mutual Fund Calculator ----
(function(){
  if(!document.getElementById('mfcInitial')) return;

  function fmtMoney(n){ return '$'+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }

  function fvAt(annualPct, initial, monthly, months){
    const r = annualPct/100/12;
    if(r===0) return initial + monthly*months;
    return initial*Math.pow(1+r, months) + monthly*((Math.pow(1+r, months)-1)/r);
  }

  function calc(){
    const initial = parseFloat(document.getElementById('mfcInitial').value)||0;
    const monthly = parseFloat(document.getElementById('mfcMonthly').value)||0;
    const years = parseFloat(document.getElementById('mfcYears').value)||0;
    const grossReturn = parseFloat(document.getElementById('mfcReturn').value)||0;
    const expenseRatio = parseFloat(document.getElementById('mfcExpense').value)||0;

    const months = Math.round(years*12);
    const netReturn = grossReturn - expenseRatio;

    const fvNet = fvAt(netReturn, initial, monthly, months);
    const fvGross = fvAt(grossReturn, initial, monthly, months);
    const totalContributed = initial + monthly*months;
    const estGrowth = fvNet - totalContributed;
    const estFees = Math.max(fvGross - fvNet, 0);

    document.getElementById('mfcFinal').textContent = fmtMoney(fvNet);
    document.getElementById('mfcContributed').textContent = fmtMoney(totalContributed);
    document.getElementById('mfcGrowth').textContent = fmtMoney(estGrowth);
    document.getElementById('mfcFees').textContent = fmtMoney(estFees);
  }

  ['mfcInitial','mfcMonthly','mfcYears','mfcReturn','mfcExpense'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();


// ---- Average Return Calculator ----
(function(){
  if(!document.getElementById('avrY1')) return;
  const ids = ['avrY1','avrY2','avrY3','avrY4','avrY5'];

  function calc(){
    const returns = ids.map(id => parseFloat(document.getElementById(id).value)||0);
    const arithmetic = returns.reduce((a,b)=>a+b,0) / returns.length;
    const product = returns.reduce((acc,r)=>acc*(1+r/100), 1);
    const geo = (Math.pow(product, 1/returns.length) - 1) * 100;

    document.getElementById('avrArith').textContent = arithmetic.toFixed(2)+'%';
    document.getElementById('avrGeo').textContent = geo.toFixed(2)+'%';
  }

  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();


// ---- IRR Calculator ----
(function(){
  if(!document.getElementById('irrInitial')) return;
  const cfIds = ['irrY1','irrY2','irrY3','irrY4','irrY5'];

  function npv(rate, initial, cfs){
    let s = -initial;
    cfs.forEach((cf, idx)=>{ s += cf / Math.pow(1+rate, idx+1); });
    return s;
  }

  function solveIRR(initial, cfs){
    let lo=-0.99, hi=10;
    let flo = npv(lo, initial, cfs);
    let fhi = npv(hi, initial, cfs);
    if((flo>0 && fhi>0) || (flo<0 && fhi<0)) return null;
    for(let k=0;k<100;k++){
      const mid=(lo+hi)/2;
      const fm = npv(mid, initial, cfs);
      if((fm>0)===(flo>0)){ lo=mid; flo=fm; } else { hi=mid; }
    }
    return (lo+hi)/2;
  }

  function calc(){
    const initial = parseFloat(document.getElementById('irrInitial').value)||0;
    const cfs = cfIds.map(id => parseFloat(document.getElementById(id).value)||0);
    const warnEl = document.getElementById('irrWarning');
    const totalReturned = cfs.reduce((a,b)=>a+b,0);
    const netProfit = totalReturned - initial;

    const irr = solveIRR(initial, cfs);

    document.getElementById('irrTotalReturned').textContent = '$'+totalReturned.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    document.getElementById('irrNetProfit').textContent = (netProfit<0?'-':'')+'$'+Math.abs(netProfit).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

    if(initial<=0 || irr===null || !isFinite(irr)){
      document.getElementById('irrRate').textContent = '—';
      if(warnEl){
        warnEl.textContent = initial<=0
          ? 'Enter an initial investment greater than zero.'
          : 'No IRR found in the searched range — the cash flows may never offset the initial investment, or may all share the same sign.';
        warnEl.classList.add('show');
      }
      return;
    }
    if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }
    document.getElementById('irrRate').textContent = (irr*100).toFixed(2)+'%';
  }

  ['irrInitial'].concat(cfIds).forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();


// ---- Payback Period Calculator ----
(function(){
  if(!document.getElementById('pbpInitial')) return;
  const cfIds = ['pbpY1','pbpY2','pbpY3','pbpY4','pbpY5'];

  function fmtMoney(n){
    const sign = n<0 ? '-' : '';
    return sign+'$'+Math.abs(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function calc(){
    const initial = parseFloat(document.getElementById('pbpInitial').value)||0;
    const cfs = cfIds.map(id => parseFloat(document.getElementById(id).value)||0);
    const tbody = document.getElementById('pbpTbody');

    let cum = 0;
    let paybackYears = null;
    let rows = '';
    for(let yr=0; yr<cfs.length; yr++){
      const prevCum = cum;
      cum += cfs[yr];
      rows += '<tr><td>'+(yr+1)+'</td><td>'+fmtMoney(cfs[yr])+'</td><td>'+fmtMoney(cum)+'</td></tr>';
      if(paybackYears===null && cum>=initial && initial>0){
        const remaining = initial - prevCum;
        const frac = cfs[yr]>0 ? remaining/cfs[yr] : 0;
        paybackYears = yr + frac;
      }
    }
    tbody.innerHTML = rows;

    const resultEl = document.getElementById('pbpPeriod');
    if(initial<=0){
      resultEl.textContent = 'Enter an investment amount';
    } else if(paybackYears===null){
      resultEl.textContent = '> 5 years — not recovered within the entries provided';
    } else {
      resultEl.textContent = paybackYears.toFixed(2)+' years';
    }
  }

  ['pbpInitial'].concat(cfIds).forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Batch W1-F3: Investment / Retirement cluster ----
(function(){
// ============================================================
// TallyBench — new tool JS (batch: present value, future value,
// savings, pension, social security, annuity, annuity payout,
// rmd, marriage tax). Written as standalone IIFEs matching the
// existing script.js pattern. NOT yet merged into script.js —
// hand off for central merge per project rules.
// ============================================================

function tbMoney(n){
  return (n<0?'-':'')+'$'+Math.round(Math.abs(n)).toLocaleString();
}

// ---- Present Value Calculator ----
(function(){
  if(!document.getElementById('pvFV')) return;

  const fvEl = document.getElementById('pvFV');
  const pmtEl = document.getElementById('pvPMT');
  const rateEl = document.getElementById('pvRate');
  const yearsEl = document.getElementById('pvYears');
  const seg = document.getElementById('pvModeSeg');
  const fvField = document.getElementById('pvFVField');
  const pmtField = document.getElementById('pvPMTField');
  const noteEl = document.getElementById('pvNote');

  function mode(){
    const btn = seg.querySelector('button.active');
    return btn ? btn.dataset.mode : 'lump';
  }

  function calc(){
    const rate = (parseFloat(rateEl.value)||0)/100;
    const years = parseFloat(yearsEl.value)||0;
    const m = mode();
    let pv = 0;

    if(m === 'lump'){
      const fv = parseFloat(fvEl.value)||0;
      pv = rate === 0 ? fv : fv/Math.pow(1+rate, years);
      noteEl.textContent = 'Discounted from a single future lump sum';
    } else {
      const pmt = parseFloat(pmtEl.value)||0;
      pv = rate === 0 ? pmt*years : pmt*(1-Math.pow(1+rate,-years))/rate;
      noteEl.textContent = 'Discounted from a stream of regular annual payments';
    }

    document.getElementById('pvPV').textContent = tbMoney(pv);
  }

  seg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    if(btn.dataset.mode === 'lump'){
      fvField.style.display = '';
      pmtField.style.display = 'none';
    } else {
      fvField.style.display = 'none';
      pmtField.style.display = '';
    }
    calc();
  });

  [fvEl, pmtEl, rateEl, yearsEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Future Value Calculator ----
(function(){
  if(!document.getElementById('fvPV')) return;

  const pvEl = document.getElementById('fvPV');
  const pmtEl = document.getElementById('fvPMT');
  const rateEl = document.getElementById('fvRate');
  const yearsEl = document.getElementById('fvYears');

  function calc(){
    const pv = parseFloat(pvEl.value)||0;
    const pmt = parseFloat(pmtEl.value)||0;
    const rate = parseFloat(rateEl.value)||0;
    const years = Math.max(parseFloat(yearsEl.value)||0, 0);
    const i = rate/100/12;
    const n = years*12;

    let fv;
    if(i === 0){
      fv = pv + pmt*n;
    } else {
      fv = pv*Math.pow(1+i, n) + pmt*((Math.pow(1+i, n)-1)/i);
    }
    const totalContrib = pv + pmt*n;
    const growth = fv - totalContrib;

    document.getElementById('fvFV').textContent = tbMoney(fv);
    document.getElementById('fvContrib').textContent = tbMoney(totalContrib);
    document.getElementById('fvGrowth').textContent = tbMoney(growth);
  }

  [pvEl, pmtEl, rateEl, yearsEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Savings Calculator ----
(function(){
  if(!document.getElementById('svInitial')) return;

  const initialEl = document.getElementById('svInitial');
  const monthlyEl = document.getElementById('svMonthly');
  const rateEl = document.getElementById('svRate');
  const yearsEl = document.getElementById('svYears');
  const freqEl = document.getElementById('svFreq');

  function calc(){
    const initial = parseFloat(initialEl.value)||0;
    const monthly = parseFloat(monthlyEl.value)||0;
    const annualRate = parseFloat(rateEl.value)||0;
    const years = Math.max(Math.round(parseFloat(yearsEl.value)||0), 0);
    const freq = parseFloat(freqEl.value)||12;

    const periodicRate = Math.pow(1 + (annualRate/100)/freq, freq/12) - 1;

    let balance = initial;
    let totalDeposited = initial;
    const months = years*12;
    for(let m=0; m<months; m++){
      balance = balance*(1+periodicRate) + monthly;
      totalDeposited += monthly;
    }
    const interest = balance - totalDeposited;

    document.getElementById('svBalance').textContent = tbMoney(balance);
    document.getElementById('svDeposited').textContent = tbMoney(totalDeposited);
    document.getElementById('svInterest').textContent = tbMoney(interest);
  }

  [initialEl, monthlyEl, rateEl, yearsEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  freqEl.addEventListener('change', calc);

  calc();
})();

// ---- Pension Calculator ----
(function(){
  if(!document.getElementById('pnYears')) return;

  const yearsEl = document.getElementById('pnYears');
  const salaryEl = document.getElementById('pnSalary');
  const accrualEl = document.getElementById('pnAccrual');

  function calc(){
    const years = Math.max(parseFloat(yearsEl.value)||0, 0);
    const salary = Math.max(parseFloat(salaryEl.value)||0, 0);
    const accrual = Math.max(parseFloat(accrualEl.value)||0, 0);

    const annual = salary * (accrual/100) * years;
    const monthly = annual/12;
    const pct = salary > 0 ? (annual/salary)*100 : 0;

    document.getElementById('pnAnnual').textContent = tbMoney(annual);
    document.getElementById('pnMonthly').textContent = tbMoney(monthly);
    document.getElementById('pnPct').textContent = pct.toFixed(1)+'%';
  }

  [yearsEl, salaryEl, accrualEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Social Security Calculator ----
(function(){
  if(!document.getElementById('ssFRABenefit')) return;

  const benefitEl = document.getElementById('ssFRABenefit');
  const fraAgeEl = document.getElementById('ssFRAAge');
  const claimAgeEl = document.getElementById('ssClaimAge');

  function calc(){
    const benefit = Math.max(parseFloat(benefitEl.value)||0, 0);
    const fraAge = parseFloat(fraAgeEl.value)||67;
    const claimAge = parseFloat(claimAgeEl.value)||67;

    let multiplier;
    if(claimAge < fraAge){
      const monthsEarly = (fraAge - claimAge)*12;
      const firstPart = Math.min(monthsEarly, 36);
      const remaining = Math.max(monthsEarly-36, 0);
      const reduction = firstPart*(5/9) + remaining*(5/12);
      multiplier = 100 - reduction;
    } else if(claimAge > fraAge){
      const monthsLate = (claimAge - fraAge)*12;
      multiplier = 100 + monthsLate*(2/3);
    } else {
      multiplier = 100;
    }

    const adjusted = benefit * multiplier/100;
    const annual = adjusted*12;

    document.getElementById('ssAdjusted').textContent = tbMoney(adjusted);
    document.getElementById('ssPct').textContent = multiplier.toFixed(1)+'%';
    document.getElementById('ssAnnual').textContent = tbMoney(annual);
  }

  [benefitEl, fraAgeEl, claimAgeEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Annuity Calculator (accumulation phase) ----
(function(){
  if(!document.getElementById('anInitial')) return;

  const initialEl = document.getElementById('anInitial');
  const contribEl = document.getElementById('anContribution');
  const rateEl = document.getElementById('anRate');
  const yearsEl = document.getElementById('anYears');

  function calc(){
    const initial = Math.max(parseFloat(initialEl.value)||0, 0);
    const contribution = Math.max(parseFloat(contribEl.value)||0, 0);
    const rate = parseFloat(rateEl.value)||0;
    const years = Math.max(parseFloat(yearsEl.value)||0, 0);
    const i = rate/100/12;
    const n = years*12;

    let fv;
    if(i === 0){
      fv = initial + contribution*n;
    } else {
      fv = initial*Math.pow(1+i, n) + contribution*((Math.pow(1+i, n)-1)/i);
    }
    const totalContrib = initial + contribution*n;
    const growth = fv - totalContrib;

    document.getElementById('anFV').textContent = tbMoney(fv);
    document.getElementById('anContrib').textContent = tbMoney(totalContrib);
    document.getElementById('anGrowth').textContent = tbMoney(growth);
  }

  [initialEl, contribEl, rateEl, yearsEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Annuity Payout Calculator ----
(function(){
  if(!document.getElementById('apBalance')) return;

  const balanceEl = document.getElementById('apBalance');
  const rateEl = document.getElementById('apRate');
  const yearsEl = document.getElementById('apYears');

  function calc(){
    const balance = Math.max(parseFloat(balanceEl.value)||0, 0);
    const rate = parseFloat(rateEl.value)||0;
    const years = Math.max(parseFloat(yearsEl.value)||0, 0.0001);
    const i = rate/100/12;
    const n = years*12;

    let monthly;
    if(i === 0){
      monthly = n > 0 ? balance/n : 0;
    } else {
      monthly = balance * i / (1 - Math.pow(1+i, -n));
    }
    const annual = monthly*12;
    const total = monthly*n;

    document.getElementById('apMonthly').textContent = tbMoney(monthly);
    document.getElementById('apAnnual').textContent = tbMoney(annual);
    document.getElementById('apTotal').textContent = tbMoney(total);
  }

  [balanceEl, rateEl, yearsEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- RMD Calculator ----
(function(){
  if(!document.getElementById('rmBalance')) return;

  const balanceEl = document.getElementById('rmBalance');
  const ageEl = document.getElementById('rmAge');

  const UNIFORM_LIFETIME_TABLE = {
    72:27.4, 73:26.5, 74:25.5, 75:24.6, 76:23.7, 77:22.9, 78:22.0, 79:21.1,
    80:20.2, 81:19.4, 82:18.5, 83:17.7, 84:16.8, 85:16.0, 86:15.2, 87:14.4,
    88:13.7, 89:12.9, 90:12.2, 91:11.5, 92:10.8, 93:10.1, 94:9.5, 95:8.9,
    96:8.4, 97:7.8, 98:7.3, 99:6.8, 100:6.4
  };

  function setWarning(msg){
    const el = document.getElementById('rmWarning');
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }

  function divisorForAge(age){
    const a = Math.max(Math.round(age), 72);
    if(a >= 100) return UNIFORM_LIFETIME_TABLE[100];
    return UNIFORM_LIFETIME_TABLE[a] !== undefined ? UNIFORM_LIFETIME_TABLE[a] : UNIFORM_LIFETIME_TABLE[100];
  }

  function calc(){
    const balance = Math.max(parseFloat(balanceEl.value)||0, 0);
    const age = parseFloat(ageEl.value)||0;

    if(age < 72){
      setWarning('RMDs generally aren\'t required yet at this age. The current RMD starting age is 73 (per SECURE Act 2.0) and has changed before — confirm with a tax advisor or irs.gov.');
      document.getElementById('rmAmount').textContent = tbMoney(0);
      document.getElementById('rmDivisor').textContent = '—';
      return;
    }

    setWarning('');
    const divisor = divisorForAge(age);
    const rmd = divisor > 0 ? balance/divisor : 0;

    document.getElementById('rmAmount').textContent = tbMoney(rmd);
    document.getElementById('rmDivisor').textContent = divisor.toFixed(1);
  }

  [balanceEl, ageEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Marriage Tax Calculator ----
(function(){
  if(!document.getElementById('mtIncomeA')) return;

  const incomeAEl = document.getElementById('mtIncomeA');
  const incomeBEl = document.getElementById('mtIncomeB');

  const SINGLE_BRACKETS_2024 = [
    [0, 11600, 0.10],
    [11600, 47150, 0.12],
    [47150, 100525, 0.22],
    [100525, 191950, 0.24],
    [191950, 243725, 0.32],
    [243725, 609350, 0.35],
    [609350, null, 0.37]
  ];

  const MFJ_BRACKETS_2024 = [
    [0, 23200, 0.10],
    [23200, 94300, 0.12],
    [94300, 201050, 0.22],
    [201050, 383900, 0.24],
    [383900, 487450, 0.32],
    [487450, 731200, 0.35],
    [731200, null, 0.37]
  ];

  function taxFor(income, brackets){
    let tax = 0;
    for(let i=0; i<brackets.length; i++){
      const lower = brackets[i][0];
      const upper = brackets[i][1];
      const rate = brackets[i][2];
      if(income > lower){
        const taxableInBracket = Math.min(income, upper === null ? income : upper) - lower;
        tax += taxableInBracket * rate;
      }
    }
    return tax;
  }

  function calc(){
    const incomeA = Math.max(parseFloat(incomeAEl.value)||0, 0);
    const incomeB = Math.max(parseFloat(incomeBEl.value)||0, 0);

    const combinedSingle = taxFor(incomeA, SINGLE_BRACKETS_2024) + taxFor(incomeB, SINGLE_BRACKETS_2024);
    const taxMFJ = taxFor(incomeA+incomeB, MFJ_BRACKETS_2024);
    const diff = taxMFJ - combinedSingle;

    document.getElementById('mtSingle').textContent = tbMoney(combinedSingle);
    document.getElementById('mtMFJ').textContent = tbMoney(taxMFJ);
    document.getElementById('mtDiff').textContent = tbMoney(Math.abs(diff));

    const diffLabel = document.getElementById('mtDiffLabel');
    if(diffLabel){
      diffLabel.textContent = diff > 0 ? 'Marriage penalty' : (diff < 0 ? 'Marriage bonus' : 'Marriage penalty / bonus');
    }
  }

  [incomeAEl, incomeBEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();
})();

// ---- Batch W1-F4: Tax / Business cluster ----
// TallyBench — new tool logic (batch: estate-tax, inflation, debt-consolidation,
// student-loan-repayment, student-loan, college-cost, depreciation, margin,
// business-loan). Each block is a self-guarding IIFE — safe to concatenate
// into script.js later. Do not attach to script.js directly per task rules;
// this file is scratch output only.

// ---- Estate Tax Calculator ----
(function () {
  if (!document.getElementById('etGross')) return;

  var etGross = document.getElementById('etGross');
  var etExemption = document.getElementById('etExemption');
  var etRate = document.getElementById('etRate');
  var etTaxable = document.getElementById('etTaxable');
  var etTax = document.getElementById('etTax');
  var etNet = document.getElementById('etNet');

  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function calc() {
    var gross = parseFloat(etGross.value) || 0;
    var exemption = parseFloat(etExemption.value) || 0;
    var rate = parseFloat(etRate.value) || 0;
    var taxable = Math.max(0, gross - exemption);
    var tax = taxable * rate / 100;
    var net = gross - tax;
    etTaxable.textContent = fmt(taxable);
    etTax.textContent = fmt(tax);
    etNet.textContent = fmt(net);
  }

  [etGross, etExemption, etRate].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Inflation Calculator ----
(function () {
  if (!document.getElementById('inflAmt')) return;

  var inflAmt = document.getElementById('inflAmt');
  var inflStartYear = document.getElementById('inflStartYear');
  var inflEndYear = document.getElementById('inflEndYear');
  var inflRate = document.getElementById('inflRate');
  var inflModeSeg = document.getElementById('inflModeSeg');
  var inflAdjusted = document.getElementById('inflAdjusted');
  var inflCum = document.getElementById('inflCum');

  var mode = 'future';

  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function calc() {
    var amount = parseFloat(inflAmt.value) || 0;
    var startYear = parseFloat(inflStartYear.value) || 0;
    var endYear = parseFloat(inflEndYear.value) || 0;
    var rate = parseFloat(inflRate.value) || 0;
    var factor = 1 + rate / 100;
    var adjusted;
    if (mode === 'future') {
      adjusted = amount * Math.pow(factor, endYear - startYear);
    } else {
      adjusted = factor === 0 ? amount : amount / Math.pow(factor, startYear - endYear);
    }
    var cumPct = amount === 0 ? 0 : (adjusted / amount - 1) * 100;
    inflAdjusted.textContent = fmt(adjusted);
    inflCum.textContent = cumPct.toFixed(2) + '%';
  }

  [inflAmt, inflStartYear, inflEndYear, inflRate].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  if (inflModeSeg) {
    var segButtons = inflModeSeg.querySelectorAll('button');
    segButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        segButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        mode = btn.getAttribute('data-mode');
        calc();
      });
    });
  }

  calc();
})();

// ---- Debt Consolidation Calculator ----
(function () {
  if (!document.getElementById('dcDebt1')) return;

  var dcDebt1 = document.getElementById('dcDebt1');
  var dcDebt2 = document.getElementById('dcDebt2');
  var dcDebt3 = document.getElementById('dcDebt3');
  var dcDebt4 = document.getElementById('dcDebt4');
  var dcCurrentPayment = document.getElementById('dcCurrentPayment');
  var dcNewRate = document.getElementById('dcNewRate');
  var dcNewTerm = document.getElementById('dcNewTerm');
  var dcTotalBalance = document.getElementById('dcTotalBalance');
  var dcNewPayment = document.getElementById('dcNewPayment');
  var dcChange = document.getElementById('dcChange');
  var dcNewInterest = document.getElementById('dcNewInterest');

  function fmt(n) {
    var sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pmt(P, annualRatePct, months) {
    var i = annualRatePct / 100 / 12;
    if (months <= 0) return 0;
    if (i === 0) return P / months;
    return P * i / (1 - Math.pow(1 + i, -months));
  }

  function calc() {
    var d1 = parseFloat(dcDebt1.value) || 0;
    var d2 = parseFloat(dcDebt2.value) || 0;
    var d3 = parseFloat(dcDebt3.value) || 0;
    var d4 = parseFloat(dcDebt4.value) || 0;
    var currentPayment = parseFloat(dcCurrentPayment.value) || 0;
    var rate = parseFloat(dcNewRate.value) || 0;
    var termYears = parseFloat(dcNewTerm.value) || 0;
    var total = d1 + d2 + d3 + d4;
    var months = termYears * 12;
    var newPayment = pmt(total, rate, months);
    var change = currentPayment - newPayment;
    var newInterest = newPayment * months - total;

    dcTotalBalance.textContent = fmt(total);
    dcNewPayment.textContent = fmt(newPayment);
    dcChange.textContent = fmt(change);
    dcNewInterest.textContent = fmt(newInterest);
  }

  [dcDebt1, dcDebt2, dcDebt3, dcDebt4, dcCurrentPayment, dcNewRate, dcNewTerm].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Student Loan Repayment Calculator ----
(function () {
  if (!document.getElementById('slrBalance')) return;

  var slrBalance = document.getElementById('slrBalance');
  var slrRate = document.getElementById('slrRate');
  var slrAGI = document.getElementById('slrAGI');
  var slrFamily = document.getElementById('slrFamily');
  var slrDependents = document.getElementById('slrDependents');
  var slrIbrTier = document.getElementById('slrIbrTier');
  var slrStandard = document.getElementById('slrStandard');
  var slrRAP = document.getElementById('slrRAP');
  var slrIBR = document.getElementById('slrIBR');
  var slrRAPRate = document.getElementById('slrRAPRate');
  var slrDiscretionary = document.getElementById('slrDiscretionary');
  var slrSavings = document.getElementById('slrSavings');

  // 2026 HHS poverty guidelines, 48 contiguous states + DC:
  // $15,960 for a household of 1, plus $5,680 per additional person.
  var FPL_BASE = 15960;
  var FPL_STEP = 5680;

  function fmt(n) {
    var sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pmt(P, annualRatePct, months) {
    var i = annualRatePct / 100 / 12;
    if (months <= 0) return 0;
    if (i === 0) return P / months;
    return P * i / (1 - Math.pow(1 + i, -months));
  }

  // RAP charges a flat percentage of total AGI, stepping up 1 point per
  // $10,000 of income: 1% at $10,001-$20,000 through 10% above $100,000.
  function rapPct(agi) {
    if (agi <= 10000) return 0;
    if (agi > 100000) return 0.10;
    return Math.min(10, Math.ceil((agi - 10000) / 10000)) / 100;
  }

  function calc() {
    var balance = parseFloat(slrBalance.value) || 0;
    var rate = parseFloat(slrRate.value) || 0;
    var agi = parseFloat(slrAGI.value) || 0;
    var familySize = parseFloat(slrFamily.value) || 1;
    var dependents = parseFloat(slrDependents.value) || 0;
    var ibrPct = parseFloat(slrIbrTier.value) || 0.10;

    var standardPayment = pmt(balance, rate, 120);

    // RAP: (AGI x bracket rate / 12) - $50 per dependent, never below $10.
    var pct = rapPct(agi);
    var rapPayment = Math.max(10, agi * pct / 12 - 50 * dependents);

    // IBR: a share of discretionary income, where discretionary income is
    // AGI above 150% of the poverty guideline for the borrower's family size.
    var poverty = FPL_BASE + (familySize - 1) * FPL_STEP;
    var discretionary = Math.max(0, agi - poverty * 1.5);
    var ibrPayment = discretionary * ibrPct / 12;

    var lowest = Math.min(rapPayment, ibrPayment);
    var savings = standardPayment - lowest;

    slrStandard.textContent = fmt(standardPayment);
    slrRAP.textContent = fmt(rapPayment);
    slrIBR.textContent = fmt(ibrPayment);
    slrRAPRate.textContent = agi <= 10000 ? '$10 floor' : (pct * 100).toFixed(0) + '% of AGI';
    slrDiscretionary.textContent = fmt(discretionary);
    slrSavings.textContent = savings > 0 ? fmt(savings) : fmt(0);
  }

  [slrBalance, slrRate, slrAGI, slrFamily, slrDependents, slrIbrTier].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Student Loan Calculator ----
(function () {
  if (!document.getElementById('slBalance')) return;

  var slBalance = document.getElementById('slBalance');
  var slRate = document.getElementById('slRate');
  var slTerm = document.getElementById('slTerm');
  var slPayment = document.getElementById('slPayment');
  var slInterest = document.getElementById('slInterest');
  var slTotal = document.getElementById('slTotal');

  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function calc() {
    var balance = parseFloat(slBalance.value) || 0;
    var rate = parseFloat(slRate.value) || 0;
    var years = parseFloat(slTerm.value) || 0;
    var n = years * 12;
    var i = rate / 100 / 12;
    var payment = 0;
    if (n > 0) {
      payment = i === 0 ? balance / n : balance * i / (1 - Math.pow(1 + i, -n));
    }
    var totalPaid = payment * n;
    var totalInterest = totalPaid - balance;

    slPayment.textContent = fmt(payment);
    slInterest.textContent = fmt(totalInterest);
    slTotal.textContent = fmt(totalPaid);
  }

  [slBalance, slRate, slTerm].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- College Cost Calculator ----
(function () {
  if (!document.getElementById('ccCurrentCost')) return;

  var ccCurrentCost = document.getElementById('ccCurrentCost');
  var ccYearsUntil = document.getElementById('ccYearsUntil');
  var ccYearsOfSchool = document.getElementById('ccYearsOfSchool');
  var ccInflation = document.getElementById('ccInflation');
  var ccFirstYear = document.getElementById('ccFirstYear');
  var ccTotal = document.getElementById('ccTotal');
  var ccAverage = document.getElementById('ccAverage');

  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function calc() {
    var currentCost = parseFloat(ccCurrentCost.value) || 0;
    var yearsUntil = parseFloat(ccYearsUntil.value) || 0;
    var yearsOfSchool = Math.max(1, parseFloat(ccYearsOfSchool.value) || 1);
    var inflRate = parseFloat(ccInflation.value) || 0;
    var factor = 1 + inflRate / 100;

    var enrollCost = currentCost * Math.pow(factor, yearsUntil);
    var total = 0;
    for (var y = 0; y < yearsOfSchool; y++) {
      total += enrollCost * Math.pow(factor, y);
    }
    var average = total / yearsOfSchool;

    ccFirstYear.textContent = fmt(enrollCost);
    ccTotal.textContent = fmt(total);
    ccAverage.textContent = fmt(average);
  }

  [ccCurrentCost, ccYearsUntil, ccYearsOfSchool, ccInflation].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();

// ---- Depreciation Calculator ----
(function () {
  if (!document.getElementById('depCost')) return;

  var depCost = document.getElementById('depCost');
  var depSalvage = document.getElementById('depSalvage');
  var depLife = document.getElementById('depLife');
  var depMethodSeg = document.getElementById('depMethodSeg');
  var depTotal = document.getElementById('depTotal');
  var depAnnual = document.getElementById('depAnnual');
  var depAnnualRow = document.getElementById('depAnnualRow');
  var depTbody = document.getElementById('depTbody');

  var method = 'straight';

  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function calc() {
    var cost = parseFloat(depCost.value) || 0;
    var salvage = parseFloat(depSalvage.value) || 0;
    var life = Math.max(1, Math.round(parseFloat(depLife.value) || 1));
    var totalDep = Math.max(0, cost - salvage);

    depTotal.textContent = fmt(totalDep);

    var rows = [];
    if (method === 'straight') {
      depAnnualRow.style.display = '';
      var annual = totalDep / life;
      depAnnual.textContent = fmt(annual);
      var book = cost;
      for (var y = 1; y <= life; y++) {
        book -= annual;
        if (y === life) book = salvage;
        rows.push({ year: y, dep: annual, book: book });
      }
    } else {
      depAnnualRow.style.display = 'none';
      var rate = 2 / life;
      var bookDDB = cost;
      for (var y2 = 1; y2 <= life; y2++) {
        var dep = bookDDB * rate;
        if (bookDDB - dep < salvage) dep = bookDDB - salvage;
        bookDDB -= dep;
        rows.push({ year: y2, dep: dep, book: bookDDB });
      }
    }

    var html = '';
    rows.forEach(function (r) {
      html += '<tr><td>' + r.year + '</td><td>' + fmt(r.dep) + '</td><td>' + fmt(r.book) + '</td></tr>';
    });
    depTbody.innerHTML = html;
  }

  [depCost, depSalvage, depLife].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  if (depMethodSeg) {
    var segButtons = depMethodSeg.querySelectorAll('button');
    segButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        segButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        method = btn.getAttribute('data-method');
        calc();
      });
    });
  }

  calc();
})();

// ---- Margin Calculator ----
(function () {
  // Guard on mgCostOut, NOT mgCost. break-even-calculator.html has its own
  // small margin panel that also uses the id "mgCost" (with mgSell/mgMargin,
  // handled by its own IIFE further up), so guarding on mgCost let this block
  // run there too — and it then threw on the first missing element, killing
  // every IIFE after this point in the file on that page. mgCostOut exists
  // only on margin-calculator.html.
  if (!document.getElementById('mgCostOut')) return;

  var mgModeSeg = document.getElementById('mgModeSeg');
  var mgCost = document.getElementById('mgCost');
  var mgPrice = document.getElementById('mgPrice');
  var mgMarginInput = document.getElementById('mgMarginInput');
  var mgPriceField = document.getElementById('mgPriceField');
  var mgMarginField = document.getElementById('mgMarginField');
  var mgCostOut = document.getElementById('mgCostOut');
  var mgPriceOut = document.getElementById('mgPriceOut');
  var mgProfit = document.getElementById('mgProfit');
  var mgMarginOut = document.getElementById('mgMarginOut');
  var mgMarkupOut = document.getElementById('mgMarkupOut');

  var mode = 'costprice';

  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function calc() {
    var cost = parseFloat(mgCost.value) || 0;
    var price;

    if (mode === 'costprice') {
      price = parseFloat(mgPrice.value) || 0;
    } else {
      var desiredMargin = parseFloat(mgMarginInput.value) || 0;
      var denom = 1 - desiredMargin / 100;
      price = denom <= 0 ? 0 : cost / denom;
    }

    var profit = price - cost;
    var marginPct = price === 0 ? 0 : (profit / price) * 100;
    var markupPct = cost === 0 ? 0 : (profit / cost) * 100;

    mgCostOut.textContent = fmt(cost);
    mgPriceOut.textContent = fmt(price);
    mgProfit.textContent = fmt(profit);
    mgMarginOut.textContent = marginPct.toFixed(2) + '%';
    mgMarkupOut.textContent = markupPct.toFixed(2) + '%';
  }

  [mgCost, mgPrice, mgMarginInput].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  if (mgModeSeg) {
    var segButtons = mgModeSeg.querySelectorAll('button');
    segButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        segButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        mode = btn.getAttribute('data-mode');
        if (mode === 'costprice') {
          mgPriceField.style.display = '';
          mgMarginField.style.display = 'none';
        } else {
          mgPriceField.style.display = 'none';
          mgMarginField.style.display = '';
        }
        calc();
      });
    });
  }

  calc();
})();

// ---- Business Loan Calculator ----
(function () {
  if (!document.getElementById('blAmount')) return;

  var blAmount = document.getElementById('blAmount');
  var blRate = document.getElementById('blRate');
  var blTerm = document.getElementById('blTerm');
  var blTermLabel = document.getElementById('blTermLabel');
  var blTermUnitSeg = document.getElementById('blTermUnitSeg');
  var blFeePct = document.getElementById('blFeePct');
  var blFeeModeSeg = document.getElementById('blFeeModeSeg');
  var blPayment = document.getElementById('blPayment');
  var blInterest = document.getElementById('blInterest');
  var blTotalCost = document.getElementById('blTotalCost');
  var blUpfrontCash = document.getElementById('blUpfrontCash');

  var termUnit = 'years';
  var feeMode = 'financed';

  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pmt(P, annualRatePct, months) {
    var i = annualRatePct / 100 / 12;
    if (months <= 0) return 0;
    if (i === 0) return P / months;
    return P * i / (1 - Math.pow(1 + i, -months));
  }

  function calc() {
    var amount = parseFloat(blAmount.value) || 0;
    var rate = parseFloat(blRate.value) || 0;
    var termVal = parseFloat(blTerm.value) || 0;
    var feePct = parseFloat(blFeePct.value) || 0;
    var months = termUnit === 'years' ? termVal * 12 : termVal;

    var upfrontCash = 0;
    var totalCost, totalInterest, payment;

    if (feeMode === 'financed') {
      var totalLoan = amount * (1 + feePct / 100);
      payment = pmt(totalLoan, rate, months);
      totalCost = payment * months;
      totalInterest = totalCost - totalLoan;
    } else {
      payment = pmt(amount, rate, months);
      var totalLoanOnly = payment * months;
      totalInterest = totalLoanOnly - amount;
      upfrontCash = amount * feePct / 100;
      totalCost = totalLoanOnly + upfrontCash;
    }

    blPayment.textContent = fmt(payment);
    blInterest.textContent = fmt(totalInterest);
    blTotalCost.textContent = fmt(totalCost);
    blUpfrontCash.textContent = fmt(upfrontCash);
  }

  [blAmount, blRate, blTerm, blFeePct].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  if (blTermUnitSeg) {
    var unitButtons = blTermUnitSeg.querySelectorAll('button');
    unitButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        unitButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        termUnit = btn.getAttribute('data-unit');
        if (blTermLabel) blTermLabel.textContent = termUnit === 'years' ? 'Term (years)' : 'Term (months)';
        calc();
      });
    });
  }

  if (blFeeModeSeg) {
    var modeButtons = blFeeModeSeg.querySelectorAll('button');
    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        modeButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        feeMode = btn.getAttribute('data-mode');
        calc();
      });
    });
  }

  calc();
})();

// ---- Batch W1-F5: Remaining finance + Health cluster 1 ----
(function(){
// =====================================================================
// TallyBench — new tool JS logic (batch: 14 calculators)
// NOTE: This is a SCRATCH file only. Do not wire it into script.js here —
// script.js is centrally owned. Each IIFE below is self-guarded with
// `if(!document.getElementById(...)) return;` so it is safe to append
// into script.js later without affecting any existing page.
// =====================================================================

function tbMoney(n){
  if(!isFinite(n)) return '0';
  return n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
}

// ---- 1. Personal Loan Calculator ----
(function(){
  if(!document.getElementById('plAmount')) return;
  const amountEl = document.getElementById('plAmount');
  const rateEl = document.getElementById('plRate');
  const termEl = document.getElementById('plTerm');

  function calc(){
    const amount = parseFloat(amountEl.value)||0;
    const rate = parseFloat(rateEl.value)||0;
    const n = parseInt(termEl.value,10)||0;
    const i = rate/100/12;
    let payment = 0;
    if(n>0){
      payment = i>0 ? amount*i/(1-Math.pow(1+i,-n)) : amount/n;
    }
    const totalPaid = payment*n;
    const totalInterest = totalPaid-amount;
    document.getElementById('plPayment').textContent = '$'+tbMoney(payment);
    document.getElementById('plInterest').textContent = '$'+tbMoney(totalInterest);
    document.getElementById('plTotal').textContent = '$'+tbMoney(totalPaid);
  }
  [amountEl, rateEl, termEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 2. Boat Loan Calculator ----
(function(){
  if(!document.getElementById('blPrice')) return;
  const priceEl = document.getElementById('blPrice');
  const downEl = document.getElementById('blDown');
  const rateEl = document.getElementById('blRate');
  const termEl = document.getElementById('blTermYears');

  function calc(){
    const price = parseFloat(priceEl.value)||0;
    const down = parseFloat(downEl.value)||0;
    const rate = parseFloat(rateEl.value)||0;
    const termYears = parseFloat(termEl.value)||0;
    const loanAmount = Math.max(price-down,0);
    const n = Math.round(termYears*12);
    const i = rate/100/12;
    let payment = 0;
    if(n>0){
      payment = i>0 ? loanAmount*i/(1-Math.pow(1+i,-n)) : loanAmount/n;
    }
    const totalPaid = payment*n;
    const totalInterest = totalPaid-loanAmount;
    document.getElementById('blLoanAmount').textContent = '$'+tbMoney(loanAmount);
    document.getElementById('blPayment').textContent = '$'+tbMoney(payment);
    document.getElementById('blInterest').textContent = '$'+tbMoney(totalInterest);
  }
  [priceEl, downEl, rateEl, termEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 3. Lease Calculator (general, non-auto) ----
(function(){
  if(!document.getElementById('lcAssetValue')) return;
  const assetEl = document.getElementById('lcAssetValue');
  const termEl = document.getElementById('lcTerm');
  const residualEl = document.getElementById('lcResidual');
  const rateEl = document.getElementById('lcRate');

  function calc(){
    const assetValue = parseFloat(assetEl.value)||0;
    const term = parseFloat(termEl.value)||0;
    const residual = parseFloat(residualEl.value)||0;
    const rate = parseFloat(rateEl.value)||0;
    const depreciation = term>0 ? (assetValue-residual)/term : 0;
    const financeCharge = (assetValue+residual)*(rate/100/12)/2;
    const payment = depreciation+financeCharge;
    const totalPayments = payment*term;
    const effectiveCostVsBuying = assetValue-residual;
    document.getElementById('lcPayment').textContent = '$'+tbMoney(payment);
    document.getElementById('lcTotalPayments').textContent = '$'+tbMoney(totalPayments);
    document.getElementById('lcEffectiveCost').textContent = '$'+tbMoney(effectiveCostVsBuying);
  }
  [assetEl, termEl, residualEl, rateEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 4. Budget Calculator (50/30/20) ----
(function(){
  if(!document.getElementById('bgIncome')) return;
  const incomeEl = document.getElementById('bgIncome');
  const catIds = ['bgHousing','bgTransportation','bgFood','bgUtilities','bgInsurance','bgDebt','bgEntertainment','bgSavings','bgOther'];
  const catLabels = {
    bgHousing:'Housing', bgTransportation:'Transportation', bgFood:'Food',
    bgUtilities:'Utilities', bgInsurance:'Insurance', bgDebt:'Debt Payments',
    bgEntertainment:'Entertainment', bgSavings:'Savings', bgOther:'Other'
  };
  const needsIds = ['bgHousing','bgTransportation','bgUtilities','bgInsurance','bgDebt'];
  const wantsIds = ['bgFood','bgEntertainment','bgOther'];

  function calc(){
    const income = parseFloat(incomeEl.value)||0;
    const vals = {};
    let total = 0;
    catIds.forEach(id=>{
      const v = parseFloat(document.getElementById(id).value)||0;
      vals[id]=v;
      total += v;
    });
    const surplus = income-total;
    document.getElementById('bgTotalExpenses').textContent = '$'+tbMoney(total);
    const surplusEl = document.getElementById('bgSurplus');
    surplusEl.textContent = (surplus<0?'-$':'$')+tbMoney(Math.abs(surplus));

    const breakdownEl = document.getElementById('bgBreakdown');
    if(breakdownEl){
      breakdownEl.innerHTML = catIds.map(id=>{
        const pct = income>0 ? (vals[id]/income*100) : 0;
        return '<tr><td>'+catLabels[id]+'</td><td>$'+tbMoney(vals[id])+'</td><td>'+pct.toFixed(1)+'%</td></tr>';
      }).join('');
    }

    const needs = needsIds.reduce((s,id)=>s+vals[id],0);
    const wants = wantsIds.reduce((s,id)=>s+vals[id],0);
    const savings = vals.bgSavings;
    const needsPct = income>0 ? needs/income*100 : 0;
    const wantsPct = income>0 ? wants/income*100 : 0;
    const savingsPct = income>0 ? savings/income*100 : 0;
    const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
    set('bgNeedsPct', needsPct.toFixed(1)+'% (target 50%)');
    set('bgWantsPct', wantsPct.toFixed(1)+'% (target 30%)');
    set('bgSavingsPct', savingsPct.toFixed(1)+'% (target 20%)');
  }
  [incomeEl, ...catIds.map(id=>document.getElementById(id))].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 5. Commission Calculator ----
(function(){
  if(!document.getElementById('cmSale')) return;
  const saleEl = document.getElementById('cmSale');
  const rateEl = document.getElementById('cmRate');
  const tieredSeg = document.getElementById('cmTieredSeg');
  const tieredFields = document.getElementById('cmTieredFields');
  const thresholdEl = document.getElementById('cmThreshold');
  const rate2El = document.getElementById('cmRate2');
  let tiered = false;

  function calc(){
    const sale = parseFloat(saleEl.value)||0;
    const rate1 = parseFloat(rateEl.value)||0;
    let commission;
    if(tiered){
      const threshold = parseFloat(thresholdEl.value)||0;
      const rate2 = parseFloat(rate2El.value)||0;
      commission = Math.min(sale,threshold)*rate1/100 + Math.max(0,sale-threshold)*rate2/100;
    } else {
      commission = sale*rate1/100;
    }
    document.getElementById('cmCommission').textContent = '$'+tbMoney(commission);
  }
  if(tieredSeg){
    tieredSeg.addEventListener('click',(e)=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      tiered = btn.dataset.tiered === 'on';
      tieredSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if(tieredFields) tieredFields.style.display = tiered ? 'block' : 'none';
      calc();
    });
  }
  [saleEl, rateEl, thresholdEl, rate2El].forEach(el=>{
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 6. Army Body Fat Calculator ----
(function(){
  if(!document.getElementById('abfSexSeg')) return;
  const sexSeg = document.getElementById('abfSexSeg');
  const unitSel = document.getElementById('abfUnit');
  const ageEl = document.getElementById('abfAge');
  const heightEl = document.getElementById('abfHeight');
  const neckEl = document.getElementById('abfNeck');
  const waistEl = document.getElementById('abfWaist');
  const hipWrap = document.getElementById('abfHipWrap');
  const hipEl = document.getElementById('abfHip');
  const warnEl = document.getElementById('abfWarning');
  let sex = 'male';

  function toInches(v){
    return unitSel.value === 'cm' ? v/2.54 : v;
  }

  function armyMax(sex, age){
    if(sex==='male'){
      if(age<=20) return 20;
      if(age<=27) return 22;
      if(age<=39) return 24;
      return 26;
    } else {
      if(age<=20) return 30;
      if(age<=27) return 32;
      if(age<=39) return 34;
      return 36;
    }
  }

  function calc(){
    const age = parseInt(ageEl.value,10)||0;
    const height = toInches(parseFloat(heightEl.value)||0);
    const neck = toInches(parseFloat(neckEl.value)||0);
    const waist = toInches(parseFloat(waistEl.value)||0);
    const hip = toInches(parseFloat(hipEl.value)||0);
    let pct = null;
    if(sex==='male'){
      if(height>0 && (waist-neck)>0) pct = 86.010*Math.log10(waist-neck) - 70.041*Math.log10(height) + 36.76;
    } else {
      if(height>0 && (waist+hip-neck)>0) pct = 163.205*Math.log10(waist+hip-neck) - 97.684*Math.log10(height) - 78.387;
    }
    const bfEl = document.getElementById('abfBfPct');
    const maxEl = document.getElementById('abfMax');
    const resultEl = document.getElementById('abfResult');
    if(pct===null || !isFinite(pct) || isNaN(pct) || pct<0){
      if(warnEl){ warnEl.textContent='Check your measurements — waist should be larger than neck (plus hip for women) to get a valid result.'; warnEl.classList.add('show'); }
      bfEl.textContent='—'; maxEl.textContent='—'; resultEl.textContent='—';
      return;
    }
    if(warnEl){ warnEl.textContent=''; warnEl.classList.remove('show'); }
    pct = Math.min(Math.max(pct,0),70);
    const max = armyMax(sex, age);
    bfEl.textContent = pct.toFixed(1)+'%';
    maxEl.textContent = max+'%';
    resultEl.textContent = pct<=max ? 'PASS' : 'FAIL';
    resultEl.style.color = pct<=max ? 'var(--teal-dark)' : 'var(--orange-dark)';
  }

  sexSeg.addEventListener('click',(e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    sex = btn.dataset.sex;
    sexSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    if(hipWrap) hipWrap.style.display = sex==='female' ? 'flex' : 'none';
    calc();
  });
  unitSel.addEventListener('change', calc);
  [ageEl, heightEl, neckEl, waistEl, hipEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 7. Lean Body Mass Calculator (Boer formula) ----
(function(){
  if(!document.getElementById('lbmSexSeg')) return;
  const sexSeg = document.getElementById('lbmSexSeg');
  const unitSel = document.getElementById('lbmUnit');
  const metricWrap = document.getElementById('lbmMetricWrap');
  const imperialWrap = document.getElementById('lbmImperialWrap');
  let sex = 'male';

  function getMetric(){
    const isImperial = unitSel.value === 'in-lb';
    if(isImperial){
      const heightIn = parseFloat(document.getElementById('lbmHeightIn').value)||0;
      const weightLb = parseFloat(document.getElementById('lbmWeightLb').value)||0;
      return {heightCm: heightIn*2.54, weightKg: weightLb/2.20462, isImperial};
    }
    const heightCm = parseFloat(document.getElementById('lbmHeightCm').value)||0;
    const weightKg = parseFloat(document.getElementById('lbmWeightKg').value)||0;
    return {heightCm, weightKg, isImperial};
  }

  function calc(){
    const {heightCm, weightKg, isImperial} = getMetric();
    let lbmKg;
    if(sex==='male'){
      lbmKg = 0.407*weightKg + 0.267*heightCm - 19.2;
    } else {
      lbmKg = 0.252*weightKg + 0.473*heightCm - 48.3;
    }
    lbmKg = Math.max(lbmKg,0);
    const fatMassKg = Math.max(weightKg-lbmKg,0);
    const bfPct = weightKg>0 ? fatMassKg/weightKg*100 : 0;
    const unit = isImperial ? 'lb' : 'kg';
    const conv = isImperial ? 2.20462 : 1;
    document.getElementById('lbmResult').textContent = (lbmKg*conv).toFixed(1)+' '+unit;
    document.getElementById('lbmFatMass').textContent = (fatMassKg*conv).toFixed(1)+' '+unit;
    document.getElementById('lbmBfPct').textContent = bfPct.toFixed(1)+'%';
  }

  sexSeg.addEventListener('click',(e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    sex = btn.dataset.sex;
    sexSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  unitSel.addEventListener('change', ()=>{
    const isImperial = unitSel.value === 'in-lb';
    metricWrap.style.display = isImperial ? 'none' : 'grid';
    imperialWrap.style.display = isImperial ? 'grid' : 'none';
    calc();
  });
  ['lbmHeightCm','lbmWeightKg','lbmHeightIn','lbmWeightLb'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 8. Healthy Weight Range Calculator ----
(function(){
  if(!document.getElementById('hwUnit')) return;
  const unitSel = document.getElementById('hwUnit');
  const cmWrap = document.getElementById('hwCmWrap');
  const ftWrap = document.getElementById('hwFtWrap');
  const heightCmEl = document.getElementById('hwHeightCm');
  const ftEl = document.getElementById('hwFt');
  const inEl = document.getElementById('hwIn');

  function getHeightMeters(){
    if(unitSel.value === 'ft'){
      const ft = parseFloat(ftEl.value)||0;
      const inches = parseFloat(inEl.value)||0;
      return ((ft*12)+inches)*0.0254;
    }
    return (parseFloat(heightCmEl.value)||0)/100;
  }

  function calc(){
    const h = getHeightMeters();
    const minKg = 18.5*h*h;
    const maxKg = 24.9*h*h;
    const isFt = unitSel.value === 'ft';
    const resultEl = document.getElementById('hwResult');
    if(h<=0){ resultEl.textContent='—'; return; }
    if(isFt){
      resultEl.textContent = (minKg*2.20462).toFixed(1)+' – '+(maxKg*2.20462).toFixed(1)+' lb';
    } else {
      resultEl.textContent = minKg.toFixed(1)+' – '+maxKg.toFixed(1)+' kg';
    }
  }

  unitSel.addEventListener('change', ()=>{
    const isFt = unitSel.value === 'ft';
    cmWrap.style.display = isFt ? 'none' : 'flex';
    ftWrap.style.display = isFt ? 'grid' : 'none';
    calc();
  });
  [heightCmEl, ftEl, inEl].forEach(el=>{
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 9. Calories Burned Calculator (MET-based) ----
(function(){
  if(!document.getElementById('cbActivity')) return;
  const activityEl = document.getElementById('cbActivity');
  const weightEl = document.getElementById('cbWeight');
  const weightUnitEl = document.getElementById('cbWeightUnit');
  const durationEl = document.getElementById('cbDuration');

  function calc(){
    const met = parseFloat(activityEl.value)||0;
    const weightRaw = parseFloat(weightEl.value)||0;
    const weightKg = weightUnitEl.value==='lb' ? weightRaw/2.20462 : weightRaw;
    const durationMin = parseFloat(durationEl.value)||0;
    const calories = met*weightKg*(durationMin/60);
    document.getElementById('cbResult').textContent = Math.round(calories).toLocaleString('en-US')+' kcal';
  }
  [activityEl, weightEl, weightUnitEl, durationEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 10. One Rep Max Calculator (Epley formula) ----
(function(){
  if(!document.getElementById('ormWeight')) return;
  const weightEl = document.getElementById('ormWeight');
  const repsEl = document.getElementById('ormReps');

  function calc(){
    const weight = parseFloat(weightEl.value)||0;
    let reps = parseInt(repsEl.value,10)||0;
    reps = Math.min(Math.max(reps,1),15);
    const oneRM = weight*(1+reps/30);
    document.getElementById('ormResult').textContent = oneRM.toFixed(1);
    const tableEl = document.getElementById('ormTable');
    if(tableEl){
      tableEl.innerHTML = [3,5,8,10].map(r=>{
        const w = oneRM/(1+r/30);
        return '<tr><td>'+r+'</td><td>'+w.toFixed(1)+'</td></tr>';
      }).join('');
    }
  }
  [weightEl, repsEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 11. Target Heart Rate Calculator (Karvonen formula) ----
(function(){
  if(!document.getElementById('thrAge')) return;
  const ageEl = document.getElementById('thrAge');
  const restingEl = document.getElementById('thrResting');

  function calc(){
    const age = parseFloat(ageEl.value)||0;
    const resting = parseFloat(restingEl.value)||0;
    const maxHR = 220-age;
    const hrr = maxHR-resting;
    document.getElementById('thrMaxHR').textContent = Math.round(maxHR)+' bpm';
    function zoneStr(lo,hi){
      return Math.round(resting+lo*hrr)+' – '+Math.round(resting+hi*hrr)+' bpm';
    }
    document.getElementById('thrZoneLight').textContent = zoneStr(0.5,0.6);
    document.getElementById('thrZoneFatBurn').textContent = zoneStr(0.6,0.7);
    document.getElementById('thrZoneCardio').textContent = zoneStr(0.7,0.8);
    document.getElementById('thrZonePeak').textContent = zoneStr(0.8,0.9);
  }
  [ageEl, restingEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 12. Pregnancy Week Calculator ----
(function(){
  if(!document.getElementById('pwMethodSeg')) return;
  const methodSeg = document.getElementById('pwMethodSeg');
  const dateLabel = document.getElementById('pwDateLabel');
  const dateEl = document.getElementById('pwDate');
  let method = 'lmp';

  const sizeTable = [
    [4,7,'poppy seed to blueberry'],
    [8,13,'raspberry to peach'],
    [14,20,'lemon to banana'],
    [21,27,'carrot to eggplant'],
    [28,34,'butternut squash to cantaloupe'],
    [35,42,'honeydew to small pumpkin']
  ];

  function sizeForWeek(week){
    const row = sizeTable.find(r=>week>=r[0] && week<=r[1]);
    return row ? row[2] : 'too early to estimate';
  }

  function calc(){
    const val = dateEl.value;
    const weekEl = document.getElementById('pwWeek');
    const trimEl = document.getElementById('pwTrimester');
    const daysEl = document.getElementById('pwDaysLeft');
    const sizeEl = document.getElementById('pwSize');
    if(!val){
      weekEl.textContent='—'; trimEl.textContent='—'; daysEl.textContent='—'; sizeEl.textContent='—';
      return;
    }
    const inputDate = new Date(val+'T00:00:00');
    let lmp;
    if(method==='lmp'){
      lmp = inputDate;
    } else {
      // known due date -> back-calculate LMP
      lmp = new Date(inputDate.getTime() - 280*24*60*60*1000);
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffDays = Math.floor((today-lmp)/(24*60*60*1000));
    const week = Math.max(Math.floor(diffDays/7),0);
    const dueDate = new Date(lmp.getTime()+280*24*60*60*1000);
    const daysUntilDue = Math.round((dueDate-today)/(24*60*60*1000));

    let trimester = '1st trimester';
    if(week>=14 && week<=27) trimester='2nd trimester';
    else if(week>=28) trimester='3rd trimester';

    weekEl.textContent = 'Week '+week;
    trimEl.textContent = trimester;
    daysEl.textContent = daysUntilDue>=0 ? daysUntilDue+' days' : 'Due date has passed';
    sizeEl.textContent = sizeForWeek(week);
  }

  methodSeg.addEventListener('click',(e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    method = btn.dataset.method;
    methodSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    dateLabel.textContent = method==='lmp' ? 'First day of last period' : 'Due date';
    calc();
  });
  dateEl.addEventListener('input', calc);
  dateEl.addEventListener('change', calc);
  calc();
})();

// ---- 13. Pregnancy Weight Gain Calculator ----
(function(){
  if(!document.getElementById('pwgHeight')) return;
  const heightEl = document.getElementById('pwgHeight');
  const weightEl = document.getElementById('pwgWeight');
  const weekEl = document.getElementById('pwgWeek');

  function bmiCategory(bmi){
    if(bmi<18.5) return {name:'Underweight', low:28, high:40};
    if(bmi<25) return {name:'Normal', low:25, high:35};
    if(bmi<30) return {name:'Overweight', low:15, high:25};
    return {name:'Obese', low:11, high:20};
  }

  function gainToDate(week, totalLow, totalHigh){
    const w = Math.min(Math.max(week,0),40);
    if(w<=13){
      return {low: 2*(w/13), high: 2*(w/13)};
    }
    const remLow = totalLow-2, remHigh = totalHigh-2;
    const weeksIn = w-13;
    const weeksTotal = 40-13;
    return {
      low: 2+remLow*(weeksIn/weeksTotal),
      high: 2+remHigh*(weeksIn/weeksTotal)
    };
  }

  function calc(){
    const heightCm = parseFloat(heightEl.value)||0;
    const weightKg = parseFloat(weightEl.value)||0;
    const week = parseFloat(weekEl.value)||0;
    const hM = heightCm/100;
    const bmi = hM>0 ? weightKg/(hM*hM) : 0;
    const catEl = document.getElementById('pwgCategory');
    const totalEl = document.getElementById('pwgTotalRange');
    const toDateEl = document.getElementById('pwgToDateRange');
    if(bmi<=0){
      catEl.textContent='—'; totalEl.textContent='—'; toDateEl.textContent='—';
      return;
    }
    const cat = bmiCategory(bmi);
    catEl.textContent = cat.name+' (BMI '+bmi.toFixed(1)+')';
    totalEl.textContent = cat.low+' – '+cat.high+' lbs';
    const gain = gainToDate(week, cat.low, cat.high);
    toDateEl.textContent = gain.low.toFixed(1)+' – '+gain.high.toFixed(1)+' lbs by week '+Math.round(week);
  }
  [heightEl, weightEl, weekEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- 14. Conception Calculator ----
(function(){
  if(!document.getElementById('ccMethodSeg')) return;
  const methodSeg = document.getElementById('ccMethodSeg');
  const dateLabel = document.getElementById('ccDateLabel');
  const dateEl = document.getElementById('ccDate');
  let method = 'dueDate';

  function calc(){
    const val = dateEl.value;
    const resultEl = document.getElementById('ccResult');
    if(!val){ resultEl.textContent='—'; return; }
    const inputDate = new Date(val+'T00:00:00');
    let conception;
    if(method==='dueDate'){
      conception = new Date(inputDate.getTime() - 266*24*60*60*1000);
    } else {
      conception = new Date(inputDate.getTime() + 14*24*60*60*1000);
    }
    const opts = {year:'numeric', month:'long', day:'numeric'};
    resultEl.textContent = conception.toLocaleDateString('en-US', opts);
  }

  methodSeg.addEventListener('click',(e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    method = btn.dataset.method;
    methodSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    dateLabel.textContent = method==='dueDate' ? 'Due date' : 'First day of last period';
    calc();
  });
  dateEl.addEventListener('input', calc);
  dateEl.addEventListener('change', calc);
  calc();
})();
})();


// =====================================================================
// WAVE 2 (salvaged) — Algebra cluster (9) + Statistics cluster (6)
// =====================================================================

// ---- Batch W2-M1: Algebra cluster ----
// ---- Percent Error Calculator ----
(function(){
  if(!document.getElementById('peExperimental')) return;
  var expEl = document.getElementById('peExperimental');
  var trueEl = document.getElementById('peTrue');
  var warnEl = document.getElementById('peWarning');
  function calc(){
    var exp = parseFloat(expEl.value)||0;
    var trueVal = parseFloat(trueEl.value)||0;
    var absError = exp - trueVal;
    if(trueVal === 0){
      warnEl.textContent = 'True value cannot be zero — percent error is undefined when dividing by zero.';
      warnEl.classList.add('show');
      document.getElementById('peResult').textContent = '—';
      document.getElementById('peAbsError').textContent = absError.toFixed(4);
      return;
    }
    warnEl.textContent = ''; warnEl.classList.remove('show');
    var pctError = Math.abs(absError/trueVal)*100;
    document.getElementById('peResult').textContent = pctError.toFixed(3)+'%';
    document.getElementById('peAbsError').textContent = (absError>=0?'+':'')+absError.toFixed(4);
  }
  [expEl, trueEl].forEach(function(el){ el.addEventListener('input', calc); el.addEventListener('change', calc); });
  calc();
})();

// ---- Exponent Calculator ----
(function(){
  if(!document.getElementById('exBase')) return;
  var baseEl = document.getElementById('exBase');
  var expEl = document.getElementById('exExponent');
  var warnEl = document.getElementById('exWarning');
  function calc(){
    var base = parseFloat(baseEl.value)||0;
    var exp = parseFloat(expEl.value)||0;
    var result = Math.pow(base, exp);
    if(!isFinite(result) || isNaN(result)){
      warnEl.textContent = 'This combination (negative base with a fractional exponent) does not produce a real number.';
      warnEl.classList.add('show');
      document.getElementById('exResult').textContent = '—';
      return;
    }
    warnEl.textContent = ''; warnEl.classList.remove('show');
    document.getElementById('exResult').textContent = (Math.abs(result) < 1e15 && Math.abs(result) > 1e-9 || result===0) ? +result.toPrecision(12) : result.toExponential(6);
  }
  [baseEl, expEl].forEach(function(el){ el.addEventListener('input', calc); el.addEventListener('change', calc); });
  calc();
})();

// ---- Binary Calculator ----
(function(){
  if(!document.getElementById('bnA')) return;
  var aEl = document.getElementById('bnA');
  var bEl = document.getElementById('bnB');
  var opEl = document.getElementById('bnOp');
  var warnEl = document.getElementById('bnWarning');

  function isValidBinary(s){ return /^[01]+$/.test(s); }
  function toBin(n){
    var sign = n<0 ? '-' : '';
    return sign + Math.abs(n).toString(2);
  }

  function calc(){
    var aStr = aEl.value.trim();
    var bStr = bEl.value.trim();
    if(!isValidBinary(aStr) || !isValidBinary(bStr)){
      warnEl.textContent = 'Enter valid binary numbers (digits 0 and 1 only).';
      warnEl.classList.add('show');
      document.getElementById('bnResultBin').textContent = '—';
      document.getElementById('bnResultDec').textContent = '—';
      return;
    }
    warnEl.textContent = ''; warnEl.classList.remove('show');
    var a = parseInt(aStr, 2);
    var b = parseInt(bStr, 2);
    var op = opEl.value;
    var result;
    if(op === 'add') result = a+b;
    else if(op === 'sub') result = a-b;
    else result = a*b;
    document.getElementById('bnResultBin').textContent = toBin(result);
    document.getElementById('bnResultDec').textContent = result;
  }
  [aEl, bEl, opEl].forEach(function(el){ el.addEventListener('input', calc); el.addEventListener('change', calc); });
  calc();

  // Binary <-> Decimal conversion section
  var seg = document.getElementById('bnConvModeSeg');
  var convInput = document.getElementById('bnConvInput');
  var convInputLabel = document.getElementById('bnConvInputLabel');
  var convOutLabel = document.getElementById('bnConvOutLabel');
  var convResult = document.getElementById('bnConvResult');
  var convWarn = document.getElementById('bnConvWarning');
  var convMode = 'bin2dec';

  function convCalc(){
    var val = convInput.value.trim();
    if(convMode === 'bin2dec'){
      if(!isValidBinary(val)){
        convWarn.textContent = 'Enter a valid binary number (0s and 1s only).';
        convWarn.classList.add('show');
        convResult.textContent = '—';
        return;
      }
      convWarn.textContent=''; convWarn.classList.remove('show');
      convResult.textContent = parseInt(val, 2);
    } else {
      var n = parseInt(val, 10);
      if(isNaN(n)){
        convWarn.textContent = 'Enter a valid decimal integer.';
        convWarn.classList.add('show');
        convResult.textContent = '—';
        return;
      }
      convWarn.textContent=''; convWarn.classList.remove('show');
      convResult.textContent = toBin(n);
    }
  }
  if(seg){
    seg.addEventListener('click', function(e){
      var btn = e.target.closest('button');
      if(!btn) return;
      seg.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      convMode = btn.dataset.mode;
      if(convMode === 'bin2dec'){
        convInputLabel.textContent = 'Binary value';
        convOutLabel.textContent = 'Decimal value';
        convInput.value = '1010';
      } else {
        convInputLabel.textContent = 'Decimal value';
        convOutLabel.textContent = 'Binary value';
        convInput.value = '10';
      }
      convCalc();
    });
  }
  convInput.addEventListener('input', convCalc);
  convInput.addEventListener('change', convCalc);
  convCalc();
})();

// ---- Hex Calculator ----
(function(){
  if(!document.getElementById('hxA')) return;
  var aEl = document.getElementById('hxA');
  var bEl = document.getElementById('hxB');
  var opEl = document.getElementById('hxOp');
  var warnEl = document.getElementById('hxWarning');

  function isValidHex(s){ return /^[0-9a-fA-F]+$/.test(s); }

  function calc(){
    var aStr = aEl.value.trim();
    var bStr = bEl.value.trim();
    if(!isValidHex(aStr) || !isValidHex(bStr)){
      warnEl.textContent = 'Enter valid hexadecimal values (0-9, A-F only).';
      warnEl.classList.add('show');
      document.getElementById('hxResultHex').textContent = '—';
      document.getElementById('hxResultDec').textContent = '—';
      return;
    }
    warnEl.textContent = ''; warnEl.classList.remove('show');
    var a = parseInt(aStr, 16);
    var b = parseInt(bStr, 16);
    var op = opEl.value;
    var result;
    if(op === 'add') result = a+b;
    else if(op === 'sub') result = a-b;
    else result = a*b;
    var sign = result<0 ? '-' : '';
    document.getElementById('hxResultHex').textContent = sign+Math.abs(result).toString(16).toUpperCase();
    document.getElementById('hxResultDec').textContent = result;
  }
  [aEl, bEl, opEl].forEach(function(el){ el.addEventListener('input', calc); el.addEventListener('change', calc); });
  calc();

  var seg = document.getElementById('hxConvModeSeg');
  var convInput = document.getElementById('hxConvInput');
  var convInputLabel = document.getElementById('hxConvInputLabel');
  var convOutLabel = document.getElementById('hxConvOutLabel');
  var convResult = document.getElementById('hxConvResult');
  var convWarn = document.getElementById('hxConvWarning');
  var convMode = 'hex2dec';

  function convCalc(){
    var val = convInput.value.trim();
    if(convMode === 'hex2dec'){
      if(!isValidHex(val)){
        convWarn.textContent = 'Enter a valid hex value (0-9, A-F only).';
        convWarn.classList.add('show');
        convResult.textContent = '—';
        return;
      }
      convWarn.textContent=''; convWarn.classList.remove('show');
      convResult.textContent = parseInt(val, 16);
    } else {
      var n = parseInt(val, 10);
      if(isNaN(n)){
        convWarn.textContent = 'Enter a valid decimal integer.';
        convWarn.classList.add('show');
        convResult.textContent = '—';
        return;
      }
      convWarn.textContent=''; convWarn.classList.remove('show');
      convResult.textContent = n.toString(16).toUpperCase();
    }
  }
  if(seg){
    seg.addEventListener('click', function(e){
      var btn = e.target.closest('button');
      if(!btn) return;
      seg.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      convMode = btn.dataset.mode;
      if(convMode === 'hex2dec'){
        convInputLabel.textContent = 'Hex value';
        convOutLabel.textContent = 'Decimal value';
        convInput.value = 'FF';
      } else {
        convInputLabel.textContent = 'Decimal value';
        convOutLabel.textContent = 'Hex value';
        convInput.value = '255';
      }
      convCalc();
    });
  }
  convInput.addEventListener('input', convCalc);
  convInput.addEventListener('change', convCalc);
  convCalc();
})();

// ---- Half-Life Calculator ----
(function(){
  if(!document.getElementById('hlModeSeg')) return;
  var seg = document.getElementById('hlModeSeg');
  var initialEl = document.getElementById('hlInitial');
  var halfLifeEl = document.getElementById('hlHalfLife');
  var remainingEl = document.getElementById('hlRemaining');
  var elapsedEl = document.getElementById('hlElapsed');
  var halfLifeField = document.getElementById('hlHalfLifeField');
  var remainingField = document.getElementById('hlRemainingField');
  var elapsedField = document.getElementById('hlElapsedField');
  var resultLabel = document.getElementById('hlResultLabel');
  var resultEl = document.getElementById('hlResult');
  var warnEl = document.getElementById('hlWarning');
  var mode = 'remaining';

  function calc(){
    var initial = parseFloat(initialEl.value)||0;
    warnEl.textContent=''; warnEl.classList.remove('show');
    if(mode === 'remaining'){
      var halfLife = parseFloat(halfLifeEl.value)||0;
      var elapsed = parseFloat(elapsedEl.value)||0;
      if(halfLife<=0){
        warnEl.textContent='Half-life must be greater than zero.'; warnEl.classList.add('show');
        resultEl.textContent='—'; return;
      }
      var remaining = initial*Math.pow(0.5, elapsed/halfLife);
      resultEl.textContent = remaining.toFixed(4);
    } else if(mode === 'halflife'){
      var remaining2 = parseFloat(remainingEl.value)||0;
      var elapsed2 = parseFloat(elapsedEl.value)||0;
      if(remaining2<=0 || initial<=0 || remaining2>=initial){
        warnEl.textContent='Remaining amount must be greater than zero and less than the initial amount.'; warnEl.classList.add('show');
        resultEl.textContent='—'; return;
      }
      var hl = elapsed2*Math.log(0.5)/Math.log(remaining2/initial);
      resultEl.textContent = hl.toFixed(4);
    } else {
      var remaining3 = parseFloat(remainingEl.value)||0;
      var halfLife3 = parseFloat(halfLifeEl.value)||0;
      if(remaining3<=0 || initial<=0 || remaining3>=initial || halfLife3<=0){
        warnEl.textContent='Remaining amount must be greater than zero and less than the initial amount, and half-life must be positive.'; warnEl.classList.add('show');
        resultEl.textContent='—'; return;
      }
      var t = halfLife3*Math.log(remaining3/initial)/Math.log(0.5);
      resultEl.textContent = t.toFixed(4);
    }
  }

  seg.addEventListener('click', function(e){
    var btn = e.target.closest('button');
    if(!btn) return;
    seg.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    mode = btn.dataset.mode;
    if(mode === 'remaining'){
      halfLifeField.style.display=''; remainingField.style.display='none'; elapsedField.style.display='';
      resultLabel.textContent = 'Remaining Amount';
    } else if(mode === 'halflife'){
      halfLifeField.style.display='none'; remainingField.style.display=''; elapsedField.style.display='';
      resultLabel.textContent = 'Half-Life';
    } else {
      halfLifeField.style.display=''; remainingField.style.display=''; elapsedField.style.display='none';
      resultLabel.textContent = 'Elapsed Time';
    }
    calc();
  });

  [initialEl, halfLifeEl, remainingEl, elapsedEl].forEach(function(el){
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Quadratic Formula Calculator ----
(function(){
  if(!document.getElementById('qfA')) return;
  var aEl = document.getElementById('qfA');
  var bEl = document.getElementById('qfB');
  var cEl = document.getElementById('qfC');
  var warnEl = document.getElementById('qfWarning');
  function calc(){
    var a = parseFloat(aEl.value)||0;
    var b = parseFloat(bEl.value)||0;
    var c = parseFloat(cEl.value)||0;
    if(a===0){
      warnEl.textContent = 'Coefficient "a" cannot be zero — this would not be a quadratic equation.';
      warnEl.classList.add('show');
      document.getElementById('qfDiscriminant').textContent='—';
      document.getElementById('qfRoot1').textContent='—';
      document.getElementById('qfRoot2').textContent='—';
      return;
    }
    warnEl.textContent=''; warnEl.classList.remove('show');
    var disc = b*b - 4*a*c;
    document.getElementById('qfDiscriminant').textContent = disc.toFixed(4);
    if(disc > 0){
      var r1 = (-b + Math.sqrt(disc))/(2*a);
      var r2 = (-b - Math.sqrt(disc))/(2*a);
      document.getElementById('qfRoot1').textContent = r1.toFixed(4);
      document.getElementById('qfRoot2').textContent = r2.toFixed(4);
    } else if(disc === 0){
      var r = -b/(2*a);
      document.getElementById('qfRoot1').textContent = r.toFixed(4)+' (repeated)';
      document.getElementById('qfRoot2').textContent = r.toFixed(4)+' (repeated)';
    } else {
      var realPart = (-b/(2*a));
      var imagPart = Math.sqrt(-disc)/(2*a);
      document.getElementById('qfRoot1').textContent = realPart.toFixed(4)+' + '+Math.abs(imagPart).toFixed(4)+'i';
      document.getElementById('qfRoot2').textContent = realPart.toFixed(4)+' - '+Math.abs(imagPart).toFixed(4)+'i';
    }
  }
  [aEl, bEl, cEl].forEach(function(el){ el.addEventListener('input', calc); el.addEventListener('change', calc); });
  calc();
})();

// ---- Log Calculator ----
(function(){
  if(!document.getElementById('lgValue')) return;
  var valueEl = document.getElementById('lgValue');
  var baseSelect = document.getElementById('lgBaseSelect');
  var customBaseEl = document.getElementById('lgCustomBase');
  var customBaseField = document.getElementById('lgCustomBaseField');
  var warnEl = document.getElementById('lgWarning');

  function calc(){
    var x = parseFloat(valueEl.value)||0;
    var baseSel = baseSelect.value;
    var base;
    if(baseSel === 'e') base = Math.E;
    else if(baseSel === 'custom') base = parseFloat(customBaseEl.value)||0;
    else base = parseFloat(baseSel);

    if(x<=0 || base<=0 || base===1){
      warnEl.textContent = 'Value must be greater than zero, and base must be greater than zero and not equal to 1.';
      warnEl.classList.add('show');
      document.getElementById('lgResult').textContent = '—';
      return;
    }
    warnEl.textContent=''; warnEl.classList.remove('show');
    var result = Math.log(x)/Math.log(base);
    document.getElementById('lgResult').textContent = result.toFixed(6);
  }

  baseSelect.addEventListener('change', function(){
    customBaseField.style.display = baseSelect.value === 'custom' ? '' : 'none';
    calc();
  });
  [valueEl, customBaseEl].forEach(function(el){ el.addEventListener('input', calc); el.addEventListener('change', calc); });
  calc();
})();

// ---- Ratio Calculator ----
(function(){
  if(!document.getElementById('rtModeSeg')) return;
  var seg = document.getElementById('rtModeSeg');
  var simplifyFields = document.getElementById('rtSimplifyFields');
  var solveFields = document.getElementById('rtSolveFields');
  var simplifyRow = document.getElementById('rtSimplifyRow');
  var solveRow = document.getElementById('rtSolveRow');
  var aEl = document.getElementById('rtA');
  var bEl = document.getElementById('rtB');
  var a2El = document.getElementById('rtA2');
  var b2El = document.getElementById('rtB2');
  var c2El = document.getElementById('rtC2');
  var warnEl = document.getElementById('rtWarning');
  var mode = 'simplify';

  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=b; b=a%b; a=t; } return a; }

  function calc(){
    warnEl.textContent=''; warnEl.classList.remove('show');
    if(mode === 'simplify'){
      var a = parseFloat(aEl.value)||0;
      var b = parseFloat(bEl.value)||0;
      if(a===0 && b===0){
        warnEl.textContent='Enter at least one non-zero value.'; warnEl.classList.add('show');
        document.getElementById('rtSimplified').textContent='—';
        return;
      }
      var g = gcd(a,b) || 1;
      document.getElementById('rtSimplified').textContent = (a/g)+':'+(b/g);
    } else {
      var a2 = parseFloat(a2El.value)||0;
      var b2 = parseFloat(b2El.value)||0;
      var c2 = parseFloat(c2El.value)||0;
      if(a2===0){
        warnEl.textContent='"A" cannot be zero when solving for X.'; warnEl.classList.add('show');
        document.getElementById('rtX').textContent='—';
        return;
      }
      var x = (b2*c2)/a2;
      document.getElementById('rtX').textContent = +x.toFixed(6);
    }
  }

  seg.addEventListener('click', function(e){
    var btn = e.target.closest('button');
    if(!btn) return;
    seg.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    mode = btn.dataset.mode;
    if(mode === 'simplify'){
      simplifyFields.style.display=''; solveFields.style.display='none';
      simplifyRow.style.display=''; solveRow.style.display='none';
    } else {
      simplifyFields.style.display='none'; solveFields.style.display='';
      simplifyRow.style.display='none'; solveRow.style.display='';
    }
    calc();
  });

  [aEl, bEl, a2El, b2El, c2El].forEach(function(el){
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- Root Calculator ----
(function(){
  if(!document.getElementById('rnValue')) return;
  var valueEl = document.getElementById('rnValue');
  var indexEl = document.getElementById('rnIndex');
  var warnEl = document.getElementById('rnWarning');
  function calc(){
    var x = parseFloat(valueEl.value)||0;
    var n = Math.round(parseFloat(indexEl.value)||1);
    if(n<=0){
      warnEl.textContent='Root index must be a positive integer.'; warnEl.classList.add('show');
      document.getElementById('rnResult').textContent='—';
      return;
    }
    if(x<0){
      if(n%2===0){
        warnEl.textContent='An even root of a negative number is not a real number.'; warnEl.classList.add('show');
        document.getElementById('rnResult').textContent='—';
        return;
      }
      warnEl.textContent=''; warnEl.classList.remove('show');
      var result = -(Math.pow(-x, 1/n));
      document.getElementById('rnResult').textContent = result.toFixed(6);
      return;
    }
    warnEl.textContent=''; warnEl.classList.remove('show');
    var res = Math.pow(x, 1/n);
    document.getElementById('rnResult').textContent = res.toFixed(6);
  }
  [valueEl, indexEl].forEach(function(el){ el.addEventListener('input', calc); el.addEventListener('change', calc); });
  calc();
})();

// ---- Batch W2-M3: Statistics cluster ----
// ---- Standard Deviation Calculator ----
(function(){
  if(!document.getElementById('sdInput')) return;

  var sdInput = document.getElementById('sdInput');
  var sdModeSeg = document.getElementById('sdModeSeg');
  var sdMean = document.getElementById('sdMean');
  var sdVariance = document.getElementById('sdVariance');
  var sdStdDev = document.getElementById('sdStdDev');
  var sdCount = document.getElementById('sdCount');
  var sdWarning = document.getElementById('sdWarning');

  var mode = 'population';

  function parseNums(text){
    return text.split(/[,\n]+/).map(function(s){ return parseFloat(s); }).filter(function(v){ return !isNaN(v); });
  }

  function calc(){
    var nums = parseNums(sdInput.value);
    var n = nums.length;
    sdCount.textContent = n;

    if(n === 0){
      if(sdWarning){ sdWarning.textContent = 'Enter at least one number.'; sdWarning.classList.add('show'); }
      sdMean.textContent = '—';
      sdVariance.textContent = '—';
      sdStdDev.textContent = '—';
      return;
    }
    if(mode === 'sample' && n < 2){
      if(sdWarning){ sdWarning.textContent = 'Sample standard deviation needs at least 2 values.'; sdWarning.classList.add('show'); }
      sdMean.textContent = '—';
      sdVariance.textContent = '—';
      sdStdDev.textContent = '—';
      return;
    }
    if(sdWarning){ sdWarning.classList.remove('show'); }

    var sum = 0;
    for(var i=0;i<n;i++){ sum += nums[i]; }
    var mean = sum / n;

    var sumSq = 0;
    for(var j=0;j<n;j++){ sumSq += Math.pow(nums[j]-mean, 2); }

    var variance = mode === 'sample' ? sumSq/(n-1) : sumSq/n;
    var stdDev = Math.sqrt(variance);

    sdMean.textContent = mean.toFixed(2);
    sdVariance.textContent = variance.toFixed(2);
    sdStdDev.textContent = stdDev.toFixed(2);
  }

  sdInput.addEventListener('input', calc);
  sdInput.addEventListener('change', calc);

  if(sdModeSeg){
    var sdSegButtons = sdModeSeg.querySelectorAll('button');
    sdSegButtons.forEach(function(btn){
      btn.addEventListener('click', function(){
        sdSegButtons.forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        mode = btn.getAttribute('data-mode');
        calc();
      });
    });
  }

  calc();
})();


// ---- Sample Size Calculator ----
(function(){
  if(!document.getElementById('ssConfidence')) return;

  var ssConfidence = document.getElementById('ssConfidence');
  var ssMargin = document.getElementById('ssMargin');
  var ssProportion = document.getElementById('ssProportion');
  var ssPopulation = document.getElementById('ssPopulation');
  var ssResult = document.getElementById('ssResult');
  var ssWarning = document.getElementById('ssWarning');

  function calc(){
    var z = parseFloat(ssConfidence.value) || 1.96;
    var eRaw = parseFloat(ssMargin.value);
    var pRaw = parseFloat(ssProportion.value);
    var popRaw = parseFloat(ssPopulation.value);

    if(isNaN(eRaw) || eRaw <= 0 || isNaN(pRaw) || pRaw < 0 || pRaw > 100){
      if(ssWarning){ ssWarning.textContent = 'Enter a margin of error greater than 0 and a proportion between 0 and 100.'; ssWarning.classList.add('show'); }
      ssResult.textContent = '—';
      return;
    }
    if(ssWarning){ ssWarning.classList.remove('show'); }

    var E = eRaw/100;
    var p = pRaw/100;

    var n = (z*z*p*(1-p)) / (E*E);

    if(!isNaN(popRaw) && popRaw > 0){
      n = n / (1 + (n-1)/popRaw);
    }

    ssResult.textContent = Math.ceil(n).toLocaleString('en-US');
  }

  [ssConfidence, ssMargin, ssProportion, ssPopulation].forEach(function(el){
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  calc();
})();


// ---- Mean, Median & Mode Calculator ----
(function(){
  if(!document.getElementById('mmInput')) return;

  var mmInput = document.getElementById('mmInput');
  var mmMean = document.getElementById('mmMean');
  var mmMedian = document.getElementById('mmMedian');
  var mmMode = document.getElementById('mmMode');
  var mmRange = document.getElementById('mmRange');
  var mmCount = document.getElementById('mmCount');
  var mmWarning = document.getElementById('mmWarning');

  function parseNums(text){
    return text.split(/[,\n]+/).map(function(s){ return parseFloat(s); }).filter(function(v){ return !isNaN(v); });
  }

  function calc(){
    var nums = parseNums(mmInput.value);
    var n = nums.length;
    mmCount.textContent = n;

    if(n === 0){
      if(mmWarning){ mmWarning.textContent = 'Enter at least one number.'; mmWarning.classList.add('show'); }
      mmMean.textContent = '—';
      mmMedian.textContent = '—';
      mmMode.textContent = '—';
      mmRange.textContent = '—';
      return;
    }
    if(mmWarning){ mmWarning.classList.remove('show'); }

    var sum = 0;
    for(var i=0;i<n;i++){ sum += nums[i]; }
    var mean = sum/n;

    var sorted = nums.slice().sort(function(a,b){ return a-b; });
    var median;
    var mid = Math.floor(n/2);
    if(n % 2 === 0){
      median = (sorted[mid-1] + sorted[mid]) / 2;
    } else {
      median = sorted[mid];
    }

    var freq = {};
    for(var j=0;j<n;j++){
      var key = String(nums[j]);
      freq[key] = (freq[key]||0) + 1;
    }
    var maxFreq = 0;
    for(var k in freq){ if(freq[k] > maxFreq) maxFreq = freq[k]; }

    var modeVals = [];
    for(var k2 in freq){ if(freq[k2] === maxFreq) modeVals.push(parseFloat(k2)); }
    modeVals.sort(function(a,b){ return a-b; });

    var modeText;
    if(maxFreq === 1){
      modeText = 'No mode';
    } else {
      modeText = modeVals.join(', ');
    }

    var range = sorted[n-1] - sorted[0];

    mmMean.textContent = mean.toFixed(2);
    mmMedian.textContent = median.toFixed(2);
    mmMode.textContent = modeText;
    mmRange.textContent = range.toFixed(2);
  }

  mmInput.addEventListener('input', calc);
  mmInput.addEventListener('change', calc);

  calc();
})();


// ---- Permutation & Combination Calculator ----
(function(){
  if(!document.getElementById('pcN')) return;

  var pcN = document.getElementById('pcN');
  var pcR = document.getElementById('pcR');
  var pcModeSeg = document.getElementById('pcModeSeg');
  var pcResult = document.getElementById('pcResult');
  var pcWarning = document.getElementById('pcWarning');

  var mode = 'permutation';

  function calc(){
    var n = parseFloat(pcN.value);
    var r = parseFloat(pcR.value);

    var valid = !isNaN(n) && !isNaN(r) && n >= 0 && r >= 0 && Number.isInteger(n) && Number.isInteger(r) && r <= n;

    if(!valid){
      if(pcWarning){ pcWarning.textContent = 'Enter whole numbers with 0 ≤ r ≤ n.'; pcWarning.classList.add('show'); }
      pcResult.textContent = '—';
      return;
    }
    if(pcWarning){ pcWarning.classList.remove('show'); }

    var nPr = 1;
    for(var i=0;i<r;i++){ nPr *= (n-i); }

    var result;
    if(mode === 'permutation'){
      result = nPr;
    } else {
      var nCr = 1;
      for(var j=0;j<r;j++){ nCr = nCr * (n-j) / (j+1); }
      result = Math.round(nCr);
    }

    pcResult.textContent = result.toLocaleString('en-US');
  }

  [pcN, pcR].forEach(function(el){
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  if(pcModeSeg){
    var pcSegButtons = pcModeSeg.querySelectorAll('button');
    pcSegButtons.forEach(function(btn){
      btn.addEventListener('click', function(){
        pcSegButtons.forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        mode = btn.getAttribute('data-mode');
        calc();
      });
    });
  }

  calc();
})();


// ---- Z-Score Calculator ----
(function(){
  if(!document.getElementById('zsMean')) return;

  var zsModeSeg = document.getElementById('zsModeSeg');
  var zsXField = document.getElementById('zsXField');
  var zsX = document.getElementById('zsX');
  var zsZField = document.getElementById('zsZField');
  var zsZ = document.getElementById('zsZ');
  var zsMean = document.getElementById('zsMean');
  var zsStdDev = document.getElementById('zsStdDev');
  var zsResultLabel = document.getElementById('zsResultLabel');
  var zsResult = document.getElementById('zsResult');
  var zsNote = document.getElementById('zsNote');
  var zsWarning = document.getElementById('zsWarning');

  var mode = 'findz';

  function calc(){
    var mean = parseFloat(zsMean.value);
    var stdDev = parseFloat(zsStdDev.value);

    if(isNaN(mean) || isNaN(stdDev) || stdDev <= 0){
      if(zsWarning){ zsWarning.textContent = 'Enter a mean and a standard deviation greater than 0.'; zsWarning.classList.add('show'); }
      zsResult.textContent = '—';
      zsNote.textContent = '';
      return;
    }

    if(mode === 'findz'){
      var x = parseFloat(zsX.value);
      if(isNaN(x)){
        if(zsWarning){ zsWarning.textContent = 'Enter a value to standardize.'; zsWarning.classList.add('show'); }
        zsResult.textContent = '—';
        zsNote.textContent = '';
        return;
      }
      if(zsWarning){ zsWarning.classList.remove('show'); }
      var z = (x - mean) / stdDev;
      zsResultLabel.textContent = 'Z-Score';
      zsResult.textContent = z.toFixed(2);
      var absZ = Math.abs(z);
      var note = z === 0 ? 'Exactly average' : (z > 0 ? 'Above the mean' : 'Below the mean');
      if(absZ > 3){ note += ' — extremely unusual (more than 3 standard deviations away).'; }
      else if(absZ > 2){ note += ' — notably unusual (more than 2 standard deviations away).'; }
      else { note += ', within 2 standard deviations of average.'; }
      zsNote.textContent = note;
    } else {
      var zVal = parseFloat(zsZ.value);
      if(isNaN(zVal)){
        if(zsWarning){ zsWarning.textContent = 'Enter a z-score.'; zsWarning.classList.add('show'); }
        zsResult.textContent = '—';
        zsNote.textContent = '';
        return;
      }
      if(zsWarning){ zsWarning.classList.remove('show'); }
      var value = mean + zVal*stdDev;
      zsResultLabel.textContent = 'Value (x)';
      zsResult.textContent = value.toFixed(2);
      zsNote.textContent = 'This is the raw value that sits ' + zVal.toFixed(2) + ' standard deviations from the mean.';
    }
  }

  [zsX, zsZ, zsMean, zsStdDev].forEach(function(el){
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  if(zsModeSeg){
    var zsSegButtons = zsModeSeg.querySelectorAll('button');
    zsSegButtons.forEach(function(btn){
      btn.addEventListener('click', function(){
        zsSegButtons.forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        mode = btn.getAttribute('data-mode');
        if(mode === 'findz'){
          zsXField.style.display = '';
          zsZField.style.display = 'none';
        } else {
          zsXField.style.display = 'none';
          zsZField.style.display = '';
        }
        calc();
      });
    });
  }

  calc();
})();


// ---- Confidence Interval Calculator ----
(function(){
  if(!document.getElementById('ciN')) return;

  var ciModeSeg = document.getElementById('ciModeSeg');
  var ciMeanFields = document.getElementById('ciMeanFields');
  var ciMean = document.getElementById('ciMean');
  var ciStdDev = document.getElementById('ciStdDev');
  var ciPropFields = document.getElementById('ciPropFields');
  var ciProportion = document.getElementById('ciProportion');
  var ciN = document.getElementById('ciN');
  var ciConfidence = document.getElementById('ciConfidence');
  var ciInterval = document.getElementById('ciInterval');
  var ciMargin = document.getElementById('ciMargin');
  var ciWarning = document.getElementById('ciWarning');

  var mode = 'mean';

  function calc(){
    var z = parseFloat(ciConfidence.value) || 1.96;
    var n = parseFloat(ciN.value);

    if(isNaN(n) || n <= 0 || !Number.isInteger(n)){
      if(ciWarning){ ciWarning.textContent = 'Enter a whole number sample size greater than 0.'; ciWarning.classList.add('show'); }
      ciInterval.textContent = '—';
      ciMargin.textContent = '—';
      return;
    }

    if(mode === 'mean'){
      var mean = parseFloat(ciMean.value);
      var stdDev = parseFloat(ciStdDev.value);
      if(isNaN(mean) || isNaN(stdDev) || stdDev < 0){
        if(ciWarning){ ciWarning.textContent = 'Enter a sample mean and a standard deviation of 0 or more.'; ciWarning.classList.add('show'); }
        ciInterval.textContent = '—';
        ciMargin.textContent = '—';
        return;
      }
      if(ciWarning){ ciWarning.classList.remove('show'); }
      var margin = z * (stdDev / Math.sqrt(n));
      ciInterval.textContent = (mean - margin).toFixed(2) + ' – ' + (mean + margin).toFixed(2);
      ciMargin.textContent = '±' + margin.toFixed(2);
    } else {
      var pRaw = parseFloat(ciProportion.value);
      if(isNaN(pRaw) || pRaw < 0 || pRaw > 100){
        if(ciWarning){ ciWarning.textContent = 'Enter a sample proportion between 0 and 100.'; ciWarning.classList.add('show'); }
        ciInterval.textContent = '—';
        ciMargin.textContent = '—';
        return;
      }
      if(ciWarning){ ciWarning.classList.remove('show'); }
      var p = pRaw/100;
      var marginP = z * Math.sqrt(p*(1-p)/n);
      var lowerP = Math.max(0,(p - marginP)*100);
      var upperP = Math.min(100,(p + marginP)*100);
      ciInterval.textContent = lowerP.toFixed(2) + '% – ' + upperP.toFixed(2) + '%';
      ciMargin.textContent = '±' + (marginP*100).toFixed(2) + '%';
    }
  }

  [ciMean, ciStdDev, ciProportion, ciN, ciConfidence].forEach(function(el){
    if(!el) return;
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });

  if(ciModeSeg){
    var ciSegButtons = ciModeSeg.querySelectorAll('button');
    ciSegButtons.forEach(function(btn){
      btn.addEventListener('click', function(){
        ciSegButtons.forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        mode = btn.getAttribute('data-mode');
        if(mode === 'mean'){
          ciMeanFields.style.display = '';
          ciPropFields.style.display = 'none';
        } else {
          ciMeanFields.style.display = 'none';
          ciPropFields.style.display = '';
        }
        calc();
      });
    });
  }

  calc();
})();

// ---- Site search ----
// Wires EVERY .tb-search container rather than one element by id. Search used
// to live only in index.html's hero; it is now also in the header on all 256
// pages, and two elements sharing #tbSearchInput would be a real bug.
function tbWireSearch(box){
  var input = box.querySelector('.tb-search-input');
  var resultsEl = box.querySelector('.tb-search-results');
  if(!input || !resultsEl) return;
  var activeIndex = -1;
  // Read the index lazily: search-data.js is loaded with defer, so it has not
  // executed yet when this file runs. Capturing it here would freeze an empty
  // array and every search would return nothing.
  function getData(){ return window.TB_SEARCH_DATA || []; }

  function updateActive(items){
    items.forEach(function(el, i){ el.classList.toggle('active', i === activeIndex); });
    if(activeIndex >= 0 && items[activeIndex]) items[activeIndex].scrollIntoView({block:'nearest'});
  }

  function render(matches){
    activeIndex = -1;
    if(matches.length === 0){
      resultsEl.innerHTML = '<div class="tb-search-empty">Nothing matches that search.</div>';
      resultsEl.hidden = false;
      input.setAttribute('aria-expanded','true');
      return;
    }
    resultsEl.innerHTML = matches.map(function(m){
      return '<a class="tb-search-result" href="'+m.f+'">'
        + '<span class="tb-search-result-title">'+m.t+'</span>'
        + '<span class="tb-search-result-blurb">'+m.b+'</span>'
        + '</a>';
    }).join('');
    resultsEl.hidden = false;
    input.setAttribute('aria-expanded','true');
  }

  function close(){
    resultsEl.hidden = true;
    resultsEl.innerHTML = '';
    activeIndex = -1;
    input.setAttribute('aria-expanded','false');
  }

  function search(query){
    query = query.trim().toLowerCase();
    if(query === ''){ close(); return; }
    var matches = getData().filter(function(item){
      return item.t.toLowerCase().indexOf(query) !== -1
          || item.b.toLowerCase().indexOf(query) !== -1
          || item.c.toLowerCase().indexOf(query) !== -1;
    }).slice(0, 8);
    render(matches);
  }

  input.addEventListener('input', function(){ search(input.value); });
  input.addEventListener('focus', function(){ if(input.value.trim() !== '') search(input.value); });

  input.addEventListener('keydown', function(e){
    var items = resultsEl.querySelectorAll('.tb-search-result');
    if(e.key === 'ArrowDown'){
      if(items.length === 0) return;
      e.preventDefault();
      activeIndex = Math.min(activeIndex+1, items.length-1);
      updateActive(items);
    } else if(e.key === 'ArrowUp'){
      if(items.length === 0) return;
      e.preventDefault();
      activeIndex = Math.max(activeIndex-1, 0);
      updateActive(items);
    } else if(e.key === 'Enter'){
      if(activeIndex >= 0 && items[activeIndex]){
        e.preventDefault();
        window.location.href = items[activeIndex].getAttribute('href');
      }
    } else if(e.key === 'Escape'){
      close();
      input.blur();
    }
  });

  // Clicking outside ANY search box closes this one. Scoped to the box that
  // owns the click so the header search and the homepage hero search do not
  // close each other while you are typing in one of them.
  document.addEventListener('click', function(e){
    if(e.target.closest('.tb-search') !== box) close();
  });
}

document.querySelectorAll('.tb-search').forEach(tbWireSearch);


// ---- Homepage hero readout cycle ----
(function(){
  var valueEl = document.getElementById('tbRigValue');
  if(!valueEl) return;
  var labelEl = document.getElementById('tbRigLabel');
  var subEl = document.getElementById('tbRigSub');
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var examples = [
    { label:'MORTGAGE / MONTHLY', value:'$2,146', sub:'30 yr · 6.4% · $420,000' },
    { label:'BMI', value:'23.4', sub:'175cm · 72kg' },
    { label:'GPA', value:'3.72', sub:'5 courses · 4.0 scale' },
    { label:'TIP SPLIT', value:'$18.40', sub:'$92 bill · 20% · 5 people' }
  ];
  var i = 0;
  setInterval(function(){
    i = (i + 1) % examples.length;
    var ex = examples[i];
    labelEl.textContent = ex.label;
    valueEl.textContent = ex.value;
    subEl.textContent = ex.sub;
  }, 3200);
})();


// ---- Homepage zone "view all" — expands that section's own tool-grid in
// place to show every tool in the category, rather than sending the visitor
// up to the header nav ----
(function(){
  var buttons = document.querySelectorAll('.zone-viewall');
  if(!buttons.length) return;
  buttons.forEach(function(btn){
    var expandedLabel = 'Show fewer ↑';
    var collapsedLabel = btn.textContent;
    btn.addEventListener('click', function(){
      var zone = btn.closest('.zone');
      if(!zone) return;
      var open = zone.classList.toggle('zone-open');
      btn.textContent = open ? expandedLabel : collapsedLabel;
      if(!open) zone.scrollIntoView({ block:'start', behavior:'smooth' });
    });
  });
})();

// ---- Gratuity calculator (India) ----
(function(){
  if(!document.getElementById('gratBasic')) return;
  let empType = 'private-covered';
  const seg = document.getElementById('gratEmpSeg');
  function setWarning(msg){
    const el = document.getElementById('gratWarning');
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add('show'); }
    else { el.textContent = ''; el.classList.remove('show'); }
  }
  function calc(){
    const basic = parseFloat(document.getElementById('gratBasic').value)||0;
    const years = parseFloat(document.getElementById('gratYears').value)||0;
    const months = parseFloat(document.getElementById('gratMonths').value)||0;
    const completedYears = Math.floor(years) + (months>=6 ? 1 : 0);

    if(basic < 0 || years < 0){
      setWarning('Basic + DA and years of service can\'t be negative.');
    } else if((years + months/12) < 5 && empType !== 'govt'){
      setWarning('Under 5 years of service — gratuity is normally only payable at 5+ years, except for death or disablement.');
    } else {
      setWarning(null);
    }

    const factor = empType === 'private-notcovered' ? 15/30 : 15/26;
    const amount = Math.max(basic,0) * factor * completedYears;
    const ceiling = 2000000;
    let exempt, taxable;
    if(empType === 'govt'){
      exempt = amount;
      taxable = 0;
    } else {
      exempt = Math.min(amount, ceiling);
      taxable = Math.max(amount - ceiling, 0);
    }

    document.getElementById('gratAmount').textContent = '₹'+Math.round(amount).toLocaleString('en-IN');
    document.getElementById('gratExempt').textContent = '₹'+Math.round(exempt).toLocaleString('en-IN');
    document.getElementById('gratTaxable').textContent = '₹'+Math.round(taxable).toLocaleString('en-IN');
    document.getElementById('gratCompletedYears').textContent = completedYears+' yr'+(completedYears!==1?'s':'');
  }
  seg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    empType = btn.dataset.type;
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  ['gratBasic','gratYears','gratMonths'].forEach(id=>{
    document.getElementById(id).addEventListener('input',calc);
  });
  calc();
})();

// ---- EPF calculator (India) ----
(function(){
  if(!document.getElementById('epfBasic')) return;
  const WAGE_CEILING = 15000;
  function calc(){
    const basicStart = Math.max(parseFloat(document.getElementById('epfBasic').value)||0, 0);
    const opening = Math.max(parseFloat(document.getElementById('epfOpening').value)||0, 0);
    const years = Math.max(parseFloat(document.getElementById('epfYears').value)||0, 0);
    const incrementPct = Math.max(parseFloat(document.getElementById('epfIncrement').value)||0, 0);
    const ratePct = Math.max(parseFloat(document.getElementById('epfRate').value)||0, 0);
    const monthlyRate = ratePct/1200;

    let balance = opening;
    let totalEmployee = 0, totalEmployerEPF = 0, totalInterest = 0;
    let basic = basicStart;
    const totalMonths = Math.round(years*12);

    for(let m=1; m<=totalMonths; m++){
      if(m>1 && (m-1)%12===0){ basic *= (1+incrementPct/100); }
      const empShare = basic*0.12;
      const epsShare = Math.min(basic,WAGE_CEILING)*0.0833;
      const erEpfShare = Math.max(basic*0.12 - epsShare, 0);
      totalEmployee += empShare;
      totalEmployerEPF += erEpfShare;
      const interest = balance*monthlyRate;
      totalInterest += interest;
      balance += empShare + erEpfShare + interest;
    }

    document.getElementById('epfCorpus').textContent = '₹'+Math.round(balance).toLocaleString('en-IN');
    document.getElementById('epfEmployee').textContent = '₹'+Math.round(totalEmployee).toLocaleString('en-IN');
    document.getElementById('epfEmployer').textContent = '₹'+Math.round(totalEmployerEPF).toLocaleString('en-IN');
    document.getElementById('epfInterest').textContent = '₹'+Math.round(totalInterest).toLocaleString('en-IN');
  }
  ['epfBasic','epfOpening','epfYears','epfIncrement','epfRate'].forEach(id=>{
    document.getElementById(id).addEventListener('input',calc);
  });
  calc();
})();

// ---- FIRE / Coast FIRE calculator ----
(function(){
  if(!document.getElementById('fireExpenses')) return;
  function calc(){
    const cur = document.getElementById('fireCur').value;
    const expenses = Math.max(parseFloat(document.getElementById('fireExpenses').value)||0, 0);
    const withdrawalPct = Math.max(parseFloat(document.getElementById('fireWithdrawal').value)||0, 0.01);
    const savings = Math.max(parseFloat(document.getElementById('fireSavings').value)||0, 0);
    const age = Math.max(parseFloat(document.getElementById('fireAge').value)||0, 0);
    const retireAge = Math.max(parseFloat(document.getElementById('fireRetireAge').value)||0, 0);
    const returnPct = parseFloat(document.getElementById('fireReturn').value)||0;

    const fireNumber = expenses / (withdrawalPct/100);
    const years = Math.max(retireAge - age, 0);
    const coastNumber = fireNumber / Math.pow(1+returnPct/100, years);
    const progressPct = fireNumber>0 ? (savings/fireNumber)*100 : 0;
    const coastGap = coastNumber - savings;

    document.getElementById('fireNumber').textContent = cur+Math.round(fireNumber).toLocaleString();
    document.getElementById('fireCoastNumber').textContent = cur+Math.round(coastNumber).toLocaleString();
    document.getElementById('fireProgress').textContent = progressPct.toFixed(1)+'%';
    document.getElementById('fireCoastStatus').textContent = coastGap<=0
      ? 'Already past Coast FIRE by '+cur+Math.round(-coastGap).toLocaleString()
      : cur+Math.round(coastGap).toLocaleString()+' more needed today to coast to your number by age '+retireAge;
  }
  ['fireCur','fireExpenses','fireWithdrawal','fireSavings','fireAge','fireRetireAge','fireReturn'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input',calc);
    el.addEventListener('change',calc);
  });
  calc();
})();

// ---- RSU vesting calculator ----
(function(){
  if(!document.getElementById('rsuShares')) return;
  let freqMonths = 3;
  const seg = document.getElementById('rsuFreqSeg');

  function calc(){
    const cur = document.getElementById('rsuCur').value;
    const totalShares = Math.max(parseFloat(document.getElementById('rsuShares').value)||0, 0);
    const price = Math.max(parseFloat(document.getElementById('rsuPrice').value)||0, 0);
    const years = Math.max(parseFloat(document.getElementById('rsuYears').value)||0, 0.1);
    const cliffMonths = Math.min(Math.max(parseFloat(document.getElementById('rsuCliff').value)||0, 0), years*12);
    const growthPct = parseFloat(document.getElementById('rsuGrowth').value)||0;
    const withholdingPct = Math.max(parseFloat(document.getElementById('rsuWithholding').value)||0, 0);

    const totalMonths = years*12;
    const cliffShares = totalMonths>0 ? totalShares * (cliffMonths/totalMonths) : 0;
    const remainingShares = totalShares - cliffShares;
    const postCliffMonths = totalMonths - cliffMonths;
    const numPeriods = Math.max(Math.round(postCliffMonths/freqMonths), postCliffMonths>0 ? 1 : 0);
    const perPeriodShares = numPeriods>0 ? remainingShares/numPeriods : 0;

    const events = [];
    if(cliffShares>0) events.push({month: cliffMonths, shares: cliffShares});
    for(let i=1;i<=numPeriods;i++){
      events.push({month: cliffMonths + i*freqMonths, shares: perPeriodShares});
    }

    const yearBuckets = {};
    let totalValue = 0;
    events.forEach(e=>{
      const priceAtVest = price * Math.pow(1+growthPct/100, e.month/12);
      const value = e.shares * priceAtVest;
      totalValue += value;
      const yr = Math.max(Math.ceil(e.month/12), 1);
      if(!yearBuckets[yr]) yearBuckets[yr] = {shares:0, value:0};
      yearBuckets[yr].shares += e.shares;
      yearBuckets[yr].value += value;
    });

    const afterTaxTotal = totalValue * (1-withholdingPct/100);

    document.getElementById('rsuTotalShares').textContent = Math.round(totalShares).toLocaleString();
    document.getElementById('rsuTotalValue').textContent = cur+Math.round(totalValue).toLocaleString();
    document.getElementById('rsuAfterTax').textContent = cur+Math.round(afterTaxTotal).toLocaleString();

    const body = document.getElementById('rsuScheduleBody');
    body.innerHTML = '';
    Object.keys(yearBuckets).sort((a,b)=>a-b).forEach(yr=>{
      const b = yearBuckets[yr];
      const afterTax = b.value*(1-withholdingPct/100);
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>Year '+yr+'</td><td>'+Math.round(b.shares).toLocaleString()+'</td><td>'+cur+Math.round(b.value).toLocaleString()+'</td><td>'+cur+Math.round(afterTax).toLocaleString()+'</td>';
      body.appendChild(tr);
    });
  }

  seg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    freqMonths = parseInt(btn.dataset.months,10);
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  ['rsuCur','rsuShares','rsuPrice','rsuYears','rsuCliff','rsuGrowth','rsuWithholding'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input',calc);
    el.addEventListener('change',calc);
  });
  calc();
})();

// ---- FX hidden-fee calculator (live mid-market rate via frankfurter.dev) ----
(function(){
  if(!document.getElementById('fxFrom')) return;
  const fromEl = document.getElementById('fxFrom');
  const toEl = document.getElementById('fxTo');
  const fallbackCurrencies = ['USD','EUR','GBP','INR','JPY','AUD','CAD','CHF','CNY','SGD','NZD','ZAR','SEK','NOK','MXN','BRL','HKD','KRW','THB','PLN'];
  let ratesUSD = null;
  let asOfDate = '';
  let midRate = null;

  function fillSelect(select, list, def){
    select.innerHTML = list.map(c=>`<option value="${c}">${c}</option>`).join('');
    select.value = list.includes(def) ? def : list[0];
  }

  function updateMidRate(){
    const from = fromEl.value, to = toEl.value;
    const lineEl = document.getElementById('fxMidLine');
    if(!ratesUSD || !(from in ratesUSD) || !(to in ratesUSD)){
      midRate = null;
      if(lineEl) lineEl.textContent = 'Mid-market rate unavailable right now.';
      calc();
      return;
    }
    midRate = ratesUSD[to]/ratesUSD[from];
    if(lineEl) lineEl.textContent = 'Live mid-market rate: 1 '+from+' = '+midRate.toFixed(4)+' '+to+' (as of '+asOfDate+', via frankfurter.dev)';
    const yourRateEl = document.getElementById('fxYourRate');
    if(!parseFloat(yourRateEl.value)) yourRateEl.value = midRate.toFixed(4);
    calc();
  }

  function calc(){
    const amt = Math.max(parseFloat(document.getElementById('fxAmt').value)||0, 0);
    const yourRate = Math.max(parseFloat(document.getElementById('fxYourRate').value)||0, 0);
    const to = toEl.value;

    const yourAmt = amt*yourRate;
    const midAmt = midRate!=null ? amt*midRate : null;

    document.getElementById('fxYourAmt').textContent = yourAmt.toFixed(2)+' '+to;
    const warnEl = document.getElementById('fxWarning');

    if(midAmt==null){
      document.getElementById('fxMidAmt').textContent = '—';
      document.getElementById('fxCost').textContent = '—';
      document.getElementById('fxMarkupPct').textContent = '—';
      return;
    }
    const cost = midAmt-yourAmt;
    const markupPct = midAmt>0 ? (cost/midAmt)*100 : 0;
    document.getElementById('fxMidAmt').textContent = midAmt.toFixed(2)+' '+to;
    document.getElementById('fxCost').textContent = cost.toFixed(2)+' '+to;
    document.getElementById('fxMarkupPct').textContent = markupPct.toFixed(2)+'%'+(cost<0 ? ' (your rate beat mid-market)' : '');
    if(warnEl){
      if(yourRate<=0){ warnEl.textContent = 'Enter the rate your bank or card actually gave you to see the comparison.'; warnEl.classList.add('show'); }
      else { warnEl.textContent=''; warnEl.classList.remove('show'); }
    }
  }

  fromEl.addEventListener('change', updateMidRate);
  toEl.addEventListener('change', updateMidRate);
  ['fxAmt','fxYourRate'].forEach(id=>{
    document.getElementById(id).addEventListener('input',calc);
  });

  fetch('https://api.frankfurter.dev/v1/latest?base=USD')
    .then(r=>{ if(!r.ok) throw new Error('bad response'); return r.json(); })
    .then(data=>{
      ratesUSD = Object.assign({USD:1}, data.rates);
      asOfDate = data.date;
      const codes = Object.keys(ratesUSD).sort();
      fillSelect(fromEl, codes, 'USD');
      fillSelect(toEl, codes, 'EUR');
      updateMidRate();
    })
    .catch(()=>{
      fillSelect(fromEl, fallbackCurrencies, 'USD');
      fillSelect(toEl, fallbackCurrencies, 'EUR');
      const lineEl = document.getElementById('fxMidLine');
      if(lineEl) lineEl.textContent = 'Live rate feed unavailable — enter both rates manually to compare.';
      calc();
    });
})();

// ---- Zakat calculator ----
(function(){
  if(!document.getElementById('zakCash')) return;
  let nisabBasis = 'silver';
  const seg = document.getElementById('zakNisabSeg');
  const GOLD_GRAMS = 87.48, SILVER_GRAMS = 612.36;

  function calc(){
    const cur = document.getElementById('zakCur').value;
    const cash = Math.max(parseFloat(document.getElementById('zakCash').value)||0, 0);
    const metals = Math.max(parseFloat(document.getElementById('zakMetals').value)||0, 0);
    const invest = Math.max(parseFloat(document.getElementById('zakInvest').value)||0, 0);
    const inventory = Math.max(parseFloat(document.getElementById('zakInventory').value)||0, 0);
    const other = Math.max(parseFloat(document.getElementById('zakOther').value)||0, 0);
    const debts = Math.max(parseFloat(document.getElementById('zakDebts').value)||0, 0);
    const goldPrice = Math.max(parseFloat(document.getElementById('zakGoldPrice').value)||0, 0);
    const silverPrice = Math.max(parseFloat(document.getElementById('zakSilverPrice').value)||0, 0);

    const nisab = nisabBasis==='gold' ? GOLD_GRAMS*goldPrice : SILVER_GRAMS*silverPrice;
    const totalAssets = cash+metals+invest+inventory+other;
    const netWealth = Math.max(totalAssets-debts, 0);
    const eligible = netWealth >= nisab && nisab > 0;
    const zakatDue = eligible ? netWealth*0.025 : 0;

    document.getElementById('zakNetWealth').textContent = cur+Math.round(netWealth).toLocaleString();
    document.getElementById('zakNisab').textContent = cur+Math.round(nisab).toLocaleString();
    document.getElementById('zakDue').textContent = cur+zakatDue.toFixed(2);
    document.getElementById('zakStatus').textContent = eligible
      ? 'Above nisab — Zakat is due (if held for a full lunar year)'
      : 'Below nisab — Zakat is not obligatory on this wealth';
  }

  seg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    nisabBasis = btn.dataset.basis;
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  ['zakCur','zakCash','zakMetals','zakInvest','zakInventory','zakOther','zakDebts','zakGoldPrice','zakSilverPrice'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input',calc);
    el.addEventListener('change',calc);
  });
  calc();
})();

// ---- Bill split calculator (uneven amounts) ----
(function(){
  if(!document.getElementById('bsPeopleCount')) return;
  const countEl = document.getElementById('bsPeopleCount');
  const rows = Array.from(document.querySelectorAll('.bs-person-row'));

  function updateVisibleRows(){
    const n = Math.min(Math.max(parseInt(countEl.value,10)||1, 1), 8);
    rows.forEach(row=>{
      const idx = parseInt(row.dataset.idx,10);
      row.style.display = idx<=n ? '' : 'none';
    });
  }

  function calc(){
    const n = Math.min(Math.max(parseInt(countEl.value,10)||1, 1), 8);
    const taxPct = Math.max(parseFloat(document.getElementById('bsTax').value)||0, 0);
    const tipPct = Math.max(parseFloat(document.getElementById('bsTip').value)||0, 0);

    const active = rows.filter(row=>parseInt(row.dataset.idx,10)<=n);
    const amounts = active.map(row=>Math.max(parseFloat(row.querySelector('.bs-amt').value)||0, 0));
    const subtotal = amounts.reduce((a,b)=>a+b,0);
    const taxAmt = subtotal*(taxPct/100);
    const tipAmt = subtotal*(tipPct/100);
    const total = subtotal+taxAmt+tipAmt;

    document.getElementById('bsSubtotal').textContent = '$'+subtotal.toFixed(2);
    document.getElementById('bsTaxAmt').textContent = '$'+taxAmt.toFixed(2);
    document.getElementById('bsTipAmt').textContent = '$'+tipAmt.toFixed(2);
    document.getElementById('bsTotal').textContent = '$'+total.toFixed(2);

    const body = document.getElementById('bsBreakdownBody');
    body.innerHTML = '';
    amounts.forEach((amt,i)=>{
      const share = subtotal>0 ? amt/subtotal : 0;
      const shareOfExtra = share*(taxAmt+tipAmt);
      const owed = amt+shareOfExtra;
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>Person '+(i+1)+'</td><td>$'+amt.toFixed(2)+'</td><td>$'+shareOfExtra.toFixed(2)+'</td><td>$'+owed.toFixed(2)+'</td>';
      body.appendChild(tr);
    });
  }

  countEl.addEventListener('input',()=>{ updateVisibleRows(); calc(); });
  countEl.addEventListener('change',()=>{ updateVisibleRows(); calc(); });
  document.getElementById('bsTax').addEventListener('input',calc);
  document.getElementById('bsTip').addEventListener('input',calc);
  rows.forEach(row=>{
    row.querySelector('.bs-amt').addEventListener('input',calc);
  });

  updateVisibleRows();
  calc();
})();

// ---- Fuel / trip cost calculator ----
(function(){
  if(!document.getElementById('fcDistance')) return;
  let distUnit = 'km';
  let effUnit = 'l100km';
  const distSeg = document.getElementById('fcDistUnitSeg');
  const effSeg = document.getElementById('fcEffUnitSeg');
  const priceLabelEl = document.getElementById('fcPriceUnitLabel');

  function updatePriceLabel(){
    priceLabelEl.textContent = effUnit==='mpg' ? 'gallon' : 'liter';
  }

  function calc(){
    const cur = document.getElementById('fcCur').value;
    const distance = Math.max(parseFloat(document.getElementById('fcDistance').value)||0, 0);
    const effValue = Math.max(parseFloat(document.getElementById('fcEffValue').value)||0, 0.001);
    const price = Math.max(parseFloat(document.getElementById('fcPrice').value)||0, 0);
    const roundTrip = document.getElementById('fcRoundTrip').checked;

    let distanceKm = distUnit==='mi' ? distance*1.60934 : distance;
    let distanceMi = distUnit==='mi' ? distance : distance/1.60934;
    if(roundTrip){ distanceKm*=2; distanceMi*=2; }

    let fuelNeeded, unitLabel;
    if(effUnit==='mpg'){
      fuelNeeded = distanceMi/effValue;
      unitLabel = 'gal';
    } else if(effUnit==='l100km'){
      fuelNeeded = distanceKm*(effValue/100);
      unitLabel = 'L';
    } else {
      fuelNeeded = distanceKm/effValue;
      unitLabel = 'L';
    }
    const cost = fuelNeeded*price;

    document.getElementById('fcFuelNeeded').textContent = fuelNeeded.toFixed(2)+' '+unitLabel;
    document.getElementById('fcCost').textContent = cur+cost.toFixed(2);
  }

  distSeg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    distUnit = btn.dataset.unit;
    distSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  effSeg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    effUnit = btn.dataset.unit;
    effSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    updatePriceLabel();
    calc();
  });
  ['fcDistance','fcEffValue','fcCur','fcPrice','fcRoundTrip'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input',calc);
    el.addEventListener('change',calc);
  });

  updatePriceLabel();
  calc();
})();

// ---- Sleep cycle calculator ----
(function(){
  if(!document.getElementById('scTime')) return;
  let mode = 'wake';
  const seg = document.getElementById('scModeSeg');
  const timeLabel = document.getElementById('scTimeLabel');
  const headerEl = document.getElementById('scResultTimeHeader');
  const subEl = document.getElementById('scOptionsSub');
  const CYCLES = [3,4,5,6];

  function fmtTime(mins){
    mins = ((mins%1440)+1440)%1440;
    let h = Math.floor(mins/60), m = mins%60;
    const ampm = h>=12 ? 'PM':'AM';
    let h12 = h%12; if(h12===0) h12=12;
    return h12+':'+String(m).padStart(2,'0')+' '+ampm;
  }

  function calc(){
    const timeVal = document.getElementById('scTime').value || '07:00';
    const [hh,mm] = timeVal.split(':').map(Number);
    const inputMin = hh*60+mm;
    const buffer = Math.max(parseFloat(document.getElementById('scBuffer').value)||0, 0);

    const body = document.getElementById('scOptionsBody');
    body.innerHTML = '';
    CYCLES.forEach(c=>{
      const sleepMin = c*90;
      const resultMin = mode==='wake' ? inputMin - (sleepMin+buffer) : inputMin + buffer + sleepMin;
      const hours = (sleepMin/60);
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>'+c+'</td><td>'+hours+' hr</td><td>'+fmtTime(resultMin)+'</td>';
      body.appendChild(tr);
    });
  }

  seg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    mode = btn.dataset.mode;
    seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    if(mode==='wake'){
      timeLabel.textContent = 'Wake-up time';
      headerEl.textContent = 'Bedtime';
      subEl.textContent = 'Each row is a bedtime that lands you between full sleep cycles instead of in the middle of one.';
    } else {
      timeLabel.textContent = 'Bedtime';
      headerEl.textContent = 'Wake-up time';
      subEl.textContent = 'Each row is a wake-up time that lands you between full sleep cycles instead of in the middle of one.';
    }
    calc();
  });
  document.getElementById('scTime').addEventListener('input',calc);
  document.getElementById('scTime').addEventListener('change',calc);
  document.getElementById('scBuffer').addEventListener('input',calc);
  calc();
})();

// ---- Water intake calculator ----
(function(){
  if(!document.getElementById('wiWeight')) return;
  let weightUnit = 'kg';
  let climate = 'normal';
  let outUnit = 'l';
  const weightSeg = document.getElementById('wiWeightUnitSeg');
  const climateSeg = document.getElementById('wiClimateSeg');
  const outSeg = document.getElementById('wiOutUnitSeg');

  function fmtVolume(ml){
    if(outUnit==='l') return (ml/1000).toFixed(2)+' L';
    if(outUnit==='floz') return (ml/29.5735).toFixed(1)+' fl oz';
    return (ml/236.588).toFixed(1)+' cups';
  }

  function calc(){
    const weightInput = Math.max(parseFloat(document.getElementById('wiWeight').value)||0, 0);
    const weightKg = weightUnit==='lb' ? weightInput*0.453592 : weightInput;
    const exerciseMin = Math.max(parseFloat(document.getElementById('wiExercise').value)||0, 0);

    const base = weightKg*35;
    const exerciseExtra = (exerciseMin/30)*350;
    const climateExtra = climate==='hot' ? base*0.1 : 0;
    const total = base+exerciseExtra+climateExtra;

    document.getElementById('wiTotal').textContent = fmtVolume(total);
    document.getElementById('wiBase').textContent = fmtVolume(base);
    document.getElementById('wiExerciseExtra').textContent = exerciseExtra>0 ? '+'+fmtVolume(exerciseExtra) : 'None';
    document.getElementById('wiClimateExtra').textContent = climateExtra>0 ? '+'+fmtVolume(climateExtra) : 'None';
  }

  weightSeg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    weightUnit = btn.dataset.unit;
    weightSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  climateSeg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    climate = btn.dataset.climate;
    climateSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  outSeg.addEventListener('click',(e)=>{
    const btn=e.target.closest('button'); if(!btn) return;
    outUnit = btn.dataset.unit;
    outSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  ['wiWeight','wiExercise'].forEach(id=>{
    document.getElementById(id).addEventListener('input',calc);
  });
  calc();
})();

// ---- Cash Back vs. Low Interest Calculator ----
(function(){
  if(!document.getElementById('cblPrice')) return;
  const curEl = document.getElementById('cblCur');
  const priceEl = document.getElementById('cblPrice');
  const cashEl = document.getElementById('cblCashBack');
  const lowEl = document.getElementById('cblLowApr');
  const stdEl = document.getElementById('cblStdApr');
  const termEl = document.getElementById('cblTerm');
  const warnEl = document.getElementById('cblWarning');

  // Standard fixed-rate amortization payment. A 0% promotional APR is common
  // on these offers, so the zero-rate branch is a real case, not a guard.
  function payment(principal, apr, months){
    const r = apr/100/12;
    if(r === 0) return principal/months;
    return principal*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1);
  }
  function money(cur, v){
    return cur + v.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function set(id, txt){ document.getElementById(id).textContent = txt; }

  function calc(){
    const cur = curEl.value;
    const price = parseFloat(priceEl.value);
    const cash = parseFloat(cashEl.value);
    const lowApr = parseFloat(lowEl.value);
    const stdApr = parseFloat(stdEl.value);
    const term = parseInt(termEl.value, 10);

    const blank = ['cblPayA','cblTotalA','cblPayB','cblTotalB','cblRecommended','cblSavings'];
    if(!isFinite(price) || !isFinite(cash) || !isFinite(lowApr) || !isFinite(stdApr) ||
       !isFinite(term) || price <= 0 || term < 1){
      blank.forEach(id=>set(id,'—'));
      warnEl.textContent = 'Enter a vehicle price above 0 and a loan term of at least 1 month.';
      return;
    }
    if(cash > price){
      blank.forEach(id=>set(id,'—'));
      warnEl.textContent = 'Cash back cannot be larger than the vehicle price.';
      return;
    }
    warnEl.textContent = '';

    // Option A: take the rebate, finance (price - rebate) at the standard APR.
    // Option B: skip the rebate, finance the full price at the promotional APR.
    const payA = payment(price - cash, stdApr, term), totalA = payA*term;
    const payB = payment(price, lowApr, term), totalB = payB*term;

    set('cblPayA', money(cur, payA));
    set('cblTotalA', money(cur, totalA));
    set('cblPayB', money(cur, payB));
    set('cblTotalB', money(cur, totalB));

    const diff = Math.abs(totalA - totalB);
    if(Math.abs(totalA - totalB) < 0.01){
      set('cblRecommended', 'Either — same cost');
      set('cblSavings', money(cur, 0));
    } else if(totalA < totalB){
      set('cblRecommended', 'Option A — Take Cash Back');
      set('cblSavings', money(cur, diff));
    } else {
      set('cblRecommended', 'Option B — Low Rate');
      set('cblSavings', money(cur, diff));
    }
  }

  [curEl, priceEl, cashEl, lowEl, stdEl, termEl].forEach(el=>{
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

// ---- TDEE Calculator ----
(function(){
  if(!document.getElementById('tdeeAge')) return;
  const unitSeg = document.getElementById('tdeeUnitSeg');
  const sexSeg = document.getElementById('tdeeSexSeg');
  const activityEl = document.getElementById('tdeeActivity');
  const warnEl = document.getElementById('tdeeWarning');
  let unit = 'metric', sex = 'male';

  function set(id, txt){ document.getElementById(id).textContent = txt; }
  function kcal(v){ return Math.round(v).toLocaleString() + ' kcal/day'; }

  function weightKg(){
    return unit === 'metric'
      ? parseFloat(document.getElementById('tdeeWeightKg').value)
      : parseFloat(document.getElementById('tdeeWeightLb').value) * 0.45359237;
  }
  function heightCm(){
    if(unit === 'metric') return parseFloat(document.getElementById('tdeeHeightCm').value);
    const ft = parseFloat(document.getElementById('tdeeHeightFt').value);
    const inch = parseFloat(document.getElementById('tdeeHeightIn').value);
    if(!isFinite(ft) || !isFinite(inch)) return NaN;
    return (ft*12 + inch) * 2.54;
  }

  function calc(){
    const age = parseFloat(document.getElementById('tdeeAge').value);
    const kg = weightKg(), cm = heightCm();
    const mult = parseFloat(activityEl.value);
    const ids = ['tdeeTotal','tdeeBmr','tdeeActivityBurn','tdeeCutMild','tdeeCutStd','tdeeBulk'];

    if(!isFinite(age) || !isFinite(kg) || !isFinite(cm) || age < 15 || age > 100 || kg <= 0 || cm <= 0){
      ids.forEach(id=>set(id,'—'));
      warnEl.textContent = 'Enter age 15-100 with a valid height and weight.';
      return;
    }
    warnEl.textContent = '';

    // Mifflin-St Jeor: generally closer to measured resting energy expenditure
    // than the older Harris-Benedict equation.
    const bmr = 10*kg + 6.25*cm - 5*age + (sex === 'male' ? 5 : -161);
    const tdee = bmr * mult;

    set('tdeeTotal', kcal(tdee));
    set('tdeeBmr', kcal(bmr));
    set('tdeeActivityBurn', '+' + Math.round(tdee - bmr).toLocaleString() + ' kcal/day');
    set('tdeeCutMild', kcal(tdee*0.85));
    set('tdeeCutStd', kcal(tdee*0.80));
    set('tdeeBulk', kcal(tdee*1.15));
  }

  unitSeg.addEventListener('click',(e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    unit = btn.dataset.unit;
    unitSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const metric = unit === 'metric';
    document.getElementById('tdeeWeightMetricWrap').style.display = metric ? '' : 'none';
    document.getElementById('tdeeWeightImpWrap').style.display = metric ? 'none' : '';
    document.getElementById('tdeeHeightMetricWrap').style.display = metric ? '' : 'none';
    document.getElementById('tdeeHeightImpWrap').style.display = metric ? 'none' : '';
    calc();
  });
  sexSeg.addEventListener('click',(e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    sex = btn.dataset.sex;
    sexSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  ['tdeeAge','tdeeWeightKg','tdeeWeightLb','tdeeHeightCm','tdeeHeightFt','tdeeHeightIn'].forEach(id=>{
    document.getElementById(id).addEventListener('input', calc);
  });
  activityEl.addEventListener('change', calc);
  calc();
})();

// ---- Protein Calculator ----
(function(){
  if(!document.getElementById('pcWeight')) return;
  const weightEl = document.getElementById('pcWeight');
  const goalEl = document.getElementById('pcGoal');
  const bfEl = document.getElementById('pcBodyFat');
  const unitSeg = document.getElementById('pcWeightUnitSeg');
  const basisSeg = document.getElementById('pcBasisSeg');
  const warnEl = document.getElementById('pcWarning');
  let unit = 'kg', basis = 'total';

  // Grams of protein per kg of the chosen basis, per day.
  const RANGES = {
    sedentary: [0.8, 1.0],
    active:    [1.2, 1.4],
    strength:  [1.6, 2.2],
    cut:       [1.8, 2.4],
    endurance: [1.2, 1.6]
  };

  function set(id, txt){ document.getElementById(id).textContent = txt; }
  function g(v){ return Math.round(v) + ' g'; }

  function calc(){
    let w = parseFloat(weightEl.value);
    const bf = parseFloat(bfEl.value);
    const ids = ['pcRange','pcMid','pcCals','pcBasisOut','pcPerMeal'];

    if(!isFinite(w) || w <= 0){
      ids.forEach(id=>set(id,'—'));
      warnEl.textContent = 'Enter a body weight above 0.';
      return;
    }
    const kg = unit === 'kg' ? w : w * 0.45359237;

    let refKg = kg, basisLabel = 'Total body weight';
    if(basis === 'lean'){
      if(!isFinite(bf) || bf < 3 || bf > 60){
        ids.forEach(id=>set(id,'—'));
        warnEl.textContent = 'Enter a body fat percentage between 3 and 60.';
        return;
      }
      // Fat tissue has little protein requirement, so at higher body-fat
      // percentages lean mass is the more sensible basis than total weight.
      refKg = kg * (1 - bf/100);
      basisLabel = 'Lean body mass — ' + refKg.toFixed(1) + ' kg';
    } else {
      basisLabel = 'Total body weight — ' + kg.toFixed(1) + ' kg';
    }
    warnEl.textContent = '';

    const [lo, hi] = RANGES[goalEl.value];
    const gLo = refKg*lo, gHi = refKg*hi, mid = (gLo+gHi)/2;

    set('pcRange', Math.round(gLo) + '–' + Math.round(gHi) + ' g/day');
    set('pcMid', g(mid) + '/day');
    set('pcCals', Math.round(mid*4).toLocaleString() + ' kcal'); // protein = 4 kcal/g
    set('pcBasisOut', basisLabel);
    set('pcPerMeal', '~' + Math.round(mid/4) + ' g per meal');
  }

  unitSeg.addEventListener('click',(e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    unit = btn.dataset.unit;
    unitSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  basisSeg.addEventListener('click',(e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    basis = btn.dataset.basis;
    basisSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('pcBodyFatWrap').style.display = basis === 'lean' ? '' : 'none';
    calc();
  });
  weightEl.addEventListener('input', calc);
  bfEl.addEventListener('input', calc);
  goalEl.addEventListener('change', calc);
  calc();
})();

// ---- Basic Calculator ----
// Everything lives inside this IIFE: no top-level names, so nothing here can
// collide with another calculator's helpers.
(function () {
  var valEl = document.getElementById('bcVal');
  if (!valEl) return;

  var exprEl = document.getElementById('bcExpr');
  var grid = document.getElementById('bcGrid');

  var entry = '0';      // what the user is currently typing
  var acc = null;       // running total
  var pending = null;   // operator awaiting a right-hand side
  var fresh = true;     // next digit replaces the entry rather than appending
  var errored = false;

  var OPS = { '+': function (a, b) { return a + b; },
              '\u2212': function (a, b) { return a - b; },
              '\u00D7': function (a, b) { return a * b; },
              '\u00F7': function (a, b) { return a / b; } };

  // Trim binary-float noise (0.1 + 0.2) without truncating genuine precision.
  function clean(n) {
    if (!isFinite(n)) return null;
    var r = parseFloat(n.toPrecision(12));
    return Object.is(r, -0) ? 0 : r;
  }

  function show() {
    valEl.textContent = errored ? 'Error' : entry;
    exprEl.textContent = errored ? '\u00A0'
      : (acc === null ? '\u00A0' : format(acc) + ' ' + pending);
  }

  function format(n) {
    if (n === null) return '';
    var s = String(n);
    // group the integer part only, leaving any exponent form alone
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      var neg = s.charAt(0) === '-';
      if (neg) s = s.slice(1);
      var parts = s.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      s = (neg ? '-' : '') + parts.join('.');
    }
    return s;
  }

  function reset() { entry = '0'; acc = null; pending = null; fresh = true; errored = false; }

  function digit(d) {
    if (errored) reset();
    if (fresh) { entry = (d === '.') ? '0.' : d; fresh = false; return; }
    if (d === '.') { if (entry.indexOf('.') === -1) entry += '.'; return; }
    if (entry === '0') entry = d; else entry += d;
  }

  function applyPending() {
    var rhs = parseFloat(entry);
    if (pending === null || acc === null) return clean(rhs);
    var out = clean(OPS[pending](acc, rhs));
    if (out === null) { errored = true; return null; }
    return out;
  }

  function operator(op) {
    if (errored) return;
    var out = applyPending();
    if (errored) { show(); return; }
    acc = out;
    pending = op;
    entry = String(acc);
    fresh = true;
  }

  function equals() {
    if (errored || pending === null) return;
    var out = applyPending();
    if (errored) { show(); return; }
    entry = String(out);
    acc = null; pending = null; fresh = true;
  }

  function act(a) {
    if (a === 'ac') { reset(); return; }
    if (errored) { reset(); return; }
    if (a === 'back') {
      if (fresh) return;
      entry = entry.length > 1 ? entry.slice(0, -1) : '0';
      if (entry === '-' || entry === '') entry = '0';
      return;
    }
    if (a === 'sign') {
      entry = entry.charAt(0) === '-' ? entry.slice(1) : '-' + entry;
      return;
    }
    if (a === 'pct') {
      var v = clean(parseFloat(entry) / 100);
      entry = v === null ? '0' : String(v);
      fresh = false;
      return;
    }
  }

  grid.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.num !== undefined) digit(b.dataset.num);
    else if (b.dataset.op !== undefined) operator(b.dataset.op);
    else if (b.dataset.act === 'eq') equals();
    else if (b.dataset.act !== undefined) act(b.dataset.act);
    show();
  });

  var KEYOPS = { '+': '+', '-': '\u2212', '*': '\u00D7', '/': '\u00F7' };
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var k = e.key;
    if (k >= '0' && k <= '9') { digit(k); }
    else if (k === '.' || k === ',') { digit('.'); }
    else if (KEYOPS[k]) { operator(KEYOPS[k]); }
    else if (k === 'Enter' || k === '=') { equals(); }
    else if (k === 'Backspace') { act('back'); }
    else if (k === 'Escape') { act('ac'); }
    else if (k === '%') { act('pct'); }
    else return;
    e.preventDefault();
    show();
  });

  show();
})();

// ---- Cross-Country Take-Home Comparison ----
// Reuses the shared bracket tables above (taxUsFiling / taxIndiaRegimes /
// taxFlatSchemes / calcBracketTax) so income tax stays consistent with the
// main tax calculator. Everything else is scoped to this IIFE.
(function () {
  if (!document.getElementById('xcGrossA')) return;

  // Employee-side mandatory contributions, 2026. "savings" marks schemes where
  // the money stays yours (retirement accounts) rather than being a pure tax —
  // the distinction most salary comparisons quietly ignore.
  var CTRY = {
    us: { name: 'United States', cur: 'USD', sym: '$',
      social: function (g) { var ss = Math.min(g, 184500) * 0.062, mc = g * 0.0145 + Math.max(0, g - 200000) * 0.009;
        return { amt: ss + mc, label: 'Social Security + Medicare (FICA)', savings: false }; } },
    uk: { name: 'United Kingdom', cur: 'GBP', sym: '\u00A3',
      social: function (g) { var ni = Math.max(0, Math.min(g, 50270) - 12570) * 0.08 + Math.max(0, g - 50270) * 0.02;
        return { amt: ni, label: 'National Insurance (Class 1)', savings: false }; } },
    in: { name: 'India', cur: 'INR', sym: '\u20B9',
      social: function (g) { return { amt: g * 0.50 * 0.12, label: 'EPF (12% of basic, basic taken as 50% of gross)', savings: true }; } },
    ca: { name: 'Canada', cur: 'CAD', sym: 'C$',
      social: function (g) { var cpp = Math.max(0, Math.min(g, 74600) - 3500) * 0.0595
          + Math.max(0, Math.min(g, 85000) - 74600) * 0.04;
        var ei = Math.min(g, 68900) * 0.0163;
        return { amt: cpp + ei, label: 'CPP + CPP2 + EI', savings: false }; } },
    au: { name: 'Australia', cur: 'AUD', sym: 'A$',
      social: function (g) { return { amt: g * 0.02, label: 'Medicare levy (super is paid by the employer on top)', savings: false }; } },
    sg: { name: 'Singapore', cur: 'SGD', sym: 'S$',
      social: function (g) { return { amt: Math.min(g, 96000) * 0.20, label: 'CPF employee share (age 55 and under)', savings: true }; } },
    de: { name: 'Germany', cur: 'EUR', sym: '\u20AC',
      social: function (g) { var a = Math.min(g, 101400) * 0.106, b = Math.min(g, 69750) * 0.091;
        return { amt: a + b, label: 'Pension, unemployment, health and care (employee share)', savings: false }; } },
    ae: { name: 'United Arab Emirates', cur: 'AED', sym: 'AED ',
      social: function () { return { amt: 0, label: 'No personal income tax or employee social contribution for expatriates', savings: false }; } }
  };

  function incomeTax(code, gross) {
    if (code === 'us') {
      var fs = taxUsFiling.single;
      return calcBracketTax(Math.max(0, gross - fs.standardDeduction), fs.brackets).tax;
    }
    if (code === 'in') {
      var rg = taxIndiaRegimes['new'];
      var ti = Math.max(0, gross - rg.standardDeduction);
      if (ti <= rg.rebateThreshold) return 0;               // Section 87A
      return calcBracketTax(ti, rg.brackets).tax * 1.04;     // + 4% cess
    }
    return calcBracketTax(gross, taxFlatSchemes[code].brackets).tax;
  }

  var rates = null, ratesDate = '';
  var els = {};
  ['GrossA', 'GrossB', 'CountryA', 'CountryB', 'Base'].forEach(function (k) { els[k] = document.getElementById('xc' + k); });
  var noteEl = document.getElementById('xcNote');
  var fxEl = document.getElementById('xcFx');

  function money(sym, n) {
    return sym + Math.round(n).toLocaleString('en-US');
  }

  function scenario(code, gross) {
    var c = CTRY[code];
    var tax = incomeTax(code, gross);
    var soc = c.social(gross);
    var net = Math.max(0, gross - tax - soc.amt);
    return { c: c, gross: gross, tax: tax, soc: soc, net: net,
             rate: gross > 0 ? (tax + soc.amt) / gross * 100 : 0 };
  }

  // Convert an amount in `from` currency into `to`, using USD-based rates.
  function convert(amt, from, to) {
    if (!rates || from === to) return from === to ? amt : null;
    if (!rates[from] || !rates[to]) return null;
    return amt / rates[from] * rates[to];
  }

  function render() {
    var a = scenario(els.CountryA.value, Math.max(0, parseFloat(els.GrossA.value) || 0));
    var b = scenario(els.CountryB.value, Math.max(0, parseFloat(els.GrossB.value) || 0));
    var base = els.Base.value;
    var baseSym = (Object.keys(CTRY).map(function (k) { return CTRY[k]; })
      .filter(function (c) { return c.cur === base; })[0] || { sym: base + ' ' }).sym;

    [['A', a], ['B', b]].forEach(function (pair) {
      var k = pair[0], s = pair[1];
      document.getElementById('xcTax' + k).textContent = money(s.c.sym, s.tax);
      document.getElementById('xcSoc' + k).textContent = money(s.c.sym, s.soc.amt);
      document.getElementById('xcNet' + k).textContent = money(s.c.sym, s.net);
      document.getElementById('xcRate' + k).textContent = s.rate.toFixed(1) + '%';
      document.getElementById('xcSocLabel' + k).textContent = s.soc.label;
      var conv = convert(s.net, s.c.cur, base);
      document.getElementById('xcNetBase' + k).textContent =
        conv === null ? (rates ? '\u2014' : 'loading\u2026') : money(baseSym, conv);
    });

    var ca = convert(a.net, a.c.cur, base), cb = convert(b.net, b.c.cur, base);
    if (ca !== null && cb !== null && ca > 0 && cb > 0) {
      var diff = cb - ca;
      var pct = diff / ca * 100;
      noteEl.textContent = Math.abs(pct) < 0.5
        ? 'The two are within half a percent of each other once converted to ' + base + '.'
        : (diff > 0 ? b.c.name : a.c.name) + ' leaves you '
          + money(baseSym, Math.abs(diff)) + ' more a year — '
          + Math.abs(pct).toFixed(1) + '% ahead in ' + base + ' terms, before any cost-of-living difference.';
    } else {
      noteEl.textContent = rates ? '' : 'Fetching live exchange rates\u2026';
    }
  }

  fetch('https://api.frankfurter.dev/v1/latest?base=USD')
    .then(function (r) { if (!r.ok) throw new Error('bad response'); return r.json(); })
    .then(function (data) {
      rates = Object.assign({ USD: 1 }, data.rates);
      ratesDate = data.date;
      if (fxEl) fxEl.textContent = 'Live mid-market rates as of ' + ratesDate + '. Conversion is for comparison only — it is not what a bank would give you.';
      render();
    })
    .catch(function () {
      if (fxEl) fxEl.textContent = 'Could not reach the exchange rate service, so the converted column is unavailable. Local-currency figures below are unaffected.';
      render();
    });

  ['GrossA', 'GrossB', 'CountryA', 'CountryB', 'Base'].forEach(function (k) {
    els[k].addEventListener('input', render);
    els[k].addEventListener('change', render);
  });

  render();
})();

// ---- India: Old vs New Regime Optimiser ----
(function () {
  if (!document.getElementById('irGross')) return;

  var g = function (id) { return document.getElementById(id); };
  var num = function (id) { return Math.max(parseFloat(g(id).value) || 0, 0); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };

  function slabTax(taxable, isNew) {
    var rg = isNew ? taxIndiaRegimes['new'] : taxIndiaRegimes.old;
    return calcBracketTax(taxable, rg.brackets).tax;
  }

  // Surcharge bands, FY 2026-27. The new regime caps the top rate at 25%.
  function surcharge(taxable, baseTax, isNew) {
    var bands = [[5000000, 0.10], [10000000, 0.15], [20000000, 0.25], [50000000, isNew ? 0.25 : 0.37]];
    var rate = 0, threshold = 0;
    for (var i = 0; i < bands.length; i++) {
      if (taxable > bands[i][0]) { rate = bands[i][1]; threshold = bands[i][0]; }
    }
    if (rate === 0) return 0;
    var sur = baseTax * rate;
    // Marginal relief: tax plus surcharge must not exceed the liability at the
    // threshold plus every rupee of income above it.
    var maxTotal = slabTax(threshold, isNew) + (taxable - threshold);
    if (baseTax + sur > maxTotal) sur = Math.max(0, maxTotal - baseTax);
    return sur;
  }

  function liability(taxable, isNew) {
    var rg = isNew ? taxIndiaRegimes['new'] : taxIndiaRegimes.old;
    if (taxable <= rg.rebateThreshold) return { total: 0 };   // Section 87A
    var base = slabTax(taxable, isNew);
    var sur = surcharge(taxable, base, isNew);
    return { total: (base + sur) * 1.04 };                    // + 4% cess
  }

  function hraExempt(basic, hraRecd, rent, metro) {
    return Math.max(0, Math.min(hraRecd, Math.max(rent - 0.10 * basic, 0), (metro ? 0.50 : 0.40) * basic));
  }

  // Smallest total old-regime deduction that makes the old regime match the new.
  function breakEven(gross, nps2) {
    var target = liability(Math.max(0, gross - 75000 - nps2), true).total;
    var lo = 0, hi = gross;
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      if (liability(Math.max(0, gross - mid), false).total > target) lo = mid; else hi = mid;
    }
    return hi;
  }

  var metro = true;
  var seg = g('irMetroSeg');

  function calc() {
    var gross = num('irGross');
    var basic = num('irBasic');
    var nps2 = num('irNps2');                        // 80CCD(2) — allowed in both regimes

    var hraEx = hraExempt(basic, num('irHraRecd'), num('irRent'), metro);
    var c80 = Math.min(num('ir80c'), 150000);
    var d80 = Math.min(num('ir80d'), 100000);
    var home = Math.min(num('irHomeLoan'), 200000);
    var nps1b = Math.min(num('irNps1b'), 50000);
    var other = num('irOther');
    var totalDed = 50000 + hraEx + c80 + d80 + home + nps1b + nps2 + other;

    var oldTaxable = Math.max(0, gross - totalDed);
    var newTaxable = Math.max(0, gross - 75000 - nps2);

    var o = liability(oldTaxable, false);
    var n = liability(newTaxable, true);

    g('irOldTaxable').textContent = inr(oldTaxable);
    g('irNewTaxable').textContent = inr(newTaxable);
    g('irOldTax').textContent = inr(o.total);
    g('irNewTax').textContent = inr(n.total);
    g('irHraEx').textContent = inr(hraEx);
    g('irDeductions').textContent = inr(totalDed);

    var diff = Math.abs(o.total - n.total);
    if (Math.round(o.total) === Math.round(n.total)) {
      g('irWinner').textContent = 'Line ball';
      g('irNote').textContent = 'Both regimes produce the same bill on these numbers.';
    } else if (o.total < n.total) {
      g('irWinner').textContent = 'Old regime';
      g('irNote').textContent = 'The old regime saves you ' + inr(diff) + ' a year. Your '
        + inr(totalDed) + ' of deductions is enough to beat the new regime’s lower rates.';
    } else {
      g('irWinner').textContent = 'New regime';
      g('irNote').textContent = 'The new regime saves you ' + inr(diff) + ' a year. To beat it you would need about '
        + inr(breakEven(gross, nps2)) + ' of total old-regime deductions, including the ₹50,000 standard deduction.';
    }
  }

  if (seg) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      metro = b.dataset.metro === 'metro';
      seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      calc();
    });
  }
  ['irGross', 'irBasic', 'irHraRecd', 'irRent', 'ir80c', 'ir80d', 'irHomeLoan', 'irNps1b', 'irNps2', 'irOther']
    .forEach(function (id) { g(id).addEventListener('input', calc); });
  calc();
})();

// ---- India: Freelancer Tax (44ADA + GST + advance tax) ----
(function () {
  if (!document.getElementById('flReceipts')) return;

  var g = function (id) { return document.getElementById(id); };
  var num = function (id) { return Math.max(parseFloat(g(id).value) || 0, 0); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };

  function newRegimeTax(taxable) {
    var rg = taxIndiaRegimes['new'];
    if (taxable <= rg.rebateThreshold) return 0;
    var base = calcBracketTax(taxable, rg.brackets).tax;
    var sur = 0;
    if (taxable > 5000000) {
      var bands = [[5000000, 0.10], [10000000, 0.15], [20000000, 0.25], [50000000, 0.25]];
      var rate = 0, th = 0;
      bands.forEach(function (b) { if (taxable > b[0]) { rate = b[1]; th = b[0]; } });
      sur = base * rate;
      var atTh = calcBracketTax(th, rg.brackets).tax;
      if (base + sur > atTh + (taxable - th)) sur = Math.max(0, atTh + (taxable - th) - base);
    }
    return (base + sur) * 1.04;
  }

  function calc() {
    var receipts = num('flReceipts');
    var cashPct = num('flCashPct');
    var expenses = num('flExpenses');

    var limit = cashPct <= 5 ? 7500000 : 5000000;
    var eligible = receipts <= limit && receipts > 0;

    var presumptive = receipts * 0.50;
    var actual = Math.max(0, receipts - expenses);

    var taxPresumptive = newRegimeTax(Math.max(0, presumptive - 75000));
    var taxActual = newRegimeTax(Math.max(0, actual - 75000));

    g('flLimit').textContent = inr(limit);
    g('flEligible').textContent = eligible
      ? 'Yes — within the ' + inr(limit) + ' limit'
      : (receipts > limit ? 'No — receipts exceed the limit, books required' : '—');
    g('flPresumptive').textContent = inr(presumptive);
    g('flActual').textContent = inr(actual);
    g('flTaxPresumptive').textContent = eligible ? inr(taxPresumptive) : '—';
    g('flTaxActual').textContent = inr(taxActual);

    var better = g('flBetter');
    if (!eligible) {
      better.textContent = receipts > limit
        ? 'Above the 44ADA limit, so books and the usual audit obligations apply.'
        : 'Enter your gross receipts to compare the two routes.';
    } else if (Math.round(taxPresumptive) < Math.round(taxActual)) {
      better.textContent = '44ADA is cheaper by ' + inr(taxActual - taxPresumptive)
        + '. Your real expenses are below 50% of receipts, so the presumptive deduction is worth more than what you could actually claim — and you avoid keeping books.';
    } else if (Math.round(taxPresumptive) > Math.round(taxActual)) {
      better.textContent = 'Keeping books is cheaper by ' + inr(taxPresumptive - taxActual)
        + '. Your expenses exceed 50% of receipts, so 44ADA would overstate your profit. Weigh that against the bookkeeping and audit burden.';
    } else {
      better.textContent = 'Both routes produce the same bill.';
    }

    var gstTh = g('flGstState').value === 'special' ? 1000000 : 2000000;
    g('flGst').textContent = receipts > gstTh
      ? 'Registration required — receipts exceed ' + inr(gstTh)
      : 'Not required on turnover alone — below ' + inr(gstTh);

    var due = eligible ? taxPresumptive : taxActual;
    var single = eligible;
    g('flAdv1').textContent = single ? '—' : inr(due * 0.15);
    g('flAdv2').textContent = single ? '—' : inr(due * 0.30);
    g('flAdv3').textContent = single ? '—' : inr(due * 0.30);
    g('flAdv4').textContent = single ? inr(due) : inr(due * 0.25);
    g('flAdvNote').textContent = single
      ? 'Under 44ADA the whole liability falls in a single instalment by 15 March 2027 — one of the scheme’s real advantages.'
      : 'Four instalments: 15% by 15 June, 45% cumulative by 15 September, 75% by 15 December, 100% by 15 March.';
  }

  ['flReceipts', 'flCashPct', 'flExpenses', 'flGstState'].forEach(function (id) {
    g(id).addEventListener('input', calc);
    g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- PSLF Progress Tracker ----
(function () {
  if (!document.getElementById('psPaid')) return;

  var g = function (id) { return document.getElementById(id); };
  var num = function (id) { return Math.max(parseFloat(g(id).value) || 0, 0); };
  var usd = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };

  function calc() {
    var paid = Math.min(num('psPaid'), 120);
    var payment = num('psPayment');
    var balance = num('psBalance');
    var rate = num('psRate');
    var qualifies = g('psEmployer').value === 'yes';
    var plan = g('psPlan').value;

    var remaining = Math.max(0, 120 - paid);
    g('psRemaining').textContent = remaining + (remaining === 1 ? ' payment' : ' payments');
    g('psYears').textContent = (remaining / 12).toFixed(1) + ' years';

    var d = new Date(2026, 6, 1);
    d.setMonth(d.getMonth() + remaining);
    g('psDate').textContent = remaining === 0 ? 'Eligible now'
      : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    g('psStillToPay').textContent = usd(payment * remaining);
    g('psTotalPaid').textContent = usd(payment * 120);

    // Project the balance forward at the stated rate while paying `payment`.
    var bal = balance, r = rate / 100 / 12, negAm = false;
    for (var m = 0; m < remaining; m++) {
      var interest = bal * r;
      if (interest > payment) negAm = true;
      bal = bal + interest - payment;
      if (bal < 0) { bal = 0; break; }
    }
    g('psForgiven').textContent = usd(bal);

    var v = g('psVerdict');
    if (!qualifies) {
      v.textContent = 'Payments made while your employer does not qualify do not count. Nothing accrues until you are working full-time for a government body or a qualifying non-profit.';
    } else if (plan === 'tiered') {
      v.textContent = 'The Tiered Standard plan does not qualify, so payments made on it never count — however many you make. It is also the plan you are placed on by default if you choose nothing, which makes it the most common way progress is silently lost. Switch to RAP or IBR.';
    } else if (bal <= 0) {
      v.textContent = 'On these numbers the loan clears before you reach 120 payments, leaving nothing to forgive. PSLF only helps when the balance outlives the payment count — if you are close to paying it off anyway, the pursuit costs you nothing but gains you nothing either.';
    } else {
      v.textContent = 'About ' + usd(bal) + ' would be forgiven after ' + remaining
        + ' more qualifying payments, having paid ' + usd(payment * 120) + ' across the full 120.'
        + (negAm ? ' Your payment is below the monthly interest for part of the term, so the balance grows — under PSLF that matters far less than usual, because the balance is written off at the end.' : '');
    }
  }

  ['psPaid', 'psPayment', 'psBalance', 'psRate', 'psEmployer', 'psPlan'].forEach(function (id) {
    g(id).addEventListener('input', calc);
    g(id).addEventListener('change', calc);
  });
  calc();
})();

// ================= Geometry cluster =================
// Each tool is self-contained in its own IIFE. No top-level names.

// ---- Circle Calculator ----
(function () {
  if (!document.getElementById('ciInput')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') : '—'; };
  function calc() {
    var v = parseFloat(g('ciInput').value);
    var mode = g('ciMode').value;
    if (!isFinite(v) || v <= 0) { ['ciR', 'ciD', 'ciC', 'ciA'].forEach(function (id) { g(id).textContent = '—'; }); return; }
    var r;
    if (mode === 'r') r = v;
    else if (mode === 'd') r = v / 2;
    else if (mode === 'c') r = v / (2 * Math.PI);
    else r = Math.sqrt(v / Math.PI);
    g('ciR').textContent = f(r);
    g('ciD').textContent = f(2 * r);
    g('ciC').textContent = f(2 * Math.PI * r);
    g('ciA').textContent = f(Math.PI * r * r);
  }
  ['ciInput', 'ciMode'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Area Calculator (2D shapes) ----
(function () {
  if (!document.getElementById('arShape')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) && n >= 0 ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') : '—'; };
  var FIELDS = {
    rectangle: [['Length', 'arA'], ['Width', 'arB']],
    triangle: [['Base', 'arA'], ['Height', 'arB']],
    circle: [['Radius', 'arA']],
    trapezoid: [['Side a', 'arA'], ['Side b', 'arB'], ['Height', 'arC']],
    parallelogram: [['Base', 'arA'], ['Height', 'arB']],
    ellipse: [['Semi-axis a', 'arA'], ['Semi-axis b', 'arB']],
    sector: [['Radius', 'arA'], ['Angle (degrees)', 'arB']]
  };
  function show() {
    var s = g('arShape').value, need = FIELDS[s];
    [['arA', 0], ['arB', 1], ['arC', 2]].forEach(function (pair) {
      var wrap = g(pair[0]).closest('.field');
      var spec = need[pair[1]];
      if (spec) { wrap.style.display = ''; wrap.querySelector('label').textContent = spec[0]; }
      else wrap.style.display = 'none';
    });
  }
  function calc() {
    var s = g('arShape').value;
    var a = parseFloat(g('arA').value) || 0, b = parseFloat(g('arB').value) || 0, c = parseFloat(g('arC').value) || 0;
    var area = NaN, per = NaN;
    if (s === 'rectangle') { area = a * b; per = 2 * (a + b); }
    else if (s === 'triangle') { area = 0.5 * a * b; }
    else if (s === 'circle') { area = Math.PI * a * a; per = 2 * Math.PI * a; }
    else if (s === 'trapezoid') { area = 0.5 * (a + b) * c; }
    else if (s === 'parallelogram') { area = a * b; }
    else if (s === 'ellipse') { area = Math.PI * a * b; per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))); }
    else if (s === 'sector') { area = Math.PI * a * a * (b / 360); per = 2 * a + 2 * Math.PI * a * (b / 360); }
    g('arArea').textContent = f(area);
    g('arPerimeter').textContent = isFinite(per) ? f(per) : 'n/a for this shape';
  }
  g('arShape').addEventListener('change', function () { show(); calc(); });
  ['arA', 'arB', 'arC'].forEach(function (id) { g(id).addEventListener('input', calc); });
  show(); calc();
})();

// ---- Volume Calculator (3D solids) ----
(function () {
  if (!document.getElementById('voShape')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) && n >= 0 ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') : '—'; };
  var FIELDS = {
    cube: [['Edge', 'voA']],
    box: [['Length', 'voA'], ['Width', 'voB'], ['Height', 'voC']],
    cylinder: [['Radius', 'voA'], ['Height', 'voB']],
    sphere: [['Radius', 'voA']],
    cone: [['Radius', 'voA'], ['Height', 'voB']],
    pyramid: [['Base length', 'voA'], ['Base width', 'voB'], ['Height', 'voC']]
  };
  function show() {
    var need = FIELDS[g('voShape').value];
    [['voA', 0], ['voB', 1], ['voC', 2]].forEach(function (p) {
      var wrap = g(p[0]).closest('.field'), spec = need[p[1]];
      if (spec) { wrap.style.display = ''; wrap.querySelector('label').textContent = spec[0]; }
      else wrap.style.display = 'none';
    });
  }
  function calc() {
    var s = g('voShape').value;
    var a = parseFloat(g('voA').value) || 0, b = parseFloat(g('voB').value) || 0, c = parseFloat(g('voC').value) || 0;
    var v = NaN, sa = NaN;
    if (s === 'cube') { v = a * a * a; sa = 6 * a * a; }
    else if (s === 'box') { v = a * b * c; sa = 2 * (a * b + b * c + a * c); }
    else if (s === 'cylinder') { v = Math.PI * a * a * b; sa = 2 * Math.PI * a * (a + b); }
    else if (s === 'sphere') { v = 4 / 3 * Math.PI * a * a * a; sa = 4 * Math.PI * a * a; }
    else if (s === 'cone') { v = Math.PI * a * a * b / 3; sa = Math.PI * a * (a + Math.sqrt(a * a + b * b)); }
    else if (s === 'pyramid') { v = a * b * c / 3; }
    g('voVolume').textContent = f(v);
    g('voSurface').textContent = isFinite(sa) ? f(sa) : 'n/a for this shape';
  }
  g('voShape').addEventListener('change', function () { show(); calc(); });
  ['voA', 'voB', 'voC'].forEach(function (id) { g(id).addEventListener('input', calc); });
  show(); calc();
})();

// ---- Surface Area Calculator ----
(function () {
  if (!document.getElementById('saShape')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) && n >= 0 ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') : '—'; };
  var FIELDS = {
    cube: [['Edge', 'saA']],
    box: [['Length', 'saA'], ['Width', 'saB'], ['Height', 'saC']],
    cylinder: [['Radius', 'saA'], ['Height', 'saB']],
    sphere: [['Radius', 'saA']],
    cone: [['Radius', 'saA'], ['Height', 'saB']]
  };
  function show() {
    var need = FIELDS[g('saShape').value];
    [['saA', 0], ['saB', 1], ['saC', 2]].forEach(function (p) {
      var wrap = g(p[0]).closest('.field'), spec = need[p[1]];
      if (spec) { wrap.style.display = ''; wrap.querySelector('label').textContent = spec[0]; }
      else wrap.style.display = 'none';
    });
  }
  function calc() {
    var s = g('saShape').value;
    var a = parseFloat(g('saA').value) || 0, b = parseFloat(g('saB').value) || 0, c = parseFloat(g('saC').value) || 0;
    var total = NaN, lateral = NaN;
    if (s === 'cube') { total = 6 * a * a; lateral = 4 * a * a; }
    else if (s === 'box') { total = 2 * (a * b + b * c + a * c); lateral = 2 * c * (a + b); }
    else if (s === 'cylinder') { lateral = 2 * Math.PI * a * b; total = lateral + 2 * Math.PI * a * a; }
    else if (s === 'sphere') { total = 4 * Math.PI * a * a; }
    else if (s === 'cone') { var l = Math.sqrt(a * a + b * b); lateral = Math.PI * a * l; total = lateral + Math.PI * a * a; }
    g('saTotal').textContent = f(total);
    g('saLateral').textContent = isFinite(lateral) ? f(lateral) : 'n/a for this shape';
  }
  g('saShape').addEventListener('change', function () { show(); calc(); });
  ['saA', 'saB', 'saC'].forEach(function (id) { g(id).addEventListener('input', calc); });
  show(); calc();
})();

// ---- Slope Calculator ----
(function () {
  if (!document.getElementById('slX1')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') : '—'; };
  function calc() {
    var x1 = parseFloat(g('slX1').value), y1 = parseFloat(g('slY1').value);
    var x2 = parseFloat(g('slX2').value), y2 = parseFloat(g('slY2').value);
    if ([x1, y1, x2, y2].some(function (v) { return !isFinite(v); })) {
      ['slSlope', 'slAngle', 'slIntercept', 'slEquation', 'slDistance'].forEach(function (id) { g(id).textContent = '—'; });
      return;
    }
    var dx = x2 - x1, dy = y2 - y1;
    if (dx === 0) {
      g('slSlope').textContent = 'undefined (vertical)';
      g('slAngle').textContent = '90°';
      g('slIntercept').textContent = 'none';
      g('slEquation').textContent = 'x = ' + f(x1);
    } else {
      var m = dy / dx, bIt = y1 - m * x1;
      g('slSlope').textContent = f(m);
      g('slAngle').textContent = f(Math.atan(m) * 180 / Math.PI) + '°';
      g('slIntercept').textContent = f(bIt);
      g('slEquation').textContent = 'y = ' + f(m) + 'x ' + (bIt < 0 ? '− ' + f(Math.abs(bIt)) : '+ ' + f(bIt));
    }
    g('slDistance').textContent = f(Math.sqrt(dx * dx + dy * dy));
  }
  ['slX1', 'slY1', 'slX2', 'slY2'].forEach(function (id) { g(id).addEventListener('input', calc); });
  calc();
})();

// ---- Coordinate Distance Calculator ----
(function () {
  if (!document.getElementById('cdX1')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') : '—'; };
  function calc() {
    var use3d = g('cdDim').value === '3d';
    var x1 = parseFloat(g('cdX1').value) || 0, y1 = parseFloat(g('cdY1').value) || 0, z1 = parseFloat(g('cdZ1').value) || 0;
    var x2 = parseFloat(g('cdX2').value) || 0, y2 = parseFloat(g('cdY2').value) || 0, z2 = parseFloat(g('cdZ2').value) || 0;
    if (!use3d) { z1 = 0; z2 = 0; }
    [g('cdZ1'), g('cdZ2')].forEach(function (el) { el.closest('.field').style.display = use3d ? '' : 'none'; });
    var dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
    g('cdDistance').textContent = f(Math.sqrt(dx * dx + dy * dy + dz * dz));
    g('cdMidpoint').textContent = '(' + f((x1 + x2) / 2) + ', ' + f((y1 + y2) / 2) + (use3d ? ', ' + f((z1 + z2) / 2) : '') + ')';
    g('cdDelta').textContent = 'Δx ' + f(dx) + ', Δy ' + f(dy) + (use3d ? ', Δz ' + f(dz) : '');
  }
  ['cdX1', 'cdY1', 'cdZ1', 'cdX2', 'cdY2', 'cdZ2', 'cdDim'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Pythagorean Theorem Calculator ----
(function () {
  if (!document.getElementById('pyA')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) && n > 0 ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') : '—'; };
  function calc() {
    var solve = g('pySolve').value;
    var a = parseFloat(g('pyA').value), b = parseFloat(g('pyB').value), c = parseFloat(g('pyC').value);
    g('pyA').closest('.field').style.display = solve === 'a' ? 'none' : '';
    g('pyB').closest('.field').style.display = solve === 'b' ? 'none' : '';
    g('pyC').closest('.field').style.display = solve === 'c' ? 'none' : '';
    var res = NaN, note = '';
    if (solve === 'c') { if (a > 0 && b > 0) res = Math.sqrt(a * a + b * b); }
    else if (solve === 'a') {
      if (c > 0 && b > 0) { if (c <= b) note = 'The hypotenuse must be longer than either leg.'; else res = Math.sqrt(c * c - b * b); }
    } else {
      if (c > 0 && a > 0) { if (c <= a) note = 'The hypotenuse must be longer than either leg.'; else res = Math.sqrt(c * c - a * a); }
    }
    g('pyResult').textContent = f(res);
    g('pyLabel').textContent = solve === 'c' ? 'Hypotenuse c' : 'Leg ' + solve;
    var A = solve === 'a' ? res : a, B = solve === 'b' ? res : b, C = solve === 'c' ? res : c;
    g('pyArea').textContent = (isFinite(A) && isFinite(B) && A > 0 && B > 0) ? f(0.5 * A * B) : '—';
    g('pyPerimeter').textContent = [A, B, C].every(function (v) { return isFinite(v) && v > 0; }) ? f(A + B + C) : '—';
    g('pyNote').textContent = note;
  }
  ['pyA', 'pyB', 'pyC', 'pySolve'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Right Triangle Calculator ----
(function () {
  if (!document.getElementById('rtKnown')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) && n > 0 ? (Math.round(n * 1e4) / 1e4).toLocaleString('en-US') : '—'; };
  var DEG = 180 / Math.PI;
  function calc() {
    var mode = g('rtKnown').value;
    var p = parseFloat(g('rtP').value), q = parseFloat(g('rtQ').value);
    g('rtPLabel').textContent = mode === 'legs' ? 'Leg a' : (mode === 'legHyp' ? 'Leg a' : 'Leg a');
    g('rtQLabel').textContent = mode === 'legs' ? 'Leg b' : (mode === 'legHyp' ? 'Hypotenuse c' : 'Angle A (degrees)');
    var a = NaN, b = NaN, c = NaN, note = '';
    if (mode === 'legs' && p > 0 && q > 0) { a = p; b = q; c = Math.sqrt(a * a + b * b); }
    else if (mode === 'legHyp' && p > 0 && q > 0) {
      if (q <= p) note = 'The hypotenuse must be longer than the leg.';
      else { a = p; c = q; b = Math.sqrt(c * c - a * a); }
    } else if (mode === 'legAngle' && p > 0 && q > 0 && q < 90) {
      a = p; var A = q / DEG; b = a / Math.tan(A); c = a / Math.sin(A);
    } else if (mode === 'legAngle' && q >= 90) note = 'Angle A must be under 90° in a right triangle.';
    g('rtA').textContent = f(a); g('rtB').textContent = f(b); g('rtC').textContent = f(c);
    var angA = (isFinite(a) && isFinite(c)) ? Math.asin(a / c) * DEG : NaN;
    g('rtAngA').textContent = isFinite(angA) ? f(angA) + '°' : '—';
    g('rtAngB').textContent = isFinite(angA) ? f(90 - angA) + '°' : '—';
    g('rtArea').textContent = (isFinite(a) && isFinite(b)) ? f(0.5 * a * b) : '—';
    g('rtPerimeter').textContent = [a, b, c].every(isFinite) ? f(a + b + c) : '—';
    g('rtNote').textContent = note;
  }
  ['rtP', 'rtQ', 'rtKnown'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Triangle Calculator (any triangle) ----
(function () {
  if (!document.getElementById('trMode')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) && n > 0 ? (Math.round(n * 1e4) / 1e4).toLocaleString('en-US') : '—'; };
  var DEG = 180 / Math.PI;
  function calc() {
    var mode = g('trMode').value;
    var x = parseFloat(g('trX').value), y = parseFloat(g('trY').value), z = parseFloat(g('trZ').value);
    var labels = mode === 'sss' ? ['Side a', 'Side b', 'Side c']
      : mode === 'sas' ? ['Side a', 'Angle C (degrees)', 'Side b']
        : ['Angle A (degrees)', 'Side c', 'Angle B (degrees)'];
    ['trXLabel', 'trYLabel', 'trZLabel'].forEach(function (id, i) { g(id).textContent = labels[i]; });
    var a = NaN, b = NaN, c = NaN, note = '';
    if (mode === 'sss') {
      a = x; b = y; c = z;
      if ([a, b, c].every(function (v) { return v > 0; })) {
        if (a + b <= c || a + c <= b || b + c <= a) { note = 'Those three lengths cannot form a triangle — any two sides must sum to more than the third.'; a = b = c = NaN; }
      } else { a = b = c = NaN; }
    } else if (mode === 'sas') {
      if (x > 0 && z > 0 && y > 0 && y < 180) { a = x; b = z; c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(y / DEG)); }
    } else {
      if (x > 0 && z > 0 && y > 0 && x + z < 180) {
        var A = x / DEG, B = z / DEG, C = Math.PI - A - B;
        c = y; a = c * Math.sin(A) / Math.sin(C); b = c * Math.sin(B) / Math.sin(C);
      } else if (x + z >= 180) note = 'Two angles of a triangle must add to less than 180°.';
    }
    g('trA').textContent = f(a); g('trB').textContent = f(b); g('trC').textContent = f(c);
    if ([a, b, c].every(function (v) { return isFinite(v) && v > 0; })) {
      var angA = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * DEG;
      var angB = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * DEG;
      var s = (a + b + c) / 2;
      g('trAngA').textContent = f(angA) + '°';
      g('trAngB').textContent = f(angB) + '°';
      g('trAngC').textContent = f(180 - angA - angB) + '°';
      g('trArea').textContent = f(Math.sqrt(s * (s - a) * (s - b) * (s - c)));
      g('trPerimeter').textContent = f(a + b + c);
    } else {
      ['trAngA', 'trAngB', 'trAngC', 'trArea', 'trPerimeter'].forEach(function (id) { g(id).textContent = '—'; });
    }
    g('trNote').textContent = note;
  }
  ['trX', 'trY', 'trZ', 'trMode'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ================= Number theory cluster =================

// ---- shared-free helpers live inside each IIFE; no top-level names ----

// ---- GCF / GCD Calculator ----
(function () {
  if (!document.getElementById('gcfInput')) return;
  var g = function (id) { return document.getElementById(id); };
  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
  function parse(s) {
    return (s || '').split(/[^0-9.\-]+/).map(function (x) { return Math.abs(Math.round(parseFloat(x))); })
      .filter(function (n) { return isFinite(n) && n > 0; });
  }
  function primeFactors(n) {
    var out = [], d = 2;
    while (d * d <= n) { while (n % d === 0) { out.push(d); n /= d; } d++; }
    if (n > 1) out.push(n);
    return out;
  }
  function fmtFactorisation(n) {
    if (n < 2) return String(n);
    var f = primeFactors(n), counts = {};
    f.forEach(function (p) { counts[p] = (counts[p] || 0) + 1; });
    return Object.keys(counts).map(function (p) { return counts[p] > 1 ? p + '^' + counts[p] : p; }).join(' × ');
  }
  function calc() {
    var nums = parse(g('gcfInput').value);
    if (nums.length < 2) {
      ['gcfResult', 'gcfLcm', 'gcfCoprime', 'gcfFactorisations'].forEach(function (id) { g(id).textContent = '—'; });
      return;
    }
    var G = nums.reduce(gcd);
    var L = nums.reduce(function (a, b) { return a / gcd(a, b) * b; });
    g('gcfResult').textContent = G.toLocaleString('en-US');
    g('gcfLcm').textContent = isFinite(L) ? L.toLocaleString('en-US') : 'too large';
    g('gcfCoprime').textContent = G === 1 ? 'Yes — they share no common factor' : 'No — they share ' + G;
    g('gcfFactorisations').textContent = nums.map(function (n) { return n + ' = ' + fmtFactorisation(n); }).join('   ·   ');
  }
  g('gcfInput').addEventListener('input', calc);
  calc();
})();

// ---- LCM Calculator ----
(function () {
  if (!document.getElementById('lcmInput')) return;
  var g = function (id) { return document.getElementById(id); };
  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
  function calc() {
    var nums = (g('lcmInput').value || '').split(/[^0-9]+/).map(Number)
      .filter(function (n) { return isFinite(n) && n > 0; });
    if (nums.length < 2) {
      ['lcmResult', 'lcmGcf', 'lcmProduct', 'lcmCheck'].forEach(function (id) { g(id).textContent = '—'; });
      return;
    }
    var G = nums.reduce(gcd);
    var L = nums.reduce(function (a, b) { return a / gcd(a, b) * b; });
    g('lcmResult').textContent = isFinite(L) ? L.toLocaleString('en-US') : 'too large to display';
    g('lcmGcf').textContent = G.toLocaleString('en-US');
    if (nums.length === 2) {
      g('lcmProduct').textContent = (nums[0] * nums[1]).toLocaleString('en-US');
      g('lcmCheck').textContent = 'GCF × LCM = ' + (G * L).toLocaleString('en-US') + ', which equals a × b';
    } else {
      g('lcmProduct').textContent = 'n/a for more than two numbers';
      g('lcmCheck').textContent = 'The GCF × LCM identity only holds for exactly two numbers';
    }
  }
  g('lcmInput').addEventListener('input', calc);
  calc();
})();

// ---- Factor Calculator ----
(function () {
  if (!document.getElementById('facInput')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var n = Math.abs(Math.round(parseFloat(g('facInput').value)));
    if (!isFinite(n) || n < 1 || n > 1e12) {
      ['facFactors', 'facCount', 'facPrime', 'facIsPrime', 'facSum'].forEach(function (id) { g(id).textContent = '—'; });
      if (n > 1e12) g('facFactors').textContent = 'Enter a number under 1 trillion';
      return;
    }
    var factors = [], i;
    for (i = 1; i * i <= n; i++) {
      if (n % i === 0) { factors.push(i); if (i !== n / i) factors.push(n / i); }
    }
    factors.sort(function (a, b) { return a - b; });
    var pf = [], d = 2, m = n;
    while (d * d <= m) { while (m % d === 0) { pf.push(d); m /= d; } d++; }
    if (m > 1) pf.push(m);
    var counts = {};
    pf.forEach(function (p) { counts[p] = (counts[p] || 0) + 1; });
    var pfStr = Object.keys(counts).map(function (p) { return counts[p] > 1 ? p + '^' + counts[p] : p; }).join(' × ');

    g('facFactors').textContent = factors.length > 60
      ? factors.slice(0, 60).join(', ') + ' … (' + factors.length + ' total)'
      : factors.join(', ');
    g('facCount').textContent = factors.length + (factors.length === 1 ? ' factor' : ' factors');
    g('facPrime').textContent = n < 2 ? 'n/a' : pfStr;
    g('facIsPrime').textContent = n < 2 ? 'Neither prime nor composite'
      : (factors.length === 2 ? 'Prime' : 'Composite');
    g('facSum').textContent = factors.reduce(function (a, b) { return a + b; }, 0).toLocaleString('en-US');
  }
  g('facInput').addEventListener('input', calc);
  calc();
})();

// ---- Rounding Calculator ----
(function () {
  if (!document.getElementById('rndInput')) return;
  var g = function (id) { return document.getElementById(id); };
  function sigFig(n, d) {
    if (n === 0) return 0;
    var mag = Math.ceil(Math.log10(Math.abs(n)));
    var power = d - mag;
    var factor = Math.pow(10, power);
    return Math.round(n * factor) / factor;
  }
  function calc() {
    var n = parseFloat(g('rndInput').value);
    var places = parseInt(g('rndPlaces').value, 10);
    var nearest = parseFloat(g('rndNearest').value);
    if (!isFinite(n)) { ['rndDecimals', 'rndSig', 'rndNearestOut', 'rndUp', 'rndDown', 'rndHalfEven'].forEach(function (id) { g(id).textContent = '—'; }); return; }
    var f = Math.pow(10, isFinite(places) ? places : 2);
    // Show the requested number of decimal places rather than trimming trailing
    // zeros — "0.00" states the precision, where "0" hides it. norm() also
    // turns JavaScript's negative zero back into plain 0.
    var dp = isFinite(places) && places >= 0 && places <= 20 ? places : 2;
    var norm = function (x) { return Object.is(x, -0) ? 0 : x; };
    g('rndDecimals').textContent = norm(Math.round(n * f) / f)
      .toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: 20 });
    g('rndSig').textContent = isFinite(places) && places > 0 ? String(sigFig(n, places)) : '—';
    g('rndNearestOut').textContent = isFinite(nearest) && nearest > 0
      ? norm(Math.round(n / nearest) * nearest).toLocaleString('en-US', { maximumFractionDigits: 20 }) : '—';
    g('rndUp').textContent = (Math.ceil(n * f) / f).toLocaleString('en-US', { maximumFractionDigits: 20 });
    g('rndDown').textContent = (Math.floor(n * f) / f).toLocaleString('en-US', { maximumFractionDigits: 20 });
    // banker's rounding (round half to even)
    var scaled = n * f, r = Math.round(scaled);
    if (Math.abs(scaled % 1) === 0.5 && r % 2 !== 0) r -= 1;
    g('rndHalfEven').textContent = (r / f).toLocaleString('en-US', { maximumFractionDigits: 20 });
  }
  ['rndInput', 'rndPlaces', 'rndNearest'].forEach(function (id) { g(id).addEventListener('input', calc); });
  calc();
})();

// ---- Scientific Notation Calculator ----
(function () {
  if (!document.getElementById('sciNotInput')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var raw = (g('sciNotInput').value || '').trim().replace(/\s*[×x]\s*10\s*\^?\s*/i, 'e').replace(/\s+/g, '');
    var n = Number(raw);
    if (raw === '' || !isFinite(n)) {
      ['sciNotSci', 'sciNotE', 'sciNotEng', 'sciNotDecimal', 'sciNotOrder'].forEach(function (id) { g(id).textContent = '—'; });
      return;
    }
    if (n === 0) {
      g('sciNotSci').textContent = '0'; g('sciNotE').textContent = '0e0';
      g('sciNotEng').textContent = '0'; g('sciNotDecimal').textContent = '0';
      g('sciNotOrder').textContent = 'n/a — zero has no order of magnitude';
      return;
    }
    var exp = Math.floor(Math.log10(Math.abs(n)));
    var mant = n / Math.pow(10, exp);
    // guard against float drift pushing the mantissa to 10
    if (Math.abs(mant) >= 10) { mant /= 10; exp += 1; }
    if (Math.abs(mant) < 1) { mant *= 10; exp -= 1; }
    var engExp = Math.floor(exp / 3) * 3;
    var engMant = n / Math.pow(10, engExp);

    g('sciNotSci').textContent = (Math.round(mant * 1e6) / 1e6) + ' × 10^' + exp;
    g('sciNotE').textContent = (Math.round(mant * 1e6) / 1e6) + 'e' + exp;
    g('sciNotEng').textContent = (Math.round(engMant * 1e6) / 1e6) + ' × 10^' + engExp;
    g('sciNotDecimal').textContent = Math.abs(exp) > 20 ? n.toExponential() : n.toLocaleString('en-US', { maximumFractionDigits: 20 });
    g('sciNotOrder').textContent = String(exp);
  }
  g('sciNotInput').addEventListener('input', calc);
  calc();
})();

// ---- Big Number Calculator (arbitrary precision via BigInt) ----
(function () {
  if (!document.getElementById('bigA')) return;
  var g = function (id) { return document.getElementById(id); };
  function clean(s) { return (s || '').replace(/[,\s_]/g, ''); }
  function calc() {
    var as = clean(g('bigA').value), bs = clean(g('bigB').value), op = g('bigOp').value;
    var out = g('bigResult'), digits = g('bigDigits'), note = g('bigNote');
    if (!/^-?\d+$/.test(as) || (op !== 'fact' && !/^-?\d+$/.test(bs))) {
      out.textContent = '—'; digits.textContent = '—';
      note.textContent = as || bs ? 'Whole numbers only — BigInt cannot represent decimals.' : '';
      return;
    }
    var a, b, r;
    try {
      a = BigInt(as); b = op === 'fact' ? 0n : BigInt(bs);
      if (op === 'add') r = a + b;
      else if (op === 'sub') r = a - b;
      else if (op === 'mul') r = a * b;
      else if (op === 'div') { if (b === 0n) { out.textContent = 'Division by zero'; digits.textContent = '—'; note.textContent = ''; return; } r = a / b; }
      else if (op === 'mod') { if (b === 0n) { out.textContent = 'Division by zero'; digits.textContent = '—'; note.textContent = ''; return; } r = a % b; }
      else if (op === 'pow') {
        if (b < 0n) { out.textContent = 'Negative exponents give fractions, which BigInt cannot hold'; digits.textContent = '—'; note.textContent = ''; return; }
        if (b > 100000n) { out.textContent = 'Exponent too large'; digits.textContent = '—'; note.textContent = ''; return; }
        r = a ** b;
      } else if (op === 'fact') {
        if (a < 0n || a > 10000n) { out.textContent = 'Factorial is defined for 0 to 10,000 here'; digits.textContent = '—'; note.textContent = ''; return; }
        r = 1n; for (var i = 2n; i <= a; i++) r *= i;
      }
    } catch (e) { out.textContent = 'Could not compute'; digits.textContent = '—'; note.textContent = ''; return; }
    var s = r.toString();
    out.textContent = s.length > 2000 ? s.slice(0, 2000) + '… (truncated for display)' : s;
    digits.textContent = (s.replace('-', '').length) + ' digits';
    var exact = Number(s);
    note.textContent = (s.replace('-', '').length > 15)
      ? 'This exceeds what a normal JavaScript number can hold exactly — a standard calculator would return ' + exact.toExponential(6) + ' and lose the trailing digits.'
      : '';
  }
  ['bigA', 'bigB', 'bigOp'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  g('bigOp').addEventListener('change', function () {
    g('bigB').closest('.field').style.display = g('bigOp').value === 'fact' ? 'none' : '';
  });
  calc();
})();

// ---- Number Sequence Calculator ----
(function () {
  if (!document.getElementById('seqType')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') : '—'; };
  function calc() {
    var type = g('seqType').value;
    var a = parseFloat(g('seqFirst').value);
    var d = parseFloat(g('seqStep').value);
    var n = Math.max(1, Math.min(Math.round(parseFloat(g('seqN').value) || 10), 200));

    g('seqStep').closest('.field').style.display = type === 'fib' ? 'none' : '';
    g('seqStepLabel').textContent = type === 'geometric' ? 'Common ratio (r)' : 'Common difference (d)';

    var terms = [], nth = NaN, sum = NaN;
    if (type === 'arithmetic' && isFinite(a) && isFinite(d)) {
      for (var i = 0; i < n; i++) terms.push(a + i * d);
      nth = a + (n - 1) * d;
      sum = n / 2 * (2 * a + (n - 1) * d);
    } else if (type === 'geometric' && isFinite(a) && isFinite(d)) {
      for (var j = 0; j < n; j++) terms.push(a * Math.pow(d, j));
      nth = a * Math.pow(d, n - 1);
      sum = d === 1 ? a * n : a * (1 - Math.pow(d, n)) / (1 - d);
    } else if (type === 'fib') {
      var x = isFinite(a) ? a : 0, y = isFinite(a) ? a + 1 : 1;
      if (!isFinite(a)) { x = 0; y = 1; }
      for (var k = 0; k < n; k++) { terms.push(x); var t = x + y; x = y; y = t; }
      nth = terms[terms.length - 1];
      sum = terms.reduce(function (p, q) { return p + q; }, 0);
    }
    g('seqTerms').textContent = terms.length ? terms.map(f).join(', ') : '—';
    g('seqNth').textContent = f(nth);
    g('seqSum').textContent = f(sum);
    g('seqFormula').textContent =
      type === 'arithmetic' ? 'aₙ = a + (n−1)d' :
      type === 'geometric' ? 'aₙ = a · r^(n−1)' :
      'aₙ = aₙ₋₁ + aₙ₋₂';
  }
  ['seqType', 'seqFirst', 'seqStep', 'seqN'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Probability Calculator ----
(function () {
  if (!document.getElementById('prbA')) return;
  var g = function (id) { return document.getElementById(id); };
  var pct = function (n) { return isFinite(n) ? (Math.round(n * 1e6) / 1e6) + '  (' + (Math.round(n * 1e4) / 100) + '%)' : '—'; };
  function calc() {
    var pa = parseFloat(g('prbA').value), pb = parseFloat(g('prbB').value);
    var note = g('prbNote');
    if (!isFinite(pa) || !isFinite(pb) || pa < 0 || pa > 1 || pb < 0 || pb > 1) {
      ['prbNotA', 'prbAnd', 'prbOr', 'prbXor', 'prbNeither', 'prbCond'].forEach(function (id) { g(id).textContent = '—'; });
      note.textContent = (isFinite(pa) && (pa < 0 || pa > 1)) || (isFinite(pb) && (pb < 0 || pb > 1))
        ? 'A probability must be between 0 and 1.' : '';
      return;
    }
    var and = pa * pb;                 // independent events
    var or = pa + pb - and;
    g('prbNotA').textContent = pct(1 - pa);
    g('prbAnd').textContent = pct(and);
    g('prbOr').textContent = pct(or);
    g('prbXor').textContent = pct(pa + pb - 2 * and);
    g('prbNeither').textContent = pct((1 - pa) * (1 - pb));
    g('prbCond').textContent = pb === 0 ? 'undefined (B cannot occur)' : pct(and / pb);
    note.textContent = 'These assume A and B are independent — one happening does not change the odds of the other. If they are dependent, P(A and B) is not simply P(A) × P(B).';
  }
  ['prbA', 'prbB'].forEach(function (id) { g(id).addEventListener('input', calc); });
  calc();
})();

// ---- Matrix Calculator ----
(function () {
  if (!document.getElementById('matSize')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return (Math.round(n * 1e4) / 1e4).toLocaleString('en-US'); };
  function read(which, size) {
    var m = [];
    for (var r = 0; r < size; r++) {
      m.push([]);
      for (var c = 0; c < size; c++) {
        var el = g('mat' + which + r + c);
        m[r].push(el ? (parseFloat(el.value) || 0) : 0);
      }
    }
    return m;
  }
  function det(m) {
    if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
         - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
         + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  }
  function inverse(m) {
    var d = det(m);
    if (Math.abs(d) < 1e-12) return null;
    var n = m.length, out = [];
    if (n === 2) {
      out = [[m[1][1] / d, -m[0][1] / d], [-m[1][0] / d, m[0][0] / d]];
    } else {
      var cof = [];
      for (var r = 0; r < 3; r++) {
        cof.push([]);
        for (var c = 0; c < 3; c++) {
          var sub = [];
          for (var i = 0; i < 3; i++) { if (i === r) continue; var row = []; for (var j = 0; j < 3; j++) { if (j === c) continue; row.push(m[i][j]); } sub.push(row); }
          cof[r].push(((r + c) % 2 ? -1 : 1) * (sub[0][0] * sub[1][1] - sub[0][1] * sub[1][0]));
        }
      }
      for (var a = 0; a < 3; a++) { out.push([]); for (var b = 0; b < 3; b++) out[a].push(cof[b][a] / d); }
    }
    return out;
  }
  function show(m) {
    if (!m) return 'not invertible (determinant is zero)';
    return m.map(function (row) { return '[ ' + row.map(f).join('   ') + ' ]'; }).join('\n');
  }
  function render() {
    var size = parseInt(g('matSize').value, 10);
    ['A', 'B'].forEach(function (w) {
      var grid = g('matGrid' + w);
      grid.innerHTML = '';
      grid.style.gridTemplateColumns = 'repeat(' + size + ', minmax(0,1fr))';
      for (var r = 0; r < size; r++) for (var c = 0; c < size; c++) {
        var inp = document.createElement('input');
        inp.type = 'number'; inp.step = 'any'; inp.id = 'mat' + w + r + c;
        inp.value = (w === 'A' ? (r === c ? 1 : 0) : (r === c ? 2 : 1));
        inp.setAttribute('aria-label', 'Matrix ' + w + ' row ' + (r + 1) + ' column ' + (c + 1));
        inp.addEventListener('input', calc);
        grid.appendChild(inp);
      }
    });
    calc();
  }
  function calc() {
    var size = parseInt(g('matSize').value, 10);
    var op = g('matOp').value;
    var A = read('A', size), B = read('B', size);
    var res = [], r, c, k, s;
    if (op === 'add' || op === 'sub') {
      for (r = 0; r < size; r++) { res.push([]); for (c = 0; c < size; c++) res[r].push(op === 'add' ? A[r][c] + B[r][c] : A[r][c] - B[r][c]); }
    } else if (op === 'mul') {
      for (r = 0; r < size; r++) { res.push([]); for (c = 0; c < size; c++) { s = 0; for (k = 0; k < size; k++) s += A[r][k] * B[k][c]; res[r].push(s); } }
    } else if (op === 'invA') {
      res = inverse(A);
    }
    g('matResult').textContent = op === 'invA' ? show(res) : show(res);
    g('matDetA').textContent = f(det(A));
    g('matDetB').textContent = f(det(B));
    g('matGridB').closest('.field').style.display = op === 'invA' ? 'none' : '';
  }
  ['matSize', 'matOp'].forEach(function (id) { g(id).addEventListener('change', function () { render(); }); });
  render();
})();

// ================= Electronics / IT cluster =================

// ---- Ohm's Law Calculator ----
(function () {
  if (!document.getElementById('ohmV')) return;
  var g = function (id) { return document.getElementById(id); };
  var f = function (n) { return isFinite(n) && n >= 0 ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') : '—'; };
  function calc() {
    var V = parseFloat(g('ohmV').value), I = parseFloat(g('ohmI').value);
    var R = parseFloat(g('ohmR').value), P = parseFloat(g('ohmP').value);
    var known = [V, I, R, P].filter(function (x) { return isFinite(x) && x !== 0; }).length;
    var note = g('ohmNote');
    // Derive from whichever pair is supplied.
    if (isFinite(V) && isFinite(I)) { R = V / I; P = V * I; }
    else if (isFinite(V) && isFinite(R)) { I = V / R; P = V * V / R; }
    else if (isFinite(V) && isFinite(P)) { I = P / V; R = V * V / P; }
    else if (isFinite(I) && isFinite(R)) { V = I * R; P = I * I * R; }
    else if (isFinite(I) && isFinite(P)) { V = P / I; R = P / (I * I); }
    else if (isFinite(R) && isFinite(P)) { V = Math.sqrt(P * R); I = Math.sqrt(P / R); }
    else {
      ['ohmOutV', 'ohmOutI', 'ohmOutR', 'ohmOutP'].forEach(function (id) { g(id).textContent = '—'; });
      note.textContent = known === 1 ? 'Enter a second value — any two of the four determine the other two.' : 'Enter any two values.';
      return;
    }
    g('ohmOutV').textContent = f(V) + ' V';
    g('ohmOutI').textContent = f(I) + ' A';
    g('ohmOutR').textContent = f(R) + ' Ω';
    g('ohmOutP').textContent = f(P) + ' W';
    note.textContent = 'V = I × R  ·  P = V × I = I²R = V²/R';
  }
  ['ohmV', 'ohmI', 'ohmR', 'ohmP'].forEach(function (id) { g(id).addEventListener('input', calc); });
  calc();
})();

// ---- Resistor Colour Code Calculator ----
(function () {
  if (!document.getElementById('resBands')) return;
  var g = function (id) { return document.getElementById(id); };
  var DIGIT = { black: 0, brown: 1, red: 2, orange: 3, yellow: 4, green: 5, blue: 6, violet: 7, grey: 8, white: 9 };
  var MULT = { black: 1, brown: 10, red: 100, orange: 1e3, yellow: 1e4, green: 1e5, blue: 1e6, violet: 1e7, grey: 1e8, white: 1e9, gold: 0.1, silver: 0.01 };
  var TOL = { brown: 1, red: 2, green: 0.5, blue: 0.25, violet: 0.1, grey: 0.05, gold: 5, silver: 10 };
  function fmtOhms(r) {
    if (!isFinite(r)) return '—';
    if (r >= 1e9) return (r / 1e9) + ' GΩ';
    if (r >= 1e6) return (r / 1e6) + ' MΩ';
    if (r >= 1e3) return (r / 1e3) + ' kΩ';
    return (Math.round(r * 1e4) / 1e4) + ' Ω';
  }
  function calc() {
    var bands = parseInt(g('resBands').value, 10);
    g('resB3').closest('.field').style.display = bands >= 5 ? '' : 'none';
    var d1 = DIGIT[g('resB1').value], d2 = DIGIT[g('resB2').value], d3 = DIGIT[g('resB3').value];
    var m = MULT[g('resMult').value], t = TOL[g('resTol').value];
    var digits = bands >= 5 ? (d1 * 100 + d2 * 10 + d3) : (d1 * 10 + d2);
    var r = digits * m;
    g('resValue').textContent = fmtOhms(r);
    g('resExact').textContent = isFinite(r) ? r.toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' Ω' : '—';
    g('resTolOut').textContent = '± ' + t + '%';
    g('resRange').textContent = fmtOhms(r * (1 - t / 100)) + '  to  ' + fmtOhms(r * (1 + t / 100));
  }
  ['resBands', 'resB1', 'resB2', 'resB3', 'resMult', 'resTol'].forEach(function (id) {
    g(id).addEventListener('change', calc); g(id).addEventListener('input', calc);
  });
  calc();
})();

// ---- Voltage Drop Calculator ----
(function () {
  if (!document.getElementById('vdAwg')) return;
  var g = function (id) { return document.getElementById(id); };
  // NEC Chapter 9, Table 8 — DC resistance at 75 °C, ohms per 1000 ft, stranded.
  var R = {
    '14': [3.14, 5.17], '12': [1.98, 3.25], '10': [1.24, 2.04], '8': [0.778, 1.28],
    '6': [0.491, 0.808], '4': [0.308, 0.508], '3': [0.245, 0.403], '2': [0.194, 0.319],
    '1': [0.154, 0.253], '1/0': [0.122, 0.201], '2/0': [0.0967, 0.159],
    '3/0': [0.0766, 0.126], '4/0': [0.0608, 0.100]
  };
  function calc() {
    var awg = g('vdAwg').value;
    var mat = g('vdMaterial').value === 'al' ? 1 : 0;
    var amps = parseFloat(g('vdAmps').value) || 0;
    var len = parseFloat(g('vdLength').value) || 0;
    // The NEC table is per 1000 ft, so a metric run is converted before use.
    var feet = g('vdLenUnit').value === 'm' ? len * 3.280839895 : len;
    var volts = parseFloat(g('vdVolts').value) || 0;
    var phase = g('vdPhase').value;

    var ohmsPerK = R[awg][mat];
    var factor = phase === '3' ? Math.sqrt(3) : 2;   // 2 for one-way-and-back, √3 for three-phase
    var drop = factor * amps * ohmsPerK * (feet / 1000);
    var pct = volts > 0 ? drop / volts * 100 : NaN;

    g('vdDrop').textContent = (Math.round(drop * 1000) / 1000) + ' V';
    g('vdPct').textContent = isFinite(pct) ? (Math.round(pct * 100) / 100) + '%' : '—';
    g('vdEnd').textContent = (Math.round((volts - drop) * 100) / 100) + ' V';
    g('vdOhms').textContent = ohmsPerK + ' Ω per 1000 ft  ·  run of ' + (Math.round(feet * 10) / 10) + ' ft';

    var verdict = g('vdVerdict');
    if (!isFinite(pct)) { verdict.textContent = ''; return; }
    if (pct <= 3) verdict.textContent = 'Within the 3% the NEC recommends for a branch circuit.';
    else if (pct <= 5) verdict.textContent = 'Over the 3% branch-circuit recommendation but within the 5% total limit. Consider a heavier conductor.';
    else verdict.textContent = 'Over 5%. This exceeds what the NEC recommends for feeder and branch circuit combined — go up in conductor size or shorten the run.';
  }
  ['vdAwg', 'vdMaterial', 'vdAmps', 'vdLength', 'vdLenUnit', 'vdVolts', 'vdPhase'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Electricity Cost Calculator ----
(function () {
  if (!document.getElementById('elecWatts')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var w = parseFloat(g('elecWatts').value) || 0;
    var hrs = parseFloat(g('elecHours').value) || 0;
    var rate = parseFloat(g('elecRate').value) || 0;
    var sym = g('elecCur').value;
    var kwhDay = w * hrs / 1000;
    var money = function (n) { return sym + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }); };
    g('elecKwhDay').textContent = (Math.round(kwhDay * 1000) / 1000) + ' kWh';
    g('elecKwhYear').textContent = (Math.round(kwhDay * 365 * 10) / 10).toLocaleString('en-US') + ' kWh';
    g('elecDay').textContent = money(kwhDay * rate);
    g('elecMonth').textContent = money(kwhDay * rate * 30.44);
    g('elecYear').textContent = money(kwhDay * rate * 365);
  }
  ['elecWatts', 'elecHours', 'elecRate', 'elecCur'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- IP Subnet Calculator ----
(function () {
  if (!document.getElementById('subIp')) return;
  var g = function (id) { return document.getElementById(id); };
  function toInt(o) { return ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3]; }
  function toStr(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
  function calc() {
    var raw = (g('subIp').value || '').trim();
    var cidr = parseInt(g('subCidr').value, 10);
    var m = raw.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    var out = ['subMask', 'subNetwork', 'subBroadcast', 'subFirst', 'subLast', 'subHosts', 'subWildcard', 'subClass'];
    if (!m || !isFinite(cidr) || cidr < 0 || cidr > 32) {
      out.forEach(function (id) { g(id).textContent = '—'; });
      g('subNote').textContent = raw ? 'Enter a valid IPv4 address such as 192.168.1.10, and a prefix from 0 to 32.' : '';
      return;
    }
    var oct = m.slice(1).map(Number);
    if (oct.some(function (o) { return o > 255; })) {
      out.forEach(function (id) { g(id).textContent = '—'; });
      g('subNote').textContent = 'Each octet must be 0 to 255.';
      return;
    }
    var ip = toInt(oct);
    var mask = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
    var net = (ip & mask) >>> 0;
    var bcast = (net | (~mask >>> 0)) >>> 0;
    var total = Math.pow(2, 32 - cidr);
    var usable = cidr >= 31 ? (cidr === 32 ? 1 : 2) : total - 2;

    g('subMask').textContent = toStr(mask);
    g('subWildcard').textContent = toStr(~mask >>> 0);
    g('subNetwork').textContent = toStr(net) + '/' + cidr;
    g('subBroadcast').textContent = cidr >= 31 ? 'n/a at this prefix' : toStr(bcast);
    g('subFirst').textContent = cidr >= 31 ? toStr(net) : toStr(net + 1);
    g('subLast').textContent = cidr >= 31 ? toStr(bcast) : toStr(bcast - 1);
    g('subHosts').textContent = usable.toLocaleString('en-US') + ' usable  (' + total.toLocaleString('en-US') + ' total)';

    var first = oct[0];
    var cls = first < 128 ? 'A' : first < 192 ? 'B' : first < 224 ? 'C' : first < 240 ? 'D (multicast)' : 'E (reserved)';
    var priv = (first === 10) || (first === 172 && oct[1] >= 16 && oct[1] <= 31) || (first === 192 && oct[1] === 168);
    g('subClass').textContent = 'Class ' + cls + (priv ? ' · private (RFC 1918)' : ' · public');
    g('subNote').textContent = cidr === 31 ? 'A /31 is a point-to-point link (RFC 3021) — both addresses are usable and there is no broadcast.'
      : cidr === 32 ? 'A /32 is a single host route.' : '';
  }
  ['subIp', 'subCidr'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Bandwidth / Transfer Time Calculator ----
(function () {
  if (!document.getElementById('bwSize')) return;
  var g = function (id) { return document.getElementById(id); };
  var SIZE = { KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824 };
  var SPEED = { Kbps: 1e3, Mbps: 1e6, Gbps: 1e9, 'KB/s': 8e3, 'MB/s': 8e6 };
  function calc() {
    var size = parseFloat(g('bwSize').value) || 0;
    var bytes = size * SIZE[g('bwSizeUnit').value];
    var bits = bytes * 8;
    var bps = (parseFloat(g('bwSpeed').value) || 0) * SPEED[g('bwSpeedUnit').value];
    if (bps <= 0 || bits <= 0) {
      ['bwTime', 'bwBits', 'bwEffective', 'bwMonthly'].forEach(function (id) { g(id).textContent = '—'; });
      return;
    }
    var secs = bits / bps;
    var d = Math.floor(secs / 86400), h = Math.floor(secs % 86400 / 3600),
        mn = Math.floor(secs % 3600 / 60), s = Math.round(secs % 60);
    var parts = [];
    if (d) parts.push(d + 'd'); if (h) parts.push(h + 'h'); if (mn) parts.push(mn + 'm');
    if (s || !parts.length) parts.push(s + 's');
    g('bwTime').textContent = parts.join(' ');
    g('bwBits').textContent = bits.toLocaleString('en-US') + ' bits  (' + bytes.toLocaleString('en-US') + ' bytes)';
    // Real-world throughput is typically well under the advertised line rate.
    var eff = secs / 0.8;
    var d2 = Math.floor(eff / 86400), h2 = Math.floor(eff % 86400 / 3600), m2 = Math.floor(eff % 3600 / 60), s2 = Math.round(eff % 60);
    var p2 = []; if (d2) p2.push(d2 + 'd'); if (h2) p2.push(h2 + 'h'); if (m2) p2.push(m2 + 'm'); if (s2 || !p2.length) p2.push(s2 + 's');
    g('bwEffective').textContent = p2.join(' ');
    g('bwMonthly').textContent = (bytes * 30 / 1e9).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' GB if repeated daily';
  }
  ['bwSize', 'bwSizeUnit', 'bwSpeed', 'bwSpeedUnit'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Base64 Converter ----
(function () {
  if (!document.getElementById('b64Input')) return;
  var g = function (id) { return document.getElementById(id); };
  function encode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function decode(b64) {
    var bin = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function calc() {
    var mode = g('b64Mode').value, src = g('b64Input').value;
    var out = g('b64Output'), note = g('b64Note');
    if (!src) { out.textContent = '—'; g('b64Len').textContent = '—'; note.textContent = ''; return; }
    try {
      var r = mode === 'encode' ? encode(src) : decode(src);
      out.textContent = r;
      g('b64Len').textContent = src.length + ' chars in, ' + r.length + ' out';
      note.textContent = mode === 'encode'
        ? 'Base64 grows the data by about a third — three bytes become four characters. It is an encoding, not encryption: anyone can reverse it.'
        : '';
    } catch (e) {
      out.textContent = '—'; g('b64Len').textContent = '—';
      note.textContent = 'That is not valid Base64. Check for stray characters — valid input uses A–Z, a–z, 0–9, + and /, padded with =.';
    }
  }
  ['b64Input', 'b64Mode'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- URL Encoder / Decoder ----
(function () {
  if (!document.getElementById('urlInput')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var mode = g('urlMode').value, src = g('urlInput').value;
    var out = g('urlOutput'), note = g('urlNote');
    if (!src) { out.textContent = '—'; note.textContent = ''; return; }
    try {
      if (mode === 'component') out.textContent = encodeURIComponent(src);
      else if (mode === 'full') out.textContent = encodeURI(src);
      else out.textContent = decodeURIComponent(src.replace(/\+/g, ' '));
      note.textContent = mode === 'component'
        ? 'Component encoding escapes / ? : @ & = + $ # too — use it for a value going inside a query string.'
        : mode === 'full'
          ? 'Full-URL encoding leaves / ? : @ & = intact so the address still works — use it on a whole URL.'
          : 'A + is decoded as a space, which is how form submissions encode them.';
    } catch (e) {
      out.textContent = '—';
      note.textContent = 'Could not decode — check for a stray % that is not followed by two hex digits.';
    }
  }
  ['urlInput', 'urlMode'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Roman Numeral Converter ----
(function () {
  if (!document.getElementById('romInput')) return;
  var g = function (id) { return document.getElementById(id); };
  var MAP = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
             [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  var VAL = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  function toRoman(n) {
    var out = '';
    MAP.forEach(function (p) { while (n >= p[0]) { out += p[1]; n -= p[0]; } });
    return out;
  }
  // [value, symbol] pairs in the order they are written, so IV stays one group.
  function groups(n) {
    var out = [];
    MAP.forEach(function (p) { while (n >= p[0]) { out.push(p); n -= p[0]; } });
    return out;
  }
  function fromRoman(s) {
    var total = 0;
    for (var i = 0; i < s.length; i++) {
      var v = VAL[s[i]], next = VAL[s[i + 1]];
      if (v === undefined) return NaN;
      total += (next && next > v) ? -v : v;
    }
    return total;
  }
  function calc() {
    var src = (g('romInput').value || '').trim().toUpperCase();
    var out = g('romOutput'), note = g('romNote'), br = g('romBreakdown');
    if (!src) { out.textContent = '—'; br.textContent = '—'; note.textContent = ''; return; }
    if (/^\d+$/.test(src)) {
      var n = parseInt(src, 10);
      if (n < 1 || n > 3999) {
        out.textContent = '—'; br.textContent = '—';
        note.textContent = 'Standard Roman numerals run from 1 to 3999. There is no symbol for zero, and none above M without an overbar.';
        return;
      }
      var r = toRoman(n);
      out.textContent = r;
      // Break into standard groups, so a subtractive pair reads as one unit
      // rather than being split into two letters that mean something else.
      br.textContent = groups(n).map(function (p) { return p[1] + ' (' + p[0] + ')'; }).join(' + ');
      note.textContent = '';
    } else if (/^[IVXLCDM]+$/.test(src)) {
      var v = fromRoman(src);
      var round = toRoman(v);
      out.textContent = isFinite(v) ? v.toLocaleString('en-US') : '—';
      br.textContent = (round === src ? '' : 'Non-standard — usually written ' + round + '. ')
        + groups(v).map(function (p) { return p[1] + ' (' + p[0] + ')'; }).join(' + ');
      note.textContent = '';
    } else {
      out.textContent = '—'; br.textContent = '—';
      note.textContent = 'Enter either a number from 1 to 3999, or a Roman numeral using only I, V, X, L, C, D and M.';
    }
  }
  g('romInput').addEventListener('input', calc);
  calc();
})();

// ================= Measurement & science cluster =================

// Standard atomic weights (IUPAC conventional values), shared by the
// molecular-weight and molarity tools.
var sciAtomicWeights = {
  H: 1.0080, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007,
  O: 15.999, F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982,
  Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.95, K: 39.098, Ca: 40.078,
  Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845,
  Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.630,
  As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62,
  Y: 88.906, Zr: 91.224, Nb: 92.906, Mo: 95.95, Tc: 97, Ru: 101.07, Rh: 102.91,
  Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71, Sb: 121.76,
  Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91,
  Ce: 140.12, Pr: 140.91, Nd: 144.24, Pm: 145, Sm: 150.36, Eu: 151.96,
  Gd: 157.25, Tb: 158.93, Dy: 162.50, Ho: 164.93, Er: 167.26, Tm: 168.93,
  Yb: 173.05, Lu: 174.97, Hf: 178.49, Ta: 180.95, W: 183.84, Re: 186.21,
  Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97, Hg: 200.59, Tl: 204.38,
  Pb: 207.2, Bi: 208.98, Po: 209, At: 210, Rn: 222, Fr: 223, Ra: 226,
  Ac: 227, Th: 232.04, Pa: 231.04, U: 238.03
};

// Parses a chemical formula into {symbol: count}. Handles nested brackets and
// hydrate notation (CuSO4·5H2O). Throws with a readable message on bad input.
function sciParseFormula(raw) {
  var parts = String(raw).replace(/\s+/g, '').split(/[·*.]/).filter(function (p) { return p.length; });
  if (!parts.length) throw new Error('Enter a formula.');
  var total = {};
  parts.forEach(function (part) {
    var lead = part.match(/^(\d+)/);
    var mult = lead ? parseInt(lead[1], 10) : 1;
    if (lead) part = part.slice(lead[1].length);
    var f = part, i = 0;
    function num() {
      var s = '';
      while (i < f.length && f[i] >= '0' && f[i] <= '9') { s += f[i]; i++; }
      return s ? parseInt(s, 10) : 1;
    }
    function group() {
      var c = {};
      while (i < f.length) {
        var ch = f[i];
        if (ch === '(' || ch === '[') {
          i++;
          var inner = group();
          if (f[i] === ')' || f[i] === ']') i++; else throw new Error('Unmatched bracket in "' + part + '".');
          var n = num();
          for (var k in inner) c[k] = (c[k] || 0) + inner[k] * n;
        } else if (ch === ')' || ch === ']') {
          return c;
        } else if (ch >= 'A' && ch <= 'Z') {
          var sym = ch; i++;
          while (i < f.length && f[i] >= 'a' && f[i] <= 'z') { sym += f[i]; i++; }
          if (!sciAtomicWeights[sym]) throw new Error('Unknown element "' + sym + '".');
          c[sym] = (c[sym] || 0) + num();
        } else {
          throw new Error('Unexpected character "' + ch + '".');
        }
      }
      return c;
    }
    var counts = group();
    if (i < f.length) throw new Error('Unmatched bracket in "' + part + '".');
    for (var k2 in counts) total[k2] = (total[k2] || 0) + counts[k2] * mult;
  });
  if (!Object.keys(total).length) throw new Error('Enter a formula.');
  return total;
}

// ---- Molecular Weight Calculator ----
(function () {
  if (!document.getElementById('mwFormula')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var raw = g('mwFormula').value.trim();
    var out = g('mwResult'), note = g('mwNote'), tbody = g('mwBreakdown');
    if (!raw) { out.textContent = '—'; tbody.innerHTML = ''; note.textContent = ''; g('mwAtoms').textContent = '—'; return; }
    try {
      var counts = sciParseFormula(raw);
      var total = 0, atoms = 0;
      var rows = Object.keys(counts).map(function (sym) {
        var w = sciAtomicWeights[sym], n = counts[sym], sub = w * n;
        total += sub; atoms += n;
        return { sym: sym, n: n, w: w, sub: sub };
      });
      rows.sort(function (a, b) { return b.sub - a.sub; });
      out.textContent = (Math.round(total * 10000) / 10000).toLocaleString('en-US') + ' g/mol';
      g('mwAtoms').textContent = atoms + ' atoms across ' + rows.length + ' element' + (rows.length === 1 ? '' : 's');
      tbody.innerHTML = rows.map(function (r) {
        return '<tr><td>' + r.sym + '</td><td>' + r.n + '</td><td>' + r.w + '</td><td>' +
          (Math.round(r.sub * 1000) / 1000) + '</td><td>' + (Math.round(r.sub / total * 1000) / 10) + '%</td></tr>';
      }).join('');
      note.textContent = '';
    } catch (e) {
      out.textContent = '—'; g('mwAtoms').textContent = '—'; tbody.innerHTML = '';
      note.textContent = e.message + ' Element symbols are case-sensitive: Co is cobalt, CO is carbon monoxide.';
    }
  }
  g('mwFormula').addEventListener('input', calc);
  calc();
})();

// ---- Molarity Calculator ----
(function () {
  if (!document.getElementById('molSolve')) return;
  var g = function (id) { return document.getElementById(id); };
  var VOL = { L: 1, mL: 0.001, uL: 1e-6, gal: 3.785411784 };
  function calc() {
    var solve = g('molSolve').value;
    var mm = parseFloat(g('molMass').value) || 0;
    var vol = (parseFloat(g('molVolume').value) || 0) * VOL[g('molVolUnit').value];
    var grams = parseFloat(g('molGrams').value) || 0;
    var molar = parseFloat(g('molMolarity').value) || 0;

    g('molGrams').closest('.field').style.display = solve === 'mass' ? 'none' : '';
    g('molMolarity').closest('.field').style.display = solve === 'molarity' ? 'none' : '';

    var note = g('molNote');
    if (mm <= 0 || vol <= 0) {
      ['molOutMolarity', 'molOutMoles', 'molOutMass', 'molOutVol'].forEach(function (i) { g(i).textContent = '—'; });
      note.textContent = 'Enter a molar mass and a volume greater than zero.';
      return;
    }
    var moles, mass, M;
    if (solve === 'molarity') { moles = grams / mm; M = moles / vol; mass = grams; }
    else { M = molar; moles = M * vol; mass = moles * mm; }

    g('molOutMolarity').textContent = (Math.round(M * 1e6) / 1e6).toLocaleString('en-US') + ' mol/L';
    g('molOutMoles').textContent = (Math.round(moles * 1e6) / 1e6).toLocaleString('en-US') + ' mol';
    g('molOutMass').textContent = (Math.round(mass * 1e4) / 1e4).toLocaleString('en-US') + ' g';
    g('molOutVol').textContent = (Math.round(vol * 1e6) / 1e6).toLocaleString('en-US') + ' L';
    note.textContent = solve === 'molarity'
      ? 'Molarity = moles of solute ÷ litres of solution. Moles = mass ÷ molar mass.'
      : 'Dissolve this mass in enough solvent to reach the stated final volume — not by adding that volume of solvent.';
  }
  ['molSolve', 'molMass', 'molVolume', 'molVolUnit', 'molGrams', 'molMolarity'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Density Calculator ----
(function () {
  if (!document.getElementById('denSolve')) return;
  var g = function (id) { return document.getElementById(id); };
  var MASS = { g: 1, kg: 1000, mg: 0.001, lb: 453.59237, oz: 28.349523125 };
  var VOLU = { cm3: 1, m3: 1e6, L: 1000, mL: 1, in3: 16.387064, ft3: 28316.846592, gal: 3785.411784 };
  function calc() {
    var solve = g('denSolve').value;
    var m = (parseFloat(g('denMass').value) || 0) * MASS[g('denMassUnit').value];      // grams
    var v = (parseFloat(g('denVolume').value) || 0) * VOLU[g('denVolUnit').value];     // cm3
    var d = parseFloat(g('denDensity').value) || 0;                                    // g/cm3

    g('denMass').closest('.field').style.display = solve === 'mass' ? 'none' : '';
    g('denVolume').closest('.field').style.display = solve === 'volume' ? 'none' : '';
    g('denDensity').closest('.field').style.display = solve === 'density' ? 'none' : '';

    if (solve === 'density') { if (v <= 0) { d = NaN; } else d = m / v; }
    else if (solve === 'mass') { m = d * v; }
    else { v = d > 0 ? m / d : NaN; }

    var f = function (n, u) { return isFinite(n) ? (Math.round(n * 1e6) / 1e6).toLocaleString('en-US') + ' ' + u : '—'; };
    g('denOutDensity').textContent = f(d, 'g/cm³');
    g('denOutDensityAlt').textContent = f(d * 1000, 'kg/m³') + '  ·  ' + f(d * 62.427960576, 'lb/ft³');
    g('denOutMass').textContent = f(m, 'g') + '  (' + f(m / 1000, 'kg') + ')';
    g('denOutVolume').textContent = f(v, 'cm³') + '  (' + f(v / 1000, 'L') + ')';
    var fl = g('denFloat');
    if (!isFinite(d) || d <= 0) fl.textContent = '';
    else fl.textContent = d < 1 ? 'Less dense than water (1 g/cm³) — this floats in fresh water.'
      : d > 1 ? 'Denser than water (1 g/cm³) — this sinks in fresh water.'
        : 'Exactly the density of water — it would sit neutrally buoyant.';
  }
  ['denSolve', 'denMass', 'denMassUnit', 'denVolume', 'denVolUnit', 'denDensity'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Speed / Distance / Time Calculator ----
(function () {
  if (!document.getElementById('spdSolve')) return;
  var g = function (id) { return document.getElementById(id); };
  var DIST = { km: 1000, mi: 1609.344, m: 1, ft: 0.3048, yd: 0.9144, nmi: 1852 };
  function calc() {
    var solve = g('spdSolve').value;
    var dist = (parseFloat(g('spdDistance').value) || 0) * DIST[g('spdDistUnit').value];  // metres
    var h = parseFloat(g('spdHours').value) || 0;
    var mn = parseFloat(g('spdMinutes').value) || 0;
    var s = parseFloat(g('spdSeconds').value) || 0;
    var secs = h * 3600 + mn * 60 + s;
    var spd = parseFloat(g('spdSpeed').value) || 0;                                      // in chosen unit
    var spdUnit = g('spdSpeedUnit').value;
    var toMs = { kmh: 1 / 3.6, mph: 0.44704, ms: 1, fts: 0.3048, kn: 0.514444444 };

    g('spdDistance').closest('.field').style.display = solve === 'distance' ? 'none' : '';
    g('spdTimeRow').style.display = solve === 'time' ? 'none' : '';
    g('spdSpeed').closest('.field').style.display = solve === 'speed' ? 'none' : '';

    var ms;
    if (solve === 'speed') { ms = secs > 0 ? dist / secs : NaN; }
    else if (solve === 'distance') { ms = spd * toMs[spdUnit]; dist = ms * secs; }
    else { ms = spd * toMs[spdUnit]; secs = ms > 0 ? dist / ms : NaN; }

    var f = function (n, u, dp) { return isFinite(n) ? (Math.round(n * Math.pow(10, dp || 3)) / Math.pow(10, dp || 3)).toLocaleString('en-US') + ' ' + u : '—'; };
    g('spdOutSpeed').textContent = f(ms * 3.6, 'km/h') + '  ·  ' + f(ms / 0.44704, 'mph');
    g('spdOutSpeedAlt').textContent = f(ms, 'm/s') + '  ·  ' + f(ms / 0.514444444, 'knots');
    g('spdOutDistance').textContent = f(dist / 1000, 'km') + '  ·  ' + f(dist / 1609.344, 'miles');
    if (isFinite(secs) && secs >= 0) {
      var hh = Math.floor(secs / 3600), mm2 = Math.floor(secs % 3600 / 60), rem = secs % 60;
      // Keep hundredths on short times — a sprint split rounded to whole seconds is useless.
      var ss = secs < 60 ? Math.round(rem * 100) / 100 : Math.round(rem);
      g('spdOutTime').textContent = (hh ? hh + 'h ' : '') + (mm2 || hh ? mm2 + 'm ' : '') + ss + 's';
    } else g('spdOutTime').textContent = '—';
    // Pace is how runners and cyclists actually think about speed.
    if (isFinite(ms) && ms > 0) {
      var perKm = 1000 / ms, perMi = 1609.344 / ms;
      var pace = function (t) { return Math.floor(t / 60) + ':' + String(Math.round(t % 60)).padStart(2, '0'); };
      g('spdOutPace').textContent = pace(perKm) + ' /km  ·  ' + pace(perMi) + ' /mile';
    } else g('spdOutPace').textContent = '—';
  }
  ['spdSolve', 'spdDistance', 'spdDistUnit', 'spdHours', 'spdMinutes', 'spdSeconds', 'spdSpeed', 'spdSpeedUnit'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Weight on Other Planets ----
(function () {
  if (!document.getElementById('wopWeight')) return;
  var g = function (id) { return document.getElementById(id); };
  // Surface gravity, m/s² — NASA NSSDCA Planetary Fact Sheet. Gas giants are
  // quoted at the 1 bar level; all values include the effect of rotation.
  var BODIES = [
    ['Mercury', 3.7], ['Venus', 8.9], ['Earth', 9.8], ['The Moon', 1.6],
    ['Mars', 3.7], ['Jupiter', 23.1], ['Saturn', 9.0], ['Uranus', 8.7],
    ['Neptune', 11.0], ['Pluto', 0.6]
  ];
  var EARTH = 9.8;
  function calc() {
    var w = parseFloat(g('wopWeight').value) || 0;
    var unit = g('wopUnit').value;
    g('wopBody').innerHTML = BODIES.map(function (b) {
      var val = w * b[1] / EARTH;
      var rel = b[1] / EARTH;
      return '<tr><td>' + b[0] + '</td><td>' + b[1] + '</td><td>' +
        (Math.round(rel * 1000) / 1000) + '×</td><td><strong>' +
        (Math.round(val * 100) / 100).toLocaleString('en-US') + ' ' + unit + '</strong></td></tr>';
    }).join('');
    g('wopNote').textContent = w > 0
      ? 'Your mass never changes — only the force gravity exerts on it does. On Pluto you would weigh about ' +
        (Math.round(w * 0.6 / EARTH * 100) / 100) + ' ' + unit + ', but you would still be just as hard to push sideways.'
      : '';
  }
  ['wopWeight', 'wopUnit'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Child Height Predictor ----
(function () {
  if (!document.getElementById('chSex')) return;
  var g = function (id) { return document.getElementById(id); };
  function readHeight(prefix) {
    if (g('chUnit').value === 'cm') return parseFloat(g(prefix + 'Cm').value) || 0;
    var ft = parseFloat(g(prefix + 'Ft').value) || 0, inch = parseFloat(g(prefix + 'In').value) || 0;
    return (ft * 12 + inch) * 2.54;
  }
  function fmt(cm) {
    if (!isFinite(cm) || cm <= 0) return '—';
    var totalIn = cm / 2.54;
    var ft = Math.floor(totalIn / 12), inch = totalIn - ft * 12;
    return (Math.round(cm * 10) / 10) + ' cm  (' + ft + '′ ' + (Math.round(inch * 10) / 10) + '″)';
  }
  function calc() {
    var metric = g('chUnit').value === 'cm';
    g('chCmRow').style.display = metric ? '' : 'none';
    g('chFtRow').style.display = metric ? 'none' : '';
    var dad = readHeight('chDad'), mum = readHeight('chMum');
    if (dad <= 0 || mum <= 0) {
      ['chTarget', 'chRange', 'chMid'].forEach(function (i) { g(i).textContent = '—'; });
      g('chNote').textContent = 'Enter both parents’ adult heights.';
      return;
    }
    var mid = (dad + mum) / 2;
    var target = g('chSex').value === 'boy' ? mid + 6.5 : mid - 6.5;
    g('chMid').textContent = fmt(mid);
    g('chTarget').textContent = fmt(target);
    g('chRange').textContent = fmt(target - 8.5) + '   to   ' + fmt(target + 8.5);
    g('chNote').textContent = 'The ±8.5 cm band spans roughly the 3rd to 97th percentile of outcomes — it is wide on purpose.';
  }
  ['chSex', 'chUnit', 'chDadCm', 'chMumCm', 'chDadFt', 'chDadIn', 'chMumFt', 'chMumIn'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ================= Health cluster 2 =================

// ---- eGFR Calculator (CKD-EPI 2021, race-free) ----
(function () {
  if (!document.getElementById('gfrCreat')) return;
  var g = function (id) { return document.getElementById(id); };
  // CKD-EPI 2021 creatinine equation — NIDDK / NKF-ASN Task Force.
  // eGFR = 142 × min(Scr/κ,1)^α × max(Scr/κ,1)^-1.200 × 0.9938^age × 1.012 [if female]
  var STAGES = [
    [90, 'G1', 'Normal or high'],
    [60, 'G2', 'Mildly decreased'],
    [45, 'G3a', 'Mildly to moderately decreased'],
    [30, 'G3b', 'Moderately to severely decreased'],
    [15, 'G4', 'Severely decreased'],
    [0, 'G5', 'Kidney failure']
  ];
  function calc() {
    var scr = parseFloat(g('gfrCreat').value) || 0;
    if (g('gfrUnit').value === 'umol') scr = scr / 88.4;   // µmol/L → mg/dL
    var age = parseFloat(g('gfrAge').value) || 0;
    var female = g('gfrSex').value === 'female';

    if (scr <= 0 || age < 18) {
      ['gfrResult', 'gfrStage', 'gfrMeaning'].forEach(function (i) { g(i).textContent = '—'; });
      g('gfrNote').textContent = age && age < 18
        ? 'This equation is validated for adults aged 18 and over. Children need a paediatric equation such as the CKiD U25 or Schwartz formula.'
        : 'Enter a serum creatinine result and an age of 18 or over.';
      return;
    }
    var k = female ? 0.7 : 0.9;
    var a = female ? -0.241 : -0.302;
    var egfr = 142 * Math.pow(Math.min(scr / k, 1), a) * Math.pow(Math.max(scr / k, 1), -1.200) *
      Math.pow(0.9938, age) * (female ? 1.012 : 1);

    var val = Math.round(egfr);
    g('gfrResult').textContent = val + ' mL/min/1.73m²';
    var st = STAGES.find(function (s) { return egfr >= s[0]; });
    g('gfrStage').textContent = st[1];
    g('gfrMeaning').textContent = st[2];
    g('gfrNote').textContent = egfr >= 60
      ? 'A single eGFR at or above 60 does not by itself rule out kidney disease — albuminuria can be present with a normal eGFR, which is why urine testing is done alongside.'
      : 'A result below 60 needs to persist for at least three months before chronic kidney disease is diagnosed. One low reading is not a diagnosis.';
  }
  ['gfrCreat', 'gfrUnit', 'gfrAge', 'gfrSex'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Body Surface Area Calculator ----
(function () {
  if (!document.getElementById('bsaHeight')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var metric = g('bsaUnit').value === 'metric';
    g('bsaMetricRow').style.display = metric ? '' : 'none';
    g('bsaImperialRow').style.display = metric ? 'none' : '';

    var cm, kg;
    if (metric) {
      cm = parseFloat(g('bsaHeight').value) || 0;
      kg = parseFloat(g('bsaWeight').value) || 0;
    } else {
      var ft = parseFloat(g('bsaFt').value) || 0, inch = parseFloat(g('bsaIn').value) || 0;
      cm = (ft * 12 + inch) * 2.54;
      kg = (parseFloat(g('bsaLb').value) || 0) * 0.45359237;
    }
    if (cm <= 0 || kg <= 0) {
      ['bsaMosteller', 'bsaDuBois', 'bsaHaycock', 'bsaGehan', 'bsaAverage'].forEach(function (i) { g(i).textContent = '—'; });
      g('bsaNote').textContent = 'Enter a height and a weight.';
      return;
    }
    var mos = Math.sqrt(cm * kg / 3600);
    var du = 0.007184 * Math.pow(kg, 0.425) * Math.pow(cm, 0.725);
    var hay = 0.024265 * Math.pow(cm, 0.3964) * Math.pow(kg, 0.5378);
    var geh = 0.0235 * Math.pow(cm, 0.42246) * Math.pow(kg, 0.51456);
    var avg = (mos + du + hay + geh) / 4;
    var f = function (v) { return (Math.round(v * 1000) / 1000) + ' m²'; };
    g('bsaMosteller').textContent = f(mos);
    g('bsaDuBois').textContent = f(du);
    g('bsaHaycock').textContent = f(hay);
    g('bsaGehan').textContent = f(geh);
    g('bsaAverage').textContent = f(avg);
    var spread = Math.max(mos, du, hay, geh) - Math.min(mos, du, hay, geh);
    g('bsaNote').textContent = 'Spread across the four formulas: ' + (Math.round(spread * 1000) / 1000) +
      ' m² (' + (Math.round(spread / avg * 1000) / 10) + '%). Mosteller is the one most commonly used for drug dosing.';
  }
  ['bsaUnit', 'bsaHeight', 'bsaWeight', 'bsaFt', 'bsaIn', 'bsaLb'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Blood Alcohol Concentration (Widmark) ----
(function () {
  if (!document.getElementById('bacWeight')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var w = parseFloat(g('bacWeight').value) || 0;
    if (g('bacWeightUnit').value === 'lb') w = w * 0.45359237;   // → kg
    var r = g('bacSex').value === 'female' ? 0.55 : 0.68;        // Widmark distribution ratio
    var drinks = parseFloat(g('bacDrinks').value) || 0;
    var gramsPerDrink = parseFloat(g('bacStandard').value) || 14;
    var hours = parseFloat(g('bacHours').value) || 0;

    if (w <= 0) {
      ['bacResult', 'bacPeak', 'bacSober', 'bacEffect'].forEach(function (i) { g(i).textContent = '—'; });
      return;
    }
    var alcoholG = drinks * gramsPerDrink;
    // Widmark: BAC% = grams alcohol / (body mass in grams × r) × 100, less elimination.
    var peak = alcoholG / (w * 1000 * r) * 100;
    var bac = Math.max(0, peak - 0.015 * hours);
    var toZero = peak / 0.015;                                   // hours from first drink

    g('bacPeak').textContent = peak.toFixed(3) + '%';
    g('bacResult').textContent = bac.toFixed(3) + '%';
    var remaining = Math.max(0, toZero - hours);
    var hh = Math.floor(remaining), mm = Math.round((remaining - hh) * 60);
    g('bacSober').textContent = bac <= 0 ? 'Already below measurable' : hh + 'h ' + mm + 'm from now';

    var eff;
    if (bac === 0) eff = 'No measurable alcohol remaining on this estimate.';
    else if (bac < 0.02) eff = 'Little measurable effect for most people.';
    else if (bac < 0.05) eff = 'Relaxation, mild euphoria. Judgement and reaction time already measurably affected. Over the legal driving limit in much of Europe, India, Australia and Japan.';
    else if (bac < 0.08) eff = 'Impaired coordination and judgement. Over the driving limit almost everywhere in the world.';
    else if (bac < 0.12) eff = 'Over the legal limit in every jurisdiction. Balance, vision and reaction time are clearly affected.';
    else if (bac < 0.20) eff = 'Poor muscle control, slurred speech and impaired judgement. Nausea is common at the upper end.';
    else if (bac < 0.30) eff = 'Severe impairment. Vomiting, confusion and blackouts are common at this level.';
    else eff = 'Potentially life-threatening. Risk of unconsciousness, respiratory depression and alcohol poisoning — this is a medical emergency.';
    g('bacEffect').textContent = eff;
  }
  ['bacWeight', 'bacWeightUnit', 'bacSex', 'bacDrinks', 'bacStandard', 'bacHours'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Fat Intake Calculator ----
(function () {
  if (!document.getElementById('fatCalories')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var cals = parseFloat(g('fatCalories').value) || 0;
    var pct = parseFloat(g('fatPercent').value) || 0;
    g('fatPercentLabel').textContent = pct + '%';
    if (cals <= 0) {
      ['fatGrams', 'fatRange', 'fatSat', 'fatUnsat', 'fatCalsFrom'].forEach(function (i) { g(i).textContent = '—'; });
      return;
    }
    // Fat provides 9 kcal per gram. AMDR for adults is 20–35% of energy.
    var grams = cals * (pct / 100) / 9;
    g('fatGrams').textContent = Math.round(grams) + ' g per day';
    g('fatCalsFrom').textContent = Math.round(cals * pct / 100) + ' kcal from fat';
    g('fatRange').textContent = Math.round(cals * 0.20 / 9) + ' g  to  ' + Math.round(cals * 0.35 / 9) + ' g';
    g('fatSat').textContent = 'under ' + Math.round(cals * 0.10 / 9) + ' g  (AHA target: under ' + Math.round(cals * 0.06 / 9) + ' g)';
    g('fatUnsat').textContent = 'about ' + Math.round(grams - cals * 0.10 / 9) + ' g should be unsaturated';
    var note = g('fatNote');
    note.textContent = pct < 20 ? 'Below the 20% floor — very low fat intake can impair absorption of vitamins A, D, E and K, which need dietary fat to be taken up.'
      : pct > 35 ? 'Above the 35% ceiling of the accepted range. Not inherently harmful, but it leaves less room for carbohydrate and protein at the same calorie total.'
        : 'Within the 20–35% range recommended for adults.';
  }
  ['fatCalories', 'fatPercent'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Period / Cycle Calendar ----
(function () {
  if (!document.getElementById('perLast')) return;
  var g = function (id) { return document.getElementById(id); };
  var MS = 86400000;
  function fmt(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function calc() {
    var raw = g('perLast').value;
    var cycle = parseInt(g('perCycle').value, 10) || 28;
    var bleed = parseInt(g('perBleed').value, 10) || 5;
    var tbody = g('perTable');
    if (!raw) { tbody.innerHTML = ''; g('perNext').textContent = '—'; g('perNote').textContent = 'Pick the first day of your last period.'; return; }
    var start = new Date(raw + 'T00:00:00');
    if (isNaN(start.getTime())) { tbody.innerHTML = ''; g('perNext').textContent = '—'; return; }

    var rows = [], today = new Date(); today.setHours(0, 0, 0, 0);
    for (var i = 1; i <= 6; i++) {
      var s = new Date(start.getTime() + cycle * i * MS);
      var e = new Date(s.getTime() + (bleed - 1) * MS);
      // Ovulation is set by the luteal phase, which is far more consistent than
      // the follicular one — so count back from the next period, not forward.
      var ov = new Date(s.getTime() - 14 * MS);
      var pmsFrom = new Date(s.getTime() - 7 * MS);
      rows.push('<tr><td>' + i + '</td><td>' + fmt(s) + '</td><td>' + fmt(e) +
        '</td><td>' + fmt(ov) + '</td><td>' + fmt(pmsFrom) + '</td></tr>');
      if (i === 1) {
        g('perNext').textContent = fmt(s);
        var days = Math.round((s - today) / MS);
        g('perNote').textContent = days > 0 ? days + ' days away.' :
          days === 0 ? 'Expected today.' : Math.abs(days) + ' days later than expected — cycles vary, but if it is more than a week late a test is worth doing.';
      }
    }
    tbody.innerHTML = rows.join('');
  }
  ['perLast', 'perCycle', 'perBleed'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ================= Construction cluster =================

// ---- Concrete Calculator ----
(function () {
  if (!document.getElementById('concShape')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var shape = g('concShape').value;
    var imperial = g('concUnit').value === 'imperial';
    g('concSlabRow').style.display = shape === 'slab' ? '' : 'none';
    g('concFootRow').style.display = shape === 'footing' ? '' : 'none';
    g('concColRow').style.display = shape === 'column' ? '' : 'none';

    // Everything is normalised to cubic feet.
    var ft3 = 0, n = parseFloat(g('concQty').value) || 1;
    var toFt = imperial ? 1 : 3.280839895;          // metres → feet
    var inToFt = imperial ? 1 / 12 : 1 / 30.48;     // inches or cm → feet

    if (shape === 'slab') {
      var L = (parseFloat(g('concLength').value) || 0) * toFt;
      var W = (parseFloat(g('concWidth').value) || 0) * toFt;
      var T = (parseFloat(g('concThick').value) || 0) * inToFt;
      ft3 = L * W * T;
    } else if (shape === 'footing') {
      var fl = (parseFloat(g('concFootLen').value) || 0) * toFt;
      var fw = (parseFloat(g('concFootWidth').value) || 0) * inToFt;
      var fd = (parseFloat(g('concFootDepth').value) || 0) * inToFt;
      ft3 = fl * fw * fd;
    } else {
      var dia = (parseFloat(g('concDia').value) || 0) * inToFt;
      var h = (parseFloat(g('concHeight').value) || 0) * toFt;
      ft3 = Math.PI * Math.pow(dia / 2, 2) * h;
    }
    ft3 = ft3 * n;

    var yd3 = ft3 / 27, m3 = ft3 * 0.028316846592;
    var waste = parseFloat(g('concWaste').value) || 0;
    var ft3w = ft3 * (1 + waste / 100);

    var f = function (v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US', { maximumFractionDigits: d }); };
    g('concVolume').textContent = f(ft3, 2) + ' ft³  ·  ' + f(m3, 3) + ' m³';
    g('concYards').textContent = f(yd3, 2) + ' cubic yards';
    g('concWithWaste').textContent = f(ft3w, 2) + ' ft³  (' + f(ft3w / 27, 2) + ' yd³) including ' + waste + '% waste';
    // Bag yields from the manufacturer TDS, governed by ASTM C387.
    g('concBags80').textContent = Math.ceil(ft3w / 0.60) + ' bags';
    g('concBags60').textContent = Math.ceil(ft3w / 0.45) + ' bags';
    g('concBags40').textContent = Math.ceil(ft3w / 0.30) + ' bags';
    g('concWeight').textContent = f(ft3 * 150, 0) + ' lb  (' + f(ft3 * 150 * 0.45359237, 0) + ' kg)';
    g('concNote').textContent = yd3 >= 1
      ? 'At ' + f(yd3, 2) + ' cubic yards, ready-mix delivery is almost certainly cheaper and far less work than mixing bags. Most suppliers have a minimum order of around 1 yd³.'
      : 'Under a cubic yard — bagged mix is usually the practical choice at this size.';
  }
  ['concShape', 'concUnit', 'concLength', 'concWidth', 'concThick', 'concFootLen', 'concFootWidth',
    'concFootDepth', 'concDia', 'concHeight', 'concQty', 'concWaste'].forEach(function (id) {
      g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
    });
  calc();
})();

// ---- Square Footage Calculator ----
(function () {
  if (!document.getElementById('sqShape')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var shape = g('sqShape').value;
    var imperial = g('sqUnit').value === 'imperial';
    ['sqRect', 'sqCircleRow', 'sqTriRow'].forEach(function (id) { g(id).style.display = 'none'; });
    g(shape === 'circle' ? 'sqCircleRow' : shape === 'triangle' ? 'sqTriRow' : 'sqRect').style.display = '';

    var toFt = imperial ? 1 : 3.280839895;
    var area = 0;   // square feet
    if (shape === 'rectangle') {
      area = (parseFloat(g('sqLength').value) || 0) * toFt * (parseFloat(g('sqWidth').value) || 0) * toFt;
    } else if (shape === 'circle') {
      var r = (parseFloat(g('sqDiameter').value) || 0) * toFt / 2;
      area = Math.PI * r * r;
    } else {
      area = 0.5 * (parseFloat(g('sqBase').value) || 0) * toFt * (parseFloat(g('sqHeight').value) || 0) * toFt;
    }
    var n = parseFloat(g('sqQty').value) || 1;
    area = area * n;
    var m2 = area * 0.09290304;

    // toLocaleString caps fraction digits at 3 by default, which silently
    // rounds small acreages to "0" — so the precision has to be stated.
    var f = function (v, d) {
      return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d))
        .toLocaleString('en-US', { maximumFractionDigits: d });
    };
    g('sqFeet').textContent = f(area, 2) + ' sq ft';
    g('sqMetres').textContent = f(m2, 3) + ' m²';
    g('sqYards').textContent = f(area / 9, 2) + ' sq yd';
    g('sqAcres').textContent = f(area / 43560, 5) + ' acres  ·  ' + f(m2 / 10000, 5) + ' hectares';
    g('sqPerimeter').textContent = shape === 'rectangle'
      ? f(2 * ((parseFloat(g('sqLength').value) || 0) * toFt + (parseFloat(g('sqWidth').value) || 0) * toFt), 2) + ' ft (one shape)'
      : shape === 'circle' ? f(Math.PI * (parseFloat(g('sqDiameter').value) || 0) * toFt, 2) + ' ft circumference' : '—';
  }
  ['sqShape', 'sqUnit', 'sqLength', 'sqWidth', 'sqDiameter', 'sqBase', 'sqHeight', 'sqQty'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- BTU Calculator ----
(function () {
  if (!document.getElementById('btuArea')) return;
  var g = function (id) { return document.getElementById(id); };
  // Heating load rules of thumb, BTU per square foot, by climate severity.
  var ZONE = { hot: [30, 35], warm: [35, 40], mod: [40, 45], cool: [45, 50], cold: [50, 60] };
  function calc() {
    var imperial = g('btuUnit').value === 'imperial';
    var area = parseFloat(g('btuArea').value) || 0;
    var sqft = imperial ? area : area * 10.7639104;
    var ceiling = parseFloat(g('btuCeiling').value) || 8;   // feet, or metres if metric
    var ceilFt = imperial ? ceiling : ceiling * 3.280839895;
    var zone = g('btuZone').value;
    var insul = parseFloat(g('btuInsulation').value) || 1;
    var sun = parseFloat(g('btuSun').value) || 1;
    var people = parseFloat(g('btuPeople').value) || 0;

    if (sqft <= 0) { ['btuCool', 'btuHeat', 'btuTons'].forEach(function (i) { g(i).textContent = '—'; }); return; }

    // Cooling: ~20 BTU/sq ft baseline, scaled for ceiling height above the 8 ft assumption.
    var heightFactor = ceilFt / 8;
    var cool = sqft * 20 * heightFactor * insul * sun;
    cool += Math.max(0, people - 2) * 600;                  // extra occupants beyond two
    if (g('btuKitchen').checked) cool += 4000;

    var z = ZONE[zone];
    var heatLo = sqft * z[0] * heightFactor * insul;
    var heatHi = sqft * z[1] * heightFactor * insul;

    var f = function (v) { return Math.round(v / 100) * 100; };
    g('btuCool').textContent = f(cool).toLocaleString('en-US') + ' BTU/hr';
    var tons = Math.round(cool / 12000 * 100) / 100;
    g('btuTons').textContent = tons + (tons === 1 ? ' ton' : ' tons') + ' of cooling';
    g('btuHeat').textContent = f(heatLo).toLocaleString('en-US') + ' – ' + f(heatHi).toLocaleString('en-US') + ' BTU/hr';
    g('btuKw').textContent = (Math.round(cool / 3412.14 * 100) / 100) + ' kW cooling  ·  ' +
      (Math.round(heatHi / 3412.14 * 100) / 100) + ' kW heating';
    g('btuNote').textContent = 'These are sizing rules of thumb, not a load calculation. An oversized air conditioner cools fast, short-cycles, and never runs long enough to remove humidity — which is why bigger is not better here.';
  }
  ['btuUnit', 'btuArea', 'btuCeiling', 'btuZone', 'btuInsulation', 'btuSun', 'btuPeople', 'btuKitchen'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Stair Calculator ----
(function () {
  if (!document.getElementById('stairRise')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var imperial = g('stairUnit').value === 'imperial';
    var rise = parseFloat(g('stairRise').value) || 0;      // inches or cm
    var riseIn = imperial ? rise : rise / 2.54;
    var tread = parseFloat(g('stairTread').value) || 10;
    var treadIn = imperial ? tread : tread / 2.54;

    if (riseIn <= 0) {
      ['stairRisers', 'stairRiserH', 'stairTreads', 'stairRun', 'stairAngle', 'stairCode'].forEach(function (i) { g(i).textContent = '—'; });
      return;
    }
    // IRC caps riser height at 7.75 in, so that sets the minimum number of risers.
    var minRisers = Math.ceil(riseIn / 7.75);
    var risers = parseInt(g('stairRisers').value, 10);
    if (!risers || risers < minRisers) { risers = minRisers; g('stairRisers').value = risers; }
    var riserH = riseIn / risers;
    var treads = risers - 1;                                 // last riser lands on the floor above
    var run = treads * treadIn;
    var angle = Math.atan(riserH / treadIn) * 180 / Math.PI;

    var u = function (v) { return imperial ? (Math.round(v * 1000) / 1000) + ' in' : (Math.round(v * 2.54 * 10) / 10) + ' cm'; };
    g('stairRiserH').textContent = u(riserH);
    g('stairTreads').textContent = treads + ' treads';
    g('stairRun').textContent = u(run) + (imperial ? '  (' + (Math.round(run / 12 * 100) / 100) + ' ft)' : '');
    g('stairAngle').textContent = (Math.round(angle * 10) / 10) + '°';
    g('stairStringer').textContent = u(Math.sqrt(run * run + riseIn * riseIn));

    var issues = [];
    if (riserH > 7.75) issues.push('riser height exceeds the IRC maximum of 7¾ in');
    if (treadIn < 10) issues.push('tread depth is under the IRC minimum of 10 in');
    if (riserH < 4) issues.push('riser height is unusually shallow');
    // 2R + T between 24 and 25 inches is the long-standing comfort rule.
    var rule = 2 * riserH + treadIn;
    var code = g('stairCode');
    if (issues.length) code.textContent = 'Does not meet IRC residential limits: ' + issues.join('; ') + '.';
    else if (rule < 24 || rule > 25) code.textContent = 'Within IRC limits. The 2×riser + tread comfort rule gives ' +
      (Math.round(rule * 10) / 10) + ' in — outside the usual 24–25 in, so the stair will feel slightly off underfoot.';
    else code.textContent = 'Within IRC limits, and the 2×riser + tread rule gives ' + (Math.round(rule * 10) / 10) + ' in — comfortable.';
  }
  ['stairUnit', 'stairRise', 'stairTread', 'stairRisers'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Roofing Calculator ----
(function () {
  if (!document.getElementById('roofLength')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var imperial = g('roofUnit').value === 'imperial';
    var toFt = imperial ? 1 : 3.280839895;
    var L = (parseFloat(g('roofLength').value) || 0) * toFt;
    var W = (parseFloat(g('roofWidth').value) || 0) * toFt;
    var pitch = parseFloat(g('roofPitch').value) || 0;       // rise per 12 of run
    var waste = parseFloat(g('roofWaste').value) || 10;

    var footprint = L * W;
    // A pitched roof's area is the footprint times sqrt(rise² + 12²)/12.
    var mult = Math.sqrt(pitch * pitch + 144) / 12;
    var area = footprint * mult;
    var areaW = area * (1 + waste / 100);
    var squares = areaW / 100;

    var f = function (v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US', { maximumFractionDigits: d }); };
    g('roofFootprint').textContent = f(footprint, 1) + ' sq ft  ·  ' + f(footprint * 0.09290304, 1) + ' m²';
    g('roofMultiplier').textContent = f(mult, 4) + '×  (' + pitch + '/12 pitch, ' +
      f(Math.atan(pitch / 12) * 180 / Math.PI, 1) + '°)';
    g('roofArea').textContent = f(area, 1) + ' sq ft  ·  ' + f(area * 0.09290304, 1) + ' m²';
    g('roofSquares').textContent = f(squares, 2) + ' squares (including ' + waste + '% waste)';
    g('roofBundles').textContent = Math.ceil(squares * 3) + ' bundles at 3 per square';
    g('roofNote').textContent = pitch >= 9
      ? 'At ' + pitch + '/12 this is a steep roof — walking it safely needs staging or a roof jack setup, and waste allowance usually runs higher than 10%.'
      : pitch <= 2
        ? 'At ' + pitch + '/12 this is a low-slope roof. Standard asphalt shingles are generally not rated below 2/12, and 2/12 to 4/12 requires a doubled underlayment.'
        : 'A conventional walkable slope for asphalt shingles.';
  }
  ['roofUnit', 'roofLength', 'roofWidth', 'roofPitch', 'roofWaste'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Tile Calculator ----
(function () {
  if (!document.getElementById('tileAreaL')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var imperial = g('tileUnit').value === 'imperial';
    var toFt = imperial ? 1 : 3.280839895;
    var L = (parseFloat(g('tileAreaL').value) || 0) * toFt;
    var W = (parseFloat(g('tileAreaW').value) || 0) * toFt;
    var area = L * W;

    var tl = parseFloat(g('tileLength').value) || 0;         // inches or cm
    var tw = parseFloat(g('tileWidth').value) || 0;
    var gap = parseFloat(g('tileGap').value) || 0;           // mm
    var gapIn = gap / 25.4;
    var tlIn = imperial ? tl : tl / 2.54;
    var twIn = imperial ? tw : tw / 2.54;
    var waste = parseFloat(g('tileWaste').value) || 10;

    if (area <= 0 || tlIn <= 0 || twIn <= 0) {
      ['tileArea', 'tileCount', 'tileWithWaste', 'tileBoxes', 'tileGrout'].forEach(function (i) { g(i).textContent = '—'; });
      return;
    }
    // Grout lines make each tile occupy slightly more floor than its own size.
    var effective = ((tlIn + gapIn) * (twIn + gapIn)) / 144;   // sq ft per tile including its share of grout
    var count = area / effective;
    var withWaste = Math.ceil(count * (1 + waste / 100));
    var perBox = parseFloat(g('tilePerBox').value) || 0;

    var f = function (v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US', { maximumFractionDigits: d }); };
    g('tileArea').textContent = f(area, 2) + ' sq ft  ·  ' + f(area * 0.09290304, 2) + ' m²';
    g('tileCount').textContent = Math.ceil(count) + ' tiles (exact fit)';
    g('tileWithWaste').textContent = withWaste + ' tiles including ' + waste + '% waste';
    g('tileBoxes').textContent = perBox > 0 ? Math.ceil(withWaste / perBox) + ' boxes at ' + perBox + ' per box' : 'Enter tiles per box';
    g('tilePerTile').textContent = f(effective, 4) + ' sq ft each including grout line';
    g('tileNote').textContent = waste < 10
      ? 'Under 10% waste is optimistic. Allow 10% for a straight lay, 15% for a diagonal or herringbone pattern, and more for a room with many cuts.'
      : '';
  }
  ['tileUnit', 'tileAreaL', 'tileAreaW', 'tileLength', 'tileWidth', 'tileGap', 'tileWaste', 'tilePerBox'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Mulch Calculator ----
(function () {
  if (!document.getElementById('mulchLength')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var imperial = g('mulchUnit').value === 'imperial';
    var toFt = imperial ? 1 : 3.280839895;
    var L = (parseFloat(g('mulchLength').value) || 0) * toFt;
    var W = (parseFloat(g('mulchWidth').value) || 0) * toFt;
    var depth = parseFloat(g('mulchDepth').value) || 0;
    var depthFt = imperial ? depth / 12 : depth / 30.48;
    var area = L * W;
    var ft3 = area * depthFt;
    var yd3 = ft3 / 27;

    var f = function (v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US', { maximumFractionDigits: d }); };
    g('mulchArea').textContent = f(area, 1) + ' sq ft  ·  ' + f(area * 0.09290304, 1) + ' m²';
    g('mulchVolume').textContent = f(ft3, 2) + ' ft³  ·  ' + f(ft3 * 0.028316846592, 3) + ' m³';
    g('mulchYards').textContent = f(yd3, 2) + ' cubic yards';
    g('mulchBags2').textContent = Math.ceil(ft3 / 2) + ' bags';
    g('mulchBags3').textContent = Math.ceil(ft3 / 3) + ' bags';
    g('mulchCoverage').textContent = 'One cubic yard covers ' + f(27 / depthFt, 0) + ' sq ft at this depth';
    g('mulchNote').textContent = yd3 >= 2
      ? 'At ' + f(yd3, 1) + ' cubic yards, bulk delivery is usually cheaper than bags — the crossover is typically around 2 to 3 yards.'
      : 'At this size bagged mulch is usually simpler; bulk delivery tends to pay off from about 2 to 3 cubic yards.';
  }
  ['mulchUnit', 'mulchLength', 'mulchWidth', 'mulchDepth'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Gravel Calculator ----
(function () {
  if (!document.getElementById('gravLength')) return;
  var g = function (id) { return document.getElementById(id); };
  // Approximate bulk densities in lb per cubic foot, loose.
  var MATERIAL = { gravel: 105, crushed: 100, sand: 100, topsoil: 80, riverrock: 100, limestone: 105 };
  function calc() {
    var imperial = g('gravUnit').value === 'imperial';
    var toFt = imperial ? 1 : 3.280839895;
    var L = (parseFloat(g('gravLength').value) || 0) * toFt;
    var W = (parseFloat(g('gravWidth').value) || 0) * toFt;
    var depth = parseFloat(g('gravDepth').value) || 0;
    var depthFt = imperial ? depth / 12 : depth / 30.48;
    var area = L * W;
    var ft3 = area * depthFt;
    var yd3 = ft3 / 27;
    var lbPerFt3 = MATERIAL[g('gravMaterial').value] || 105;
    var lb = ft3 * lbPerFt3;

    var f = function (v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US', { maximumFractionDigits: d }); };
    g('gravArea').textContent = f(area, 1) + ' sq ft  ·  ' + f(area * 0.09290304, 1) + ' m²';
    g('gravVolume').textContent = f(ft3, 2) + ' ft³  ·  ' + f(ft3 * 0.028316846592, 3) + ' m³';
    g('gravYards').textContent = f(yd3, 2) + ' cubic yards';
    g('gravTons').textContent = f(lb / 2000, 2) + ' US tons  ·  ' + f(lb * 0.45359237 / 1000, 2) + ' tonnes';
    g('gravWeight').textContent = f(lb, 0) + ' lb  ·  ' + f(lb * 0.45359237, 0) + ' kg';
    g('gravNote').textContent = 'Bulk density varies with stone size, moisture and how well compacted the load is — treat the tonnage as ±10% and order to the yardage where you can.';
  }
  ['gravUnit', 'gravLength', 'gravWidth', 'gravDepth', 'gravMaterial'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ================= Weather & transport cluster =================

// ---- Wind Chill Calculator ----
(function () {
  if (!document.getElementById('wcTemp')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var metric = g('wcUnit').value === 'metric';
    var t = parseFloat(g('wcTemp').value);
    var v = parseFloat(g('wcWind').value);
    if (!isFinite(t) || !isFinite(v)) { ['wcResult', 'wcAlt', 'wcDrop', 'wcFrostbite'].forEach(function (i) { g(i).textContent = '—'; }); return; }

    var tF = metric ? t * 9 / 5 + 32 : t;
    var vMph = metric ? v / 1.609344 : v;      // kph → mph

    var note = g('wcNote');
    if (tF > 50 || vMph < 3) {
      ['wcResult', 'wcAlt', 'wcDrop', 'wcFrostbite'].forEach(function (i) { g(i).textContent = '—'; });
      note.textContent = 'The NWS wind chill formula is only defined at or below 50 °F (10 °C) with wind of at least 3 mph (4.8 kph). Outside that range wind chill is not meaningful — moving air still cools you, but the equation was not fitted there.';
      return;
    }
    // NWS / Environment Canada 2001 revision.
    var p = Math.pow(vMph, 0.16);
    var wcF = 35.74 + 0.6215 * tF - 35.75 * p + 0.4275 * tF * p;
    var wcC = (wcF - 32) * 5 / 9;

    g('wcResult').textContent = metric ? (Math.round(wcC * 10) / 10) + ' °C' : (Math.round(wcF * 10) / 10) + ' °F';
    g('wcAlt').textContent = metric ? (Math.round(wcF * 10) / 10) + ' °F' : (Math.round(wcC * 10) / 10) + ' °C';
    var drop = metric ? t - wcC : tF - wcF;
    g('wcDrop').textContent = (Math.round(drop * 10) / 10) + (metric ? ' °C' : ' °F') + ' colder than the air temperature';

    // Exposure times to frostbite on exposed skin, per the NWS chart bands.
    var fb;
    if (wcF > -18) fb = 'Low risk with normal precautions.';
    else if (wcF > -32) fb = 'Frostbite possible on exposed skin in about 30 minutes.';
    else if (wcF > -48) fb = 'Frostbite possible on exposed skin in about 10 minutes.';
    else fb = 'Frostbite possible on exposed skin in about 5 minutes. Cover all skin.';
    g('wcFrostbite').textContent = fb;
    note.textContent = '';
  }
  ['wcUnit', 'wcTemp', 'wcWind'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Heat Index Calculator ----
(function () {
  if (!document.getElementById('hiTemp')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var metric = g('hiUnit').value === 'metric';
    var t = parseFloat(g('hiTemp').value);
    var rh = parseFloat(g('hiHumidity').value);
    if (!isFinite(t) || !isFinite(rh)) { ['hiResult', 'hiAlt', 'hiRise', 'hiCategory'].forEach(function (i) { g(i).textContent = '—'; }); return; }
    rh = Math.max(0, Math.min(100, rh));
    var T = metric ? t * 9 / 5 + 32 : t;

    // NWS: compute the simple form first; only use Rothfusz if it lands at 80+.
    var simple = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (rh * 0.094));
    var hiF = (simple + T) / 2;
    if (hiF >= 80) {
      hiF = -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh
        - 0.00683783 * T * T - 0.05481717 * rh * rh + 0.00122874 * T * T * rh
        + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh;
      if (rh < 13 && T >= 80 && T <= 112) {
        hiF -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      } else if (rh > 85 && T >= 80 && T <= 87) {
        hiF += ((rh - 85) / 10) * ((87 - T) / 5);
      }
    }
    var hiC = (hiF - 32) * 5 / 9;
    g('hiResult').textContent = metric ? (Math.round(hiC * 10) / 10) + ' °C' : (Math.round(hiF * 10) / 10) + ' °F';
    g('hiAlt').textContent = metric ? (Math.round(hiF * 10) / 10) + ' °F' : (Math.round(hiC * 10) / 10) + ' °C';
    var rise = metric ? hiC - t : hiF - T;
    g('hiRise').textContent = (rise >= 0 ? '+' : '') + (Math.round(rise * 10) / 10) + (metric ? ' °C' : ' °F') + ' against the air temperature';

    var cat;
    if (hiF < 80) cat = 'No significant heat stress expected.';
    else if (hiF < 91) cat = 'Caution — fatigue possible with prolonged exposure or activity.';
    else if (hiF < 104) cat = 'Extreme caution — heat cramps and heat exhaustion possible with prolonged exposure or activity.';
    else if (hiF < 126) cat = 'Danger — heat cramps and heat exhaustion likely; heat stroke possible with prolonged exposure or activity.';
    else cat = 'Extreme danger — heat stroke highly likely. This is a life-threatening level.';
    g('hiCategory').textContent = cat;
    g('hiNote').textContent = 'Heat index assumes shade and light wind. Direct sun can add as much as 8 °C (15 °F) to the effective figure.';
  }
  ['hiUnit', 'hiTemp', 'hiHumidity'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Dew Point Calculator ----
(function () {
  if (!document.getElementById('dpTemp')) return;
  var g = function (id) { return document.getElementById(id); };
  var B = 17.625, C = 243.04;    // Alduchov-Eskridge coefficients for the Magnus formula
  function calc() {
    var metric = g('dpUnit').value === 'metric';
    var t = parseFloat(g('dpTemp').value);
    var rh = parseFloat(g('dpHumidity').value);
    if (!isFinite(t) || !isFinite(rh) || rh <= 0) {
      ['dpResult', 'dpAlt', 'dpComfort', 'dpSpread'].forEach(function (i) { g(i).textContent = '—'; });
      return;
    }
    rh = Math.max(0.01, Math.min(100, rh));
    var tC = metric ? t : (t - 32) * 5 / 9;
    var gamma = Math.log(rh / 100) + (B * tC) / (C + tC);
    var dpC = (C * gamma) / (B - gamma);
    var dpF = dpC * 9 / 5 + 32;

    g('dpResult').textContent = metric ? (Math.round(dpC * 10) / 10) + ' °C' : (Math.round(dpF * 10) / 10) + ' °F';
    g('dpAlt').textContent = metric ? (Math.round(dpF * 10) / 10) + ' °F' : (Math.round(dpC * 10) / 10) + ' °C';
    g('dpSpread').textContent = (Math.round((tC - dpC) * 10) / 10) + ' °C  (' +
      (Math.round((tC - dpC) * 9 / 5 * 10) / 10) + ' °F) below the air temperature';

    // Dew point, not relative humidity, is what actually tracks how muggy it feels.
    var c;
    if (dpC < 10) c = 'Dry and comfortable.';
    else if (dpC < 13) c = 'Comfortable.';
    else if (dpC < 16) c = 'Becoming noticeable but still pleasant for most people.';
    else if (dpC < 18) c = 'Slightly humid — noticeable to most people.';
    else if (dpC < 21) c = 'Humid and uncomfortable.';
    else if (dpC < 24) c = 'Very humid — quite oppressive.';
    else c = 'Extremely oppressive. Sweat evaporates poorly, so heat stress risk is high.';
    g('dpComfort').textContent = c;
    g('dpNote').textContent = dpC >= 0
      ? 'Air cooled to ' + (Math.round(dpC * 10) / 10) + ' °C will reach saturation and begin forming dew, fog or condensation.'
      : 'Below freezing, this is technically the frost point — water vapour deposits directly as frost rather than condensing first.';
  }
  ['dpUnit', 'dpTemp', 'dpHumidity'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

// ---- Gas Mileage Calculator ----
(function () {
  if (!document.getElementById('gmMode')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var mode = g('gmMode').value;
    g('gmOdoRow').style.display = mode === 'odometer' ? '' : 'none';
    g('gmDirectRow').style.display = mode === 'direct' ? '' : 'none';

    var miles, gallons;
    if (mode === 'odometer') {
      var start = parseFloat(g('gmStart').value) || 0;
      var end = parseFloat(g('gmEnd').value) || 0;
      var dist = Math.max(0, end - start);
      miles = g('gmDistUnit').value === 'km' ? dist / 1.609344 : dist;
      var fuel = parseFloat(g('gmFuel').value) || 0;
      gallons = g('gmFuelUnit').value === 'l' ? fuel / 3.785411784 : fuel;
    } else {
      var d2 = parseFloat(g('gmDistance').value) || 0;
      miles = g('gmDistUnit2').value === 'km' ? d2 / 1.609344 : d2;
      var f2 = parseFloat(g('gmFuel2').value) || 0;
      gallons = g('gmFuelUnit2').value === 'l' ? f2 / 3.785411784 : f2;
    }
    if (miles <= 0 || gallons <= 0) {
      ['gmMpgUs', 'gmMpgUk', 'gmL100', 'gmKmL', 'gmCostPer'].forEach(function (i) { g(i).textContent = '—'; });
      return;
    }
    var mpgUs = miles / gallons;
    var km = miles * 1.609344, litres = gallons * 3.785411784;
    var l100 = litres / km * 100;
    var kmL = km / litres;
    var mpgUk = mpgUs * 1.201;                   // an imperial gallon is 1.201 US gallons

    var f = function (v) { return Math.round(v * 100) / 100; };
    g('gmMpgUs').textContent = f(mpgUs) + ' MPG (US)';
    g('gmMpgUk').textContent = f(mpgUk) + ' MPG (imperial)';
    g('gmL100').textContent = f(l100) + ' L/100 km';
    g('gmKmL').textContent = f(kmL) + ' km/L';

    var price = parseFloat(g('gmPrice').value) || 0;
    var sym = g('gmCur').value;
    if (price > 0) {
      var perUnit = g('gmPriceUnit').value === 'l' ? price * litres / km : price * gallons / miles;
      g('gmCostPer').textContent = g('gmPriceUnit').value === 'l'
        ? sym + f(perUnit) + ' per km  ·  ' + sym + f(perUnit * 100) + ' per 100 km'
        : sym + f(perUnit) + ' per mile  ·  ' + sym + f(perUnit * 100) + ' per 100 miles';
    } else g('gmCostPer').textContent = '—';
  }
  ['gmMode', 'gmStart', 'gmEnd', 'gmDistUnit', 'gmFuel', 'gmFuelUnit', 'gmDistance', 'gmDistUnit2',
    'gmFuel2', 'gmFuelUnit2', 'gmPrice', 'gmPriceUnit', 'gmCur'].forEach(function (id) {
      g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
    });
  calc();
})();

// ---- Horsepower Calculator ----
(function () {
  if (!document.getElementById('hpMode')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var mode = g('hpMode').value;
    g('hpTorqueRow').style.display = mode === 'torque' ? '' : 'none';
    g('hpTrapRow').style.display = mode === 'trap' ? '' : 'none';
    g('hpEtRow').style.display = mode === 'et' ? '' : 'none';

    var hp = NaN, explain = '';
    if (mode === 'torque') {
      var tq = parseFloat(g('hpTorque').value) || 0;
      var rpm = parseFloat(g('hpRpm').value) || 0;
      var lbft = g('hpTorqueUnit').value === 'nm' ? tq / 1.355817948 : tq;
      hp = lbft * rpm / 5252;
      explain = 'hp = torque (lb-ft) × rpm ÷ 5252';
    } else if (mode === 'trap') {
      var wt = parseFloat(g('hpWeight').value) || 0;
      var lb = g('hpWeightUnit').value === 'kg' ? wt / 0.45359237 : wt;
      var mph = parseFloat(g('hpTrap').value) || 0;
      if (g('hpTrapUnit').value === 'kph') mph = mph / 1.609344;
      hp = lb * Math.pow(mph / 234, 3);
      explain = 'Huntington trap-speed estimate: hp = weight × (mph ÷ 234)³';
    } else {
      var wt2 = parseFloat(g('hpWeight2').value) || 0;
      var lb2 = g('hpWeightUnit2').value === 'kg' ? wt2 / 0.45359237 : wt2;
      var et = parseFloat(g('hpEt').value) || 0;
      if (et > 0) { hp = lb2 / Math.pow(et / 5.825, 3); }
      explain = 'Huntington elapsed-time estimate: hp = weight ÷ (ET ÷ 5.825)³';
    }
    if (!isFinite(hp) || hp <= 0) {
      ['hpResult', 'hpKw', 'hpPs', 'hpTorqueOut'].forEach(function (i) { g(i).textContent = '—'; });
      g('hpFormula').textContent = explain; return;
    }
    g('hpResult').textContent = (Math.round(hp * 10) / 10).toLocaleString('en-US') + ' hp';
    g('hpKw').textContent = (Math.round(hp * 0.745699872 * 10) / 10) + ' kW';
    g('hpPs').textContent = (Math.round(hp * 1.01387 * 10) / 10) + ' PS (metric horsepower)';
    if (mode === 'torque') {
      var r = parseFloat(g('hpRpm').value) || 0;
      g('hpTorqueOut').textContent = r > 0 ? (Math.round(hp * 5252 / r * 10) / 10) + ' lb-ft  ·  ' +
        (Math.round(hp * 5252 / r * 1.355817948 * 10) / 10) + ' Nm' : '—';
    } else g('hpTorqueOut').textContent = 'Not derivable from this method';
    g('hpFormula').textContent = explain;
  }
  ['hpMode', 'hpTorque', 'hpTorqueUnit', 'hpRpm', 'hpWeight', 'hpWeightUnit', 'hpTrap', 'hpTrapUnit',
    'hpWeight2', 'hpWeightUnit2', 'hpEt'].forEach(function (id) {
      g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
    });
  calc();
})();

// ---- Tire Size Calculator ----
(function () {
  if (!document.getElementById('tsWidth1')) return;
  var g = function (id) { return document.getElementById(id); };
  function spec(w, a, r) {
    var sidewall = w * (a / 100);            // mm
    var diaMm = r * 25.4 + 2 * sidewall;
    var diaIn = diaMm / 25.4;
    return {
      sidewall: sidewall, diaMm: diaMm, diaIn: diaIn,
      circIn: Math.PI * diaIn,
      revsPerMile: 63360 / (Math.PI * diaIn)
    };
  }
  function calc() {
    var a = spec(parseFloat(g('tsWidth1').value) || 0, parseFloat(g('tsAspect1').value) || 0, parseFloat(g('tsRim1').value) || 0);
    var b = spec(parseFloat(g('tsWidth2').value) || 0, parseFloat(g('tsAspect2').value) || 0, parseFloat(g('tsRim2').value) || 0);
    var f = function (v, d) { return Math.round(v * Math.pow(10, d)) / Math.pow(10, d); };

    g('tsDia1').textContent = f(a.diaIn, 2) + ' in  ·  ' + f(a.diaMm, 1) + ' mm';
    g('tsSide1').textContent = f(a.sidewall, 1) + ' mm  ·  ' + f(a.sidewall / 25.4, 2) + ' in';
    g('tsCirc1').textContent = f(a.circIn, 2) + ' in  ·  ' + f(a.revsPerMile, 0) + ' revs/mile';
    g('tsDia2').textContent = f(b.diaIn, 2) + ' in  ·  ' + f(b.diaMm, 1) + ' mm';
    g('tsSide2').textContent = f(b.sidewall, 1) + ' mm  ·  ' + f(b.sidewall / 25.4, 2) + ' in';
    g('tsCirc2').textContent = f(b.circIn, 2) + ' in  ·  ' + f(b.revsPerMile, 0) + ' revs/mile';

    if (a.diaIn <= 0 || b.diaIn <= 0) { g('tsDiff').textContent = '—'; g('tsSpeedo').textContent = '—'; return; }
    var pct = (b.diaIn - a.diaIn) / a.diaIn * 100;
    g('tsDiff').textContent = (pct >= 0 ? '+' : '') + f(pct, 2) + '%  (' + (pct >= 0 ? '+' : '') + f(b.diaIn - a.diaIn, 2) + ' in diameter)';

    // A bigger tyre travels further per revolution, so the speedometer under-reads.
    var indicated = 60;
    var actual = indicated * (b.diaIn / a.diaIn);
    g('tsSpeedo').textContent = Math.abs(actual - indicated) < 0.05
      ? 'No change — the two sizes roll the same distance per revolution.'
      : 'At an indicated 60, you would actually be doing ' + f(actual, 1) +
        ' — the speedometer reads ' + (actual > indicated ? f(actual - indicated, 1) + ' low' : f(indicated - actual, 1) + ' high');
    var note = g('tsNote');
    note.textContent = Math.abs(pct) > 3
      ? 'A difference over 3% is generally considered too much — it affects speedometer and odometer accuracy, ABS and traction control calibration, and on some vehicles the transmission shift points. Most fitment guides keep replacements within 3%.'
      : 'Within the 3% tolerance normally recommended for a replacement size.';
  }
  ['tsWidth1', 'tsAspect1', 'tsRim1', 'tsWidth2', 'tsAspect2', 'tsRim2'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ================= Date & time cluster =================

// ---- Time Card Calculator ----
(function () {
  if (!document.getElementById('tcBody')) return;
  var g = function (id) { return document.getElementById(id); };
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Build the week's rows once, then wire them up.
  var rows = DAYS.map(function (d, i) {
    return '<tr>' +
      '<td>' + d + '</td>' +
      '<td><input type="time" id="tcIn' + i + '" style="width:100%;"></td>' +
      '<td><input type="time" id="tcOut' + i + '" style="width:100%;"></td>' +
      '<td><input type="number" id="tcBrk' + i + '" value="0" min="0" step="5" style="width:100%;"></td>' +
      '<td id="tcDay' + i + '">—</td></tr>';
  }).join('');
  g('tcBody').innerHTML = rows;

  function minutes(v) {
    if (!v) return null;
    var p = v.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function hm(mins) {
    var h = Math.floor(mins / 60), m = Math.round(mins % 60);
    return h + 'h ' + String(m).padStart(2, '0') + 'm';
  }
  function calc() {
    var totalMins = 0, anyOvernight = false;
    DAYS.forEach(function (d, i) {
      var a = minutes(g('tcIn' + i).value), b = minutes(g('tcOut' + i).value);
      var brk = parseFloat(g('tcBrk' + i).value) || 0;
      if (a === null || b === null) { g('tcDay' + i).textContent = '—'; return; }
      // An end time before the start time means the shift crossed midnight.
      if (b < a) { b += 1440; anyOvernight = true; }
      var mins = Math.max(0, b - a - brk);
      totalMins += mins;
      g('tcDay' + i).textContent = hm(mins) + '  (' + (Math.round(mins / 60 * 100) / 100) + ')';
    });
    var totalHours = totalMins / 60;
    var otThreshold = parseFloat(g('tcOtAfter').value);
    if (!isFinite(otThreshold) || otThreshold <= 0) otThreshold = 40;
    var regular = Math.min(totalHours, otThreshold);
    var overtime = Math.max(0, totalHours - otThreshold);

    g('tcTotal').textContent = hm(totalMins) + '  (' + (Math.round(totalHours * 100) / 100) + ' decimal hours)';
    g('tcRegular').textContent = (Math.round(regular * 100) / 100) + ' hours';
    g('tcOvertime').textContent = (Math.round(overtime * 100) / 100) + ' hours';

    var rate = parseFloat(g('tcRate').value) || 0;
    var mult = parseFloat(g('tcOtMult').value) || 1.5;
    var sym = g('tcCur').value;
    var money = function (n) { return sym + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }); };
    if (rate > 0) {
      g('tcRegularPay').textContent = money(regular * rate);
      g('tcOtPay').textContent = money(overtime * rate * mult);
      g('tcTotalPay').textContent = money(regular * rate + overtime * rate * mult);
    } else {
      ['tcRegularPay', 'tcOtPay', 'tcTotalPay'].forEach(function (i) { g(i).textContent = '—'; });
    }
    g('tcNote').textContent = anyOvernight
      ? 'One or more shifts end earlier than they start, so those have been treated as crossing midnight.'
      : '';
  }
  DAYS.forEach(function (d, i) {
    ['tcIn' + i, 'tcOut' + i, 'tcBrk' + i].forEach(function (id) {
      g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
    });
  });
  ['tcRate', 'tcOtAfter', 'tcOtMult', 'tcCur'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Time Zone Converter ----
(function () {
  if (!document.getElementById('tzFrom')) return;
  var g = function (id) { return document.getElementById(id); };
  var ZONES = [
    ['Pacific/Auckland', 'Auckland'], ['Australia/Sydney', 'Sydney'], ['Australia/Perth', 'Perth'],
    ['Asia/Tokyo', 'Tokyo'], ['Asia/Seoul', 'Seoul'], ['Asia/Shanghai', 'Shanghai'],
    ['Asia/Singapore', 'Singapore'], ['Asia/Hong_Kong', 'Hong Kong'], ['Asia/Jakarta', 'Jakarta'],
    ['Asia/Bangkok', 'Bangkok'], ['Asia/Kathmandu', 'Kathmandu'], ['Asia/Kolkata', 'India (IST)'], ['Asia/Karachi', 'Karachi'],
    ['Asia/Dubai', 'Dubai'], ['Africa/Nairobi', 'Nairobi'], ['Europe/Moscow', 'Moscow'],
    ['Africa/Johannesburg', 'Johannesburg'], ['Africa/Lagos', 'Lagos'], ['Europe/Berlin', 'Berlin'],
    ['Europe/Paris', 'Paris'], ['Europe/Madrid', 'Madrid'], ['Europe/London', 'London'],
    ['Europe/Lisbon', 'Lisbon'], ['Atlantic/Reykjavik', 'Reykjavik'], ['America/Sao_Paulo', 'Sao Paulo'],
    ['America/New_York', 'New York'], ['America/Toronto', 'Toronto'], ['America/Chicago', 'Chicago'],
    ['America/Mexico_City', 'Mexico City'], ['America/Denver', 'Denver'], ['America/Los_Angeles', 'Los Angeles'],
    ['America/Anchorage', 'Anchorage'], ['Pacific/Honolulu', 'Honolulu'], ['UTC', 'UTC']
  ];

  // Milliseconds between what a zone's wall clock reads and the real UTC instant.
  function zoneOffset(tz, date) {
    var dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false, year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    var p = {};
    dtf.formatToParts(date).forEach(function (x) { if (x.type !== 'literal') p[x.type] = x.value; });
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
    return asUTC - date.getTime();
  }
  // Turn a wall-clock time in a given zone into a real UTC instant. Run twice so
  // a time that sits near a DST transition resolves against the correct offset.
  function toInstant(y, mo, d, h, mi, tz) {
    var wall = Date.UTC(y, mo - 1, d, h, mi);
    var ts = wall - zoneOffset(tz, new Date(wall));
    ts = wall - zoneOffset(tz, new Date(ts));
    return ts;
  }
  function fmt(ts, tz) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true
    }).format(new Date(ts));
  }
  function abbrev(ts, tz) {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(ts));
    var n = parts.find(function (p) { return p.type === 'timeZoneName'; });
    return n ? n.value : '';
  }

  var opts = ZONES.map(function (z) { return '<option value="' + z[0] + '">' + z[1] + '</option>'; }).join('');
  g('tzFrom').innerHTML = opts;
  g('tzFrom').value = 'Europe/London';

  function calc() {
    var dateStr = g('tzDate').value, timeStr = g('tzTime').value;
    var from = g('tzFrom').value;
    var tbody = g('tzTable');
    if (!dateStr || !timeStr) { tbody.innerHTML = ''; g('tzNote').textContent = 'Pick a date and a time.'; return; }
    var dp = dateStr.split('-'), tp = timeStr.split(':');
    var ts = toInstant(+dp[0], +dp[1], +dp[2], +tp[0], +tp[1], from);
    if (!isFinite(ts)) { tbody.innerHTML = ''; return; }

    var sourceDay = new Intl.DateTimeFormat('en-GB', { timeZone: from, day: 'numeric' }).format(new Date(ts));
    tbody.innerHTML = ZONES.map(function (z) {
      var thisDay = new Intl.DateTimeFormat('en-GB', { timeZone: z[0], day: 'numeric' }).format(new Date(ts));
      var offset = zoneOffset(z[0], new Date(ts)) / 3600000;
      var sign = offset >= 0 ? '+' : '−';
      var abs = Math.abs(offset);
      var offStr = 'UTC' + sign + Math.floor(abs) + (abs % 1 ? ':' + String(Math.round((abs % 1) * 60)).padStart(2, '0') : '');
      var same = thisDay === sourceDay;
      return '<tr' + (z[0] === from ? ' style="background:rgba(212,163,115,0.08);"' : '') + '><td>' + z[1] +
        '</td><td>' + fmt(ts, z[0]) + '</td><td>' + abbrev(ts, z[0]) + '</td><td>' + offStr +
        '</td><td>' + (same ? 'same day' : 'different day') + '</td></tr>';
    }).join('');
    g('tzNote').textContent = 'Offsets shown are those in effect on the selected date, so daylight saving is already accounted for.';
  }
  ['tzDate', 'tzTime', 'tzFrom'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  // Default to today at 09:00 local.
  var now = new Date();
  g('tzDate').value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  if (!g('tzTime').value) g('tzTime').value = '09:00';
  calc();
})();

// ================= The 200 cluster =================

// ---- Paint Calculator ----
(function () {
  if (!document.getElementById('pntLength')) return;
  var g = function (id) { return document.getElementById(id); };
  function calc() {
    var imperial = g('pntUnit').value === 'imperial';
    var toFt = imperial ? 1 : 3.280839895;
    var L = (parseFloat(g('pntLength').value) || 0) * toFt;
    var W = (parseFloat(g('pntWidth').value) || 0) * toFt;
    var H = (parseFloat(g('pntHeight').value) || 0) * toFt;
    var coats = parseFloat(g('pntCoats').value) || 1;
    var doors = parseFloat(g('pntDoors').value) || 0;
    var windows = parseFloat(g('pntWindows').value) || 0;

    // Walls are the perimeter times the height; the ceiling is the footprint.
    var walls = 2 * (L + W) * H;
    var ceiling = g('pntCeiling').checked ? L * W : 0;
    // Standard openings: a door is about 20 sq ft, a window about 15.
    var deduct = doors * 20 + windows * 15;
    var paintable = Math.max(0, walls + ceiling - deduct);
    var total = paintable * coats;

    var coverage = parseFloat(g('pntCoverage').value) || 350;   // sq ft per US gallon
    var gallons = total / coverage;
    var litres = gallons * 3.785411784;

    var f = function (v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US', { maximumFractionDigits: d }); };
    g('pntWallArea').textContent = f(walls, 1) + ' sq ft  ·  ' + f(walls * 0.09290304, 1) + ' m²';
    g('pntPaintable').textContent = f(paintable, 1) + ' sq ft  ·  ' + f(paintable * 0.09290304, 1) + ' m²' +
      (deduct > 0 ? '  (after ' + f(deduct, 0) + ' sq ft of openings)' : '');
    g('pntTotalArea').textContent = f(total, 1) + ' sq ft over ' + coats + ' coat' + (coats === 1 ? '' : 's');
    g('pntGallons').textContent = f(gallons, 2) + ' US gallons';
    g('pntLitres').textContent = f(litres, 2) + ' litres';
    g('pntCans').textContent = Math.ceil(gallons) + ' × 1 gal  or  ' + Math.ceil(litres / 5) + ' × 5 L  or  ' + Math.ceil(litres / 2.5) + ' × 2.5 L';

    var price = parseFloat(g('pntPrice').value) || 0;
    var sym = g('pntCur').value;
    g('pntCost').textContent = price > 0
      ? sym + f(g('pntPriceUnit').value === 'l' ? Math.ceil(litres / 5) * price : Math.ceil(gallons) * price, 2) +
        ' buying whole containers'
      : '—';
    g('pntNote').textContent = coats < 2
      ? 'One coat rarely covers properly. Two is standard, and three is realistic when going light over dark, covering a strong colour, or painting bare plaster.'
      : 'Coverage varies a great deal with surface. Bare plaster, new drywall and textured walls can absorb 25% more than the figure on the tin.';
  }
  ['pntUnit', 'pntLength', 'pntWidth', 'pntHeight', 'pntCoats', 'pntDoors', 'pntWindows',
    'pntCeiling', 'pntCoverage', 'pntPrice', 'pntPriceUnit', 'pntCur'].forEach(function (id) {
      g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
    });
  calc();
})();

// ---- Cooking Measurement Converter ----
(function () {
  if (!document.getElementById('ckIngredient')) return;
  var g = function (id) { return document.getElementById(id); };
  var CUP_ML = 236.5882365;
  // Grams per US cup. Dry goods follow the King Arthur Baking weight chart —
  // those depend on measuring technique, not just density. Liquids use real
  // density instead, because the "8 fl oz = 8 oz" convention is not accurate.
  var ING = {
    water: ['Water', 236.6], milk: ['Milk', 244], oil: ['Vegetable oil', 218],
    honey: ['Honey', 336], syrup: ['Maple syrup', 322],
    apflour: ['Flour, all-purpose', 120], breadflour: ['Flour, bread', 120],
    wwflour: ['Flour, whole wheat', 113],
    sugar: ['Sugar, granulated', 198], brownsugar: ['Sugar, brown (packed)', 213],
    powdered: ['Sugar, confectioners’', 113],
    butter: ['Butter', 227], cocoa: ['Cocoa powder', 84], oats: ['Rolled oats', 113],
    rice: ['Rice, long grain (dry)', 198], salt: ['Salt, table', 288],
    chocchips: ['Chocolate chips', 170]
  };
  // Volume units in millilitres.
  var VOL = { cup: CUP_ML, tbsp: CUP_ML / 16, tsp: CUP_ML / 48, ml: 1, l: 1000, floz: 29.5735295625, pint: 473.176473, quart: 946.352946 };
  // Weight units in grams.
  var WT = { g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 };

  var opts = Object.keys(ING).map(function (k) { return '<option value="' + k + '">' + ING[k][0] + '</option>'; }).join('');
  g('ckIngredient').innerHTML = opts;
  g('ckIngredient').value = 'apflour';

  function calc() {
    var amt = parseFloat(g('ckAmount').value);
    var from = g('ckFrom').value, to = g('ckTo').value;
    var ing = ING[g('ckIngredient').value];
    var gPerCup = ing[1];
    var density = gPerCup / CUP_ML;     // g per ml

    if (!isFinite(amt) || amt < 0) { g('ckResult').textContent = '—'; g('ckAll').innerHTML = ''; return; }

    // Normalise the input to millilitres and grams, whichever way it came in.
    var ml, grams;
    if (VOL[from] !== undefined) { ml = amt * VOL[from]; grams = ml * density; }
    else { grams = amt * WT[from]; ml = grams / density; }

    var out = VOL[to] !== undefined ? ml / VOL[to] : grams / WT[to];
    var round = function (v) {
      if (v === 0) return '0';
      var d = v < 1 ? 4 : v < 10 ? 3 : v < 100 ? 2 : 1;
      return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('en-US', { maximumFractionDigits: d });
    };
    var label = { cup: 'cups', tbsp: 'tbsp', tsp: 'tsp', ml: 'ml', l: 'litres', floz: 'fl oz', pint: 'pints', quart: 'quarts', g: 'g', kg: 'kg', oz: 'oz', lb: 'lb' };
    g('ckResult').textContent = round(out) + ' ' + label[to];

    // A full conversion table is more useful than the single answer.
    var rows = [['Cups', ml / VOL.cup], ['Tablespoons', ml / VOL.tbsp], ['Teaspoons', ml / VOL.tsp],
      ['Millilitres', ml], ['Fluid ounces', ml / VOL.floz],
      ['Grams', grams], ['Ounces', grams / WT.oz], ['Pounds', grams / WT.lb]];
    g('ckAll').innerHTML = rows.map(function (r) {
      return '<tr><td>' + r[0] + '</td><td>' + round(r[1]) + '</td></tr>';
    }).join('');
    g('ckDensity').textContent = gPerCup + ' g per US cup  ·  ' + (Math.round(density * 1000) / 1000) + ' g/ml';
    g('ckNote').textContent = (VOL[from] !== undefined) === (VOL[to] !== undefined)
      ? 'This conversion is pure arithmetic — it does not depend on the ingredient.'
      : 'Converting between volume and weight depends entirely on the ingredient, which is why it is selected above.';
  }
  ['ckIngredient', 'ckAmount', 'ckFrom', 'ckTo'].forEach(function (id) {
    g(id).addEventListener('input', calc); g(id).addEventListener('change', calc);
  });
  calc();
})();

// ---- Aspect Ratio Calculator ----
(function () {
  if (!document.getElementById('arW1')) return;
  var g = function (id) { return document.getElementById(id); };
  var NAMED = {
    '16:9': 'Widescreen — HD, most monitors and video',
    '4:3': 'Traditional — older TVs, iPad, many photos',
    '3:2': '35mm film and most DSLR sensors',
    '1:1': 'Square — Instagram, album art',
    '21:9': 'Ultrawide — cinema and ultrawide monitors',
    '16:10': 'Common on laptops and productivity monitors',
    '5:4': 'Older 1280×1024 monitors',
    '9:16': 'Vertical video — phones, Reels, Shorts',
    '2:3': 'Portrait photo',
    '256:135': 'DCI 4K cinema',
    // "21:9" is a marketing label; the real panel ratios simplify to these.
    '64:27': 'Ultrawide — marketed as 21:9 (2560×1080, 3840×1620)',
    '43:18': 'Ultrawide — marketed as 21:9 (3440×1440)',
    '12:5': 'Super ultrawide — marketed as 24:10',
    '32:9': 'Super ultrawide — dual 16:9 side by side'
  };
  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
  function calc(driver) {
    var w1 = parseFloat(g('arW1').value) || 0;
    var h1 = parseFloat(g('arH1').value) || 0;
    if (w1 <= 0 || h1 <= 0) {
      ['arRatio', 'arDecimal', 'arName', 'arPixels'].forEach(function (i) { g(i).textContent = '—'; });
      return;
    }
    var ratio = w1 / h1;
    // Whichever new dimension the user last touched drives the other.
    var w2 = parseFloat(g('arW2').value), h2 = parseFloat(g('arH2').value);
    if (driver === 'arW2' && isFinite(w2) && w2 > 0) { g('arH2').value = Math.round(w2 / ratio * 100) / 100; }
    else if (driver === 'arH2' && isFinite(h2) && h2 > 0) { g('arW2').value = Math.round(h2 * ratio * 100) / 100; }
    else if (isFinite(w2) && w2 > 0) { g('arH2').value = Math.round(w2 / ratio * 100) / 100; }

    var d = gcd(Math.round(w1), Math.round(h1)) || 1;
    var simple = Math.round(w1 / d) + ':' + Math.round(h1 / d);
    g('arRatio').textContent = simple;
    g('arDecimal').textContent = (Math.round(ratio * 10000) / 10000) + ' : 1';
    g('arName').textContent = NAMED[simple] || (Math.abs(ratio - 16 / 9) < 0.01 ? 'Very close to 16:9' :
      Math.abs(ratio - 4 / 3) < 0.01 ? 'Very close to 4:3' : 'No standard name');
    var px = Math.round(w1) * Math.round(h1);
    g('arPixels').textContent = px.toLocaleString('en-US') + ' px  (' + (Math.round(px / 1e6 * 100) / 100) + ' MP)';
    g('arOrientation').textContent = ratio > 1 ? 'Landscape' : ratio < 1 ? 'Portrait' : 'Square';
  }
  ['arW1', 'arH1'].forEach(function (id) { g(id).addEventListener('input', function () { calc(null); }); });
  ['arW2', 'arH2'].forEach(function (id) { g(id).addEventListener('input', function () { calc(id); }); });
  calc(null);
})();

// ---- Colour Converter and Contrast Checker ----
(function () {
  if (!document.getElementById('clHex')) return;
  var g = function (id) { return document.getElementById(id); };
  function parseHex(s) {
    s = String(s).trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  function toHex(rgb) {
    return '#' + rgb.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('').toUpperCase();
  }
  function toHsl(r, gr, b) {
    r /= 255; gr /= 255; b /= 255;
    var max = Math.max(r, gr, b), min = Math.min(r, gr, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((gr - b) / d + (gr < b ? 6 : 0));
      else if (max === gr) h = (b - r) / d + 2;
      else h = (r - gr) / d + 4;
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }
  // WCAG 2.x relative luminance. The spec states the threshold as 0.03928.
  function luminance(rgb) {
    var c = rgb.map(function (v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function calc() {
    var a = parseHex(g('clHex').value);
    var b = parseHex(g('clHex2').value);
    var note = g('clNote');
    if (!a) {
      ['clRgb', 'clHsl', 'clHexOut', 'clContrast', 'clAA', 'clAAA'].forEach(function (i) { g(i).textContent = '—'; });
      note.textContent = 'Enter a colour as #RRGGBB or #RGB — for example #D4A373.';
      g('clSwatch').style.background = 'transparent';
      return;
    }
    var hsl = toHsl(a[0], a[1], a[2]);
    g('clHexOut').textContent = toHex(a);
    g('clRgb').textContent = 'rgb(' + a.join(', ') + ')';
    g('clHsl').textContent = 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';
    g('clSwatch').style.background = toHex(a);

    if (!b) {
      ['clContrast', 'clAA', 'clAAA'].forEach(function (i) { g(i).textContent = '—'; });
      g('clSwatch2').style.background = 'transparent';
      note.textContent = 'Enter a second colour to check contrast against it.';
      return;
    }
    g('clSwatch2').style.background = toHex(b);
    var l1 = luminance(a), l2 = luminance(b);
    var ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    g('clContrast').textContent = (Math.round(ratio * 100) / 100) + ' : 1';
    var mark = function (ok) { return ok ? 'Pass' : 'Fail'; };
    g('clAA').textContent = 'Normal text ' + mark(ratio >= 4.5) + '  ·  Large text ' + mark(ratio >= 3);
    g('clAAA').textContent = 'Normal text ' + mark(ratio >= 7) + '  ·  Large text ' + mark(ratio >= 4.5);
    note.textContent = ratio >= 7 ? 'Passes every WCAG threshold including AAA for body text.'
      : ratio >= 4.5 ? 'Passes AA for body text. AAA needs 7:1.'
        : ratio >= 3 ? 'Only sufficient for large text (18pt, or 14pt bold) and UI components. Body text needs 4.5:1.'
          : 'Below every WCAG threshold — not usable for text at any size.';
    // Show the pairing in situ so the number is not the only evidence.
    var prev = g('clPreview');
    prev.style.background = toHex(b);
    prev.style.color = toHex(a);
  }
  ['clHex', 'clHex2'].forEach(function (id) { g(id).addEventListener('input', calc); g(id).addEventListener('change', calc); });
  calc();
})();

/* VA FUNDING FEE CALCULATOR
   Distinct from va-mortgage-calculator.html, which asks the user to TYPE a fee
   percentage. This one derives the rate from the official VA table, because
   picking the right rate is the actual difficulty — the schedule is not
   uniform, and the commonest mistake is assuming first/subsequent use always
   changes the rate. It does not: at 5% or more down, both pay the same.
   Rates: va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs
   Schedule effective 7 April 2023. US-only by definition — VA loans are a
   United States Department of Veterans Affairs programme, so no currency
   selector here on purpose. */
(function () {
  if (!document.getElementById('vaffAmount')) return;

  var amount = document.getElementById('vaffAmount');
  var down = document.getElementById('vaffDown');
  var type = document.getElementById('vaffType');
  var use = document.getElementById('vaffUse');
  var exempt = document.getElementById('vaffExempt');
  var downField = document.getElementById('vaffDownField');

  function rateFor(t, downPct, subsequent, isExempt) {
    if (isExempt) return 0;
    if (t === 'irrrl') return 0.5;
    if (t === 'cashout') return subsequent ? 3.3 : 2.15;
    if (downPct >= 10) return 1.25;
    if (downPct >= 5) return 1.5;
    return subsequent ? 3.3 : 2.15;
  }

  var usd = function (n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  function calc() {
    var t = type.value;
    var isPurchase = t === 'purchase';
    // Down payment only exists on a purchase; a refinance has no purchase price.
    downField.style.opacity = isPurchase ? '1' : '0.45';
    down.disabled = !isPurchase;

    var amt = Math.max(0, parseFloat(amount.value) || 0);
    var d = isPurchase ? Math.min(100, Math.max(0, parseFloat(down.value) || 0)) : 0;
    var subsequent = use.value === 'subsequent';
    var isExempt = exempt.checked;

    var rate = rateFor(t, d, subsequent, isExempt);
    // The fee is charged on the LOAN amount, not the purchase price — so a
    // down payment reduces the fee twice over: lower rate and smaller base.
    var base = isPurchase ? amt * (1 - d / 100) : amt;
    var fee = base * rate / 100;

    document.getElementById('vaffRate').textContent = rate.toFixed(2) + '%';
    document.getElementById('vaffBase').textContent = usd(base);
    document.getElementById('vaffFee').textContent = usd(fee);
    document.getElementById('vaffTotal').textContent = usd(base + fee);

    var note;
    if (isExempt) {
      note = 'Exempt — no funding fee is charged.';
    } else if (t === 'irrrl') {
      note = 'IRRRL (streamline refinance) is a flat 0.50% regardless of use or equity.';
    } else if (t === 'cashout') {
      note = 'Cash-out refinance: ' + (subsequent ? 'subsequent use, 3.30%.' : 'first use, 2.15%.');
    } else if (d >= 10) {
      note = '10% or more down caps the rate at 1.25% — first and subsequent use pay the same.';
    } else if (d >= 5) {
      note = '5–9.99% down gives 1.50% — first and subsequent use pay the same.';
    } else {
      note = 'Under 5% down is the only tier where subsequent use costs more (3.30% vs 2.15%).';
    }
    document.getElementById('vaffNote').textContent = note;
  }

  [amount, down, type, use, exempt].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

/* EMBED DIRECTORY (embed.html)
   Builds the iframe snippet on demand from a row's data attributes rather than
   emitting 201 pre-rendered textareas into the page. The snippet format is
   duplicated from the per-tool embed modal above deliberately kept identical —
   if that format ever changes, both places must change together. */
(function () {
  var list = document.getElementById('embOutput');
  if (!list || !document.getElementById('embFilter')) return;

  var filter = document.getElementById('embFilter');
  var countEl = document.getElementById('embCount');
  var outName = document.getElementById('embOutName');
  var codeEl = document.getElementById('embCode');
  var copiedEl = document.getElementById('embCopied');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.emb-list li'));

  function snippetFor(file, name) {
    var url = 'https://tallybench.com/' + file;
    var id = file.replace(/\.html$/, '');
    var frameId = 'tb-embed-' + id;
    return '<iframe id="' + frameId + '" src="' + url + '?embed=1" width="100%" height="640" ' +
      'style="border:0;max-width:640px;" loading="lazy" title="' + name + ' — TallyBench"></iframe>\n' +
      '<script>window.addEventListener("message",function(e){if(e.data&&e.data.tbEmbedId==="' + id + '"){' +
      'var f=document.getElementById("' + frameId + '");if(f)f.style.height=e.data.tbEmbedHeight+"px";}});<' + '/script>';
  }

  document.querySelectorAll('.emb-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var file = btn.getAttribute('data-file');
      var name = btn.getAttribute('data-name');
      var code = snippetFor(file, name);
      outName.textContent = name;
      codeEl.value = code;
      list.hidden = false;
      list.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      codeEl.focus();
      codeEl.select();
      var done = function (ok) {
        copiedEl.textContent = ok
          ? 'Copied to clipboard. Paste it anywhere in your page HTML.'
          : 'Select the code above and copy it manually.';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () { done(true); }, function () { done(false); });
      } else {
        try { done(document.execCommand('copy')); } catch (e) { done(false); }
      }
    });
  });

  function applyFilter() {
    var q = filter.value.trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (li) {
      var name = (li.querySelector('.emb-name') || {}).textContent || '';
      var hit = !q || name.toLowerCase().indexOf(q) > -1;
      li.style.display = hit ? '' : 'none';
      if (hit) shown++;
    });
    // hide a category heading whose whole list is filtered out
    document.querySelectorAll('.emb-list').forEach(function (ul) {
      var any = Array.prototype.some.call(ul.children, function (li) { return li.style.display !== 'none'; });
      ul.style.display = any ? '' : 'none';
      var h = ul.previousElementSibling;
      if (h && h.classList.contains('emb-cat')) h.style.display = any ? '' : 'none';
    });
    countEl.textContent = q
      ? shown + ' of ' + rows.length + ' calculators match "' + filter.value.trim() + '"'
      : rows.length + ' calculators, all free to embed';
  }

  filter.addEventListener('input', applyFilter);
  applyFilter();
})();

/* EXPENSE RATIO / FUND FEE CALCULATOR
   Built because "mutual fund expense ratio calculator" and its variants are
   the clearest market-side demand in Search Console, and no page covered it.

   The modelling point: an expense ratio is levied on ASSETS every year, so it
   must be compounded as (gross return - expense ratio). Subtracting a flat fee
   at the end understates the damage badly, because the fee also removes the
   growth that money would have produced. Verified against the closed form:
   10,000 at 7% for 30y is 76,122.55, and at 6% (7% gross less a 1% ER) is
   57,434.91 — so a 1% ratio costs 24.5% of final wealth. */
(function () {
  if (!document.getElementById('erInitial')) return;

  var cur = document.getElementById('erCur');
  var initial = document.getElementById('erInitial');
  var annual = document.getElementById('erAnnual');
  var years = document.getElementById('erYears');
  var gross = document.getElementById('erGross');
  var ratio = document.getElementById('erRatio');
  var compare = document.getElementById('erCompare');

  function money(n) {
    var sym = cur.value;
    return sym + Math.round(n).toLocaleString('en-US');
  }

  function project(init, contrib, yrs, grossPct, erPct) {
    var g = grossPct / 100, net = (grossPct - erPct) / 100;
    var withFee = init, noFee = init;
    for (var y = 0; y < yrs; y++) {
      withFee = withFee * (1 + net) + contrib;
      noFee = noFee * (1 + g) + contrib;
    }
    return { withFee: withFee, noFee: noFee };
  }

  function calc() {
    var init = Math.max(0, parseFloat(initial.value) || 0);
    var contrib = Math.max(0, parseFloat(annual.value) || 0);
    var yrs = Math.min(70, Math.max(1, parseFloat(years.value) || 1));
    var g = parseFloat(gross.value) || 0;
    var er = Math.max(0, parseFloat(ratio.value) || 0);
    var cmpEr = Math.max(0, parseFloat(compare.value) || 0);

    var a = project(init, contrib, yrs, g, er);
    var cost = a.noFee - a.withFee;
    var pctLost = a.noFee > 0 ? cost / a.noFee * 100 : 0;

    document.getElementById('erFinal').textContent = money(a.withFee);
    document.getElementById('erNoFee').textContent = money(a.noFee);
    document.getElementById('erCost').textContent = money(cost);
    document.getElementById('erPct').textContent = pctLost.toFixed(1) + '% of final wealth';

    // Side-by-side against a cheaper fund — the decision people actually face.
    var b = project(init, contrib, yrs, g, cmpEr);
    var diff = b.withFee - a.withFee;
    document.getElementById('erCmpFinal').textContent = money(b.withFee);
    document.getElementById('erCmpDiff').textContent =
      (diff >= 0 ? '+' : '\u2212') + money(Math.abs(diff));

    var note;
    if (er === 0) {
      note = 'A zero expense ratio is rare outside a handful of index funds — check the fund factsheet rather than assuming.';
    } else if (pctLost >= 20) {
      note = 'Over ' + yrs + ' years this fee removes about a fifth of everything the money would have earned.';
    } else if (pctLost >= 10) {
      note = 'The fee compounds: it costs far more than ' + er + '% because it also removes the growth that money would have made.';
    } else {
      note = 'A low ratio still compounds, but at this level the drag stays modest over ' + yrs + ' years.';
    }
    document.getElementById('erNote').textContent = note;
  }

  [cur, initial, annual, years, gross, ratio, compare].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();

/* DIVIDEND YIELD & INCOME CALCULATOR
   Tracks SHARES and per-share figures rather than a pooled balance. That
   matters for reinvestment: DRIP buys shares at a price that is itself moving,
   and a pooled model hides that and gets the compounding wrong. The starting
   price is arbitrary (100) because it cancels — shares = amount / price.

   Verified against five closed-form identities before shipping: a 4% yield
   fully reinvested with no growth must equal compounding at 4%; the same taxed
   at 50% must equal compounding at 2%; 0% yield with 6% price growth must
   equal 1.06^n; flat income must be exactly yield x amount x years; and
   year-n income must equal year-1 income times (1+g)^(n-1). */
(function () {
  if (!document.getElementById('divAmount')) return;

  var cur = document.getElementById('divCur');
  var amount = document.getElementById('divAmount');
  var yieldEl = document.getElementById('divYield');
  var divGrowth = document.getElementById('divGrowth');
  var priceGrowth = document.getElementById('divPriceGrowth');
  var years = document.getElementById('divYears');
  var reinvest = document.getElementById('divReinvest');
  var tax = document.getElementById('divTax');

  function money(n) { return cur.value + Math.round(n).toLocaleString('en-US'); }

  function project(amt, yieldPct, gdPct, gpPct, yrs, drip, taxPct) {
    var P0 = 100, gd = gdPct / 100, gp = gpPct / 100, t = taxPct / 100;
    var shares = P0 > 0 ? amt / P0 : 0;
    var DPS0 = P0 * (yieldPct / 100);
    var totalNet = 0, firstNet = 0, lastNet = 0;
    for (var y = 1; y <= yrs; y++) {
      var dps = DPS0 * Math.pow(1 + gd, y - 1);
      var net = shares * dps * (1 - t);
      totalNet += net;
      if (y === 1) firstNet = net;
      if (y === yrs) lastNet = net;
      var price = P0 * Math.pow(1 + gp, y);
      if (drip && price > 0) shares += net / price;
    }
    return {
      value: shares * P0 * Math.pow(1 + gp, yrs),
      totalNet: totalNet, firstNet: firstNet, lastNet: lastNet,
      yieldOnCost: amt > 0 ? lastNet / amt * 100 : 0
    };
  }

  function calc() {
    var amt = Math.max(0, parseFloat(amount.value) || 0);
    var y = Math.max(0, parseFloat(yieldEl.value) || 0);
    var gd = parseFloat(divGrowth.value) || 0;
    var gp = parseFloat(priceGrowth.value) || 0;
    var yrs = Math.min(60, Math.max(1, parseFloat(years.value) || 1));
    var t = Math.min(100, Math.max(0, parseFloat(tax.value) || 0));
    var drip = reinvest.checked;

    var r = project(amt, y, gd, gp, yrs, drip, t);

    document.getElementById('divIncome1').textContent = money(r.firstNet);
    document.getElementById('divIncomeN').textContent = money(r.lastNet);
    document.getElementById('divTotal').textContent = money(r.totalNet);
    document.getElementById('divValue').textContent = money(r.value);
    document.getElementById('divYoC').textContent = r.yieldOnCost.toFixed(1) + '%';

    var note;
    if (!drip) {
      note = 'Dividends are taken as cash, so the share count never grows — income rises only as the dividend per share rises.';
    } else if (t >= 30) {
      note = 'Tax is taken before reinvestment, so a ' + t + '% rate cuts the compounding, not just the income.';
    } else if (gd > 0) {
      note = 'Two things compound here at once: more shares each year, and a larger dividend on every share.';
    } else {
      note = 'With a flat dividend, reinvesting still compounds — you simply own more shares each year.';
    }
    document.getElementById('divNote').textContent = note;
  }

  [cur, amount, yieldEl, divGrowth, priceGrowth, years, reinvest, tax].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
})();
