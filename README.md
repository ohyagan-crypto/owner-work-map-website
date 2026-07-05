# 蝦咩 x 嵐熙即時總控台

建立日期：2026-07-02
本次更新：2026-07-03

這是一個公開 GitHub Pages 儀表盤，用來集中查看：

- 蝦咩 TGBOT 即時狀態
- 嵐熙 OpenClaw 進程與看門排程
- Telegram 任務佇列、目前卡點與下一步
- 今日 Codex token 統計
- 監控項目清單與明細
- 已安裝技能包的功能、使用場景與觸發詞
- 常用網站、Telegram、監控與技能路由 SOP

## 更新狀態資料

從網站資料夾執行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\update-runtime-status.ps1
```

腳本會讀取本機心跳、Telegram 任務狀態、OpenClaw 摘要與 token 統計，產生 `runtime-status.json` 供公開頁讀取。

## 本機預覽

```powershell
node .\server.js
```

預設會在 `http://127.0.0.1:4179/` 提供本機預覽與 `/api/status` 即時狀態 API。
