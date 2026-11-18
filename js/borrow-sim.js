// ═══════════════════════════════════════════
// 儀器借用系統（仿真版）：外觀與按鈕位置照正式系統，流程分五步
//  ① 申請：列表「狀態」欄的 [借用] → 借用設備視窗 → 確認借用
//  ② 審核：保管人信中的連結 → 審核借用申請頁 → 同意 / 不同意
//  ③ 到期提醒：到期前 1 小時寄給借用人
//  ④ 歸還：[📧 歸還] → 歸還設備視窗 → 通知歸還
//  ⑤ 結案：保管人信中的連結 → 確認收到頁 → 確認收到，通知借用人
// 信件主旨與內文格式照正式系統；設備、人名皆為虛構
// ═══════════════════════════════════════════
(() => {
  const root = document.getElementById('bsim');
  if (!root) return;

  const ME = '王小明', ME_MAIL = 'xiaoming.wang@example.com', KEEPER = 'Amy';
  const EQS = [
    { id: 'EQ-01', name: 'USB 協定分析儀' },
    { id: 'EQ-02', name: '示波器 100 MHz' },
    { id: 'EQ-03', name: '可程式電源供應器', other: '李小華' },
  ];
  const EQ = EQS[0];
  const PRE = '[MT 設備系統]';
  const STEPS = ['申請', '審核', '到期提醒', '歸還', '結案'];
  const T = { start: '2026-09-24 10:00', due: '2026-09-25 17:00', remind: '2026-09-25 16:00', back: '2026-09-25 16:30', done: '2026-09-25 16:45' };
  const SIGN = '---<br>MT 部門設備管理系統 自動通知';

  let s, modal, page, rejected, notReceived, tab;
  const reset = () => { s = 0; modal = null; page = null; rejected = false; notReceived = false; tab = 'list'; };
  reset();

  // ── 左：設備列表的狀態欄 ──
  function statusCell(eq) {
    if (eq.other) return `<span class="st red">📤 借用中</span><div class="acts"><button class="sb sm" disabled>⏰ 續借</button><button class="sb sm" disabled>📧 歸還</button></div>`;
    if (eq !== EQ) return `<span class="st green">✅ 可借用</span><div class="acts"><button class="sb" data-go="other">借用</button></div>`;
    if (s === 1 && !rejected) return '<span class="st yellow">⏳ 借用審核中</span><div class="hint yellow">⏳ 等待 Keeper 審核</div>';
    if (s === 2 || s === 3) return `<span class="st red">📤 借用中</span><div class="acts"><button class="sb sm" disabled>⏰ 續借</button><button class="sb sm ${s === 3 ? 'glow' : ''}" data-go="${s === 3 ? 'return' : ''}">📧 歸還</button></div>`;
    if (s === 4) return '<span class="st teal">⏳ 歸還認證中</span><div class="hint teal">等待 Keeper 確認</div>';
    return `<span class="st green">✅ 可借用</span><div class="acts"><button class="sb ${s === 0 && !modal ? 'glow' : ''}" data-go="${s === 0 ? 'borrow' : ''}">借用</button></div>`;
  }

  function leftHtml() {
    const body = tab === 'hist'
      ? `<div class="sim-group">▼ 📦 ${EQ.id}　${EQ.name}</div>
        <div class="sim-hist"><div class="hh">▼ ---&gt; <span class="av">👤</span> ${ME} <span class="ok">✅ 已歸還</span></div>
          <div class="hd">借用日期：${T.start.slice(0, 10)}<br>預計歸還：${T.due.slice(0, 10)}<br>歸還完成：${T.done.slice(0, 10)}</div></div>`
      : `<div class="sim-group">▼ <span class="av">👩</span> 保管人 ${KEEPER}</div>
        <table class="sim-tbl"><thead><tr><th>設備類型</th><th>設備編號</th><th>設備名稱</th><th>數量</th><th>狀態</th></tr></thead><tbody>
          ${EQS.map(e => `<tr class="${e === EQ ? 'me' : ''}"><td>雜項購置</td><td>${e.id}</td><td>${e.name}</td><td>1</td><td class="stc">${statusCell(e)}</td></tr>`).join('')}
        </tbody></table>`;
    return `
      <div class="sim-head">
        <div class="ttl">🦐 MT 部門儀器借用系統</div>
        <div class="tabs">
          <button class="pill ${tab === 'list' ? 'on' : ''}" data-tab="list">📦 設備列表</button>
          <button class="pill ${tab === 'hist' ? 'on' : ''} ${s === 5 && tab === 'list' ? 'glow' : ''}" data-tab="hist">📜 歷史紀錄</button>
          <span class="who">👤 訪客</span>
        </div>
      </div>
      <div class="sim-list">${body}</div>
      ${modal ? modalHtml() : ''}`;
  }

  function modalHtml() {
    const info = `<div class="info"><div><b>設備編號：</b>${EQ.id}</div><div><b>設備名稱：</b>${EQ.name}</div><div><b>保管人：</b>${KEEPER}</div></div>`;
    if (modal === 'borrow') return `<div class="sim-modal"><div class="box">
      <div class="mh"><span>📤 借用設備</span><button class="x" data-go="close">×</button></div>${info}
      <div class="fld"><label>借用人姓名 *</label><input value="${ME}" readonly class="ro"></div>
      <div class="fld"><label>電子郵件 *</label><input value="${ME_MAIL}" readonly></div>
      <div class="fld"><label>預計歸還日期時間 *</label><input value="${T.due}" readonly></div>
      <small>✓ 借用需要 Keeper 審核</small>
      <button class="sb big glow" data-go="submit">確認借用</button></div></div>`;
    return `<div class="sim-modal"><div class="box">
      <div class="mh"><span>📥 歸還設備</span><button class="x" data-go="close">×</button></div>${info}
      <div class="fld col"><label>歸還日期時間（系統自動填入當下）</label><input value="${T.back}" readonly class="ro"></div>
      <button class="sb big glow" data-go="giveback">📧 通知歸還</button></div></div>`;
  }

  // ── 右：信箱或信中連結開啟的頁面 ──
  function mail(box, subj, now, lines, link) {
    return { box, html: `<div class="sim-mail">
      <div class="subj">${PRE} ${subj}</div>
      <div class="from">MT 部門設備管理系統・${now}</div>
      <div class="txt">${lines.join('<br>')}${link ? `<br><a class="lnk glow" data-go="${link[0]}">${link[1]}</a>` : ''}<br>${SIGN}</div></div>` };
  }

  function rightView() {
    if (page === 'review') return { box: 'keeper', url: 'confirm-borrow.html?request_id=…', html: `<div class="sim-page">
      <h4>🔒 審核借用申請</h4>
      <div class="card"><div>📦 <b>設備編號：</b>${EQ.id}</div><div>📝 <b>設備名稱：</b>${EQ.name}</div><div>👤 <b>申請人：</b>${ME}</div>
      <div>📅 <b>借用日期：</b>${T.start}</div><div>⏰ <b>預計歸還：</b>${T.due}</div></div>
      <p>請確認上述資訊後，選擇是否同意借用：</p>
      <div class="row"><button class="pb ok glow" data-go="approve">✅ 同意借用</button><button class="pb no" data-go="reject">❌ 不同意借用</button></div></div>` };
    if (page === 'confirm') return { box: 'keeper', url: 'confirm.html?token=…', html: `<div class="sim-page">
      <h4>📥 確認收到</h4>
      <div class="card"><div>📦 <b>設備編號：</b>${EQ.id}</div><div>📝 <b>設備名稱：</b>${EQ.name}</div><div>👤 <b>原借用人：</b>${ME}</div><div>📅 <b>歸還日期：</b>${T.back}</div></div>
      ${notReceived ? '<p class="warn">按「未收到」時，系統會寄信請借用人確認。這裡示範按「確認收到」。</p>' : ''}
      <div class="row"><button class="pb ok glow" data-go="confirm">✅ 確認收到</button><button class="pb gray" data-go="notyet">未收到</button></div></div>` };
    if (rejected) return mail('borrower', '您的借用申請未通過', T.start,
      ['您好：', '您的設備借用申請已有審核結果：', `📦 設備編號：${EQ.id}`, `📝 設備名稱：${EQ.name}`, '❌ 未通過', '如需借用設備，請聯繫保管人或其他管理員。']);
    return [
      null,
      mail('keeper', '借用申請需要您的審核', T.start,
        [`親愛的 ${KEEPER} 您好：`, '有人申請借用您保管的設備，請審核：', `📦 設備編號：${EQ.id}`, `📝 設備名稱：${EQ.name}`, `👤 申請人：${ME}`, `📅 借用日期：${T.start}`, `⏰ 預計歸還：${T.due}`, '請點擊以下連結進行審核：'],
        ['review', '…/confirm-borrow.html?request_id=…']),
      mail('borrower', '您的借用申請已核准', T.start,
        ['您好：', '您的設備借用申請已有審核結果：', `📦 設備編號：${EQ.id}`, `📝 設備名稱：${EQ.name}`, '✅ 已核准', `⏰ 預計歸還：${T.due}`, '您可以前往設備系統查看設備借用狀態。']),
      mail('borrower', '【提醒】設備將於 1 小時內到期', T.remind,
        [`親愛的 ${ME} 您好：`, '提醒您借用的設備即將到期，請準備歸還：', `📦 設備編號：${EQ.id}`, `📝 設備名稱：${EQ.name}`, `⏰ 預計歸還：${T.due}`, '請在預計歸還時間前歸還設備，謝謝！']),
      mail('keeper', '設備歸還通知', T.back,
        [`親愛的 ${KEEPER} 您好：`, '您保管的設備已被歸還，請確認收到：', `📦 設備編號：${EQ.id}`, `📝 設備名稱：${EQ.name}`, `👤 原借用人：${ME}`, `📅 歸還日期：${T.back}`, '✅ 請點擊以下連結確認歸還：'],
        ['openconfirm', '…/confirm.html?token=…']),
      mail('borrower', `歸還已完成 - ${EQ.name}`, T.done,
        [`親愛的 ${ME} 您好：`, `保管人（Keeper）${KEEPER} 已確認收到您歸還的設備，歸還流程完成：`, `📦 設備編號：${EQ.id}`, `📝 設備名稱：${EQ.name}`, '✅ 設備狀態已更新為「可借用」，您這筆借用紀錄已結案。']),
    ][s];
  }

  // ── 下：身分與說明 ──
  function tip() {
    if (rejected) return ['keeper', '保管人不同意時，借用人一樣會收到通知，設備維持可借用。', true];
    if (modal === 'borrow') return ['borrower', '姓名和 Email 已先填好，按<b>「確認借用」</b>送出申請。'];
    if (modal === 'return') return ['borrower', '歸還時間由系統自動填入，按<b>「📧 通知歸還」</b>。'];
    if (page === 'review') return ['keeper', '連結開啟審核頁，<b>不用登入</b>就能直接同意或不同意。'];
    if (page === 'confirm') return ['keeper', '保管人確認收到才算結案，避免「說還了其實沒還」。'];
    return [
      ['borrower', `你現在是<b>借用人${ME}</b>，不用登入。在 ${EQ.name} 的狀態欄按<b>「借用」</b>。`],
      ['keeper', `換你當<b>保管人 ${KEEPER}</b>：收到審核信，點信裡的連結。`],
      ['borrower', '借用成功，借用人收到核准信。到期前系統會自動提醒，不用人工追。'],
      ['borrower', '到期前 1 小時自動寄出提醒（逾期還會每天催還）。在狀態欄按<b>「📧 歸還」</b>。'],
      ['keeper', '換回<b>保管人</b>：收到歸還通知，點信裡的連結確認。'],
      ['borrower', tab === 'hist' ? '每台設備誰借過、什麼時候借、什麼時候還，都整理在歷史紀錄。' : '🎉 流程結案！點上方的<b>「📜 歷史紀錄」</b>看看這次借用的紀錄。', true],
    ][s];
  }

  function render() {
    const stepCls = i => rejected ? (i === 0 ? 'done' : i === 1 ? 'bad' : '') : i < s ? 'done' : i === s ? 'active' : '';
    const r = rightView();
    const [who, text, restart] = tip();
    const leftFocus = !page && (s === 0 || s === 3 || modal || (s === 5 && !rejected));
    root.innerHTML = `
      <ol class="sim-steps">${STEPS.map((n, i) => `<li class="${stepCls(i)}"><span class="n">${stepCls(i) === 'done' ? '✓' : stepCls(i) === 'bad' ? '✕' : i + 1}</span><span class="l">${n}</span></li>`).join('')}</ol>
      <div class="sim-main">
        <div class="sim-win sys ${leftFocus ? 'focus' : ''}">${leftHtml()}</div>
        <div class="sim-win mailbox ${r && !leftFocus ? 'focus' : ''}">
          <div class="mb-h">${r && r.url ? `<span class="url">🔒 ${r.url}</span>` : `📬 ${r ? (r.box === 'keeper' ? `保管人 ${KEEPER} 的信箱` : `借用人 ${ME} 的信箱`) : '信箱'}`}</div>
          <div class="mb-body">${r ? r.html : '<div class="empty">📭 還沒有信件<br>送出借用申請後，保管人會收到審核信</div>'}</div>
        </div>
      </div>
      <div class="sim-tip ${s === 2 && !rejected ? 'focus' : ''}">
        <span class="who ${who}">${who === 'keeper' ? '🔑 保管人' : '👤 借用人'}</span>
        <p>${text}</p>
        ${s === 2 && !rejected ? '<button class="sb glow" data-go="ff">⏩ 時間快轉到歸還前 1 小時</button>' : ''}
        ${restart ? '<button class="sb ghost" data-go="restart">↺ 重新開始</button>' : ''}
      </div>`;
  }

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-go],[data-tab]');
    if (!t) return;
    if (t.dataset.tab) { if (s === 5 || t.dataset.tab === 'list') tab = t.dataset.tab; render(); return; }
    const go = t.dataset.go;
    if (go === 'borrow') modal = 'borrow';
    else if (go === 'close') modal = null;
    else if (go === 'submit') { modal = null; s = 1; }
    else if (go === 'review') page = 'review';
    else if (go === 'approve') { page = null; s = 2; }
    else if (go === 'reject') { page = null; rejected = true; }
    else if (go === 'ff') s = 3;
    else if (go === 'return') modal = 'return';
    else if (go === 'giveback') { modal = null; s = 4; }
    else if (go === 'openconfirm') page = 'confirm';
    else if (go === 'notyet') notReceived = true;
    else if (go === 'confirm') { page = null; s = 5; }
    else if (go === 'restart') reset();
    else if (go === 'other') { flash(`這次示範請借 <b>${EQ.name}</b>（第一列發光的「借用」）。`); return; }
    else return;
    render();
  });

  function flash(msg) {
    const p = root.querySelector('.sim-tip p');
    if (p) { p.innerHTML = msg; p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash'); }
  }

  render();
})();
