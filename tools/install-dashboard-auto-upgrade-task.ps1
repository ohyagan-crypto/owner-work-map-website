param(
  [string]$TaskName = "OwnerWorkMapDashboardAutoUpgrade30m",
  [datetime]$StartAt = (Get-Date).Date.AddDays(1),
  [datetime]$WindowDate = (Get-Date).Date.AddDays(1),
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
  $StartAt = (Get-Date).Date.AddDays(1)
}

$WindowDate = $StartAt.Date

$action = New-ScheduledTaskAction `
  -Execute $powerShellPath `
  -Argument ("-NoProfile -ExecutionPolicy Bypass -File `"{0}`" -RepoRoot `"{1}`" -WindowDate `"{2}`"" -f $scriptPath, $repoRoot, $WindowDate.ToString("yyyy-MM-dd")) `
  -WorkingDirectory $repoRoot

$trigger = New-ScheduledTaskTrigger `
  -Once `
  -At $StartAt

$trigger.Repetition = New-CimInstance `
  -Namespace root/Microsoft/Windows/TaskScheduler `
  -ClassName MSFT_TaskRepetitionPattern `
  -ClientOnly `
  -Property @{
    Interval = ("PT{0}M" -f $IntervalMinutes)
    Duration = "PT9H30M"
    StopAtDurationEnd = $true
  }

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
Write-Output ("installed {0}; one-time start {1}; interval {2} minutes; window {3} 00:00-09:00" -f $TaskName, $StartAt.ToString("yyyy-MM-dd HH:mm:ss"), $IntervalMinutes, $WindowDate.ToString("yyyy-MM-dd"))
