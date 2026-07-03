const publicUrl = "https://ohyagan-crypto.github.io/owner-work-map-website/";
const liveStatusEndpoint = (window.OWNER_LIVE_STATUS_ENDPOINT || "").replace(/\/$/, "");

const stats = [
  { label: "已安裝技能", value: "80", note: "含主要技能、備份與舊版入口" },
  { label: "主力技能", value: "44", note: "日常任務優先使用" },
  { label: "記憶檔", value: "84", note: "包含規則、偏好與成功流程" },
  { label: "狀態刷新", value: "秒級", note: "按下立即讀取本機即時狀態" }
];

const completedItems = [
  {
    title: "即時狀態總控台",
    status: "已完成",
    summary: "上方儀表板可看到運作中、卡點、答案已產出待回覆、已回覆完成與今日 token。",
    points: ["手動刷新會讀取當下秒級狀態", "自動每 5 秒重新讀取", "本機即時 API 優先於公開快照"],
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
  ["2026-07-02", "修復 Telegram 答案產出後的 ready_to_send / sending / completed 狀態。"],
  ["2026-07-02", "即時狀態 API 改成每次請求都重新產生秒級資料。"],
  ["2026-07-02", "公開頁刷新按鈕改為優先讀本機即時 API，失敗才退回公開快照。"]
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
  refreshSeconds: 5,
  token: { totalTokens: null, taskCount: null, source: "尚未讀到 token 統計" },
  deliverables: []
};

const $ = (selector) => document.querySelector(selector);
let lastStatusSignature = "";

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
  if (label) label.textContent = isLoading ? "讀取中" : "重新整理狀態";
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
        ${(item.actions || []).map((action) => `<a class="card-action" href="${action.url}" target="_blank" rel="noopener">${action.label}</a>`).join("")}
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
  $("#skillSummary").innerHTML = stats.map((item) => `
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
  const deliverables = status.deliverables || [];
  const sourceLabel = status.sourceLabel || (status.sourceType === "live-api" ? "本機即時 API" : "公開快照");
  const displayTime = status.checkedAt || status.updatedAt || new Date().toISOString();

  $("#statePill").dataset.state = status.statusKey || "watch";
  $("#statePill").textContent = status.statusLabel || "資料待同步";
  $("#statusLabel").textContent = status.statusLabel || "資料待同步";
  $("#statusHeadline").textContent = status.headline || "目前沒有可顯示的狀態。";
  $("#todayTokens").textContent = formatNumber(token.totalTokens);
  $("#tokenSource").textContent = token.taskCount
    ? `${token.source}，任務數 ${formatNumber(token.taskCount)}。`
    : token.source || "未取得 token 統計來源。";
  $("#blockerText").textContent = status.blocker || "沒有卡點";
  $("#nextAction").textContent = status.nextAction || "維持同步。";
  $("#updatedAt").textContent = formatDateTime(displayTime);
  $("#refreshNote").textContent = `每 ${status.refreshSeconds || 5} 秒自動讀取；來源：${sourceLabel}。`;
  $("#deliverableList").innerHTML = deliverables.length
    ? deliverables.map((item) => `<span>${item}</span>`).join("")
    : "<span>目前沒有新的交付檔案</span>";
}

async function fetchStatusJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("狀態讀取失敗");
  return response.json();
}

async function fetchLiveRuntimeStatus() {
  if (!liveStatusEndpoint) return null;
  const data = await fetchStatusJson(`${liveStatusEndpoint}/api/status?ts=${Date.now()}`);
  return {
    ...data,
    sourceType: data.sourceType || "live-api",
    sourceLabel: data.sourceLabel || "本機即時 API"
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

async function loadRuntimeStatus(options = {}) {
  const isManual = Boolean(options.manual);
  if (isManual) {
    setRefreshButtonLoading(true);
    setRefreshFeedback("正在讀取本機即時狀態...", "idle");
  }

  try {
    let data = null;
    try {
      data = await fetchLiveRuntimeStatus();
    } catch {
      data = null;
    }

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
        setRefreshFeedback(`本機即時 API 未連上，已改讀公開快照：${formatted}`, state);
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
