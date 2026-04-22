/* ============================================================
   AURUM v5 — PART 4: JS CORE
   constants · state · storage · boot · nav · render home
   meals · swipe-delete · streak · sparkline · water · exercise
   ============================================================ */
'use strict';

// ─── CONSTANTS ───
const MEALS = ['Breakfast','Lunch','Dinner','Snacks'];
const EM = ['🍗','🥩','🐟','🥚','🥛','🧀','🥦','🥗','🍎','🍌','🍞','🍚','🍝',
  '🥜','🧈','🍳','🥤','☕','🍫','🍕','🍔','🌮','🥙','🍜','🫐','🥑',
  '🧆','🥐','🍤','🍱','🥞','🌽','🥕','🫙','🧃','🍠','🥣','🍶','🧁','🌯'];
const CATS_LIST = ['All','Protein','Carbs','Fats','Dairy','Veggies','Drinks','Snacks','Other'];
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const MEAL_ICONS = { Breakfast:'🍳', Lunch:'🥗', Dinner:'🍽', Snacks:'🍎' };
const MEAL_TIMES = { Breakfast:[6,10], Lunch:[11,14], Dinner:[17,21], Snacks:[14,17] };
const MEAL_SPLIT = { Breakfast:.25, Lunch:.35, Dinner:.30, Snacks:.10 };
const EX_RATES  = { Running:8.5, Walking:3.5, Cycling:7, Gym:6,
  Swimming:7.5, HIIT:10, Yoga:2.5, Basketball:7.5 };

// ─── STATE ───
let goals = { cal:2000, protein:150, carbs:200, fat:65, sugar:50, fiber:25, sodium:2300, water:8 };
let prefs = { sugar:false, fiber:false, sodium:false, water:true };
let foods = {}, myFoods = [], recent = [], water = 0;
let streak = {}, exercise = 0, weightLog = [];
let selEM = EM[0], selMeal = 'Breakfast', curCat = 'All';
let acData = [], suggestMeal = 'Breakfast', _chartRange = 7;
let _animFrame = {};

// ─── STORAGE HELPERS ───
const rls = k => { try { return localStorage.getItem(k) } catch { return null } };
const wls = (k,v) => { try { localStorage.setItem(k,v) } catch {} };
const dk  = () => new Date().toISOString().slice(0,10);
const fmt = n => +(Math.round((+n)*10)/10) || 0;
const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
const hap = (t=10) => { try { navigator.vibrate && navigator.vibrate(t) } catch {} };

// ─── ANIMATED COUNTER ───
function animNum(id, target, suffix='', dur=600) {
  const el = document.getElementById(id); if (!el) return;
  const start = parseFloat(el.textContent) || 0;
  if (Math.abs(target - start) < .5) { el.textContent = Math.round(target) + suffix; return; }
  const t0 = performance.now();
  const tick = now => {
    const p    = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * ease) + suffix;
    if (p < 1) _animFrame[id] = requestAnimationFrame(tick);
  };
  if (_animFrame[id]) cancelAnimationFrame(_animFrame[id]);
  _animFrame[id] = requestAnimationFrame(tick);
}

// ─── BOOT ───
function init() {
  const g = rls('goals'); if (g) goals = {...goals, ...JSON.parse(g)};
  const p = rls('prefs'); if (p) prefs = {...prefs, ...JSON.parse(p)};
  const f = rls('f_'+dk()); foods = f ? JSON.parse(f) : {};
  MEALS.forEach(m => { if (!foods[m]) foods[m] = []; });
  const mf = rls('mf'); myFoods  = mf ? JSON.parse(mf) : [];
  const rc = rls('rc'); recent   = rc ? JSON.parse(rc) : [];
  const w  = rls('w_'+dk()); water    = w  ? parseFloat(w)  : 0;
  const sd = rls('sd'); streak   = sd ? JSON.parse(sd) : {};
  const ex = rls('ex_'+dk()); exercise = ex ? parseFloat(ex) : 0;
  const wl = rls('wl'); weightLog = wl ? JSON.parse(wl) : [];
  setDate(); buildMeals(); buildEP(); buildMSG(); buildCats();
  syncGI(); syncPrefs(); updStreak(); mealSuggest();
  render(); setTimeout(render, 180); setTimeout(setupSwipe, 300);
}

function setDate() {
  const d = new Date();
  document.getElementById('hDate').textContent =
    d.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
}

// ─── NAV ───
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  const ni = document.getElementById('n-' + id); if (ni) ni.classList.add('on');
  hap(8);
  if (id === 'progress') renderProgress();
  if (id === 'foods')    renderFD();
  if (id === 'settings') { syncGI(); syncPrefs(); }
}

// ─── TOTALS ───
function tots() {
  return Object.values(foods).flat().reduce((a,f) => ({
    cal:     a.cal     + (f.cal     || 0),
    protein: a.protein + (f.protein || 0),
    carbs:   a.carbs   + (f.carbs   || 0),
    fat:     a.fat     + (f.fat     || 0),
    sugar:   a.sugar   + (f.sugar   || 0),
    fiber:   a.fiber   + (f.fiber   || 0),
    sodium:  a.sodium  + (f.sodium  || 0),
    n:       a.n + 1
  }), {cal:0, protein:0, carbs:0, fat:0, sugar:0, fiber:0, sodium:0, n:0});
}
function mealTots(m) { return (foods[m]||[]).reduce((a,f) => a + (f.cal||0), 0); }

// ─── DAY SCORE ───
function score(t) {
  const cr = t.cal / goals.cal;
  let s = cr>=.9&&cr<=1.1 ? 30 : cr>=.8&&cr<=1.2 ? 18 : t.cal>0 ? 8 : 0;
  s += Math.round(clamp(t.protein/goals.protein, 0,1) * 30);
  s += Math.round(clamp(t.carbs/goals.carbs,     0,1) * 20);
  s += Math.round(clamp(t.fat/goals.fat,         0,1) * 20);
  return Math.min(100, s);
}

// ─── MEAL TIME SUGGESTION ───
function mealSuggest() {
  const h = new Date().getHours();
  let meal = null, icon = '🍽';
  for (const [m,[start,end]] of Object.entries(MEAL_TIMES)) {
    if (h >= start && h <= end && !(foods[m] && foods[m].length)) {
      meal = m; icon = MEAL_ICONS[m]; break;
    }
  }
  suggestMeal = meal || 'Snacks';
  const bar = document.getElementById('suggestBar');
  if (meal) {
    bar.style.display = 'flex';
    document.getElementById('sbIc').textContent  = icon;
    document.getElementById('sbMeal').textContent = meal;
  } else { bar.style.display = 'none'; }
}

// ─── RENDER HOME ───
function render() {
  const t = tots();
  const circ = 332, pct = clamp(t.cal/goals.cal, 0,1), over = t.cal > goals.cal;
  document.getElementById('rPr').style.strokeDashoffset =
    over ? 0 : circ - circ*pct;
  document.getElementById('rOv').style.strokeDashoffset =
    over ? circ - circ*clamp((t.cal-goals.cal)/goals.cal, 0,1) : circ;
  animNum('rN', Math.round(t.cal));
  const rem = Math.max(0, Math.round(goals.cal - t.cal));
  animNum('remN', rem);
  document.getElementById('gDisp').textContent = goals.cal.toLocaleString();

  // Net calories
  const net = Math.round(t.cal - exercise);
  const netEl = document.getElementById('netCal');
  if (exercise > 0) {
    netEl.style.display = 'inline-block';
    netEl.textContent = `⚡ Net: ${net} kcal`;
  } else { netEl.style.display = 'none'; }

  // Over-goal warning
  if (rem > 0 && rem < 200 && t.cal > 0) toast(`⚠️ Only ${rem} kcal left!`, 'warn');

  document.getElementById('rN').style.color    = over ? 'var(--red)' : 'var(--gold)';
  document.getElementById('remN').style.color  = over ? 'var(--red)' : 'var(--text)';

  // Macro strip
  document.getElementById('mP').textContent = fmt(t.protein) + 'g';
  document.getElementById('mC').textContent = fmt(t.carbs)   + 'g';
  document.getElementById('mF').textContent = fmt(t.fat)     + 'g';
  document.getElementById('bP').style.width = clamp(t.protein/goals.protein*100, 0,100) + '%';
  document.getElementById('bC').style.width = clamp(t.carbs/goals.carbs*100,     0,100) + '%';
  document.getElementById('bF').style.width = clamp(t.fat/goals.fat*100,         0,100) + '%';

  renderBudget(t);

  const sc = t.n ? score(t) : 0;
  document.getElementById('tcW').textContent  = fmt(water) + '/' + goals.water;
  document.getElementById('wBf').style.width  = clamp(water/goals.water*100, 0,100) + '%';
  document.getElementById('tcEx').textContent = Math.round(exercise);
  document.getElementById('exBf').style.width = clamp(exercise/600*100, 0,100) + '%';
  document.getElementById('tcS').textContent  = t.n ? sc : '—';
  document.getElementById('sBf').style.width  = sc + '%';

  const xShow = prefs.sugar || prefs.fiber || prefs.sodium;
  document.getElementById('xRow').style.display = xShow ? 'flex' : 'none';
  if (xShow) {
    document.getElementById('xSu').textContent  = fmt(t.sugar)  + 'g';
    document.getElementById('xFi').textContent  = fmt(t.fiber)  + 'g';
    document.getElementById('xSo').textContent  = fmt(t.sodium) + 'mg';
    document.getElementById('xSuB').style.width = clamp(t.sugar/goals.sugar*100,   0,100) + '%';
    document.getElementById('xFiB').style.width = clamp(t.fiber/goals.fiber*100,   0,100) + '%';
    document.getElementById('xSoB').style.width = clamp(t.sodium/goals.sodium*100, 0,100) + '%';
  }
  renderMeals(); renderStreak(); drawMiniSparkline(); mealSuggest();
}

// ─── BUDGET SPLIT ───
function renderBudget(t) {
  const el = document.getElementById('budgetRow');
  el.innerHTML = MEALS.map(m => {
    const alloc = Math.round(goals.cal * MEAL_SPLIT[m]);
    const eaten = Math.round(mealTots(m));
    const rem   = Math.max(0, alloc - eaten);
    const pct   = clamp(eaten/alloc*100, 0, 100);
    return `<div class="bud">
      <div class="bud-nm">${m.slice(0,5)}</div>
      <div class="bud-cal">${eaten}</div>
      <div class="bud-rem">${rem} left</div>
      <div class="bud-bar"><div class="bud-bf" style="width:${pct}%;background:${pct>100?'var(--red)':'var(--gold)'}"></div></div>
    </div>`;
  }).join('');
}

// ─── MEALS ───
function buildMeals() { MEALS.forEach(m => { if (!foods[m]) foods[m] = []; }); renderMeals(); }
function renderMeals() {
  document.getElementById('mgWrap').innerHTML = MEALS.map(m => {
    const items = foods[m] || [];
    const cal   = items.reduce((a,f) => a + (f.cal||0), 0);
    const alloc = Math.round(goals.cal * MEAL_SPLIT[m]);
    const body  = items.length
      ? items.map(f => `
          <div class="mi-wrap" data-meal="${m}" data-id="${f.id}">
            <div class="mi-delete-bg">🗑</div>
            <div class="mi" data-meal="${m}" data-id="${f.id}">
              <div class="mi-em">${f.emoji||'🍽'}</div>
              <div class="mi-inf">
                <div class="mi-nm">${f.name}</div>
                <div class="mi-sb">${f.amount?f.amount+' '+f.unit+' · ':''}<span style="color:var(--P)">P${fmt(f.protein)}g</span>·<span style="color:var(--C)">C${fmt(f.carbs)}g</span>·<span style="color:var(--F)">F${fmt(f.fat)}g</span></div>
              </div>
              <div class="mi-r">
                <div class="mi-kc">${Math.round(f.cal)}</div>
                <button class="mi-dl" onclick="delF('${m}',${f.id})">✕</button>
              </div>
            </div>
          </div>`).join('')
      : `<div class="mg-emp">Nothing logged</div>`;
    return `<div class="mg" id="mg${m}">
      <div class="mg-h" onclick="togMG('${m}')">
        <div>
          <div class="mg-nm">${MEAL_ICONS[m]} ${m}</div>
          <div class="mg-kc">${cal>0 ? Math.round(cal)+' / '+alloc+' kcal' : 'Budget: '+alloc+' kcal'}</div>
        </div>
        <div class="mg-hr">
          <span class="mg-ch">▾</span>
          <div class="mg-ab" onclick="event.stopPropagation();openAdd('${m}')">+</div>
        </div>
      </div>
      <div class="mg-bd">${body}</div>
    </div>`;
  }).join('');
  setupSwipe();
}
function togMG(m) { document.getElementById('mg'+m)?.classList.toggle('closed'); hap(6); }
function delF(m,id) { hap(20); foods[m] = foods[m].filter(f => f.id !== id); sv(); render(); toast('Removed',''); }
function sv() { wls('f_'+dk(), JSON.stringify(foods)); updStreak(); }

// ─── SWIPE TO DELETE ───
function setupSwipe() {
  document.querySelectorAll('.mi-wrap').forEach(wrap => {
    const mi = wrap.querySelector('.mi');
    const bg = wrap.querySelector('.mi-delete-bg');
    if (!mi || !bg || mi._sw) return;
    mi._sw = true;
    let startX = 0, dx = 0, swiping = false;
    mi.addEventListener('touchstart', e => { startX = e.touches[0].clientX; dx = 0; swiping = true; }, {passive:true});
    mi.addEventListener('touchmove', e => {
      if (!swiping) return;
      dx = e.touches[0].clientX - startX;
      if (dx < 0) { const tx = Math.max(dx, -70); mi.style.transform = `translateX(${tx}px)`; bg.style.opacity = Math.min(-tx/70, 1); }
    }, {passive:true});
    mi.addEventListener('touchend', () => {
      swiping = false;
      if (dx < -50) {
        mi.style.transform = 'translateX(-70px)'; bg.style.opacity = '1'; hap(25);
        setTimeout(() => {
          const meal = wrap.dataset.meal, id = parseInt(wrap.dataset.id);
          if (foods[meal]) foods[meal] = foods[meal].filter(f => f.id !== id);
          sv(); render();
        }, 200);
      } else { mi.style.transform = 'translateX(0)'; bg.style.opacity = '0'; }
    });
  });
}

// ─── STREAK ───
function updStreak() {
  const t = tots();
  if (Object.values(foods).flat().length > 0) {
    const sc = score(t);
    streak[dk()] = { logged:true, goalMet:sc>=70, cal:Math.round(t.cal), protein:Math.round(t.protein), score:sc };
    wls('sd', JSON.stringify(streak));
  }
}
function calcStreak() {
  let n = streak[dk()]?.logged ? 1 : 0;
  const d = new Date(); d.setDate(d.getDate()-1);
  for (let i=0; i<365; i++) {
    if (streak[d.toISOString().slice(0,10)]?.logged) n++; else break;
    d.setDate(d.getDate()-1);
  }
  return n;
}
function renderStreak() {
  const n = calcStreak();
  document.getElementById('stN').textContent = n;
  const scEl = document.getElementById('scSt'); if (scEl) scEl.textContent = n;
  const days = []; for (let i=6; i>=0; i--) { const d=new Date(); d.setDate(d.getDate()-i); days.push(d.toISOString().slice(0,10)); }
  document.getElementById('stW').innerHTML = days.map(d => {
    const s = streak[d], isT = d === dk();
    return `<div class="dot ${s?.goalMet?'hit':s?.logged?'part':isT?'now':''}"></div>`;
  }).join('');
}
function drawMiniSparkline() {
  const cvs = document.getElementById('miniSpk');
  const W = cvs.offsetWidth || 70, H = 40;
  cvs.width = W*DPR; cvs.height = H*DPR;
  const ctx = cvs.getContext('2d'); ctx.scale(DPR, DPR);
  const days = []; for (let i=6; i>=0; i--) { const d=new Date(); d.setDate(d.getDate()-i); days.push(d.toISOString().slice(0,10)); }
  const todayCal = tots().cal;
  const vals = days.map((d,i) => i===6 ? todayCal : (streak[d]?.cal||0));
  const max  = Math.max(...vals, goals.cal, 1);
  const pts  = vals.map((v,i) => ({ x: i/(vals.length-1)*(W-4)+2, y: H-4-(v/max)*(H-8) }));
  ctx.clearRect(0,0,W,H);
  const gr = ctx.createLinearGradient(0,0,0,H);
  gr.addColorStop(0,'rgba(200,168,75,.3)'); gr.addColorStop(1,'rgba(200,168,75,0)');
  ctx.beginPath(); ctx.moveTo(pts[0].x,H); pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.lineTo(pts[pts.length-1].x,H); ctx.closePath();
  ctx.fillStyle = gr; ctx.fill();
  ctx.beginPath(); pts.forEach((p,i) => i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
  ctx.strokeStyle='rgba(200,168,75,.75)'; ctx.lineWidth=1.5; ctx.lineJoin='round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(pts[6].x, pts[6].y, 2.5, 0, Math.PI*2);
  ctx.fillStyle='#C8A84B'; ctx.fill();
}

// ─── WATER ───
function openWater() { document.getElementById('wInp').value = fmt(water); opOv('wOv'); }
function wA(n) { water = Math.max(0, +(water+n).toFixed(2)); document.getElementById('wInp').value = fmt(water); hap(8); }
function svWater() { water = parseFloat(document.getElementById('wInp').value)||0; wls('w_'+dk(),water); clOv('wOv'); render(); toast('💧 Updated',''); }

// ─── EXERCISE ───
function openExercise() {
  document.getElementById('exNm').value=''; document.getElementById('exDur').value=''; document.getElementById('exCal').value='';
  opOv('exOv');
}
function fillEx(name, perHour) {
  document.getElementById('exNm').value = name;
  const dur = parseFloat(document.getElementById('exDur').value) || 30;
  document.getElementById('exCal').value = Math.round(perHour * dur / 60);
}
function calcExCal() {
  const nm  = document.getElementById('exNm').value;
  const dur = parseFloat(document.getElementById('exDur').value) || 0;
  const rate = EX_RATES[nm] || 5;
  document.getElementById('exCal').value = Math.round(rate * dur / 60 * 70);
}
function svExercise() {
  exercise = parseFloat(document.getElementById('exCal').value) || 0;
  wls('ex_'+dk(), exercise); clOv('exOv'); render();
  toast('💪 ' + document.getElementById('exNm').value + ' logged', 'gld'); hap(15);
}

// ─── WEIGHT LOG ───
function logWeight() {
  const v = parseFloat(document.getElementById('bmrWt').value);
  if (!v || v<20 || v>300) return;
  const today = dk();
  weightLog = weightLog.filter(e => e.date !== today);
  weightLog.push({date:today, val:v});
  weightLog.sort((a,b) => a.date.localeCompare(b.date));
  if (weightLog.length > 90) weightLog = weightLog.slice(-90);
  wls('wl', JSON.stringify(weightLog));
}

// ─── REPEAT YESTERDAY ───
function repeatLastMeal() {
  const yd = new Date(); yd.setDate(yd.getDate()-1);
  const yk = yd.toISOString().slice(0,10);
  const yf = rls('f_'+yk);
  if (!yf) { toast('No data from yesterday',''); return; }
  const yFoods = JSON.parse(yf); let added = 0;
  MEALS.forEach(m => {
    if (yFoods[m]?.length) yFoods[m].forEach(f => { foods[m].push({...f, id:Date.now()+Math.random()}); added++; });
  });
  if (!added) { toast('Nothing logged yesterday',''); return; }
  sv(); render(); toast(`↺ Copied ${added} items`, 'gld'); hap(15);
}
function copyYesterday() { repeatLastMeal(); }

// ─── MODAL HELPERS ───
function opOv(id) { document.getElementById(id).classList.add('open'); }
function clOv(id) { document.getElementById(id).classList.remove('open'); }
function bgC(e,id) { if (e.target === document.getElementById(id)) { clOv(id); hap(6); } }

// ─── TOAST ───
let _toastT;
function toast(msg, cls) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'toast' + (cls ? ' '+cls : '');
  el.classList.add('show'); clearTimeout(_toastT);
  _toastT = setTimeout(() => el.classList.remove('show'), 2600);
}
