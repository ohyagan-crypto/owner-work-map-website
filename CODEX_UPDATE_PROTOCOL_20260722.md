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

## 發佈到教戰網

GitHub Pages 本身是靜態網站，瀏覽器上的「上傳前檢查」不會直接改寫公開站。收到新的 `.bsmf` 後，在網站資料夾執行：

~~~powershell
powershell -ExecutionPolicy Bypass -File .\tools\publish-codex-update.ps1 -InputFile C:\path\codex-update.bsmf -Title "本次技能與記憶更新" -Description "更新技能、記憶與工作流"
~~~

工具會檢查格式、重新計算大小與 SHA-256，將檔案放到 `updates/` 並更新 `data/codex-updates.json`。完成後提交並部署網站，其他 Codex 就能在更新中心輸入 `bsmf` 取得下載權限。

真正的保護依賴 `.bsmf` 內部的 AES-256-GCM 加密；網站上的密碼欄只是避免一般訪客誤觸下載，不能當成伺服器端登入權限。
