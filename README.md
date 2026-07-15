# TG1 x TG2 x TG3 即時總控台

建立日期：2026-07-02
本次更新：2026-07-03

這是一個公開 GitHub Pages 儀表盤，用來集中查看：

- TG1（蝦咩）即時狀態與任務
- TG2（林孟姿）即時狀態與任務
- TG3（嵐熙）即時狀態與任務
- 三個 Telegram bot 的任務佇列、目前卡點與下一步
- 今日 Codex token 統計
- 監控項目清單與明細
- 已安裝技能包的功能、使用場景與觸發詞
- 常用網站、Telegram、監控與技能路由 SOP

## 更新狀態資料

從網站資料夾執行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\update-runtime-status.ps1
```

腳本會讀取 TG1、TG2、TG3 的本機心跳、Telegram 任務狀態與 token 統計，產生 `runtime-status.json` 供公開頁讀取。

## 本機預覽

```powershell
node .\server.js
```

控制功能預設鎖定。第一次啟動即時服務後，本機操作碼會建立在：

```text
output/dashboard-control-secret.json
```

公開頁輸入 4 位數操作碼後會取得 30 分鐘控制權限。安全重啟會在偵測到執行中任務時排隊，立即重啟才會中斷目前任務；最近操作、原因、結果與新舊程序編號會保留在本機操作紀錄。

預設會在 `http://127.0.0.1:4179/` 提供本機預覽與 `/api/status` 即時狀態 API。
