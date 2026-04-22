/* ============================================================
   AURUM v5 — PART 5: JS FEATURES
   add modal · autocomplete · auto-scale · log food
   food DB screen · settings · BMR · progress charts
   Call init() at the bottom of your HTML after both JS files
   ============================================================ */

// ─── ADD MODAL ───
function openAdd(meal) {
  selMeal = meal || suggestMeal || 'Breakfast';
  clearF(); buildEP(); refreshMSG(); mTab('c',0); opOv('addOv'); hap(8);
}
function closeAdd() { clOv('addOv'); }
function clearF() {
  ['mNm','mAmt','mKc','mPr','mCr','mFt','mSu','mFi','mSo'].forEach(id => {
    const e = document.getElementById(id); if (e) e.value = '';
  });
  document.getElementById('mUnit').value = 'g';
  document.getElementById('acBox').classList.remove('show');
  selEM = EM[0];
}
function mTab(t, i) {
  document.querySelectorAll('.tab').forEach((el,j) => el.classList.toggle('on', j===i));
  document.getElementById('tC').style.display  = t==='c' ? 'block' : 'none';
  document.getElementById('tR').style.display  = t==='r' ? 'block' : 'none';
  document.getElementById('tM').style.display  = t==='m' ? 'block' : 'none';
  document.getElementById('cAct').style.display = t==='c' ? 'flex'  : 'none';
  if (t==='r') renderRecent(); if (t==='m') renderMyM();
}
function buildEP() {
  document.getElementById('epRw').innerHTML =
    EM.map(e => `<div class="ep ${e===selEM?'on':''}" onclick="pickE('${e}')">${e}</div>`).join('');
}
function pickE(e)  { selEM = e; buildEP(); hap(6); }
function buildMSG() {
  document.getElementById('msG').innerHTML =
    MEALS.map(m => `<div class="msb ${m===selMeal?'on':''}" onclick="pickM('${m}')">${m}</div>`).join('');
}
function refreshMSG() {
  document.querySelectorAll('.msb').forEach((b,i) => b.classList.toggle('on', MEALS[i]===selMeal));
}
function pickM(m) { selMeal = m; refreshMSG(); hap(6); }

// ─── AUTOCOMPLETE ───
function onNm() {
  const q  = document.getElementById('mNm').value.toLowerCase().trim();
  const ac = document.getElementById('acBox');
  if (q.length < 2) { ac.classList.remove('show'); return; }
  const seen = new Set(), matches = [];
  for (const f of [...myFoods, ...recent]) {
    const k = f.name.toLowerCase();
    if (!seen.has(k) && k.includes(q)) { seen.add(k); matches.push(f); if (matches.length === 5) break; }
  }
  if (!matches.length) { ac.classList.remove('show'); return; }
  acData = matches;
  ac.innerHTML = matches.map((f,i) => `
    <div class="ac-i" onclick="fillAC(${i})">
      <span class="ac-em">${f.emoji||'🍽'}</span>
      <div class="ac-inf">
        <div class="ac-nm">${f.name}</div>
        <div class="ac-mc">P${fmt(f.protein)}g·C${fmt(f.carbs)}g·F${fmt(f.fat)}g${f.amount?' · '+f.amount+' '+f.unit:''}</div>
        ${f.useCount ? `<div class="ac-us">×${f.useCount}</div>` : ''}
      </div>
      <div class="ac-kc">${Math.round(f.cal)}</div>
    </div>`).join('');
  ac.classList.add('show');
}
function fillAC(i) { fillF(acData[i]); document.getElementById('acBox').classList.remove('show'); hap(8); }
function fillF(f) {
  document.getElementById('mNm').value  = f.name;
  document.getElementById('mKc').value  = f.cal      || '';
  document.getElementById('mPr').value  = f.protein  || '';
  document.getElementById('mCr').value  = f.carbs    || '';
  document.getElementById('mFt').value  = f.fat      || '';
  document.getElementById('mSu').value  = f.sugar    || '';
  document.getElementById('mFi').value  = f.fiber    || '';
  document.getElementById('mSo').value  = f.sodium   || '';
  document.getElementById('mAmt').value = f.amount   || '';
  document.getElementById('mUnit').value = f.unit    || 'g';
  selEM = f.emoji || EM[0]; buildEP();
}

// ─── AUTO-SCALE (per 100g) ───
function autoSc() {
  const nm   = document.getElementById('mNm').value.trim();
  const amt  = parseFloat(document.getElementById('mAmt').value);
  const unit = document.getElementById('mUnit').value;
  if (!amt) return;
  const base = myFoods.find(f => f.name.toLowerCase()===nm.toLowerCase() && f.p100 && (unit==='g'||unit==='ml'));
  if (!base) return;
  const r = amt / 100;
  [['mKc','cal'],['mPr','protein'],['mCr','carbs'],['mFt','fat'],
   ['mSu','sugar'],['mFi','fiber'],['mSo','sodium']].forEach(([id,key]) => {
    document.getElementById(id).value = fmt((base.p100[key]||0) * r);
  });
}

// ─── LOG FOOD ───
function logFood() {
  const name = document.getElementById('mNm').value.trim();
  if (!name) { document.getElementById('mNm').focus(); return; }
  const amt  = parseFloat(document.getElementById('mAmt').value) || null;
  const unit = document.getElementById('mUnit').value;
  const f = {
    id: Date.now(), name, emoji: selEM, amount: amt, unit,
    cal:     +document.getElementById('mKc').value || 0,
    protein: +document.getElementById('mPr').value || 0,
    carbs:   +document.getElementById('mCr').value || 0,
    fat:     +document.getElementById('mFt').value || 0,
    sugar:   +document.getElementById('mSu').value || 0,
    fiber:   +document.getElementById('mFi').value || 0,
    sodium:  +document.getElementById('mSo').value || 0
  };
  if (!foods[selMeal]) foods[selMeal] = [];
  foods[selMeal].push(f); sv(); addRC(f);
  if (document.getElementById('togSv').classList.contains('on')) svMF(f, amt, unit);
  hap(15); render(); closeAdd(); toast('✓  ' + f.name, 'gld');
}
function svMF(f, amt, unit) {
  const p100 = (amt && (unit==='g'||unit==='ml'))
    ? { cal:f.cal/amt*100, protein:f.protein/amt*100, carbs:f.carbs/amt*100,
        fat:f.fat/amt*100, sugar:f.sugar/amt*100, fiber:f.fiber/amt*100, sodium:f.sodium/amt*100 }
    : null;
  const idx = myFoods.findIndex(x => x.name.toLowerCase() === f.name.toLowerCase());
  const entry = {...f, useCount:1, cat:'Other', p100};
  if (idx >= 0) myFoods[idx] = {...entry, useCount:(myFoods[idx].useCount||0)+1};
  else myFoods.unshift(entry);
  wls('mf', JSON.stringify(myFoods));
}
function addRC(f) {
  recent = recent.filter(x => x.name !== f.name); recent.unshift({...f});
  if (recent.length > 20) recent.pop(); wls('rc', JSON.stringify(recent));
}
function renderRecent() {
  const el = document.getElementById('rQL');
  if (!recent.length) { el.innerHTML=`<div style="text-align:center;padding:28px 0;color:var(--t2);font-size:12px">No recent foods</div>`; return; }
  el.innerHTML = recent.slice(0,12).map((f,i) => `
    <div class="qi" onclick="qLog(${i},'r')">
      <span class="qi-em">${f.emoji||'🍽'}</span>
      <div class="qi-inf"><div class="qi-nm">${f.name}</div><div class="qi-mc">P${fmt(f.protein)}g·C${fmt(f.carbs)}g·F${fmt(f.fat)}g${f.amount?' · '+f.amount+' '+f.unit:''}</div></div>
      <div class="qi-kc">${Math.round(f.cal)}</div>
    </div>`).join('');
}
function renderMyM() {
  const q  = (document.getElementById('mySrch')?.value || '').toLowerCase();
  const el = document.getElementById('myQL');
  const sl = [...myFoods].sort((a,b)=>(b.useCount||0)-(a.useCount||0)).filter(f=>f.name.toLowerCase().includes(q));
  if (!sl.length) { el.innerHTML=`<div style="text-align:center;padding:28px 0;color:var(--t2);font-size:12px">No saved foods</div>`; return; }
  el.innerHTML = sl.map((f,i) => `
    <div class="qi" onclick="qLog(${myFoods.indexOf(f)},'m')">
      <span class="qi-em">${f.emoji||'🍽'}</span>
      <div class="qi-inf"><div class="qi-nm">${f.name}</div><div class="qi-mc">P${fmt(f.protein)}g·C${fmt(f.carbs)}g·F${fmt(f.fat)}g</div>${f.useCount?`<span class="qi-us">×${f.useCount} times</span>`:''}</div>
      <div class="qi-kc">${Math.round(f.cal)}</div>
    </div>`).join('');
}
function qLog(i, src) {
  const f = src==='r' ? recent[i] : myFoods[i]; if (!f) return;
  if (!foods[selMeal]) foods[selMeal] = [];
  foods[selMeal].push({...f, id:Date.now()}); addRC(f);
  const mf = myFoods.find(x => x.name===f.name);
  if (mf) { mf.useCount = (mf.useCount||0)+1; wls('mf', JSON.stringify(myFoods)); }
  hap(15); sv(); render(); closeAdd(); toast('✓  '+f.name, 'gld');
}

// ─── FOOD DB SCREEN ───
function buildCats() {
  document.getElementById('catRow').innerHTML =
    CATS_LIST.map(c => `<div class="chip ${c===curCat?'on':''}" onclick="setCat('${c}')">${c}</div>`).join('');
}
function setCat(c) { curCat = c; buildCats(); renderFD(); }
function renderFD() {
  const q  = (document.getElementById('fdSrch')?.value || '').toLowerCase();
  const el = document.getElementById('fdList');
  const sl = [...myFoods].sort((a,b)=>(b.useCount||0)-(a.useCount||0))
    .filter(f => (curCat==='All'||(f.cat||'Other')===curCat) && (!q||f.name.toLowerCase().includes(q)));
  if (!sl.length) {
    el.innerHTML=`<div style="text-align:center;padding:52px 0;color:var(--t2)"><div style="font-size:36px;margin-bottom:12px">🍽</div><div style="font-size:12px">No foods saved yet</div><div style="font-size:10px;color:var(--gold);margin-top:6px">Log a food and save it to build your library</div></div>`;
    return;
  }
  el.innerHTML = sl.map(f => `
    <div class="fi">
      <div class="fi-em">${f.emoji||'🍽'}</div>
      <div class="fi-inf">
        <div class="fi-nm">${f.name}</div>
        <div class="fi-mc">P${fmt(f.protein)}g·C${fmt(f.carbs)}g·F${fmt(f.fat)}g·${Math.round(f.cal)} kcal</div>
        ${f.useCount ? `<div class="fi-fr">Logged ${f.useCount}×</div>` : ''}
      </div>
      <div class="fi-kc">${Math.round(f.cal)}</div>
      <button class="fi-ab" onclick="qaFD('${f.name.replace(/'/g,"\\'").replace(/"/g,'\\"')}')">+</button>
    </div>`).join('');
}
function qaFD(name) {
  const f = myFoods.find(x => x.name===name); if (!f) return;
  if (!foods['Breakfast']) foods['Breakfast'] = [];
  foods['Breakfast'].push({...f, id:Date.now()}); addRC(f);
  f.useCount = (f.useCount||0)+1; wls('mf', JSON.stringify(myFoods));
  hap(12); sv(); render(); renderFD(); toast('✓  Added to Breakfast','gld');
}

// ─── SETTINGS ───
function syncGI() {
  document.getElementById('gCal').value    = goals.cal;
  document.getElementById('gProt').value   = goals.protein;
  document.getElementById('gCarbs').value  = goals.carbs;
  document.getElementById('gFat').value    = goals.fat;
  document.getElementById('gSugar').value  = goals.sugar;
  document.getElementById('gFiber').value  = goals.fiber;
  document.getElementById('gSodium').value = goals.sodium;
  document.getElementById('gWater').value  = goals.water;
  if (weightLog.length) document.getElementById('bmrWt').value = weightLog[weightLog.length-1].val;
}
function saveGoals() {
  goals = {
    cal:     +document.getElementById('gCal').value    || 2000,
    protein: +document.getElementById('gProt').value   || 150,
    carbs:   +document.getElementById('gCarbs').value  || 200,
    fat:     +document.getElementById('gFat').value    || 65,
    sugar:   +document.getElementById('gSugar').value  || 50,
    fiber:   +document.getElementById('gFiber').value  || 25,
    sodium:  +document.getElementById('gSodium').value || 2300,
    water:   +document.getElementById('gWater').value  || 8
  };
  wls('goals', JSON.stringify(goals)); hap(12); render(); toast('✓  Goals saved','gld');
}
function syncPrefs() {
  const map = { sugar:'tSu', fiber:'tFi', sodium:'tSo', water:'tWa' };
  Object.keys(prefs).forEach(k => { const el=document.getElementById(map[k]); if(el) el.classList.toggle('on',prefs[k]); });
}
function tPref(k, el) { prefs[k]=!prefs[k]; el.classList.toggle('on',prefs[k]); wls('prefs',JSON.stringify(prefs)); hap(8); render(); }
function clearToday()  { MEALS.forEach(m => foods[m]=[]); sv(); render(); toast('Today cleared',''); }
function clearFoods()  { myFoods=[]; wls('mf','[]'); renderFD(); toast('Library cleared',''); }
function clearStreak() { streak={}; wls('sd','{}'); render(); toast('Streak reset',''); }

// ─── BMR / TDEE ───
function calcBMR() {
  const age = +document.getElementById('bmrAge').value || 25;
  const wt  = +document.getElementById('bmrWt').value  || 70;
  const ht  = +document.getElementById('bmrHt').value  || 175;
  const sex = document.getElementById('bmrSex').value;
  const act = +document.getElementById('bmrAct').value || 1.55;
  const bmr  = sex==='m' ? 10*wt+6.25*ht-5*age+5 : 10*wt+6.25*ht-5*age-161;
  const tdee = Math.round(bmr * act);
  document.getElementById('bmrV').textContent  = Math.round(bmr) + ' kcal';
  document.getElementById('tdeeV').textContent = tdee + ' kcal';
  document.getElementById('cutV').textContent  = (tdee-500) + ' kcal';
  document.getElementById('bulkV').textContent = (tdee+300) + ' kcal';
  document.getElementById('bmrCard').classList.add('show');
  logWeight(); hap(12);
}

// ─── PROGRESS SCREEN ───
function setChartRange(n) {
  _chartRange = n;
  document.getElementById('ct7').classList.toggle('on',  n===7);
  document.getElementById('ct30').classList.toggle('on', n===30);
  drawLineChart();
}
function renderProgress() {
  const t = tots();
  const p=t.protein, c=t.carbs, f=t.fat;
  const kT = (p*4)+(c*4)+(f*9) || 1;
  const pp=Math.round(p*4/kT*100), cp=Math.round(c*4/kT*100), fp=Math.round(f*9/kT*100);
  document.getElementById('dlP').textContent=fmt(p)+'g'; document.getElementById('dlPp').textContent=pp+'%';
  document.getElementById('dlC').textContent=fmt(c)+'g'; document.getElementById('dlCp').textContent=cp+'%';
  document.getElementById('dlF').textContent=fmt(f)+'g'; document.getElementById('dlFp').textContent=fp+'%';
  document.getElementById('dCn').textContent = Math.round(t.cal);
  drawDonut(pp,cp,fp); drawHBars(t); drawLineChart(); drawGauges(t); drawWeightChart();
  const wk=[]; for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);wk.push(d.toISOString().slice(0,10));}
  const we  = wk.map(k=>streak[k]).filter(Boolean);
  const avg = we.length ? Math.round(we.reduce((a,e)=>a+(e.cal||0),0)/we.length) : 0;
  document.getElementById('scAvg').textContent = avg||'—';
  document.getElementById('scGH').textContent  = we.filter(e=>e.goalMet).length;
  document.getElementById('scBP').textContent  = Math.max(...we.map(e=>e.protein||0), Math.round(t.protein)) || '—';
  drawCal();
}

function drawLineChart() {
  const cvs = document.getElementById('lineC'); if (!cvs) return;
  const W=cvs.parentElement.offsetWidth||340, H=90;
  cvs.width=W*DPR; cvs.height=H*DPR;
  const ctx=cvs.getContext('2d'); ctx.scale(DPR,DPR);
  const n=_chartRange, days=[], today=new Date(), todayCal=tots().cal;
  for(let i=n-1;i>=0;i--){const d=new Date(today);d.setDate(today.getDate()-i);days.push(d.toISOString().slice(0,10));}
  const vals    = days.map((d,i)=>i===n-1?todayCal:(streak[d]?.cal||0));
  const max     = Math.max(...vals,goals.cal,1);
  const pL=2,pR=2,pT=12,pB=4,W2=W-pL-pR,H2=H-pT-pB;
  const xPt = i => pL+i/(days.length-1)*W2;
  const yPt = v => pT+H2-(v/max)*H2;
  ctx.clearRect(0,0,W,H);
  // goal dashed line
  ctx.setLineDash([3,5]); ctx.strokeStyle='rgba(200,168,75,.18)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pL,yPt(goals.cal)); ctx.lineTo(W-pR,yPt(goals.cal)); ctx.stroke();
  ctx.setLineDash([]);
  const bestIdx = vals.indexOf(Math.max(...vals));
  const pts     = vals.map((v,i)=>({x:xPt(i),y:yPt(v),v}));
  // area gradient
  const gr = ctx.createLinearGradient(0,pT,0,H-pB);
  gr.addColorStop(0,'rgba(200,168,75,.2)'); gr.addColorStop(1,'rgba(200,168,75,0)');
  ctx.beginPath(); ctx.moveTo(pts[0].x,H-pB);
  pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.lineTo(pts[pts.length-1].x,H-pB); ctx.closePath();
  ctx.fillStyle=gr; ctx.fill();
  // bezier line
  ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length;i++){
    const mx=(pts[i-1].x+pts[i].x)/2;
    ctx.bezierCurveTo(mx,pts[i-1].y,mx,pts[i].y,pts[i].x,pts[i].y);
  }
  ctx.strokeStyle='rgba(200,168,75,.85)'; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.stroke();
  // dots
  pts.forEach((p,i)=>{
    if(p.v===0&&i!==n-1)return;
    const isT=days[i]===dk(), isBest=i===bestIdx&&p.v>0;
    ctx.beginPath(); ctx.arc(p.x,p.y,isT||isBest?4:2.5,0,Math.PI*2);
    ctx.fillStyle=isT?'#C8A84B':isBest?'var(--green)':'rgba(200,168,75,.55)'; ctx.fill();
    if(isT)   {ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fillStyle='rgba(200,168,75,.12)';ctx.fill();}
    if(isBest&&!isT){ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fillStyle='rgba(84,164,118,.12)';ctx.fill();}
  });
  const step=n<=7?1:Math.ceil(n/7);
  document.getElementById('lcX').innerHTML=days.filter((_,i)=>i%step===0||i===n-1).map(d=>{
    const isT=d===dk(); return`<span class="lc-xl ${isT?'tod':''}">${new Date(d).getDate()}</span>`;
  }).join('');
}

function drawHBars(t) {
  const el = document.getElementById('hbarList'); if (!el) return;
  const items = [
    {label:'Protein',val:fmt(t.protein),goal:goals.protein,unit:'g',color:'var(--P)'},
    {label:'Carbs',  val:fmt(t.carbs),  goal:goals.carbs,  unit:'g',color:'var(--C)'},
    {label:'Fat',    val:fmt(t.fat),    goal:goals.fat,    unit:'g',color:'var(--F)'},
    ...(prefs.sugar ? [{label:'Sugar',val:fmt(t.sugar),goal:goals.sugar,unit:'g',color:'var(--Su)'}]:[]),
    ...(prefs.fiber ? [{label:'Fiber',val:fmt(t.fiber),goal:goals.fiber,unit:'g',color:'var(--green)'}]:[]),
  ];
  el.innerHTML = items.map(it => {
    const pct = clamp(it.val/it.goal*100, 0,100);
    return `<div class="hbar-row">
      <div class="hbar-lbl">${it.label}</div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${it.color}"></div></div>
      <div class="hbar-v" style="color:${it.color}">${it.val}<span style="font-size:8px;color:var(--t2);font-weight:400">/${it.goal}${it.unit}</span></div>
    </div>`;
  }).join('');
}

function drawDonut(pp,cp,fp) {
  const cvs=document.getElementById('donutC'); if(!cvs) return;
  cvs.width=104*DPR; cvs.height=104*DPR;
  const ctx=cvs.getContext('2d'); ctx.scale(DPR,DPR);
  const cx=52,cy=52,r=40,inner=26;
  const segs=[{pct:pp/100,c:'#6AA6C6'},{pct:cp/100,c:'#C27F52'},{pct:fp/100,c:'#967ABE'}];
  let a=-Math.PI/2;
  segs.forEach(s=>{
    if(s.pct<=0) return;
    const end=a+s.pct*Math.PI*2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a,end);ctx.closePath();ctx.fillStyle=s.c;ctx.fill();
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r+1,end-.03,end+.03);ctx.closePath();ctx.fillStyle='#1B2027';ctx.fill();
    a=end;
  });
  ctx.beginPath();ctx.arc(cx,cy,inner,0,Math.PI*2);ctx.fillStyle='#1B2027';ctx.fill();
}

function drawGauges(t) {
  [['gP','gPl','gPs',t.protein,goals.protein,'g'],
   ['gC','gCl','gCs',t.carbs,  goals.carbs,  'g'],
   ['gF','gFl','gFs',t.fat,    goals.fat,    'g']].forEach(([id,lid,sid,val,goal,u]) => {
    const pct=clamp(val/goal,0,1);
    const el=document.getElementById(id);  if(el)  el.style.strokeDashoffset=163-(163*pct);
    const ll=document.getElementById(lid); if(ll)  ll.textContent=Math.round(pct*100)+'%';
    const sl=document.getElementById(sid); if(sl)  sl.textContent=fmt(val)+'/'+goal+u;
  });
}

function drawWeightChart() {
  const empty=document.getElementById('wtEmpty'), cvs=document.getElementById('wtC'),
        xax=document.getElementById('wtX'), stats=document.getElementById('wtStats');
  if (!weightLog.length) {
    empty.style.display='block'; cvs.style.display='none'; xax.style.display='none'; stats.style.display='none'; return;
  }
  empty.style.display='none'; cvs.style.display='block'; xax.style.display='flex'; stats.style.display='flex';
  const data=weightLog.slice(-20), vals=data.map(e=>e.val);
  const minV=Math.min(...vals)*.99, maxV=Math.max(...vals)*1.005;
  const W=cvs.parentElement.offsetWidth||340, H=80;
  cvs.width=W*DPR; cvs.height=H*DPR;
  const ctx=cvs.getContext('2d'); ctx.scale(DPR,DPR);
  const xPt=i=>2+i/(vals.length-1)*(W-4);
  const yPt=v=>H-4-((v-minV)/(maxV-minV||1))*(H-8);
  ctx.clearRect(0,0,W,H);
  const pts=vals.map((v,i)=>({x:xPt(i),y:yPt(v)}));
  const gr=ctx.createLinearGradient(0,0,0,H);
  gr.addColorStop(0,'rgba(85,146,180,.22)'); gr.addColorStop(1,'rgba(85,146,180,0)');
  ctx.beginPath(); ctx.moveTo(pts[0].x,H); pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.lineTo(pts[pts.length-1].x,H); ctx.closePath();
  ctx.fillStyle=gr; ctx.fill();
  ctx.beginPath(); pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
  ctx.strokeStyle='rgba(85,146,180,.8)'; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.stroke();
  const lp=pts[pts.length-1];
  ctx.beginPath();ctx.arc(lp.x,lp.y,4,0,Math.PI*2);ctx.fillStyle='var(--W)';ctx.fill();
  ctx.beginPath();ctx.arc(lp.x,lp.y,8,0,Math.PI*2);ctx.fillStyle='rgba(85,146,180,.15)';ctx.fill();
  xax.innerHTML=data.filter((_,i)=>i===0||i===data.length-1||i%Math.ceil(data.length/4)===0).map(e=>{
    const d=new Date(e.date); return`<span class="wt-xl">${d.getMonth()+1}/${d.getDate()}</span>`;
  }).join('');
  const cur=vals[vals.length-1], chg=+(cur-vals[0]).toFixed(1), avg=+(vals.reduce((a,v)=>a+v,0)/vals.length).toFixed(1);
  document.getElementById('wtCur').textContent=cur+'kg';
  const chgEl=document.getElementById('wtChg');
  chgEl.textContent=(chg>=0?'+':'')+chg+'kg'; chgEl.style.color=chg>0?'var(--red)':'var(--green)';
  document.getElementById('wtAvg').textContent=avg+'kg';
}

function drawCal() {
  const el=document.getElementById('calG'); if(!el) return;
  const hdrs=['M','T','W','T','F','S','S'].map(d=>`<div class="cal-dh">${d}</div>`).join('');
  const today=new Date(), start=new Date(today);
  start.setDate(today.getDate()-27);
  const dow=start.getDay()===0?6:start.getDay()-1;
  start.setDate(start.getDate()-dow);
  const cells=[], todayK=dk();
  for(let i=0;i<35;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const k=d.toISOString().slice(0,10), isFut=d>today, isT=k===todayK, sd=streak[k];
    let cls='cal-c';
    if(isFut)cls+=' fut'; else if(sd?.goalMet)cls+=' met'; else if(sd?.logged)cls+=' log';
    if(isT)cls+=' tod';
    cells.push(`<div class="${cls}">${d.getDate()}</div>`);
  }
  el.innerHTML=hdrs+cells.join('');
}

// ─── KICK OFF ───
init();
