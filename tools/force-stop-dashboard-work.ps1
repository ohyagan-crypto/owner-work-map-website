param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot),
  [ValidateSet("lanxi", "shami", "mengzi", "tg3")]
  [string]$Target = "lanxi",
  [string]$BotRoot = "C:\Users\max\tg-openai-bot",
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
$pauseUntil = $null

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
      $record.interrupted_reason = if ($Target -eq "mengzi") { "主人從儀表盤對林孟姿送出強制停止。" } elseif ($Target -eq "tg3") { "主人從儀表盤對 TG3 送出強制停止。" } else { "主人從儀表盤對蝦咩送出強制停止。" }
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
} elseif ($Target -eq "mengzi") {
  $pauseUntil = (Get-Date).AddMinutes(15).ToString("o")
  $interruptedRequests = Set-TelegramRequestsInterrupted
  $stoppedProcesses = Stop-RunningCodexWorkers
  foreach ($name in @("Codex Telegram Bot 2 Watchdog Hourly", "Codex Telegram Bot 2 Watchdog Startup")) {
    Stop-DashboardTask -TaskName $name -DisableAfterStop $false
  }
} elseif ($Target -eq "tg3") {
  $pauseUntil = (Get-Date).AddMinutes(15).ToString("o")
  $interruptedRequests = Set-TelegramRequestsInterrupted
  $stoppedProcesses = Stop-RunningCodexWorkers
  foreach ($name in @("Codex Telegram Bot 3 Watchdog Hourly", "Codex Telegram Bot 3 Watchdog Startup")) {
    Stop-DashboardTask -TaskName $name -DisableAfterStop $false
  }
} else {
  $pauseUntil = (Get-Date).AddMinutes(15).ToString("o")
  $interruptedRequests = Set-TelegramRequestsInterrupted
  $stoppedProcesses = Stop-RunningCodexWorkers
  foreach ($name in @("Codex Telegram Bot Watchdog Hourly", "Codex Telegram Bot Watchdog Startup", "OpenClaw_CodexBot_HourlyHealth")) {
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
  paused = if ($Target -eq "shami" -or $Target -eq "mengzi" -or $Target -eq "tg3") { $true } else { $false }
  pauseUntil = $pauseUntil
  scope = if ($Target -eq "lanxi") { "lanxi OpenClaw automation only" } elseif ($Target -eq "mengzi") { "mengzi TGBOT2 current work pause/interrupt" } elseif ($Target -eq "tg3") { "TG3 current work pause/interrupt" } else { "shami TGBOT current work pause/interrupt" }
  behavior = if ($Target -eq "lanxi") { "stop OpenClaw schedules without touching TGBOT" } elseif ($Target -eq "mengzi") { "interrupt Telegram bot2 request records, stop Codex child work, and write the TGBOT2 force-stop signal" } elseif ($Target -eq "tg3") { "interrupt Telegram bot3 request records, stop Codex child work, and write the TG3 force-stop signal" } else { "interrupt Telegram request records, stop Codex child work, and write the TGBOT force-stop signal" }
}

$json = $payload | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($signalPath, $json + [Environment]::NewLine, $utf8NoBom)
[System.IO.File]::WriteAllText($latestSignalPath, $json + [Environment]::NewLine, $utf8NoBom)
if (($Target -eq "shami" -or $Target -eq "mengzi" -or $Target -eq "tg3") -and (Test-Path -LiteralPath $BotRoot)) {
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
} elseif ($Target -eq "mengzi") {
  $warningText = if ($taskWarnings.Count -gt 0) { "；" + (($taskWarnings | Select-Object -Unique) -join "、") } else { "" }
  "已強制停止林孟姿：已中斷 TG2 執行中任務 $interruptedRequests 筆，停止 Codex 子工作 $stoppedProcesses 個，並寫入 TGBOT2 暫停訊號$warningText。蝦咩與嵐熙沒有被停止。"
} elseif ($Target -eq "tg3") {
  $warningText = if ($taskWarnings.Count -gt 0) { "；" + (($taskWarnings | Select-Object -Unique) -join "、") } else { "" }
  "已強制停止 TG3：已中斷 TG3 執行中任務 $interruptedRequests 筆，停止 Codex 子工作 $stoppedProcesses 個，並寫入 TG3 暫停訊號$warningText。TG1、TG2 與嵐熙沒有被停止。"
} else {
  $warningText = if ($taskWarnings.Count -gt 0) { "；" + (($taskWarnings | Select-Object -Unique) -join "、") } else { "" }
  "已強制停止蝦咩：已中斷 Telegram 執行中任務 $interruptedRequests 筆，停止 Codex 子工作 $stoppedProcesses 個，並寫入 TGBOT 暫停訊號$warningText。嵐熙 OpenClaw 沒有被停止。"
}
