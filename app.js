const siteStats = [
  { label: "已安裝條目", value: "169", note: "包含正式版、歷史版與備份入口" },
  { label: "主技能名稱", value: "43", note: "公開站目前保留 43 個主技能入口" },
  { label: "核心工作流", value: "17", note: "每條都附可複製的新手指令公式" },
  { label: "記憶檔", value: "345", note: "偏好、成功流程、安全規則與工作流補強" }
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
    title: "你要的是網址，不是只有畫面",
    summary: "如果你要新站、改版、融合兩個網站、公開部署，先看模板和完整工作流，不要只盯著單一流程區塊。",
    jump: "#all-workflows",
    action: "看網站工作流"
  },
  {
    tag: "圖片 / 海報 / 教學圖",
    title: "先決定 image2 還是 ComfyUI",
    summary: "做圖先講工具路線、張數、比例、風格和有沒有本次素材。這類任務最怕混到舊圖。",
    jump: "#all-workflows",
    action: "看圖片工作流"
  },
  {
    tag: "影片 / 剪輯 / 長影片",
    title: "先講成品規格和素材來源",
    summary: "影片任務一定要先補秒數、比例、語言、字幕、BGM 和本次素材，不然最容易整輪做偏。",
    jump: "#all-workflows",
    action: "看影片工作流"
  },
  {
    tag: "Bot / 文件 / 其他任務",
    title: "先用模板把需求講完整",
    summary: "不確定要用哪個技能時，先用一般任務模板；要回檔、修 bot、做摘要，就再往下找對應技能。",
    jump: "#templates",
    action: "直接抄模板"
  }
];

const tgGuideItems = [
  {
    step: "1",
    title: "停止所有工作：STOP",
    summary: "當龍蝦卡住、做錯方向，或你要整批暫停時，直接輸入「STOP」。這會停下目前任務，不用先講一大段。"
  },
  {
    step: "2",
    title: "指令和內容一起送",
    summary: "上傳照片、檔案或截圖時，請同時在下方輸入欄寫明任務內容，一起送出。不要只丟素材不講要做什麼。"
  },
  {
    step: "3",
    title: "停滯就回覆「繼續」",
    summary: "如果長時間沒完成，請長按原本那則任務，選「回覆」，再輸入「繼續」。這樣最容易接回同一個工作。"
  },
  {
    step: "4",
    title: "有素材要明確標示",
    summary: "如果這輪真的有素材，直接寫「本次素材」「參考圖」再附圖；沒有標示時，系統就應視為這輪沒有素材。"
  },
  {
    step: "5",
    title: "新任務就重新講完整",
    summary: "如果不是延續上一件事，請直接重講完整需求，不要只丟「這個、上一張、照剛剛」。這樣最不容易混到舊任務。"
  }
];

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

const talkStyleItems = [
  {
    title: "主人怎麼下",
    summary: "直接講任務、成品、規格、限制。像是「wbs 做成公開網站」、「image2 API 先給確認清單」、「不要混舊素材」。"
  },
  {
    title: "TGBOT 怎麼回",
    summary: "先講結論，再補原因、做法、必要注意事項。不能只回收到、稍後回報、正在處理。"
  },
  {
    title: "什麼叫正確完成",
    summary: "不是開始做了，而是檔案、網址、圖片、部署或同一個 Telegram 交付真的成立。"
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
    summary: "修改真實網站檔案，完成手機與桌機驗證，再推送並確認公開網址是最新版。", output: "公開網址＋可維護的網站原始檔",
    formula: "wbs 更新／建立 ___ 網站。\n內容：___。\n規格：繁體中文，手機與桌機都要清楚可用。\n功能：___。\n完成標準：本機驗證、公開部署，並確認公開網址顯示最新版。"
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
    name: "技能與記憶交接", category: "系統", trigger: "打包技能、記憶、工作流、交接 Codex／OC",
    summary: "整理技能、記憶、安裝教學、測試方式與安全排除，製作可一次學會的交接包。", output: "含日期的 ZIP 教學包",
    formula: "打包 ___ 技能／記憶／工作流，交給其他 Codex／OpenClaw 學習。\n範圍：___。\n要包含：安裝教學、觸發詞、完整流程、測試題、安全規則。\n禁止包含：密碼、Token、Cookie、登入資料與原始紀錄。"
  },
  {
    name: "幣安 Coin 研究", category: "研究", trigger: "幣安 coin、查 coin、合約地址、meme coin",
    summary: "核對鏈與合約地址，研究市場、持倉、風險、流動性與可疑訊號。", output: "繁體中文研究結論與風險判斷",
    formula: "幣安 coin 研究。\n幣種／合約地址：___。\n鏈：___。\n要查：市場表現、持倉、流動性、合約風險、聰明錢。\n完成標準：先給結論，再附依據與風險提醒。"
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

function renderTaskMap() {
  const container = $("#taskMapGrid");
  container.innerHTML = taskMapItems
    .map(
      (item) => `
        <article class="route-card">
          <span class="tag">${escapeHtml(item.tag)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.summary)}</p>
          <a href="${escapeHtml(item.jump)}" class="route-link">${escapeHtml(item.action)}</a>
        </article>
      `
    )
    .join("");
}

function renderTgGuide() {
  const container = $("#tgGuideGrid");
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

function renderTalkStyle() {
  const container = $("#talkStyleGrid");
  container.innerHTML = talkStyleItems
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

function renderDialogues() {
  const container = $("#dialogueGrid");
  container.innerHTML = dialogueExamples
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

function renderFlow() {
  const container = $("#flowTimeline");
  if (!container) return;
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
    const haystack = [skill.name, skill.category, skill.summary, skill.useCase, buildSkillFormula(skill)].join(" ").toLowerCase();
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
  if (!normalized) return workflows;
  return workflows.filter((workflow) => {
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
    <p>顯示 <strong>${visibleWorkflows.length}</strong> 條工作流；每條都包含觸發方式、執行重點、成品與可直接使用的公式。</p>
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

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-copy-target]");
    if (!button) return;
    const target = document.getElementById(button.getAttribute("data-copy-target"));
    if (!target) return;
    const defaultLabel = button.getAttribute("data-copy-label") || "複製模板";
    const text = target.textContent.trim();
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
  renderTemplates();
  renderTgGuide();
  renderFormula();
  renderTalkStyle();
  renderDialogues();
  renderFlow();
  renderCategoryFilters();
  renderSkills();
  renderWorkflows();
  bindEvents();
}

init();
