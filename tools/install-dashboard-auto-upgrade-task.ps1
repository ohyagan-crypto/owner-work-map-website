param(
  [string]$TaskName = "OwnerWorkMapDashboardAutoUpgrade30m",
  [datetime]$StartAt = (Get-Date -Hour 23 -Minute 30 -Second 0),
  [int]$IntervalMinutes = 30
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Split-Path -Parent $PSScriptRoot)).Path
$scriptPath = Join-Path $PSScriptRoot "dashboard-auto-upgrade.ps1"
$powerShellPath = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"

if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Auto-upgrade script not found: $scriptPath"
}

if ($StartAt -le (Get-Date)) {
  $StartAt = $StartAt.AddDays(1)
}

$action = New-ScheduledTaskAction `
  -Execute $powerShellPath `
  -Argument ("-NoProfile -ExecutionPolicy Bypass -File `"{0}`" -RepoRoot `"{1}`"" -f $scriptPath, $repoRoot) `
  -WorkingDirectory $repoRoot

$trigger = New-ScheduledTaskTrigger `
  -Once `
  -At $StartAt `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -WakeToRun `
  -MultipleInstances IgnoreNew

$principal = New-ScheduledTaskPrincipal `
  -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive `
  -RunLevel Limited

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Force | Out-Null

Get-ScheduledTask -TaskName $TaskName | Out-Null
Write-Output ("installed {0}; start {1}; interval {2} minutes" -f $TaskName, $StartAt.ToString("yyyy-MM-dd HH:mm:ss"), $IntervalMinutes)
