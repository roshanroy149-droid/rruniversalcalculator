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
  function calcBMI(){
    const h = (parseFloat(document.getElementById('bmiH').value)||0)/100;
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
  ['bmiH','bmiW'].forEach(id=>document.getElementById(id).addEventListener('input',calcBMI));
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
    length: { m:1, km:1000, cm:0.01, mm:0.001, mi:1609.34, yd:0.9144, ft:0.3048, in:0.0254 },
    weight: { kg:1, g:0.001, lb:0.453592, oz:0.0283495, ton:1000 }
  };
  function populateUnits(){
    const cat = document.getElementById('unitCat').value;
    const from = document.getElementById('unitFrom');
    const to = document.getElementById('unitTo');
    from.innerHTML=''; to.innerHTML='';
    Object.keys(unitDefs[cat]).forEach(u=>{
      from.innerHTML+=`<option value="${u}">${u}</option>`;
      to.innerHTML+=`<option value="${u}">${u}</option>`;
    });
    to.selectedIndex = 1;
    calcUnit();
  }
  function calcUnit(){
    const cat = document.getElementById('unitCat').value;
    const val = parseFloat(document.getElementById('unitVal').value)||0;
    const from = document.getElementById('unitFrom').value;
    const to = document.getElementById('unitTo').value;
    const base = val*unitDefs[cat][from];
    const result = base/unitDefs[cat][to];
    document.getElementById('unitOut').textContent = result.toFixed(4)+' '+to;
  }
  document.getElementById('unitCat').addEventListener('change',populateUnits);
  ['unitVal','unitFrom','unitTo'].forEach(id=>document.getElementById(id).addEventListener('input',calcUnit));
  populateUnits();
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
