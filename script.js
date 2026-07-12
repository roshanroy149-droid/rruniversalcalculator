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
    const bill = parseFloat(document.getElementById('tipBill').value)||0;
    const pct = parseFloat(document.getElementById('tipPct').value)||0;
    const people = parseInt(document.getElementById('tipPeople').value)||1;
    const tip = bill*pct/100;
    const total = bill+tip;
    document.getElementById('tipAmt').textContent = '$'+tip.toFixed(2);
    document.getElementById('tipTotal').textContent = '$'+total.toFixed(2);
    document.getElementById('tipEach').textContent = '$'+(total/people).toFixed(2);
  }
  ['tipBill','tipPct','tipPeople'].forEach(id=>document.getElementById(id).addEventListener('input',calcTip));
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
  function calcLoan(){
    const P = parseFloat(document.getElementById('loanAmt').value)||0;
    const annual = parseFloat(document.getElementById('loanRate').value)||0;
    const n = parseInt(document.getElementById('loanTerm').value)||1;
    const r = annual/100/12;
    const pay = r===0 ? P/n : P*r/(1-Math.pow(1+r,-n));
    const total = pay*n;
    document.getElementById('loanPay').textContent = '$'+pay.toFixed(2);
    document.getElementById('loanTotal').textContent = '$'+total.toFixed(2);
    document.getElementById('loanInt').textContent = '$'+(total-P).toFixed(2);
  }
  ['loanAmt','loanRate','loanTerm'].forEach(id=>document.getElementById(id).addEventListener('input',calcLoan));
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

// ---- Currency converter (live rates via frankfurter.app, ECB data) ----
(function(){
  if(!document.getElementById('curAmt')) return;
  const amtEl = document.getElementById('curAmt');
  const fromEl = document.getElementById('curFrom');
  const toEl = document.getElementById('curTo');
  const outEl = document.getElementById('curOut');
  const rateEl = document.getElementById('curRateLine');
  const dateEl = document.getElementById('curDate');
  const swapBtn = document.getElementById('curSwap');
  const fallbackCurrencies = ['USD','EUR','GBP','INR','JPY','AUD','CAD','CHF','CNY','SGD','AED','NZD','ZAR','SEK','NOK','MXN','BRL','HKD','KRW','THB'];

  function fillSelect(select, list, def){
    select.innerHTML = list.map(c=>`<option value="${c}">${c}</option>`).join('');
    select.value = list.includes(def) ? def : list[0];
  }

  function convert(){
    const amt = parseFloat(amtEl.value)||0;
    const from = fromEl.value, to = toEl.value;
    if(!from || !to){ return; }
    if(from === to){
      outEl.textContent = amt.toFixed(2)+' '+to;
      rateEl.textContent = '1 '+from+' = 1 '+to;
      return;
    }
    outEl.textContent = 'Loading…';
    fetch(`https://api.frankfurter.app/latest?amount=${amt}&from=${from}&to=${to}`)
      .then(r=>r.json())
      .then(data=>{
        const value = data.rates[to];
        outEl.textContent = value.toFixed(2)+' '+to;
        rateEl.textContent = '1 '+from+' = '+ (amt? (value/amt).toFixed(4) : '0') +' '+to;
        dateEl.textContent = 'Rates as of '+data.date+' · source: European Central Bank via frankfurter.app';
      })
      .catch(()=>{
        outEl.textContent = 'Rate unavailable';
        rateEl.textContent = 'Could not reach the exchange rate service — check your connection and try again.';
      });
  }

  fetch('https://api.frankfurter.app/currencies')
    .then(r=>r.json())
    .then(data=>{
      const codes = Object.keys(data);
      fillSelect(fromEl, codes, 'USD');
      fillSelect(toEl, codes, 'INR');
      convert();
    })
    .catch(()=>{
      fillSelect(fromEl, fallbackCurrencies, 'USD');
      fillSelect(toEl, fallbackCurrencies, 'INR');
      convert();
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
