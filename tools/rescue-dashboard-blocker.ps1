param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot),
  [string]$BotRoot = "C:\Users\max\tg-openai-bot",
  [ValidateSet("lanxi", "shami", "mengzi", "tg3")]
  [string]$Target = "lanxi",
  [string]$Bot3Root = "C:\Users\max\tg-openai-bot-3"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom

if ($Target -eq "mengzi" -and $BotRoot -eq "C:\Users\max\tg-openai-bot") {
  $BotRoot = "C:\Users\max\tg-openai-bot-2"
}
if ($Target -eq "tg3") {
  $BotRoot = $Bot3Root
}

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

function Start-RecoverableTask {
  param([string]$TaskName)
  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if (-not $task) {
    $unavailableTasks.Add($TaskName)
    return
  }

  if ($task.State -eq "Disabled") {
    Enable-ScheduledTask -TaskName $TaskName | Out-Null
    $enabledTasks.Add($TaskName)
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  }

  if ($task.State -eq "Ready") {
    Start-ScheduledTask -TaskName $TaskName
    $startedTasks.Add($TaskName)
  } elseif ($task.State -eq "Running") {
    $alreadyRunning.Add($TaskName)
  }
}

$candidateTasks = if ($Target -eq "lanxi") {
  @("OpenClaw Watchdog", "OpenClaw Gateway")
} elseif ($Target -eq "mengzi") {
  @("Codex Telegram Bot 2 Watchdog Hourly", "Codex Telegram Bot 2 Watchdog Startup")
} elseif ($Target -eq "tg3") {
  @("Codex Telegram Bot 3 Watchdog Hourly", "Codex Telegram Bot 3 Watchdog Startup")
} else {
  @("Codex Telegram Bot Watchdog Hourly", "Codex Telegram Bot Watchdog Startup", "TGBot OpenClaw Maintenance Hourly", "OpenClaw_CodexBot_HourlyHealth")
}

foreach ($taskName in $candidateTasks) {
  Start-RecoverableTask -TaskName $taskName
}

if (Test-Path -LiteralPath $statusScript) {
  & $statusScript -SiteRoot $SiteRoot -OutputPath $statusPath | Out-Null
}

if (($Target -eq "shami" -or $Target -eq "mengzi" -or $Target -eq "tg3") -and (Test-Path -LiteralPath $healthScript)) {
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
  target = $Target
  createdAt = (Get-Date).ToString("o")
  siteRoot = $SiteRoot
  behavior = if ($Target -eq "lanxi") { "refresh lanxi status and restart recoverable OpenClaw schedules only" } elseif ($Target -eq "mengzi") { "refresh mengzi TGBOT2 status and restart recoverable bot2 schedules only" } elseif ($Target -eq "tg3") { "refresh TG3 status and restart recoverable bot3 schedules only" } else { "refresh shami TGBOT status, run health check, and restart recoverable bot schedules only" }
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
if (($Target -eq "shami" -or $Target -eq "mengzi" -or $Target -eq "tg3") -and (Test-Path -LiteralPath $BotRoot)) {
  [System.IO.File]::WriteAllText($botSignalPath, $json + [Environment]::NewLine, $utf8NoBom)
}

$changed = @($enabledTasks + $startedTasks)
$heartbeatText = if ($heartbeatSummary.ok) {
  "TGBOT 心跳 $($heartbeatSummary.ageSeconds) 秒前，執行中任務 $($heartbeatSummary.activeRequests)，救援鏈路已聯通。"
} else {
  "$($heartbeatSummary.label)。"
}

if ($Target -eq "lanxi") {
  if ($changed.Count -gt 0) {
    "已送出嵐熙卡點救援：已刷新狀態，並啟動或恢復 " + ($changed -join "、") + "。蝦咩 TGBOT 沒有被停止。"
  } else {
    "已送出嵐熙卡點救援：已刷新狀態，嵐熙可續作排程目前已在待命或運作中。蝦咩 TGBOT 沒有被停止。"
  }
} elseif ($Target -eq "mengzi") {
  if ($changed.Count -gt 0) {
    "已送出林孟姿卡點救援：已啟動或恢復 " + ($changed -join "、") + "。$heartbeatText 蝦咩與嵐熙沒有被停止。"
  } else {
    "已送出林孟姿卡點救援：TGBOT2 可續作排程目前已在待命或運作中。$heartbeatText 蝦咩與嵐熙沒有被停止。"
  }
} elseif ($Target -eq "tg3") {
  if ($changed.Count -gt 0) {
    "已送出 TG3 卡點救援：已啟動或恢復 " + ($changed -join "、") + "。$heartbeatText TG1、TG2 與嵐熙沒有被停止。"
  } else {
    "已送出 TG3 卡點救援：TG3 可續作排程目前已在待命或運作中。$heartbeatText TG1、TG2 與嵐熙沒有被停止。"
  }
} else {
  if ($changed.Count -gt 0) {
    "已送出蝦咩卡點救援：已啟動或恢復 " + ($changed -join "、") + "。$heartbeatText 嵐熙 OpenClaw 沒有被停止。"
  } else {
    "已送出蝦咩卡點救援：TGBOT 可續作排程已在待命或運作中。$heartbeatText 嵐熙 OpenClaw 沒有被停止。"
  }
}
