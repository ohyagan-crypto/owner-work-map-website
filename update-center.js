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
    list.innerHTML = state.updates.map((item, index) => [
      '<article class="codex-update-item">',
      '<strong>' + escapeHtml(item.title || item.id) + '</strong>',
      '<p>' + escapeHtml(item.description || "Codex 更新包") + '</p>',
      '<div class="codex-update-meta">',
      '<span>版本 ' + escapeHtml(item.version || "未知") + '</span>',
      '<span>' + escapeHtml(item.createdAt || "日期未標示") + '</span>',
      '<span>' + escapeHtml(formatBytes(Number(item.size))) + '</span>',
      '</div>',
      '<div class="update-action-row">',
      '<button type="button" class="update-download-button" data-update-index="' + index + '" disabled>輸入密碼後下載</button>',
      '<button type="button" class="update-command-button" data-update-index="' + index + '" disabled>複製升級指令</button>',
      '</div>',
      '<small class="update-tgbot-hint">推薦：複製升級指令後直接貼給要升級的 TGBOT，它會自動下載、檢查、套用與驗證。</small>',
      '</article>'
    ].join("")).join("");
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
    document.querySelectorAll(".update-download-button").forEach((button) => {
      button.disabled = false;
      button.textContent = "下載更新包";
    });
    document.querySelectorAll(".update-command-button").forEach((button) => {
      button.disabled = false;
    });
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
      const envelope = JSON.parse(await file.text());
      if (envelope.format !== "bsmf-codex-update-v1" || !envelope.manifest) throw new Error("format");
      const contents = Array.isArray(envelope.manifest.contents) ? envelope.manifest.contents.length : 0;
      status.textContent = "已讀取：「" + (envelope.manifest.title || "Codex 更新包") + "」｜版本 " + (envelope.manifest.version || "未知") + "｜" + contents + " 個檔案｜加密格式正常";
      status.style.color = "var(--cyan)";
    } catch (error) {
      status.textContent = "檔案無法通過格式檢查，請確認是 .bsmf 更新包。";
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
