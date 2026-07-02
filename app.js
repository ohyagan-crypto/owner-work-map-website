const stats = [
  { label: "技能資料夾", value: 80, note: "含主力版與日期備份版" },
  { label: "不重複技能", value: 44, note: "依 SKILL.md name 統計" },
  { label: "記憶檔", value: 88, note: "含規則、成功流程與工作偏好" },
  { label: "主要工作線", value: 12, note: "網站、圖片、影片、NBS、交付、自動化等" }
];

const completedWork = [
  {
    title: "Telegram 回覆與交付規則",
    category: "telegram",
    status: "done",
    summary: "已建立原聊天室回傳、文件模式交付、禁止 raw log / token / cookie、固定回覆限制、問題先答結論等規則。",
    points: ["交付檔案必須回原 Telegram 對話", "只輸出乾淨繁體中文", "一般回覆可自然使用柔和 emoji"]
  },
  {
    title: "IMS / Lanxin 做圖流程",
    category: "image",
    status: "done",
    summary: "已建立 Lanxin AI-only 圖片與海報流程，包含多素材逐張分析、合併教學圖、確認清單、下載原圖與 Telegram 文件回傳。",
    points: ["最新 IMS 已支援多素材說明圖", "舊 imagegen 已被規則鎖定停用", "扣積分前要先確認"]
  },
  {
    title: "教學步驟圖成功流程",
    category: "image",
    status: "done",
    summary: "已記住完整批次 SOP 圖流程：先規劃步數，一次生成整組，驗證文字與紅框，再交付 PNG 與 ZIP。",
    points: ["BotFather 8 圖作為品質基準", "登入平台 5 圖修正版作為修正基準", "要提高速度並減少等待"]
  },
  {
    title: "NBS / NotebookLM 工作流",
    category: "nbs",
    status: "done",
    summary: "已建立 NotebookLM 簡報、影片摘要、音訊摘要、來源包整理與提示詞建構技能。",
    points: ["nbs 是統一入口", "nbps / nbvs 是舊別名", "可輸出簡報、摘要、音訊素材"]
  },
  {
    title: "ACS / 剪映對標剪輯",
    category: "video",
    status: "done",
    summary: "已建立剪映專業版、CapCut/Jianying 對標剪輯與短影片複製流程，包含截圖驗證與逐步操作模式。",
    points: ["acs 是完整剪輯自動化", "acs2 是簡化對標短影片複製", "遇登入或 UI 卡點需立即回報"]
  },
  {
    title: "Dreamina / SD 影片生成",
    category: "video",
    status: "done",
    summary: "已建立即夢 Dreamina CLI 與 SD/SDF/SDV 影片生成流程，包含提示詞、查積分、送出、輪詢、下載與交付。",
    points: ["保留主人原始提示", "完成後下載影片", "需要計算積分成本時可用公式換算"]
  },
  {
    title: "CLS / Claude 前置分析",
    category: "analysis",
    status: "done",
    summary: "已建立需要劇本、拍攝計畫、分鏡、影片腳本與 Dreamina 前置分析時，先走聚合平台 Claude 4.8+ 的流程。",
    points: ["用於高品質前置規劃", "先分析再確認", "避免直接生成粗糙成果"]
  },
  {
    title: "網站 WBS 與 GitHub Pages",
    category: "website",
    status: "done",
    summary: "已建立網站建置、驗證與預設公開部署流程，靜態網站優先走 GitHub Pages。",
    points: ["先完成檔案驗證再部署", "GitHub Pages 憑證採加密流程", "部署失敗也要保留可用版本"]
  },
  {
    title: "Codex / OpenClaw 交接與打包",
    category: "handoff",
    status: "done",
    summary: "已建立技能、記憶、工作流交接包規則，要求包含安裝、觸發詞、測試、禁止事項與交付說明。",
    points: ["所有包名必須加日期", "不包含帳密與 token", "只有主人明確要打包才主動傳內部包"]
  },
  {
    title: "OpenClaw 記憶匯入",
    category: "automation",
    status: "done",
    summary: "OpenClaw 延續資料已匯入本機 Codex 記憶，可用於舊偏好、工作流、網站、NBS、Dreamina 與 Telegram 行為查詢。",
    points: ["入口是 openclaw_imported.memory.md", "技能包含瀏覽器與桌面控制", "不主動使用 openclaw CLI"]
  },
  {
    title: "LINE 官方客服學習",
    category: "support",
    status: "done",
    summary: "已從 MoreFun / 魔方客服前 30 筆可見對話萃取安全回覆模式，保留類型與話術，不保留客戶私密資料。",
    points: ["先答結論再給下一步", "高風險退款、私鑰、破解類需問主人", "不自動替主人送 LINE 訊息"]
  },
  {
    title: "語音、轉錄、PDF、截圖輔助",
    category: "utility",
    status: "done",
    summary: "已建立 speech、transcribe、pdf、screenshot、playwright 等支援技能，讓文件、音訊、瀏覽器與桌面操作可被流程化。",
    points: ["截圖也是 Telegram 交付物", "PDF 要看版面時需渲染檢查", "瀏覽器操作優先用可驗證工具"]
  }
];

const progressTrackingUrl = "https://ohyagan-crypto.github.io/owner-work-map-website/#live-progress";
const ownerProgressPrompt = "請即時同步我跟你的作業進度：處理任務時要把目前任務、完成百分比、下一步或卡點、交付網址/本機路徑更新到公開工作地圖，完成後回覆公開網址；Telegram 回覆要先講結論，再補原因、具體做法與必要注意事項，不要只說收到或處理中。";
const telegramProgressShareUrl = `https://t.me/share/url?url=${encodeURIComponent(progressTrackingUrl)}&text=${encodeURIComponent(ownerProgressPrompt)}`;

const inProgress = [
  {
    title: "即時同步我跟你的作業進度",
    category: "telegram",
    status: "watch",
    summary: "這個追蹤點用來固定提醒：網站與 Telegram 要同步顯示目前任務、完成度、下一步、交付網址或真實卡點。",
    points: ["點「打開 Telegram」可帶著預寫文字回到 Telegram", "每次更新 progress.json 與公開頁面後再回報", "避免只回收到、處理中或沒有答案的等待訊息"],
    prompt: ownerProgressPrompt,
    actions: [
      { label: "打開 Telegram", url: telegramProgressShareUrl, external: true },
      { label: "同步面板", url: "#live-progress" }
    ]
  },
  {
    title: "完整複製 Codex / OpenClaw 的無私密交接包",
    category: "handoff",
    status: "watch",
    summary: "上一個訊息已提出要做一個「另一個你」的完整包，但最新指令改成先做網站；目前可列為下一步正式打包項。",
    points: ["需排除帳密、token、cookie、瀏覽器 profile", "要包含技能、記憶、AGENTS 規則與安裝教學", "包名必須含 20260702 或建立當天日期"]
  },
  {
    title: "技能資料夾重複版本整理",
    category: "maintenance",
    status: "watch",
    summary: "目前有 80 個技能資料夾、44 個不重複技能名稱，代表許多日期版是歷史備份；功能可用，但索引會變長。",
    points: ["保留主力版", "標記舊版", "未經主人確認不刪除"]
  },
  {
    title: "OpenClaw 匯入索引 refresh",
    category: "automation",
    status: "watch",
    summary: "OpenClaw 記憶已匯入，但 imported index 內部檔案列表顯示為 $rel，適合之後重建一次乾淨索引。",
    points: ["不影響已匯入入口記憶", "會影響人工查找速度", "重建時仍要過濾秘密"]
  },
  {
    title: "Lanxin / 聚合平台例行狀態檢查",
    category: "image",
    status: "watch",
    summary: "已設定固定憑證來源與固定 browser profile，但例行檢查若失敗，仍需先檢查排程、狀態檔與頁面現況。",
    points: ["不能只回報腳本錯誤", "要修復可恢復原因", "真正卡點才回主人"]
  },
  {
    title: "GitHub Pages 新站部署驗證",
    category: "website",
    status: "watch",
    summary: "本網站要先完成檔案驗證，再依偏好公開部署；若 GitHub 建 repo 或 Pages API 卡住，仍要保留可用版本。",
    points: ["部署憑證採加密保存", "需避免提交無關檔案", "部署 URL 要等 Pages 回應確認"]
  },
  {
    title: "知識網站自動更新化",
    category: "website",
    status: "watch",
    summary: "這版是整理快照；未來可讓網站自動讀取安全摘要，定期重產技能表與待辦。",
    points: ["需要建立安全資料匯出腳本", "不能暴露 raw logs 或 secrets", "可做成每日快照"]
  }
];

const roadmap = [
  { horizon: "立刻", title: "把總控台公開部署", body: "讓主人手機直接看工作地圖、技能表、待辦與規劃，不用翻 Telegram 歷史訊息。", ownerValue: "查詢快" },
  { horizon: "短期", title: "做無私密 Codex / OpenClaw 複製包", body: "把技能、記憶、回覆規則與安裝教學打成一包，讓另一台 Codex / OC 一次學會。", ownerValue: "可複製" },
  { horizon: "短期", title: "技能主力版與歷史版分流", body: "建立技能版本索引：主力、備份、停用、舊別名，避免新 agent 誤用舊版。", ownerValue: "少混亂" },
  { horizon: "中期", title: "任務型 SOP 圖書館", body: "把 IMS、NBS、WBS、ACS、Dreamina、Telegram 回傳、GitHub 部署做成可點選 SOP。", ownerValue: "少教學" },
  { horizon: "中期", title: "平台健康儀表板", body: "整合 Lanxin 登入、GitHub 部署、Telegram 交付、檔案備份位置與排程狀態。", ownerValue: "少卡點" },
  { horizon: "中期", title: "內容生產流水線", body: "把 Claude 分析、Dreamina 影片、剪映剪輯、Lanxin 海報、NBS 簡報串成固定產品流程。", ownerValue: "可量產" },
  { horizon: "長期", title: "客戶 Bot 模板化", body: "把客服、網站、教學、圖片與影片能力打成新客戶 bot 基底，可快速複製給不同業務。", ownerValue: "可販售" },
  { horizon: "長期", title: "主人知識作業系統", body: "所有技能、記憶、網站、包裝、SOP、成本、案例與成功流程都有版本、搜尋與交付紀錄。", ownerValue: "可管理" }
];

const todos = [
  {
    title: "高優先",
    items: [
      "完成本網站檔案驗證與交付",
      "嘗試 GitHub Pages 公開部署並回報 URL",
      "若主人仍要，接著做無私密完整複製包"
    ]
  },
  {
    title: "中優先",
    items: [
      "重建 OpenClaw 匯入索引，修正 $rel 顯示",
      "整理技能主力版、備份版與停用版標籤",
      "把網站資料改成可由索引自動更新"
    ]
  },
  {
    title: "低優先",
    items: [
      "建立每月課程網站更新提醒",
      "把成本換算器放進工作網站",
      "把客服安全話術做成可搜尋模板"
    ]
  }
];

const skillPackages = [
  ["acs", "video", "剪映自動剪輯、對標剪輯、CapCut/Jianying 組裝、字幕、匯出與驗證。", "主力", "2026-06-19"],
  ["acs2", "video", "簡化版短影片對標複製流程，聚焦參考影片拆解與剪映重作。", "主力", "2026-06-19"],
  ["acs2_20260619_234146", "video", "acs2 歷史備份版。", "備份", "2026-06-19"],
  ["acs2_20260619_235528", "video", "acs2 歷史備份版。", "備份", "2026-06-19"],
  ["acs_20260619_234146", "video", "acs 歷史備份版。", "備份", "2026-06-19"],
  ["acs_20260619_235158", "video", "acs 歷史備份版。", "備份", "2026-06-19"],
  ["acs_20260619_235528", "video", "acs 歷史備份版。", "備份", "2026-06-19"],
  ["ans", "video", "微信小程式 AI 影片／數字人影片建立、下載、驗證、改名與 Telegram 回傳。", "主力", "2026-06-19"],
  ["ans_20260619_235528", "video", "ans 歷史備份版。", "備份", "2026-06-19"],
  ["auto-reasoning-router", "system", "依任務複雜度選擇推理強度，將日常問答與多步驟工作分流。", "主力", "2026-06-25"],
  ["character-memory-manager", "memory", "管理固定角色記憶，如人物外觀、聲音、服裝、個性與負面限制。", "主力", "2026-06-19"],
  ["character-memory-manager_20260619_234146", "memory", "角色記憶管理歷史備份版。", "備份", "2026-06-19"],
  ["character-memory-manager_20260619_235528", "memory", "角色記憶管理歷史備份版。", "備份", "2026-06-19"],
  ["cls", "analysis", "使用聚合平台 Claude 4.8+ 做劇本、分鏡、影片、SD/Dreamina 前置分析。", "主力", "2026-06-27"],
  ["codex-skill-handoff", "handoff", "把技能、記憶、工作流交接給其他 Codex / OpenClaw / Telegram bot。", "主力", "2026-07-02"],
  ["codex-skill-handoff_20260619_234146", "handoff", "交接技能歷史備份版。", "備份", "2026-06-19"],
  ["codex-skill-handoff_20260619_235528", "handoff", "交接技能歷史備份版。", "備份", "2026-06-19"],
  ["codex-skill-handoff_20260620_002546", "handoff", "交接技能歷史備份版。", "備份", "2026-06-20"],
  ["codex-zuotu-lanxin", "image", "Lanxin / 聚合平台專用做圖技能：確認、生成、下載原圖、Telegram 文件回傳。", "主力", "2026-06-24"],
  ["codex-zuotu-lanxin_20260624_182741", "image", "Lanxin 做圖技能歷史備份版，明確禁止本機替代工具。", "備份", "2026-06-24"],
  ["dreamina-cli", "video", "即夢 Dreamina CLI 生成 SD / SDF / SDV 影片。", "主力", "2026-06-15"],
  ["dreamina-cli_20260619_235528", "video", "Dreamina CLI 歷史備份版。", "備份", "2026-06-19"],
  ["dreamina-sd-video-workflow", "video", "Dreamina 影片提示、查積分、送出、輪詢、下載與交付流程。", "主力", "2026-06-26"],
  ["find-skill", "system", "搜尋並安裝 Claude Code 技能。", "主力", "2026-06-19"],
  ["github-pages-deploy", "website", "靜態網站 GitHub Pages 建 repo、推送、啟用 Pages、驗證公開 URL。", "主力", "2026-06-19"],
  ["hyperframes", "video", "HTML 影片合成、動畫、字幕、旁白、音訊反應視覺與轉場。", "主力", "2026-06-19"],
  ["imagegen", "image", "舊內建 imagegen 停用入口；圖片任務改走 Lanxin。", "停用", "2026-06-30"],
  ["imagegen-poster-telegram", "image", "舊海報 imagegen 停用入口；圖片任務改走 Lanxin。", "停用", "2026-06-30"],
  ["imagegen-poster-telegram_20260619_235528", "image", "舊 imagegen 海報流程備份，已停用。", "停用", "2026-06-30"],
  ["imagegen-poster-telegram_20260620_002546", "image", "舊 imagegen 海報流程備份，已停用。", "停用", "2026-06-30"],
  ["imagegen_20260620_002546", "image", "舊 imagegen 備份，已停用。", "停用", "2026-06-30"],
  ["imagegen_new", "image", "舊 imagegen 新版嘗試，已停用並改走 Lanxin。", "停用", "2026-06-30"],
  ["ims", "image", "最新圖片／海報／視覺設計流程，含多素材分析、SOP 圖、回傳與卡點回報。", "主力", "2026-07-01"],
  ["ims_20260626_132041", "image", "IMS 歷史備份版。", "備份", "2026-06-26"],
  ["ims_20260626_132942", "image", "IMS 歷史備份版。", "備份", "2026-06-26"],
  ["ims_20260626_134301", "image", "IMS 歷史備份版。", "備份", "2026-06-26"],
  ["ims_20260626_153459", "image", "IMS 歷史備份版。", "備份", "2026-06-26"],
  ["lanxin-image-workflow", "image", "Lanxin 圖片生成、VIP/積分檢查、提交、原圖下載與交付。", "主力", "2026-06-19"],
  ["mininew-bridge-handoff", "handoff", "MiniNew Telegram Codex bridge 交接與新 bot 環境建立。", "主力", "2026-06-19"],
  ["mininew-bridge-handoff_20260620_002546", "handoff", "MiniNew bridge 交接歷史備份版。", "備份", "2026-06-20"],
  ["monthly-course-site-updater", "website", "藍星 AI 每月課程報名／簽到網站更新與重新部署。", "主力", "2026-06-19"],
  ["nbps", "nbs", "NotebookLM 音訊摘要舊別名；應改用 nbs。", "舊別名", "2026-06-19"],
  ["nbs", "nbs", "NotebookLM 統一入口：簡報、影片摘要、音訊摘要、來源整理。", "主力", "2026-06-19"],
  ["nbs-media-summary-pack", "nbs", "NBS 影片摘要與音訊摘要交接包教學。", "主力", "2026-06-19"],
  ["nbs-media-summary-pack_20260620_002546", "nbs", "NBS 媒體摘要交接包備份版。", "備份", "2026-06-20"],
  ["nbs-skill", "nbs", "NotebookLM 簡報／deck 工作流與接收端安裝教學。", "主力", "2026-06-19"],
  ["nbs-skill_20260620_002546", "nbs", "NBS 技能歷史備份版。", "備份", "2026-06-20"],
  ["nbs_20260620_002546", "nbs", "NBS 歷史備份版。", "備份", "2026-06-20"],
  ["nbvs", "nbs", "NotebookLM 影片摘要舊別名；應改用 nbs。", "舊別名", "2026-06-19"],
  ["new-customer-bot-base", "handoff", "新客戶 bot 基底、記憶／技能轉移與套用交接文件。", "主力", "2026-06-19"],
  ["nms-digital-human", "video", "數字人、AI 網紅、聲音／腳本／圖片／影片生成與小程式流程。", "主力", "2026-06-19"],
  ["notebooklm-brief-to-deck-workflow", "nbs", "把題目或來源轉成 NotebookLM 簡報，下載 PPTX/PDF 並回傳。", "主力", "2026-06-08"],
  ["notebooklm-brief-to-deck-workflow_20260619_235528", "nbs", "NotebookLM 簡報流程備份版。", "備份", "2026-06-19"],
  ["notebooklm-brief-to-deck-workflow_20260620_002546", "nbs", "NotebookLM 簡報流程備份版。", "備份", "2026-06-20"],
  ["notebooklm-presentation-prompt", "nbs", "建立 NotebookLM 簡報提示詞與投影片生成指令包。", "主力", "2026-06-08"],
  ["notebooklm-presentation-prompt_20260619_235528", "nbs", "NotebookLM 簡報提示詞備份版。", "備份", "2026-06-19"],
  ["notebooklm-presentation-prompt_20260620_002546", "nbs", "NotebookLM 簡報提示詞備份版。", "備份", "2026-06-20"],
  ["notebooklm-source-builder", "nbs", "把雜亂筆記、逐字稿、PDF、課程材料整理成 NotebookLM 可讀來源包。", "主力", "2026-06-08"],
  ["notebooklm-source-builder_20260619_235528", "nbs", "NotebookLM 來源包建構備份版。", "備份", "2026-06-19"],
  ["notebooklm-source-builder_20260620_002546", "nbs", "NotebookLM 來源包建構備份版。", "備份", "2026-06-20"],
  ["notion-knowledge-capture", "system", "把對話與決策整理到 Notion 結構化頁面。", "主力", "2026-06-19"],
  ["openclaw-browser-automation", "automation", "OpenClaw 瀏覽器自動化規則匯入，轉用 Codex 可用瀏覽器工具。", "主力", "2026-06-19"],
  ["openclaw-desktop-control", "automation", "OpenClaw 桌面控制規則匯入，僅在明確需要且安全時使用。", "主力", "2026-06-19"],
  ["operator-principles", "system", "操作者回覆節奏、中文回報與避免重複發送的工作原則。", "主力", "2026-06-19"],
  ["pdf", "utility", "PDF 讀取、建立、審查與版面渲染檢查。", "主力", "2026-06-19"],
  ["playwright", "automation", "真實瀏覽器自動化、表單、截圖、資料抽取與 UI flow 驗證。", "主力", "2026-06-19"],
  ["playwright-interactive", "automation", "持久瀏覽器／Electron 互動，用於快速 UI 偵錯。", "主力", "2026-06-19"],
  ["screenshot", "utility", "桌面、視窗、區域截圖與 OS 層級 capture。", "主力", "2026-06-19"],
  ["SKILL", "image", "中文做圖入口：Lanxin 生成、確認清單、原圖下載與文件回傳。", "主力", "2026-06-24"],
  ["speech", "utility", "文字轉語音、旁白與批次語音產出。", "主力", "2026-06-19"],
  ["speech_20260620_002546", "utility", "語音技能歷史備份版。", "備份", "2026-06-20"],
  ["teaching-step-images", "image", "教學步驟圖、SOP 分鏡、手機操作教學圖、紅框步驟圖。", "主力", "2026-06-30"],
  ["telegram-bot-manager", "telegram", "Telegram bot 工作流、檔案回傳、媒體發送、轉錄與自動化規則。", "主力", "2026-06-19"],
  ["telegram-bot-manager_20260620_002546", "telegram", "Telegram bot 管理歷史備份版。", "備份", "2026-06-20"],
  ["transcribe", "utility", "音訊／影片語音轉文字，可選說話者分離與提示。", "主力", "2026-06-19"],
  ["transcribe_20260620_002546", "utility", "轉錄技能歷史備份版。", "備份", "2026-06-20"],
  ["video-frame-analysis", "video", "影片逐幀或抽幀分析、語速、節奏、字幕、對標複製判斷。", "主力", "2026-06-19"],
  ["video-frame-analysis_20260620_002546", "video", "影片分析技能歷史備份版。", "備份", "2026-06-20"],
  ["video-spec-builder", "video", "根據故事、劇本、鏡頭或場景建立 AI 影片製作規格。", "主力", "2026-06-19"],
  ["wbs", "website", "網站建置、測試、GitHub Pages 部署與公開 URL 回傳流程。", "主力", "2026-06-24"]
].map(([name, category, description, status, updated]) => ({ name, category, description, status, updated }));

const memoryThemes = [
  { title: "Telegram 交付與回覆", count: 18, summary: "原聊天室回傳、文件模式、禁止固定模板、禁止 raw log、溫柔繁中語氣、問題先答結論。" },
  { title: "圖片與 Lanxin", count: 14, summary: "Lanxin-only、IMS、多素材分析、教學圖批次流程、平台登入與積分確認。" },
  { title: "網站與部署", count: 4, summary: "WBS、GitHub Pages、加密部署流程、公開部署預設偏好與成功流程。" },
  { title: "技能交接與打包", count: 8, summary: "詳細交接包、安裝教學、日期命名、無私密資料、接收端測試規則。" },
  { title: "OpenClaw / Bot 延續", count: 5, summary: "OpenClaw 匯入入口、bridge 記憶、新客戶 bot、MiniNew bridge 與共享記憶。" },
  { title: "影片與 NotebookLM", count: 12, summary: "Dreamina、ACS、CLS、逐幀分析、NBS 簡報、影片摘要與音訊摘要。" },
  { title: "客服與商務", count: 6, summary: "LINE 官方客服話術、MoreFun 支援安全界線、藍星品牌、課程網站與價格確認。" },
  { title: "研究與工具偏好", count: 21, summary: "查資料附來源、英文翻繁中、截圖回傳、PDF/轉錄/語音/登入授權與停止指令。" }
];

const categoryLabels = {
  all: "全部",
  telegram: "Telegram",
  image: "圖片",
  video: "影片",
  nbs: "NBS",
  website: "網站",
  handoff: "交接",
  automation: "自動化",
  analysis: "分析",
  support: "客服",
  system: "系統",
  memory: "記憶",
  utility: "工具",
  maintenance: "維護"
};

let activeFilter = "all";

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalize(text) {
  return String(text).toLowerCase();
}

function matchesSearch(item, query) {
  if (!query) return true;
  return normalize(JSON.stringify(item)).includes(normalize(query));
}

function statusClass(status) {
  if (status === "主力" || status === "done") return "done";
  if (status === "備份" || status === "舊別名" || status === "watch") return "watch";
  if (status === "停用" || status === "blocked") return "blocked";
  return "";
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

function renderCards(target, items) {
  const query = $("#searchInput").value.trim();
  const container = $(target);
  const filtered = items.filter((item) => {
    const filterOk = activeFilter === "all" || item.category === activeFilter;
    return filterOk && matchesSearch(item, query);
  });

  container.innerHTML = filtered.map((item) => `
    <article class="card" data-category="${item.category}">
      <div class="card-top">
        <h3>${item.title}</h3>
        <span class="status ${statusClass(item.status)}">${item.status === "done" ? "完成" : "追蹤"}</span>
      </div>
      <p>${item.summary}</p>
      <ul>${item.points.map((point) => `<li>${point}</li>`).join("")}</ul>
      ${item.actions ? `
        <div class="card-actions">
          ${item.actions.map((action) => `
            <a class="card-action" href="${action.url}" ${action.external ? 'target="_blank" rel="noopener"' : ""}>${action.label}</a>
          `).join("")}
        </div>
      ` : ""}
      ${item.prompt ? `
        <div class="prompt-copy">
          <div>
            <span>給 Codex 的文字</span>
            <p>${escapeHtml(item.prompt)}</p>
          </div>
          <button type="button" class="copy-card-prompt" data-prompt="${escapeHtml(item.prompt)}">複製</button>
        </div>
      ` : ""}
      <div class="tag-row"><span class="tag">${categoryLabels[item.category] || item.category}</span></div>
    </article>
  `).join("") || `<p class="empty">沒有符合搜尋條件的項目。</p>`;

  container.querySelectorAll(".copy-card-prompt").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.prompt || "");
        button.textContent = "已複製";
      } catch {
        button.textContent = "請手動複製";
      }
      window.setTimeout(() => {
        button.textContent = "複製";
      }, 1400);
    });
  });
}

function renderRoadmap() {
  $("#roadmapList").innerHTML = roadmap.map((item) => `
    <article class="roadmap-item">
      <b>${item.horizon}</b>
      <div>
        <h3>${item.title}</h3>
        <p>${item.body}</p>
      </div>
      <span class="tag">${item.ownerValue}</span>
    </article>
  `).join("");
}

function renderTodos() {
  $("#todoBoard").innerHTML = todos.map((group) => `
    <article class="todo-card">
      <h3>${group.title}</h3>
      <ul>${group.items.map((item) => `<li>${item}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function renderSkills() {
  const query = $("#searchInput").value.trim();
  const filtered = skillPackages.filter((item) => {
    const filterOk = activeFilter === "all" || item.category === activeFilter;
    return filterOk && matchesSearch(item, query);
  });

  const counts = skillPackages.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  $("#skillSummary").innerHTML = [
    ["主力", counts["主力"] || 0],
    ["備份", counts["備份"] || 0],
    ["停用", counts["停用"] || 0],
    ["舊別名", counts["舊別名"] || 0]
  ].map(([label, value]) => `
    <div class="summary-chip">
      <b>${value}</b>
      <span>${label}</span>
    </div>
  `).join("");

  $("#skillTable").innerHTML = filtered.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td>${categoryLabels[item.category] || item.category}</td>
      <td class="skill-desc">${item.description}</td>
      <td><span class="status ${statusClass(item.status)}">${item.status}</span></td>
      <td>${item.updated}</td>
    </tr>
  `).join("") || `<tr><td colspan="5">沒有符合搜尋條件的技能。</td></tr>`;
}

function renderMemories() {
  $("#memoryGrid").innerHTML = memoryThemes.map((item) => `
    <article class="memory-card">
      <div class="card-top">
        <h3>${item.title}</h3>
        <span class="status done">${item.count}</span>
      </div>
      <p>${item.summary}</p>
    </article>
  `).join("");
}

function renderFilters() {
  const categories = ["all", "telegram", "image", "video", "nbs", "website", "handoff", "automation", "support", "utility"];
  $("#filterTabs").innerHTML = categories.map((category) => `
    <button type="button" data-filter="${category}" aria-pressed="${category === activeFilter}">
      ${categoryLabels[category]}
    </button>
  `).join("");

  $("#filterTabs").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    renderAll();
  });
}

function renderMap() {
  const canvas = $("#systemMap");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const nodes = [
    { label: "Telegram", x: 520, y: 260, r: 70, color: "#202426" },
    { label: "技能 80", x: 260, y: 140, r: 54, color: "#1f6feb" },
    { label: "記憶 88", x: 780, y: 140, r: 54, color: "#138a63" },
    { label: "IMS / Lanxin", x: 205, y: 330, r: 50, color: "#c13f3f" },
    { label: "NBS", x: 380, y: 405, r: 44, color: "#6f4bb8" },
    { label: "WBS", x: 660, y: 405, r: 44, color: "#168399" },
    { label: "影片", x: 835, y: 330, r: 50, color: "#a96f00" },
    { label: "交接", x: 520, y: 105, r: 44, color: "#52606d" }
  ];

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#cfd8d3";
  const center = nodes[0];
  nodes.slice(1).forEach((node) => {
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(node.x, node.y);
    ctx.stroke();
  });

  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.fillStyle = node.color;
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = node.r > 50 ? "700 22px Microsoft JhengHei" : "700 18px Microsoft JhengHei";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapCanvasText(ctx, node.label, node.x, node.y, node.r * 1.45, 24);
  });

  $("#mapLegend").innerHTML = [
    "Telegram 是所有任務入口與交付出口",
    "技能與記憶是目前可複製的工作能力",
    "WBS、IMS、NBS、ACS/Dreamina 是主要產出管線",
    "交接包與網站化是下一階段重點"
  ].map((item) => `<li>${item}</li>`).join("");
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((lineText, index) => ctx.fillText(lineText, x, startY + index * lineHeight));
}

function renderAll() {
  renderStats();
  renderCards("#completedGrid", completedWork);
  renderCards("#inProgressGrid", inProgress);
  renderRoadmap();
  renderTodos();
  renderSkills();
  renderMemories();
  renderMap();
  document.querySelectorAll("#filterTabs button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === activeFilter));
  });
}

const progressStoreKey = "ownerWorkProgress:v1";

function defaultProgress() {
  return {
    task: "更新工作地圖網站：加入即時作業進度同步",
    status: "處理中",
    percent: 80,
    next: "已新增進度同步面板，正在完成部署與公開頁面確認。",
    updatedAt: new Date().toISOString(),
    history: []
  };
}

function loadProgress() {
  try {
    const saved = localStorage.getItem(progressStoreKey);
    return saved ? { ...defaultProgress(), ...JSON.parse(saved) } : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function saveProgress(progress) {
  localStorage.setItem(progressStoreKey, JSON.stringify(progress));
}

async function fetchSharedProgress() {
  try {
    const response = await fetch(`progress.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-Hant", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function progressSummary(progress) {
  return [
    `目前任務：${progress.task}`,
    `狀態：${progress.status}`,
    `完成度：${progress.percent}%`,
    `下一步 / 卡點：${progress.next}`,
    `更新時間：${formatDateTime(progress.updatedAt)}`
  ].join("\n");
}

function renderProgress(progress) {
  $("#progressTask").value = progress.task;
  $("#progressStatus").value = progress.status;
  $("#progressPercent").value = progress.percent;
  $("#progressNext").value = progress.next;
  $("#progressBar").style.width = `${progress.percent}%`;
  $("#progressPercentText").textContent = `${progress.percent}%`;
  $("#progressStatusText").textContent = progress.status;
  $("#progressTaskText").textContent = progress.task;
  $("#progressNextText").textContent = progress.next;
  $("#syncUpdated").textContent = `更新：${formatDateTime(progress.updatedAt)}`;

  $("#progressHistory").innerHTML = (progress.history || []).slice(0, 5).map((item) => `
    <div class="history-item">
      <b>${item.status} · ${item.percent}%</b>
      <span>${formatDateTime(item.updatedAt)}</span>
      <p>${item.task}</p>
    </div>
  `).join("");
}

function downloadProgress(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `owner-work-progress-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function initProgressSync() {
  let progress = loadProgress();
  renderProgress(progress);
  const shared = await fetchSharedProgress();
  if (shared) {
    progress = { ...progress, ...shared };
    renderProgress(progress);
  }

  $("#progressForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const previous = {
      task: progress.task,
      status: progress.status,
      percent: progress.percent,
      updatedAt: progress.updatedAt
    };
    progress = {
      task: $("#progressTask").value.trim() || "未命名任務",
      status: $("#progressStatus").value,
      percent: Number($("#progressPercent").value),
      next: $("#progressNext").value.trim() || "尚未填寫下一步。",
      updatedAt: new Date().toISOString(),
      history: [previous, ...(progress.history || [])].slice(0, 20)
    };
    saveProgress(progress);
    renderProgress(progress);
  });

  $("#copyProgress").addEventListener("click", async () => {
    await navigator.clipboard.writeText(progressSummary(progress));
    $("#copyProgress").textContent = "已複製";
    window.setTimeout(() => {
      $("#copyProgress").textContent = "複製摘要";
    }, 1200);
  });

  $("#exportProgress").addEventListener("click", () => downloadProgress(progress));

  window.setInterval(async () => {
    const latest = await fetchSharedProgress();
    if (!latest) return;
    if (new Date(latest.updatedAt).getTime() > new Date(progress.updatedAt).getTime()) {
      progress = { ...progress, ...latest };
      renderProgress(progress);
    }
  }, 30000);
}

$("#searchInput").addEventListener("input", renderAll);
renderFilters();
renderAll();
initProgressSync();
