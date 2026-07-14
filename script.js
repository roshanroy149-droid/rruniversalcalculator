// ---- Cookie consent gate (Google AdSense advertising cookies) ----
(function(){
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

// ---- Two-tier category nav (category tabs + collapsible sub-row) ----
(function(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const catTabs = document.querySelectorAll('.cat-tab');
  const subRuler = document.getElementById('subRuler');
  const subTicks = document.querySelectorAll('.sub-tick');
  if(!catTabs.length || !subRuler) return;

  // Mark the plain HOME link active if we're on the homepage
  document.querySelectorAll('.tick[href]').forEach(t=>{
    if(t.getAttribute('href') === path) t.classList.add('active');
  });

  function openCategory(cat, scroll){
    catTabs.forEach(tab=>tab.classList.toggle('cat-open', tab.dataset.cat === cat));
    subTicks.forEach(tick=>tick.classList.toggle('cat-visible', tick.dataset.cat === cat));
    subRuler.classList.add('open');
    if(scroll) subRuler.scrollLeft = 0;
  }

  function closeAll(){
    catTabs.forEach(tab=>tab.classList.remove('cat-open'));
    subRuler.classList.remove('open');
  }

  // Mark the current page's sub-tick as active (works once its category is shown)
  subTicks.forEach(tick=>{
    if(tick.getAttribute('href') === path) tick.classList.add('active');
  });

  // Auto-open the category this page belongs to, so the current tool is visible on load
  const pageCat = document.body.dataset.pageCat;
  if(pageCat){
    openCategory(pageCat, false);
  }

  catTabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      const cat = tab.dataset.cat;
      const alreadyOpen = tab.classList.contains('cat-open');
      if(alreadyOpen){
        closeAll();
      } else {
        openCategory(cat, true);
      }
    });
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
  let standard = 'who'; // 'who' = 25/30 thresholds, 'apac' = 23/25 (WHO Asia-Pacific)

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
  ['bmiH','bmiW','bmiFt','bmiIn'].forEach(id=>document.getElementById(id).addEventListener('input',calcBMI));
  calcBMI();
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

  fetch('https://api.frankfurter.dev/v1/latest?base=USD')
    .then(r=>{ if(!r.ok) throw new Error('bad response'); return r.json(); })
    .then(data=>{
      ratesUSD = Object.assign({USD:1}, data.rates);
      asOfDate = data.date;
      const codes = Object.keys(ratesUSD).sort();
      fillSelect(fromEl, codes, 'USD');
      fillSelect(toEl, codes, 'INR');
      convert();
    })
    .catch(()=>{
      fillSelect(fromEl, fallbackCurrencies, 'USD');
      fillSelect(toEl, fallbackCurrencies, 'INR');
      outEl.textContent = 'Rate unavailable';
      rateEl.textContent = 'Could not reach the exchange rate service — check your connection and try again.';
      dateEl.textContent = '';
    });

  amtEl.addEventListener('input', convert);
  fromEl.addEventListener('change', convert);
  toEl.addEventListener('change', convert);
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
const taxUsFiling = {
  single: { standardDeduction:15000, brackets:[[11925,0.10],[48475,0.12],[103350,0.22],[197300,0.24],[250525,0.32],[626350,0.35],[Infinity,0.37]] },
  mfj:    { standardDeduction:30000, brackets:[[23850,0.10],[96950,0.12],[206700,0.22],[394600,0.24],[501050,0.32],[751600,0.35],[Infinity,0.37]] },
  hoh:    { standardDeduction:22500, brackets:[[17000,0.10],[64850,0.12],[103350,0.22],[197300,0.24],[250500,0.32],[626350,0.35],[Infinity,0.37]] }
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
  }

  function rebuildGradeOptions(){
    const scale = scaleEl.value;
    const opts = gradePoints[scale].map(([label])=>`<option value="${label}">${label}</option>`).join('');
    document.querySelectorAll('.gpaGrade').forEach(sel=>{ sel.innerHTML = opts; });
    calc();
  }

  function calc(){
    const scale = scaleEl.value;
    const map = Object.fromEntries(gradePoints[scale]);
    let totalCredits = 0, totalPoints = 0;
    document.querySelectorAll('#gpaRows .row3').forEach(row=>{
      const grade = row.querySelector('.gpaGrade').value;
      const credits = parseFloat(row.querySelector('.gpaCredits').value)||0;
      const points = map[grade] !== undefined ? map[grade] : 0;
      totalCredits += credits;
      totalPoints += credits*points;
    });
    const gpa = totalCredits>0 ? totalPoints/totalCredits : 0;
    document.getElementById('gpaCredits').textContent = totalCredits.toString();
    document.getElementById('gpaResult').textContent = gpa.toFixed(2);
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
      feasibleEl.textContent = 'Enter remaining credit hours to plan ahead';
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
  ['tgTarget','tgRemaining'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', calc);
  });

  addRow(3);
  addRow(4);
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
