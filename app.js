const siteStats = [
  { label: "已安裝條目", value: "64", note: "目前可用的技能入口" },
  { label: "主技能名稱", value: "0", note: "依目前清單自動更新" },
  { label: "核心工作流", value: "0", note: "依目前清單自動更新" },
  { label: "新手入口", value: "0", note: "先從任務分類開始" }
];

const quickStartItems = [
  {
    title: "先講任務",
    summary: "不要只說「幫我做一下」。先直接講要做網站、做圖、影片、摘要、部署，藍星智能體才知道要走哪條路。做圖現在就直接講 image2 API。"
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

const taskMapItems = [
  {
    tag: "網站 / 公開部署",
    title: "在 TGBOT 貼上指令，請 Codex CLI 綁定",
    summary: "不必先閱讀獨立教學頁。到 TG 操作指南複製指令，貼到自己的 TGBOT，就能請 Codex CLI 操作瀏覽器完成 Google 與 GitHub 綁定。",
    jump: "#tg-github-command",
    action: "複製綁定指令"
  },
  {
    tag: "圖片 / 海報 / 教學圖",
    title: "一般做圖統一走 image2 API",
    summary: "做圖先講張數、比例、風格和本次素材；只有你明確說 ComfyUI，才切換到 ComfyUI。這類任務最怕混到舊圖。",
    jump: "#all-workflows?category=圖片",
    action: "看圖片工作流"
  },
  {
    tag: "影片 / 剪輯 / 長影片",
    title: "先講成品規格和素材來源",
    summary: "影片任務一定要先補秒數、比例、語言、字幕、BGM 和本次素材，不然最容易整輪做偏。",
    jump: "#all-workflows?category=影片",
    action: "看影片工作流"
  },
  {
    tag: "文件 / 摘要 / 語音",
    title: "先講來源與要輸出的格式",
    summary: "PDF、逐字稿、語音、簡報與 NotebookLM 任務，先指定來源、語言和最後要的檔案格式。",
    jump: "#all-workflows?category=文件",
    action: "看文件工作流"
  },
  {
    tag: "TGBOT / Telegram",
    title: "先確認目前對話與真正卡點",
    summary: "修 bot、回傳檔案或查狀態時，要依目前對話與實際程序判斷，不用舊聊天或其他 Bot 資料。",
    jump: "#all-workflows?category=Telegram",
    action: "看 TGBOT 工作流"
  },
  {
    tag: "LINE 官方客服",
    title: "客戶回覆與系統檢查一起處理",
    summary: "先看最新客戶問題，再依客服規則回覆；涉及連線或帳號時，同步檢查實際系統狀態。",
    jump: "#all-workflows?category=客服",
    action: "看 LINE 工作流"
  },
  {
    tag: "台股 / 研究 / 圖卡",
    title: "台股 IMS 研究與圖卡一起做",
    summary: "先做當日文字研究，再補 9:16 台股圖卡；可指定大盤、產業主線或個股，例如 2330、AI 伺服器、CoWoS。",
    jump: "#all-workflows?category=台股",
    action: "看台股工作流"
  }
];

const errorGuideItems = [
  { title: "平台忙碌／連線不穩", icon: "⏳", action: "先等 5～10 分鐘，再用同一則任務回覆「繼續」或重新操作一次。" },
  { title: "任務理解錯誤", icon: "🧭", action: "直接指出哪一段錯了，補上正確成品、規格與限制，不要只說「不對」。" },
  { title: "素材遺失／認錯素材", icon: "🖼️", action: "重新上傳本次素材，並標示數量、順序與用途；沒有標示就視為本輪無素材。" },
  { title: "檔案未回傳／網址未更新", icon: "📦", action: "回覆原任務「繼續」，要求核對檔案存在、公開網址版本或同源回傳狀態。" },
  { title: "連續無法操作", icon: "🛟", action: "完成等待與重試後仍失敗，整理錯誤現象與任務內容，再聯繫客服。" }
];

const tgGuideItems = [
  {
    step: "1",
    title: "停止所有工作：STOP",
    summary: "當龍蝦卡住、做錯方向，或你要整批暫停時，直接輸入「STOP」。這會先停下目前工作，避免錯誤持續往下跑。"
  },
  {
    step: "2",
    title: "附件和指令同一則送出",
    summary: "上傳圖片、影片或檔案時，直接在同一則訊息的文字欄寫清楚任務，再一起送出。不要先丟附件、隔一則才補指令。"
  },
  {
    step: "3",
    title: "圖片與文字一起顯示",
    summary: "選取圖片後，在下方輸入框補上指令或說明，再按紙飛機送出；接收端會在同一則訊息看到圖片與文字，不必另外追問圖片用途。"
  },
  {
    step: "4",
    title: "停滯就回覆「繼續」",
    summary: "如果長時間沒完成或卡住，請長按原本那則任務，選「回覆」，再輸入「繼續」。這樣最容易接回同一件事，不會跳錯任務。"
  },
  {
    step: "5",
    title: "有素材要明確標示",
    summary: "如果這輪真的有素材，直接寫「本次素材」「參考圖」再附圖；沒有標示時，系統就應視為這輪沒有素材。"
  },
  {
    step: "6",
    title: "新任務就重新講完整",
    summary: "如果不是延續上一件事，請直接重講完整需求，不要只丟「這個、上一張、照剛剛」。這樣最不容易混到舊任務。"
  },
  {
    step: "7",
    title: "盡量一個任務跑完，再送第二個",
    summary: "先等目前任務收到成品、網址或明確結果後，再傳下一個任務。這樣能避免兩件事互相插隊、素材混用，或回傳順序整個亂掉。"
  },
  {
    step: "8",
    title: "出錯先等 5～10 分鐘再試",
    summary: "智能體不是萬能，偶爾會遇到平台忙碌、連線不穩或判斷錯誤。先等 5～10 分鐘再操作一次；如果連續無法操作，再直接聯繫客服。"
  },
  {
    step: "9",
    title: "看到成品才算完成",
    summary: "圖片、影片、文件要真的回到目前對話，網站要能打開最新版網址。只看到開始、排隊、處理中或本機路徑，都還不算交付完成。"
  }
];

const tgSendFormula = `本次任務：___。
成品：___。
規格：___。
本次素材：已隨這則訊息附上，共 ___ 個，順序為 ___。
附件說明：請讓圖片／影片／檔案與這段文字在同一則訊息顯示。
限制：不要使用歷史附件或舊任務素材。
完成標準：驗證完成後，將成品回傳目前這個 Telegram 對話。`;

const githubBindingCommand = `wbs 綁定 Google 與 GitHub。
請讓 Codex CLI 操作瀏覽器，使用我指定的 Gmail 登入 Google，並完成 GitHub 綁定或登入。
如果需要密碼，請使用已授權的安全登入方式；遇到驗證碼、兩步驗證、Passkey 或安全確認時，再通知我本人完成。
完成後請確認 GitHub 已登入，且可以建立程式庫。`;

const tgGuideNotes = [
  "TGBOT 可以一次連續回多段訊息，沒有固定只限 1 段。長回覆會自動拆開送出，避免 Telegram 單則上限截斷。",
  "目前本機 Bot 會把長文字大約切成每段 3900 字元左右，所以你看到連續多則訊息是正常行為，不代表重複回覆。",
  "如果你只是補一句話，最穩的做法是直接回覆原任務；如果是全新任務，就重新發一則完整指令。"
];

const tgChunkNotes = [
  "可以，但不要無限制亂切。同一個任務可以分段補充，只要每段都還是在補同一件事，TGBOT 就能接著理解。",
  "最穩的順序是：先講主題，再補規格，再補限制；最後要收口，例如「以上同一任務，請開始」或「先給我確認清單」。",
  "有素材時要明確標示「本次素材」或「參考圖」，不要讓舊任務圖片被誤認成這次素材。",
  "不要一直拆成很多很短的片段，也不要把新舊任務混在一起；如果換新任務，就直接重新完整下新指令。"
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
    summary: "把尺寸、語言、風格、時長、模型、API 路線、數量一次講清楚。"
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

const dialogueExamples = [
  {
    label: "做圖任務",
    owner: "image2 API 做圖，9:16 AI 科技風，先給我確認清單。",
    bot: "結論：這次會用 image2 API 做 1 張 9:16 海報。重點確認：模型、風格、內容、素材是否有標示。你回覆確認後才生成。"
  },
  {
    label: "網站任務",
    owner: "wbs 做成公開部署網站，結合我的和 TGBOT 說話方式。",
    bot: "結論：我會先改本機網站，再驗證，最後更新公開網址；內容會加入你的下指令方式和 TGBOT 正確回法。"
  },
  {
    label: "卡點回覆",
    owner: "好了沒？",
    bot: "結論：公開站還差最後部署驗證。網站檔案已改完，現在正在確認 GitHub Pages 已更新到最新版。"
  },
  {
    label: "錯誤示範",
    owner: "在嗎 / 為什麼 / 幫我做",
    bot: "不要只回『收到』『思考中』『稍後回報』。這種回法沒有結論，也沒有真正處理任務。"
  },
  {
    label: "停滯續跑",
    owner: "長按原任務回覆：繼續",
    bot: "我會接回上一個未完成任務，優先檢查真實狀態，再從安全的下一步繼續做。"
  },
  {
    label: "多段回覆",
    owner: "如果結果很多，可以一次回多段嗎？",
    bot: "可以。長結果會自動拆成多則訊息連續送出；如果是檔案、圖片、網站網址，會直接回真正可交付的成果。"
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
    prompt: "wbs 做一個公開網站。\n請讓 Codex CLI 操作瀏覽器，使用我指定的 Gmail 登入 Google，並完成 GitHub 綁定或登入；遇到驗證碼、兩步驗證、Passkey 或安全確認時，再通知我本人完成。\n主題：___\n成品：公開網址。\n規格：繁體中文、手機版可讀、桌機版完整。\n限制：不要混舊站內容。\n完成標準：本機驗證後公開部署，網址真的打得開。"
  },
  {
    title: "做圖模板",
    description: "適合 image2 API、做圖、教學圖或海報任務。",
    prompt: "image2 API 做圖。\n成品：___ 張 PNG。\n規格：9:16、繁體中文、AI 科技風。\n素材：本輪沒有素材 / 本次素材如下：___。\n限制：不用歷史圖片，只走 image2 API。\n完成標準：先給確認清單，我回確認後再生成。"
  },
  {
    title: "影片模板",
    description: "適合 cmsd、sd、hfsw、剪輯任務。",
    prompt: "cmsd / hfsw / ComfyUI。\n成品：MP4。\n規格：時長 ___、比例 ___、語言 ___。\n素材：本次素材 ___。\n限制：不要混上一輪角色或舊素材。\n完成標準：檔案輸出、驗證完成，再回到同一個 Telegram 對話。"
  },
  {
    title: "對話模板",
    description: "適合教新手怎麼跟 TGBOT 下令。",
    prompt: "任務：___。\n成品：___。\n規格：___。\n限制：不要混舊素材 / 不要固定式回覆 / 先給確認清單。\n完成標準：直接回可交付結果、檔案、網址或明確卡點。"
  }
];

const skills = [
  { name: "wbs", category: "網站部署", summary: "網站建置、驗證、GitHub Pages 公開部署。", useCase: "做網站、改網站、公開部署。" },
  { name: "github-pages-deploy", category: "網站部署", summary: "專門處理 GitHub Pages 的推送與公開驗證。", useCase: "網站已做好，只差公開部署。" },
  { name: "monthly-course-site-updater", category: "網站部署", summary: "每月課程報名與活動網站更新。", useCase: "只改日期、場次、報名資訊。" },
  { name: "做圖", category: "圖片生成", summary: "image2 API 單一做圖主入口。", useCase: "做海報、教學圖、商品圖、文案轉圖。" },
  { name: "teaching-step-images", category: "圖片生成", summary: "教學步驟圖、SOP 圖與手機操作圖，統一走 image2 API 風格改版。", useCase: "做 4 張、8 張、逐步說明圖。" },
  { name: "character-memory-manager", category: "圖片生成", summary: "固定角色外觀、服裝、負面限制。", useCase: "嵐熙、庫裡、蝦咩等角色要保持一致。" },
  { name: "ai-auto-short-video-workflow", category: "影片工作流", summary: "長影片自動切短影音。", useCase: "把長影片拆成หลาย支 9:16 短片。" },
  { name: "cmsd", category: "影片工作流", summary: "Claude 分析到 IMS 分鏡再到 SD 影片。", useCase: "做完整 AI 影片故事板與影片生成。" },
  { name: "dreamina-cli", category: "影片工作流", summary: "Dreamina / Seedance / SD 任務提交與下載。", useCase: "送影片生成、查狀態、抓成品。" },
  { name: "dreamina-sd-video-workflow", category: "影片工作流", summary: "SD / Dreamina 影片完整生成流程。", useCase: "需要正式跑一整條影片工作流。" },
  { name: "douyin-peipao", category: "影片工作流", summary: "抖音陪跑、選題、對標與腳本整理。", useCase: "短影音帳號經營與內容規劃。" },
  { name: "hfsw", category: "影片工作流", summary: "長影片完整製作工作流。", useCase: "旁白、字幕、BGM、畫面一條龍輸出。" },
  { name: "hyperframes", category: "影片工作流", summary: "動畫合成、標題卡、視覺節奏與動態場景。", useCase: "做動態字幕、片頭、場景動畫。" },
  { name: "video-frame-analysis", category: "影片工作流", summary: "逐幀或高密度分析影片內容。", useCase: "拆教學影片、判斷鏡頭與字幕節奏。" },
  { name: "video-spec-builder", category: "影片工作流", summary: "把故事整理成可執行影片規格。", useCase: "先做拍攝或生成規格再送影片。" },
  { name: "nbs", category: "摘要 / 文件", summary: "NotebookLM 統一正式工作流。", useCase: "做語音摘要、簡報、影片摘要。" },
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

const workflows = [
  {
    name: "WBS 網站建置與公開部署", category: "網站", trigger: "wbs、做網站、更新網站、公開部署",
    summary: "先在 TGBOT 貼上指令，請 Codex CLI 用既有 Google 帳號完成 GitHub 綁定與登入，再修改真實網站檔案、驗證手機與桌機，最後確認公開網址是最新版。", output: "公開網址＋可維護的網站原始檔",
    formula: "wbs 更新／建立 ___ 網站。\n請讓 Codex CLI 操作瀏覽器，使用我指定的 Gmail 登入 Google，並完成 GitHub 綁定或登入；遇到驗證碼、兩步驗證、Passkey 或安全確認時，再通知我本人完成。\n內容：___。\n規格：繁體中文，手機與桌機都要清楚可用。\n功能：___。\n完成標準：本機驗證、公開部署，並確認公開網址顯示最新版。"
  },
  {
    name: "網站監控系統建置", category: "網站", trigger: "做監控網站、建立狀態儀表板、即時監控系統、SSE 監控",
    summary: "建立 GitHub Pages 監控前端、本機狀態產生器與即時 API／SSE；即時服務失效時自動改讀公開狀態快照。", output: "公開監控網址＋即時監控服務＋狀態快照與操作驗證",
    formula: "wbs 建立／更新網站監控系統。\n監控對象：___。\n要顯示的狀態：程序、心跳、目前任務、最後更新時間、錯誤摘要、用量統計 ___。\n架構：GitHub Pages 負責公開前端；本機程式產生 runtime-status.json；即時服務提供 /api/status 與 /api/events（SSE）；即時服務無法連線時自動改讀公開快照。\n控制功能：___（例如檢查、救援、停止、重啟）；敏感操作必須在伺服器端驗證操作碼或授權，不可把密碼、Token、Cookie 或金鑰放進前端。\n更新方式：狀態變更時用 SSE 推送，並保留定時輪詢與快照備援。\n介面要求：繁體中文，手機與桌機都清楚，顯示資料來源、最後更新時間、連線中斷與備援模式。\n完成標準：本機狀態資料可更新、API／SSE 或快照備援可讀、控制功能實測、公開部署完成，並確認公開網址顯示最新版。"
  },
  {
    name: "image2 API 做圖", category: "圖片", trigger: "image2、image2 API、gpt-image-2",
    summary: "只走 image2 外部 API；先整理精簡確認清單，收到確認後才生成與驗字。", output: "PNG 原圖",
    formula: "image2 API 做圖。\n內容：___。\n成品：___ 張 PNG。\n規格：___ 比例、繁體中文、___ 風格。\n素材：本輪沒有素材／本次素材如下：___。\n先給我精簡確認清單，確認後再生成。"
  },
  {
    name: "ComfyUI 圖片製作", category: "圖片", trigger: "ComfyUI、comfy、com 做圖",
    summary: "只使用 ComfyUI 跑文生圖、圖生圖、ControlNet、局部重繪或放大，不切換 image2。", output: "PNG 圖片＋工作流結果",
    formula: "用 ComfyUI 做圖，只使用 ComfyUI。\n內容：___。\n模式：文生圖／圖生圖／ControlNet／局部重繪／放大。\n規格：___ 比例、___ 風格。\n素材：___。\n完成標準：圖片生成並檢查尺寸、文字與畫面。"
  },
  {
    name: "教學步驟圖", category: "圖片", trigger: "教學圖、SOP 圖、手機操作圖",
    summary: "先列完整順序，一張只教一個動作，保留按鈕名稱並用紅框或箭頭標示。", output: "依步驟排序的 9:16 PNG 圖組",
    formula: "用 image2 API 做 ___ 張教學步驟圖。\n主題：___。\n每張一個動作，使用繁體中文與清楚紅框／箭頭。\n敏感資訊一律遮蔽。\n先列完整步驟確認清單，確認後整批生成。"
  },
  {
    name: "角色一致性管理", category: "圖片", trigger: "固定角色、角色記憶、保持人物一致",
    summary: "固定臉部、服裝、配件、個性與禁用特徵，供後續圖片、分鏡與影片沿用。", output: "角色規格與可重用參考",
    formula: "建立／更新角色記憶。\n角色名稱：___。\n固定外觀：___。\n服裝配件：___。\n個性與動作：___。\n禁止出現：___。\n後續用於：圖片／分鏡／影片。"
  },
  {
    name: "CMSD 故事到 AI 影片", category: "影片", trigger: "cmsd、cmde",
    summary: "素材分析、劇情規劃、角色分鏡、九宮格視覺到 SD／Seedance 影片的完整流程。", output: "分鏡素材＋最終 MP4",
    formula: "cmsd 製作影片。\n故事：___。\n角色：___。\n素材：本次素材 ___。\n規格：___ 秒、___ 比例。\n必說台詞：___。\n先完成素材分析與分鏡確認，再送影片生成。"
  },
  {
    name: "SD／Dreamina／Seedance 影片生成", category: "影片", trigger: "sd、sdf、sdv、Dreamina、Seedance",
    summary: "確認素材、模型、時長、比例與提示詞後提交，追蹤狀態、下載並驗證影片。", output: "可播放 MP4",
    formula: "用 SD／Seedance 製作影片。\n模式：文生影片／圖生影片。\n素材：___。\n模型：___。\n規格：___ 秒、___ 比例。\n動作與鏡頭：___。\n先給確認清單，確認後提交。"
  },
  {
    name: "ComfyUI 圖生／文生影片", category: "影片", trigger: "ComfyUI 生影片、com 生影片",
    summary: "只使用 ComfyUI 的 Wan 等工作流，依需求做圖生影片或文生影片並輸出 MP4。", output: "MP4 影片",
    formula: "用 ComfyUI 生影片，只使用 ComfyUI。\n模式：圖生影片／文生影片。\n素材：___。\n規格：___ 秒、___ 比例、___ fps。\n動態要求：___。\n完成標準：輸出 MP4 並檢查畫面、文字與時長。"
  },
  {
    name: "HFSW 長影片製作", category: "影片", trigger: "hfsw、完整長影片",
    summary: "整合腳本、旁白、畫面、字幕、配樂、速度與輸出驗證。", output: "完整 MP4",
    formula: "hfsw 製作完整影片。\n主題：___。\n素材：___。\n規格：___ 比例、速度 ___、字幕樣式 ___。\n旁白：___。\n配樂：___。\n完成標準：畫面、旁白、字幕、音樂全部驗證後回傳 MP4。"
  },
  {
    name: "AI 長影片自動切短影音", category: "影片", trigger: "AI 自動剪短影音、長影片切短片",
    summary: "先轉錄與找重點，再自動去停頓、切段、加字幕並輸出多支 9:16 短片。", output: "多支短影音 MP4",
    formula: "把這支長影片自動剪成 ___ 支短影音。\n來源影片：___。\n每支長度：___ 秒。\n比例：9:16。\n字幕與標題：繁體中文。\n完成標準：每支內容不重複，逐支驗證後回傳。"
  },
  {
    name: "NBS NotebookLM 摘要", category: "文件", trigger: "nbs、NotebookLM、語音摘要、簡報",
    summary: "整理來源、建立 NotebookLM 專案，再依需求製作簡報、影片摘要或 MP3 語音摘要。", output: "PPTX／MP4／MP3，依任務指定",
    formula: "nbs 處理這份資料。\n來源：___。\n成品：PPTX／MP4／MP3 ___。\n語言：繁體中文。\n受眾與用途：___。\n保留重點：___。\n完成標準：下載每個成品、驗證可開啟並回傳。"
  },
  {
    name: "PDF 讀取與輸出", category: "文件", trigger: "pdf、讀 PDF、做 PDF、修亂碼",
    summary: "讀取、OCR、摘要、重排或產生 PDF，並檢查中文字、頁數與版面。", output: "PDF 或整理後文件",
    formula: "pdf 處理這份文件。\n來源：___。\n任務：讀取／OCR／摘要／重排／輸出。\n語言：繁體中文。\n版面要求：___。\n完成標準：頁數正確、文字無亂碼、檔案可正常開啟。"
  },
  {
    name: "Speech 配音", category: "文件", trigger: "speech、配音、文字轉語音",
    summary: "依指定語言、聲線、速度與情緒產生旁白，並檢查音訊品質。", output: "MP3／WAV",
    formula: "speech 製作配音。\n文稿：___。\n語言與口音：___。\n聲線：___。\n速度：___。\n情緒：___。\n成品：MP3／WAV。\n完成標準：音訊無異常靜音、時長與內容正確。"
  },
  {
    name: "Transcribe 轉錄字幕", category: "文件", trigger: "transcribe、逐字稿、字幕",
    summary: "將音訊或影片轉為繁體中文逐字稿、時間軸字幕與講者標記。", output: "TXT／SRT／VTT",
    formula: "transcribe 轉錄這個音訊／影片。\n來源：___。\n語言：繁體中文。\n成品：TXT／SRT／VTT ___。\n講者區分：要／不要。\n完成標準：時間軸、專有名詞與段落核對完成。"
  },
  {
    name: "Telegram Bot 管理與修復", category: "Telegram", trigger: "檢查 TGBOT、修 bot、重啟 bot、回傳檔案",
    summary: "檢查實際程序、心跳、連線與任務狀態，修復後驗證同源回覆與檔案交付。", output: "可運作的 Bot 或明確修復結果",
    formula: "檢查並修復目前 TGBOT。\n問題：___。\n影響範圍：___。\n保留：既有排程與自動恢復。\n完成標準：實際連線、程序、心跳與回覆測試通過。"
  },
  {
    name: "LINE 官方客服工作流", category: "客服", trigger: "lo、LINE 客服、LINE 官方、接手 LINE 官方帳號",
    summary: "先判斷最新客戶問題，再依既有客服規則直接回覆；同時維護官方帳號的訊息轉送、健康檢查、學習更新與高風險案件升級。", output: "可直接傳給客戶的繁體中文回覆＋客服系統檢查結果",
    formula: "執行 LINE 官方客服工作流。\n目標官方帳號：___。\n客戶最新訊息：___。\n相關截圖／訂單／錯誤內容：___。\n處理要求：先判斷問題並給可直接傳送的繁體中文回覆；需要時檢查訊息轉送與連線狀態。\n限制：不外露密碼、Token、客戶個資或內部紀錄；退款、付款爭議、補償與帳號安全問題先交由主人決定。\n完成標準：回覆內容可直接使用，系統問題則完成實際檢查與修復，或說明明確卡點。"
  },
  {
    name: "自動排程建立與維護", category: "系統", trigger: "建立排程、自動執行、每天回報、定時檢查、修改排程",
    summary: "建立、修改或停用自動排程，保留既有監控與恢復機制；完成後實際核對觸發時間、執行內容、回傳對話與最新執行結果。", output: "可正常觸發的排程＋驗證結果與下次執行時間",
    formula: "建立／修改自動排程。\n排程名稱：___。\n執行任務：___。\n執行頻率：每天／每週／每月／一次性 ___。\n執行時間：___，時區：___。\n輸入來源：___。\n完成後回傳：結果文字／網址／檔案 ___。\n回傳位置：目前原始 Telegram 對話／指定位置 ___。\n失敗處理：先重試 ___ 次，再檢查實際程序、狀態檔與平台結果；保留原有監控、看門狗與自動恢復。\n安全限制：不顯示密碼、Token、Cookie、驗證碼或內部紀錄。\n完成標準：排程已建立或更新、狀態為啟用、觸發時間與時區正確，並完成一次測試或確認最近執行結果與下次執行時間。"
  },
  {
    name: "技能與記憶交接", category: "系統", trigger: "打包技能、記憶、工作流、交接 Codex／OC",
    summary: "整理技能、記憶、安裝教學、測試方式與安全排除，製作可一次學會的交接包。", output: "含日期的 ZIP 教學包",
    formula: "打包 ___ 技能／記憶／工作流，交給其他 Codex／OpenClaw 學習。\n範圍：___。\n要包含：安裝教學、觸發詞、完整流程、測試題、安全規則。\n禁止包含：密碼、Token、Cookie、登入資料與原始紀錄。"
  },
  {
    name: "幣安 Coin 研究", category: "研究", trigger: "幣安 coin、查 coin、合約地址、meme coin",
    summary: "核對鏈與合約地址，研究市場、持倉、風險、流動性與可疑訊號。", output: "繁體中文研究結論與風險判斷",
    formula: "幣安 coin 研究。\n幣種／合約地址：___。\n鏈：___。\n要查：市場表現、持倉、流動性、合約風險、聰明錢。\n完成標準：先給結論，再附依據與風險提醒。"
  },
  {
    name: "台股 IMS 每日研究", category: "研究", trigger: "台股ims、台股 IMS、台股研究、台股圖卡、今天台股怎麼看、幫我看 2330 台積電",
    summary: "先查台股大盤與美股科技連動，再整理主線產業、觀察股、籌碼與技術面；固定輸出文字研究與 9:16 台股圖卡。", output: "文字研究報告＋9:16 台股圖卡",
    formula: "台股ims。\n重點：大盤、美股科技／費半／台積電 ADR、主線產業、籌碼、技術面、風險。\n指定個股／產業：___。\n成品：先貼文字版台股研究報告，再做 1 張 9:16 台股圖卡。\n圖卡：繁體中文、科技感、不可沿用舊素材或舊圖。\n完成標準：文字報告完成＋圖卡生成、下載、驗證後回傳；必須附非投資建議提醒。"
  }
];

const skillFormulaByCategory = {
  "網站部署": (skill) => `${skill.name}\n任務：建立或更新 ___ 網站。\n內容：___。\n規格：手機與桌面都要清楚可用。\n完成標準：公開部署，並確認公開網址能正常開啟。`,
  "圖片生成": (skill) => `${skill.name}\n任務：製作 ___。\n成品：___ 張圖片。\n規格：繁體中文、___ 比例、___ 風格。\n素材：本次素材 ___。\n先給我確認清單，確認後再開始生成。`,
  "影片工作流": (skill) => `${skill.name}\n任務：製作 ___ 影片。\n成品：MP4。\n規格：___ 秒、___ 比例、繁體中文。\n素材：本次素材 ___。\n完成標準：畫面、聲音、字幕驗證完成後回傳。`,
  "摘要 / 文件": (skill) => `${skill.name}\n任務：把 ___ 整理成 ___。\n成品：___。\n語言：繁體中文。\n保留重點：___。\n完成標準：檔案可開啟、內容可讀並完成回傳。`,
  "Telegram / Bot": (skill) => `${skill.name}\n任務：處理 ___。\n目標 Bot／對話：本次來源。\n限制：不要使用舊對話、其他 Bot 或預設收件人。\n完成標準：實際功能驗證成功，檔案只回傳原對話。`,
  "系統 / 自動化": (skill) => `${skill.name}\n任務：處理 ___。\n目前狀態：___。\n預期結果：___。\n限制：保留既有設定，不動無關檔案。\n完成標準：實際測試通過，回報結果或明確卡點。`,
  "研究 / 分析": (skill) => `${skill.name}\n研究主題：___。\n範圍：___。\n我要的結論：___。\n風險檢查：___。\n完成標準：先給結論，再附依據與必要注意事項。`
};

function buildSkillFormula(skill) {
  const builder = skillFormulaByCategory[skill.category];
  if (builder) return builder(skill);
  return `${skill.name}\n任務：${skill.useCase}\n成品：___。\n規格：___。\n完成標準：驗證完成後回傳成果。`;
}

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
let workflowSearchTerm = "";
let skillMode = "beginner";
let workflowMode = "beginner";
const beginnerSkills = new Set(["wbs", "做圖", "teaching-step-images", "hfsw", "nbs", "pdf", "telegram-bot-manager", "telegram-two-stage-reply", "bb-browser", "playwright"]);
const beginnerWorkflows = new Set(["WBS 網站建置與公開部署", "網站監控系統建置", "image2 API 做圖", "教學步驟圖", "HFSW 長影片製作", "NBS NotebookLM 摘要", "Telegram Bot 管理與修復", "LINE 官方客服工作流", "自動排程建立與維護", "台股 IMS 每日研究"]);

const $ = (selector) => document.querySelector(selector);

const installPromptDismissedKey = "blue-star-agent-install-prompt-dismissed-v1";
let deferredInstallPrompt = null;
let installPromptTimer = null;
let installPromptPreviousFocus = null;

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
  siteStats[1].value = String(skills.length);
  siteStats[1].note = `公開站目前保留 ${skills.length} 個技能入口`;
  siteStats[2].value = String(workflows.length);
  siteStats[2].note = `每條都附可複製的新手指令公式`;
  siteStats[3].value = String(taskMapItems.length);
  siteStats[3].note = `目前保留 ${taskMapItems.length} 類直接入口`;
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

function renderErrorGuide() {
  const container = $("#errorGuideGrid");
  if (!container) return;
  container.innerHTML = errorGuideItems.map((item) => `
    <article class="error-card">
      <span class="error-icon" aria-hidden="true">${item.icon}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.action)}</p>
    </article>
  `).join("");
}

function renderTaskMap() {
  const container = $("#taskMapGrid");
  container.innerHTML = taskMapItems
    .map(
      (item) => `
        <article class="route-card">
          <span class="tag">${escapeHtml(item.tag)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.summary)}</p>
          <a href="${escapeHtml(item.jump.split("?")[0])}" class="route-link" data-route-category="${escapeHtml(item.jump.split("?")[1]?.replace("category=", "") || "")}">${escapeHtml(item.action)}</a>
        </article>
      `
    )
    .join("");
}

function renderTgGuide() {
  const container = $("#tgGuideGrid");

  $("#tgSendPanel").innerHTML = `
    <div class="tg-send-copy">
      <span class="support-kicker">最重要的發送方式</span>
      <strong>圖片＋文字說明，同一則訊息送出</strong>
      <p>先選圖片、影片或檔案，再在下方輸入框寫指令或說明，最後一起按紙飛機送出。接收端會看到附件與文字綁在同一則訊息。</p>
      <button class="copy-button tg-send-copy-button" type="button" data-copy="${escapeHtml(tgSendFormula)}">複製附件任務格式</button>
    </div>
    <div class="tg-send-examples" aria-label="Telegram 正確與錯誤發送方式">
      <div class="send-example is-correct">
        <span>正確</span>
        <strong>圖片與文字同時顯示</strong>
        <p>選取 3 張圖片，輸入「本次素材 3 張，依順序做成 9:16 教學圖，先給確認清單」，再按紙飛機。</p>
      </div>
      <div class="send-example is-wrong">
        <span>容易出錯</span>
        <strong>先丟附件，下一則只說「幫我做」</strong>
        <p>指令和素材分開，容易被判成不同任務，也可能混到上一輪附件。</p>
      </div>
    </div>
  `;

  $("#tg-github-command").innerHTML = `
    <div class="tg-command-copy">
      <span class="support-kicker">第一次做網站</span>
      <strong>在 TGBOT 貼上這段，請 Codex CLI 綁定 Google 與 GitHub</strong>
      <p>開啟自己的 TGBOT，直接貼上完整指令後送出即可。帳號安全驗證出現時，再由本人完成。</p>
    </div>
    <pre id="github-binding-command">${escapeHtml(githubBindingCommand)}</pre>
    <button type="button" class="copy-button" data-copy-target="github-binding-command" data-copy-label="複製綁定指令">複製綁定指令</button>
  `;

  container.innerHTML = tgGuideItems
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

  const dialogueGrid = $("#tgDialogueGrid");
  if (dialogueGrid) {
    dialogueGrid.innerHTML = dialogueExamples
      .map(
        (item) => `
          <article class="dialogue-card">
            <span class="tag">${escapeHtml(item.label)}</span>
            <div class="dialogue-bubble owner-bubble">
              <strong>你可以這樣說</strong>
              <p>${escapeHtml(item.owner)}</p>
            </div>
            <div class="dialogue-bubble bot-bubble">
              <strong>TGBOT 應該這樣回</strong>
              <p>${escapeHtml(item.bot)}</p>
            </div>
          </article>
        `
      )
      .join("");
  }

  $("#tgNotePanel").innerHTML = `
    <strong>TGBOT 一次可以回幾段？</strong>
    <ul class="checklist">
      ${tgGuideNotes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;

  $("#tgChunkPanel").innerHTML = `
    <strong>TGBOT 可以一直分段下指令嗎？</strong>
    <ul class="checklist">
      ${tgChunkNotes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderFormula() {
  const container = $("#templateFormulaGrid");
  if (!container) return;
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
    if (skillMode === "beginner" && !beginnerSkills.has(skill.name) && !normalized) return false;
    const matchesCategory = activeCategory === "全部" || skill.category === activeCategory;
    if (!matchesCategory) return false;
    if (!normalized) return true;
    const haystack = [skill.name, skill.category, skill.summary, skill.useCase, buildSkillFormula(skill)].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}

function renderSkillOverview(visibleSkills) {
  const categoryCount = activeCategory === "全部" ? categoryOrder.length - 1 : 1;
  $("#skillOverview").innerHTML = `
    <span class="tag">目前視圖</span>
    <p>顯示 <strong>${visibleSkills.length}</strong> 個技能；目前是 <strong>${skillMode === "beginner" ? "新手常用" : "完整技能"}</strong>；分類範圍 <strong>${escapeHtml(activeCategory)}</strong>。</p>
  `;
}

function renderSkills() {
  const visibleSkills = filteredSkills();
  renderSkillOverview(visibleSkills);
  const grid = $("#skillGrid");
  const empty = $("#skillEmpty");

  grid.innerHTML = visibleSkills
    .map(
      (skill, index) => `
        <article class="skill-card">
          <span class="tag">${escapeHtml(skill.category)}</span>
          <h3>${escapeHtml(skill.name)}</h3>
          <p>${escapeHtml(skill.summary)}</p>
          <div class="meta-row">
            <span>適合：${escapeHtml(skill.useCase)}</span>
          </div>
          <div class="skill-formula">
            <details class="formula-details">
              <summary>
                <span>可直接複製的指令公式</span>
                <small>點開看完整寫法</small>
              </summary>
              <pre id="skill-formula-${index}">${escapeHtml(buildSkillFormula(skill))}</pre>
            </details>
            <button type="button" class="copy-button" data-copy-target="skill-formula-${index}" data-copy-label="複製">複製</button>
          </div>
        </article>
      `
    )
    .join("");

  empty.classList.toggle("is-visible", visibleSkills.length === 0);
}

function filteredWorkflows() {
  const normalized = workflowSearchTerm.trim().toLowerCase();
  const modeFiltered = workflows.filter((workflow) => workflowMode === "full" || beginnerWorkflows.has(workflow.name));
  if (!normalized) return modeFiltered;
  return modeFiltered.filter((workflow) => {
    const haystack = [workflow.name, workflow.category, workflow.trigger, workflow.summary, workflow.output, workflow.formula]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

function renderWorkflows() {
  const visibleWorkflows = filteredWorkflows();
  const grid = $("#workflowGrid");
  const empty = $("#workflowEmpty");

  $("#workflowOverview").innerHTML = `
    <span class="tag">目前視圖</span>
    <p>顯示 <strong>${visibleWorkflows.length}</strong> 條工作流；目前是 <strong>${workflowMode === "beginner" ? "新手常用" : "完整工作流"}</strong>。</p>
  `;

  grid.innerHTML = visibleWorkflows
    .map(
      (workflow, index) => `
        <article class="skill-card workflow-card">
          <span class="tag">${escapeHtml(workflow.category)}</span>
          <h3>${escapeHtml(workflow.name)}</h3>
          <p>${escapeHtml(workflow.summary)}</p>
          <dl class="workflow-meta">
            <div>
              <dt>怎麼觸發</dt>
              <dd>${escapeHtml(workflow.trigger)}</dd>
            </div>
            <div>
              <dt>最後成品</dt>
              <dd>${escapeHtml(workflow.output)}</dd>
            </div>
          </dl>
          <div class="skill-formula">
            <details class="formula-details">
              <summary>
                <span>可直接複製的工作流公式</span>
                <small>點開看完整寫法</small>
              </summary>
              <pre id="workflow-formula-${index}">${escapeHtml(workflow.formula)}</pre>
            </details>
            <button type="button" class="copy-button" data-copy-target="workflow-formula-${index}" data-copy-label="複製">複製</button>
          </div>
        </article>
      `
    )
    .join("");

  empty.classList.toggle("is-visible", visibleWorkflows.length === 0);
}

function showCopyStatus(message) {
  const status = $("#copyStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.add("is-visible");
  window.clearTimeout(showCopyStatus.timer);
  showCopyStatus.timer = window.setTimeout(() => {
    status.classList.remove("is-visible");
  }, 3000);
}

function toggleBackToTop() {
  const button = $("#backToTop");
  if (!button) return;
  button.classList.toggle("is-visible", window.scrollY > 320);
}

function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function showInstallInstructions(message) {
  const instructions = $("#installAppInstructions");
  const button = $("#installAppButton");
  if (!instructions || !button) return;
  instructions.textContent = message;
  instructions.classList.add("is-visible");
  button.textContent = "我知道了";
  button.dataset.action = "close";
}

function prepareInstallDialog() {
  const instructions = $("#installAppInstructions");
  const button = $("#installAppButton");
  if (!instructions || !button) return;

  instructions.classList.remove("is-visible");
  instructions.textContent = "";
  button.dataset.action = "install";
  button.textContent = "下載 App";

  if (isIosDevice() && !deferredInstallPrompt) {
    showInstallInstructions("iPhone／iPad：點選瀏覽器的「分享」，再選擇「加入主畫面」。");
  }
}

function openInstallDialog({ manual = false } = {}) {
  const modal = $("#installAppModal");
  if (!modal || isInstalledApp()) return;
  if (!manual && window.localStorage.getItem(installPromptDismissedKey)) return;

  window.clearTimeout(installPromptTimer);
  installPromptPreviousFocus = document.activeElement;
  prepareInstallDialog();
  modal.hidden = false;
  document.body.classList.add("install-modal-open");
  window.setTimeout(() => $("#installAppButton")?.focus(), 0);
}

function closeInstallDialog({ remember = true } = {}) {
  const modal = $("#installAppModal");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove("install-modal-open");
  if (remember) window.localStorage.setItem(installPromptDismissedKey, "1");
  if (installPromptPreviousFocus instanceof HTMLElement) installPromptPreviousFocus.focus();
}

async function installApp() {
  const button = $("#installAppButton");
  if (!button) return;

  if (button.dataset.action === "close") {
    closeInstallDialog();
    return;
  }

  if (!deferredInstallPrompt) {
    const message = isIosDevice()
      ? "iPhone／iPad：點選瀏覽器的「分享」，再選擇「加入主畫面」。"
      : "請開啟瀏覽器選單，選擇「安裝應用程式」或「加到主畫面」。";
    showInstallInstructions(message);
    return;
  }

  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (choice.outcome === "accepted") {
    window.localStorage.removeItem(installPromptDismissedKey);
    closeInstallDialog({ remember: false });
    $("#openInstallApp").hidden = true;
  } else {
    closeInstallDialog();
  }
}

function bindInstallApp() {
  const openButton = $("#openInstallApp");
  const installButton = $("#installAppButton");
  const modal = $("#installAppModal");
  if (!openButton || !installButton || !modal) return;

  if (isInstalledApp()) {
    openButton.hidden = true;
    return;
  }

  openButton.addEventListener("click", () => openInstallDialog({ manual: true }));
  installButton.addEventListener("click", installApp);
  modal.querySelectorAll("[data-install-close]").forEach((element) => {
    element.addEventListener("click", () => closeInstallDialog());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeInstallDialog();
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (!modal.hidden) prepareInstallDialog();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    window.localStorage.removeItem(installPromptDismissedKey);
    closeInstallDialog({ remember: false });
    openButton.hidden = true;
  });

  // 延後到使用者看過首屏或主動互動後，避免開站立即打斷閱讀。
  const openAfterEngagement = () => {
    if (window.scrollY > 260 || document.body.dataset.userEngaged === "1") {
      window.removeEventListener("scroll", openAfterEngagement);
      openInstallDialog();
    }
  };
  window.addEventListener("scroll", openAfterEngagement, { passive: true });
  window.setTimeout(() => {
    if (document.body.dataset.userEngaged === "1") openInstallDialog();
  }, 12000);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

function bindEvents() {
  const backToTop = $("#backToTop");

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

  $("#workflowSearch").addEventListener("input", (event) => {
    workflowSearchTerm = event.target.value;
    renderWorkflows();
  });

  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      skillMode = button.dataset.mode;
      document.querySelectorAll(".mode-button").forEach((item) => item.classList.toggle("active", item === button));
      renderSkills();
    });
  });

  document.querySelectorAll(".workflow-mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      workflowMode = button.dataset.mode;
      document.querySelectorAll(".workflow-mode-button").forEach((item) => item.classList.toggle("active", item === button));
      renderWorkflows();
    });
  });

  document.querySelectorAll("[data-route-category]").forEach((link) => {
    link.addEventListener("click", () => {
      const category = link.dataset.routeCategory;
      const query = category;
      workflowMode = "full";
      const input = $("#workflowSearch");
      if (input) {
        input.value = query;
        workflowSearchTerm = query;
      }
      document.querySelectorAll(".workflow-mode-button").forEach((item) => item.classList.toggle("active", item.dataset.mode === "full"));
      renderWorkflows();
    });
  });

  document.addEventListener("pointerdown", () => { document.body.dataset.userEngaged = "1"; }, { once: true });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-copy-target], button[data-copy]");
    if (!button) return;
    const target = button.getAttribute("data-copy-target")
      ? document.getElementById(button.getAttribute("data-copy-target"))
      : null;
    if (button.hasAttribute("data-copy-target") && !target) return;
    const defaultLabel = button.getAttribute("data-copy-label") || button.textContent.trim() || "複製";
    const text = target ? target.textContent.trim() : button.getAttribute("data-copy");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "已複製";
      showCopyStatus("公式已複製");
      window.setTimeout(() => {
        button.textContent = defaultLabel;
      }, 3000);
    } catch (error) {
      button.textContent = "複製失敗";
      showCopyStatus("無法自動複製，請長按公式手動複製");
      window.setTimeout(() => {
        button.textContent = defaultLabel;
      }, 3000);
    }
  });

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();
}

function init() {
  renderHeroStats();
  renderQuickStart();
  renderTaskMap();
  renderErrorGuide();
  renderTemplates();
  renderTgGuide();
  renderFormula();
  renderList("#completionChecklist", completionChecklist);
  renderList("#commonMistakes", commonMistakes);
  renderCategoryFilters();
  renderSkills();
  renderWorkflows();
  bindEvents();
  bindInstallApp();
  registerServiceWorker();
}

init();
