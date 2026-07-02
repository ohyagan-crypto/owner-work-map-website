const publicUrl = "https://ohyagan-crypto.github.io/owner-work-map-website/";
const liveStatusEndpoint = (window.OWNER_LIVE_STATUS_ENDPOINT || "").replace(/\/$/, "");

const stats = [
  { label: "已安裝技能", value: "80", note: "含主力、備份、停用與舊別名" },
  { label: "不重複技能", value: "44", note: "以技能名稱分流整理" },
  { label: "記憶檔", value: "84", note: "含規則、成功流程與偏好" },
  { label: "SOP 分類", value: "7", note: "任務入口可直接查" }
];

const completedItems = [
  {
    title: "總控台公開部署",
    status: "完成",
    summary: "工作地圖已整理成可公開查看的靜態網站，手機可直接看狀態、技能、SOP 與交付路徑。",
    points: ["GitHub Pages 公開入口已保留", "頁首新增即時狀態儀表盤", "本機仍保留完整備份"],
    actions: [{ label: "開啟公開頁", url: publicUrl }]
  },
  {
    title: "無私密 Codex / OpenClaw 複製包",
    status: "完成",
    summary: "完整複製包已完成，內容包含技能、記憶、回覆規則與安裝教學，排除所有帳密與敏感登入資料。",
    points: ["檔名含日期時間", "已排除 API key、token、cookie、credential store", "接收端需自行設定帳密與登入狀態"],
    actions: [{ label: "本機備份", url: "#safety" }]
  },
  {
    title: "技能主力版與歷史版分流",
    status: "完成",
    summary: "技能表已改成主力優先，備份、舊別名、停用版不再和主力版混在一起。",
    points: ["主力技能優先顯示", "備份版保留但不作為首選", "停用項目標明原因"],
    actions: [{ label: "查看技能表", url: "#skills" }]
  },
  {
    title: "任務型 SOP 圖書館",
    status: "完成",
    summary: "IMS、NBS、WBS、ACS、Dreamina、Telegram 回傳與 GitHub 部署都整理成可快速掃描的 SOP 卡片。",
    points: ["先看任務入口", "再看卡點與交付規則", "避免每次重新教學"],
    actions: [{ label: "查看 SOP", url: "#sop-library" }]
  },
  {
    title: "即時狀態儀表盤",
    status: "完成",
    summary: "最上方可直接看到運作中、正常待命、疑似斷線或卡點，並顯示今天 token 消耗。",
    points: ["手機版改成橫向濃縮資訊", "重新整理狀態有載入與結果提示", "頁面每 30 秒自動刷新資料"],
    actions: [{ label: "回到最上方", url: "#status-dashboard" }]
  }
];

const sopItems = [
  {
    title: "IMS / Lanxin 做圖",
    summary: "適合海報、教學圖、商品圖與多素材改圖。",
    steps: ["先逐張分析素材", "列確認清單", "送 Lanxin 生成", "下載原圖並回傳 Telegram"]
  },
  {
    title: "NBS / NotebookLM",
    summary: "適合把影片、網站、文件整理成簡報、音訊摘要或來源包。",
    steps: ["整理來源", "建立 NotebookLM 指令", "產出簡報或摘要", "回傳檔案與重點"]
  },
  {
    title: "WBS / 網站與部署",
    summary: "適合建立、更新、公開部署靜態網站或 GitHub Pages。",
    steps: ["先改本機檔案", "本機驗證", "提交部署", "回報公開 URL"]
  },
  {
    title: "ACS / 剪映對標剪輯",
    summary: "適合拆解參考短片、做分鏡、節奏與剪映操作。",
    steps: ["分析參考影片", "整理分鏡節奏", "建立剪輯規格", "輸出對標剪輯指令"]
  },
  {
    title: "Dreamina / SD 影片",
    summary: "適合 10 到 15 秒 AI 影片、查積分、送出、追蹤與下載。",
    steps: ["保留主人原始提示", "補齊鏡頭規格", "送出生成", "驗證影片並回傳"]
  },
  {
    title: "Telegram 交付",
    summary: "所有 Telegram 來源任務，有檔案就要回到同一個來源對話。",
    steps: ["確認來源 chat", "用文件模式保留品質", "避免傳錯對話", "失敗才回報本機備份"]
  },
  {
    title: "GitHub Pages 部署",
    summary: "適合網站公開上線、更新既有站與回報公開網址。",
    steps: ["讀部署規則", "只提交相關檔案", "推送 main", "驗證 Pages URL"]
  }
];

const skillSummary = [
  { label: "主力技能", value: "44", note: "日常任務優先使用" },
  { label: "備份版本", value: "多個", note: "只保留歷史與回退用途" },
  { label: "停用入口", value: "imagegen", note: "圖片任務改走 Lanxin" },
  { label: "核心入口", value: "WBS / IMS / NBS", note: "網站、圖片、NotebookLM" }
];

const skillRows = [
  ["網站", "wbs、github-pages-deploy、monthly-course-site-updater", "建立、更新、驗證、部署網站。", "主力版優先；部署前先讀 GitHub 規則。"],
  ["圖片", "ims、codex-zuotu-lanxin、lanxin-image-workflow、teaching-step-images", "海報、教學圖、商品圖、多素材分析與 Lanxin 生成。", "imagegen 舊入口停用，圖片任務走 Lanxin。"],
  ["NotebookLM", "nbs、notebooklm-source-builder、notebooklm-presentation-prompt", "來源包、簡報、音訊摘要、影片摘要。", "nbs 是統一入口，nbps / nbvs 是舊別名。"],
  ["影片", "acs、acs2、Dreamina、video-spec-builder、video-frame-analysis", "剪映對標、AI 影片、分鏡、逐幀分析。", "參考影片先分析，再產出規格或操作。"],
  ["Telegram", "telegram-bot-manager、transcribe、speech、screenshot", "回傳檔案、語音轉文字、文字轉語音、截圖交付。", "Telegram 來源檔案必須回同一個來源對話。"],
  ["交接", "codex-skill-handoff、mininew-bridge-handoff、new-customer-bot-base", "複製包、技能交接、bot handoff。", "只有主人明確要求才打包，包名必須含日期。"],
  ["自動化", "playwright、playwright-interactive、openclaw-browser-automation", "瀏覽器、桌面、登入授權與 UI 驗證。", "遇到 CAPTCHA、2FA、付款或安全鎖才回報卡點。"]
];

const timeline = [
  ["2026-07-02 20:18", "美化即時儀表盤，手機版改成橫向濃縮顯示，並修正重新整理狀態按鈕的可見回饋。"],
  ["2026-07-02 19:58", "新增最上方即時狀態儀表盤，顯示運作中、卡點、斷線與今日 token。"],
  ["2026-07-02 19:58", "把截圖中的 Roadmap 項目收斂到已完成區：公開部署、複製包、技能分流、SOP 圖書館。"],
  ["2026-07-02 19:12", "完成無私密完整複製包，檔案已存入本機安全備份資料夾。"],
  ["2026-07-02 17:43", "既有進度同步區與公開工作地圖已建立。"]
];

const fallbackRuntimeStatus = {
  statusKey: "watch",
  statusLabel: "資料待同步",
  headline: "目前尚未讀到 runtime-status.json。",
  blocker: "需要重新同步本機狀態。",
  nextAction: "請執行 tools/update-runtime-status.ps1 重新產生狀態資料。",
  updatedAt: new Date().toISOString(),
  refreshSeconds: 30,
  token: {
    totalTokens: null,
    taskCount: null,
    source: "尚未讀到本機 token 統計"
  },
  deliverables: []
};

const $ = (selector) => document.querySelector(selector);
let lastSnapshotUpdatedAt = "";

function setRefreshFeedback(message, state = "idle") {
  const feedback = $("#refreshFeedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = state;
}

function setRefreshButtonLoading(isLoading) {
  const button = $("#refreshStatus");
  if (!button) return;
  button.disabled = isLoading;
  button.classList.toggle("is-refreshing", isLoading);
  const label = button.querySelector(".refresh-label");
  if (label) label.textContent = isLoading ? "重新讀取中" : "重新整理狀態";
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "未取得";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString("en-US");
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未取得";
  return new Intl.DateTimeFormat("zh-Hant-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function renderStats() {
  $("#statGrid").innerHTML = stats.map((item) => `
    <article class="stat-card">
      <b>${item.value}</b>
      <span>${item.label}</span>
      <small>${item.note}</small>
    </article>
  `).join("");
}

function renderCompleted() {
  $("#completedGrid").innerHTML = completedItems.map((item) => `
    <article class="card">
      <div class="card-top">
        <h3>${item.title}</h3>
        <span class="status done">${item.status}</span>
      </div>
      <p>${item.summary}</p>
      <ul>${item.points.map((point) => `<li>${point}</li>`).join("")}</ul>
      <div class="card-actions">
        ${item.actions.map((action) => `<a class="card-action" href="${action.url}" ${action.url.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${action.label}</a>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderSop() {
  $("#sopGrid").innerHTML = sopItems.map((item) => `
    <article class="sop-card">
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <ol>${item.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
    </article>
  `).join("");
}

function renderSkills() {
  $("#skillSummary").innerHTML = skillSummary.map((item) => `
    <div class="summary-chip">
      <b>${item.value}</b>
      <span>${item.label}</span>
      <small>${item.note}</small>
    </div>
  `).join("");

  $("#skillTable").innerHTML = skillRows.map((row) => `
    <tr>
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3]}</td>
    </tr>
  `).join("");
}

function renderTimeline() {
  $("#timelineList").innerHTML = timeline.map(([time, text]) => `
    <article class="timeline-item">
      <time>${time}</time>
      <p>${text}</p>
    </article>
  `).join("");
}

function renderRuntimeStatus(data) {
  const status = { ...fallbackRuntimeStatus, ...data };
  const token = { ...fallbackRuntimeStatus.token, ...(status.token || {}) };
  const statePill = $("#statePill");
  const deliverables = status.deliverables || [];

  statePill.dataset.state = status.statusKey || "watch";
  statePill.textContent = status.statusLabel || "資料待同步";
  $("#statusLabel").textContent = status.statusLabel || "資料待同步";
  $("#statusHeadline").textContent = status.headline || "目前沒有可顯示的狀態。";
  $("#todayTokens").textContent = formatNumber(token.totalTokens);
  $("#tokenSource").textContent = token.taskCount
    ? `${token.source}，任務數 ${formatNumber(token.taskCount)}。`
    : token.source || "未取得 token 統計來源。";
  $("#blockerText").textContent = status.blocker || "沒有卡點";
  $("#nextAction").textContent = status.nextAction || "維持同步。";
  $("#updatedAt").textContent = formatDateTime(status.updatedAt);
  $("#refreshNote").textContent = `每 ${status.refreshSeconds || 30} 秒重新讀取一次狀態資料。`;
  $("#deliverableList").innerHTML = deliverables.length
    ? deliverables.map((item) => `<span>${item}</span>`).join("")
    : "<span>目前沒有新的交付物</span>";
}

async function loadRuntimeStatus(options = {}) {
  const isManual = Boolean(options.manual);
  const previousUpdatedAt = lastSnapshotUpdatedAt;
  if (isManual) {
    setRefreshButtonLoading(true);
    setRefreshFeedback("正在重新讀取公開狀態快照...", "idle");
  }

  try {
    const response = await fetch(`runtime-status.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("missing");
    const data = await response.json();
    renderRuntimeStatus(data);
    const updatedAt = data.updatedAt || "";

    if (isManual) {
      const formatted = formatDateTime(updatedAt);
      const state = previousUpdatedAt && previousUpdatedAt === updatedAt ? "stale" : "success";
      const message = state === "stale"
        ? `已重新讀取，公開快照仍是 ${formatted}。`
        : `已更新到 ${formatted}。`;
      setRefreshFeedback(message, state);
    } else if (!previousUpdatedAt) {
      setRefreshFeedback(`目前快照：${formatDateTime(updatedAt)}。`, "idle");
    }

    lastSnapshotUpdatedAt = updatedAt;
  } catch {
    renderRuntimeStatus(fallbackRuntimeStatus);
    if (isManual) {
      setRefreshFeedback("讀取失敗，已顯示備用狀態。", "error");
    }
  } finally {
    if (isManual) setRefreshButtonLoading(false);
  }
}

async function fetchStatusJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("status fetch failed");
  return response.json();
}

async function fetchLiveRuntimeStatus() {
  if (!liveStatusEndpoint) return null;
  const data = await fetchStatusJson(`${liveStatusEndpoint}/api/status?ts=${Date.now()}`);
  return {
    ...data,
    sourceType: data.sourceType || "live-api",
    sourceLabel: data.sourceLabel || "本機即時狀態 API"
  };
}

async function fetchSnapshotRuntimeStatus() {
  const data = await fetchStatusJson(`runtime-status.json?ts=${Date.now()}`);
  return {
    ...data,
    sourceType: "snapshot",
    sourceLabel: "GitHub Pages 公開快照"
  };
}

function runtimeSignature(status) {
  return [
    status.sourceType || "",
    status.updatedAt || "",
    status.checkedAt || "",
    status.statusKey || "",
    status.statusLabel || ""
  ].join("|");
}

function renderRuntimeStatus(data) {
  const status = { ...fallbackRuntimeStatus, ...data };
  const token = { ...fallbackRuntimeStatus.token, ...(status.token || {}) };
  const statePill = $("#statePill");
  const deliverables = status.deliverables || [];
  const sourceLabel = status.sourceLabel || (status.sourceType === "live-api" ? "本機即時狀態 API" : "GitHub Pages 公開快照");
  const displayTime = status.checkedAt || status.updatedAt;

  statePill.dataset.state = status.statusKey || "watch";
  statePill.textContent = status.statusLabel || "資料待同步";
  $("#statusLabel").textContent = status.statusLabel || "資料待同步";
  $("#statusHeadline").textContent = status.headline || "目前沒有可顯示的狀態。";
  $("#todayTokens").textContent = formatNumber(token.totalTokens);
  $("#tokenSource").textContent = token.taskCount
    ? `${token.source}，任務數 ${formatNumber(token.taskCount)}。`
    : token.source || "未取得 token 統計來源。";
  $("#blockerText").textContent = status.blocker || "沒有卡點";
  $("#nextAction").textContent = status.nextAction || "維持同步。";
  $("#updatedAt").textContent = formatDateTime(displayTime);
  $("#refreshNote").textContent = `每 ${status.refreshSeconds || 5} 秒重新讀取，來源：${sourceLabel}。`;
  $("#deliverableList").innerHTML = deliverables.length
    ? deliverables.map((item) => `<span>${item}</span>`).join("")
    : "<span>目前沒有新的交付物</span>";
}

async function loadRuntimeStatus(options = {}) {
  const isManual = Boolean(options.manual);
  const previousSignature = lastSnapshotUpdatedAt;
  if (isManual) {
    setRefreshButtonLoading(true);
    setRefreshFeedback("正在讀取本機即時狀態...", "idle");
  }

  try {
    let data = null;
    let liveError = null;
    try {
      data = await fetchLiveRuntimeStatus();
    } catch (error) {
      liveError = error;
    }

    if (!data) {
      data = await fetchSnapshotRuntimeStatus();
      if (liveError) data.liveUnavailable = true;
    }

    renderRuntimeStatus(data);
    const signature = runtimeSignature(data);
    const formatted = formatDateTime(data.checkedAt || data.updatedAt);

    if (isManual) {
      if (data.sourceType === "live-api") {
        setRefreshFeedback(`已即時同步到 ${formatted}。`, "success");
      } else {
        const state = previousSignature && previousSignature === signature ? "stale" : "success";
        setRefreshFeedback(`即時 API 目前未連上，已改讀公開快照：${formatted}。`, state);
      }
    } else if (!previousSignature) {
      const label = data.sourceType === "live-api" ? "即時同步" : "公開快照";
      setRefreshFeedback(`目前${label}：${formatted}。`, "idle");
    }

    lastSnapshotUpdatedAt = signature;
  } catch {
    renderRuntimeStatus(fallbackRuntimeStatus);
    if (isManual) {
      setRefreshFeedback("讀取失敗，已顯示備用狀態。", "error");
    }
  } finally {
    if (isManual) setRefreshButtonLoading(false);
  }
}

function init() {
  renderStats();
  renderCompleted();
  renderSop();
  renderSkills();
  renderTimeline();
  loadRuntimeStatus();
  $("#refreshStatus").addEventListener("click", () => loadRuntimeStatus({ manual: true }));
  window.setInterval(loadRuntimeStatus, 5000);
}

init();
