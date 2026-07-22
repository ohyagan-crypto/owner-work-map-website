# Codex 更新包協定

本網站的 Codex 更新中心使用 BSMF 更新包傳遞整理後的技能、記憶與工作流。

## 建立更新包

管理端使用 tools/create-codex-update-package.mjs 建立更新包。工具會使用 PBKDF2-SHA256 派生金鑰與 AES-256-GCM 加密，並排除金鑰、Cookie、瀏覽器設定、登入資料、原始 JSONL 與資料庫檔案。

## 其他 Codex 套用

先下載 tools/apply-codex-update.mjs 與 bsmf 更新包，再用密碼 bsmf 乾跑：

~~~powershell
node tools/apply-codex-update.mjs --file .\\codex-update.bsmf --password bsmf --target-root C:\\Users\\你的使用者名稱\\.codex --dry-run
~~~

乾跑通過後移除 --dry-run 正式套用，最後重新啟動 Codex 或目前的 Telegram Bot。

更新包只允許 skills、memories、workflows 與安裝說明；發現敏感資料時必須停止，不可猜測或繞過安全檢查。
