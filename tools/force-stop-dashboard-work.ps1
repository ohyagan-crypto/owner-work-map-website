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

$signalPath = Join-Path $backupRoot "dashboard_force_stop_$stamp.json"
$latestSignalPath = Join-Path $backupRoot "dashboard_force_stop_latest.json"
$taskName = "OwnerWorkMapDashboardAutoUpgrade30m"
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
$stopped = $false
$disabled = $false

if ($task) {
  if ($task.State -eq "Running") {
    Stop-ScheduledTask -TaskName $taskName
    $stopped = $true
  }
  Disable-ScheduledTask -TaskName $taskName | Out-Null
  $disabled = $true
}

$payload = [ordered]@{
  action = "force-stop"
  createdAt = (Get-Date).ToString("o")
  siteRoot = $SiteRoot
  taskName = $taskName
  stoppedRunningTask = $stopped
  disabledTask = $disabled
  scope = "dashboard auto-upgrade schedule only"
}

$json = $payload | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($signalPath, $json + [Environment]::NewLine, $utf8NoBom)
[System.IO.File]::WriteAllText($latestSignalPath, $json + [Environment]::NewLine, $utf8NoBom)

if ($task) {
  "已強制停止儀表板自動升級排程；主要 Telegram、Codex 與 OpenClaw 作業沒有被關閉。"
} else {
  "已送出強制停止訊號；目前沒有找到儀表板自動升級排程。"
}
