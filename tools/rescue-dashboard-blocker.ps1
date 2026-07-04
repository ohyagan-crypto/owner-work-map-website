param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = "C:\Users\max\Desktop\榫嶈潶瑷樻喍\dashboard-control-actions"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$signalPath = Join-Path $backupRoot "dashboard_rescue_$stamp.json"
$statusPath = Join-Path $SiteRoot "runtime-status.json"
$statusScript = Join-Path $PSScriptRoot "update-runtime-status.ps1"

$startedTasks = @()
$candidateTasks = @(
  "OpenClawWatchdog",
  "LanxinLoginCheck",
  "LanxinTwoHourLoginCheck"
)

foreach ($taskName in $candidateTasks) {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($task -and $task.State -eq "Ready") {
    Start-ScheduledTask -TaskName $taskName
    $startedTasks += $taskName
  }
}

if (Test-Path $statusScript) {
  & $statusScript -SiteRoot $SiteRoot -OutputPath $statusPath | Out-Null
}

$payload = [ordered]@{
  action = "rescue"
  createdAt = (Get-Date).ToString("o")
  siteRoot = $SiteRoot
  behavior = "refresh status and start recoverable watchdog tasks without force-stopping work"
  startedTasks = $startedTasks
}

$payload | ConvertTo-Json -Depth 4 | Set-Content -Path $signalPath -Encoding UTF8

if ($startedTasks.Count -gt 0) {
  "已送出卡點解救：已重新整理狀態，並啟動可恢復排程：$($startedTasks -join '、')。沒有強制停止。"
} else {
  "已送出卡點解救：已重新整理狀態並留下續作救援訊號。沒有強制停止。"
}
