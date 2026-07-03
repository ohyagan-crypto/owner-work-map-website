const publicUrl = "https://ohyagan-crypto.github.io/owner-work-map-website/";
const liveStatusEndpoint = (window.OWNER_LIVE_STATUS_ENDPOINT || "").replace(/\/$/, "");
const DEFAULT_REFRESH_SECONDS = 1;
const LIVE_TIMEOUT_MS = 2200;
const LIVE_RETRY_COOLDOWN_MS = 5000;

const stats = [
  { label: "已安裝技能", value: "80", note: "含主要技能、備份與舊版入口" },
  { label: "主力技能", value: "44", note: "日常任務優先使用" },
  { label: "記憶檔", value: "84", note: "包含規則、偏好與成功流程" },
  { label: "狀態刷新", value: "1s", note: "自動秒級讀取，手動刷新立即同步" }
];

const completedItems = [
  {
    title: "科技感即時總控台",
    status: "已完成",
    summary: "上方儀表板可看到蝦咩、嵐熙、任務狀態、卡點、今日 token 與最後同步秒數。",
    points: ["自動每 1 秒讀取狀態", "手動刷新觸發粒子與脈衝回饋", "本機即時 API 優先於公開快照"],
    actions: [{ label: "公開頁", url: publicUrl }]
  },
  {
    title: "Telegram 回覆狀態機",
    status: "已修復",
    summary: "答案產出後會先停止正在輸入，標記為待送出，再確認 Telegram 送出成功。",
    points: ["running", "ready_to_send", "sending", "completed"]
  },
  {
    title: "安全交付規則",
    status: "已套用",
    summary: "Telegram 來源任務的檔案只回到同一個來源對話；內部包不主動外送。",
    points: ["不外露 token、cookie、log", "檔案交付用文件模式", "本機備份放到指定資料夾"]
  }
];

const sopItems = [
  {
    title: "任務開始",
    summary: "先判斷任務類型，必要時送出簡短承接，但不能停在承接訊息。",
    steps: ["讀取上下文", "檢查必要本機檔案", "執行任務", "回覆結果或卡點"]
  },
  {
    title: "答案送出",
    summary: "答案產生後要立即進入送出流程，不能長時間停在正在輸入。",
    steps: ["標記答案已產出", "停止 typing", "送出 Telegram 回覆", "標記已完成"]
  },
  {
    title: "狀態查詢",
    summary: "使用者按刷新或問狀態時，要用當下資料，不用舊快照假裝即時。",
    steps: ["讀心跳", "讀最近任務狀態", "判斷卡點", "回傳秒級時間"]
  }
];

const skillRows = [
  ["網站", "wbs / github-pages-deploy", "建立、更新與部署網站", "先改本機檔案，驗證後部署"],
  ["Telegram", "telegram-bot-manager", "檔案回傳、狀態回報、任務交付", "來源對話優先，不用預設 chat"],
  ["圖片", "ims / lanxin-image-workflow", "海報、教學圖、素材改圖", "先分析素材，再確認生成"],
  ["影片", "acs / dreamina / video-frame-analysis", "剪映、AI 影片、分鏡規格", "先拆解參考，再產出規格"],
  ["知識整理", "nbs / notebooklm-source-builder", "來源包、簡報、摘要", "整理資料後再交付"]
];

const timeline = [
  ["2026-07-03", "儀表盤升級為科技感雷達面板，加入蝦咩與嵐熙命名狀態卡。"],
  ["2026-07-03", "刷新頻率改成每 1 秒，手動刷新加入粒子、脈衝與即時回饋。"],
  ["2026-07-02", "修復 Telegram 答案產出後的 ready_to_send / sending / completed 狀態。"],
  ["2026-07-02", "即時狀態 API 改成每次請求都重新產生秒級資料。"]
];

const fallbackRuntimeStatus = {
  statusKey: "watch",
  statusLabel: "資料待同步",
  headline: "目前尚未讀到即時狀態。",
  blocker: "需要重新同步本機狀態",
  nextAction: "請啟動本機即時狀態服務，或稍後再刷新。",
  updatedAt: new Date().toISOString(),
  checkedAt: new Date().toISOString(),
  sourceType: "fallback",
  sourceLabel: "備用狀態",
  refreshSeconds: DEFAULT_REFRESH_SECONDS,
  token: { totalTokens: null, taskCount: null, source: "尚未讀到 token 統計" },
  heartbeat: { ageSeconds: null, activeRequests: null },
  openclaw: { statusKey: "watch", statusLabel: "狀態待同步", processCount: null, watchdogState: "未取得" },
  deliverables: []
};

const $ = (selector) => document.querySelector(selector);
let lastStatusSignature = "";
let lastRenderedStatus = fallbackRuntimeStatus;
let isStatusLoading = false;
let liveUnavailableUntil = 0;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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
  if (label) label.textContent = isLoading ? "同步中" : "重新整理狀態";
}

function triggerRefreshEffect() {
  const dashboard = $("#status-dashboard");
  const button = $("#refreshStatus");
  const layer = $("#refreshEffectLayer");
  if (dashboard) {
    dashboard.classList.remove("is-sync-flash");
    void dashboard.offsetWidth;
    dashboard.classList.add("is-sync-flash");
  }
  if (button) {
    button.classList.remove("is-bursting");
    void button.offsetWidth;
    button.classList.add("is-bursting");
  }
  if (!layer) return;

  const colors = ["#2ee9ff", "#21d18b", "#b9ff4f", "#ffbc42", "#d56bff", "#ff647c"];
  for (let index = 0; index < 28; index += 1) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 28 + Math.random() * 0.34;
    const distance = 42 + Math.random() * 72;
    spark.className = "spark";
    spark.style.setProperty("--spark-x", `${42 + Math.random() * 18}%`);
    spark.style.setProperty("--spark-y", `${24 + Math.random() * 24}%`);
    spark.style.setProperty("--spark-dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--spark-dy", `${Math.sin(angle) * distance}px`);
    spark.style.setProperty("--spark-size", `${4 + Math.random() * 5}px`);
    spark.style.setProperty("--spark-color", colors[index % colors.length]);
    layer.appendChild(spark);
    window.setTimeout(() => spark.remove(), 850);
  }
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "未取得";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString("en-US");
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
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

function secondsSince(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
}

function formatAge(value) {
  const seconds = secondsSince(value);
  if (seconds === null) return "未取得";
  if (seconds < 60) return `${seconds} 秒前`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return `${minutes} 分 ${rest} 秒前`;
  const hours = Math.floor(minutes / 60);
  return `${hours} 小時前`;
}

function refreshSecondsFrom(status) {
  const value = Number(status?.refreshSeconds);
  if (!Number.isFinite(value)) return DEFAULT_REFRESH_SECONDS;
  return Math.max(1, Math.min(10, Math.round(value)));
}

function updateLiveClock() {
  const clock = $("#localClock");
  if (clock) clock.textContent = formatDateTime(new Date());

  const displayTime = lastRenderedStatus.checkedAt || lastRenderedStatus.updatedAt;
  const liveAge = $("#liveAge");
  if (liveAge) liveAge.textContent = formatAge(displayTime);
}

function renderStats() {
  $("#statGrid").innerHTML = stats.map((item) => `
    <article class="stat-card">
      <b>${escapeHtml(item.value)}</b>
      <span>${escapeHtml(item.label)}</span>
      <small>${escapeHtml(item.note)}</small>
    </article>
  `).join("");
}

function renderCompleted() {
  $("#completedGrid").innerHTML = completedItems.map((item) => `
    <article class="card">
      <div class="card-top">
        <h3>${escapeHtml(item.title)}</h3>
        <span class="status done">${escapeHtml(item.status)}</span>
      </div>
      <p>${escapeHtml(item.summary)}</p>
      <ul>${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
      <div class="card-actions">
        ${(item.actions || []).map((action) => `<a class="card-action" href="${escapeHtml(action.url)}" target="_blank" rel="noopener">${escapeHtml(action.label)}</a>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderSop() {
  $("#sopGrid").innerHTML = sopItems.map((item) => `
    <article class="sop-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <ol>${item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    </article>
  `).join("");
}

function renderSkills() {
  $("#skillSummary").innerHTML = stats.map((item) => `
    <div class="summary-chip">
      <b>${escapeHtml(item.value)}</b>
      <span>${escapeHtml(item.label)}</span>
      <small>${escapeHtml(item.note)}</small>
    </div>
  `).join("");

  $("#skillTable").innerHTML = skillRows.map((row) => `
    <tr>
      <td>${escapeHtml(row[0])}</td>
      <td>${escapeHtml(row[1])}</td>
      <td>${escapeHtml(row[2])}</td>
      <td>${escapeHtml(row[3])}</td>
    </tr>
  `).join("");
}

function renderTimeline() {
  $("#timelineList").innerHTML = timeline.map(([time, text]) => `
    <article class="timeline-item">
      <time>${escapeHtml(time)}</time>
      <p>${escapeHtml(text)}</p>
    </article>
  `).join("");
}

function renderAgentStrip(status) {
  const heartbeat = { ...fallbackRuntimeStatus.heartbeat, ...(status.heartbeat || {}) };
  const openclaw = { ...fallbackRuntimeStatus.openclaw, ...(status.openclaw || {}) };
  const heartbeatAge = Number.isFinite(Number(heartbeat.ageSeconds))
    ? `${Math.max(0, Number(heartbeat.ageSeconds))} 秒前`
    : formatAge(status.checkedAt || status.updatedAt);
  const openclawProcessText = openclaw.processCount === null || openclaw.processCount === undefined
    ? "進程未取得"
    : `相關進程 ${formatNumber(openclaw.processCount)}`;

  const agents = [
    {
      role: "TGBOT",
      name: "蝦咩",
      state: status.statusLabel || "資料待同步",
      stateKey: status.statusKey || "watch",
      meta: `心跳 ${heartbeatAge} · 執行中任務 ${formatNumber(heartbeat.activeRequests)}`
    },
    {
      role: "OpenClaw",
      name: "嵐熙",
      state: openclaw.statusLabel || "狀態待同步",
      stateKey: openclaw.statusKey || "watch",
      meta: `${openclawProcessText} · 看門排程 ${openclaw.watchdogState || "未取得"}`
    }
  ];

  const strip = $("#agentStrip");
  if (!strip) return;
  strip.innerHTML = agents.map((agent) => `
    <article class="agent-card" data-state="${escapeHtml(agent.stateKey)}">
      <div class="agent-top">
        <div class="agent-name">
          <span>${escapeHtml(agent.role)}</span>
          <b>${escapeHtml(agent.name)}</b>
        </div>
        <span class="agent-state">${escapeHtml(agent.state)}</span>
      </div>
      <div class="agent-meta">${escapeHtml(agent.meta)}</div>
    </article>
  `).join("");
}

function renderRuntimeStatus(data) {
  const status = { ...fallbackRuntimeStatus, ...data };
  status.token = { ...fallbackRuntimeStatus.token, ...(status.token || {}) };
  status.heartbeat = { ...fallbackRuntimeStatus.heartbeat, ...(status.heartbeat || {}) };
  status.openclaw = { ...fallbackRuntimeStatus.openclaw, ...(status.openclaw || {}) };
  status.refreshSeconds = refreshSecondsFrom(status);
  const deliverables = Array.isArray(status.deliverables) ? status.deliverables : [];
  const sourceLabel = status.sourceLabel || (status.sourceType === "live-api" ? "本機即時 API" : "公開快照");
  const displayTime = status.checkedAt || status.updatedAt || new Date().toISOString();

  lastRenderedStatus = status;

  $("#statePill").dataset.state = status.statusKey || "watch";
  $("#statePill").textContent = status.statusLabel || "資料待同步";
  $("#statusLabel").textContent = status.statusLabel || "資料待同步";
  $("#statusHeadline").textContent = status.headline || "目前沒有可顯示的狀態。";
  $("#todayTokens").textContent = formatNumber(status.token.totalTokens);
  $("#tokenSource").textContent = status.token.taskCount
    ? `${status.token.source}，任務數 ${formatNumber(status.token.taskCount)}。`
    : status.token.source || "未取得 token 統計來源。";
  $("#blockerText").textContent = status.blocker || "沒有卡點";
  $("#nextAction").textContent = status.nextAction || "維持同步。";
  $("#updatedAt").textContent = formatDateTime(displayTime);
  $("#refreshNote").textContent = `每 ${status.refreshSeconds} 秒自動讀取；來源：${sourceLabel}。`;
  $("#deliverableList").innerHTML = deliverables.length
    ? deliverables.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
    : "<span>目前沒有新的交付檔案</span>";
  renderAgentStrip(status);
  updateLiveClock();
}

async function fetchStatusJson(url, timeoutMs = LIVE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error("狀態讀取失敗");
    return response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchLiveRuntimeStatus(options = {}) {
  if (!liveStatusEndpoint) return null;
  if (!options.manual && Date.now() < liveUnavailableUntil) return null;
  try {
    const data = await fetchStatusJson(`${liveStatusEndpoint}/api/status?ts=${Date.now()}`);
    liveUnavailableUntil = 0;
    return {
      ...data,
      sourceType: data.sourceType || "live-api",
      sourceLabel: data.sourceLabel || "本機即時 API"
    };
  } catch {
    liveUnavailableUntil = Date.now() + LIVE_RETRY_COOLDOWN_MS;
    return null;
  }
}

async function fetchSnapshotRuntimeStatus() {
  const data = await fetchStatusJson(`runtime-status.json?ts=${Date.now()}`, 1200);
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
    status.statusLabel || "",
    status.openclaw?.statusLabel || ""
  ].join("|");
}

async function loadRuntimeStatus(options = {}) {
  const isManual = Boolean(options.manual);
  if (isStatusLoading) {
    if (isManual) {
      triggerRefreshEffect();
      setRefreshFeedback("上一筆狀態正在同步，完成後會更新畫面。", "idle");
    }
    return;
  }

  isStatusLoading = true;
  if (isManual) {
    triggerRefreshEffect();
    setRefreshButtonLoading(true);
    setRefreshFeedback("正在同步本機即時狀態...", "idle");
  }

  try {
    let data = await fetchLiveRuntimeStatus({ manual: isManual });
    if (!data) {
      data = await fetchSnapshotRuntimeStatus();
      data.liveUnavailable = true;
    }

    renderRuntimeStatus(data);
    const signature = runtimeSignature(data);
    const formatted = formatDateTime(data.checkedAt || data.updatedAt);

    if (isManual) {
      if (data.sourceType === "live-api" || data.sourceType === "local-generator") {
        setRefreshFeedback(`已同步到當下狀態：${formatted}`, "success");
      } else {
        const state = lastStatusSignature && lastStatusSignature === signature ? "stale" : "success";
        setRefreshFeedback(`本機即時 API 未連上，已讀公開快照：${formatted}`, state);
      }
    } else if (!lastStatusSignature) {
      setRefreshFeedback(`目前狀態時間：${formatted}`, "idle");
    }

    lastStatusSignature = signature;
  } catch {
    renderRuntimeStatus(fallbackRuntimeStatus);
    if (isManual) {
      setRefreshFeedback("讀取失敗，已顯示備用狀態。", "error");
    }
  } finally {
    isStatusLoading = false;
    if (isManual) setRefreshButtonLoading(false);
  }
}

function init() {
  renderStats();
  renderCompleted();
  renderSop();
  renderSkills();
  renderTimeline();
  renderRuntimeStatus(fallbackRuntimeStatus);
  loadRuntimeStatus();
  $("#refreshStatus").addEventListener("click", () => loadRuntimeStatus({ manual: true }));
  window.setInterval(updateLiveClock, 1000);
  window.setInterval(() => loadRuntimeStatus(), DEFAULT_REFRESH_SECONDS * 1000);
}

init();
