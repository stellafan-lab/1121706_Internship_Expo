// ═══════════════════════════════════════════
// Error Code Search 模擬畫面（照正式版介面）
// 錯誤碼、分類、異動紀錄全為虛構示範資料；
// AI 查詢以預先設定的主題對應模擬語意比對結果。
// ═══════════════════════════════════════════
(() => {
  const root = document.getElementById('ecx');
  if (!root) return;

  // ── 分類 ──
  const CATS = {
    AP: { zh: '測試應用相關錯誤', en: 'Test Application Errors', vi: 'Lỗi ứng dụng kiểm tra', f: 'Application Test Function Issue' },
    BT: { zh: '藍牙測試相關錯誤', en: 'Bluetooth Test Errors', vi: 'Lỗi kiểm tra Bluetooth', f: 'Bluetooth Test Function Issue' },
    CM: { zh: '相機測試相關錯誤', en: 'Camera Test Errors', vi: 'Lỗi kiểm tra camera', f: 'Photo Test Function Issue' },
    GF: { zh: '一般測試相關錯誤', en: 'General Test Errors', vi: 'Lỗi kiểm tra chung', f: 'General Test Function Issue' },
    LT: { zh: 'LTE 測試相關錯誤', en: 'LTE Test Errors', vi: 'Lỗi kiểm tra LTE', f: 'LTE Test Function Issue' },
    MM: { zh: '記憶體測試相關錯誤', en: 'Memory Test Errors', vi: 'Lỗi kiểm tra bộ nhớ', f: 'Memory Test Function Issue' },
    NT: { zh: '無線射頻測試相關錯誤', en: 'RF Test Errors', vi: 'Lỗi kiểm tra tần số vô tuyến', f: 'RF Test Function Issue' },
    PW: { zh: '電源測試相關錯誤', en: 'Power Test Errors', vi: 'Lỗi kiểm tra nguồn', f: 'Power Test Function Issue' },
  };

  // ── 錯誤碼（虛構）──
  const CODES = [
    ['AP001', 'Ping Gateway Fail'], ['AP002', 'Iperf Throughput Test Timeout'], ['AP003', 'DHCP Get IP Timeout'],
    ['AP004', 'Web UI Login Fail'], ['AP005', 'Get RSSI Timeout'], ['AP006', 'USB Storage Mount Fail'],
    ['BT001', 'Bluetooth Pairing Timeout'], ['BT002', 'Bluetooth Firmware Version Mismatch'], ['BT003', 'BLE Scan No Device Found'],
    ['BT004', 'Bluetooth TX Power Out Of Range'], ['BT005', 'Bluetooth Module Init Fail'],
    ['CM001', 'Camera Module Not Detected'], ['CM002', 'SFR/MTF Test Fail'], ['CM003', 'Bad Pixel Test Fail'],
    ['CM004', 'Auto White Balance Calibration Timeout'], ['CM005', 'Focus Value Out Of Range'], ['CM006', 'Lens Shading Test Fail'],
    ['GF001', 'DUT Boot Timeout'], ['GF002', 'Console Login Fail'], ['GF003', 'Check QR Code Format Fail'],
    ['GF004', 'Wait Chip Initialization Timeout'], ['GF005', 'Firmware Version Check Fail'], ['GF006', 'Reboot Test Fail'],
    ['GF007', 'LED Test Fail'], ['GF008', 'Button Test Fail'],
    ['LT001', 'SIM Card Not Detected'], ['LT002', 'LTE Attach Timeout'], ['LT003', 'LTE TX Power Calibration Fail'], ['LT004', 'LTE RX Sensitivity Fail'],
    ['MM001', 'DDR Memory Size Check Fail'], ['MM002', 'Flash Read/Write Verify Fail'], ['MM003', 'EEPROM Write Fail'],
    ['MM004', 'eMMC ID Check Fail'], ['MM005', 'Memory Stress Test Fail'],
    ['NT001', "Can't Open Adapter"], ['NT002', 'Crystal Calibration Fail'], ['NT003', '2.4G TX Power Calibration Fail'],
    ['NT004', '5G TX Power Calibration Fail'], ['NT005', 'Wait 2GHz Calibration Coefficients Timeout'], ['NT006', 'EVM Test Fail'],
    ['NT007', 'RX Sensitivity Test Fail'],
    ['PW001', 'Input Voltage Out Of Tolerance'], ['PW002', '3.3V Rail Voltage Fail'], ['PW003', 'Power Consumption Over Limit'],
    ['PW004', 'Adapter Detect Fail'], ['PW005', 'Power On Sequence Fail'],
  ].map(([code, title]) => ({ code, title, cat: code.slice(0, 2) }));
  const byCode = Object.fromEntries(CODES.map(c => [c.code, c]));

  // ── AI 查詢主題：三種語言的描述都對到同一組結果（模擬語意比對）──
  const TOPICS = [
    {
      chip: { zh: '相機測試錯誤', en: 'camera test error', vi: 'lỗi kiểm tra camera' },
      kw: ['相機', '鏡頭', '影像', 'camera', 'lens', 'image', 'photo', 'máy ảnh', 'camera', 'ống kính', 'hình ảnh'],
      hits: ['CM002', 'CM003', 'CM001', 'CM005', 'CM006', 'CM004', 'GF007', 'GF003', 'AP006', 'GF005'],
      ai: {
        zh: '從描述判斷屬於相機測試失敗。建議先確認相機模組有被偵測到（CM001），再看是解析度類（SFR/MTF、壞點）還是校正類（白平衡、對焦）的問題；解析度類多與鏡頭髒污或治具光源有關，校正類則可先重跑校正程序。',
        en: 'This looks like a camera test failure. First confirm the camera module is detected (CM001), then tell apart resolution issues (SFR/MTF, bad pixels) from calibration issues (white balance, focus). Resolution issues usually point to a dirty lens or fixture lighting; calibration issues can often be fixed by re-running the calibration.',
        vi: 'Đây có vẻ là lỗi kiểm tra camera. Trước tiên hãy xác nhận mô-đun camera được nhận diện (CM001), sau đó phân biệt lỗi độ phân giải (SFR/MTF, điểm ảnh chết) và lỗi hiệu chỉnh (cân bằng trắng, lấy nét). Lỗi độ phân giải thường do ống kính bẩn hoặc nguồn sáng của đồ gá.',
      },
    },
    {
      chip: { zh: '電源問題', en: 'power issue', vi: 'sự cố nguồn điện' },
      kw: ['電源', '電壓', '電流', '供電', '耗電', 'power', 'voltage', 'current', 'adapter', 'nguồn', 'điện áp', 'dòng điện'],
      hits: ['PW001', 'PW002', 'PW005', 'PW003', 'PW004', 'GF001', 'GF006', 'NT002', 'LT003', 'NT003'],
      ai: {
        zh: '屬於電源相關問題。建議依序檢查：輸入電壓是否在公差內（PW001）、各電源軌電壓（PW002）、上電順序（PW005）。若同時出現開機逾時（GF001），多半是供電不穩造成，可先檢查治具探針接觸與變壓器。',
        en: 'This is a power-related issue. Check in order: input voltage tolerance (PW001), rail voltages (PW002), and power-on sequence (PW005). If boot timeout (GF001) also appears, unstable power is the likely cause — check fixture probe contact and the adapter first.',
        vi: 'Đây là sự cố liên quan đến nguồn. Hãy kiểm tra lần lượt: điện áp đầu vào (PW001), điện áp các đường nguồn (PW002) và trình tự cấp nguồn (PW005). Nếu kèm theo lỗi khởi động quá thời gian (GF001), nguyên nhân thường là nguồn không ổn định.',
      },
    },
    {
      chip: { zh: '網路連線', en: 'network connection', vi: 'kết nối mạng' },
      kw: ['網路', '連線', '上網', 'ping', 'ip', 'network', 'connection', 'internet', 'throughput', 'mạng', 'kết nối'],
      hits: ['AP001', 'AP003', 'AP002', 'AP005', 'AP004', 'NT001', 'LT002', 'NT007', 'GF002', 'NT006'],
      ai: {
        zh: '屬於網路連線類問題。若連 Ping Gateway（AP001）都失敗，先檢查網路線與 DHCP 是否取得 IP（AP003）；若能連線但速度測試逾時（AP002），則偏向無線效能問題，可對照射頻測試的 EVM、接收靈敏度結果。',
        en: 'This is a network connection issue. If even Ping Gateway (AP001) fails, check the cable and whether DHCP assigned an IP (AP003). If the link is up but the throughput test times out (AP002), it is more likely a wireless performance issue — compare with the RF EVM and RX sensitivity results.',
        vi: 'Đây là sự cố kết nối mạng. Nếu Ping Gateway (AP001) cũng thất bại, hãy kiểm tra cáp mạng và việc nhận IP qua DHCP (AP003). Nếu có kết nối nhưng kiểm tra tốc độ quá thời gian (AP002), nhiều khả năng là vấn đề hiệu suất không dây.',
      },
    },
    {
      chip: { zh: '藍牙失敗', en: 'bluetooth failure', vi: 'lỗi bluetooth' },
      kw: ['藍牙', '配對', 'bluetooth', 'ble', 'pairing', 'bt ', 'ghép nối'],
      hits: ['BT001', 'BT005', 'BT002', 'BT003', 'BT004', 'GF005', 'GF004', 'NT001', 'AP005', 'GF001'],
      ai: {
        zh: '屬於藍牙測試失敗。配對逾時（BT001）最常見，建議先確認模組有正常初始化（BT005）與韌體版本一致（BT002）；若掃描不到裝置（BT003），可檢查屏蔽箱與天線連接。',
        en: 'This is a Bluetooth test failure. Pairing timeout (BT001) is the most common. First confirm the module initialized (BT005) and the firmware version matches (BT002). If no device is found during scanning (BT003), check the shield box and antenna connection.',
        vi: 'Đây là lỗi kiểm tra Bluetooth. Lỗi ghép nối quá thời gian (BT001) là phổ biến nhất. Hãy xác nhận mô-đun khởi tạo bình thường (BT005) và phiên bản firmware khớp (BT002).',
      },
    },
    {
      chip: { zh: '記憶體錯誤', en: 'memory error', vi: 'lỗi bộ nhớ' },
      kw: ['記憶體', '快閃', '儲存', 'memory', 'ddr', 'flash', 'eeprom', 'emmc', 'bộ nhớ', 'lưu trữ'],
      hits: ['MM001', 'MM002', 'MM005', 'MM003', 'MM004', 'AP006', 'GF005', 'GF001', 'GF006', 'GF004'],
      ai: {
        zh: '屬於記憶體相關錯誤。容量檢查失敗（MM001）與 ID 不符（MM004）通常是料件問題，可比對 BOM；讀寫驗證失敗（MM002）或壓力測試失敗（MM005）則可能是焊接或時序問題，建議重測確認是否穩定重現。',
        en: 'This is a memory-related error. Size check failures (MM001) and ID mismatches (MM004) usually point to the wrong part — compare with the BOM. Read/write verify (MM002) or stress test failures (MM005) may be soldering or timing issues; retest to see if it reproduces.',
        vi: 'Đây là lỗi liên quan đến bộ nhớ. Lỗi kiểm tra dung lượng (MM001) và sai ID (MM004) thường do linh kiện sai — hãy đối chiếu BOM. Lỗi đọc/ghi (MM002) hoặc kiểm tra tải (MM005) có thể do lỗi hàn hoặc thời gian truy cập.',
      },
    },
    {
      chip: { zh: '校正逾時', en: 'calibration timeout', vi: 'hết thời gian hiệu chỉnh' },
      kw: ['校正', '逾時', '超時', 'calibration', 'timeout', 'hiệu chỉnh', 'hết thời gian', 'quá thời gian'],
      hits: ['NT005', 'CM004', 'GF004', 'NT002', 'NT003', 'NT004', 'LT003', 'AP002', 'LT002', 'GF001'],
      ai: {
        zh: '屬於校正流程逾時。射頻校正等不到係數（NT005）或晶片初始化逾時（GF004）多半是儀器通訊中斷或待測物當機；建議先確認儀器連線與待測物狀態，再重跑該站校正。',
        en: 'This is a calibration timeout. Waiting for RF calibration coefficients (NT005) or chip initialization timeouts (GF004) usually mean the instrument connection dropped or the DUT hung. Check the instrument link and DUT state, then re-run the calibration.',
        vi: 'Đây là lỗi quá thời gian hiệu chỉnh. Chờ hệ số hiệu chỉnh RF (NT005) hoặc khởi tạo chip quá thời gian (GF004) thường do mất kết nối thiết bị đo hoặc DUT bị treo.',
      },
    },
  ];

  // ── 異動紀錄（虛構）──
  const REVS = [
    { d: '2026.09.16', who: 'Alex', why: { zh: '新機種 QR Code 檢查', en: 'QR code check for new model', vi: 'Kiểm tra mã QR cho model mới' }, rows: [['GF003', 'add']] },
    { d: '2026.08.21', who: 'Bella', why: { zh: '補充 LTE 測項', en: 'Add LTE test items', vi: 'Bổ sung hạng mục LTE' }, rows: [['LT003', 'add'], ['LT004', 'add']] },
    { d: '2026.07.30', who: 'Chris', why: { zh: '修正說明文字', en: 'Fix description text', vi: 'Sửa mô tả' }, rows: [['CM004', 'mod']] },
    { d: '2026.06.12', who: 'Alex', why: { zh: '新增記憶體壓力測試', en: 'Add memory stress test', vi: 'Thêm kiểm tra tải bộ nhớ' }, rows: [['MM005', 'add']] },
    { d: '2026.05.08', who: 'Dana', why: { zh: '藍牙韌體檢查', en: 'Bluetooth firmware check', vi: 'Kiểm tra firmware Bluetooth' }, rows: [['BT002', 'add'], ['BT005', 'add']] },
  ];

  // ── 介面文字 ──
  const T = {
    zh: {
      title: '錯誤代碼查詢系統', sub: '輸入自然語言描述，AI 幫您找出最相關的錯誤代碼', login: '登入', loginNote: '示範版不開放登入；實際系統由管理員登入後台新增、修改代碼，並經審核才生效。',
      tabs: ['關鍵字搜尋', 'AI 查詢', '瀏覽全部', '新增紀錄'],
      kwLabel: '關鍵字', kwPh: '例如：Reboot、Timeout、EEPROM…', kwHint: '輸入關鍵字，會依分類顯示含此字的錯誤代碼',
      kwFound: (n, m) => `找到 <b>${n}</b> 個代碼，分布在 <b>${m}</b> 個類別 — 點選類別檢視`, all: '全部',
      kwList: (name, n) => `${name} — 共 <b>${n}</b> 個代碼`, none: '找不到符合的代碼',
      aiLabel: '描述您遇到的問題', aiPh: '例如：相機測試失敗、藍牙連不上…', ask: '查詢', thinking: '語意比對中…',
      aiHead: 'AI 分析', found: n => `找到 <b>${n}</b> 個相關錯誤代碼`, score: '相符度',
      aiNone: '找不到相近的示範資料，試試上方的範例。',
      brLabel: '選擇類別，檢視該類別所有錯誤代碼', brPick: '點上方任一類別開始瀏覽',
      revLabel: '最近的錯誤代碼異動紀錄（誰、在何時、變更了什麼）', revCount: n => `最近 <b>${n}</b> 筆異動`, add: '新增', mod: '修改',
      copied: c => `已複製 ${c}`,
    },
    en: {
      title: 'Error Code Search System', sub: 'Describe your issue in natural language — AI finds the best match', login: 'Log in', loginNote: 'Login is disabled in this demo. In the real system, admins log in to add or edit codes, and changes take effect after review.',
      tabs: ['Keyword', 'AI Search', 'Browse All', 'History'],
      kwLabel: 'Keyword', kwPh: 'e.g. Reboot, Timeout, EEPROM…', kwHint: 'Type a keyword to list matching error codes by category',
      kwFound: (n, m) => `Found <b>${n}</b> codes in <b>${m}</b> categories — pick a category to filter`, all: 'All',
      kwList: (name, n) => `${name} — <b>${n}</b> codes`, none: 'No matching codes',
      aiLabel: 'Describe your problem', aiPh: 'e.g. camera test failed, bluetooth won\'t pair…', ask: 'Search', thinking: 'Matching meaning…',
      aiHead: 'AI Analysis', found: n => `Found <b>${n}</b> related error codes`, score: 'Match',
      aiNone: 'No similar demo data — try one of the examples above.',
      brLabel: 'Pick a category to see all its error codes', brPick: 'Pick any category above to start browsing',
      revLabel: 'Recent error code changes (who, when, what)', revCount: n => `Latest <b>${n}</b> changes`, add: 'Added', mod: 'Edited',
      copied: c => `Copied ${c}`,
    },
    vi: {
      title: 'Hệ Thống Tra Cứu Mã Lỗi', sub: 'Mô tả vấn đề bằng ngôn ngữ tự nhiên — AI tìm mã lỗi phù hợp nhất', login: 'Đăng nhập', loginNote: 'Bản demo không mở đăng nhập. Ở hệ thống thật, quản trị viên đăng nhập để thêm, sửa mã lỗi và thay đổi chỉ có hiệu lực sau khi được duyệt.',
      tabs: ['Từ khoá', 'Tìm kiếm AI', 'Xem tất cả', 'Lịch sử'],
      kwLabel: 'Từ khóa', kwPh: 'Ví dụ: Reboot, Timeout, EEPROM…', kwHint: 'Nhập từ khóa để hiển thị mã lỗi theo danh mục',
      kwFound: (n, m) => `Tìm thấy <b>${n}</b> mã trong <b>${m}</b> danh mục — chọn danh mục để lọc`, all: 'Tất cả',
      kwList: (name, n) => `${name} — <b>${n}</b> mã`, none: 'Không tìm thấy mã phù hợp',
      aiLabel: 'Mô tả vấn đề bạn gặp', aiPh: 'Ví dụ: lỗi kiểm tra camera, bluetooth không kết nối…', ask: 'Tìm', thinking: 'Đang so khớp ngữ nghĩa…',
      aiHead: 'Phân tích AI', found: n => `Tìm thấy <b>${n}</b> mã lỗi liên quan`, score: 'Độ khớp',
      aiNone: 'Không có dữ liệu mẫu tương tự — hãy thử một ví dụ ở trên.',
      brLabel: 'Chọn danh mục để xem tất cả mã lỗi', brPick: 'Chọn một danh mục ở trên để bắt đầu',
      revLabel: 'Thay đổi mã lỗi gần đây (ai, khi nào, thay đổi gì)', revCount: n => `<b>${n}</b> thay đổi gần nhất`, add: 'Thêm', mod: 'Sửa',
      copied: c => `Đã sao chép ${c}`,
    },
  };

  const S = { lang: 'zh', tab: 0, kw: '', kwCat: 'ALL', aiQ: '', aiRes: null, aiBusy: false, brCat: null };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const catName = p => CATS[p][S.lang];
  const SEARCH_SVG = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

  function hl(text, q) {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + `<mark class="ecx-hl">${esc(text.slice(i, i + q.length))}</mark>` + esc(text.slice(i + q.length));
  }

  function resCard(c, opts = {}) {
    const t = T[S.lang];
    const score = opts.score != null
      ? `<div class="ecx-score"><small>${t.score}</small><b>${opts.score.toFixed(1)}%</b>
           <div class="ecx-track"><div class="ecx-fill ${opts.score >= 68 ? '' : opts.score >= 60 ? 'mid' : 'lo'}" style="width:${opts.score}%"></div></div></div>` : '';
    return `<div class="ecx-res" data-code="${c.code}" style="animation-delay:${(opts.i || 0) * 0.04}s">
      <div class="ecx-res-top"><div style="min-width:0">
        ${opts.rank ? `<div class="ecx-rank">${String(opts.rank).padStart(2, '0')}</div>` : ''}
        <div class="ecx-code">${c.code}</div>
        <div class="ecx-title">${hl(c.title, opts.q)}</div>
        ${opts.showCat ? `<div class="ecx-desc">${catName(c.cat)}</div>` : ''}
      </div>${score}</div>
      ${opts.foot ? `<div class="ecx-foot">${CATS[c.cat].f} · ${catName(c.cat)}</div>` : ''}
    </div>`;
  }

  // ── 各分頁 ──
  function viewKeyword() {
    const t = T[S.lang], q = S.kw.trim();
    const hits = q ? CODES.filter(c => c.title.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase())) : [];
    const cats = [...new Set(hits.map(c => c.cat))];
    if (S.kwCat !== 'ALL' && !cats.includes(S.kwCat)) S.kwCat = 'ALL';
    const shown = S.kwCat === 'ALL' ? hits : hits.filter(c => c.cat === S.kwCat);
    const chips = q && hits.length ? `<div class="ecx-chips">
        <button class="ecx-chip solid ${S.kwCat === 'ALL' ? 'active' : ''}" data-kwcat="ALL"><b>ALL</b> ${t.all} <small>${hits.length}</small></button>
        ${cats.map(p => `<button class="ecx-chip solid ${S.kwCat === p ? 'active' : ''}" data-kwcat="${p}"><b>${p}</b> ${catName(p)} <small>${hits.filter(c => c.cat === p).length}</small></button>`).join('')}
      </div>` : '';
    return `<div class="ecx-card">
        <div class="ecx-label">${t.kwLabel}</div>
        <div class="ecx-row"><label class="ecx-field">${SEARCH_SVG}<input class="ecx-input" id="ecx-kw" value="${esc(S.kw)}" placeholder="${t.kwPh}" autocomplete="off"></label></div>
        <div class="ecx-hint">${q ? (hits.length ? t.kwFound(hits.length, cats.length) : t.none) : t.kwHint}</div>
        ${chips}
      </div>
      ${q && hits.length ? `<div class="ecx-count">${t.kwList(S.kwCat === 'ALL' ? t.all : catName(S.kwCat), shown.length)}</div>` : ''}
      <div>${shown.map((c, i) => resCard(c, { q, i, showCat: S.kwCat === 'ALL' })).join('')}</div>`;
  }

  function viewAI() {
    const t = T[S.lang];
    let body = '';
    if (S.aiBusy) body = `<div class="ecx-loading"><div class="ecx-spin"></div>${t.thinking}</div>`;
    else if (S.aiRes === 'none') body = `<div class="ecx-empty">${t.aiNone}</div>`;
    else if (S.aiRes != null) {
      const topic = TOPICS[S.aiRes];
      const scores = topic.hits.map((_, i) => 71.8 - i * 1.6 - (i > 4 ? 2.5 : 0));
      body = `<div class="ecx-aibox"><div class="ecx-aibox-h"><span class="ic">AI</span><span>${t.aiHead}</span></div><p>${topic.ai[S.lang]}</p></div>
        <div class="ecx-count">${t.found(topic.hits.length)}</div>
        ${topic.hits.map((code, i) => resCard(byCode[code], { rank: i + 1, score: scores[i], foot: true, i })).join('')}`;
    }
    return `<div class="ecx-card">
        <div class="ecx-label">${t.aiLabel}</div>
        <div class="ecx-row">
          <label class="ecx-field">${SEARCH_SVG}<input class="ecx-input" id="ecx-ai" value="${esc(S.aiQ)}" placeholder="${t.aiPh}" autocomplete="off"></label>
          <button class="ecx-btn" id="ecx-ask" ${S.aiBusy ? 'disabled' : ''}>${t.ask}</button>
        </div>
        <div class="ecx-chips">${TOPICS.map((tp, i) => `<button class="ecx-chip dot ${S.aiRes === i ? 'active' : ''}" data-topic="${i}">${tp.chip[S.lang]}</button>`).join('')}</div>
      </div>${body}`;
  }

  function viewBrowse() {
    const t = T[S.lang];
    const list = S.brCat ? CODES.filter(c => c.cat === S.brCat) : [];
    return `<div class="ecx-card">
        <div class="ecx-label">${t.brLabel}</div>
        <div class="ecx-chips" style="margin-top:0">${Object.keys(CATS).map(p =>
          `<button class="ecx-chip ${S.brCat === p ? 'active' : ''}" data-brcat="${p}"><b>${p}</b> ${catName(p)} <small>${CODES.filter(c => c.cat === p).length}</small></button>`).join('')}</div>
      </div>
      ${S.brCat ? `<div class="ecx-count">${t.kwList(catName(S.brCat), list.length)}</div>${list.map((c, i) => resCard(c, { i })).join('')}`
        : `<div class="ecx-empty">${t.brPick}</div>`}`;
  }

  function viewRev() {
    const t = T[S.lang];
    return `<div class="ecx-card"><div class="ecx-label" style="margin:0">${t.revLabel}</div></div>
      <div class="ecx-count">${t.revCount(REVS.length)}</div>
      ${REVS.map(r => `<div class="ecx-rev">
        <div class="ecx-rev-h"><span class="ecx-date">${r.d}</span><span class="ecx-who">${r.who}</span><span class="ecx-why">${r.why[S.lang]}</span></div>
        ${r.rows.map(([code, kind]) => `<div class="ecx-rev-row"><b>${code}</b><span>${esc(byCode[code].title)}<span class="ecx-tag ${kind}">${t[kind]}</span></span></div>`).join('')}
      </div>`).join('')}`;
  }

  function render(keepFocus) {
    const t = T[S.lang];
    const views = [viewKeyword, viewAI, viewBrowse, viewRev];
    const active = document.activeElement;
    const focusId = keepFocus && active && active.id, caret = focusId ? active.selectionStart : null;
    root.innerHTML = `
      <div class="ecx-mast">
        <div class="ecx-top">
          <div class="ecx-brand"><span class="ecx-mark">&gt;_</span>ErrCode</div>
          <div class="ecx-acts">
            <div class="ecx-langs">${[['zh', '繁中'], ['en', 'EN'], ['vi', 'VN']].map(([k, l]) => `<button class="ecx-lang ${S.lang === k ? 'active' : ''}" data-lang="${k}">${l}</button>`).join('')}</div>
            <button class="ecx-login" data-login="1">${t.login}</button>
            ${S.loginNote ? `<div class="ecx-note">${t.loginNote}</div>` : ''}
          </div>
        </div>
        <div class="ecx-hero">
          <div class="ecx-eyebrow"><span class="dot"></span>ErrCodeTable.ini</div>
          <div class="ecx-h1">${t.title}</div><div class="ecx-sub">${t.sub}</div>
        </div>
      </div>
      <div class="ecx-wrap">
        <div class="ecx-tabs">${t.tabs.map((n, i) => `<button class="ecx-tab ${S.tab === i ? 'active' : ''}" data-tab="${i}">${n}</button>`).join('')}</div>
        ${views[S.tab]()}
      </div>`;
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) { el.focus(); if (caret != null) el.setSelectionRange(caret, caret); }
    }
  }

  // ── AI 查詢：比對主題關鍵字（任一語言皆可）──
  function matchTopic(q) {
    const low = ' ' + q.toLowerCase() + ' ';
    let best = -1, bestN = 0;
    TOPICS.forEach((tp, i) => {
      const n = tp.kw.filter(k => low.includes(k)).length;
      if (n > bestN) { best = i; bestN = n; }
    });
    return best;
  }
  function ask(q) {
    q = (q || '').trim();
    if (!q || S.aiBusy) return;
    S.aiQ = q; S.aiBusy = true; S.aiRes = null; render();
    setTimeout(() => {
      const i = matchTopic(q);
      S.aiBusy = false; S.aiRes = i >= 0 ? i : 'none'; render();
    }, 900 + Math.random() * 500);
  }

  // ── 事件 ──
  root.addEventListener('click', e => {
    const b = e.target.closest('button, .ecx-res');
    if (!b) return;
    if (b.dataset.lang) {
      const prev = S.lang; S.lang = b.dataset.lang;
      // 切換語言時，把 AI 查詢框換成同主題的該語言描述，示範跨語言查到同一組結果
      if (S.aiRes != null && S.aiRes !== 'none') S.aiQ = TOPICS[S.aiRes].chip[S.lang];
      else if (S.aiQ && prev !== S.lang) S.aiQ = '';
      render(); return;
    }
    if (b.dataset.login) {
      S.loginNote = !S.loginNote; render();
      clearTimeout(S.noteTimer);
      if (S.loginNote) S.noteTimer = setTimeout(() => { S.loginNote = false; render(true); }, 4000);
      return;
    }
    if (b.dataset.tab) { S.tab = +b.dataset.tab; render(); return; }
    if (b.dataset.kwcat) { S.kwCat = b.dataset.kwcat; render(); return; }
    if (b.dataset.brcat) { S.brCat = S.brCat === b.dataset.brcat ? null : b.dataset.brcat; render(); return; }
    if (b.dataset.topic) { ask(TOPICS[+b.dataset.topic].chip[S.lang]); return; }
    if (b.id === 'ecx-ask') { ask(document.getElementById('ecx-ai').value); return; }
    if (b.classList.contains('ecx-res')) {
      const code = b.dataset.code;
      try { navigator.clipboard && navigator.clipboard.writeText(code); } catch (_) {}
      root.querySelectorAll('.ecx-flag').forEach(f => f.remove());
      root.querySelectorAll('.ecx-res.copied').forEach(r => r.classList.remove('copied'));
      b.classList.add('copied');
      b.insertAdjacentHTML('beforeend', `<span class="ecx-flag">${T[S.lang].copied(code)}</span>`);
      setTimeout(() => { b.classList.remove('copied'); b.querySelector('.ecx-flag')?.remove(); }, 1400);
    }
  });
  root.addEventListener('input', e => {
    // 注音／拼音組字中不要重畫，否則輸入框會被換掉、字打不出來
    if (e.target.id === 'ecx-kw' && !e.isComposing) { S.kw = e.target.value; S.kwCat = 'ALL'; render(true); }
    if (e.target.id === 'ecx-ai') S.aiQ = e.target.value;
  });
  root.addEventListener('compositionend', e => {
    if (e.target.id === 'ecx-kw') { S.kw = e.target.value; S.kwCat = 'ALL'; render(true); }
  });
  root.addEventListener('keydown', e => {
    if (e.target.id === 'ecx-ai' && e.key === 'Enter' && !e.isComposing) { e.preventDefault(); ask(e.target.value); }
  });

  render();
})();
