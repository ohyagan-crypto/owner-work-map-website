param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot)
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

$startedTasks = New-Object System.Collections.Generic.List[string]
$enabledTasks = New-Object System.Collections.Generic.List[string]
$alreadyRunning = New-Object System.Collections.Generic.List[string]
$unavailableTasks = New-Object System.Collections.Generic.List[string]

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

$payload = [ordered]@{
  action = "rescue"
  createdAt = (Get-Date).ToString("o")
  siteRoot = $SiteRoot
  behavior = "refresh status, re-enable recoverable tasks, and start ready watchdog tasks without force-stopping current work"
  startedTasks = @($startedTasks)
  enabledTasks = @($enabledTasks)
  alreadyRunning = @($alreadyRunning)
  unavailableTasks = @($unavailableTasks)
}

$json = $payload | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($signalPath, $json + [Environment]::NewLine, $utf8NoBom)
[System.IO.File]::WriteAllText($latestSignalPath, $json + [Environment]::NewLine, $utf8NoBom)

$changed = @($enabledTasks + $startedTasks)
if ($changed.Count -gt 0) {
  "已送出卡點救援：已刷新狀態，並啟動或恢復可續作排程：" + ($changed -join "、") + "。沒有強制停止目前作業。"
} else {
  "已送出卡點救援：已刷新狀態，目前可續作排程已在待命或運作中。沒有強制停止目前作業。"
}
