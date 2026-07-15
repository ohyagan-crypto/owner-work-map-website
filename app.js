const publicUrl = "https://ohyagan-crypto.github.io/owner-work-map-website/";
let configuredLiveStatusEndpoint = (window.OWNER_LIVE_STATUS_ENDPOINT || "").replace(/\/$/, "");
const sameOriginLiveStatusEndpoint = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? window.location.origin
  : "";
let liveStatusEndpoint = sameOriginLiveStatusEndpoint || configuredLiveStatusEndpoint;
const DEFAULT_REFRESH_SECONDS = 1;
const LIVE_TIMEOUT_MS = 2200;
const LIVE_RETRY_COOLDOWN_MS = 5000;
const AGENT_VIEW_STORAGE_KEY = "ownerDashboardAgentViewTargetedControls20260705v2";
const CONTROL_SESSION_KEY = "ownerDashboardControlSession20260715";
const MENGZI_BOT_NAME = "林孟姿";
const TG3_BOT_NAME = "嵐熙";
const AGENT_LABELS = { tg3: "嵐熙", mengzi: "林孟姿", shami: "蝦咩" };
const TELEGRAM_HANDLE_PATTERN = /@[A-Za-z0-9_]{5,}/g;
let controlSessionToken = window.sessionStorage.getItem(CONTROL_SESSION_KEY) || "";
let controlSessionExpiresAt = 0;
let liveEventSource = null;
let eventStreamOpen = false;

function publicText(value) {
  return typeof value === "string" ? value.replace(TELEGRAM_HANDLE_PATTERN, "嵐熙").trim() : value;
}
const DASHBOARD_ACTIONS = {
  rescue: {
    loading: "救援中",
    idle: "救援",
    success: "已送出卡點救援，會依目前頁面角色嘗試續作，不會混用另一位助手。",
    failure: "卡點救援沒有完成，請確認本機即時服務仍在運作。",
    endpointMissing: "卡點救援需要本機即時服務，現在沒有讀到可用端點。"
  },
  "force-stop": {
    loading: "停止中",
    idle: "停止",
    success: "已送出強制停止，會依目前頁面角色只處理對應任務。",
    failure: "強制停止沒有完成，請確認本機即時服務仍在運作。",
    endpointMissing: "強制停止需要本機即時服務，現在沒有讀到可用端點。"
  },
  restart: {
    loading: "重啟中",
    idle: "重啟",
    success: "指定機器人已重啟並恢復心跳。",
    failure: "重啟沒有完成，請確認本機即時服務與看門排程仍在運作。",
    endpointMissing: "重啟需要本機即時服務，現在沒有讀到可用端點。"
  }
};

const dashboardStats = [
  { label: "已安裝技能", value: "80", note: "含主技能、備份版與歷史入口" },
  { label: "主技能項目", value: "53", note: "依技能名稱去重後的可查能力" },
  { label: "記憶檔", value: "88", note: "規則、偏好、成功流程與工作交接記錄" },
  { label: "監控項目", value: "9", note: "TG1、TG2、TG3 任務、token 與快照" }
];

const completedItems = [
  {
    title: "頂部任務指令與功能鍵",
    status: "已套用",
    summary: "目前任務指令移到儀表板最上方，會跟著 TG1／TG2／TG3 切換；卡點救援、強制停止與三端獨立重啟集中在同一控制區。",
    points: ["任務指令最上方顯示", "卡點救援保留作業並嘗試續作", "TG1／TG2／TG3 可分別重啟並驗證新心跳"]
  },
  {
    title: "TG1 / TG2 / TG3 任務欄整合",
    status: "已套用",
    summary: "把主控台與技能入口整理成同一個操作頁；TG1、TG2、TG3 各自有任務快覽，TG3 對外顯示為嵐熙。",
    points: ["TG1 / TG2 / TG3 任務分開顯示", "嵐熙對應 TG3", "技能包改成分類摘要與精簡入口"]
  },
  {
    title: "同步、按鈕與技能包修正",
    status: "已套用",
    summary: "修正前端初始化中斷，頂端狀態不再停在讀取中；重新同步按鈕移到最上方，加入音效與多巴胺粒子回饋，技能包也加入首屏速覽。",
    points: ["同步資料可正常渲染", "手機版看得到重新同步按鈕", "技能包 80 個索引與分類會顯示"]
  },
  {
    title: "頂端左右雙儀表盤",
    status: "已套用",
    summary: "儀表盤固定放在頁面最上方，TG1、TG2、TG3 分欄顯示；手機窄螢幕保留目前頁面角色的主狀態，細節移到下方區塊避免擠壓。"
  },
  {
    title: "手機排版與全頁科技底修正",
    status: "已套用",
    summary: "依截圖修正文字被壓縮、排版不齊與白色區塊問題，手機版改成可完整閱讀的狀態卡與深色科技背景。",
    points: ["總覽卡片可換行不省略", "窄螢幕欄位改完整寬度", "全頁卡片、表格、時間軸統一深色科技底"]
  },
  {
    title: "TG1 / TG2 / TG3 分類",
    status: "已套用",
    summary: "頂部儀表盤改為三個 Telegram bot 分區：蝦咩、林孟姿、嵐熙各自集中任務與回覆狀態。",
    points: ["嵐熙任務集中顯示在 TG3", "蝦咩任務集中顯示", "任務、token、監控與卡點依 bot 分類"]
  },
  {
    title: "移除舊版說明區塊",
    status: "已套用",
    summary: "公開頁不再放主人不想看的舊版說明，主畫面改成狀態、監控與技能資訊。",
    points: ["導覽改成監控與技能", "首頁文案改成操作導向", "資訊呈現更集中"]
  },
  {
    title: "技能包詳細化",
    status: "已套用",
    summary: "技能包改成完整表格，列出技能名稱、分類、功能、使用場景、觸發詞與備份版本備註。",
    points: ["可搜尋", "可依分類篩選", "功能與場景分開列出"]
  },
  {
    title: "監控狀態上儀表盤",
    status: "已套用",
    summary: "頂部即時狀態區直接顯示監控項目，下方再提供完整監控明細。",
    points: ["TG1 心跳", "TG2 心跳", "TG3 心跳", "任務佇列", "token 統計", "GitHub Pages 快照"]
  },
  {
    title: "秒級刷新與科技特效",
    status: "已套用",
    summary: "頁面維持 1 秒自動刷新，手動重新整理時會有彩色粒子、掃描線與光暈回饋。",
    points: ["每秒更新", "點擊有特效", "狀態變動即時重繪"]
  }
];

const sopItems = [
  {
    title: "任務處理",
    summary: "收到新任務後先判斷是否要實作、檢查、部署或交付，不把任務改成待命回覆。",
    steps: ["讀取最新上下文", "檢查必要本機檔案", "直接執行可完成的動作", "回覆結果、網址、路徑或明確卡點"]
  },
  {
    title: "網站更新",
    summary: "網站任務先改本機檔案，再驗證與部署，最後回報公開網址。",
    steps: ["確認 repo 與分支", "修改 HTML/CSS/JS", "本機驗證", "提交並推送", "檢查 GitHub Pages"]
  },
  {
    title: "監控判斷",
    summary: "狀態不是靠記憶猜測，而是從心跳、任務狀態、進程、排程與快照資料整理。",
    steps: ["讀取 TG1 心跳", "讀取 TG2 任務佇列", "讀取 TG3 任務佇列", "整理 token 與快照來源"]
  },
  {
    title: "技能路由",
    summary: "依主人用詞與任務類型選技能，涉及圖片、影片、網站、Telegram、NotebookLM 時使用對應工作流。",
    steps: ["比對觸發詞", "讀取相關技能規則", "照工作流執行", "避免把內部偵錯內容放進回覆"]
  }
];

const skillCatalog = [
  {
    name: "acs",
    group: "影片剪輯",
    variants: 4,
    functions: ["剪映 / CapCut 自動剪輯", "參考影片分析", "時間軸、字幕、素材與匯出流程"],
    scenario: "主人說 acs、對標剪輯、剪映自動剪輯，或要把腳本與素材組成短影片。",
    trigger: "acs / nms / 剪映 / CapCut / 對標剪輯"
  },
  {
    name: "acs2",
    group: "影片剪輯",
    variants: 3,
    functions: ["複製參考短影片節奏", "拆解鏡頭、字幕、轉場與音效", "生成可執行剪輯規格"],
    scenario: "主人要把一支參考短片重新做成同風格版本。",
    trigger: "acs2 / replicate reference / Jianying"
  },
  {
    name: "ans",
    group: "AI 影片",
    variants: 2,
    functions: ["微信小程式 AI 影片流程", "建立、下載、驗證生成影片", "命名、備份與回傳"],
    scenario: "主人要跑微信小程式 AI 影片，或要下載已生成影片。",
    trigger: "ans / 微信小程式 / AI 影片"
  },
  {
    name: "auto-reasoning-router",
    group: "任務判斷",
    variants: 1,
    functions: ["判斷任務需要快答或深度推理", "為 Telegram/Codex 任務選處理強度", "避免簡單任務過度消耗"],
    scenario: "多步驟、寫程式、部署、修 bug、圖片影片工作流需要較高推理時。",
    trigger: "自動路由 / reasoning / 任務分流"
  },
  {
    name: "character-memory-manager",
    group: "角色記憶",
    variants: 3,
    functions: ["管理可重用角色設定", "維護臉、服裝、性格、負面限制", "套用到圖片、影片、短劇與聲音"],
    scenario: "需要固定角色如嵐熙、蝦咩或其他人物在多次生成中保持一致。",
    trigger: "角色記憶 / 人設 / 固定角色"
  },
  {
    name: "cls",
    group: "內容分析",
    variants: 1,
    functions: ["使用聚合平台 Claude 分析", "劇本、短影音、SD/SDF/SDV 前置分析", "產出拍攝與提示詞規格"],
    scenario: "主人說 cls，或要求先用 Claude 做腳本、分鏡、影片規劃分析。",
    trigger: "cls / Claude / 劇本分析 / SD 分析"
  },
  {
    name: "codex-skill-handoff",
    group: "技能交接",
    variants: 4,
    functions: ["打包技能與記憶", "產生安裝教學與轉交訊息", "排除 token、cookie、密碼等敏感物"],
    scenario: "主人要把技能包、記憶、工作流交給另一台 Codex、OpenClaw 或 Telegram bot。",
    trigger: "打包 / 匯出 / handoff / skill zip"
  },
  {
    name: "codex-zuotu-lanxin",
    group: "圖片生成",
    variants: 2,
    functions: ["Lanxin / 聚合平台做圖", "產海報、商品圖、教學圖與繁中視覺", "確認清單、生成、下載原圖與回傳"],
    scenario: "主人要做圖、生圖、海報、商品圖、社群圖或文案轉圖。",
    trigger: "做圖 / 生圖 / 海報 / Lanxin / 聚合平台"
  },
  {
    name: "dreamina-cli",
    group: "AI 影片",
    variants: 2,
    functions: ["Dreamina 即夢 CLI", "提交 SD/SDF/SDV 圖片或影片生成", "檢查狀態與下載結果"],
    scenario: "主人說做 sd、sdf、sdv、生成影片或 Dreamina 任務。",
    trigger: "dreamina / 做sd / 做sdf / 做sdv"
  },
  {
    name: "dreamina-sd-video-workflow",
    group: "AI 影片",
    variants: 1,
    functions: ["10-15 秒 SD/Dreamina 影片工作流", "保留原始提示詞", "查額度、送件、監控、下載"],
    scenario: "需要完整跑 AI 影片生成，而不是只寫提示詞。",
    trigger: "SD 影片 / Dreamina 影片 / 生成影片"
  },
  {
    name: "find-skill",
    group: "技能管理",
    variants: 1,
    functions: ["尋找可用技能", "安裝 Claude Code 技能", "幫專案補齊工作流"],
    scenario: "主人要找技能、裝技能，或問某個工作要用什麼技能。",
    trigger: "find skill / 找技能 / 安裝技能"
  },
  {
    name: "github-pages-deploy",
    group: "網站部署",
    variants: 1,
    functions: ["靜態網站 GitHub Pages 部署", "更新 repo、分支與 Pages 設定", "驗證公開 github.io 網址"],
    scenario: "網站做好後要公開部署、重建 Pages 或修 GitHub Pages。",
    trigger: "GitHub Pages / 公開部署 / deploy"
  },
  {
    name: "hyperframes",
    group: "影片合成",
    variants: 1,
    functions: ["HTML 影片構圖", "字幕、旁白、音訊反應動畫", "轉場、標題卡與可渲染場景"],
    scenario: "需要做可渲染的動態影片、字幕視覺或音樂節拍動畫。",
    trigger: "HyperFrames / 影片構圖 / 動畫字幕"
  },
  {
    name: "imagegen",
    group: "舊版圖片入口",
    variants: 1,
    functions: ["舊版內建圖片入口", "目前只保留索引", "正式圖片任務改走 Lanxin"],
    scenario: "歷史相容用；新做圖任務不走這條。",
    trigger: "舊版 imagegen / 已停用"
  },
  {
    name: "imagegen-poster-telegram",
    group: "舊版圖片入口",
    variants: 1,
    functions: ["舊版 Telegram 海報入口", "保留舊任務索引", "正式海報改走 Lanxin"],
    scenario: "歷史工作流留存；新海報任務改用做圖 / Lanxin 路由。",
    trigger: "舊版海報 / 已停用"
  },
  {
    name: "imagegen-poster-telegram_20260619_235528",
    group: "舊版圖片入口",
    variants: 1,
    functions: ["舊版海報技能備份", "保留日期版本", "避免覆蓋歷史流程"],
    scenario: "需要追溯 2026-06-19 的舊版海報規則時。",
    trigger: "備份版 / 歷史索引"
  },
  {
    name: "imagegen-poster-telegram_20260620_002546",
    group: "舊版圖片入口",
    variants: 1,
    functions: ["舊版海報技能備份", "保留日期版本", "正式任務仍改走 Lanxin"],
    scenario: "需要比對 2026-06-20 的舊版海報流程時。",
    trigger: "備份版 / 歷史索引"
  },
  {
    name: "imagegen_20260620_002546",
    group: "舊版圖片入口",
    variants: 1,
    functions: ["舊版 imagegen 備份", "保留歷史行為", "不作為新圖任務主路由"],
    scenario: "查舊版 imagegen 行為或還原歷史說明。",
    trigger: "備份版 / 歷史索引"
  },
  {
    name: "imagegen_new",
    group: "舊版圖片入口",
    variants: 1,
    functions: ["新版試驗圖片入口", "目前不作為正式做圖路線", "正式圖片統一走 Lanxin"],
    scenario: "只作歷史索引或測試比較。",
    trigger: "備份 / 試驗入口"
  },
  {
    name: "ims",
    group: "圖片生成",
    variants: 1,
    functions: ["Telegram 圖片與海報任務路由", "Lanxin AI-only 生成", "下載原圖並以文件模式回傳"],
    scenario: "主人說 ims，或要求生成、修改、重送圖片與視覺設計。",
    trigger: "ims / 圖片 / 海報 / 視覺設計"
  },
  {
    name: "ims_20260626_132041",
    group: "圖片生成",
    variants: 1,
    functions: ["IMS 備份版本", "保留當日圖片工作流", "用於追溯或比較"],
    scenario: "需要查看 2026-06-26 13:20 版圖片規則。",
    trigger: "IMS 備份"
  },
  {
    name: "ims_20260626_132942",
    group: "圖片生成",
    variants: 1,
    functions: ["IMS 備份版本", "保留當日修正版", "用於追溯或比較"],
    scenario: "需要查看 2026-06-26 13:29 版圖片規則。",
    trigger: "IMS 備份"
  },
  {
    name: "ims_20260626_134301",
    group: "圖片生成",
    variants: 1,
    functions: ["IMS 備份版本", "保留當日修正版", "用於追溯或比較"],
    scenario: "需要查看 2026-06-26 13:43 版圖片規則。",
    trigger: "IMS 備份"
  },
  {
    name: "ims_20260626_153459",
    group: "圖片生成",
    variants: 1,
    functions: ["IMS 備份版本", "保留當日修正版", "用於追溯或比較"],
    scenario: "需要查看 2026-06-26 15:34 版圖片規則。",
    trigger: "IMS 備份"
  },
  {
    name: "lanxin-image-workflow",
    group: "圖片生成",
    variants: 1,
    functions: ["Lanxin AI 圖片生成流程", "檢查登入、額度、UID、生成狀態", "下載平台原圖與驗證尺寸"],
    scenario: "需要實際操作 lx.lanxinai.com 產出圖片或海報。",
    trigger: "Lanxin / 聚合平台 / 藍星 AI"
  },
  {
    name: "mininew-bridge-handoff",
    group: "Telegram 基建",
    variants: 2,
    functions: ["MiniNew Telegram Codex bridge 交接", "建立新客戶 bot 環境", "複製記憶與技能基礎"],
    scenario: "要把橋接系統搬到另一個 bot、電腦或客戶環境。",
    trigger: "MiniNew / bridge handoff / 新 bot"
  },
  {
    name: "monthly-course-site-updater",
    group: "網站維護",
    variants: 1,
    functions: ["每月課程報名網站更新", "替換日期、表單、報到資訊", "保持既有設計與部署流程"],
    scenario: "主人要更新藍星 AI 課程網站的月度內容。",
    trigger: "月課程網站 / 報名頁 / check-in"
  },
  {
    name: "nbps",
    group: "NotebookLM",
    variants: 1,
    functions: ["舊別名", "導向 nbs 音訊摘要流程", "保留相容性"],
    scenario: "使用者沿用 nbps 舊名稱時。",
    trigger: "nbps / 舊別名"
  },
  {
    name: "nbs",
    group: "NotebookLM",
    variants: 2,
    functions: ["NotebookLM 簡報、音訊、影片摘要工作流", "整理來源材料", "產出可交付摘要包"],
    scenario: "主人說 nbs，或要把資料、網站、YouTube、檔案轉成 NotebookLM 內容。",
    trigger: "nbs / NotebookLM / 摘要 / 簡報"
  },
  {
    name: "nbs-media-summary-pack",
    group: "NotebookLM",
    variants: 2,
    functions: ["封裝 NBS 媒體摘要能力", "教另一個環境如何做影片/音訊摘要", "保留既有行為"],
    scenario: "要把 NBS 媒體摘要技能打包教給其他 Codex 或 bot。",
    trigger: "NBS media pack / 摘要技能包"
  },
  {
    name: "nbs-skill",
    group: "NotebookLM",
    variants: 2,
    functions: ["NotebookLM slide/deck 工作流", "準備簡報提示與來源", "支援另一個 Codex 學習"],
    scenario: "主人要做 NotebookLM 簡報或把 deck 工作流交接。",
    trigger: "NBS / NotebookLM deck"
  },
  {
    name: "nbvs",
    group: "NotebookLM",
    variants: 1,
    functions: ["舊別名", "導向 nbs 影片摘要流程", "保留相容性"],
    scenario: "使用者沿用 nbvs 舊名稱時。",
    trigger: "nbvs / 舊別名"
  },
  {
    name: "new-customer-bot-base",
    group: "Telegram 基建",
    variants: 1,
    functions: ["新客戶 bot 初始化", "轉移 bot 記憶與技能基礎", "建立交接骨架"],
    scenario: "要建立新的客戶 Telegram bot 或複製既有能力到新環境。",
    trigger: "new customer bot / 客戶 bot"
  },
  {
    name: "nms-digital-human",
    group: "數字人影片",
    variants: 1,
    functions: ["數字人、AI 網紅、搖錢樹 AI 流程", "從音訊、腳本、圖片產出數字人規格", "整合影片生成需求"],
    scenario: "主人說 nms、數字人、AI 網紅或要做數字人影片。",
    trigger: "nms / 數字人 / AI 網紅"
  },
  {
    name: "notebooklm-brief-to-deck-workflow",
    group: "NotebookLM",
    variants: 3,
    functions: ["把 brief 變 NotebookLM 簡報", "建立來源包與 slide 指令", "支援可重複流程"],
    scenario: "要從企劃、文字、資料包快速轉成 NotebookLM presentation。",
    trigger: "NotebookLM brief / deck"
  },
  {
    name: "notebooklm-presentation-prompt",
    group: "NotebookLM",
    variants: 3,
    functions: ["產生 NotebookLM 簡報提示", "建立 slide-generation instruction pack", "控制格式與重點"],
    scenario: "需要把資料轉成可貼進 NotebookLM 的簡報生成指令。",
    trigger: "presentation prompt / 簡報提示"
  },
  {
    name: "notebooklm-source-builder",
    group: "NotebookLM",
    variants: 3,
    functions: ["整理 NotebookLM-ready source pack", "清理筆記、逐字稿、PDF、網頁與課程材料", "輸出可餵給 NotebookLM 的來源"],
    scenario: "資料雜亂，需要先整理成 NotebookLM 可讀來源。",
    trigger: "source builder / NotebookLM 來源包"
  },
  {
    name: "notion-knowledge-capture",
    group: "知識管理",
    variants: 1,
    functions: ["把對話與決策整理進 Notion", "建立 wiki 條目", "保留決策脈絡"],
    scenario: "主人要把聊天、會議、規則或 SOP 變成 Notion 知識頁。",
    trigger: "Notion / knowledge capture"
  },
  {
    name: "openclaw-browser-automation",
    group: "OpenClaw 自動化",
    variants: 1,
    functions: ["瀏覽器自動化規則", "登入、點擊、表單、截圖與頁面檢查", "套用 OpenClaw 習慣"],
    scenario: "需要操作網頁、檢查平台、執行登入或測試流程。",
    trigger: "OpenClaw browser / 瀏覽器自動化"
  },
  {
    name: "openclaw-desktop-control",
    group: "OpenClaw 自動化",
    variants: 1,
    functions: ["桌面控制備忘", "只在需要本機桌面操作時使用", "輔助安全的視窗與滑鼠鍵盤操作"],
    scenario: "任務明確需要控制 Windows 桌面、應用程式或非網頁視窗。",
    trigger: "OpenClaw desktop / 桌面控制"
  },
  {
    name: "operator-principles",
    group: "回覆規則",
    variants: 1,
    functions: ["主人互動原則", "中文回覆、節奏、非垃圾訊息", "避免固定模板與偵錯外露"],
    scenario: "判斷回覆語氣、時間、是否該先執行任務時。",
    trigger: "operator rules / 回覆原則"
  },
  {
    name: "pdf",
    group: "文件處理",
    variants: 1,
    functions: ["PDF 閱讀、建立、審查", "重視渲染與版面", "必要時產出或驗證 PDF"],
    scenario: "任務涉及 PDF 檔、頁面排版、匯出或內容審查。",
    trigger: "PDF / 文件 / 版面"
  },
  {
    name: "playwright",
    group: "瀏覽器測試",
    variants: 1,
    functions: ["真實瀏覽器自動化", "導航、表單、截圖、快照與驗證", "前端測試與網頁檢查"],
    scenario: "網站做好後要檢查桌機/手機版、互動或公開頁狀態。",
    trigger: "Playwright / browser test"
  },
  {
    name: "playwright-interactive",
    group: "瀏覽器測試",
    variants: 1,
    functions: ["持久化 Playwright / Electron 互動", "快速 UI debug", "保留瀏覽器狀態"],
    scenario: "需要反覆點擊、截圖、調整前端畫面時。",
    trigger: "interactive browser / UI debug"
  },
  {
    name: "screenshot",
    group: "截圖",
    variants: 1,
    functions: ["桌面或指定視窗截圖", "提供系統畫面佐證", "只在主人要求截圖時使用"],
    scenario: "主人明確說要截圖、看目前畫面或提供視覺證明。",
    trigger: "截圖 / screenshot"
  },
  {
    name: "做圖",
    group: "圖片生成",
    variants: 1,
    functions: ["繁中海報與圖片生成規則", "Lanxin AI 聚合平台路由", "先確認、再生成、下載原圖"],
    scenario: "主人要求做圖、生圖、海報、商品圖、行銷圖或教學步驟圖片。",
    trigger: "做圖 / 生圖 / 產海報 / 蘭心 AI"
  },
  {
    name: "speech",
    group: "音訊",
    variants: 2,
    functions: ["文字轉語音", "旁白、可近用朗讀、批次音訊", "支援 voiceover 需求"],
    scenario: "主人要產生語音、旁白、朗讀音檔或影片配音素材。",
    trigger: "speech / TTS / voiceover / 旁白"
  },
  {
    name: "teaching-step-images",
    group: "教學圖片",
    variants: 1,
    functions: ["教學步驟圖、SOP 分鏡圖", "手機操作教學圖", "批次規劃與標註"],
    scenario: "主人要做教學圖、操作步驟圖、SOP 圖卡或流程教學素材。",
    trigger: "教學步驟圖片 / SOP 圖 / 手機教學"
  },
  {
    name: "telegram-bot-manager",
    group: "Telegram 基建",
    variants: 2,
    functions: ["Telegram bot 工作流管理", "檔案、圖片、音訊與文件回傳", "排查 bot 回覆與傳送錯誤"],
    scenario: "Telegram 來源任務需要交付檔案、排查回覆、配置 bot 或檢查媒體傳送。",
    trigger: "Telegram bot / 回傳 / bot 管理"
  },
  {
    name: "transcribe",
    group: "音訊",
    variants: 2,
    functions: ["音訊轉文字", "可選說話者分離", "支援已知說話者提示"],
    scenario: "主人提供音檔、影片音訊或會議錄音要轉成文字。",
    trigger: "transcribe / 逐字稿 / 音訊轉文字"
  },
  {
    name: "video-frame-analysis",
    group: "影片分析",
    variants: 2,
    functions: ["影片逐格分析", "教學影片設定、語速、視覺節奏判斷", "拆解鏡頭與畫面資訊"],
    scenario: "主人傳影片、要求分析影片或要抓教學影片參數。",
    trigger: "分析影片 / frame analysis"
  },
  {
    name: "video-spec-builder",
    group: "影片規格",
    variants: 1,
    functions: ["從故事、腳本、分鏡建影片規格", "整理 AI 影片 production spec", "輸出鏡頭與提示詞結構"],
    scenario: "主人有故事大綱、腳本或場景，要做成可生成影片的規格。",
    trigger: "video spec / 影片規格 / 分鏡"
  },
  {
    name: "wbs",
    group: "網站部署",
    variants: 1,
    functions: ["網站建置、更新、測試與公開部署", "GitHub Pages 成功流程", "回報公開網址與本機路徑"],
    scenario: "主人要重做網站、改網站、加入網站、公開部署或查網站好了沒。",
    trigger: "wbs / 網站 / 公開部署 / GitHub"
  }
];

const timeline = [
  ["2026-07-14", "將嵐熙併回 TG3，只保留 TG1、TG2、TG3 三個任務入口。"],
  ["2026-07-03", "整合主控台與技能入口版面，新增 TG1 / TG2 / TG3 任務欄位與頂端任務快覽。"],
  ["2026-07-03", "修正前端初始化中斷，讓 runtime-status.json、技能包清單與頂端同步狀態可正常顯示。"],
  ["2026-07-03", "重新同步按鈕移到頂端控制列，點擊時加入短促音效、彩色粒子與同步完成回饋。"],
  ["2026-07-05", "功能鍵依目前頁面角色分別救援或強停。"],
  ["2026-07-03", "頂端儀表盤建立雙欄總覽，手機版保留左右分開且不擠壓主狀態。"],
  ["2026-07-03", "狀態總控台依 TG1、TG2、TG3 分類，任務、token、監控、卡點與檢查依 bot 來源分類。"],
  ["2026-07-03", "紅圈內 Live Status 說明文字不再顯示，主介面集中顯示 TG1、TG2、TG3 狀態監控。"],
  ["2026-07-03", "依主人補充移除舊版說明區塊，改為監控、技能包與操作資訊。"],
  ["2026-07-03", "技能包清單擴充為功能、使用場景、觸發詞與備份版本備註。"],
  ["2026-07-03", "監控項目加入頂部即時儀表盤與下方明細區。"],
  ["2026-07-03", "維持每秒刷新與點擊重新整理的多巴胺科技特效。"],
  ["2026-07-02", "建立 TG1、TG2、TG3 秒級狀態卡。"]
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
  heartbeat: { name: "蝦咩", ageSeconds: null, activeRequests: null },
  tgbot2: { name: MENGZI_BOT_NAME, statusKey: "watch", statusLabel: "狀態待同步", ageSeconds: null, activeRequests: null, currentTaskInstruction: "林孟姿 TGBOT2 任務待同步。", currentTaskSource: "tg-openai-bot-2" },
  tgbot3: { name: TG3_BOT_NAME, statusKey: "watch", statusLabel: "狀態待同步", ageSeconds: null, activeRequests: null, currentTaskInstruction: "嵐熙 TG3 任務待同步。", currentTaskSource: "tg-openai-bot-3" },
  deliverables: [],
  monitors: []
};

const $ = (selector) => document.querySelector(selector);
let lastRenderedStatus = fallbackRuntimeStatus;
let lastStatusSignature = "";
let selectedSkillGroup = "全部";
let skillSearchTerm = "";
let selectedAgentView = "shami";
let isStatusLoading = false;
let liveUnavailableUntil = 0;
let refreshAudioContext = null;
let actionInFlight = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  const minuteRest = minutes % 60;
  return `${hours} 小時 ${minuteRest} 分前`;
}

function refreshSecondsFrom(status) {
  const value = Number(status?.refreshSeconds);
  if (!Number.isFinite(value)) return DEFAULT_REFRESH_SECONDS;
  return Math.max(1, Math.min(10, Math.round(value)));
}

function statusTone(key) {
  if (["running", "standby", "completed", "ok"].includes(key)) return "ok";
  if (["blocked", "failed", "disconnected", "error"].includes(key)) return "blocked";
  if (["ready", "watch", "pending", "unknown"].includes(key)) return "watch";
  return "watch";
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
  if (label) label.textContent = isLoading ? "同步中" : "重新同步";
}

function setActionFeedback(message, state = "idle") {
  const feedback = $("#actionFeedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = state;
}

function currentActionTarget() {
  if (selectedAgentView === "tg3") return "tg3";
  if (selectedAgentView === "mengzi") return "mengzi";
  return "shami";
}

function setControlLockState(unlocked, message = "") {
  const status = $("#controlLockStatus");
  if (!status) return;
  status.dataset.state = unlocked ? "unlocked" : "locked";
  status.textContent = message || (unlocked ? "控制功能已解鎖" : "控制功能已鎖定");
}

function controlRequestHeaders(extra = {}) {
  return {
    ...extra,
    ...(controlSessionToken ? { Authorization: `Bearer ${controlSessionToken}` } : {})
  };
}

async function unlockDashboardControls() {
  const codeInput = $("#controlCode");
  const code = codeInput?.value.trim() || "";
  if (!/^\d{6}$/.test(code)) {
    setControlLockState(false, "請輸入 6 位數本機操作碼");
    codeInput?.focus();
    return;
  }

  const button = $("#unlockControls");
  if (button) button.disabled = true;
  try {
    const endpoints = await liveEndpointCandidates();
    if (!endpoints.length) throw new Error("目前沒有可用的即時控制服務。");
    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${endpoint}/api/control/unlock`, {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.token) throw new Error(payload.message || "操作碼驗證失敗。");
        liveStatusEndpoint = endpoint;
        controlSessionToken = payload.token;
        controlSessionExpiresAt = Number(payload.expiresAt || 0);
        window.sessionStorage.setItem(CONTROL_SESSION_KEY, controlSessionToken);
        if (codeInput) codeInput.value = "";
        setControlLockState(true, "控制功能已解鎖 30 分鐘");
        setActionFeedback("控制功能已可使用。", "success");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("操作碼驗證失敗。");
  } catch (error) {
    controlSessionToken = "";
    window.sessionStorage.removeItem(CONTROL_SESSION_KEY);
    setControlLockState(false, error?.message || "操作碼驗證失敗。");
  } finally {
    if (button) button.disabled = false;
  }
}

function renderActionHistory(history = [], queue = []) {
  const list = $("#actionHistoryList");
  if (!list) return;
  const queueTargets = new Set((queue || []).map((item) => item.target));
  if (!history.length) {
    list.innerHTML = "<span>目前沒有操作紀錄</span>";
    return;
  }
  list.innerHTML = history.slice(0, 8).map((item) => {
    const actionLabel = item.action === "restart" ? "重啟" : item.action === "rescue" ? "救援" : "停止";
    const statusLabel = item.status === "completed" ? "完成" : item.status === "queued" || queueTargets.has(item.target) ? "排隊中" : item.status === "failed" ? "失敗" : "執行中";
    const time = formatDateTime(item.completedAt || item.startedAt || item.requestedAt);
    const processDetail = item.oldPid || item.newPid ? ` · 程序 ${item.oldPid || "--"} → ${item.newPid || "--"}` : "";
    const reasonDetail = item.reason ? ` · 原因：${item.reason}` : "";
    return `<article data-state="${escapeHtml(item.status || "requested")}"><b>${escapeHtml(item.targetLabel || AGENT_LABELS[item.target] || item.target)} · ${actionLabel}</b><span>${escapeHtml(statusLabel)} · ${escapeHtml(time)}</span><small>${escapeHtml(`${item.message || ""}${reasonDetail}${processDetail}`)}</small></article>`;
  }).join("");
}

async function loadActionHistory() {
  const endpoints = await liveEndpointCandidates();
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}/api/action-history?ts=${Date.now()}`, { cache: "no-store", headers: controlRequestHeaders() });
      if (!response.ok) continue;
      const payload = await response.json();
      renderActionHistory(payload.history, payload.queue);
      return;
    } catch {
      // Try the next known endpoint.
    }
  }
}

function currentActionTargetLabel() {
  return AGENT_LABELS[currentActionTarget()];
}

async function refreshLiveEndpointFromConfig() {
  if (sameOriginLiveStatusEndpoint) {
    liveStatusEndpoint = sameOriginLiveStatusEndpoint;
    return liveStatusEndpoint;
  }

  try {
    const response = await fetch(`live-status-config.js?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return liveStatusEndpoint;
    const text = await response.text();
    const match = text.match(/OWNER_LIVE_STATUS_ENDPOINT\s*=\s*["']([^"']+)["']/);
    if (match && match[1]) {
      configuredLiveStatusEndpoint = match[1].replace(/\/$/, "");
      liveStatusEndpoint = configuredLiveStatusEndpoint;
    }
  } catch {
    // Keep the existing endpoint; the action will report the real blocker below.
  }

  return liveStatusEndpoint;
}

async function liveEndpointCandidates() {
  await refreshLiveEndpointFromConfig();
  return Array.from(new Set([
    liveStatusEndpoint,
    sameOriginLiveStatusEndpoint,
    configuredLiveStatusEndpoint
  ].filter(Boolean)));
}

function updateActionTargetLabels() {
  const targetLabel = currentActionTargetLabel();
  document.querySelectorAll("[data-dashboard-action]").forEach((button) => {
    const config = DASHBOARD_ACTIONS[button.dataset.dashboardAction] || {};
    const explicitTarget = button.dataset.actionTarget;
    const buttonTargetLabel = explicitTarget ? AGENT_LABELS[explicitTarget] : targetLabel;
    const text = explicitTarget
      ? `${config.idle || "操作"} ${explicitTarget === "shami" ? "TG1" : explicitTarget === "mengzi" ? "TG2" : "TG3"}`
      : `${config.idle || "操作"}${buttonTargetLabel}`;
    const label = button.querySelector("b");
    if (label && !button.classList.contains("is-running")) label.textContent = text;
    button.setAttribute("aria-label", text);
    button.title = explicitTarget
      ? `${text}，只處理${buttonTargetLabel}，不影響另外兩個機器人`
      : `${text}，只處理目前頁面切換到的${buttonTargetLabel}任務`;
  });
}

function setActionButtonsLoading(action, isLoading, requestedTarget = "") {
  actionInFlight = isLoading ? action : "";
  const targetLabel = currentActionTargetLabel();
  document.querySelectorAll("[data-dashboard-action]").forEach((button) => {
    const explicitTarget = button.dataset.actionTarget || "";
    const isTarget = button.dataset.dashboardAction === action && (!requestedTarget || !explicitTarget || explicitTarget === requestedTarget);
    const config = DASHBOARD_ACTIONS[button.dataset.dashboardAction] || {};
    button.disabled = isLoading;
    button.classList.toggle("is-running", isLoading && isTarget);
    const label = button.querySelector("b");
    if (label && isLoading && isTarget) label.textContent = `${config.loading}${AGENT_LABELS[requestedTarget] || targetLabel}`;
  });
  if (!isLoading) updateActionTargetLabels();
}

function activeTaskContent(status = lastRenderedStatus) {
  if (selectedAgentView === "mengzi") {
    return {
      scope: "林孟姿任務指令",
      text: tgbot2TaskInstruction(status),
      detail: tgbot2TaskSource(status),
      state: statusTone(status.tgbot2?.statusKey || "watch")
    };
  }

  if (selectedAgentView === "tg3") {
    return {
      scope: "嵐熙任務指令",
      text: tgbot3TaskInstruction(status),
      detail: tgbot3TaskSource(status),
      state: statusTone(status.tgbot3?.statusKey || "watch")
    };
  }

  return {
    scope: "蝦咩任務指令",
    text: currentTaskInstruction(status),
    detail: "Telegram 最新任務固定放在最上方。",
    state: statusTone(status.statusKey || "watch")
  };
}

function renderActiveTaskPanel(status = lastRenderedStatus) {
  const banner = $(".active-task-banner");
  if (!banner) return;
  const content = activeTaskContent(status);
  banner.dataset.state = content.state;
  setTextIfPresent("#activeTaskScope", content.scope);
  setTextIfPresent("#activeTaskText", content.text);
  setTextIfPresent("#activeTaskDetail", content.detail);
}

async function runDashboardAction(action, requestedTarget = "") {
  const config = DASHBOARD_ACTIONS[action];
  if (!config || actionInFlight) return;
  const target = requestedTarget || currentActionTarget();
  const targetLabel = AGENT_LABELS[target] || currentActionTargetLabel();
  const restartMode = $("#restartMode")?.value === "force" ? "force" : "safe";
  const reason = $("#actionReason")?.value.trim() || "網站控制台操作";

  if (!controlSessionToken || (controlSessionExpiresAt && controlSessionExpiresAt <= Date.now())) {
    controlSessionToken = "";
    window.sessionStorage.removeItem(CONTROL_SESSION_KEY);
    setControlLockState(false, "請先輸入本機操作碼解鎖控制功能");
    $("#controlCode")?.focus();
    return;
  }

  if (action === "restart") {
    const modeText = restartMode === "force"
      ? "立即重啟會中斷該機器人目前任務。"
      : "安全重啟會在有任務時自動排隊，等任務完成後再執行。";
    const confirmed = window.confirm(`確定要${restartMode === "force" ? "立即" : "安全"}重啟${targetLabel}嗎？\n\n${modeText}\n另外兩端不受影響。`);
    if (!confirmed) {
      setActionFeedback(`已取消重啟${targetLabel}。`, "idle");
      return;
    }
  }

  playRefreshSound();
  triggerRefreshEffect();
  setActionButtonsLoading(action, true, target);
  const actionProgress = action === "rescue"
    ? `正在嘗試救援${targetLabel}卡點...`
    : action === "restart"
      ? `正在重啟${targetLabel}並等待恢復心跳...`
      : `正在送出${targetLabel}強制停止...`;
  setActionFeedback(actionProgress, "idle");

  try {
    const endpoints = await liveEndpointCandidates();
    if (!endpoints.length) {
      throw new Error(config.endpointMissing);
    }

    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const actionUrl = `${endpoint}/api/action/${action}?target=${encodeURIComponent(target)}&mode=${encodeURIComponent(restartMode)}&reason=${encodeURIComponent(reason)}`;
        const response = await fetch(actionUrl, {
          method: "POST",
          cache: "no-store",
          headers: controlRequestHeaders({
            "X-Dashboard-Target": target
          })
        });
        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }
        if (response.status === 401) {
          controlSessionToken = "";
          window.sessionStorage.removeItem(CONTROL_SESSION_KEY);
          setControlLockState(false, "控制權限已到期，請重新輸入操作碼");
        }
        if (!response.ok || payload.ok === false) {
          throw new Error(payload.message || config.failure);
        }
        liveStatusEndpoint = endpoint;
        setActionFeedback(payload.message || config.success, "success");
        setActionButtonsLoading(action, false, target);
        await loadActionHistory();
        await loadRuntimeStatus({ manual: true });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error(config.failure);
  } catch (error) {
    setActionFeedback(error?.message || config.failure, "blocked");
  } finally {
    setActionButtonsLoading(action, false, target);
  }
}

function playRefreshSound() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return;
  try {
    refreshAudioContext = refreshAudioContext || new AudioContextConstructor();
    if (refreshAudioContext.state === "suspended") refreshAudioContext.resume();
    const now = refreshAudioContext.currentTime;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = refreshAudioContext.createOscillator();
      const gain = refreshAudioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.055);
      gain.gain.setValueAtTime(0.0001, now + index * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.055 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.055 + 0.16);
      oscillator.connect(gain);
      gain.connect(refreshAudioContext.destination);
      oscillator.start(now + index * 0.055);
      oscillator.stop(now + index * 0.055 + 0.17);
    });
  } catch {
    // Audio is optional; some browsers block it until the first trusted click.
  }
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
  for (let index = 0; index < 34; index += 1) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 34 + Math.random() * 0.42;
    const distance = 40 + Math.random() * 86;
    spark.className = "spark";
    spark.style.setProperty("--spark-x", `${38 + Math.random() * 24}%`);
    spark.style.setProperty("--spark-y", `${20 + Math.random() * 28}%`);
    spark.style.setProperty("--spark-dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--spark-dy", `${Math.sin(angle) * distance}px`);
    spark.style.setProperty("--spark-size", `${4 + Math.random() * 6}px`);
    spark.style.setProperty("--spark-color", colors[index % colors.length]);
    layer.appendChild(spark);
    window.setTimeout(() => spark.remove(), 900);
  }
}

function updateLiveClock() {
  const clock = $("#localClock");
  if (clock) clock.textContent = formatDateTime(new Date());

  const displayTime = lastRenderedStatus.checkedAt || lastRenderedStatus.updatedAt;
  const liveAge = $("#liveAge");
  if (liveAge) liveAge.textContent = formatAge(displayTime);
}

function renderStats() {
  $("#statGrid").innerHTML = dashboardStats.map((item) => `
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
      ${Array.isArray(item.points) && item.points.length ? `<ul>${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : ""}
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

function skillGroups() {
  return ["全部", ...Array.from(new Set(skillCatalog.map((item) => item.group))).sort((a, b) => a.localeCompare(b, "zh-Hant-TW"))];
}

function skillGroupStats(items = skillCatalog) {
  const stats = new Map();
  items.forEach((item) => {
    const current = stats.get(item.group) || { group: item.group, count: 0, variants: 0 };
    current.count += 1;
    current.variants += Number(item.variants || 1);
    stats.set(item.group, current);
  });
  return Array.from(stats.values()).sort((a, b) => a.group.localeCompare(b.group, "zh-Hant-TW"));
}

function renderSkillFilters() {
  const container = $("#skillFilters");
  if (!container) return;
  const counts = new Map(skillGroupStats(skillCatalog).map((item) => [item.group, item.count]));
  container.innerHTML = skillGroups().map((group) => `
    <button type="button" class="${group === selectedSkillGroup ? "active" : ""}" data-group="${escapeHtml(group)}">
      <span>${escapeHtml(group)}</span>
      <small>${group === "全部" ? skillCatalog.length : counts.get(group) || 0}</small>
    </button>
  `).join("");
  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedSkillGroup = button.dataset.group;
      renderSkills();
    });
  });
}

function filteredSkills() {
  const term = skillSearchTerm.trim().toLowerCase();
  return skillCatalog.filter((item) => {
    const groupMatch = selectedSkillGroup === "全部" || item.group === selectedSkillGroup;
    if (!groupMatch) return false;
    if (!term) return true;
    const haystack = [
      item.name,
      item.group,
      item.scenario,
      item.trigger,
      ...item.functions
    ].join(" ").toLowerCase();
    return haystack.includes(term);
  });
}

function renderSkills() {
  const summary = $("#skillSummary");
  const visible = filteredSkills();
  const isDefaultView = selectedSkillGroup === "全部" && !skillSearchTerm.trim();
  const cardItems = isDefaultView ? visible.slice(0, 12) : visible;
  const totalVariants = skillCatalog.reduce((sum, item) => sum + Number(item.variants || 1), 0);
  const groups = skillGroups();
  const visibleVariants = visible.reduce((sum, item) => sum + Number(item.variants || 1), 0);
  const visibleGroupCount = new Set(visible.map((item) => item.group)).size;
  const summaryItems = [
    { value: "80", label: "索引內技能", note: "本機目前安裝數" },
    { value: String(skillCatalog.length), label: "頁面列出項目", note: "主技能與重要歷史入口" },
    { value: String(totalVariants), label: "版本數", note: "含備份與日期版" },
    { value: String(visible.length), label: "目前篩選", note: selectedSkillGroup === "全部" ? "全部分類" : selectedSkillGroup }
  ];
  if (summary) {
    summary.innerHTML = summaryItems.map((item) => `
      <div class="summary-chip">
        <b>${escapeHtml(item.value)}</b>
        <span>${escapeHtml(item.label)}</span>
        <small>${escapeHtml(item.note)}</small>
      </div>
    `).join("");
  }

  const viewMeta = $("#skillViewMeta");
  if (viewMeta) {
    const activeLabel = selectedSkillGroup === "全部" ? "全部分類" : selectedSkillGroup;
    viewMeta.innerHTML = [
      { value: `${cardItems.length}`, label: isDefaultView ? "精選入口" : "顯示項目" },
      { value: `${visibleGroupCount || 0}`, label: "涵蓋分類" },
      { value: `${visibleVariants}`, label: activeLabel }
    ].map((item) => `
      <div class="skill-view-chip">
        <b>${escapeHtml(item.value)}</b>
        <span>${escapeHtml(item.label)}</span>
      </div>
    `).join("");
  }

  setTextIfPresent("#chipSkillStatus", `80 個技能 / ${totalVariants} 版本`);
  setTextIfPresent("#chipSkillDetail", `${skillCatalog.length} 個主項目，${groups.length - 1} 類分類已顯示`);

  const groupOverview = $("#skillGroupOverview");
  if (groupOverview) {
    const overviewGroups = skillGroupStats(visible)
      .sort((a, b) => b.count - a.count || a.group.localeCompare(b.group, "zh-Hant-TW"))
      .slice(0, 8);
    groupOverview.innerHTML = overviewGroups.map((item) => `
      <article class="skill-group-card ${item.group === selectedSkillGroup ? "active" : ""}">
        <b>${escapeHtml(item.group)}</b>
        <span>${escapeHtml(item.count)} 項 / ${escapeHtml(item.variants)} 版</span>
      </article>
    `).join("");
  }

  const skillCards = $("#skillCards");
  const skillEmpty = $("#skillEmpty");
  if (skillCards) {
    const hiddenCount = Math.max(0, visible.length - cardItems.length);
    skillCards.innerHTML = cardItems.map((item) => `
      <article class="skill-card">
        <div class="skill-card-head">
          <div class="skill-title">
            <b>${escapeHtml(item.name)}</b>
            <span>${escapeHtml(item.group)}</span>
          </div>
          <small class="skill-version-badge">${item.variants > 1 ? `${escapeHtml(item.variants)} 版` : "單版"}</small>
        </div>
        <ul class="skill-function-list">${item.functions.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
        <div class="skill-card-field">
          <span>使用場景</span>
          <p>${escapeHtml(item.scenario)}</p>
        </div>
        <div class="skill-card-field">
          <span>觸發 / 備註</span>
          <p class="skill-trigger-text">${escapeHtml(item.trigger)}</p>
        </div>
      </article>
    `).join("") + (hiddenCount ? `
      <article class="skill-more-card">
        <span>完整清單</span>
        <b>還有 ${escapeHtml(hiddenCount)} 個技能入口</b>
        <p>使用搜尋或分類可切換精準視圖；下方完整表格保留全部技能包資料。</p>
      </article>
    ` : "");
  }
  if (skillEmpty) skillEmpty.classList.toggle("is-visible", visible.length === 0);

  const skillTable = $("#skillTable");
  if (skillTable) skillTable.innerHTML = visible.map((item) => `
    <tr>
      <td>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${item.variants > 1 ? `${escapeHtml(item.variants)} 個版本` : "單一版本"}</small>
      </td>
      <td>${escapeHtml(item.group)}</td>
      <td><ul class="inline-list">${item.functions.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul></td>
      <td>${escapeHtml(item.scenario)}</td>
      <td>${escapeHtml(item.trigger)}</td>
    </tr>
  `).join("");

  renderSkillFilters();
}

function renderTimeline() {
  $("#timelineList").innerHTML = timeline.map(([time, text]) => `
    <article class="timeline-item">
      <time>${escapeHtml(time)}</time>
      <p>${escapeHtml(text)}</p>
    </article>
  `).join("");
}

function buildMonitorItems(status) {
  if (Array.isArray(status.monitors) && status.monitors.length) {
    return status.monitors.filter(Boolean).map((item) => ({
      id: item.id || item.label,
      label: item.label || "監控項目",
      stateKey: item.statusKey || item.stateKey || "watch",
      statusLabel: item.statusLabel || item.state || "待確認",
      detail: item.detail || item.note || "",
      source: item.source || ""
    }));
  }

  const heartbeat = { ...fallbackRuntimeStatus.heartbeat, ...(status.heartbeat || {}) };
  const tgbot2 = { ...fallbackRuntimeStatus.tgbot2, ...(status.tgbot2 || {}) };
  const tgbot3 = { ...fallbackRuntimeStatus.tgbot3, ...(status.tgbot3 || {}) };
  const heartbeatAge = Number(heartbeat.ageSeconds);
  const tgbot2Age = Number(tgbot2.ageSeconds);
  const tgbot3Age = Number(tgbot3.ageSeconds);
  const heartbeatOk = Number.isFinite(heartbeatAge) && heartbeatAge <= 120;
  const tgbot2Ok = Number.isFinite(tgbot2Age) && tgbot2Age <= 120;
  const tgbot3Ok = Number.isFinite(tgbot3Age) && tgbot3Age <= 120;
  const hasToken = status.token && Number.isFinite(Number(status.token.totalTokens));

  return [
    {
      id: "telegram-heartbeat",
      label: "蝦咩心跳",
      stateKey: heartbeatOk ? "running" : "watch",
      statusLabel: heartbeatOk ? "正常" : "待確認",
      detail: heartbeatOk ? `心跳 ${heartbeatAge} 秒前，執行中任務 ${formatNumber(heartbeat.activeRequests)}` : "尚未取得新心跳",
      source: "codex_bot_heartbeat"
    },
    {
      id: "tgbot2-heartbeat",
      label: "林孟姿心跳",
      stateKey: tgbot2Ok ? "running" : "watch",
      statusLabel: tgbot2Ok ? "正常" : "待確認",
      detail: tgbot2Ok ? `心跳 ${tgbot2Age} 秒前，執行中任務 ${formatNumber(tgbot2.activeRequests)}` : "尚未取得 TG2 新心跳",
      source: "tg-openai-bot-2/codex_bot_heartbeat.json"
    },
    {
      id: "tgbot2-request",
      label: "林孟姿任務佇列",
      stateKey: tgbot2.statusKey || "watch",
      statusLabel: tgbot2.statusLabel || "待同步",
      detail: tgbot2TaskInstruction(status),
      source: tgbot2.currentTaskSource || "tg-openai-bot-2/telegram_request_status.json"
    },
    {
      id: "tgbot3-heartbeat",
      label: "嵐熙心跳",
      stateKey: tgbot3Ok ? "running" : "watch",
      statusLabel: tgbot3Ok ? "正常" : "待確認",
      detail: tgbot3Ok ? `心跳 ${tgbot3Age} 秒前，執行中任務 ${formatNumber(tgbot3.activeRequests)}` : "尚未取得嵐熙新心跳",
      source: "tg-openai-bot-3/codex_bot_heartbeat.json"
    },
    {
      id: "tgbot3-request",
      label: "嵐熙任務佇列",
      stateKey: tgbot3.statusKey || "watch",
      statusLabel: tgbot3.statusLabel || "待同步",
      detail: tgbot3TaskInstruction(status),
      source: tgbot3.currentTaskSource || "tg-openai-bot-3/telegram_request_status.json"
    },
    {
      id: "telegram-request",
      label: "Telegram 任務佇列",
      stateKey: status.statusKey || "watch",
      statusLabel: status.statusLabel || "待同步",
      detail: status.headline || "等待任務狀態",
      source: "telegram_request_status"
    },
    {
      id: "token-usage",
      label: "Codex token 統計",
      stateKey: hasToken ? "running" : "watch",
      statusLabel: hasToken ? "已讀取" : "未取得",
      detail: hasToken ? `${formatNumber(status.token.totalTokens)} tokens，任務 ${formatNumber(status.token.taskCount)}` : "尚未讀到精確統計",
      source: status.token?.source || "token source"
    },
    {
      id: "runtime-generator",
      label: "狀態產生器",
      stateKey: status.sourceType ? "running" : "watch",
      statusLabel: status.sourceLabel || "備用狀態",
      detail: `更新時間 ${formatDateTime(status.checkedAt || status.updatedAt)}`,
      source: status.sourceType || "fallback"
    },
    {
      id: "pages-snapshot",
      label: "GitHub Pages 快照",
      stateKey: "running",
      statusLabel: "可讀取",
      detail: "runtime-status.json 作為公開頁備援快照",
      source: "GitHub Pages"
    },
    {
      id: "deliverable-check",
      label: "交付結果追蹤",
      stateKey: (status.deliverables || []).length ? "running" : "watch",
      statusLabel: (status.deliverables || []).length ? "有交付項" : "無新交付",
      detail: (status.deliverables || []).length ? status.deliverables.join("、") : "目前沒有新的交付檔案",
      source: "deliverables"
    }
  ];
}

function currentTaskInstruction(status) {
  const telegramMonitor = Array.isArray(status.monitors)
    ? status.monitors.find((item) => item.id === "telegram-request" || item.label === "Telegram 任務佇列")
    : null;
  const candidates = [
    status.currentTaskInstruction,
    status.currentTask,
    status.taskInstruction,
    status.headline,
    telegramMonitor?.detail
  ];
  const value = candidates.find((item) => typeof item === "string" && item.trim());
  return value ? publicText(value) : "目前沒有可顯示的任務指令";
}

function tgbot2TaskInstruction(status) {
  const monitors = Array.isArray(status.monitors) ? status.monitors : [];
  const taskMonitor = monitors.find((item) => {
    const id = String(item.id || "").toLowerCase();
    const label = String(item.label || "");
    return id.includes("tgbot2-request") || label.includes("林孟姿任務") || label.includes("TGBOT2");
  });
  const candidates = [
    status.tgbot2?.currentTaskInstruction,
    status.tgbot2?.taskInstruction,
    status.tgbot2?.headline,
    taskMonitor?.detail
  ];
  const value = candidates.find((item) => typeof item === "string" && item.trim());
  return value ? publicText(value) : "林孟姿 TGBOT2 目前沒有可顯示的任務指令。";
}

async function connectLiveEvents() {
  await refreshLiveEndpointFromConfig();
  if (!liveStatusEndpoint || typeof window.EventSource !== "function") return;
  if (liveEventSource) liveEventSource.close();
  const syncStatus = $("#eventSyncStatus");
  liveEventSource = new EventSource(`${liveStatusEndpoint}/api/events`);
  liveEventSource.addEventListener("open", () => {
    eventStreamOpen = true;
    if (syncStatus) syncStatus.textContent = "即時事件已連線";
    setRefreshFeedback("即時事件同步中；狀態變更會立即更新。", "success");
  });
  liveEventSource.addEventListener("status", (event) => {
    try {
      const data = JSON.parse(event.data);
      renderRuntimeStatus(data);
      lastStatusSignature = runtimeSignature(data);
      setRefreshFeedback(`狀態已即時更新：${formatDateTime(data.checkedAt || data.updatedAt)}`, "success");
    } catch {
      // Ignore malformed transient events and keep the stream alive.
    }
  });
  liveEventSource.addEventListener("action", (event) => {
    try {
      const data = JSON.parse(event.data);
      renderActionHistory(data.history || [], data.queue || []);
    } catch {
      // Keep the current history view.
    }
  });
  liveEventSource.onerror = () => {
    eventStreamOpen = false;
    if (syncStatus) syncStatus.textContent = "事件連線暫停，使用備援同步";
  };
}

function tgbot2TaskSource(status) {
  const monitors = Array.isArray(status.monitors) ? status.monitors : [];
  const taskMonitor = monitors.find((item) => {
    const id = String(item.id || "").toLowerCase();
    const label = String(item.label || "");
    return id.includes("tgbot2-request") || label.includes("林孟姿任務") || label.includes("TGBOT2");
  });
  return publicText(status.tgbot2?.currentTaskSource || taskMonitor?.source || "tg-openai-bot-2");
}

function tgbot3TaskInstruction(status) {
  const monitors = Array.isArray(status.monitors) ? status.monitors : [];
  const taskMonitor = monitors.find((item) => {
    const id = String(item.id || "").toLowerCase();
    const label = String(item.label || "");
    return id.includes("tgbot3-request") || label.includes("TG3 任務") || label.includes("TGBOT3");
  });
  const candidates = [
    status.tgbot3?.currentTaskInstruction,
    status.tgbot3?.taskInstruction,
    status.tgbot3?.headline,
    taskMonitor?.detail
  ];
  const value = candidates.find((item) => typeof item === "string" && item.trim());
  return value ? publicText(value) : "嵐熙目前沒有可顯示的任務指令。";
}

function tgbot3TaskSource(status) {
  const monitors = Array.isArray(status.monitors) ? status.monitors : [];
  const taskMonitor = monitors.find((item) => {
    const id = String(item.id || "").toLowerCase();
    const label = String(item.label || "");
    return id.includes("tgbot3-request") || label.includes("TG3 任務") || label.includes("TGBOT3");
  });
  return publicText(status.tgbot3?.currentTaskSource || taskMonitor?.source || "tg-openai-bot-3");
}

function monitorOwner(item) {
  const id = String(item.id || "").toLowerCase();
  const label = String(item.label || "");
  const statusLabel = String(item.statusLabel || "");
  if (id.includes("tgbot2") || id.includes("mengzi") || label.includes("林孟姿") || label.includes("TGBOT2")) {
    return "mengzi";
  }
  if (id.includes("tgbot3") || id.includes("tg3") || label.includes("TG3") || label.includes("TGBOT3") || label.includes("嵐熙")) {
    return "tg3";
  }
  if (id.includes("telegram") || id.includes("codex-token") || label.includes("蝦咩")) {
    return "shami";
  }
  return "shami";
}

function renderMonitorCards(items, emptyLabel) {
  if (!items.length) {
    return `
      <article class="monitor-card" data-state="watch">
        <div class="monitor-card-top">
          <span>${escapeHtml(emptyLabel)}</span>
          <b>待同步</b>
        </div>
        <p>目前沒有讀到這一列的監控資料。</p>
        <small>runtime-status.json</small>
      </article>
    `;
  }

  return items.map((item) => {
    const tone = statusTone(item.stateKey);
    return `
      <article class="monitor-card" data-state="${escapeHtml(tone)}">
        <div class="monitor-card-top">
          <span>${escapeHtml(publicText(item.label))}</span>
          <b>${escapeHtml(publicText(item.statusLabel))}</b>
        </div>
        <p>${escapeHtml(publicText(item.detail))}</p>
        <small>${escapeHtml(publicText(item.source))}</small>
      </article>
    `;
  }).join("");
}

function renderMonitoring(status) {
  const monitors = buildMonitorItems(status);
  const visibleMonitors = monitors.filter((item) => monitorOwner(item) !== "hidden");
  const shamiMonitors = monitors.filter((item) => monitorOwner(item) === "shami");
  const mengziMonitors = monitors.filter((item) => monitorOwner(item) === "mengzi");
  const tg3Monitors = monitors.filter((item) => monitorOwner(item) === "tg3");
  const shamiCards = renderMonitorCards(shamiMonitors, "蝦咩監控");
  const mengziCards = renderMonitorCards(mengziMonitors, "林孟姿監控");
  const tg3Cards = renderMonitorCards(tg3Monitors, "嵐熙監控");
  const allCards = renderMonitorCards(visibleMonitors, "監控項目");

  const shamiCompact = $("#shamiMonitorGrid");
  if (shamiCompact) shamiCompact.innerHTML = shamiCards;
  const mengziCompact = $("#mengziMonitorGrid");
  if (mengziCompact) mengziCompact.innerHTML = mengziCards;
  const tg3Compact = $("#tg3MonitorGrid");
  if (tg3Compact) tg3Compact.innerHTML = tg3Cards;
  const shamiDetail = $("#shamiMonitorSectionGrid");
  if (shamiDetail) shamiDetail.innerHTML = shamiCards;
  const mengziDetail = $("#mengziMonitorSectionGrid");
  if (mengziDetail) mengziDetail.innerHTML = mengziCards;
  const tg3Detail = $("#tg3MonitorSectionGrid");
  if (tg3Detail) tg3Detail.innerHTML = tg3Cards;

  const compact = $("#monitorGrid");
  if (compact) compact.innerHTML = allCards;
  const detail = $("#monitorSectionGrid");
  if (detail) detail.innerHTML = allCards;
}

function renderAgentStrip(status) {
  const heartbeat = { ...fallbackRuntimeStatus.heartbeat, ...(status.heartbeat || {}) };
  const tgbot2 = { ...fallbackRuntimeStatus.tgbot2, ...(status.tgbot2 || {}) };
  const tgbot3 = { ...fallbackRuntimeStatus.tgbot3, ...(status.tgbot3 || {}) };
  const heartbeatAge = Number.isFinite(Number(heartbeat.ageSeconds))
    ? `${Math.max(0, Number(heartbeat.ageSeconds))} 秒前`
    : formatAge(status.checkedAt || status.updatedAt);
  const tgbot2Age = Number.isFinite(Number(tgbot2.ageSeconds))
    ? `${Math.max(0, Number(tgbot2.ageSeconds))} 秒前`
    : formatAge(status.checkedAt || status.updatedAt);
  const tgbot3Age = Number.isFinite(Number(tgbot3.ageSeconds))
    ? `${Math.max(0, Number(tgbot3.ageSeconds))} 秒前`
    : formatAge(status.checkedAt || status.updatedAt);
  const heartbeatMeta = `心跳 ${heartbeatAge} · 執行中任務 ${formatNumber(heartbeat.activeRequests)}`;
  const tgbot2Meta = `心跳 ${tgbot2Age} · 執行中任務 ${formatNumber(tgbot2.activeRequests)}`;
  const tgbot3Meta = `心跳 ${tgbot3Age} · 執行中任務 ${formatNumber(tgbot3.activeRequests)}`;

  const agents = [
    {
      kind: "mengzi",
      avatar: "assets/mengzi-avatar.png",
      role: "TGBOT2",
      name: tgbot2.name || MENGZI_BOT_NAME,
      state: publicText(tgbot2.statusLabel) || "資料待同步",
      stateKey: statusTone(tgbot2.statusKey || "watch"),
      metaLabel: "當前任務指令",
      meta: tgbot2TaskInstruction(status),
      detail: tgbot2Meta
    },
    {
      kind: "tg3",
      avatar: "assets/lanxi-avatar.png",
      role: "TGBOT3",
      name: tgbot3.name || TG3_BOT_NAME,
      state: publicText(tgbot3.statusLabel) || "資料待同步",
      stateKey: statusTone(tgbot3.statusKey || "watch"),
      metaLabel: "當前任務指令",
      meta: tgbot3TaskInstruction(status),
      detail: tgbot3Meta
    },
    {
      kind: "shami",
      avatar: "assets/shami-avatar.png",
      role: "TGBOT",
      name: heartbeat.name || "蝦咩",
      state: status.statusLabel || "資料待同步",
      stateKey: statusTone(status.statusKey || "watch"),
      metaLabel: "當前任務指令",
      meta: currentTaskInstruction(status),
      detail: heartbeatMeta
    }
  ];

  const agentCard = (agent) => `
    <article class="agent-card ${escapeHtml(agent.kind)}-agent-card" data-state="${escapeHtml(agent.stateKey)}">
      <div class="agent-top">
        ${agent.avatar
          ? `<img class="agent-card-avatar" src="${escapeHtml(agent.avatar)}" alt="${escapeHtml(agent.name)} AI 助手圖片">`
          : `<span class="agent-card-avatar agent-avatar-fallback">${escapeHtml(agent.avatarFallback || agent.name?.[0] || "AI")}</span>`}
        <div class="agent-name">
          <b>${escapeHtml(agent.name)}</b>
        </div>
        <span class="agent-state">${escapeHtml(agent.state)}</span>
      </div>
      <div class="agent-task">
        <span>${escapeHtml(agent.metaLabel)}</span>
        <b>${escapeHtml(agent.meta)}</b>
      </div>
      <div class="agent-meta">${escapeHtml(agent.detail)}</div>
    </article>
  `;

  const shamiSlot = $("#shamiAgent");
  const mengziSlot = $("#mengziAgent");
  const tg3Slot = $("#tg3Agent");
  if (shamiSlot) shamiSlot.innerHTML = agentCard(agents.find((agent) => agent.kind === "shami"));
  if (mengziSlot) mengziSlot.innerHTML = agentCard(agents.find((agent) => agent.kind === "mengzi"));
  if (tg3Slot) tg3Slot.innerHTML = agentCard(agents.find((agent) => agent.kind === "tg3"));
  if (shamiSlot || mengziSlot || tg3Slot) return;

  const strip = $("#agentStrip");
  if (!strip) return;
  strip.innerHTML = agents.map(agentCard).join("");
}

function renderRuntimeStatus(data) {
  const status = { ...fallbackRuntimeStatus, ...data };
  status.token = { ...fallbackRuntimeStatus.token, ...(status.token || {}) };
  status.heartbeat = { ...fallbackRuntimeStatus.heartbeat, ...(status.heartbeat || {}) };
  status.tgbot2 = { ...fallbackRuntimeStatus.tgbot2, ...(status.tgbot2 || {}) };
  status.tgbot3 = { ...fallbackRuntimeStatus.tgbot3, ...(status.tgbot3 || {}) };
  status.tgbot3.name = TG3_BOT_NAME;
  status.refreshSeconds = refreshSecondsFrom(status);
  const deliverables = Array.isArray(status.deliverables) ? status.deliverables : [];
  const sourceLabel = status.sourceLabel || (status.sourceType === "live-api" ? "本機即時 API" : "公開快照");
  const displayTime = status.checkedAt || status.updatedAt || new Date().toISOString();

  lastRenderedStatus = status;

  $("#statePill").dataset.state = statusTone(status.statusKey || "watch");
  $("#statePill").textContent = status.statusLabel || "資料待同步";
  $("#statusLabel").textContent = status.statusLabel || "資料待同步";
  $("#statusHeadline").textContent = publicText(status.headline) || "目前沒有可顯示的狀態。";
  setTextIfPresent("#currentTaskText", currentTaskInstruction(status));
  $("#todayTokens").textContent = formatNumber(status.token.totalTokens);
  $("#tokenSource").textContent = status.token.taskCount
    ? `${status.token.source}，任務數 ${formatNumber(status.token.taskCount)}。`
    : status.token.source || "未取得 token 統計來源。";
  setTextIfPresent("#tgbot2StatusLabel", status.tgbot2.statusLabel || "狀態待同步");
  setTextIfPresent("#tgbot2StatusDetail", `${status.tgbot2.name || MENGZI_BOT_NAME} TGBOT2；心跳 ${formatNumber(status.tgbot2.ageSeconds)} 秒前，執行中任務 ${formatNumber(status.tgbot2.activeRequests)}。`);
  setTextIfPresent("#tgbot2TaskText", tgbot2TaskInstruction(status));
  setTextIfPresent("#tgbot2TaskSource", tgbot2TaskSource(status));
  setTextIfPresent("#tgbot3StatusLabel", status.tgbot3.statusLabel || "狀態待同步");
  setTextIfPresent("#tgbot3StatusDetail", `${status.tgbot3.name || TG3_BOT_NAME} TGBOT3；心跳 ${formatNumber(status.tgbot3.ageSeconds)} 秒前，執行中任務 ${formatNumber(status.tgbot3.activeRequests)}。`);
  setTextIfPresent("#tgbot3TaskText", tgbot3TaskInstruction(status));
  setTextIfPresent("#tgbot3TaskSource", tgbot3TaskSource(status));
  $("#blockerText").textContent = status.blocker || "沒有卡點";
  $("#nextAction").textContent = status.nextAction || "維持同步。";
  $("#updatedAt").textContent = formatDateTime(displayTime);
  $("#refreshNote").textContent = `每 ${status.refreshSeconds} 秒自動讀取；來源：${sourceLabel}。`;
  $("#deliverableList").innerHTML = deliverables.length
    ? deliverables.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
    : "<span>目前沒有新的交付檔案</span>";
  renderAiEnhancements(status, displayTime);
  renderActiveTaskPanel(status);
  renderAgentStrip(status);
  renderMonitoring(status);
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
    sourceType: data.sourceType || "snapshot",
    sourceLabel: data.sourceLabel || "GitHub Pages 公開快照"
  };
}

function runtimeSignature(status) {
  return [
    status.sourceType || "",
    status.updatedAt || "",
    status.checkedAt || "",
    status.statusKey || "",
    status.statusLabel || "",
    status.currentTaskInstruction || "",
    status.headline || "",
    (status.monitors || []).map((item) => `${item.id || item.label}:${item.statusLabel}:${item.detail}:${item.source}`).join(",")
  ].join("|");
}

async function loadRuntimeStatus(options = {}) {
  const isManual = Boolean(options.manual);
  if (isStatusLoading) {
    if (isManual) {
      playRefreshSound();
      triggerRefreshEffect();
      setRefreshFeedback("正在重新同步最新狀態，完成後畫面會更新。", "idle");
    }
    return;
  }

  isStatusLoading = true;
  if (isManual) {
    playRefreshSound();
    triggerRefreshEffect();
    setRefreshButtonLoading(true);
    setRefreshFeedback("正在同步最新狀態...", "idle");
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
        setRefreshFeedback(`已同步到最新狀態：${formatted}`, "success");
      } else {
        setRefreshFeedback(`已讀取公開快照：${formatted}`, "success");
      }
    } else if (signature !== lastStatusSignature) {
      setRefreshFeedback(`狀態已更新：${formatted}`, "success");
    }
    lastStatusSignature = signature;
  } catch {
    renderRuntimeStatus(fallbackRuntimeStatus);
    if (isManual) setRefreshFeedback("目前讀不到狀態快照，請稍後再試。", "blocked");
  } finally {
    isStatusLoading = false;
    if (isManual) {
      setRefreshButtonLoading(false);
      window.setTimeout(() => setRefreshFeedback("每 1 秒自動讀取狀態。", "idle"), 3600);
    }
  }
}

function scheduleStatusRefresh() {
  loadRuntimeStatus().then(connectLiveEvents);
  loadActionHistory();
  window.setInterval(() => {
    if (!eventStreamOpen) loadRuntimeStatus();
  }, 30000);
}

function bindInteractions() {
  bindAgentViewSwitch();

  const refreshButton = $("#refreshStatus");
  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      await loadRuntimeStatus({ manual: true });
      await loadActionHistory();
      if (!eventStreamOpen) connectLiveEvents();
    });
  }

  const unlockButton = $("#unlockControls");
  if (unlockButton) unlockButton.addEventListener("click", unlockDashboardControls);
  const controlCode = $("#controlCode");
  if (controlCode) controlCode.addEventListener("keydown", (event) => {
    if (event.key === "Enter") unlockDashboardControls();
  });
  setControlLockState(Boolean(controlSessionToken), controlSessionToken ? "控制權限等待伺服器驗證" : "控制功能已鎖定");

  document.querySelectorAll("[data-dashboard-action]").forEach((button) => {
    button.addEventListener("click", () => runDashboardAction(button.dataset.dashboardAction, button.dataset.actionTarget || ""));
  });

  const themeToggle = $("#themeToggle");
  if (themeToggle) {
    const savedTheme = window.localStorage.getItem("ownerDashboardTheme");
    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
      themeToggle.setAttribute("aria-pressed", "true");
    }
    themeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-mode");
      themeToggle.setAttribute("aria-pressed", String(isLight));
      window.localStorage.setItem("ownerDashboardTheme", isLight ? "light" : "dark");
    });
  }

  const search = $("#skillSearch");
  if (search) {
    search.addEventListener("input", (event) => {
      skillSearchTerm = event.target.value;
      renderSkills();
    });
  }
}

function setAgentView(view, options = {}) {
  const nextView = ["tg3", "mengzi", "shami"].includes(view) ? view : "shami";
  selectedAgentView = nextView;
  document.body.dataset.agentView = nextView;

  const dashboard = $("#status-dashboard");
  if (dashboard) dashboard.dataset.agentView = nextView;

  document.querySelectorAll("[data-agent-view-button]").forEach((button) => {
    const isActive = button.dataset.agentViewButton === nextView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("aria-pressed", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  renderActiveTaskPanel(lastRenderedStatus);
  updateActionTargetLabels();
  if (options.persist === false) return;
  try {
    window.localStorage.setItem(AGENT_VIEW_STORAGE_KEY, nextView);
  } catch {
    // Local storage is optional; the switch still works for the current page.
  }
}

function bindAgentViewSwitch() {
  const buttons = Array.from(document.querySelectorAll("[data-agent-view-button]"));
  if (!buttons.length) return;

  let savedView = selectedAgentView;
  try {
    savedView = window.localStorage.getItem(AGENT_VIEW_STORAGE_KEY) || selectedAgentView;
  } catch {
    savedView = selectedAgentView;
  }
  setAgentView(savedView, { persist: false });

  buttons.forEach((button) => {
    button.addEventListener("click", () => setAgentView(button.dataset.agentViewButton));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const order = ["shami", "mengzi", "tg3"];
      const currentIndex = Math.max(0, order.indexOf(selectedAgentView));
      let nextView = selectedAgentView;
      if (event.key === "Home") nextView = "shami";
      if (event.key === "End") nextView = "tg3";
      if (event.key === "ArrowLeft") nextView = order[Math.max(0, currentIndex - 1)];
      if (event.key === "ArrowRight") nextView = order[Math.min(order.length - 1, currentIndex + 1)];
      setAgentView(nextView);
      const nextButton = buttons.find((item) => item.dataset.agentViewButton === nextView);
      if (nextButton) nextButton.focus();
    });
  });
}

function setTextIfPresent(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function renderAiEnhancements(status, displayTime) {
  const heartbeatAge = Number(status.heartbeat?.ageSeconds);
  const tgbot2Age = Number(status.tgbot2?.ageSeconds);
  const tgbot3Age = Number(status.tgbot3?.ageSeconds);
  const hasFreshHeartbeat = Number.isFinite(heartbeatAge) && heartbeatAge <= 120;
  const hasFreshTgbot2Heartbeat = Number.isFinite(tgbot2Age) && tgbot2Age <= 120;
  const hasFreshTgbot3Heartbeat = Number.isFinite(tgbot3Age) && tgbot3Age <= 120;
  const isBlocked = statusTone(status.statusKey || "") === "blocked" || Boolean(status.blocker && !String(status.blocker).includes("沒有"));
  const energy = Math.max(18, Math.min(98, 30 + (hasFreshHeartbeat ? 18 : 0) + (hasFreshTgbot2Heartbeat ? 14 : 0) + (hasFreshTgbot3Heartbeat ? 14 : 0) + (!isBlocked ? 12 : -18)));
  const energyRing = $("#energyRing");

  setTextIfPresent("#chipShamiStatus", status.statusLabel || "同步中");
  setTextIfPresent("#chipMengziStatus", status.tgbot2?.statusLabel || "同步中");
  setTextIfPresent("#chipTg3Status", status.tgbot3?.statusLabel || "同步中");
  setTextIfPresent("#chipCurrentTask", currentTaskInstruction(status));
  setTextIfPresent("#chipMengziTask", tgbot2TaskInstruction(status));
  setTextIfPresent("#chipTg3Task", tgbot3TaskInstruction(status));
  setTextIfPresent("#chipUpdatedAt", formatDateTime(displayTime));
  setTextIfPresent("#energyValue", `${energy}%`);
  setTextIfPresent("#energyLabel", energy >= 80 ? "高活躍運作" : energy >= 60 ? "穩定運作" : energy >= 40 ? "觀察中" : "需要確認");

  if (energyRing) energyRing.style.setProperty("--energy", String(energy));
}

function init() {
  renderStats();
  renderCompleted();
  renderSop();
  renderSkills();
  renderTimeline();
  renderRuntimeStatus(fallbackRuntimeStatus);
  bindInteractions();
  updateLiveClock();
  window.setInterval(updateLiveClock, 1000);
  scheduleStatusRefresh();
}

document.addEventListener("DOMContentLoaded", init);
