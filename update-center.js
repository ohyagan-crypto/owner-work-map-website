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
        : "輸入 bsmf 解鎖後，這裡會直接顯示可貼給 TGBOT 的完整升級指令。";
      const commandSummary = state.unlocked
        ? "查看要貼給 TGBOT 的完整升級指令"
        : "解鎖後可查看完整升級指令";
      const downloadLabel = state.unlocked ? "下載更新包" : "輸入密碼後下載";
      const commandLabel = state.unlocked
        ? (item.kind === "tgbot-installer" ? "複製 TGBOT 安裝指令" : "複製給 TGBOT 的升級指令")
        : "解鎖後可複製升級指令";
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
            ? "完整安裝包會保留現有設定，並執行 Chrome、TGBOT 工具與 LINE 技能的升級驗證。"
            : "推薦：複製升級指令後直接貼給要升級的 TGBOT，它會自動下載、檢查、套用與驗證。") +
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

  function buildTgbotInstruction(item) {
    const base = new URL(".", window.location.href).href;
    const updateUrl = new URL(item.file, base).href;
    if (item.kind === "tgbot-installer") {
      return [
        "請替目前這個 TGBOT 安裝 Chrome＋LINE 官方完整更新包，只能更新本 TGBOT 自己的安裝目錄，不可改到其他 TG Bot。",
        "",
        "安裝包名稱：" + (item.title || item.id || "TGBOT 完整安裝包"),
        "安裝包版本：" + (item.version || "未知"),
        "安裝包：" + updateUrl,
        "",
        "請依序完成：",
        "1. 將 ZIP 下載到本機日期資料夾並完整解壓。",
        "2. 先執行 PORTABILITY_SELF_TEST.cmd，確認包內檔案與環境檢查通過。",
        "3. 執行 UPDATE_INSTALLED_TGBOT.cmd，保留現有 .env、Token、API、CHAT ID 與瀏覽器登入狀態。",
        "4. 讓更新器完成 Chrome、LINE 技能、TGBOT 工具與命令通道驗證。",
        "5. 重啟目前這個 TGBOT，確認新 heartbeat、命令通道與 LINE 技能已載入。",
        "6. 回報更新版本、驗證結果與本機備份路徑。",
        "",
        "如果缺少既有 TGBOT、需要帳號安全確認，或任何驗證失敗，請停止並回報明確卡點，不要覆蓋設定。"
      ].join("\n");
    }
    const toolUrl = new URL("tools/apply-codex-update.mjs", base).href;
    return [
      "請替目前這個 TGBOT 安裝 Codex 更新，只能更新本 TGBOT 自己使用的 Codex 根目錄，不可改到其他 TG Bot。",
      "",
      "更新名稱：" + (item.title || item.id || "Codex 更新包"),
      "更新版本：" + (item.version || "未知"),
      "更新包：" + updateUrl,
      "套用工具：" + toolUrl,
      "更新密碼：bsmf",
      "",
      "請依序完成：",
      "1. 將套用工具與更新包下載到本機日期資料夾。",
      "2. 自動辨識目前這個 TGBOT 對應的 Codex 根目錄。",
      "3. 先執行 dry-run，檢查更新包完整性、敏感資料與寫入路徑。",
      "4. 驗證通過後，移除 --dry-run 正式套用更新。",
      "5. 重啟目前這個 TGBOT 或 Codex，確認記憶、技能、工作流已重新載入。",
      "6. 回報更新版本、安裝內容、驗證結果與本機備份路徑。",
      "",
      "如果無法辨識正確根目錄、乾跑失敗或檔案驗證不通過，請停止正式套用並回報明確卡點。"
    ].join("\n");
  }

  async function copyApplyCommand(item) {
    const command = buildTgbotInstruction(item);
    try {
      await navigator.clipboard.writeText(command);
      setAccessStatus("TGBOT 升級指令已複製；請回到 Telegram，直接貼給要升級的 TGBOT。", false);
    } catch (error) {
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
        setAccessStatus("請先輸入更新密碼，才能下載或複製 TGBOT 升級指令。", true);
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
