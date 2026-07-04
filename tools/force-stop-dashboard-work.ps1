param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = "C:\Users\max\Desktop\榫嶈潶瑷樻喍\dashboard-control-actions"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$signalPath = Join-Path $backupRoot "dashboard_force_stop_$stamp.json"
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
}

$payload | ConvertTo-Json -Depth 4 | Set-Content -Path $signalPath -Encoding UTF8

if ($task) {
  "已強制停止：今晚儀表盤自動升級排程已停止並停用。"
} else {
  "已送出強制停止訊號：未找到今晚儀表盤自動升級排程。"
}
