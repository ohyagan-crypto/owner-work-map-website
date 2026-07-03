# 主人工作總控台

建立日期：2026-07-02

這是一個公開工作總覽網站，用來集中查看：

- 目前蝦咩 TGBOT / 嵐熙 OpenClaw 運作狀態
- 今日可驗證 token 使用量
- 1 秒級自動刷新與手動刷新特效
- 已完成的 Roadmap 項目
- 任務型 SOP 圖書館
- 技能主力版與歷史版分流
- 安全邊界與交付規則

## 更新狀態資料

從網站資料夾執行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\update-runtime-status.ps1
```

會從本機心跳、Telegram 請求狀態、OpenClaw 摘要與 token 統計產生 `runtime-status.json`。

## 安全說明

網站只放整理後的總覽資料，不包含帳號密碼、API key、Telegram token、cookie、瀏覽器 profile、credential store、原始 log 或偵錯紀錄。
