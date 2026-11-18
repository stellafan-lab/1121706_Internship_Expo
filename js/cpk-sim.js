// ═══════════════════════════════════════════
// Log CPK Validator（仿真版）：外觀、三語文字照實際工具 v1.6
//  左：拖放區＋範例 log；右：總覽 → 點檔案看詳細（出問題那一行的 log 原文）
//  規則說明與介面文字取自實際工具的 I18N；log 為虛構資料，只示範其中 8 條規則
//  CPK 工具依檔名順序讀，遇到第一份不合格就停住，後面的檔案都不會被處理
// ═══════════════════════════════════════════
(() => {
  const root = document.getElementById('cxs');
  if (!root) return;

  // 取自實際工具（log-cpk-validator index.html 的 I18N）
  const I18N = {"zh": {"label": "中文", "sev": {"fatal": "不合格", "warn": "注意", "info": "參考"}, "verd": {"NG": "不合格", "WARN": "注意", "OK": "合格"}, "rules": {"R01": {"title": "缺開頭日期時間", "problem": "開頭應為「2026/09/14 10:18:15」格式的日期時間，後接空格或 TAB，此行沒有。", "impact": "讀錯位置、抓到亂碼 → 程式停住，跑不出 CPK", "fix": "讓 log 這些行補上開頭的日期時間。"}, "R03": {"title": "量測值含非數字字元", "problem": "量測值與上下限只能含數字、小數點、負號，此行有其他字元。", "impact": "數值不合法 → 立刻停住，跑不出 CPK", "fix": "檢查測試程式輸出設定，或確認 log 是否被人為改過。"}, "R05": {"title": "上下限缺左括號", "problem": "上下限應為「( 下限 , 上限 )」，此行有 ) 卻沒有 (。", "impact": "找不到左括號 → 程式當掉關閉", "fix": "確認限值格式完整，通常是輸出被截斷。"}, "R06": {"title": "測項區塊缺結束行", "problem": "每段測項結束需有一行收尾（如 Test Time: 0.75 sec），此段沒有。", "impact": "後面測項和通過標記全被吃掉 → 沒有產出", "fix": "確認測試沒中途中斷，或 log 是否被剪貼過。"}, "R07": {"title": "缺結尾通過標記", "problem": "找不到代表 DUT 測試通過的標記。", "impact": "沒有這個標記就不寫檔 → 跑不出 CPK", "fix": "FAIL 的 log 本就沒有。若應為 PASS，確認測試是否跑完。"}, "R08": {"title": "行過長", "problem": "此行超過 255 個字，工具一次只能讀 255 個字。", "impact": "被切成兩段讀，工具回報的行號會對不上", "fix": "通常是校正資料的長行，可不理會。"}, "R09": {"title": "表頭缺欄位", "problem": "表頭應有 MODEL、WS ID、SN、TEST PC、MT VER，缺了其中幾個。", "impact": "CPK 跑得出來，但檔名會錯、SN 會空白", "fix": "確認測試程式的表頭設定完整。"}, "R15": {"title": "上下限缺右括號", "problem": "此行上下限沒有用 ) 收尾。工具靠 ) 判斷是否為測項。", "impact": "不會當掉，但這個測項不算進 CPK", "fix": "確認限值格式是否完整。"}}, "ui": {"dropHint": "把 <code>.log</code> 檔拖到這裡（可以一次拖很多個），或", "pick": "選擇 log 檔…", "clear": "清除結果", "export": "⬇ 一鍵匯出 Excel", "qProblem": "問題", "qImpact": "影響", "qFix": "怎麼辦", "atLine": "第 {n} 行", "noProblem": "沒有問題", "lineColon": "第 {n} 行：", "times": "（共 {n} 處）", "secEachFile": "每個檔案的結果", "secCount": "共 {n} 份", "secFileInfo": "檔案資訊", "secResult": "檢查結果", "pillNG": "✗ 不合格 {n}", "pillWarn": "！注意 {n}", "pillOK": "✓ 合格 {n}", "emptyOne": "✓ 這份檔案沒有問題。", "mainReason": "主要原因：{title}（共 {n} 處）。", "multiHead": "{n} 份 log：", "mNG": "{n} 份不合格", "mWARN": "{n} 份要注意", "mOK": "{n} 份合格", "listSep": "、", "dMultiNG": "只要有一份不合格，整批就跑不出正確的 CPK。", "dMultiWarn": "沒有不合格的檔案，CPK 應該產得出來，但有幾點要注意。", "dMultiOK": "全部合格，可以正常導出 CPK。", "batch": "<b>注意整批會被拖垮：</b>工具是照<b>檔名順序</b>一份一份讀，讀到第一個不合格的檔案就會停住 —— 排在它<b>後面</b>的檔案完全不會被處理，而且最後計算 CPK 的步驟也不會執行。所以就算有 {good} 份是好的，也不能直接跑。建議先把不合格的 {bad} 份修好或移走，再整批重跑。", "cellFormat": "log 格式", "cellModel": "機種 MODEL", "cellWsid": "站別 WS ID", "cellSn": "序號 SN", "cellPc": "測試電腦", "cellMtver": "MT 版本", "cellItems": "預估 CPK 測項", "cellPass": "通過標記", "cellLines": "總行數", "yes": "有", "no": "沒有", "parenL": "（", "parenR": "）", "sepColon": "：", "hintOpen": "點擊查看詳細內容"}, "msg": {"missing": "缺少：{list}"}}, "en": {"label": "English", "sev": {"fatal": "Fail", "warn": "Warning", "info": "Note"}, "verd": {"NG": "Fail", "WARN": "Warning", "OK": "Pass"}, "rules": {"R01": {"title": "Missing timestamp prefix", "problem": "The line should begin with a timestamp such as \"2026/09/14 10:18:15\" followed by a space or TAB. This line does not.", "impact": "Reads from the wrong position and picks up garbage → the tool halts, no CPK", "fix": "Have the log include the timestamp prefix on these lines."}, "R03": {"title": "Measurement contains non-numeric characters", "problem": "Measurements and limits may only contain digits, a decimal point and a minus sign. This line has other characters.", "impact": "Invalid number → halts immediately, no CPK", "fix": "Check the test program's output settings, or whether the log was edited by hand."}, "R05": {"title": "Limits missing the opening bracket", "problem": "Limits should look like \"( lower , upper )\". This line has ) but no (.", "impact": "Cannot find the opening bracket → the program crashes and closes", "fix": "Check that the limit format is complete; usually the output was truncated."}, "R06": {"title": "Test block has no closing line", "problem": "Each test block must end with a closing line (such as Test Time: 0.75 sec). This block has none.", "impact": "Later items and the pass marker are all swallowed → no output", "fix": "Confirm the test was not interrupted, or whether the log was cut and pasted."}, "R07": {"title": "Missing pass marker at the end", "problem": "The marker that indicates the DUT passed could not be found.", "impact": "Without this marker nothing is written → no CPK", "fix": "A FAIL log never has it. If it should be PASS, confirm the test completed."}, "R08": {"title": "Line too long", "problem": "This line exceeds 255 characters; the tool can only read 255 characters at a time.", "impact": "Read as two pieces, so the line numbers the tool reports will not match", "fix": "Usually a long calibration data line and can be ignored."}, "R09": {"title": "Header fields missing", "problem": "The header should contain MODEL, WS ID, SN, TEST PC and MT VER. Some are missing.", "impact": "CPK still runs, but the output filename is wrong and SN is blank", "fix": "Check that the test program's header settings are complete."}, "R15": {"title": "Limits missing the closing bracket", "problem": "The limits on this line do not end with ). The tool uses ) to decide whether a line is a test item.", "impact": "No crash, but this item is not counted towards CPK", "fix": "Check whether the limit format is complete."}}, "ui": {"dropHint": "Drag <code>.log</code> files here (several at once is fine), or", "pick": "Choose log files…", "clear": "Clear results", "export": "⬇ Export Excel", "qProblem": "Problem", "qImpact": "Impact", "qFix": "What to do", "atLine": "Line {n}", "noProblem": "No problem", "lineColon": "Line {n}: ", "times": " ({n} occurrences)", "secEachFile": "Result per file", "secCount": "{n} files", "secFileInfo": "File information", "secResult": "Check result", "pillNG": "✗ Fail {n}", "pillWarn": "！Warning {n}", "pillOK": "✓ Pass {n}", "emptyOne": "✓ No problems in this file.", "mainReason": "Main cause: {title} ({n} occurrences). ", "multiHead": "{n} logs: ", "mNG": "{n} failed", "mWARN": "{n} need attention", "mOK": "{n} passed", "listSep": ", ", "dMultiNG": "A single failing file stops the whole batch from producing correct CPK.", "dMultiWarn": "No failing files, CPK should be produced, but a few points need attention.", "dMultiOK": "All passed, CPK can be exported normally.", "batch": "<b>The whole batch is affected:</b> the tool reads files one by one in <b>filename order</b> and stops at the first failing file —— every file <b>after</b> it is not processed at all, and the final CPK calculation never runs. So even with {good} good files you cannot just run it. Fix or move the {bad} failing files first, then rerun the batch.", "cellFormat": "Log format", "cellModel": "Model", "cellWsid": "Station WS ID", "cellSn": "Serial SN", "cellPc": "Test PC", "cellMtver": "MT version", "cellItems": "Estimated CPK items", "cellPass": "Pass marker", "cellLines": "Total lines", "yes": "Yes", "no": "No", "parenL": " (", "parenR": ")", "sepColon": ": ", "hintOpen": "Click for details"}, "msg": {"missing": "Missing: {list}"}}, "vi": {"label": "Tiếng Việt", "sev": {"fatal": "Không đạt", "warn": "Lưu ý", "info": "Tham khảo"}, "verd": {"NG": "Không đạt", "WARN": "Lưu ý", "OK": "Đạt"}, "rules": {"R01": {"title": "Thiếu dấu thời gian ở đầu dòng", "problem": "Dòng này phải bắt đầu bằng dấu thời gian dạng \"2026/09/14 10:18:15\", sau đó là dấu cách hoặc TAB. Dòng này không có.", "impact": "Đọc sai vị trí, lấy được ký tự rác → chương trình dừng, không ra CPK", "fix": "Yêu cầu log thêm dấu thời gian ở đầu các dòng này."}, "R03": {"title": "Giá trị đo có ký tự không phải số", "problem": "Giá trị đo và giới hạn chỉ được chứa chữ số, dấu thập phân và dấu trừ. Dòng này có ký tự khác.", "impact": "Số không hợp lệ → dừng ngay, không ra CPK", "fix": "Kiểm tra cài đặt xuất của chương trình kiểm tra, hoặc xem log có bị sửa tay không."}, "R05": {"title": "Giới hạn thiếu dấu ngoặc mở", "problem": "Giới hạn phải có dạng \"( dưới , trên )\". Dòng này có ) nhưng không có (.", "impact": "Không tìm được dấu ngoặc mở → chương trình sập và đóng", "fix": "Kiểm tra định dạng giới hạn đầy đủ; thường do phần xuất bị cắt ngắn."}, "R06": {"title": "Khối hạng mục thiếu dòng kết thúc", "problem": "Mỗi khối hạng mục phải có dòng kết thúc (ví dụ Test Time: 0.75 sec). Khối này không có.", "impact": "Các hạng mục phía sau và dấu PASS bị ăn hết → không có kết quả", "fix": "Xác nhận phép kiểm tra không bị ngắt giữa, hoặc log có bị cắt dán không."}, "R07": {"title": "Thiếu dấu PASS ở cuối log", "problem": "Không tìm thấy dấu hiệu cho biết DUT đã kiểm tra đạt.", "impact": "Không có dấu này thì không ghi tệp → không ra CPK", "fix": "Log FAIL vốn không có. Nếu đáng lẽ là PASS, hãy xác nhận phép kiểm tra đã chạy xong."}, "R08": {"title": "Dòng quá dài", "problem": "Dòng này vượt 255 ký tự; công cụ mỗi lần chỉ đọc được 255 ký tự.", "impact": "Bị đọc thành hai đoạn, nên số dòng công cụ báo sẽ không khớp", "fix": "Thường là dòng dữ liệu hiệu chuẩn dài, có thể bỏ qua."}, "R09": {"title": "Phần đầu log thiếu trường", "problem": "Phần đầu phải có MODEL, WS ID, SN, TEST PC và MT VER. Đang thiếu một số trường.", "impact": "CPK vẫn chạy được, nhưng tên tệp xuất bị sai và SN để trống", "fix": "Kiểm tra cài đặt phần đầu của chương trình kiểm tra đã đầy đủ."}, "R15": {"title": "Giới hạn thiếu dấu ngoặc đóng", "problem": "Giới hạn ở dòng này không kết thúc bằng ). Công cụ dựa vào ) để xác định đây có phải hạng mục đo không.", "impact": "Không sập, nhưng hạng mục này không được tính vào CPK", "fix": "Kiểm tra định dạng giới hạn có đầy đủ không."}}, "ui": {"dropHint": "Kéo tệp <code>.log</code> vào đây (có thể kéo nhiều tệp cùng lúc), hoặc", "pick": "Chọn tệp log…", "clear": "Xóa kết quả", "export": "⬇ Xuất Excel", "qProblem": "Vấn đề", "qImpact": "Ảnh hưởng", "qFix": "Cách xử lý", "atLine": "Dòng {n}", "noProblem": "Không có vấn đề", "lineColon": "Dòng {n}: ", "times": " (tổng {n} chỗ)", "secEachFile": "Kết quả từng tệp", "secCount": "tổng {n} tệp", "secFileInfo": "Thông tin tệp", "secResult": "Kết quả kiểm tra", "pillNG": "✗ Không đạt {n}", "pillWarn": "！Lưu ý {n}", "pillOK": "✓ Đạt {n}", "emptyOne": "✓ Tệp này không có vấn đề.", "mainReason": "Nguyên nhân chính: {title} (tổng {n} chỗ). ", "multiHead": "{n} tệp log: ", "mNG": "{n} không đạt", "mWARN": "{n} cần lưu ý", "mOK": "{n} đạt", "listSep": ", ", "dMultiNG": "Chỉ cần một tệp không đạt là cả lô sẽ không ra được CPK đúng.", "dMultiWarn": "Không có tệp nào không đạt, CPK ra được, nhưng có vài điểm cần lưu ý.", "dMultiOK": "Tất cả đều đạt, có thể xuất CPK bình thường.", "batch": "<b>Lưu ý cả lô sẽ bị ảnh hưởng:</b> Công cụ đọc lần lượt theo <b>thứ tự tên tệp</b>, gặp tệp không đạt đầu tiên là dừng —— các tệp xếp <b>sau</b> nó hoàn toàn không được xử lý, và bước tính CPK cuối cùng cũng không chạy. Nên dù có {good} tệp tốt, cũng không thể chạy trực tiếp. Nên sửa hoặc chuyển {bad} tệp không đạt ra trước, rồi chạy lại cả lô.", "cellFormat": "Định dạng log", "cellModel": "Máy MODEL", "cellWsid": "Trạm WS ID", "cellSn": "Số máy SN", "cellPc": "Máy tính kiểm tra", "cellMtver": "Phiên bản MT", "cellItems": "CPK dự kiến", "cellPass": "Dấu PASS", "cellLines": "Tổng số dòng", "yes": "Có", "no": "Không", "parenL": " (", "parenR": ")", "sepColon": ": ", "hintOpen": "Bấm để xem chi tiết"}, "msg": {"missing": "Thiếu: {list}"}}};
  // 示範版才有的字（實際工具沒有）
  const DEMO = {
    zh: { samples: '範例 log（點一下加入）', addAll: '全部加入', all: '全部', back: '← 回總覽', skipped: '不會被處理', fmt: 'Demo 格式', empty: '還沒有檔案。點左邊的範例 log 加入這一批。', none: '這個分類沒有檔案' },
    en: { samples: 'Sample logs (click to add)', addAll: 'Add all', all: 'All', back: '← Back to overview', skipped: 'not processed', fmt: 'Demo format', empty: 'No files yet. Click a sample log on the left to add it.', none: 'No files in this group' },
    vi: { samples: 'Log mẫu (bấm để thêm)', addAll: 'Thêm tất cả', all: 'Tất cả', back: '← Quay lại tổng quan', skipped: 'không được xử lý', fmt: 'Định dạng demo', empty: 'Chưa có tệp. Bấm vào log mẫu bên trái để thêm.', none: 'Không có tệp trong nhóm này' },
  };
  let LANG = 'zh';
  const L = () => I18N[LANG], U = () => I18N[LANG].ui, D = () => DEMO[LANG];
  const R = id => I18N[LANG].rules[id];
  const SEV = { R01: 'fatal', R03: 'fatal', R05: 'fatal', R06: 'fatal', R07: 'fatal', R08: 'warn', R09: 'warn', R15: 'warn' };
  const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
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
    const out = [];
    const head = [['MODEL', 'DEMO-01'], ['WS ID', 'FT'], ['SN', sn], ['TEST PC', 'PC-01'], ['MT VER', opt.ver || 'v1.00']];
    head.filter(([k]) => !(opt.dropHead || []).includes(k)).forEach(([k, v]) => out.push(ts() + `${k.padEnd(8)}:  ${v}`));
    out.push(ts() + '===== TEST ITEM START =====');
    ITEMS.forEach(([c, n, v, lo, hi], i) => {
      let line = `${c.padEnd(4)}${n.padEnd(14)}:  ${opt.badVal === i ? v + 'dB' : v}  ( ${lo} , ${hi} )`;
      if (opt.noRb === i) line = line.replace(' )', '');
      out.push(((opt.noTs || []).includes(i) ? '' : ts()) + line);
      if (opt.long === i) out.push(ts() + 'Freq: 5250:' + Array.from({ length: 40 }, (_, k) => (-109.5 + (k % 4) * 0.5).toFixed(2)).join(','));
    });
    if (!opt.noBlockEnd) out.push(ts() + 'Test Time: 0.75 sec');
    out.push(ts() + 'RESULT  :  PASS');
    if (!opt.noEnd) out.push(ts() + 'ALL TEST PASSED');
    return out;
  }
  // hint：用實際工具的規則標題組成，切換語言時一起換
  const FILES = [
    { name: 'DEMO01_SN0001.log', lines: makeLog('SN0001'), hint: [] },
    { name: 'DEMO01_SN0002.log', lines: makeLog('SN0002', { noTs: [2, 3, 4, 5] }), hint: ['R01'] },
    { name: 'DEMO01_SN0003.log', lines: makeLog('SN0003', { long: 4, noRb: 7 }), hint: ['R08', 'R15'] },
    { name: 'DEMO01_SN0004.log', lines: makeLog('SN0004', { badVal: 5 }), hint: ['R03'] },
    { name: 'DEMO01_SN0005.log', lines: makeLog('SN0005', { noEnd: true }), hint: ['R07'] },
    { name: 'DEMO01_SN0006.log', lines: makeLog('SN0006', { ver: 'v1.01', dropHead: ['TEST PC'] }), hint: ['R09'] },
  ];

  // ── 檢查一份 log（規則同示範版，對應實際工具的 R 編號）──
  const TS = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}[ \t]/;
  const NUM = /^-?\d+(\.\d+)?$/;
  function check(file) {
    const f = [];
    const add = (id, ln) => { let x = f.find(y => y.id === id); if (!x) f.push(x = { id, lines: [] }); x.lines.push(ln); };
    const head = {};
    let inBlock = false, blockEnded = false, items = 0;
    file.lines.forEach((raw, i) => {
      const ln = i + 1;
      if (raw.length > 255) add('R08', ln);
      if (!TS.test(raw)) { add('R01', ln); return; }
      const body = raw.slice(20).replace(/\t/g, ' ');
      const hm = body.match(/^(MODEL|WS ID|SN|TEST PC|MT VER)\s*:\s*(.+)$/);
      if (hm) { head[hm[1]] = hm[2].trim(); return; }
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
    const miss = ['MODEL', 'WS ID', 'SN', 'TEST PC', 'MT VER'].filter(k => !head[k]);
    if (miss.length) add('R09', 1);
    const verdict = f.some(x => SEV[x.id] === 'fatal') ? 'NG' : f.some(x => SEV[x.id] === 'warn') ? 'WARN' : 'OK';
    f.sort((a, b) => ['fatal', 'warn', 'info'].indexOf(SEV[a.id]) - ['fatal', 'warn', 'info'].indexOf(SEV[b.id]));
    return { name: file.name, lines: file.lines, findings: f, head, items, passed, verdict, miss };
  }

  // ── 狀態 ──
  const S = { picked: new Set([0, 1, 2, 5]), filter: 'all', sel: null };

  function runBatch() {
    const reps = FILES.filter((_, i) => S.picked.has(i)).map(check).sort((a, b) => a.name.localeCompare(b.name));
    const firstNg = reps.findIndex(r => r.verdict === 'NG');
    reps.forEach((r, i) => { r.skipped = firstNg >= 0 && i > firstNg; });
    return { reps, firstNg };
  }

  const oneLiner = r => {
    if (r.verdict === 'OK') return U().noProblem;
    const x = r.findings[0];
    return fmt(U().lineColon, { n: x.lines[0] }) + R(x.id).title + (x.lines.length > 1 ? fmt(U().times, { n: x.lines.length }) : '');
  };
  const mark = { NG: '✗', WARN: '!', OK: '✓' };

  function overview({ reps, firstNg }) {
    const u = U();
    const cnt = { NG: 0, WARN: 0, OK: 0 };
    reps.forEach(r => cnt[r.verdict]++);
    const all = cnt.NG ? 'NG' : cnt.WARN ? 'WARN' : 'OK';
    const main = firstNg >= 0 ? reps[firstNg].findings[0] : null;
    const head = fmt(u.multiHead, { n: reps.length }) + [['NG', u.mNG], ['WARN', u.mWARN], ['OK', u.mOK]].filter(([k]) => cnt[k]).map(([k, s]) => fmt(s, { n: cnt[k] })).join(u.listSep);
    const det = all === 'NG' ? fmt(u.mainReason, { title: R(main.id).title, n: main.lines.length }) + u.dMultiNG : all === 'WARN' ? u.dMultiWarn : u.dMultiOK;
    const bad = cnt.NG;
    const batch = reps.some(r => r.skipped) ? `<div class="cxs-batch">${fmt(u.batch, { good: cnt.WARN + cnt.OK, bad })}</div>` : '';
    const pills = [['all', `${D().all} ${reps.length}`], ['NG', fmt(u.pillNG, { n: cnt.NG })], ['WARN', fmt(u.pillWarn, { n: cnt.WARN })], ['OK', fmt(u.pillOK, { n: cnt.OK })]]
      .map(([k, t]) => `<button class="cxs-pill ${k} ${S.filter === k ? 'on' : ''} ${k !== 'all' && !cnt[k] ? 'zero' : ''}" data-flt="${k}">${t}</button>`).join('');
    const shown = reps.filter(r => S.filter === 'all' || r.verdict === S.filter);
    const rows = shown.map(r => `<tr class="${r.verdict}" data-sel="${esc(r.name)}" title="${esc(u.hintOpen)}">
        <td class="mk">${mark[r.verdict]}</td><td class="fn">${esc(r.name)}${r.skipped ? `<em>${D().skipped}</em>` : ''}</td><td class="ms">${esc(oneLiner(r))}</td><td class="go">›</td></tr>`).join('')
      || `<tr><td colspan="4" class="none">${D().none}</td></tr>`;
    return `<div class="cxs-verdict ${all}"><div class="badge">${all === 'WARN' ? L().verd.WARN : all}</div>
        <div class="vt"><div class="vh">${esc(head)}</div><div class="vd">${esc(det)}</div></div></div>
      ${batch}
      <div class="cxs-sec">${u.secEachFile}<span>${fmt(u.secCount, { n: reps.length })}</span></div>
      <div class="cxs-pills">${pills}</div>
      <table class="cxs-ov">${rows}</table>`;
  }

  // 一張問題卡片（格式照實際工具：嚴重度＋標題＋位置／問題（補充）／影響／怎麼辦）
  function card(id, loc, extra, code) {
    const u = U(), rule = R(id), sev = SEV[id];
    return `<div class="cxs-f ${sev}">
      <div class="fh"><span class="sv ${sev}">${L().sev[sev]}</span><b>${esc(rule.title)}</b><em>${esc(loc)}</em></div>
      ${code ? `<div class="code">${code}</div>` : ''}
      <dl><dt>${u.qProblem}</dt><dd>${esc(rule.problem)}${extra ? ` <span class="ex">${esc(u.parenL + extra + u.parenR)}</span>` : ''}</dd>
      <dt>${u.qImpact}</dt><dd>${esc(rule.impact)}</dd><dt>${u.qFix}</dt><dd class="fix">${esc(rule.fix)}</dd></dl></div>`;
  }

  function detail(r) {
    const u = U();
    const cell = (k, v) => `<div><small>${k}</small><b>${esc(v)}</b></div>`;
    const info = [cell(u.cellFormat, D().fmt), cell(u.cellModel, r.head.MODEL || '—'), cell(u.cellSn, r.head.SN || '—'), cell(u.cellMtver, r.head['MT VER'] || '—'),
      cell(u.cellItems, r.items), cell(u.cellPass, r.passed ? u.yes : u.no), cell(u.cellLines, r.lines.length)].join('');
    const cards = r.findings.map(x => {
      const ln = x.lines[0];
      const from = Math.max(1, ln - 1), to = Math.min(r.lines.length, ln + 1);
      const code = r.lines.slice(from - 1, to).map((l, k) => {
        const n = from + k, shown = l.length > 96 ? l.slice(0, 96) + '…' : l;
        return `<div class="cl ${n === ln ? 'hit' : ''}"><span>${n}</span><code>${esc(shown) || ' '}</code></div>`;
      }).join('');
      const extra = x.id === 'R09' ? fmt(L().msg.missing, { list: r.miss.join(u.listSep) }) : '';
      return card(x.id, fmt(u.atLine, { n: ln }) + (x.lines.length > 1 ? fmt(u.times, { n: x.lines.length }) : ''), extra, code);
    }).join('');
    return `<div class="cxs-dh"><button class="cxs-back" data-back="1">${D().back}</button>
        <span class="mini ${r.verdict}">${L().verd[r.verdict]}</span><b class="nm">${esc(r.name)}</b>${r.skipped ? `<em class="sk">${D().skipped}</em>` : ''}</div>
      <div class="cxs-info">${info}</div>
      ${cards || `<div class="cxs-ok">${u.emptyOne}</div>`}`;
  }

  function render() {
    const u = U();
    const res = runBatch();
    const sel = res.reps.find(r => r.name === S.sel);
    if (!sel) S.sel = null;
    const files = FILES.map((f, i) => `<button class="cxs-file ${S.picked.has(i) ? 'on' : ''}" data-f="${i}">
        <span class="ic">${S.picked.has(i) ? '✓' : '＋'}</span><span class="t"><b>${f.name}</b><small>${f.hint.length ? f.hint.map(id => R(id).title).join(u.listSep) : u.noProblem}</small></span></button>`).join('');
    const right = !res.reps.length ? `<div class="cxs-empty">📂 ${D().empty}</div>` : sel ? detail(sel) : overview(res);
    root.innerHTML = `
      <div class="cxs-head">
        <div class="ttl"><b>Log CPK Validator</b><span class="ver">v1.6</span></div>
        <div class="cxs-lang">${['zh', 'en', 'vi'].map(l => `<button class="${LANG === l ? 'on' : ''}" data-lang="${l}">${I18N[l].label}</button>`).join('')}</div>
        <button class="cxs-export" data-exp="1" ${res.reps.length ? '' : 'disabled'}>${u.export}</button>
      </div>
      <div class="cxs-main">
        <div class="cxs-drop">
          <div class="dh">${u.dropHint.replace(/[，,]\s*(或|or|hoặc)\s*$/, '')}</div>
          <div class="cxs-sl">${D().samples}</div>
          <div class="cxs-files">${files}</div>
          <div class="cxs-acts"><button class="pri" data-all="1">${D().addAll}</button><button data-clear="1">${u.clear}</button></div>
        </div>
        <div class="cxs-res" lang="${LANG}">${right}</div>
      </div>`;
    root._reps = res.reps;
  }

  function exportCsv() {
    const u = U();
    const rows = [['File', 'Verdict', u.qProblem, u.atLine.replace('{n}', '#'), u.qFix]];
    root._reps.forEach(r => {
      if (!r.findings.length) rows.push([r.name, L().verd[r.verdict], u.noProblem, '', '']);
      r.findings.forEach(x => rows.push([r.name, L().verd[r.verdict], R(x.id).title, x.lines[0], R(x.id).fix]));
    });
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'log_check_demo.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-f],[data-all],[data-clear],[data-flt],[data-sel],[data-back],[data-exp],[data-lang]');
    if (!t) return;
    const d = t.dataset;
    if (d.f) { const i = +d.f; S.picked.has(i) ? S.picked.delete(i) : S.picked.add(i); }
    else if (d.all) FILES.forEach((_, i) => S.picked.add(i));
    else if (d.clear) { S.picked.clear(); S.sel = null; }
    else if (d.flt) S.filter = d.flt;
    else if (d.sel) S.sel = d.sel;
    else if (d.back) S.sel = null;
    else if (d.lang) LANG = d.lang;
    else if (d.exp) { exportCsv(); return; }
    render();
  });

  render();
})();
