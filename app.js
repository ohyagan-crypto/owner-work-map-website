const siteStats = [
  { label: "已安裝條目", value: "169", note: "包含正式版、歷史版與備份入口" },
  { label: "主技能名稱", value: "61", note: "新手最需要認識的是這 61 個主技能" },
  { label: "記憶檔", value: "345", note: "偏好、成功流程、安全規則與工作流補強" }
];

const quickStartItems = [
  {
    title: "先講任務",
    summary: "不要只說「幫我做一下」。先直接講要做網站、做圖、影片、摘要、部署，藍星智能體才知道要走哪條路。"
  },
  {
    title: "再講成品",
    summary: "你要的是公開網址、PNG、MP4、PPTX、MP3、ZIP，還是單純回答？成品先講，後面就不容易偏。"
  },
  {
    title: "補規格與完成標準",
    summary: "例如 9:16、繁體中文、AI 科技風、公開部署、同一個 Telegram 對話回傳。這些都要先講清楚。"
  }
];

const formulaItems = [
  {
    step: "01",
    title: "任務",
    summary: "先說你要做什麼，例如：做網站、做圖、剪影片、整理 PPT、公開部署。"
  },
  {
    step: "02",
    title: "成品",
    summary: "再說你要交什麼，例如：網址、PNG、MP4、MP3、ZIP、教學圖、簡報。"
  },
  {
    step: "03",
    title: "規格",
    summary: "把尺寸、語言、風格、時長、模型、平台、數量一次講清楚。"
  },
  {
    step: "04",
    title: "限制",
    summary: "有沒有不能用舊素材、不能公開、不能放真實 token、不能混歷史任務，都要先寫。"
  },
  {
    step: "05",
    title: "完成標準",
    summary: "例如：公開網址要能開、圖片要驗字、檔案要真的回到 Telegram，同輪交付才算完成。"
  }
];

const flowItems = [
  {
    index: "1",
    title: "確認現在到底是哪一個網站任務",
    summary: "WBS 先判斷你是要新網站、改舊站、只部署，還是追問公開網址。"
  },
  {
    index: "2",
    title: "改真的本機檔案",
    summary: "不是嘴巴說會做，而是真的去改 HTML、CSS、JS、素材和必要結構。"
  },
  {
    index: "3",
    title: "本機驗證",
    summary: "至少要確認檔案存在、頁面能打開、主要內容可讀、手機版不會爆版。"
  },
  {
    index: "4",
    title: "Git 提交與推送",
    summary: "只提交這次網站需要的檔案，不把別的髒變更一起塞進去。"
  },
  {
    index: "5",
    title: "公開部署",
    summary: "推上 GitHub Pages 後，還要檢查公開網址真的已經更新，不是只看本機。"
  },
  {
    index: "6",
    title: "最後回你可交付結果",
    summary: "真正完成時要回公開網址、本機路徑，必要時再補來源 repo。"
  }
];

const completionChecklist = [
  "本機網站檔案已存在，且不是空殼或佔位頁。",
  "主要區塊、按鈕、內容文字在手機和桌機都能閱讀。",
  "需要的互動有基本可用狀態，例如搜尋、複製、導覽或表單提示。",
  "Git 只提交這次網站任務相關檔案，沒有順手把別的東西一起推上去。",
  "公開網址已實際驗證可開，內容也確實是最新版。"
];

const commonMistakes = [
  "只說「做一個網站」卻沒說主題、內容、風格與成品。",
  "沒講要不要公開部署，結果只做到本機。",
  "把上一個任務素材默認沿用，導致網站內容混錯。",
  "沒有說明手機版也要能看，最後桌機漂亮但手機炸掉。",
  "把「已開始做」當成完成，沒有真的檢查公開網址。"
];

const templates = [
  {
    title: "網站模板",
    description: "最適合要做公開網站的人。",
    prompt: "wbs 做一個公開網站。\n主題：___\n成品：公開網址。\n規格：繁體中文、手機版可讀、桌機版完整。\n限制：不要混舊站內容。\n完成標準：本機驗證後公開部署，網址真的打得開。"
  },
  {
    title: "做圖模板",
    description: "適合 image2、做圖、教學圖或海報任務。",
    prompt: "做圖。\n成品：___ 張 PNG。\n規格：9:16、繁體中文、AI 科技風。\n素材：本輪沒有素材 / 本次素材如下：___。\n限制：不用歷史圖片。\n完成標準：先給確認清單，我回確認後再生成。"
  },
  {
    title: "影片模板",
    description: "適合 cmsd、sd、hfsw、剪輯任務。",
    prompt: "cmsd / hfsw / acs。\n成品：MP4。\n規格：時長 ___、比例 ___、語言 ___。\n素材：本次素材 ___。\n限制：不要混上一輪角色或舊素材。\n完成標準：檔案輸出、驗證完成，再回到同一個 Telegram 對話。"
  }
];

const skills = [
  { name: "wbs", category: "網站部署", summary: "網站建置、驗證、GitHub Pages 公開部署。", useCase: "做網站、改網站、公開部署。" },
  { name: "github-pages-deploy", category: "網站部署", summary: "專門處理 GitHub Pages 的推送與公開驗證。", useCase: "網站已做好，只差公開部署。" },
  { name: "monthly-course-site-updater", category: "網站部署", summary: "每月課程報名與活動網站更新。", useCase: "只改日期、場次、報名資訊。" },
  { name: "codex-zuotu-lanxin", category: "圖片生成", summary: "藍星 / 聚合平台繁中海報與做圖主入口。", useCase: "做海報、教學圖、商品圖。" },
  { name: "ims", category: "圖片生成", summary: "聚合平台圖片生成與分鏡製作。", useCase: "要做圖片組、分鏡、行銷視覺。" },
  { name: "lanxin-image-workflow", category: "圖片生成", summary: "藍星平台完整做圖工作流。", useCase: "要檢查登入、提交、下載、驗圖。" },
  { name: "做圖", category: "圖片生成", summary: "中文做圖入口，適合直接口語下單。", useCase: "只想說『做圖』也能路由到正確流程。" },
  { name: "teaching-step-images", category: "圖片生成", summary: "教學步驟圖、SOP 圖與手機操作圖。", useCase: "做 4 張、8 張、逐步說明圖。" },
  { name: "imagegen", category: "圖片生成", summary: "通用圖片生成入口。", useCase: "一般圖片生成或編修。" },
  { name: "imagegen-disabled-use-lanxin", category: "圖片生成", summary: "舊版圖片入口，提醒正式任務改走藍星流程。", useCase: "遇到舊任務或相容需求。" },
  { name: "imagegen-poster-telegram", category: "圖片生成", summary: "海報任務與 Telegram 交付舊入口。", useCase: "維護舊有海報交付流程。" },
  { name: "character-memory-manager", category: "圖片生成", summary: "固定角色外觀、服裝、負面限制。", useCase: "嵐熙、庫裡、蝦咩等角色要保持一致。" },
  { name: "acs", category: "影片工作流", summary: "剪映 / CapCut 自動剪輯。", useCase: "對標剪輯、字幕、轉場、素材組裝。" },
  { name: "acs2", category: "影片工作流", summary: "複製參考短片的節奏與版型。", useCase: "拿一支參考影片照著做同款。" },
  { name: "ai-auto-short-video-workflow", category: "影片工作流", summary: "長影片自動切短影音。", useCase: "把長影片拆成หลาย支 9:16 短片。" },
  { name: "ans", category: "影片工作流", summary: "微信小程式 AI 影片工作流。", useCase: "跑微信端生成影片與下載。" },
  { name: "cls", category: "影片工作流", summary: "Claude 劇本與影片前置分析。", useCase: "先分析腳本、分鏡、提示詞。" },
  { name: "cmsd", category: "影片工作流", summary: "Claude 分析到 IMS 分鏡再到 SD 影片。", useCase: "做完整 AI 影片故事板與影片生成。" },
  { name: "dreamina-cli", category: "影片工作流", summary: "Dreamina / Seedance / SD 任務提交與下載。", useCase: "送影片生成、查狀態、抓成品。" },
  { name: "dreamina-sd-video-workflow", category: "影片工作流", summary: "SD / Dreamina 影片完整生成流程。", useCase: "需要正式跑一整條影片工作流。" },
  { name: "douyin-peipao", category: "影片工作流", summary: "抖音陪跑、選題、對標與腳本整理。", useCase: "短影音帳號經營與內容規劃。" },
  { name: "hfsw", category: "影片工作流", summary: "長影片完整製作工作流。", useCase: "旁白、字幕、BGM、畫面一條龍輸出。" },
  { name: "hyperframes", category: "影片工作流", summary: "動畫合成、標題卡、視覺節奏與動態場景。", useCase: "做動態字幕、片頭、場景動畫。" },
  { name: "nms-digital-human", category: "影片工作流", summary: "數字人、AI 網紅與口播人物製作。", useCase: "做虛擬人物口播或數位分身。" },
  { name: "video-frame-analysis", category: "影片工作流", summary: "逐幀或高密度分析影片內容。", useCase: "拆教學影片、判斷鏡頭與字幕節奏。" },
  { name: "video-spec-builder", category: "影片工作流", summary: "把故事整理成可執行影片規格。", useCase: "先做拍攝或生成規格再送影片。" },
  { name: "nbs", category: "摘要 / 文件", summary: "NotebookLM 統一正式工作流。", useCase: "做語音摘要、簡報、影片摘要。" },
  { name: "nbps", category: "摘要 / 文件", summary: "NotebookLM 音訊舊別名入口。", useCase: "維護舊命令或相容入口。" },
  { name: "nbvs", category: "摘要 / 文件", summary: "NotebookLM 影片舊別名入口。", useCase: "維護舊命令或相容入口。" },
  { name: "nbs-media-summary-pack", category: "摘要 / 文件", summary: "NBS 媒體摘要流程教學包。", useCase: "把 NBS 工作流交接給其他人。" },
  { name: "nbs-skill", category: "摘要 / 文件", summary: "NBS 舊版技能入口。", useCase: "舊包相容或學習用途。" },
  { name: "notebooklm-brief-to-deck-workflow", category: "摘要 / 文件", summary: "NotebookLM 簡報舊流程。", useCase: "需要維護舊簡報工作流。" },
  { name: "notebooklm-presentation-prompt", category: "摘要 / 文件", summary: "NotebookLM 簡報提示詞與版型規格。", useCase: "要讓簡報更像正式作品。" },
  { name: "notebooklm-source-builder", category: "摘要 / 文件", summary: "整理可丟進 NotebookLM 的來源包。", useCase: "資料很散，先做來源整理。" },
  { name: "notion-knowledge-capture", category: "摘要 / 文件", summary: "把對話、決策與知識寫進 Notion。", useCase: "知識整理與後續查找。" },
  { name: "pdf", category: "摘要 / 文件", summary: "PDF 讀取、OCR、整理與輸出。", useCase: "做 PDF 摘要、轉檔、修正。" },
  { name: "speech", category: "摘要 / 文件", summary: "文字轉語音與旁白輸出。", useCase: "做配音、旁白、語音檔。" },
  { name: "transcribe", category: "摘要 / 文件", summary: "音訊 / 影片轉逐字稿。", useCase: "做字幕、稿件、講者區分。" },
  { name: "telegram-bot-manager", category: "Telegram / Bot", summary: "Telegram Bot 管理與檔案回傳。", useCase: "回文件、排故障、管媒體傳送。" },
  { name: "telegram-two-stage-reply", category: "Telegram / Bot", summary: "Telegram 回覆與交付規則。", useCase: "維護回覆節奏與完成標準。" },
  { name: "tg123-daily-self-upgrade", category: "Telegram / Bot", summary: "TG1 / TG2 / TG3 每日自我升級。", useCase: "同步三端規則與學習內容。" },
  { name: "new-customer-bot-base", category: "Telegram / Bot", summary: "新客戶 Telegram Bot 基底。", useCase: "複製一套新 bot 環境。" },
  { name: "mininew-bridge-handoff", category: "Telegram / Bot", summary: "MiniNew Telegram Codex bridge 交接與複製。", useCase: "把 bridge、記憶與環境交給另一端。" },
  { name: "owner-reply-style-telegram", category: "Telegram / Bot", summary: "主人導向 Telegram 回覆風格。", useCase: "調整語氣、完整回答方式。" },
  { name: "shamie-owner-reply-style", category: "Telegram / Bot", summary: "蝦咩角色回覆風格。", useCase: "TG1 人設與交付語氣。" },
  { name: "lobster-working-style", category: "Telegram / Bot", summary: "主人的專屬工作方式與行為規則。", useCase: "讓回答更符合你的習慣。" },
  { name: "auto-reasoning-router", category: "系統 / 自動化", summary: "自動判斷任務該用多少推理。", useCase: "快答或深度處理的路由。" },
  { name: "bb-browser", category: "系統 / 自動化", summary: "帶登入態的瀏覽器操作與抓資料。", useCase: "操作網頁平台、讀登入後頁面。" },
  { name: "codex-skill-handoff", category: "系統 / 自動化", summary: "技能、記憶、工作流打包交接。", useCase: "把能力交給別的 Codex 或 OC。" },
  { name: "find-skill", category: "系統 / 自動化", summary: "找技能與安裝建議。", useCase: "不知道該用哪個技能時。" },
  { name: "openai-docs", category: "系統 / 自動化", summary: "查 OpenAI / Codex 官方文件。", useCase: "問最新官方規格、模型、文件。" },
  { name: "openclaw-browser-automation", category: "系統 / 自動化", summary: "OpenClaw 匯入的瀏覽器自動化能力。", useCase: "延續既有 OC 網頁自動化。" },
  { name: "openclaw-desktop-control", category: "系統 / 自動化", summary: "OpenClaw 匯入的桌面控制能力。", useCase: "操作本機桌面程式與視窗。" },
  { name: "operator-principles", category: "系統 / 自動化", summary: "速度、連續處理、卡點修復原則。", useCase: "全局執行邏輯與優先順序。" },
  { name: "playwright", category: "系統 / 自動化", summary: "真實瀏覽器自動化測試。", useCase: "測網站、跑互動驗證。" },
  { name: "playwright-interactive", category: "系統 / 自動化", summary: "保留狀態的互動式 Playwright。", useCase: "需要持續操作同一個瀏覽器會話。" },
  { name: "plugin-creator", category: "系統 / 自動化", summary: "建立 Codex 插件骨架。", useCase: "做新的 plugin 或 marketplace 項目。" },
  { name: "screenshot", category: "系統 / 自動化", summary: "桌面或頁面截圖與驗證。", useCase: "需要看畫面、做教學、交付截圖。" },
  { name: "skill-creator", category: "系統 / 自動化", summary: "建立或更新技能。", useCase: "做新的 SKILL.md、流程與工具說明。" },
  { name: "skill-installer", category: "系統 / 自動化", summary: "安裝技能到本機。", useCase: "從 curated 或外部來源裝技能。" },
  { name: "binance-coin-research", category: "研究 / 分析", summary: "幣安 coin、meme coin、合約風險研究。", useCase: "查幣、做評分、產研究圖卡。" }
];

const categoryOrder = [
  "全部",
  "網站部署",
  "圖片生成",
  "影片工作流",
  "摘要 / 文件",
  "Telegram / Bot",
  "系統 / 自動化",
  "研究 / 分析"
];

let activeCategory = "全部";
let searchTerm = "";

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHeroStats() {
  const container = $("#heroStats");
  container.innerHTML = siteStats
    .map(
      (item) => `
        <article class="metric-card">
          <small>${escapeHtml(item.label)}</small>
          <strong>${escapeHtml(item.value)}</strong>
          <p>${escapeHtml(item.note)}</p>
        </article>
      `
    )
    .join("");
}

function renderQuickStart() {
  const container = $("#quickStartGrid");
  container.innerHTML = quickStartItems
    .map(
      (item) => `
        <article class="spotlight-card">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.summary)}</p>
        </article>
      `
    )
    .join("");
}

function renderFormula() {
  const container = $("#formulaGrid");
  container.innerHTML = formulaItems
    .map(
      (item) => `
        <article class="formula-card">
          <em>${escapeHtml(item.step)}</em>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.summary)}</p>
        </article>
      `
    )
    .join("");
}

function renderFlow() {
  const container = $("#flowTimeline");
  container.innerHTML = flowItems
    .map(
      (item) => `
        <article class="timeline-item">
          <div class="step-index">
            <span class="tag">Step</span>
            <b>${escapeHtml(item.index)}</b>
          </div>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.summary)}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderList(selector, items) {
  const target = $(selector);
  target.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderTemplates() {
  const container = $("#templateGrid");
  container.innerHTML = templates
    .map(
      (item, index) => `
        <article class="template-card">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.description)}</p>
          <pre id="template-${index}">${escapeHtml(item.prompt)}</pre>
          <button type="button" data-copy-target="template-${index}">複製模板</button>
        </article>
      `
    )
    .join("");
}

function renderCategoryFilters() {
  const container = $("#categoryFilters");
  container.innerHTML = categoryOrder
    .map(
      (category) => `
        <button type="button" data-category="${escapeHtml(category)}" class="${category === activeCategory ? "active" : ""}">
          ${escapeHtml(category)}
        </button>
      `
    )
    .join("");
}

function filteredSkills() {
  const normalized = searchTerm.trim().toLowerCase();
  return skills.filter((skill) => {
    const matchesCategory = activeCategory === "全部" || skill.category === activeCategory;
    if (!matchesCategory) return false;
    if (!normalized) return true;
    const haystack = [skill.name, skill.category, skill.summary, skill.useCase].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}

function renderSkillOverview(visibleSkills) {
  const categoryCount = activeCategory === "全部" ? categoryOrder.length - 1 : 1;
  $("#skillOverview").innerHTML = `
    <span class="tag">目前視圖</span>
    <p>顯示 <strong>${visibleSkills.length}</strong> 個技能；分類範圍 <strong>${escapeHtml(activeCategory)}</strong>；共整理 <strong>${categoryCount}</strong> 類新手入口。</p>
  `;
}

function renderSkills() {
  const visibleSkills = filteredSkills();
  renderSkillOverview(visibleSkills);
  const grid = $("#skillGrid");
  const empty = $("#skillEmpty");

  grid.innerHTML = visibleSkills
    .map(
      (skill) => `
        <article class="skill-card">
          <span class="tag">${escapeHtml(skill.category)}</span>
          <h3>${escapeHtml(skill.name)}</h3>
          <p>${escapeHtml(skill.summary)}</p>
          <div class="meta-row">
            <span>適合：${escapeHtml(skill.useCase)}</span>
          </div>
        </article>
      `
    )
    .join("");

  empty.classList.toggle("is-visible", visibleSkills.length === 0);
}

function bindEvents() {
  $("#skillSearch").addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderSkills();
  });

  $("#categoryFilters").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    activeCategory = button.getAttribute("data-category");
    renderCategoryFilters();
    renderSkills();
  });

  $("#templateGrid").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-copy-target]");
    if (!button) return;
    const target = document.getElementById(button.getAttribute("data-copy-target"));
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.textContent);
      button.textContent = "已複製";
      window.setTimeout(() => {
        button.textContent = "複製模板";
      }, 1400);
    } catch (error) {
      button.textContent = "複製失敗";
      window.setTimeout(() => {
        button.textContent = "複製模板";
      }, 1400);
    }
  });
}

function init() {
  renderHeroStats();
  renderQuickStart();
  renderFormula();
  renderFlow();
  renderList("#completionChecklist", completionChecklist);
  renderList("#commonMistakes", commonMistakes);
  renderTemplates();
  renderCategoryFilters();
  renderSkills();
  bindEvents();
}

init();
