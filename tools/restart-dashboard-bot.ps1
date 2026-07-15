param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot),
  [ValidateSet("shami", "mengzi", "tg3")]
  [string]$Target = "shami",
  [ValidateSet("safe", "force")]
  [string]$Mode = "safe",
  [string]$Reason = "dashboard control",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$targets = @{
  shami = [ordered]@{ Label = "蝦咩（TG1）"; BotRoot = "C:\Users\max\tg-openai-bot"; StopScript = "stop_bot.ps1"; WatchdogTask = "Codex Telegram Bot Watchdog Hourly"; OtherBots = "TG2 與 TG3" }
  mengzi = [ordered]@{ Label = "林孟姿（TG2）"; BotRoot = "C:\Users\max\tg-openai-bot-2"; StopScript = "stop_bot_2.ps1"; WatchdogTask = "Codex Telegram Bot 2 Watchdog Hourly"; OtherBots = "TG1 與 TG3" }
  tg3 = [ordered]@{ Label = "嵐熙（TG3）"; BotRoot = "C:\Users\max\tg-openai-bot-3"; StopScript = "stop_bot_3.ps1"; WatchdogTask = "Codex Telegram Bot 3 Watchdog Hourly"; OtherBots = "TG1 與 TG2" }
}

$config = $targets[$Target]
$heartbeatPath = Join-Path $config.BotRoot "codex_bot_heartbeat.json"
$stopScriptPath = Join-Path $config.BotRoot $config.StopScript
$signalDir = Join-Path $SiteRoot "output"
$signalPath = Join-Path $signalDir "restart-$Target-latest.json"
if (-not (Test-Path -LiteralPath $config.BotRoot)) { throw "找不到指定機器人的資料夾。" }
if (-not (Test-Path -LiteralPath $stopScriptPath)) { throw "找不到指定機器人的停止腳本。" }
if (-not (Get-ScheduledTask -TaskName $config.WatchdogTask -ErrorAction SilentlyContinue)) { throw "找不到指定機器人的啟動排程。" }

$oldHeartbeat = $null
if (Test-Path -LiteralPath $heartbeatPath) { try { $oldHeartbeat = Get-Content -LiteralPath $heartbeatPath -Raw -Encoding UTF8 | ConvertFrom-Json } catch {} }
$oldStartedAt = if ($oldHeartbeat -and $oldHeartbeat.started_at) { [double]$oldHeartbeat.started_at } else { 0 }
$oldPid = if ($oldHeartbeat -and $oldHeartbeat.pid) { [int]$oldHeartbeat.pid } else { 0 }
if ($DryRun) { "重啟檢查通過：$($config.Label) 的停止腳本、看門排程與心跳路徑皆可用；未實際中斷服務。"; exit 0 }

& $stopScriptPath | Out-Null
Start-Sleep -Seconds 2
Start-ScheduledTask -TaskName $config.WatchdogTask
$deadline = (Get-Date).AddSeconds(35)
$newHeartbeat = $null
do {
  Start-Sleep -Seconds 2
  if (Test-Path -LiteralPath $heartbeatPath) {
    try {
      $candidate = Get-Content -LiteralPath $heartbeatPath -Raw -Encoding UTF8 | ConvertFrom-Json
      $fresh = $candidate.timestamp -and (([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() - [double]$candidate.timestamp) -le 20)
      $newInstance = ($candidate.started_at -and [double]$candidate.started_at -gt $oldStartedAt) -or ($candidate.pid -and [int]$candidate.pid -ne $oldPid)
      if ($fresh -and $newInstance) { $newHeartbeat = $candidate; break }
    } catch {}
  }
} while ((Get-Date) -lt $deadline)
if (-not $newHeartbeat) { throw "$($config.Label) 已送出重啟，但在等待時間內沒有確認到新的心跳。" }

New-Item -ItemType Directory -Path $signalDir -Force | Out-Null
$payload = [ordered]@{ action = "restart"; mode = $Mode; reason = $Reason; target = $Target; label = $config.Label; createdAt = (Get-Date).ToString("o"); oldPid = $oldPid; newPid = $newHeartbeat.pid; startedAt = $newHeartbeat.started_at_utc; heartbeatAt = $newHeartbeat.timestamp_utc; otherBotsUntouched = $config.OtherBots }
[System.IO.File]::WriteAllText($signalPath, ($payload | ConvertTo-Json -Depth 4) + [Environment]::NewLine, $utf8NoBom)
$statusScript = Join-Path $PSScriptRoot "update-runtime-status.ps1"
if (Test-Path -LiteralPath $statusScript) { & $statusScript -SiteRoot $SiteRoot -OutputPath (Join-Path $SiteRoot "runtime-status.json") | Out-Null }
"$($config.Label) 已重啟完成並恢復心跳；$($config.OtherBots) 沒有被中斷。"

