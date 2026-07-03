const fallbackRuntimeStatus = {
  statusKey: "watch",
  statusLabel: "快照待同步",
  headline: "目前顯示公開快照，尚未連上本機即時狀態。",
  blocker: "沒有公開卡點",
  nextAction: "可在本機重新產生快照後部署更新。",
  checkedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sourceType: "fallback",
  sourceLabel: "公開備用快照",
  refreshSeconds: 30,
  workload: {
    taskCount: null,
    source: "公開頁不顯示內部用量細節"
  },
  deliverables: ["公開儀表盤", "同源交付規則", "技能摘要"]
};

const capabilityRows = [
  ["Telegram 回覆", "任務判斷、自然繁中回覆、同源交付、檔案回傳", "顯示目前任務狀態、卡點與下一步"],
  ["網站製作", "本機建站、響應式檢查、GitHub Pages 部署", "顯示公開網址、更新日與部署摘要"],
  ["圖片與教學圖", "素材分析、批次規劃、原圖下載、Telegram 文件模式交付", "顯示可調度能力，不公開平台帳密"],
  ["影片與剪輯", "參考影片分析、分鏡規格、AI 影片流程、成品驗證", "顯示流程能力與交付狀態"],
  ["知識整理", "NotebookLM 來源包、摘要、簡報提示、記憶更新", "顯示技能分類與維護節奏"]
];

const maintenanceItems = [
  ["心跳檢查", "讀取 tgbot 心跳快照，判斷是否仍在正常處理任務。"],
  ["任務檢查", "整理最近 Telegram 任務狀態，區分運作中、待回覆、完成與卡點。"],
  ["公開快照", "將可公開資訊寫入 runtime-status.json，供 GitHub Pages 顯示。"],
  ["部署驗證", "更新網站後檢查本機頁面、提交 repo、推送分支並確認公開網址可開啟。"]
];

const $ = (selector) => document.querySelector(selector);
let lastStatusSignature = "";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未取得";
  return new Intl.DateTimeFormat("zh-Hant-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function publicWorkloadLabel(workload) {
  if (workload && Number.isFinite(Number(workload.taskCount)) && Number(workload.taskCount) > 0) {
    return `任務 ${Number(workload.taskCount).toLocaleString("zh-Hant-TW")} 件`;
  }
  return "公開摘要";
}

function setRefreshFeedback(message, state = "idle") {
  const target = $("#refreshFeedback");
  if (!target) return;
  target.textContent = message;
  target.dataset.state = state;
}

function setRefreshLoading(isLoading) {
  const button = $("#refreshStatus");
  if (!button) return;
  button.disabled = isLoading;
  button.classList.toggle("is-refreshing", isLoading);
}

function normalizeRuntimeStatus(data) {
  const publicWorkload = data && data.workload ? data.workload : {};
  return {
    ...fallbackRuntimeStatus,
    ...data,
    workload: {
      ...fallbackRuntimeStatus.workload,
      ...publicWorkload
    },
    deliverables: Array.isArray(data && data.deliverables) ? data.deliverables : fallbackRuntimeStatus.deliverables
  };
}

function renderRuntimeStatus(incomingStatus) {
  const status = normalizeRuntimeStatus(incomingStatus);
  const displayTime = status.checkedAt || status.updatedAt || new Date().toISOString();
  const stateCard = $("#stateCard");
  const sourceLabel = status.sourceLabel || "公開快照";
  const refreshSeconds = status.refreshSeconds || 30;

  if (stateCard) stateCard.dataset.state = status.statusKey || "watch";
  $("#statusLabel").textContent = status.statusLabel || "快照待同步";
  $("#statusHeadline").textContent = status.headline || "目前沒有可公開顯示的狀態。";
  $("#blockerText").textContent = status.blocker || "沒有卡點";
  $("#nextAction").textContent = status.nextAction || "保持更新。";
  $("#workloadLabel").textContent = publicWorkloadLabel(status.workload);
  $("#workloadSource").textContent = status.workload.source || "公開頁只顯示任務量摘要";
  $("#updatedAt").textContent = formatDateTime(displayTime);
  $("#refreshNote").textContent = `來源：${sourceLabel}，約每 ${refreshSeconds} 秒可重新整理。`;

  $("#deliverableList").innerHTML = status.deliverables.length
    ? status.deliverables.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
    : "<span>目前沒有新的公開交付項目</span>";
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("狀態讀取失敗");
  return response.json();
}

async function loadRuntimeStatus(options = {}) {
  const isManual = Boolean(options.manual);
  if (isManual) {
    setRefreshLoading(true);
    setRefreshFeedback("正在重新整理公開狀態...", "idle");
  }

  try {
    let data = null;
    try {
      data = await fetchJson(`api/status?ts=${Date.now()}`);
      data.sourceType = data.sourceType || "live-api";
      data.sourceLabel = data.sourceLabel || "本機即時狀態";
    } catch {
      data = await fetchJson(`runtime-status.json?ts=${Date.now()}`);
      data.sourceType = data.sourceType || "snapshot";
      data.sourceLabel = data.sourceLabel || "GitHub Pages 公開快照";
    }

    renderRuntimeStatus(data);
    const signature = [data.sourceType, data.statusKey, data.statusLabel, data.checkedAt || data.updatedAt].join("|");
    const formatted = formatDateTime(data.checkedAt || data.updatedAt);

    if (isManual) {
      const state = lastStatusSignature === signature ? "stale" : "success";
      setRefreshFeedback(`已更新到 ${formatted}`, state);
    } else {
      setRefreshFeedback(`目前快照時間：${formatted}`, "idle");
    }
    lastStatusSignature = signature;
  } catch {
    renderRuntimeStatus(fallbackRuntimeStatus);
    if (isManual) {
      setRefreshFeedback("暫時讀不到公開快照，已顯示備用摘要。", "error");
    }
  } finally {
    if (isManual) setRefreshLoading(false);
  }
}

function renderCapabilityRows() {
  $("#capabilityRows").innerHTML = capabilityRows.map((row) => `
    <tr>
      <td>${escapeHtml(row[0])}</td>
      <td>${escapeHtml(row[1])}</td>
      <td>${escapeHtml(row[2])}</td>
    </tr>
  `).join("");
}

function renderMaintenanceChecklist() {
  $("#maintenanceChecklist").innerHTML = maintenanceItems.map((item) => `
    <article class="check-item">
      <span class="check-icon" aria-hidden="true">✓</span>
      <div>
        <strong>${escapeHtml(item[0])}</strong>
        <p>${escapeHtml(item[1])}</p>
      </div>
    </article>
  `).join("");
}

function init() {
  renderCapabilityRows();
  renderMaintenanceChecklist();
  renderRuntimeStatus(fallbackRuntimeStatus);
  loadRuntimeStatus();
  $("#refreshStatus").addEventListener("click", () => loadRuntimeStatus({ manual: true }));
  window.setInterval(loadRuntimeStatus, 30000);
}

init();
