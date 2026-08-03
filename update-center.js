(() => {
  const passwordHash = "5057018e01f6368bb3449ff5ff9de36ae08a2a506dbfc41496e1d8282bd21dbf";
  const uploadPasswordHash = "0095046d028203016d5d3e574fe1348bb16b65707655dfb158d629bd71b6d59f";
  const manifestUrl = "data/codex-updates.json";
  const state = { updates: [], unlocked: false, uploadUnlocked: false };
  const $ = (selector) => document.querySelector(selector);

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\"/g, "&quot;").replace(/'/g, "&#39;");
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join("");
  }

  function formatBytes(value) {
    if (!Number.isFinite(value) || value <= 0) return "大小待更新";
    if (value < 1024) return value + " B";
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KB";
    return (value / 1024 / 1024).toFixed(1) + " MB";
  }

  function renderUpdates() {
    const list = $("#codexUpdateList");
    if (!list) return;
    if (!state.updates.length) {
      list.innerHTML = '<p class="update-loading">目前沒有可下載更新包；之後的技能、記憶與工作流更新會列在這裡。</p>';
      return;
    }
    list.innerHTML = state.updates.map((item, index) => {
      const itemUnlocked = state.unlocked || item.publicAccess === true;
      const commandText = itemUnlocked
        ? escapeHtml(buildTgbotInstruction(item))
        : "向客服索取更新密碼並解鎖後，這裡會顯示可直接貼給 Codex／TGBOT 的網站自動安裝指令。";
      const commandSummary = itemUnlocked
        ? "查看 Codex 網站自動安裝指令"
        : "解鎖後可查看自動安裝指令";
      const downloadLabel = itemUnlocked ? "下載更新包" : "輸入密碼後下載";
      const commandLabel = itemUnlocked
        ? "一鍵複製 Codex 自動安裝指令"
        : "解鎖後可一鍵複製";
      const disabled = itemUnlocked ? "" : " disabled";
      const kindLabel = item.kind === "tgbot-installer"
        ? "TGBOT 完整安裝包"
        : item.kind === "tgbot-comprehensive-update"
          ? "TGBOT 綜合更新包"
        : item.kind === "tgbot-menu-update"
          ? "TGBOT 功能選單更新"
          : "Codex 技能更新";
      return [
        '<article class="codex-update-item">',
        '<strong>' + escapeHtml(item.title || item.id) + '</strong>',
        '<p>' + escapeHtml(item.description || "Codex 更新包") + '</p>',
        '<div class="codex-update-meta">',
        '<span>' + kindLabel + '</span>',
        '<span>版本 ' + escapeHtml(item.version || "未知") + '</span>',
        '<span>' + escapeHtml(item.createdAt || "日期未標示") + '</span>',
        '<span>' + escapeHtml(formatBytes(Number(item.size))) + '</span>',
        item.publicAccess === true ? '<span>公開免登入</span>' : '',
        '</div>',
        '<div class="update-action-row">',
        '<button type="button" class="update-download-button" data-update-index="' + index + '"' + disabled + '>' + downloadLabel + '</button>',
        '<button type="button" class="update-command-button" data-update-index="' + index + '"' + disabled + '>' + commandLabel + '</button>',
        '</div>',
        '<details class="update-command-preview' + (itemUnlocked ? ' is-ready' : '') + '">',
        '<summary>' + commandSummary + '</summary>',
        '<pre class="update-command">' + commandText + '</pre>',
        '</details>',
        '<small class="update-tgbot-hint">' +
          (item.kind === "tgbot-installer"
            ? "貼給 Codex／TGBOT 後，它會操作網站輸入客服提供的密碼、下載完整安裝包，並保留現有設定完成驗證。"
            : item.kind === "tgbot-comprehensive-update"
              ? "貼給 Codex／TGBOT 後，它會依目前是否已有五個掛鉤，自動選擇 update/ 增量更新或 install/ 全新安裝，完成測試、備份與驗證。"
            : item.kind === "tgbot-menu-update"
              ? "貼給 Codex／COI／TGBOT 後，它會下載教學更新包、先讀技能與整合指南，再安裝、重啟目前 Bot 並驗證真實選單。"
              : "貼給 Codex／TGBOT 後，它會操作網站輸入客服提供的密碼、下載更新包，先乾跑再正式套用與驗證。") +
          '</small>',
        '</article>'
      ].join("");
    }).join("");
  }

  function setAccessStatus(message, isError) {
    const status = $("#codexUpdateAccessStatus");
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? "#ff9b9b" : "var(--gold)";
  }

  function setUploadAccessStatus(message, isError) {
    const status = $("#codexUploadAccessStatus");
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? "#ff9b9b" : "var(--gold)";
  }

  function setUploadLocked(locked) {
    const fileInput = $("#codexUpdateFile");
    const dropZone = $(".update-file-drop");
    const dropTitle = $("#codexUpdateDropTitle");
    const dropHint = $("#codexUpdateDropHint");
    if (fileInput) fileInput.disabled = locked;
    if (dropZone) {
      dropZone.classList.toggle("is-locked", locked);
      dropZone.setAttribute("aria-disabled", String(locked));
    }
    if (dropTitle) dropTitle.textContent = locked ? "請先輸入管理者密碼" : "點擊選取或拖曳更新檔到這裡";
    if (dropHint) dropHint.textContent = locked ? "解鎖後可檢查格式、版本、內容清單與檔案大小" : "檢查格式、版本、內容清單與檔案大小";
  }

  function enableDownloads() {
    renderUpdates();
  }

  function downloadUpdate(item) {
    const anchor = document.createElement("a");
    anchor.href = item.file;
    anchor.download = item.file.split("/").pop() || "codex-update.bsmf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setAccessStatus("下載已開始；也可以按「一鍵複製 Codex 自動安裝指令」交給目前的 Codex／TGBOT 完成更新。", false);
  }

  function absoluteAssetUrl(relativePath) {
    return new URL(relativePath, new URL(".", window.location.href)).href;
  }

  function buildTgbotInstruction(item) {
    const base = new URL(".", window.location.href).href;
    const updateCenterUrl = new URL("#codex-updates", base).href;
    const fileName = item.file.split("/").pop() || item.id || "更新包";
    const downloadUrl = absoluteAssetUrl(item.file);
    const expectedSha256 = item.sha256 || "請以網站清單標示為準";
    if (item.kind === "tgbot-comprehensive-update") {
      return [
        "請直接替目前這個 TGBOT 完成今天的綜合更新，不要只下載、解壓或說明流程。只能處理目前這一端，不可改到其他 Bot。",
        "",
        "更新網站：" + updateCenterUrl,
        "網站下載密碼：請向客服索取後再輸入，不要要求公開頁面顯示密碼。",
        "更新名稱：" + (item.title || item.id || "TGBOT 今日綜合更新包"),
        "更新版本：" + (item.version || "2026.08.03"),
        "下載檔名：" + fileName,
        "綜合包直接網址：" + downloadUrl,
        "預期 SHA256：" + expectedSha256,
        "新手教學入口：https://ohyagan-crypto.github.io/owner-work-map-website/#all-skills",
        "",
        "請依序完成並驗證：",
        "1. 開啟更新網站並解鎖，找到完全相同的名稱與版本，等待 ZIP 真正下載完成；按鈕失效時才使用上方同一個直接網址。",
        "2. 確認檔案存在、檔名正確，計算 ZIP SHA256，必須與預期值一致；不一致立即停止。",
        "3. 解壓到日期化任務資料夾，先讀根目錄 COMPREHENSIVE_UPDATE_GUIDE_20260803.md、PACKAGE_MANIFEST_20260803.md、VERSION_20260803.json。",
        "4. 只辨識目前 Bot 的根目錄、主程式、Token 來源、PID、heartbeat 與重啟方式；不可猜測或使用其他 Bot。",
        "5. 檢查主程式是否已有 telegram_studio_menu 的五個掛鉤：有才使用 update/APPLY_MENU_UPDATE_20260803.ps1；沒有才使用 install/INSTALL_MENU_20260803.ps1。不可兩條路徑都套用。",
        "6. 依對應資料夾先執行備份、語法編譯、單元測試與驗證；任何失敗都停止，不得重啟或覆蓋設定。",
        "7. 保留目前 Bot 的 model、provider、reasoning、service tier、.env、Token、登入狀態、排程與對話資料；禁止輸出或打包秘密，也不可更換模型。",
        "8. 驗證功能選單、生活服務／蝦教室底部互跳、18 個入口、FAST 設定與回復工具；再只重啟目前 Bot，確認 getMe、單一 PID、heartbeat 與真實 Telegram 測試恢復。",
        "9. 以繁體中文回報實際 Bot、採用 update 或 install 路徑、版本、備份、每項驗證與重啟狀態；若缺少真實資料來源，回報具體卡點。",
        "",
        "完成標準：ZIP 與 SHA256 正確、指南已讀、正確路徑完成備份與套用、測試及語法檢查通過、目前 Bot 重啟成功、選單與互跳功能由真實 Telegram 驗證。"
      ].join("\\n");
    }
    if (item.instructionProfile === "menu-update-20260803") {
      return [
        "請替目前這個 Codex／COI／TGBOT 學習並套用「TGBOT 功能選單更新包 20260803」。請實際完成，不要只下載或說明；只能處理目前這一端，不可改到其他 Bot。",
        "",
        "教學頁：" + updateCenterUrl,
        "更新名稱：" + (item.title || item.id),
        "更新版本：" + (item.version || "20260803"),
        "更新包直接網址：" + downloadUrl,
        "預期 SHA256：" + expectedSha256,
        "",
        "請依序完成並驗證：",
        "1. 下載 ZIP，確認檔名與大小後計算 SHA256；必須和上方預期值一致，不一致立即停止。",
        "2. 解壓到日期化任務資料夾，先完整讀取 INSTALL_FOR_OTHER_CODEX_20260803.md。",
        "3. 確認目前 Bot 已接好 telegram_studio_menu 的匯入、持久鍵盤、訊息路由、命令同步、提醒掃描五個掛鉤；若缺少就停止並回報需要改用全新安裝包。",
        "4. 在解壓目錄執行：powershell -ExecutionPolicy Bypass -File .\\APPLY_MENU_UPDATE_20260803.ps1 -BotDirectory \"<目前 Bot 根目錄>\"；主程式不是 codex_bot.py 時加上 -BotScript \"<主程式檔名>\"。",
        "5. 更新器必須先備份、通過 Python 編譯與 7 項測試才可覆蓋；失敗時確認原檔已自動復原。",
        "6. 保留 model、provider、reasoning、Token、聊天授權、.env、登入狀態、既有排程與 watchdog；只能把 Codex CLI 正規化為唯一一列頂層 service_tier = \"fast\"。",
        "7. 只重啟目前這個 TGBOT，驗證 getMe 成功、只有一個 Bot Python PID、heartbeat 新鮮且沒有近期啟動錯誤。",
        "8. 實測功能選單 18 個入口、生活服務、統一待辦、記帳、學習卡、蝦教室互跳與普通簡報路由；「製作簡報」不得誤進 NBS，只有明確 NBS／NotebookLM 才走 NBS。",
        "9. 用繁體中文回報更新目標、備份位置、編譯與 7 項測試、service_tier 驗證、模型設定未變、重啟健康狀態與入口實測摘要。",
        "",
        "安全規則：不可顯示或上傳 Token、cookie、密碼、chat_id、.env、瀏覽器憑證、raw log 或內部 debug；不可留下半套修改，也不可拿其他 Bot 的狀態當成完成。"
      ].join("\n");
    }
    if (item.kind === "tgbot-menu-update") {
      return [
        "請直接替目前這個 Codex／COI／TGBOT 安裝並學會藍星蝦咩功能選單更新，不要只下載、解壓或說明流程。只能處理目前這一端，不可改到其他 Bot。",
        "",
        "更新網站：" + updateCenterUrl,
        "網站下載密碼：請向客服索取後再輸入，不要要求公開頁面顯示密碼。",
        "更新名稱：" + (item.title || item.id || "TGBOT 功能選單更新"),
        "更新版本：" + (item.version || "未知"),
        "下載檔名：" + fileName,
        "更新包直接網址：" + downloadUrl,
        "預期 SHA256：" + expectedSha256,
        "",
        "請依序完成並驗證：",
        "1. 操作網站解鎖下載，找到完全相同的名稱與版本，等待 ZIP 真正下載完成；按鈕無法下載時才使用上方同一檔案直接網址。",
        "2. 計算 ZIP SHA256，必須與預期值一致；不一致立即停止。",
        "3. 解壓到日期化任務資料夾，先完整讀 INSTALL_FOR_OTHER_CODEX.md、MEMORY_AND_BEHAVIOR_SUMMARY.md、skills/tgbot-lbot-menu-parity/SKILL.md 與它指定的兩份 reference。",
        "4. 自動辨識目前 Bot 的根目錄、主程式、Telegram 呼叫、Bot 名稱、實際 Token 紀錄與重啟方式；不可猜測或使用其他 Bot。",
        "5. 執行 SET_FAST_SERVICE_TIER_20260728.ps1，只保留一條 service_tier = \"fast\"；不得更換模型、供應商或推理強度。",
        "6. 執行 UPDATE_TGBOT_MENU_20260728.ps1，明確傳入目前 Bot 根目錄。它只安裝技能與共用模組；若主程式缺掛接點，依 INTEGRATION_GUIDE_20260728.md 實際整合。",
        "7. 保留 .env、Token、Chat ID、登入狀態、排程、對話資料與其他 Bot；禁止輸出或打包任何秘密。",
        "8. 執行 verify_tgbot_menu_20260728.py，並對共用模組與目前 Bot 主程式執行 py_compile。任何檢查失敗都不得重啟或宣稱完成。",
        "9. 只重啟目前 Bot，確認程序與心跳恢復，再從真實 Telegram 測試 /menu、/studio、/status、製作圖片、蝦咩工作室、Token 統計、收合選單與重新開啟。",
        "10. 用繁體中文回報目前 Bot、版本、備份、每項驗證結果與重啟狀態；若架構不同或缺真實資料來源，要說明具體缺口。",
        "",
        "完成標準：檔案與 SHA256 正確、教學已讀、技能與模組已安裝、FAST 單一設定、主程式掛接完成、離線測試與語法檢查通過、目前 Bot 重啟成功、真實 Telegram 選單與 UTF-8 中文指令驗證通過。"
      ].join("\n");
    }
    if (item.kind === "tgbot-installer") {
      return [
        "請直接替目前這個 TGBOT 完成更新，不要只說明流程。只能更新本 TGBOT 自己的安裝目錄，不可改到其他 TG Bot。",
        "",
        "更新網站：" + updateCenterUrl,
        "網站下載密碼：請向客服索取後再輸入，不要要求公開頁面顯示密碼。",
        "安裝包名稱：" + (item.title || item.id || "TGBOT 完整安裝包"),
        "安裝包版本：" + (item.version || "未知"),
        "下載檔名：" + fileName,
        "更新包直接網址：" + downloadUrl,
        "預期 SHA256：" + expectedSha256,
        "",
        "這是一個可執行的完整交付指令。請真的操作網站、下載檔案、執行安裝與驗收，不要只回報開始或下載中：",
        "1. 使用可操作網頁的瀏覽器開啟更新網站，捲到「Codex 更新中心」。",
        "2. 在「更新密碼」輸入客服提供的更新密碼，按「解鎖下載與一鍵指令」；不要輸入管理者上傳密碼，也不要把密碼回覆在公開訊息中。",
        "3. 找到完全相同的安裝包名稱與版本，按「下載更新包」，等待 ZIP 實際下載完成；若按鈕沒有觸發下載，才使用上方同一個更新包直接網址。",
        "4. 確認下載檔存在、檔名正確，計算 ZIP SHA256；必須與上方預期值一致，不一致就停止，不得安裝。",
        "5. 將 ZIP 移到本機日期任務資料夾後完整解壓；先讀取包內 UPDATE_GUIDE_20260723.txt 與 INSTALL_TGBOT_SKILL_TOOLS.ps1，不要跳過說明。",
        "6. 在解壓目錄執行：powershell -NoProfile -ExecutionPolicy Bypass -File .\\PORTABILITY_SELF_TEST.ps1 -PackageRoot .",
        "7. 只有自測回傳 PORTABILITY_SELF_TEST_OK 才能繼續；接著執行：powershell -NoProfile -ExecutionPolicy Bypass -File .\\UPDATE_INSTALLED_TGBOT.ps1",
        "8. 更新器必須保留現有 .env、Token、API、CHAT ID、Codex 設定與瀏覽器登入狀態，並建立既有檔案備份；不要自行改寫其他 TG Bot。",
        "9. 讓更新器完成 Chrome、LINE 技能、TGBOT 工具、命令通道與新 heartbeat 驗證，再只重啟目前這個 TGBOT。",
        "10. 確認目前 TGBOT 已恢復運作、新版本已載入，最後回報版本、驗證結果、備份資料夾與更新狀態檔路徑。",
        "",
        "完成標準：網站解鎖成功、指定檔案真的下載、SHA256 正確、自測通過、更新器成功建立備份並套用、目前 TGBOT 重啟後產生新 heartbeat 且命令通道可驗證。",
        "如果網站無法開啟、密碼解鎖失敗、找不到指定版本、SHA256 不符、缺少既有 TGBOT，或任何驗證失敗，請停止並用繁體中文回報明確卡點，不要覆蓋設定，也不要改用其他 TG Bot。"
      ].join("\n");
    }
    return [
      "請直接替目前這個 Codex／TGBOT 完成更新，不要只說明流程。只能更新目前這一套 Codex 根目錄，不可改到其他 TG Bot。",
      "",
      "更新網站：" + updateCenterUrl,
      "網站下載密碼：請向客服索取後再輸入，不要要求公開頁面顯示密碼。",
      "更新名稱：" + (item.title || item.id || "Codex 更新包"),
      "更新版本：" + (item.version || "未知"),
      "下載檔名：" + fileName,
        "更新包直接網址：" + downloadUrl,
        "套用工具網址：" + absoluteAssetUrl("tools/apply-codex-update.mjs"),
        "預期 SHA256：" + expectedSha256,
        "",
        "這是一個可執行的完整交付指令。請真的操作網站、下載、套用與驗收，不要只回報開始或下載中：",
        "1. 使用可操作網頁的瀏覽器開啟更新網站，捲到「Codex 更新中心」。",
        "2. 在「更新密碼」輸入客服提供的更新密碼，按「解鎖下載與一鍵指令」；不要輸入管理者上傳密碼，也不要把密碼回覆在公開訊息中。",
        "3. 找到完全相同的更新名稱與版本，按「下載更新包」，等待 .bsmf 檔實際下載完成；若按鈕沒有觸發下載，才使用上方同一個更新包直接網址。",
        "4. 展開頁面的「進階：手動使用套用工具」，下載 apply-codex-update.mjs；若頁面無法下載，才使用上方套用工具網址。",
        "5. 確認兩個下載檔都存在，計算 .bsmf 的 SHA256；必須與上方預期值一致。",
        "6. 讀取更新包內的 INSTALL_FOR_OTHER_CODEX.md；確認它只會合併 skills、memories、workflows 與安裝說明，不會帶入密碼、Token、Cookie 或瀏覽器資料。",
        "7. 自動辨識目前這個 Codex／TGBOT 自己使用的 Codex 根目錄，不可猜測或套用到其他 TG Bot；若無法辨識，必須停止詢問，不可寫入。",
        "8. 先在目前程序設定 BSMF_UPDATE_PASSWORD 環境變數，再執行：node apply-codex-update.mjs --url " + downloadUrl + " --target-root <目前這套 Codex 根目錄> --dry-run；不要把密碼直接放進命令列或回覆訊息。",
        "9. 乾跑必須確認格式、AES-256-GCM 完整性、SHA256、允許路徑與寫入目標都通過；通過後移除 --dry-run 正式套用同一條指令，完成後清除 BSMF_UPDATE_PASSWORD 環境變數。",
        "10. 正式套用後只重啟目前這個 Codex 或 TGBOT，確認記憶、技能、工作流索引已重新載入，最後回報版本、安裝內容、驗證結果與本機備份路徑。",
        "",
        "完成標準：網站解鎖成功、指定檔案真的下載、SHA256 正確、乾跑通過、正式套用成功、目前這套 Codex 重啟後新內容可讀取。",
        "如果網站無法開啟、密碼解鎖失敗、找不到指定版本、SHA256 不符、無法辨識正確根目錄或乾跑失敗，請停止正式套用並用繁體中文回報明確卡點，不要改到其他 TG Bot。"
      ].join("\n");
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        // Fall through to the textarea method for restricted browsers.
      }
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      textarea.remove();
    }
    return copied;
  }

  async function copyApplyCommand(item) {
    const command = buildTgbotInstruction(item);
    if (await copyText(command)) {
      setAccessStatus("Codex 網站自動安裝指令已複製；直接貼給要升級的 Codex／TGBOT 即可。", false);
    } else {
      setAccessStatus("瀏覽器未允許複製，請重新開啟網站後再試一次。", true);
    }
  }

  async function inspectSelectedFile(file) {
    const status = $("#codexUpdateFileStatus");
    if (!status || !file) return;
    if (!state.uploadUnlocked) {
      setUploadAccessStatus("請先輸入正確的管理者密碼。", true);
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      status.textContent = "檔案超過 80 MB，請改用分批更新或先壓縮內容。";
      return;
    }
    try {
      if (file.name.toLowerCase().endsWith(".zip")) {
        const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
        const isZip = header.length === 4 && header[0] === 0x50 && header[1] === 0x4b &&
          (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07);
        if (!isZip) throw new Error("zip");
        status.textContent = "已讀取 TGBOT 安裝包：「" + file.name + "」｜ZIP 格式正常｜" + formatBytes(file.size);
        status.style.color = "var(--cyan)";
        return;
      }
      const envelope = JSON.parse(await file.text());
      if (envelope.format !== "bsmf-codex-update-v1" || !envelope.manifest) throw new Error("format");
      const contents = Array.isArray(envelope.manifest.contents) ? envelope.manifest.contents.length : 0;
      status.textContent = "已讀取：「" + (envelope.manifest.title || "Codex 更新包") + "」｜版本 " + (envelope.manifest.version || "未知") + "｜" + contents + " 個檔案｜加密格式正常";
      status.style.color = "var(--cyan)";
    } catch (error) {
      status.textContent = "檔案無法通過格式檢查，請確認是 .bsmf 更新包或完整 ZIP 安裝包。";
      status.style.color = "#ff9b9b";
    }
  }

  async function loadManifest() {
    try {
      const response = await fetch(manifestUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("manifest unavailable");
      const payload = await response.json();
      state.updates = Array.isArray(payload.updates) ? payload.updates : [];
    } catch (error) {
      state.updates = [];
    }
    renderUpdates();
  }

  function bind() {
    const form = $("#codexUpdateAccessForm");
    const passwordInput = $("#codexUpdatePassword");
    const uploadForm = $("#codexUploadAccessForm");
    const uploadPasswordInput = $("#codexUploadPassword");
    const fileInput = $("#codexUpdateFile");
    const dropZone = $(".update-file-drop");
    if (form) form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const digest = await sha256(passwordInput.value);
      if (digest !== passwordHash) {
        state.unlocked = false;
        renderUpdates();
        setAccessStatus("密碼不正確，未開放下載。", true);
        return;
      }
      state.unlocked = true;
      enableDownloads();
      setAccessStatus("密碼正確；現在可以下載更新包。", false);
    });
    if (uploadForm) uploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const digest = await sha256(uploadPasswordInput.value);
      if (digest !== uploadPasswordHash) {
        state.uploadUnlocked = false;
        setUploadLocked(true);
        setUploadAccessStatus("管理者密碼不正確，未開放上傳檢查。", true);
        return;
      }
      state.uploadUnlocked = true;
      setUploadLocked(false);
      setUploadAccessStatus("管理者驗證成功；現在可以選取或拖曳更新檔。", false);
    });
    if (fileInput) fileInput.addEventListener("change", () => inspectSelectedFile(fileInput.files[0]));
    if (dropZone) {
      dropZone.addEventListener("click", (event) => {
        if (state.uploadUnlocked) return;
        event.preventDefault();
        setUploadAccessStatus("請先輸入正確的管理者密碼。", true);
        uploadPasswordInput?.focus();
      });
      ["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (!state.uploadUnlocked) return;
        dropZone.classList.add("is-dragging");
      }));
      ["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove("is-dragging"); }));
      dropZone.addEventListener("drop", (event) => {
        if (!state.uploadUnlocked) {
          setUploadAccessStatus("請先輸入正確的管理者密碼。", true);
          return;
        }
        inspectSelectedFile(event.dataTransfer.files[0]);
      });
    }
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".update-download-button");
      const commandButton = event.target.closest(".update-command-button");
      if (!button && !commandButton) return;
      const target = button || commandButton;
      const item = state.updates[Number(target.dataset.updateIndex)];
      if (!item) return;
      if (!state.unlocked && item.publicAccess !== true) {
        setAccessStatus("請先輸入更新密碼，才能下載或一鍵複製 Codex 自動安裝指令。", true);
        return;
      }
      if (button) downloadUpdate(item);
      else copyApplyCommand(item);
    });
  }

  document.addEventListener("DOMContentLoaded", () => { setUploadLocked(true); bind(); loadManifest(); });
})();
