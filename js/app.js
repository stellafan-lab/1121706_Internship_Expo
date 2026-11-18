// ═══════════════════════════════════════════
// 實習成果網站（競賽展版）
// 所有 Demo 皆為前端模擬，使用虛構資料
// ═══════════════════════════════════════════

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// ═══════════════════════════════════════════
// PAGE NAVIGATION
// ═══════════════════════════════════════════
function goPage(id, push = true) {
  const pg = document.getElementById('page-' + id);
  if (!pg) id = 'home';
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + id));
  $$('.sb-item').forEach(n => n.classList.toggle('active', n.dataset.page === id));
  const title = document.getElementById('page-' + id).dataset.title;
  $('#bc-cur').textContent = title || '';
  $('#bc-sep').style.display = title ? '' : 'none';
  if (push && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(onPageShown, 120);
}

function onPageShown() {
  animateCounters();
  animatePerf();
  if ($('#page-p4').classList.contains('active')) adc.start(); else adc.stop();
}

function animateCounters() {
  $$('.page.active [data-count]').forEach(el => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = parseInt(el.dataset.count, 10);
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + 1, target);
      el.textContent = cur;
      if (cur >= target) clearInterval(t);
    }, Math.max(40, 500 / target));
  });
}

function animatePerf() {
  $$('.page.active .perf-fill').forEach(b => {
    if (b.dataset.done) return;
    b.dataset.done = '1';
    setTimeout(() => { b.style.width = b.dataset.w + '%'; }, 200);
  });
}

// ── mobile sidebar ──
function openSidebar() { $('#sidebar').classList.add('open'); $('#sb-mask').classList.add('show'); }
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sb-mask').classList.remove('show'); }

// ═══════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════
function initLightbox() {
  const lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  let frames = [], idx = 0;
  const open = i => {
    frames = $$('.page.active .img-card[data-src]');
    if (!frames[i]) return;
    idx = i;
    lbImg.src = frames[i].dataset.src;
    lbCap.textContent = frames[i].dataset.cap || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
  const step = d => { if (frames.length) open((idx + d + frames.length) % frames.length); };
  document.addEventListener('click', e => {
    const fr = e.target.closest('.img-card[data-src]');
    if (!fr) return;
    open($$('.page.active .img-card[data-src]').indexOf(fr));
  });
  $('#lb-close').addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  $('#lb-prev').addEventListener('click', () => step(-1));
  $('#lb-next').addEventListener('click', () => step(1));
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
}

// ═══════════════════════════════════════════
// JOURNEY GANTT  (axis: Feb 1 → Sep 30, 8 months)
// ═══════════════════════════════════════════
function initJourney() {
  const box = $('#journey-gantt');
  if (!box) return;
  const pos = (m, d) => ((m - 2) + (d - 1) / 30) / 8 * 100;
  const rows = [
    ['甘特圖自動化', [2, 25], [7, 8], '#FB923C', false],
    ['設備借用系統', [4, 16], [9, 30], '#22C55E', true],
    ['Error Code 查詢', [5, 1], [9, 30], '#3B82F6', true],
    ['ADC-Tester', [7, 15], [9, 4], '#EF4444', false],
    ['Log CPK Validator', [9, 18], [9, 26], '#8B5CF6', false],
  ];
  rows.forEach(([name, s, e, c, open], i) => {
    const r = document.createElement('div');
    r.className = 'gb-row';
    const l = pos(...s), w = Math.max(2.5, pos(...e) - l);
    r.innerHTML = `<b>${name}</b><i class="${open ? 'open' : ''}" style="left:${l}%;width:${w}%;--gc:${c};animation-delay:${i * 0.12}s"></i>`;
    box.appendChild(r);
  });
}

// ═══════════════════════════════════════════
// SELF EVALUATION STARS
// ═══════════════════════════════════════════
function initEval() {
  $$('.eval-stars').forEach(el => {
    const n = +el.dataset.score;
    el.innerHTML = Array.from({ length: 5 }, (_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('');
    el.setAttribute('aria-label', `${n} / 5`);
  });
}

// ═══════════════════════════════════════════
// BORROW STEPPER
// ═══════════════════════════════════════════
function initBorrowDemo() {
  const steps = $$('.borrow-step'), stages = $$('.borrow-stage');
  steps.forEach((s, idx) => s.addEventListener('click', () => {
    steps.forEach((x, i) => { x.classList.toggle('active', i === idx); x.classList.toggle('done', i < idx); });
    stages.forEach((stg, i) => stg.classList.toggle('active', i === idx));
  }));
}

// ═══════════════════════════════════════════
// ADC-TESTER FAULT ISOLATION DEMO
// 規則同實機：連續失敗 3 次 → 斷電重啟；重試超過上限 → 停用
// ═══════════════════════════════════════════
const adc = (() => {
  const FAIL_LIMIT = 3, RETRY_LIMIT = 3;
  const CH = [
    { n: 'CH1', l: '12 V 輸入', v: 12.0, cur: true },
    { n: 'CH2', l: '3.3 V', v: 3.3 },
    { n: 'CH3', l: '1.05 V', v: 1.05, knob: true },
    { n: 'CH4', l: '0.9 V', v: 0.9, knob: true },
  ].map(c => ({ ...c, plugged: true, st: 'ok', fails: 0, retries: 0, val: c.v, amp: 120, pass: true }));
  const ST = { ok: 'OK', fault: 'FAULT', recovering: 'RECOVERING', disabled: 'DISABLED' };
  const TOL = 0.05;                 // 標稱值 ±5% 內判定 PASS
  const KMAX = 3.3;                 // 旋鈕輸出 0 ~ 3.3 V
  let mode = 'new', timer = null, t0 = Date.now(), knobV = 0.9;
  const src = c => (c.knob ? knobV : c.v);
  const sample = c => { c.val = src(c) * (1 + (Math.random() - 0.5) * 0.004); };

  const stamp = () => { const s = Math.floor((Date.now() - t0) / 1000); return `[${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}]`; };
  function log(msg, cls = '') {
    const el = $('#adc-log');
    el.insertAdjacentHTML('beforeend', `<div class="${cls}"><span class="dim">${stamp()}</span> ${msg}</div>`);
    while (el.children.length > 60) el.firstChild.remove();
    el.scrollTop = el.scrollHeight;
  }

  // 卡片只建立一次，之後只更新內容，避免每秒重建按鈕造成點擊遺失
  function build() {
    $('#adc-grid').innerHTML = CH.map((c, i) => `<div class="adc-ch" data-i="${i}">
        <div class="adc-ch-h"><span class="adc-ch-n">${c.n}<small>${c.l}</small></span><span class="adc-st"></span></div>
        <div class="adc-v"><span></span><small>V</small><em class="adc-judge"></em></div>
        <div class="adc-i"></div>
        <div class="adc-spec">標稱 ${c.v} V ±5%${c.knob ? '・接旋鈕' : ''}</div>
        <button class="adc-btn" data-i="${i}"></button></div>`).join('');
  }

  function render() {
    const busDown = mode === 'legacy' && CH.some(c => !c.plugged);
    $$('#adc-grid .adc-ch').forEach((card, i) => {
      const c = CH[i];
      const st = mode === 'legacy' ? (busDown ? 'fault' : 'ok') : c.st;
      const dead = st !== 'ok';
      card.className = `adc-ch ${st}`;
      const badge = $('.adc-st', card);
      badge.className = `adc-st ${st}`;
      badge.textContent = ST[st];
      $('.adc-v span', card).textContent = dead ? '---' : c.val.toFixed(c.v >= 10 ? 2 : 3);
      $('.adc-i', card).textContent = c.cur ? (dead ? 'I = --- mA' : `I = ${c.amp.toFixed(1)} mA`) : '';
      const judge = $('.adc-judge', card);
      judge.textContent = dead ? '' : c.pass ? 'PASS' : 'FAIL';
      judge.className = `adc-judge ${dead ? '' : c.pass ? 'pass' : 'fail'}`;
      const btn = $('.adc-btn', card);
      // 停用時：線還沒接回就先顯示「接回」，接回後才顯示「一鍵復原」
      const act = mode === 'new' && c.st === 'disabled' && c.plugged ? 'reset' : 'toggle';
      btn.dataset.act = act;
      btn.classList.toggle('plugged-out', act === 'toggle' && !c.plugged);
      btn.textContent = act === 'reset' ? '🔄 一鍵復原' : c.plugged ? '✂️ 拔掉訊號線' : '🔌 接回訊號線';
    });
    $('#adc-chain').innerHTML = mode === 'legacy'
      ? ['USB Dongle', ...CH.map(c => c.n)].map((s, i) => `<span class="${i && !CH[i - 1].plugged ? 'hit' : ''}">${s}</span>`).join(' → ') + '<span style="border:none">（同一條匯流排）</span>'
      : '';
  }

  // 判定：只在 PASS/FAIL 翻轉時寫 log，避免洗版
  function judgeAll(quiet) {
    CH.forEach(c => {
      const ok = Math.abs(c.val - c.v) / c.v <= TOL;
      if (ok !== c.pass && !quiet) {
        log(ok ? `${c.n} ${c.val.toFixed(3)} V 回到標稱範圍 → PASS`
               : `${c.n} ${c.val.toFixed(3)} V 超出 ${c.v} V ±5% → FAIL`, ok ? 'ok' : 'err');
      }
      c.pass = ok;
    });
  }

  function tick() {
    CH.forEach(c => {
      sample(c);
      c.amp = 120 + (Math.random() - 0.5) * 1.6;
    });
    judgeAll();
    if (mode === 'legacy') { render(); return; }
    CH.forEach(c => {
      if (c.st === 'disabled') return;
      if (c.plugged) {
        if (c.st === 'fault') { c.st = 'recovering'; log(`${c.n} 偵測到訊號，重新初始化晶片…`, 'warn'); }
        else if (c.st === 'recovering') { log(`${c.n} 讀值恢復 → OK，全程不影響其他通道`, 'ok'); c.st = 'ok'; c.fails = 0; c.retries = 0; }
        return;
      }
      c.fails++;
      if (c.st === 'ok') { c.st = 'fault'; log(`${c.n} 讀取失敗（I2C Remote I/O error），其他通道照常掃描`, 'err'); }
      else if (c.st === 'recovering') c.st = 'fault';
      if (c.fails >= FAIL_LIMIT) {
        c.fails = 0; c.retries++;
        if (c.retries > RETRY_LIMIT) { c.st = 'disabled'; log(`${c.n} 超過重試上限 → 標記停用（DISABLED），不再重試`, 'warn'); }
        else { c.st = 'recovering'; log(`${c.n} 連續失敗 ${FAIL_LIMIT} 次 → 切斷 GPIO 電源再重新上電（第 ${c.retries} 次）`, 'warn'); }
      }
    });
    render();
  }

  function onClick(e) {
    const b = e.target.closest('.adc-btn');
    if (!b || b.disabled) return;
    const c = CH[+b.dataset.i];
    if (b.dataset.act === 'reset') { c.st = 'ok'; c.retries = 0; c.fails = 0; log(`${c.n} 由儀表板一鍵復原 → OK`, 'ok'); }
    else {
      c.plugged = !c.plugged;
      log(c.plugged ? `🔌 ${c.n} 訊號線已接回` : `✂️ ${c.n} 的 SDA 訊號線被拔掉`, 'dim');
      if (mode === 'legacy') {
        const down = CH.some(x => !x.plugged);
        log(down ? `串接方案：匯流排被拉住，${CH.length} 路全部讀不到值` : `串接方案：匯流排恢復，${CH.length} 路恢復讀值`, down ? 'err' : 'ok');
      }
    }
    render();
  }

  function setMode(m) {
    mode = m;
    $$('.adc-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    $('#adc-demo').classList.toggle('legacy', m === 'legacy');
    CH.forEach(c => { c.plugged = true; c.st = 'ok'; c.fails = 0; c.retries = 0; });
    $('#adc-log').innerHTML = '';
    log(m === 'new' ? '新設計：每路經多工器獨立通道、獨立供電。試著拔掉任一路。' : '現行串接方案：每片量測板共用同一條匯流排。試著拔掉任一路。', 'dim');
    render();
  }

  // 旋鈕：拖曳角度 -135° ~ +135° 對應 0 ~ 3.3 V；滑桿與鍵盤也可以調
  function setKnob(v) {
    knobV = Math.max(0, Math.min(KMAX, Math.round(v * 100) / 100));
    const deg = -135 + (knobV / KMAX) * 270;
    const k = $('#adc-knob');
    k.style.setProperty('--deg', deg + 'deg');
    k.style.setProperty('--pct', (knobV / KMAX) * 75 + '%');
    k.setAttribute('aria-valuenow', knobV);
    $('#adc-knob-v').textContent = knobV.toFixed(2);
    $('#adc-knob-r').value = knobV;
    CH.filter(c => c.knob).forEach(sample);
    judgeAll();
    render();
  }

  function initKnob() {
    const k = $('#adc-knob');
    if (!k) return;
    // 相對轉動：只看滑鼠「轉了多少度」來加減，按下時不跳、轉到底停住、往回轉立刻有反應
    // （絕對角度的做法在底部 90° 死角會卡住，轉過頭還會從 3.3 V 跳回 0 V）
    let last = null, raw = 0;            // raw：累加用的精確值，顯示時才取到 0.01 V
    const angle = e => {
      const r = k.getBoundingClientRect();
      return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
    };
    const release = () => { last = null; };
    k.addEventListener('pointerdown', e => {
      e.preventDefault();                       // 避免拖曳時選到文字
      k.setPointerCapture(e.pointerId);
      last = angle(e);
      raw = knobV;
    });
    k.addEventListener('pointermove', e => {
      if (last === null) return;
      const a = angle(e);
      let d = a - last;
      if (d > 180) d -= 360; else if (d < -180) d += 360;   // 跨過 ±180° 時接續
      last = a;
      if (!d) return;
      raw = Math.max(0, Math.min(KMAX, raw + (d / 270) * KMAX));
      setKnob(raw);
    });
    k.addEventListener('pointerup', release);
    k.addEventListener('pointercancel', release);
    k.addEventListener('lostpointercapture', release);
    k.addEventListener('wheel', e => { e.preventDefault(); setKnob(knobV + (e.deltaY < 0 ? 0.05 : -0.05)); }, { passive: false });
    k.addEventListener('keydown', e => {
      const step = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05 }[e.key];
      if (step) { e.preventDefault(); setKnob(knobV + step); }
    });
    $('#adc-knob-r').addEventListener('input', e => setKnob(+e.target.value));
    setKnob(knobV);
  }

  function init() {
    if (!$('#adc-grid')) return;
    build();
    initKnob();
    $('#adc-grid').addEventListener('click', onClick);
    $$('.adc-mode button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    setMode('new');
  }
  return {
    init,
    start() { if (!timer && $('#adc-grid')) timer = setInterval(tick, 1000); },
    stop() { clearInterval(timer); timer = null; },
  };
})();

// ═══════════════════════════════════════════
// PERMISSION SWITCHER（借用系統：訪客／保管人）
// ═══════════════════════════════════════════
function initPerm() {
  $$('.perm-demo').forEach(demo => {
    $$('.perm-btn', demo).forEach(btn => btn.addEventListener('click', () => {
      $$('.perm-btn', demo).forEach(b => b.classList.toggle('active', b === btn));
      $$('.perm-content', demo).forEach(c => c.classList.toggle('active', c.dataset.role === btn.dataset.role));
    }));
  });
}

// ═══════════════════════════════════════════
// 三欄以上的表格：標記 .stack，手機版改成卡片（欄名寫進 data-label）
// ═══════════════════════════════════════════
function initStackTables() {
  $$('table.dt').forEach(t => {
    const heads = $$('thead th', t).map(th => th.textContent.trim());
    if (heads.length < 3) return;
    t.classList.add('stack');
    $$('tbody tr', t).forEach(tr => $$('td', tr).forEach((td, i) => { td.dataset.label = heads[i] || ''; }));
  });
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  $$('.sb-item[data-page]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goPage(a.dataset.page); }));
  $('#menu-btn').addEventListener('click', openSidebar);
  $('#sb-mask').addEventListener('click', closeSidebar);
  window.addEventListener('hashchange', () => goPage(location.hash.slice(1) || 'home', false));

  initLightbox();
  initJourney();
  initEval();
  initBorrowDemo();
  initPerm();
  initStackTables();
  adc.init();

  goPage(location.hash.slice(1) || 'home', false);

  const fab = $('#fab');
  window.addEventListener('scroll', () => fab.classList.toggle('show', window.scrollY > 400));
  fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});
