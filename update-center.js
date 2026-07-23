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
      const commandText = state.unlocked
        ? escapeHtml(buildTgbotInstruction(item))
        : "輸入 bsmf 解鎖後，這裡會顯示可直接貼給 Codex／TGBOT 的網站自動安裝指令。";
      const commandSummary = state.unlocked
        ? "查看 Codex 網站自動安裝指令"
        : "解鎖後可查看自動安裝指令";
      const downloadLabel = state.unlocked ? "下載更新包" : "輸入密碼後下載";
      const commandLabel = state.unlocked
        ? "一鍵複製 Codex 自動安裝指令"
        : "解鎖後可一鍵複製";
      const disabled = state.unlocked ? "" : " disabled";
      const kindLabel = item.kind === "tgbot-installer" ? "TGBOT 完整安裝包" : "Codex 技能更新";
      return [
        '<article class="codex-update-item">',
        '<strong>' + escapeHtml(item.title || item.id) + '</strong>',
        '<p>' + escapeHtml(item.description || "Codex 更新包") + '</p>',
        '<div class="codex-update-meta">',
        '<span>' + kindLabel + '</span>',
        '<span>版本 ' + escapeHtml(item.version || "未知") + '</span>',
        '<span>' + escapeHtml(item.createdAt || "日期未標示") + '</span>',
        '<span>' + escapeHtml(formatBytes(Number(item.size))) + '</span>',
        '</div>',
        '<div class="update-action-row">',
        '<button type="button" class="update-download-button" data-update-index="' + index + '"' + disabled + '>' + downloadLabel + '</button>',
        '<button type="button" class="update-command-button" data-update-index="' + index + '"' + disabled + '>' + commandLabel + '</button>',
        '</div>',
        '<details class="update-command-preview' + (state.unlocked ? ' is-ready' : '') + '">',
        '<summary>' + commandSummary + '</summary>',
        '<pre class="update-command">' + commandText + '</pre>',
        '</details>',
        '<small class="update-tgbot-hint">' +
          (item.kind === "tgbot-installer"
            ? "貼給 Codex／TGBOT 後，它會操作網站輸入密碼、下載完整安裝包，並保留現有設定完成驗證。"
            : "貼給 Codex／TGBOT 後，它會操作網站輸入密碼、下載更新包，先乾跑再正式套用與驗證。") +
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
    setAccessStatus("下載已開始；也可以按「複製升級指令」貼給 TGBOT 自動完成更新。", false);
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
    if (item.kind === "tgbot-installer") {
      return [
        "請直接替目前這個 TGBOT 完成更新，不要只說明流程。只能更新本 TGBOT 自己的安裝目錄，不可改到其他 TG Bot。",
        "",
        "更新網站：" + updateCenterUrl,
        "網站下載密碼：bsmf",
        "安裝包名稱：" + (item.title || item.id || "TGBOT 完整安裝包"),
        "安裝包版本：" + (item.version || "未知"),
        "下載檔名：" + fileName,
        "更新包直接網址：" + downloadUrl,
        "預期 SHA256：" + expectedSha256,
        "",
        "請依序完成，不要只回報開始或下載中：",
        "1. 使用可操作網頁的瀏覽器開啟更新網站，捲到「Codex 更新中心」。",
        "2. 在「更新密碼」輸入 bsmf，按「解鎖下載與一鍵指令」；不要輸入管理者上傳密碼。",
        "3. 找到完全相同的安裝包名稱與版本，按「下載更新包」，等待 ZIP 實際下載完成；若按鈕沒有觸發下載，才使用上方同一個更新包直接網址。",
        "4. 確認下載檔存在、檔名正確，計算 ZIP SHA256；必須與上方預期值一致，不一致就停止，不得安裝。",
        "5. 將 ZIP 移到本機日期任務資料夾後完整解壓，先執行 PORTABILITY_SELF_TEST.cmd。",
        "6. 自測通過後執行 UPDATE_INSTALLED_TGBOT.cmd，保留現有 .env、Token、API、CHAT ID 與瀏覽器登入狀態。",
        "7. 讓更新器完成 Chrome、LINE 技能、TGBOT 工具與命令通道驗證，再只重啟目前這個 TGBOT。",
        "8. 確認目前 TGBOT 已恢復運作、新版本已載入，最後回報版本、驗證結果與本機備份路徑。",
        "",
        "完成標準：網站解鎖成功、下載檔存在、SHA256 正確、自測通過、安裝成功、目前 TGBOT 重啟後可正常運作。",
        "如果網站無法開啟、密碼解鎖失敗、找不到指定版本、SHA256 不符、缺少既有 TGBOT，或任何驗證失敗，請停止並用繁體中文回報明確卡點，不要覆蓋設定，也不要改用其他 TG Bot。"
      ].join("\n");
    }
    return [
      "請直接替目前這個 Codex／TGBOT 完成更新，不要只說明流程。只能更新目前這一套 Codex 根目錄，不可改到其他 TG Bot。",
      "",
      "更新網站：" + updateCenterUrl,
      "網站下載密碼：bsmf",
      "更新名稱：" + (item.title || item.id || "Codex 更新包"),
      "更新版本：" + (item.version || "未知"),
      "下載檔名：" + fileName,
      "更新包直接網址：" + downloadUrl,
      "套用工具網址：" + absoluteAssetUrl("tools/apply-codex-update.mjs"),
      "預期 SHA256：" + expectedSha256,
      "",
      "請依序完成，不要只回報開始或下載中：",
      "1. 使用可操作網頁的瀏覽器開啟更新網站，捲到「Codex 更新中心」。",
      "2. 在「更新密碼」輸入 bsmf，按「解鎖下載與一鍵指令」；不要輸入管理者上傳密碼。",
      "3. 找到完全相同的更新名稱與版本，按「下載更新包」，等待 .bsmf 檔實際下載完成；若按鈕沒有觸發下載，才使用上方同一個更新包直接網址。",
      "4. 展開頁面的「進階：手動使用套用工具」，下載 apply-codex-update.mjs；若頁面無法下載，才使用上方套用工具網址。",
      "5. 確認兩個下載檔都存在，計算 .bsmf 的 SHA256；必須與上方預期值一致。",
      "6. 自動辨識目前這個 Codex／TGBOT 自己使用的 Codex 根目錄，不可猜測或套用到其他 TG Bot。",
      "7. 先用 apply-codex-update.mjs 執行 --dry-run，檢查更新包完整性、安全路徑與可安裝內容。",
      "8. 乾跑通過後，移除 --dry-run 正式套用；再重啟目前這個 Codex 或 TGBOT。",
      "9. 確認記憶、技能、工作流索引已重新載入，最後回報版本、安裝內容、驗證結果與本機備份路徑。",
      "",
      "完成標準：網站解鎖成功、下載檔存在、SHA256 正確、乾跑通過、正式套用成功、重啟後新內容可讀取。",
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
      if (!state.unlocked) {
        setAccessStatus("請先輸入更新密碼，才能下載或一鍵複製 Codex 自動安裝指令。", true);
        return;
      }
      const target = button || commandButton;
      const item = state.updates[Number(target.dataset.updateIndex)];
      if (!item) return;
      if (button) downloadUpdate(item);
      else copyApplyCommand(item);
    });
  }

  document.addEventListener("DOMContentLoaded", () => { setUploadLocked(true); bind(); loadManifest(); });
})();
