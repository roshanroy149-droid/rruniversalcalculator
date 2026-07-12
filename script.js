// ---- Ruler nav active-state highlight (based on current page) ----
(function(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.tick').forEach(t=>{
    const href = t.getAttribute('href');
    if(href === path || (path==='' && href==='index.html')) t.classList.add('active');
  });
})();

// ---- Tip ----
(function(){
  if(!document.getElementById('tipBill')) return;
  function calcTip(){
    const cur = document.getElementById('tipCur').value;
    const bill = parseFloat(document.getElementById('tipBill').value)||0;
    const pct = parseFloat(document.getElementById('tipPct').value)||0;
    const people = parseInt(document.getElementById('tipPeople').value)||1;
    const tip = bill*pct/100;
    const total = bill+tip;
    document.getElementById('tipAmt').textContent = cur+tip.toFixed(2);
    document.getElementById('tipTotal').textContent = cur+total.toFixed(2);
    document.getElementById('tipEach').textContent = cur+(total/people).toFixed(2);
  }
  ['tipBill','tipPct','tipPeople','tipCur'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input',calcTip);
    el.addEventListener('change',calcTip);
  });
  calcTip();
})();

// ---- Percentage ----
(function(){
  if(!document.getElementById('pX')) return;
  function calcPercent(){
    const x=parseFloat(document.getElementById('pX').value)||0;
    const y=parseFloat(document.getElementById('pY').value)||0;
    const a=parseFloat(document.getElementById('pA').value)||0;
    const b=parseFloat(document.getElementById('pB').value)||0;
    document.getElementById('pOut1').textContent = (x*y/100).toFixed(2);
    document.getElementById('pOut2').textContent = (b?(a/b*100):0).toFixed(2)+'%';
  }
  ['pX','pY','pA','pB'].forEach(id=>document.getElementById(id).addEventListener('input',calcPercent));
  calcPercent();
})();

// ---- BMI ----
(function(){
  if(!document.getElementById('bmiH')) return;
  const unitSel = document.getElementById('bmiUnit');
  const cmWrap = document.getElementById('bmiCmWrap');
  const ftWrap = document.getElementById('bmiFtWrap');

  function getHeightMeters(){
    if(unitSel.value === 'ft'){
      const ft = parseFloat(document.getElementById('bmiFt').value)||0;
      const inches = parseFloat(document.getElementById('bmiIn').value)||0;
      const totalInches = (ft*12)+inches;
      return totalInches*0.0254;
    }
    return (parseFloat(document.getElementById('bmiH').value)||0)/100;
  }
  function calcBMI(){
    const h = getHeightMeters();
    const w = parseFloat(document.getElementById('bmiW').value)||0;
    const bmi = h>0 ? w/(h*h) : 0;
    document.getElementById('bmiVal').textContent = bmi.toFixed(1);
    let cat='—';
    if(bmi>0){
      if(bmi<18.5) cat='Underweight';
      else if(bmi<25) cat='Healthy range';
      else if(bmi<30) cat='Overweight';
      else cat='Obese';
    }
    document.getElementById('bmiCat').textContent = cat;
  }
  unitSel.addEventListener('change',()=>{
    const isFt = unitSel.value === 'ft';
    cmWrap.style.display = isFt ? 'none' : 'flex';
    ftWrap.style.display = isFt ? 'grid' : 'none';
    calcBMI();
  });
  ['bmiH','bmiW','bmiFt','bmiIn'].forEach(id=>document.getElementById(id).addEventListener('input',calcBMI));
  calcBMI();
})();

// ---- Age ----
(function(){
  if(!document.getElementById('ageBtn')) return;
  document.getElementById('ageBtn').addEventListener('click',()=>{
    const dobVal = document.getElementById('ageDob').value;
    if(!dobVal) return;
    const dob = new Date(dobVal);
    const now = new Date();
    let y = now.getFullYear()-dob.getFullYear();
    let m = now.getMonth()-dob.getMonth();
    let d = now.getDate()-dob.getDate();
    if(d<0){ m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if(m<0){ y--; m+=12; }
    document.getElementById('ageY').textContent=y;
    document.getElementById('ageM').textContent=m;
    document.getElementById('ageD').textContent=d;
  });
})();

// ---- Loan ----
(function(){
  if(!document.getElementById('loanAmt')) return;
  let tenureUnit = 'months';
  const seg = document.getElementById('loanTenureSeg');
  const unitLabel = document.getElementById('loanTenureUnitLabel');

  function calcLoan(){
    const cur = document.getElementById('loanCur').value;
    const P = parseFloat(document.getElementById('loanAmt').value)||0;
    const annual = parseFloat(document.getElementById('loanRate').value)||0;
    const termInput = parseFloat(document.getElementById('loanTerm').value)||0;
    const n = Math.round(tenureUnit==='years' ? termInput*12 : termInput);
    const r = annual/100/12;
    const pay = (r===0 || n<=0) ? (n>0 ? P/n : 0) : P*r/(1-Math.pow(1+r,-n));
    const total = pay*n;
    document.getElementById('loanPay').textContent = cur+pay.toFixed(2);
    document.getElementById('loanTotal').textContent = cur+total.toFixed(2);
    document.getElementById('loanInt').textContent = cur+(total-P).toFixed(2);
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

  ['loanAmt','loanRate','loanTerm','loanCur'].forEach(id=>{
    document.getElementById(id).addEventListener('input',calcLoan);
    document.getElementById(id).addEventListener('change',calcLoan);
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
    data:    { bit:0.125, byte:1, kb:1000, mb:1000000, gb:1000000000, tb:1000000000000, kib:1024, mib:1048576, gib:1073741824 }
  };
  const labels = {
    m:'m', km:'km', cm:'cm', mm:'mm', mi:'mi', yd:'yd', ft:'ft', in:'in', nmi:'nautical mi',
    kg:'kg', g:'g', mg:'mg', lb:'lb', oz:'oz', ton:'metric ton', stone:'stone',
    l:'L', ml:'mL', m3:'m³', cm3:'cm³', gal:'gal (US)', qt:'qt (US)', pt:'pt (US)', cup:'cup (US)', fl_oz:'fl oz (US)',
    m2:'m²', km2:'km²', cm2:'cm²', ha:'hectare', acre:'acre', ft2:'ft²', mi2:'mi²', yd2:'yd²',
    mps:'m/s', kmh:'km/h', mph:'mph', knot:'knot', fps:'ft/s',
    sec:'sec', min:'min', hr:'hr', day:'day', week:'week', month:'month', year:'year',
    bit:'bit', byte:'byte', kb:'KB', mb:'MB', gb:'GB', tb:'TB', kib:'KiB', mib:'MiB', gib:'GiB',
    c:'°C', f:'°F', k:'K'
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
  }
  document.getElementById('unitCat').addEventListener('change',populateUnits);
  ['unitVal','unitFrom','unitTo'].forEach(id=>document.getElementById(id).addEventListener('input',calcUnit));
  populateUnits();
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
  swapBtn.addEventListener('click', ()=>{
    const tmp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = tmp;
    convert();
  });
})();

// ---- Scientific calculator ----
(function(){
  const grid = document.getElementById('sciGrid');
  if(!grid) return;
  const exprEl = document.getElementById('sciExpr');
  const valEl = document.getElementById('sciVal');
  const degBtn = document.getElementById('sciDeg');
  const radBtn = document.getElementById('sciRad');

  let current = '0';
  let previous = null;
  let operator = null;
  let resetNext = false;
  let memory = 0;
  let lastAnswer = 0;
  let degMode = true;

  const opSymbol = {add:'+', sub:'−', mul:'×', div:'÷', pow:'xʸ'};

  function fmt(n){
    if(!isFinite(n)) return 'Error';
    if(Math.abs(n) < 1e-12) n = 0;
    const s = parseFloat(n.toPrecision(12)).toString();
    return s;
  }
  function render(){
    valEl.textContent = current;
    exprEl.textContent = previous!==null ? previous+' '+(opSymbol[operator]||'') : '\u00A0';
  }
  function inputDigit(d){
    if(resetNext){ current = d; resetNext=false; }
    else { current = current==='0' ? d : current+d; }
    render();
  }
  function inputDot(){
    if(resetNext){ current='0.'; resetNext=false; render(); return; }
    if(!current.includes('.')) current+='.';
    render();
  }
  function clearAll(){ current='0'; previous=null; operator=null; resetNext=false; render(); }
  function backspace(){ current = current.length>1 ? current.slice(0,-1) : '0'; render(); }
  function toggleSign(){ current = fmt(parseFloat(current)*-1); render(); }
  function percent(){ current = fmt(parseFloat(current)/100); render(); }

  function compute(){
    if(previous===null || operator===null) return parseFloat(current);
    const a = parseFloat(previous), b = parseFloat(current);
    let r;
    switch(operator){
      case 'add': r=a+b; break;
      case 'sub': r=a-b; break;
      case 'mul': r=a*b; break;
      case 'div': r=b===0 ? NaN : a/b; break;
      case 'pow': r=Math.pow(a,b); break;
      default: r=b;
    }
    return r;
  }
  function setOperator(op){
    if(previous!==null && !resetNext){
      current = fmt(compute());
    }
    previous = current;
    operator = op;
    resetNext = true;
    render();
  }
  function equals(){
    if(operator===null) return;
    const r = compute();
    lastAnswer = r;
    current = fmt(r);
    previous = null;
    operator = null;
    resetNext = true;
    render();
  }
  function toRad(v){ return degMode ? v*Math.PI/180 : v; }
  function unary(fn){
    const v = parseFloat(current);
    current = fmt(fn(v));
    resetNext = true;
    render();
  }
  function factorial(n){
    n = Math.round(n);
    if(n<0) return NaN;
    if(n>170) return Infinity;
    let r=1;
    for(let i=2;i<=n;i++) r*=i;
    return r;
  }

  const actions = {
    ac: clearAll,
    back: backspace,
    sign: toggleSign,
    pct: percent,
    dot: inputDot,
    eq: equals,
    add: ()=>setOperator('add'),
    sub: ()=>setOperator('sub'),
    mul: ()=>setOperator('mul'),
    div: ()=>setOperator('div'),
    pow: ()=>setOperator('pow'),
    sq: ()=>unary(v=>v*v),
    cube: ()=>unary(v=>v*v*v),
    sqrt: ()=>unary(v=>Math.sqrt(v)),
    cbrt: ()=>unary(v=>Math.cbrt(v)),
    inv: ()=>unary(v=> v===0 ? NaN : 1/v),
    fact: ()=>unary(factorial),
    sin: ()=>unary(v=>Math.sin(toRad(v))),
    cos: ()=>unary(v=>Math.cos(toRad(v))),
    tan: ()=>unary(v=>Math.tan(toRad(v))),
    log: ()=>unary(v=>Math.log10(v)),
    ln: ()=>unary(v=>Math.log(v)),
    pi: ()=>{ current = fmt(Math.PI); resetNext=true; render(); },
    e: ()=>{ current = fmt(Math.E); resetNext=true; render(); },
    ans: ()=>{ current = fmt(lastAnswer); resetNext=true; render(); },
    mc: ()=>{ memory = 0; },
    mr: ()=>{ current = fmt(memory); resetNext=true; render(); },
    'm+': ()=>{ memory += parseFloat(current); },
    'm-': ()=>{ memory -= parseFloat(current); }
  };

  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    if(btn.dataset.num !== undefined){ inputDigit(btn.dataset.num); return; }
    const act = btn.dataset.act;
    if(act && actions[act]) actions[act]();
  });

  degBtn.addEventListener('click', ()=>{ degMode=true; degBtn.classList.add('active'); radBtn.classList.remove('active'); });
  radBtn.addEventListener('click', ()=>{ degMode=false; radBtn.classList.add('active'); degBtn.classList.remove('active'); });

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

  // SIP
  function calcSIP(){
    const P = parseFloat(document.getElementById('sipAmt').value)||0;
    const annual = parseFloat(document.getElementById('sipRate').value)||0;
    const years = parseFloat(document.getElementById('sipYears').value)||0;
    const n = Math.round(years*12);
    const r = annual/100/12;
    const maturity = r===0 ? P*n : P*((Math.pow(1+r,n)-1)/r)*(1+r);
    const invested = P*n;
    document.getElementById('sipInvested').textContent = money(invested);
    document.getElementById('sipReturns').textContent = money(Math.max(maturity-invested,0));
    document.getElementById('sipMaturity').textContent = money(maturity);
  }
  ['sipAmt','sipRate','sipYears'].forEach(id=>{
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
})();

// ---- Tax calculator ----
(function(){
  const countrySel = document.getElementById('taxCountry');
  if(!countrySel) return;

  // Non-US, non-India schemes: symbol + single bracket set (0% band already encodes personal allowance/basic exemption)
  const flatSchemes = {
    ca: { symbol:'C$', brackets:[[57375,0.15],[114750,0.205],[177882,0.26],[253414,0.29],[Infinity,0.33]], dedLabel:'RRSP contributions & other deductions' },
    uk: { symbol:'£', brackets:[[12570,0],[50270,0.20],[125140,0.40],[Infinity,0.45]], dedLabel:'Pension contributions & Gift Aid' },
    de: { symbol:'€', brackets:[[11604,0],[66760,0.30],[277825,0.42],[Infinity,0.45]], dedLabel:'Werbungskosten & other deductions (simplified)' },
    fr: { symbol:'€', brackets:[[11497,0],[29315,0.11],[83823,0.30],[180294,0.41],[Infinity,0.45]], dedLabel:'Deductible expenses & abatements' },
    au: { symbol:'A$', brackets:[[18200,0],[45000,0.16],[135000,0.30],[190000,0.37],[Infinity,0.45]], dedLabel:'Work-related & other deductions' },
    sg: { symbol:'S$', brackets:[[20000,0],[30000,0.02],[40000,0.035],[80000,0.07],[120000,0.115],[160000,0.15],[200000,0.18],[240000,0.19],[280000,0.195],[320000,0.20],[Infinity,0.24]], dedLabel:'Reliefs (CPF, course fees, etc.)' },
    ae: { symbol:'AED ', brackets:[[Infinity,0]], dedLabel:'Not applicable' }
  };

  const usFiling = {
    single: { standardDeduction:15000, brackets:[[11925,0.10],[48475,0.12],[103350,0.22],[197300,0.24],[250525,0.32],[626350,0.35],[Infinity,0.37]] },
    mfj:    { standardDeduction:30000, brackets:[[23850,0.10],[96950,0.12],[206700,0.22],[394600,0.24],[501050,0.32],[751600,0.35],[Infinity,0.37]] },
    hoh:    { standardDeduction:22500, brackets:[[17000,0.10],[64850,0.12],[103350,0.22],[197300,0.24],[250500,0.32],[626350,0.35],[Infinity,0.37]] }
  };

  const indiaRegimes = {
    new: { standardDeduction:75000, brackets:[[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],[2000000,0.20],[2400000,0.25],[Infinity,0.30]], rebateThreshold:1200000 },
    old: { standardDeduction:50000, brackets:[[250000,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]], rebateThreshold:500000 }
  };

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

  function fmtMoney(sym, n){ return sym+Math.round(Math.max(n,0)).toLocaleString(); }
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

  function calc(){
    updateFieldVisibility();
    const scheme = getScheme();
    const salary = parseFloat(salaryEl.value)||0;
    const other = parseFloat(otherEl.value)||0;
    const gross = salary+other;
    const totalDed = scheme.standardDeduction + scheme.extraDed;
    const taxable = Math.max(gross-totalDed, 0);

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

// ---- Password generator ----
(function(){
  if(!document.getElementById('pwGen')) return;
  const pwLen = document.getElementById('pwLen');
  pwLen.addEventListener('input',()=>document.getElementById('pwLenVal').textContent=pwLen.value);
  function genPassword(){
    const len = parseInt(pwLen.value);
    const sets = [];
    if(document.getElementById('pwUpper').checked) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ');
    if(document.getElementById('pwLower').checked) sets.push('abcdefghijkmnpqrstuvwxyz');
    if(document.getElementById('pwNum').checked) sets.push('23456789');
    if(document.getElementById('pwSym').checked) sets.push('!@#$%^&*-_=+?');
    if(sets.length===0){ document.getElementById('pwOut').textContent='Select at least one option'; return; }
    const all = sets.join('');
    let pw='';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for(let i=0;i<len;i++){ pw += all[arr[i]%all.length]; }
    document.getElementById('pwOut').textContent = pw;
  }
  document.getElementById('pwGen').addEventListener('click',genPassword);
  document.getElementById('pwCopy').addEventListener('click',()=>{
    const txt = document.getElementById('pwOut').textContent;
    if(txt && txt!=='—') navigator.clipboard.writeText(txt);
  });
  genPassword();
})();

// ---- Word counter ----
(function(){
  if(!document.getElementById('wcText')) return;
  function calcWords(){
    const text = document.getElementById('wcText').value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const sentences = text.trim() ? (text.match(/[.!?]+(\s|$)/g)||[]).length || (text.trim()?1:0) : 0;
    document.getElementById('wcWords').textContent = words;
    document.getElementById('wcChars').textContent = chars;
    document.getElementById('wcSent').textContent = sentences;
  }
  document.getElementById('wcText').addEventListener('input',calcWords);
})();

// ---- Days Between Dates ----
(function(){
  const startEl = document.getElementById('daysStart');
  if(!startEl) return;
  const endEl = document.getElementById('daysEnd');
  const bizCheck = document.getElementById('daysExcludeWeekends');

  function calc(){
    const s = startEl.value ? new Date(startEl.value+'T00:00:00') : null;
    const e = endEl.value ? new Date(endEl.value+'T00:00:00') : null;
    if(!s || !e){ return; }
    let d1 = s, d2 = e;
    if(d1 > d2){ const t=d1; d1=d2; d2=t; }

    const msPerDay = 86400000;
    const totalDays = Math.round((d2-d1)/msPerDay);
    const weeks = (totalDays/7).toFixed(1);

    // Y/M/D breakdown
    let y = d2.getFullYear()-d1.getFullYear();
    let m = d2.getMonth()-d1.getMonth();
    let day = d2.getDate()-d1.getDate();
    if(day<0){ m--; day += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate(); }
    if(m<0){ y--; m+=12; }

    // business days
    let biz = 0;
    const cursor = new Date(d1);
    while(cursor < d2){
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

  // sensible defaults: today and 30 days from today
  const today = new Date();
  const future = new Date(today.getTime()+30*86400000);
  startEl.value = today.toISOString().slice(0,10);
  endEl.value = future.toISOString().slice(0,10);
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

  function calc(){
    const cur = curEl.value;
    const price = parseFloat(priceEl.value)||0;
    const down = parseFloat(downEl.value)||0;
    const principal = Math.max(price-down, 0);
    const annualRate = parseFloat(rateEl.value)||0;
    const years = parseFloat(termEl.value)||1;
    const n = Math.round(years*12);
    const r = annualRate/100/12;

    const pi = (r===0 || n<=0) ? (n>0?principal/n:0) : principal*r/(1-Math.pow(1+r,-n));

    const downPct = price>0 ? down/price*100 : 0;
    const pmiAnnualRate = parseFloat(pmiRateEl.value)||0;
    const pmiMonthly = downPct < 20 ? (principal*pmiAnnualRate/100)/12 : 0;

    const taxMonthly = (parseFloat(taxEl.value)||0)/12;
    const insMonthly = (parseFloat(insEl.value)||0)/12;

    const extras = taxMonthly+insMonthly+pmiMonthly;
    const total = pi+extras;
    const totalInterest = pi*n - principal;

    document.getElementById('mtgPI').textContent = cur+pi.toFixed(2);
    document.getElementById('mtgExtras').textContent = cur+extras.toFixed(2);
    document.getElementById('mtgTotal').textContent = cur+total.toFixed(2);
    document.getElementById('mtgTotalInterest').textContent = cur+Math.max(totalInterest,0).toFixed(2);
  }

  [priceEl, curEl, downEl, rateEl, termEl, taxEl, insEl, pmiRateEl].forEach(el=>{
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
  const unitEl = document.getElementById('calHeightUnit');
  const cmWrap = document.getElementById('calCmWrap');
  const ftWrap = document.getElementById('calFtWrap');
  const cmEl = document.getElementById('calHeightCm');
  const ftEl = document.getElementById('calHeightFt');
  const inEl = document.getElementById('calHeightIn');
  const activityEl = document.getElementById('calActivity');
  const sexSeg = document.getElementById('calSexSeg');
  let sex = 'male';

  function getHeightCm(){
    if(unitEl.value==='ft'){
      const ft = parseFloat(ftEl.value)||0;
      const inch = parseFloat(inEl.value)||0;
      return (ft*12+inch)*2.54;
    }
    return parseFloat(cmEl.value)||0;
  }

  function calc(){
    const isFt = unitEl.value==='ft';
    cmWrap.style.display = isFt ? 'none' : 'flex';
    ftWrap.style.display = isFt ? 'grid' : 'none';

    const age = parseFloat(ageEl.value)||0;
    const weight = parseFloat(weightEl.value)||0;
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
  }

  sexSeg.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    sex = btn.dataset.sex;
    sexSeg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calc();
  });
  [ageEl, weightEl, unitEl, cmEl, ftEl, inEl, activityEl].forEach(el=>{
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

  function calcSale(){
    const c = cur();
    const original = parseFloat(document.getElementById('discOriginal').value)||0;
    const pct = parseFloat(document.getElementById('discPct').value)||0;
    const saved = original*pct/100;
    const salePrice = original-saved;
    document.getElementById('discSaved').textContent = c+saved.toFixed(2);
    document.getElementById('discSalePrice').textContent = c+salePrice.toFixed(2);
  }
  function calcOriginal(){
    const c = cur();
    const sale = parseFloat(document.getElementById('discSale').value)||0;
    const pct = parseFloat(document.getElementById('discPct2').value)||0;
    const original = pct<100 ? sale/(1-pct/100) : 0;
    const saved = original-sale;
    document.getElementById('discOriginalOut').textContent = c+original.toFixed(2);
    document.getElementById('discSavedOut').textContent = c+Math.max(saved,0).toFixed(2);
  }

  ['discOriginal','discPct','discCur'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', ()=>{calcSale(); calcOriginal();});
    el.addEventListener('change', ()=>{calcSale(); calcOriginal();});
  });
  ['discSale','discPct2'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', calcOriginal);
  });
  calcSale();
  calcOriginal();
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
  }

  addBtn.addEventListener('click', ()=>addRow());
  scaleEl.addEventListener('change', rebuildGradeOptions);

  addRow(3);
  addRow(4);
  calc();
})();
