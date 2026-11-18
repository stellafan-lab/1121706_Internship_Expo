// ═══════════════════════════════════════════
// 儀器借用系統模擬：流程規則同正式系統
//  申請 → 保管人信中一鍵審核（一次性連結）→ 借用中
//  → 到期前一天提醒、逾期每天催還 → 歸還 → 歸還待確認（第 3、7、14 天提醒保管人）
//  → 保管人確認收到才結案，並通知借用人
// 設備、人名、信件皆為虛構；信件只顯示在右側信箱
// ═══════════════════════════════════════════
(() => {
  const root = document.getElementById('bwx');
  if (!root) return;

  const ME = '王小明';
  const DAY = 86400000;
  const START = new Date(2026, 8, 24);
  const W = ['日', '一', '二', '三', '四', '五', '六'];
  const f = d => `${d.getMonth() + 1}/${d.getDate()}`;
  const fw = d => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}（${W[d.getDay()]}）`;
  const add = (d, n) => new Date(d.getTime() + n * DAY);
  const diff = (a, b) => Math.round((a - b) / DAY);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ST = { available: '可借用', pending: '審核中', borrowed: '借用中', overdue: '逾期', return_pending: '歸還待確認' };
  const STATIONS = ['Wifi throughput', '5GNR'];
  let S;

  function reset() {
    S = {
      today: START, tab: 0, formFor: null, focus: null, done: false, mailSeq: 0, openMail: null,
      eqs: [
        { id: 'EQ-01', name: 'USB 協定分析儀', keeper: 'Amy' },
        { id: 'EQ-02', name: '示波器 100 MHz', keeper: 'Amy' },
        { id: 'EQ-03', name: '可程式電源供應器', keeper: 'Ben' },
        { id: 'EQ-04', name: '網路流量測試儀', keeper: 'Ben', status: 'borrowed', borrower: '李小華', due: add(START, 5), other: true },
        { id: 'EQ-05', name: '無線訊號分析儀', keeper: 'Cara' },
      ].map(e => ({ status: 'available', borrower: null, due: null, returnedAt: null, ...e })),
      mails: [],
      logs: [],
      resv: { [`5GNR|${f(add(START, 1))}`]: '李小華', [`Wifi throughput|${f(add(START, 3))}`]: '陳大文' },
    };
    log('系統', '示範開始：你是借用人「王小明」');
  }

  function log(who, what) { S.logs.unshift({ d: S.today, who, what }); }
  function mail(to, eq, subj, body, actions) {
    const m = { id: ++S.mailSeq, to, eq: eq.id, toName: to === 'keeper' ? eq.keeper : ME, subj, body, date: S.today, actions: actions || null, used: null };
    S.mails.unshift(m);
    S.openMail = m.id;
    return m;
  }
  const eqById = id => S.eqs.find(e => e.id === id);

  // ── 動作 ──
  function submit(eq, days) {
    eq.status = 'pending'; eq.borrower = ME; eq.due = add(S.today, days); S.formFor = null; S.focus = eq.id; S.done = false;
    log(ME, `申請借用 ${eq.name}（預計 ${f(eq.due)} 歸還）`);
    mail('keeper', eq, `[借用申請] ${ME} 想借 ${eq.name}`,
      `${eq.keeper} 您好：<br>${ME} 申請借用 <b>${esc(eq.name)}</b>，預計 ${fw(eq.due)} 歸還。<br>請直接在信中審核（連結僅能使用一次）：`,
      [['同意借用', 'ok', 'approve'], ['不同意', 'no', 'reject']]);
  }
  function approve(eq, m) {
    m.used = '✓ 已同意（此審核連結已失效）';
    eq.status = 'borrowed';
    log(eq.keeper, `同意借用 ${eq.name}`);
    mail('borrower', eq, `[借用核准] ${eq.name} 可以來拿了`, `${ME} 您好：<br>${eq.keeper} 已同意您借用 <b>${esc(eq.name)}</b>，請於 ${fw(eq.due)} 前歸還。`);
  }
  function reject(eq, m) {
    m.used = '✗ 已拒絕（此審核連結已失效）';
    eq.status = 'available'; eq.borrower = null; eq.due = null;
    log(eq.keeper, `拒絕借用 ${eq.name}`);
    mail('borrower', eq, `[未核准] ${eq.name} 這次無法借用`, `${ME} 您好：<br>${eq.keeper} 未同意這次的借用申請，可以改借其他設備或再聯繫保管人。`);
  }
  function giveBack(eq) {
    eq.status = 'return_pending'; eq.returnedAt = S.today; S.focus = eq.id;
    log(ME, `歸還 ${eq.name}，等待保管人確認`);
    mail('keeper', eq, `[歸還確認] 請確認已收到 ${eq.name}`,
      `${eq.keeper} 您好：<br>${ME} 表示已歸還 <b>${esc(eq.name)}</b>，請確認是否收到：`,
      [['確認收到', 'ok', 'confirm'], ['未收到', 'no', 'notReceived']]);
  }
  function confirm(eq, m) {
    m.used = '✓ 已確認收到（流程結案）';
    log(eq.keeper, `確認收到 ${eq.name}，流程結案`);
    mail('borrower', eq, `[歸還完成] ${eq.name} 已結案`, `${ME} 您好：<br>${eq.keeper} 已確認收到 <b>${esc(eq.name)}</b>，這次借用流程完成，謝謝！`);
    eq.status = 'available'; eq.borrower = null; eq.due = null; eq.returnedAt = null; S.done = true;
  }
  function notReceived(eq, m) {
    m.used = '✗ 回報未收到';
    eq.status = diff(eq.due, S.today) < 0 ? 'overdue' : 'borrowed'; eq.returnedAt = null;
    log(eq.keeper, `回報未收到 ${eq.name}`);
    mail('borrower', eq, `[未收到] 保管人尚未收到 ${eq.name}`, `${ME} 您好：<br>${eq.keeper} 表示還沒收到 <b>${esc(eq.name)}</b>，請再確認歸還狀況。`);
  }

  // ── 快轉一天：模擬每天的排程觸發器 ──
  function forward() {
    S.today = add(S.today, 1);
    let sent = 0;
    // 別人借的設備只更新狀態，信件不會出現在「你」的信箱
    S.eqs.filter(e => e.other && e.status === 'borrowed' && diff(e.due, S.today) < 0).forEach(e => { e.status = 'overdue'; });
    S.eqs.filter(e => !e.other && e.borrower === ME).forEach(eq => {
      if (eq.status === 'borrowed' || eq.status === 'overdue') {
        const left = diff(eq.due, S.today);
        if (left === 1) { mail('borrower', eq, `[到期提醒] ${eq.name} 明天到期`, `${ME} 您好：<br><b>${esc(eq.name)}</b> 將於明天 ${fw(eq.due)} 到期，記得歸還喔。`); sent++; }
        if (left < 0) {
          eq.status = 'overdue';
          mail('borrower', eq, `[逾期催還] ${eq.name} 已逾期 ${-left} 天`, `${ME} 您好：<br><b>${esc(eq.name)}</b> 已超過歸還日 ${-left} 天，請盡快歸還給 ${eq.keeper}。<br><small>（逾期期間每天都會寄出）</small>`); sent++;
        }
      }
      if (eq.status === 'return_pending') {
        const d = diff(S.today, eq.returnedAt);
        if (d === 3 || d === 7 || d === 14 || (d > 14 && (d - 14) % 14 === 0)) {
          mail('keeper', eq, `[提醒] ${eq.name} 歸還待確認第 ${d} 天`, `${eq.keeper} 您好：<br><b>${esc(eq.name)}</b> 已歸還 ${d} 天，還沒有確認收到，請到原本的歸還確認信點選「確認收到」。<br><small>（第 3、7、14 天提醒，之後每 14 天一次）</small>`); sent++;
        }
      }
    });
    log('系統排程', sent ? `每日檢查：寄出 ${sent} 封提醒信` : '每日檢查：沒有需要提醒的設備');
  }

  // ── 下一步提示 ──
  function guide() {
    const eq = S.focus && eqById(S.focus);
    if (S.done && (!eq || eq.status === 'available')) return '🎉 流程結案！到「歷史紀錄」看看，每一步都有被記下來；或按「重新開始」再玩一次。';
    if (!eq || eq.status === 'available') return S.formFor ? '👉 選好歸還日，按<b>「送出申請」</b>。' : '👉 下一步：在設備列表挑一台，按<b>「借用」</b>送出申請。';
    if (eq.status === 'pending') return '👉 下一步：看右邊信箱，保管人收到審核信，直接在信裡按<b>「同意借用」</b>。';
    if (eq.status === 'borrowed') return '👉 下一步：按右上角<b>「⏩ 快轉 1 天」</b>，看到期前一天的提醒信；再多快轉幾天會開始逾期催還。';
    if (eq.status === 'overdue') return '👉 逾期後每天都會催還。按設備旁的<b>「歸還」</b>把它還回去。';
    if (eq.status === 'return_pending') return '👉 保管人要在信裡按<b>「確認收到」</b>才結案。也可以先快轉幾天，看第 3、7 天寄給保管人的提醒。';
    return '';
  }

  // ── 畫面 ──
  function viewEquip() {
    const keepers = [...new Set(S.eqs.map(e => e.keeper))];
    return keepers.map(k => `<div class="bwx-group"><div class="bwx-keeper">保管人 ${k}</div>${S.eqs.filter(e => e.keeper === k).map(e => {
      const mine = e.borrower === ME;
      let sub = e.id;
      if (e.borrower) sub += ` · ${e.borrower === ME ? '你' : e.borrower} 借用中，${f(e.due)} 到期`;
      if (e.status === 'return_pending') sub = `${e.id} · 已歸還，等 ${e.keeper} 確認`;
      let act = '';
      if (e.status === 'available') act = `<button class="bwx-act" data-borrow="${e.id}">借用</button>`;
      else if (mine && (e.status === 'borrowed' || e.status === 'overdue')) act = `<button class="bwx-act ghost" data-return="${e.id}">歸還</button>`;
      else act = `<button class="bwx-act" disabled>借用</button>`;
      const form = S.formFor === e.id ? `<div class="bwx-form">
          <label>借用人</label><input value="${ME}" disabled>
          <label>預計歸還日</label>
          <select id="bwx-days">${[1, 2, 3, 5, 7].map(n => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${fw(add(S.today, n))}（${n} 天後）</option>`).join('')}</select>
          <div class="row"><button class="bwx-act" data-submit="${e.id}">送出申請</button><button class="bwx-act ghost" data-cancel="1">取消</button></div>
        </div>` : '';
      return `<div class="bwx-eq ${S.focus === e.id && e.status !== 'available' ? 'hl' : ''}">
          <div><div class="bwx-eq-n">${esc(e.name)}</div><div class="bwx-eq-s">${sub}</div></div>
          <span class="bwx-st ${e.status}">${ST[e.status]}</span>${act}</div>${form}`;
    }).join('')}</div>`).join('');
  }

  function viewStation() {
    const days = Array.from({ length: 7 }, (_, i) => add(S.today, i));
    return STATIONS.map(st => `<div class="bwx-st-wrap"><div class="bwx-st-name">🖥️ ${st}</div><div class="bwx-days">${days.map(d => {
      const who = S.resv[`${st}|${f(d)}`];
      const cls = !who ? 'free' : who === ME ? 'mine' : 'other';
      const label = !who ? '空閒' : who === ME ? '你已預約' : who;
      return `<div class="bwx-day ${cls}" data-st="${st}" data-d="${f(d)}"><b>${f(d)}</b><small>週${W[d.getDay()]}</small><em>${label}</em></div>`;
    }).join('')}</div></div>`).join('') + '<div class="bwx-note">每站每天限一人、先登先贏；點空閒的日期預約，再點一次可取消。</div>';
  }

  function viewLog() {
    return S.logs.map(l => `<div class="bwx-log"><span>${f(l.d)}</span><span><b>${esc(l.who)}</b>　${esc(l.what)}</span></div>`).join('');
  }

  function viewMail() {
    if (!S.mails.length) return '<div class="bwx-empty">📭 還沒有信件<br>送出借用申請後，保管人會收到審核信</div>';
    return S.mails.map(m => {
      const open = S.openMail === m.id;
      const acts = m.actions ? (m.used ? `<span class="bwx-used">${m.used}</span>`
        : `<div class="row">${m.actions.map(([l, k, a]) => `<button class="bwx-mbtn ${k}" data-mail="${m.id}" data-act="${a}">${l}</button>`).join('')}</div>`) : '';
      return `<div class="bwx-mail ${open ? 'new' : ''}">
        <div class="bwx-mail-h" data-open="${m.id}"><span class="bwx-to ${m.to}">寄給${m.to === 'keeper' ? '保管人' : '借用人'} ${m.toName}</span><span class="bwx-subj">${esc(m.subj)}</span><span class="bwx-mdate">${fw(m.date)}</span></div>
        ${open ? `<div class="bwx-mail-b">${m.body}${acts}</div>` : ''}
      </div>`;
    }).join('');
  }

  function render() {
    const views = [viewEquip, viewStation, viewLog];
    root.innerHTML = `
      <div class="bwx-top">
        <div class="bwx-brand"><span class="bwx-mark">📦</span>儀器借用系統</div>
        <div class="bwx-guide"><span>${guide()}</span></div>
        <div class="bwx-clock"><span class="bwx-date">📅 ${fw(S.today)}</span><button class="bwx-ff" data-ff="1">⏩ 快轉 1 天</button><button class="bwx-reset" data-reset="1">↺ 重新開始</button></div>
      </div>
      <div class="bwx-main">
        <div class="bwx-pane">
          <div class="bwx-pane-h">${['📋 設備列表', '🖥️ 測試站預約', '🕘 歷史紀錄'].map((n, i) => `<button class="bwx-tab ${S.tab === i ? 'active' : ''}" data-tab="${i}">${n}</button>`).join('')}</div>
          <div class="bwx-body">${views[S.tab]()}</div>
        </div>
        <div class="bwx-pane">
          <div class="bwx-pane-h"><span class="bwx-pane-t">📬 信箱<small>${S.mails.length} 封</small></span></div>
          <div class="bwx-body">${viewMail()}</div>
        </div>
      </div>`;
  }

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-tab],[data-borrow],[data-submit],[data-cancel],[data-return],[data-mail],[data-open],[data-ff],[data-reset],.bwx-day');
    if (!t) return;
    const d = t.dataset;
    if (d.tab) S.tab = +d.tab;
    else if (d.borrow) { S.formFor = d.borrow; S.tab = 0; }
    else if (d.cancel) S.formFor = null;
    else if (d.submit) submit(eqById(d.submit), +root.querySelector('#bwx-days').value);
    else if (d.return) giveBack(eqById(d.return));
    else if (d.mail) {
      const m = S.mails.find(x => x.id === +d.mail);
      const eq = eqById(m.eq);
      ({ approve, reject, confirm, notReceived })[d.act](eq, m);
    }
    else if (d.open) S.openMail = S.openMail === +d.open ? null : +d.open;
    else if (d.ff) forward();
    else if (d.reset) reset();
    else if (t.classList.contains('bwx-day')) {
      const key = `${d.st}|${d.d}`, who = S.resv[key];
      if (!who) { S.resv[key] = ME; log(ME, `預約 ${d.st} 測試站 ${d.d}`); }
      else if (who === ME) { delete S.resv[key]; log(ME, `取消 ${d.st} 測試站 ${d.d} 的預約`); }
      else return;
    }
    render();
  });

  reset();
  render();
})();
