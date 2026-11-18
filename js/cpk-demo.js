// ═══════════════════════════════════════════
// Log 格式檢查模擬（示範版）
//  規則說明文字取自實際工具；log 為虛構資料，只示範其中 10 條規則。
//  CPK 工具的讀法：固定跳過每行開頭 20 字（日期時間），再用位置取測項名稱與量測值；
//  依檔名順序一份一份讀，遇到第一份不合格就停住，後面的檔案都不會被處理。
// ═══════════════════════════════════════════
(() => {
  const root = document.getElementById('cvx');
  if (!root) return;

  const RULES = {
    R01: { sev: 'fatal', title: '缺開頭日期時間', problem: '開頭應為「2026/09/14 10:18:15」格式的日期時間，後接空格或 TAB，此行沒有。', impact: '讀錯位置、抓到亂碼 → 程式停住，跑不出 CPK', fix: '讓 log 這些行補上開頭的日期時間。' },
    R03: { sev: 'fatal', title: '量測值含非數字字元', problem: '量測值與上下限只能含數字、小數點、負號，此行有其他字元。', impact: '數值不合法 → 立刻停住，跑不出 CPK', fix: '檢查測試程式輸出設定，或確認 log 是否被人為改過。' },
    R05: { sev: 'fatal', title: '上下限缺左括號', problem: '上下限應為「( 下限 , 上限 )」，此行有 ) 卻沒有 (。', impact: '找不到左括號 → 程式當掉關閉', fix: '確認限值格式完整，通常是輸出被截斷。' },
    R06: { sev: 'fatal', title: '測項區塊缺結束行', problem: '每段測項結束需有一行收尾（如 Test Time: 0.75 sec），此段沒有。', impact: '後面測項和通過標記全被吃掉 → 沒有產出', fix: '確認測試沒中途中斷，或 log 是否被剪貼過。' },
    R07: { sev: 'fatal', title: '缺結尾通過標記', problem: '找不到代表 DUT 測試通過的標記。', impact: '沒有這個標記就不寫檔 → 跑不出 CPK', fix: 'FAIL 的 log 本就沒有。若應為 PASS，確認測試是否跑完。' },
    R08: { sev: 'warn', title: '行過長', problem: '此行超過 255 個字，工具一次只能讀 255 個字。', impact: '被切成兩段讀，工具回報的行號會對不上', fix: '通常是校正資料的長行，可不理會。' },
    R09: { sev: 'warn', title: '表頭缺欄位', problem: '表頭應有 MODEL、WS ID、SN、TEST PC、MT VER，缺了其中幾個。', impact: 'CPK 跑得出來，但檔名會錯、SN 會空白', fix: '確認測試程式的表頭設定完整。' },
    R15: { sev: 'warn', title: '上下限缺右括號', problem: '此行上下限沒有用 ) 收尾。工具靠 ) 判斷是否為測項。', impact: '不會當掉，但這個測項不算進 CPK', fix: '確認限值格式是否完整。' },
    R12: { sev: 'info', title: 'MT 版本不一致', problem: '同一次檢查的 log 出現不同 MT VER。', impact: '拆成不同 CPK 檔，每個版本樣本變少', fix: '確認是否混到不同批次。' },
    R13: { sev: 'info', title: 'log 份數不足', problem: 'CPK 是統計數字，至少需 2 台 DUT 的 log。', impact: '資料不足，不產出 CPK', fix: '多收集幾份 log 再一起檢查。' },
  };
  const SEV = { fatal: '不合格', warn: '注意', info: '參考' };
  const VERD = { NG: '不合格', WARN: '注意', OK: '合格' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ── 虛構 log ──
  const ITEMS = [
    ['RF', 'TX_POWER_2G', '18.42', '15.00', '21.00'], ['RF', 'TX_POWER_5G', '17.95', '15.00', '21.00'],
    ['RF', 'EVM_2G', '-32.1', '-99.00', '-28.00'], ['RF', 'EVM_5G', '-33.4', '-99.00', '-28.00'],
    ['RF', 'RX_SENS_2G', '-78.2', '-99.00', '-70.00'], ['RF', 'RX_SENS_5G', '-71.5', '-99.00', '-65.00'],
    ['PWR', 'VCC_3V3', '3.291', '3.135', '3.465'], ['PWR', 'VCC_1V05', '1.048', '0.998', '1.103'],
    ['BT', 'BT_TX_POWER', '6.12', '0.00', '10.00'],
  ];
  function makeLog(sn, opt = {}) {
    let t = 0;
    const ts = () => { const s = 3 + t++; return `2026/09/01 10:12:${String(s).padStart(2, '0')} `; };
    const L = [];
    const head = [['MODEL', 'DEMO-01'], ['WS ID', 'FT'], ['SN', sn], ['TEST PC', 'PC-01'], ['MT VER', opt.ver || 'v1.00']];
    head.filter(([k]) => !(opt.dropHead || []).includes(k)).forEach(([k, v]) => L.push(ts() + `${k.padEnd(8)}:  ${v}`));
    L.push(ts() + '===== TEST ITEM START =====');
    ITEMS.forEach(([c, n, v, lo, hi], i) => {
      let line = `${c.padEnd(4)}${n.padEnd(14)}:  ${opt.badVal === i ? v + 'dB' : v}  ( ${lo} , ${hi} )`;
      if (opt.noRb === i) line = line.replace(' )', '');
      if (opt.noLb === i) line = line.replace('( ', '');
      L.push(((opt.noTs || []).includes(i) ? '' : ts()) + line);
      if (opt.long === i) L.push(ts() + 'Freq: 5250:' + Array.from({ length: 40 }, (_, k) => (-109.5 + (k % 4) * 0.5).toFixed(2)).join(','));
    });
    if (!opt.noBlockEnd) L.push(ts() + 'Test Time: 0.75 sec');
    L.push(ts() + 'RESULT  :  PASS');
    if (!opt.noEnd) L.push(ts() + 'ALL TEST PASSED');
    return L;
  }
  const FILES = [
    { name: 'DEMO01_SN0001.log', lines: makeLog('SN0001'), hint: '正常' },
    { name: 'DEMO01_SN0002.log', lines: makeLog('SN0002', { noTs: [2, 3, 4, 5] }), hint: '缺日期時間' },
    { name: 'DEMO01_SN0003.log', lines: makeLog('SN0003', { long: 4, noRb: 7 }), hint: '行過長、缺右括號' },
    { name: 'DEMO01_SN0004.log', lines: makeLog('SN0004', { badVal: 5 }), hint: '量測值非數字' },
    { name: 'DEMO01_SN0005.log', lines: makeLog('SN0005', { noEnd: true }), hint: '缺通過標記' },
    { name: 'DEMO01_SN0006.log', lines: makeLog('SN0006', { ver: 'v1.01', dropHead: ['TEST PC'] }), hint: 'MT 版本不同、表頭缺欄位' },
  ];

  // ── 檢查一份 log ──
  const TS = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}[ \t]/;
  const NUM = /^-?\d+(\.\d+)?$/;
  function check(file) {
    const f = [];
    const add = (id, ln) => { let x = f.find(y => y.id === id); if (!x) f.push(x = { id, lines: [] }); x.lines.push(ln); };
    const info = { 'log 格式': 'Demo 格式', '機種 MODEL': '—', '站別 WS ID': '—', '序號 SN': '—', '測試電腦': '—', 'MT 版本': '—' };
    const KEY = { 'MODEL': '機種 MODEL', 'WS ID': '站別 WS ID', 'SN': '序號 SN', 'TEST PC': '測試電腦', 'MT VER': 'MT 版本' };
    let inBlock = false, blockEnded = false, items = 0;
    file.lines.forEach((raw, i) => {
      const ln = i + 1;
      if (raw.length > 255) add('R08', ln);
      if (!TS.test(raw)) { add('R01', ln); return; }
      const body = raw.slice(20).replace(/\t/g, ' ');
      const hm = body.match(/^(MODEL|WS ID|SN|TEST PC|MT VER)\s*:\s*(.+)$/);
      if (hm) { info[KEY[hm[1]]] = hm[2].trim(); return; }
      if (body.includes('TEST ITEM START')) { inBlock = true; return; }
      if (inBlock && /^Test Time:/.test(body)) { inBlock = false; blockEnded = true; return; }
      if (!inBlock) return;
      const w = body.trim().split(/\s+/);
      if (!/^(RF|PWR|BT)$/.test(w[0])) return;
      items++;
      if (!NUM.test(w[3] || '')) add('R03', ln);
      if (body.includes(')') && !body.includes('(')) add('R05', ln);
      else if (body.includes('(') && !body.includes(')')) add('R15', ln);
    });
    if (!blockEnded) add('R06', file.lines.length);
    const passed = file.lines.some(l => l.includes('ALL TEST PASSED'));
    if (!passed) add('R07', file.lines.length);
    const miss = Object.entries(KEY).filter(([, v]) => info[v] === '—').map(([k]) => k);
    if (miss.length) add('R09', 1);
    info['測項數'] = items; info['通過標記'] = passed ? '有' : '無'; info['總行數'] = file.lines.length;
    const verdict = f.some(x => RULES[x.id].sev === 'fatal') ? 'NG' : f.some(x => RULES[x.id].sev === 'warn') ? 'WARN' : 'OK';
    f.sort((a, b) => ['fatal', 'warn', 'info'].indexOf(RULES[a.id].sev) - ['fatal', 'warn', 'info'].indexOf(RULES[b.id].sev));
    return { name: file.name, lines: file.lines, findings: f, info, verdict, miss };
  }

  // ── 狀態 ──
  const S = { picked: new Set([0, 1, 2, 5]), filter: 'all', sel: null };

  function runBatch() {
    const reps = FILES.filter((_, i) => S.picked.has(i)).map(check).sort((a, b) => a.name.localeCompare(b.name));
    const cross = [];
    const vers = [...new Set(reps.map(r => r.info['MT 版本']))];
    if (vers.length > 1) cross.push({ id: 'R12', detail: vers.join('、') });
    if (reps.length === 1) cross.push({ id: 'R13', detail: '目前只有 1 份' });
    const firstNg = reps.findIndex(r => r.verdict === 'NG');
    reps.forEach((r, i) => { r.skipped = firstNg >= 0 && i > firstNg; });
    return { reps, cross, firstNg };
  }

  function firstIssue(r) {
    if (r.verdict === 'OK') return '沒有問題';
    const x = r.findings[0];
    return `第 ${x.lines[0]} 行：${RULES[x.id].title}${x.lines.length > 1 ? `（共 ${x.lines.length} 處）` : ''}`;
  }

  function detail(r) {
    const cards = r.findings.map(x => {
      const R = RULES[x.id], ln = x.lines[0];
      const from = Math.max(1, ln - 2), to = Math.min(r.lines.length, ln + 2);
      const code = r.lines.slice(from - 1, to).map((l, k) => {
        const n = from + k, shown = l.length > 110 ? l.slice(0, 110) + '…' : l;
        return `<div class="cvx-cl ${n === ln ? 'hit' : ''}"><span>${n}</span><code>${esc(shown) || ' '}</code></div>`;
      }).join('');
      const extra = x.id === 'R09' ? `（缺：${r.miss.join('、')}）` : '';
      return `<div class="cvx-issue ${R.sev}">
        <div class="cvx-issue-h"><span class="cvx-sev ${R.sev}">${SEV[R.sev]}</span><b>${R.title}</b><em>第 ${ln} 行${x.lines.length > 1 ? `（共 ${x.lines.length} 處）` : ''}</em></div>
        <dl><dt>問題</dt><dd>${R.problem}${extra}</dd><dt>影響</dt><dd>${R.impact}</dd><dt>怎麼辦</dt><dd class="fix">${R.fix}</dd></dl>
        <div class="cvx-code">${code}</div></div>`;
    }).join('');
    return `<div class="cvx-sec">檔案詳細<small>${esc(r.name)}</small></div>
      <div class="cvx-info">${Object.entries(r.info).map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>
      ${cards || '<div class="cvx-ok">✓ 這份 log 格式沒有問題，CPK 應可正常產出。</div>'}`;
  }

  function render() {
    const { reps, cross, firstNg } = runBatch();
    if (S.sel && !reps.some(r => r.name === S.sel)) S.sel = null;
    const cnt = { NG: 0, WARN: 0, OK: 0 };
    reps.forEach(r => cnt[r.verdict]++);
    const all = reps.length ? (cnt.NG ? 'NG' : cnt.WARN ? 'WARN' : 'OK') : null;
    const main = firstNg >= 0 ? reps[firstNg].findings[0] : null;
    const shown = reps.filter(r => S.filter === 'all' || r.verdict === S.filter);

    const pick = FILES.map((f, i) => `<button class="cvx-file ${S.picked.has(i) ? 'on' : ''}" data-f="${i}">
        <span class="ic">${S.picked.has(i) ? '✓' : '＋'}</span><span><b>${f.name}</b><small>${f.hint}</small></span></button>`).join('');

    let body = '';
    if (!reps.length) body = '<div class="cvx-empty">📂 還沒有檔案。點上面的範例 log 加入這一批。</div>';
    else {
      const banner = `<div class="cvx-banner ${all}">
          <div class="cvx-big">${all === 'WARN' ? '注意' : all}</div>
          <div class="cvx-bt"><b>${reps.length} 份 log：${[['NG', '不合格'], ['WARN', '注意'], ['OK', '合格']].filter(([k]) => cnt[k]).map(([k, n]) => `${cnt[k]} 份${n}`).join('、')}</b>
            <span>${all === 'NG' ? `主要原因：${RULES[main.id].title}。只要有一份不合格，整批就跑不出正確的 CPK。`
              : all === 'WARN' ? 'CPK 跑得出來，但有測項會被默默跳過，建議確認。' : '格式都沒有問題，CPK 應可正常產出。'}</span></div>
          <button class="cvx-exp" data-exp="1">⬇ 匯出結果</button></div>`;
      const skip = reps.filter(r => r.skipped);
      const batch = skip.length ? `<div class="cvx-alert"><b>注意整批會被拖垮：</b>工具是照<b>檔名順序</b>一份一份讀，讀到 ${esc(reps[firstNg].name)} 就會停住，排在它<b>後面</b>的 ${skip.length} 份完全不會被處理，最後計算 CPK 的步驟也不會執行。建議先把不合格的檔案修好或移走，再整批重跑。</div>` : '';
      const crossH = cross.map(c => `<div class="cvx-alert info"><b>參考・${RULES[c.id].title}：</b>${RULES[c.id].problem}（${esc(c.detail)}）${RULES[c.id].impact}。</div>`).join('');
      const chips = [['all', '全部', reps.length], ['NG', '✗ 不合格', cnt.NG], ['WARN', '! 注意', cnt.WARN], ['OK', '✓ 合格', cnt.OK]]
        .map(([k, n, c]) => `<button class="cvx-chip ${k} ${S.filter === k ? 'active' : ''}" data-flt="${k}">${n} ${c}</button>`).join('');
      const rows = shown.map(r => `<div class="cvx-row ${r.verdict} ${S.sel === r.name ? 'sel' : ''}" data-sel="${esc(r.name)}">
          <span class="cvx-mk">${r.verdict === 'NG' ? '✗' : r.verdict === 'WARN' ? '!' : '✓'}</span>
          <span class="cvx-fn">${esc(r.name)}${r.skipped ? '<em>不會被處理</em>' : ''}</span>
          <span class="cvx-why">${firstIssue(r)}</span></div>`).join('') || '<div class="cvx-empty">這個分類沒有檔案</div>';
      const sel = reps.find(r => r.name === S.sel);
      body = banner + batch + crossH +
        `<div class="cvx-sec">每個檔案的結果<small>共 ${reps.length} 份・點任一檔看詳細</small></div><div class="cvx-chips">${chips}</div><div class="cvx-list">${rows}</div>` +
        (sel ? detail(sel) : '');
    }

    root.innerHTML = `
      <div class="cvx-top"><div class="cvx-brand"><span class="cvx-mark">📋</span>Log 格式檢查<span class="cvx-sticker">DEMO 示範版</span></div></div>
      <div class="cvx-wrap">
        <div class="cvx-drop">
          <div class="cvx-drop-t">📥 把 .log 檔拖進來<small>示範：點下面的範例 log 加入這一批，檢查會自動執行</small></div>
          <div class="cvx-files">${pick}</div>
          <div class="cvx-acts"><button data-all="1">全部加入</button><button data-clear="1">清空</button></div>
        </div>
        ${body}
      </div>`;
    root._reps = reps;
  }

  function exportCsv() {
    const rows = [['檔名', '判定', '嚴重度', '問題', '行號', '處數', '怎麼辦']];
    root._reps.forEach(r => {
      if (!r.findings.length) rows.push([r.name, VERD[r.verdict], '', '沒有問題', '', '', '']);
      r.findings.forEach(x => rows.push([r.name, VERD[r.verdict], SEV[RULES[x.id].sev], RULES[x.id].title, x.lines[0], x.lines.length, RULES[x.id].fix]));
    });
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'log檢查結果_示範.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-f],[data-all],[data-clear],[data-flt],[data-sel],[data-exp]');
    if (!t) return;
    const d = t.dataset;
    if (d.f) { const i = +d.f; S.picked.has(i) ? S.picked.delete(i) : S.picked.add(i); }
    else if (d.all) FILES.forEach((_, i) => S.picked.add(i));
    else if (d.clear) { S.picked.clear(); S.sel = null; }
    else if (d.flt) S.filter = d.flt;
    else if (d.sel) S.sel = S.sel === d.sel ? null : d.sel;
    else if (d.exp) { exportCsv(); return; }
    render();
  });

  render();
})();
