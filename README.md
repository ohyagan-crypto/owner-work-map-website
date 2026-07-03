# 主人 TGBOT 總控台

建立日期：2026-07-03

這是 tgbot 的公開儀表盤網站，用來集中查看：

- Telegram 任務目前狀態
- 回覆與檔案交付規則
- 已安裝技能與記憶的公開摘要
- 維護檢查流程
- GitHub Pages 公開部署狀態

公開頁只放整理後的摘要，不放帳密、敏感憑證、登入資料、原始紀錄或內部偵錯資訊。

## 本機預覽

```powershell
node server.js
```

預設網址：

```text
http://127.0.0.1:4179/
```

## 更新狀態快照

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\update-runtime-status.ps1 -CurrentTask "重新製作 tgbot 儀表盤網站" -NextAction "公開部署完成後回報網址"
```

這會產生 `runtime-status.json`，供 GitHub Pages 讀取公開狀態快照。
