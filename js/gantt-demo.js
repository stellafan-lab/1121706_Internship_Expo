// ═══════════════════════════════════════════
// 甘特圖模擬：規則移植自 gantt_from_project_info.py（滾動時間軸版）
//  - 日期容錯：TBD/Ongoing、MP、10月26日、Jul、6/E（B/M/E）、Excel 日期序號、一般日期
//  - 無年份寫法一律推定為今年
//  - 「預計MP」欄是 MP 且「下次上產測」有日期 → 單一綠色
//  - X 軸：當月前兩個月 1 日起共 14 個月；早於當月的不畫；超出軸終點的列在右側面板
//  - 時程條右緣對齊目標日，往左延伸，寬度依文字、最少 28 天
// ═══════════════════════════════════════════
(() => {
  const root = document.getElementById('gx');
  if (!root) return;

  const TODAY = new Date(2026, 8, 24);          // 以 2026/09/24 當作今天，讓示範結果固定
  const Y = TODAY.getFullYear();
  const addMonth = (y, m, d) => { const t = m + d; return [y + Math.floor(t / 12), ((t % 12) + 12) % 12]; };
  const [sy, sm] = addMonth(Y, TODAY.getMonth(), -2);
  const START = new Date(sy, sm, 1);
  const [ey, em] = addMonth(sy, sm, 14);
  const END = new Date(ey, em, 0);                // 第 14 個月的月底
  const DATA_START = new Date(Y, TODAY.getMonth(), 1);
  const DAY = 86400000;

  const C = { prod: '#FFB6C1', mp: '#C7B5E5', ready: '#90EE90', ongoing: '#D3D3D3' };
  const INVISIBLE = /[​‌‍﻿ ]/g;
  const MONTHS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
  const fmt = d => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  const md = d => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 回傳 { date, label, note } 或 null（空白）或 { bad: true }
  function parse(raw) {
    const s = raw.trim();
    if (!s) return null;
    const up = s.toUpperCase();
    if (['TBD', 'ONGOING', 'PENDING'].includes(up)) return { date: TODAY, label: 'Ongoing', note: `「${s}」→ Ongoing（灰色）` };
    if (up === 'MP') return { date: TODAY, label: 'MP' };
    if (/^\d{5}$/.test(s) && +s >= 20000 && +s <= 80000) {
      const d = new Date(new Date(1899, 11, 30).getTime() + (+s) * DAY);
      return { date: d, label: md(d), note: `「${s}」是 Excel 日期序號 → ${fmt(d)}` };
    }
    let m = s.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);
    if (m) { const d = new Date(Y, +m[1] - 1, +m[2]); return { date: d, label: s, note: `「${s}」→ ${fmt(d)}` }; }
    if (MONTHS[up.slice(0, 3)] != null && /^[A-Z]{3}/.test(up)) {
      const d = new Date(Y, MONTHS[up.slice(0, 3)], 1); return { date: d, label: s, note: `「${s}」→ ${fmt(d)}（只有月份，取 1 日）` };
    }
    m = up.match(/^(\d{1,2})\s*\/\s*([BME])$/);
    if (m) { const d = new Date(Y, +m[1] - 1, { B: 5, M: 15, E: 25 }[m[2]]); return { date: d, label: s, note: `「${s}」→ ${fmt(d)}（${m[2]} = 月${{ B: '初', M: '中', E: '底' }[m[2]]}）` }; }
    m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (m) { const d = new Date(+m[1], +m[2] - 1, +m[3]); return { date: d, label: md(d) }; }
    m = s.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (m) { const d = new Date(Y, +m[1] - 1, +m[2]); return { date: d, label: s, note: `「${s}」→ ${fmt(d)}` }; }
    return { bad: true };
  }

  const SAMPLE = [
    ['Amy', 'ALPHA-01', '10/E', '12月15日'],
    ['', 'BRAVO-02', 'Ongoing', 'Nov'],
    ['Ben', 'CHARLIE-03', '2026/11/20', 'MP'],
    ['', 'DELTA-04', '46350', '2027/3/10'],
    ['Cara', 'ECHO-05', '12/M', '2027/10/01'],
    ['', 'FOX​TROT-06', 'Dec', '2027/6/30'],
    ['Dan', 'GOLF-07', 'TBD', '2027/5/20'],
    ['', 'HOTEL-08', '', 'MP'],
  ];
  let rows = SAMPLE.map(r => [...r]);
  let result = null;   // 上一次執行的結果，視窗縮放時重畫用

  // ── Excel 表 ──
  function renderSheet() {
    root.querySelector('.gx-sheet').innerHTML = `
      <table class="gx-grid">
        <colgroup><col style="width:38px"><col style="width:18%"><col style="width:26%"><col><col><col style="width:30px"></colgroup>
        <thead><tr><th class="rn"></th><th>A</th><th>B</th><th>C</th><th>D</th><th></th></tr></thead>
        <tbody>
          <tr class="hdr"><td class="rn">1</td><td>Name</td><td>Project</td><td>下次上產測時間</td><td>預計MP時間</td><td></td></tr>
          ${rows.map((r, i) => `<tr data-r="${i}"><td class="rn">${i + 2}</td>${r.map((v, j) =>
            `<td><input data-r="${i}" data-c="${j}" value="${esc(v.replace(INVISIBLE, ''))}" spellcheck="false"></td>`).join('')}
            <td class="del"><button data-del="${i}" title="刪除這一列">×</button></td></tr>`).join('')}
        </tbody>
      </table>`;
  }

  // ── 分頁：Excel ↔ Figure 1 ──
  function setView(v) {
    root.dataset.view = v;
    if (v === 'xl') root.querySelector('.gx-log').open = false;
    root.querySelectorAll('.gx-tab').forEach(t => t.classList.toggle('active', t.dataset.view === v));
    root.querySelectorAll('.gx-view').forEach(p => p.classList.toggle('active', p.dataset.view === v));
  }

  // ── 執行（等同雙擊 .py）── show = true 時切到 Figure 1，像實際跳出圖表視窗
  function run(show) {
    const log = [`<span class="p">&gt;</span> python gantt_from_project_info.py`, `讀取 Project Info.xlsx：${rows.length} 列`];
    const blocks = [], bad = [];
    let owner = '', invisible = 0;
    rows.forEach((r, i) => {
      const clean = r.map(v => { const n = (v.match(INVISIBLE) || []).length; invisible += n; return v.replace(INVISIBLE, '').trim(); });
      if (clean[0]) owner = clean[0];                      // Name 空白 → 沿用上一列（ffill）
      const proj = clean[1];
      if (!proj) return;
      const p = parse(clean[2]), m = parse(clean[3]);
      [[p, 2], [m, 3]].forEach(([x, c]) => {
        if (x && x.bad) bad.push({ i, c, v: clean[c] });
        else if (x && x.note) log.push(`<span class="dim">第 ${i + 2} 列</span> ${esc(x.note)}`);
      });
      const P = p && !p.bad ? p : null, M = m && !m.bad ? m : null;
      const pts = [];
      if (M && M.label === 'MP' && P && !['Ongoing', 'MP'].includes(P.label)) {
        pts.push({ ...P, color: C.ready });
      } else {
        if (P) pts.push({ ...P, color: P.label === 'Ongoing' ? C.ongoing : C.prod });
        if (M) pts.push({ ...M, color: M.label === 'Ongoing' ? C.ongoing : C.mp });
        if (pts.length === 2 && +pts[0].date === +pts[1].date && pts[0].label === pts[1].label) pts.pop();
      }
      pts.forEach(pt => blocks.push({ owner, proj, ...pt, order: i }));
    });
    if (invisible) log.push(`<span class="ok">清除複製貼上夾帶的隱形字元 ${invisible} 個</span>`);
    bad.forEach(b => log.push(`<span class="err">第 ${b.i + 2} 列「${esc(b.v)}」無法辨識為日期，已略過（其他列照常出圖）</span>`));

    const future = blocks.filter(b => b.date > END);
    const early = blocks.filter(b => b.date < DATA_START);
    const shown = blocks.filter(b => b.date <= END && b.date >= DATA_START);
    early.forEach(b => log.push(`<span class="warn">第 ${b.order + 2} 列「${esc(b.label)}」→ ${fmt(b.date)} 已經過了（早於本月），不畫進圖表</span>`));
    if (future.length) log.push(`<span class="warn">${future.length} 筆超出圖表範圍 → 列在「${END.getFullYear()}/${String(END.getMonth() + 1).padStart(2, '0')} 之後行程」</span>`);
    log.push(shown.length ? `<span class="ok">✓ 甘特圖已生成（${shown.length} 個時程條）</span>` : '<span class="err">沒有可以畫的資料</span>');

    root.querySelector('.gx-con').innerHTML = log.map(l => `<div>${l}</div>`).join('');
    root.querySelector('.gx-sum').innerHTML = bad.length
      ? `<span class="err">⚠ ${bad.length} 格無法辨識為日期，已略過</span>`
      : shown.length ? `<span class="ok">✓ 甘特圖已生成（${shown.length} 個時程條）</span>` : '<span class="err">沒有可以畫的資料</span>';
    root.querySelectorAll('.gx-grid input').forEach(inp => {
      inp.classList.toggle('bad', bad.some(b => b.i === +inp.dataset.r && b.c === +inp.dataset.c));
      inp.closest('tr').classList.toggle('bad', bad.some(b => b.i === +inp.dataset.r));
    });
    result = { shown, future };
    drawChart(true);
    if (show) setView('fig');
  }

  // ── 畫圖 ──
  function drawChart(animate) {
    const fig = root.querySelector('.gx-chartbox');
    if (!result || !result.shown.length) { fig.innerHTML = '<div class="gx-empty">沒有可以畫的資料</div>'; return; }
    const { shown, future } = result;
    const owners = [...new Set(shown.map(b => b.owner))];
    const ROW = 21, GAP = 9;
    let y = 14; const rowsY = [], sepY = [], ownerY = [];
    owners.forEach((o, k) => {
      if (k) { sepY.push(y - GAP / 2 - ROW / 2 + 7); }
      const items = shown.filter(b => b.owner === o).sort((a, b) => a.order - b.order || a.date - b.date);
      const top = y;
      items.forEach(it => { rowsY.push([it, y]); y += ROW; });
      ownerY.push([o, (top + y - ROW) / 2]);
      y += GAP;
    });
    const H = y - GAP + 10;
    const span = END - START;
    const pct = d => ((d - START) / span) * 100;
    const minW = (28 * DAY / span) * 100;

    const ticks = [];
    for (let k = 0; k <= 14; k++) {
      const [ty, tm] = addMonth(sy, sm, k);
      const d = new Date(ty, tm, 1);
      if (d > END) break;
      ticks.push([d, tm === 0 ? `${tm + 1}月<br>${ty}` : `${tm + 1}月`]);
    }
    const futureHtml = future.length ? `<div class="gx-panel"><h6>${END.getFullYear()}/${String(END.getMonth() + 1).padStart(2, '0')} 之後行程</h6>
      ${[...new Set(future.map(f => f.owner))].map(o => `<div class="o">${esc(o)}</div>` + future.filter(f => f.owner === o).map(f =>
        `<div class="it"><i style="background:${f.color}"></i><span>${esc(f.proj)}</span><small>${fmt(f.date)}</small></div>`).join('')).join('')}</div>` : '';

    fig.innerHTML = `<div class="gx-scroll"><div class="gx-inner">
      <div class="gx-legend">
        <span><i style="background:${C.prod}"></i>下次上產測時間</span><span><i style="background:${C.mp}"></i>預計MP時間</span>
        <span><i style="background:${C.ready}"></i>MP且下次上產測時間</span><span><i style="background:${C.ongoing}"></i>Ongoing</span>
        <span><i class="line"></i>Current Status</span>
      </div>
      <div class="gx-body">
        <div class="gx-plotwrap">
          <div class="gx-ylab" style="height:${H}px">${ownerY.map(([o, oy]) => `<div style="top:${oy}px">${esc(o)}</div>`).join('')}</div>
          <div class="gx-plot" style="height:${H}px">
            ${ticks.map(([d]) => `<div class="gx-mline" style="left:${pct(d)}%"></div>`).join('')}
            ${sepY.map(sy2 => `<div class="gx-sep" style="top:${sy2}px"></div>`).join('')}
            <div class="gx-today" style="left:${pct(TODAY)}%"></div>
            ${rowsY.map(([b, by], n) => `<div class="gx-bar" style="top:${by}px;right:${100 - pct(b.date)}%;min-width:${minW}%;background:${b.color};${animate ? `animation-delay:${n * 0.06}s` : 'animation:none'}">${esc(b.proj)} (${esc(b.label)})</div>`).join('')}
          </div>
        </div>
        ${futureHtml}
      </div>
      <div class="gx-body" style="margin-top:0"><div class="gx-plotwrap"><div class="gx-xaxis" style="flex:1">
        ${ticks.map(([d, l]) => `<span style="left:${pct(d)}%">${l}</span>`).join('')}
      </div></div>${future.length ? '<div class="gx-panel"></div>' : ''}</div>
    </div></div>`;
  }

  // ── 版面 ──
  root.innerHTML = `
    <div class="gx-tabs">
      <button class="gx-tab active" data-view="xl">📄 Project Info.xlsx</button>
      <button class="gx-tab" data-view="fig">📊 Figure 1</button>
      <div class="gx-status">
        <details class="gx-log"><summary><span class="gx-sum"></span><em>執行紀錄</em></summary><div class="gx-con"></div></details>
        <button class="gx-sec" data-view-go="xl">✎ 回到 Excel 修改</button>
      </div>
    </div>
    <div class="gx-view active" data-view="xl">
      <div class="gx-xl">
        <div class="gx-ribbon"><b>Project Info.xlsx</b><span>檔案</span><span>常用</span><span>插入</span><span>資料</span></div>
        <div class="gx-fx"><i>fx</i><span class="gx-fxv"></span></div>
        <div class="gx-gridwrap gx-sheet"></div>
        <div class="gx-acts">
          <button class="gx-run">▶ 執行 gantt_from_project_info.py</button>
          <button class="gx-sec" data-act="add">＋ 新增一列</button>
          <button class="gx-sec" data-act="reset">↺ 還原範例</button>
          <span class="gx-tip">可接受：10/E、Nov、12月15日、2026/11/20、TBD、MP、Excel 日期序號（沒寫年份一律當今年）</span>
        </div>
      </div>
    </div>
    <div class="gx-view" data-view="fig">
      <div class="gx-chart gx-chartbox"></div>
    </div>`;
  root.dataset.view = 'xl';

  root.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.r == null) return;
    rows[+t.dataset.r][+t.dataset.c] = t.value;
    root.querySelector('.gx-fxv').textContent = t.value;
  });
  root.addEventListener('focusin', e => { if (e.target.dataset.r != null) root.querySelector('.gx-fxv').textContent = e.target.value; });
  root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.r != null) { e.preventDefault(); run(true); } });
  root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view) setView(b.dataset.view);
    else if (b.dataset.viewGo) setView(b.dataset.viewGo);
    else if (b.classList.contains('gx-run')) run(true);
    else if (b.dataset.act === 'add') {
      rows.push(['', '', '', '']); renderSheet();
      root.querySelector(`input[data-r="${rows.length - 1}"][data-c="0"]`).focus();
    } else if (b.dataset.act === 'reset') { rows = SAMPLE.map(r => [...r]); renderSheet(); run(); }
    else if (b.dataset.del != null) { rows.splice(+b.dataset.del, 1); renderSheet(); run(); }
  });

  renderSheet();
  run();
})();
