param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot),
  [ValidateSet("lanxi", "shami")]
  [string]$Target = "lanxi",
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

$signalPath = Join-Path $backupRoot "dashboard_force_stop_$stamp.json"
$latestSignalPath = Join-Path $backupRoot "dashboard_force_stop_latest.json"
$botPauseSignalPath = Join-Path $BotRoot "dashboard_force_stop_signal.json"
$statusPath = Join-Path $SiteRoot "runtime-status.json"
$statusScript = Join-Path $PSScriptRoot "update-runtime-status.ps1"
$stoppedTasks = New-Object System.Collections.Generic.List[string]
$disabledTasks = New-Object System.Collections.Generic.List[string]
$taskWarnings = New-Object System.Collections.Generic.List[string]
$interruptedRequests = 0
$stoppedProcesses = 0

function Stop-DashboardTask {
  param([string]$TaskName, [bool]$DisableAfterStop = $true)
  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if (-not $task) { return }
  if ($task.State -eq "Running") {
    try {
      Stop-ScheduledTask -TaskName $TaskName -ErrorAction Stop
      $stoppedTasks.Add($TaskName)
    } catch {
      $taskWarnings.Add("$TaskName 停止未完成")
    }
  }
  if ($DisableAfterStop) {
    try {
      Disable-ScheduledTask -TaskName $TaskName -ErrorAction Stop | Out-Null
      $disabledTasks.Add($TaskName)
    } catch {
      $taskWarnings.Add("$TaskName 停用權限不足")
    }
  }
}

function Set-TelegramRequestsInterrupted {
  $requestPath = Join-Path $BotRoot "telegram_request_status.json"
  if (-not (Test-Path -LiteralPath $requestPath)) { return 0 }
  try {
    $data = Get-Content -LiteralPath $requestPath -Encoding UTF8 -Raw | ConvertFrom-Json
    $count = 0
    foreach ($property in $data.PSObject.Properties) {
      $record = $property.Value
      if (-not $record -or -not ($record.status -in @("queued", "running", "ready_to_send", "sending"))) { continue }
      $record.status = "interrupted"
      $record.updated_at = [int64]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
      $record.interrupted_reason = "主人從儀表盤對蝦咩送出強制停止。"
      $count += 1
    }
    if ($count -gt 0) {
      $json = $data | ConvertTo-Json -Depth 8
      [System.IO.File]::WriteAllText($requestPath, $json + [Environment]::NewLine, $utf8NoBom)
    }
    return $count
  } catch {
    return 0
  }
}

function Stop-RunningCodexWorkers {
  $count = 0
  try {
    $workers = Get-CimInstance Win32_Process | Where-Object {
      $commandLine = [string]$_.CommandLine
      if (-not $commandLine) { return $false }
      if ($_.ProcessId -eq $PID) { return $false }
      if ($commandLine -match "codex_bot\.py|server\.js|watch_codex_bot|run_codex_bot") { return $false }
      return $commandLine -match "(^|\s)(codex|codex\.exe)(\s|$)"
    }
    foreach ($worker in $workers) {
      Stop-Process -Id $worker.ProcessId -Force -ErrorAction SilentlyContinue
      $count += 1
    }
  } catch {
    return $count
  }
  return $count
}

if ($Target -eq "lanxi") {
  foreach ($name in @("OpenClaw Watchdog", "OpenClaw Gateway")) {
    Stop-DashboardTask -TaskName $name -DisableAfterStop $true
  }
} else {
  $interruptedRequests = Set-TelegramRequestsInterrupted
  $stoppedProcesses = Stop-RunningCodexWorkers
  foreach ($name in @("Codex Telegram Bot Watchdog Hourly", "OpenClaw_CodexBot_HourlyHealth")) {
    Stop-DashboardTask -TaskName $name -DisableAfterStop $false
  }
}

$payload = [ordered]@{
  action = "force-stop"
  target = $Target
  createdAt = (Get-Date).ToString("o")
  siteRoot = $SiteRoot
  stoppedTasks = @($stoppedTasks)
  disabledTasks = @($disabledTasks)
  warnings = @($taskWarnings)
  interruptedTelegramRequests = $interruptedRequests
  stoppedCodexWorkers = $stoppedProcesses
  scope = if ($Target -eq "lanxi") { "lanxi OpenClaw automation only" } else { "shami TGBOT current work pause/interrupt" }
}

$json = $payload | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($signalPath, $json + [Environment]::NewLine, $utf8NoBom)
[System.IO.File]::WriteAllText($latestSignalPath, $json + [Environment]::NewLine, $utf8NoBom)
if ($Target -eq "shami" -and (Test-Path -LiteralPath $BotRoot)) {
  [System.IO.File]::WriteAllText($botPauseSignalPath, $json + [Environment]::NewLine, $utf8NoBom)
}

if (Test-Path -LiteralPath $statusScript) {
  try {
    & $statusScript -SiteRoot $SiteRoot -OutputPath $statusPath | Out-Null
  } catch {
    $taskWarnings.Add("狀態快照刷新未完成")
  }
}

if ($Target -eq "lanxi") {
  $changed = @(@($stoppedTasks + $disabledTasks) | Select-Object -Unique)
  $warningText = if ($taskWarnings.Count -gt 0) { "；" + (($taskWarnings | Select-Object -Unique) -join "、") } else { "" }
  if ($changed.Count -gt 0) {
    "已強制停止嵐熙：已處理 " + ($changed -join "、") + "$warningText。蝦咩 TGBOT 沒有被停止。"
  } else {
    "已送出嵐熙強制停止；目前沒有找到正在執行的嵐熙排程$warningText。蝦咩 TGBOT 沒有被停止。"
  }
} else {
  $warningText = if ($taskWarnings.Count -gt 0) { "；" + (($taskWarnings | Select-Object -Unique) -join "、") } else { "" }
  "已強制停止蝦咩：已中斷 Telegram 執行中任務 $interruptedRequests 筆，停止 Codex 子工作 $stoppedProcesses 個，並寫入 TGBOT 暫停訊號$warningText。嵐熙 OpenClaw 沒有被停止。"
}
