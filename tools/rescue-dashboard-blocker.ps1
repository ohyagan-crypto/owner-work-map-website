param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot),
  [string]$BotRoot = "C:\Users\max\tg-openai-bot"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = "C:\Users\max\Desktop\龍蝦記憶\dashboard-control-actions"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$signalPath = Join-Path $backupRoot "dashboard_rescue_$stamp.json"
$latestSignalPath = Join-Path $backupRoot "dashboard_rescue_latest.json"
$statusPath = Join-Path $SiteRoot "runtime-status.json"
$statusScript = Join-Path $PSScriptRoot "update-runtime-status.ps1"
$healthScript = Join-Path $BotRoot "auto_health_check.ps1"
$heartbeatPath = Join-Path $BotRoot "codex_bot_heartbeat.json"
$botSignalPath = Join-Path $BotRoot "dashboard_rescue_signal.json"

$startedTasks = New-Object System.Collections.Generic.List[string]
$enabledTasks = New-Object System.Collections.Generic.List[string]
$alreadyRunning = New-Object System.Collections.Generic.List[string]
$unavailableTasks = New-Object System.Collections.Generic.List[string]
$healthActions = New-Object System.Collections.Generic.List[string]

function Get-TelegramHeartbeatSummary {
  if (-not (Test-Path -LiteralPath $heartbeatPath)) {
    return [ordered]@{
      ok = $false
      label = "未讀到 TGBOT 心跳檔"
      ageSeconds = $null
      phase = ""
      activeRequests = $null
      pid = $null
    }
  }

  try {
    $heartbeat = Get-Content -LiteralPath $heartbeatPath -Encoding UTF8 -Raw | ConvertFrom-Json
    $timestamp = [int64][math]::Round([double]$heartbeat.timestamp)
    $unixEpoch = [DateTime]::SpecifyKind([DateTime]"1970-01-01T00:00:00", [DateTimeKind]::Utc)
    $nowSeconds = [int64][Math]::Floor(([DateTime]::UtcNow - $unixEpoch).TotalSeconds)
    $ageSeconds = [Math]::Max(0, [int]($nowSeconds - $timestamp))
    $propertyNames = @($heartbeat.PSObject.Properties.Name)
    $activeRequests = if ($propertyNames -contains "active_requests") { $heartbeat.active_requests } else { $null }
    $phase = if ($propertyNames -contains "phase") { [string]$heartbeat.phase } else { "" }
    $botPid = if ($propertyNames -contains "pid") { $heartbeat.pid } else { $null }
    $isFresh = $ageSeconds -le 120
    return [ordered]@{
      ok = $isFresh
      label = if ($isFresh) { "TGBOT 心跳正常，已聯通救援鏈路" } else { "TGBOT 心跳過舊，需要看門排程接手" }
      ageSeconds = $ageSeconds
      phase = $phase
      activeRequests = $activeRequests
      pid = $botPid
    }
  } catch {
    return [ordered]@{
      ok = $false
      label = "TGBOT 心跳讀取失敗"
      ageSeconds = $null
      phase = ""
      activeRequests = $null
      pid = $null
    }
  }
}

$candidateTasks = @(
  "OpenClaw Watchdog",
  "OpenClaw Gateway",
  "Lanxin Login Check Every 2 Hours",
  "TGBot OpenClaw Maintenance Hourly",
  "Codex Telegram Bot Watchdog Hourly",
  "Codex Telegram Bot Watchdog Startup",
  "OpenClaw_CodexBot_HourlyHealth",
  "OwnerWorkMapDashboardAutoUpgrade30m"
)

foreach ($taskName in $candidateTasks) {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if (-not $task) {
    $unavailableTasks.Add($taskName)
    continue
  }

  if ($task.State -eq "Disabled") {
    Enable-ScheduledTask -TaskName $taskName | Out-Null
    $enabledTasks.Add($taskName)
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  }

  if ($task.State -eq "Ready") {
    Start-ScheduledTask -TaskName $taskName
    $startedTasks.Add($taskName)
  } elseif ($task.State -eq "Running") {
    $alreadyRunning.Add($taskName)
  }
}

if (Test-Path -LiteralPath $statusScript) {
  & $statusScript -SiteRoot $SiteRoot -OutputPath $statusPath | Out-Null
}

if (Test-Path -LiteralPath $healthScript) {
  try {
    & $healthScript | Out-Null
    $healthActions.Add("TGBOT 自動健康檢查")
  } catch {
    $healthActions.Add("TGBOT 自動健康檢查未完成")
  }
}

$heartbeatSummary = Get-TelegramHeartbeatSummary

$payload = [ordered]@{
  action = "rescue"
  createdAt = (Get-Date).ToString("o")
  siteRoot = $SiteRoot
  behavior = "refresh status, re-enable recoverable tasks, start ready watchdog tasks, and verify TGBOT heartbeat without force-stopping current work"
  startedTasks = @($startedTasks)
  enabledTasks = @($enabledTasks)
  alreadyRunning = @($alreadyRunning)
  unavailableTasks = @($unavailableTasks)
  healthActions = @($healthActions)
  telegramHeartbeat = $heartbeatSummary
}

$json = $payload | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($signalPath, $json + [Environment]::NewLine, $utf8NoBom)
[System.IO.File]::WriteAllText($latestSignalPath, $json + [Environment]::NewLine, $utf8NoBom)
if (Test-Path -LiteralPath $BotRoot) {
  [System.IO.File]::WriteAllText($botSignalPath, $json + [Environment]::NewLine, $utf8NoBom)
}

$changed = @($enabledTasks + $startedTasks)
$heartbeatText = if ($heartbeatSummary.ok) {
  "TGBOT 心跳 $($heartbeatSummary.ageSeconds) 秒前，執行中任務 $($heartbeatSummary.activeRequests)，救援鏈路已聯通。"
} else {
  "$($heartbeatSummary.label)。"
}

if ($changed.Count -gt 0) {
  "已送出卡點救援：已刷新狀態，並啟動或恢復可續作排程：" + ($changed -join "、") + "。$heartbeatText 沒有強制停止目前作業。"
} else {
  "已送出卡點救援：已刷新狀態，目前可續作排程已在待命或運作中。$heartbeatText 沒有強制停止目前作業。"
}
