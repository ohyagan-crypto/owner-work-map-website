param(
    [string]$TaskName = "OwnerWorkMapDashboardLiveHealth30m",
    [int]$IntervalMinutes = 30,
    [int]$Port = 4206
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Split-Path -Parent $PSScriptRoot)).Path
$scriptPath = Join-Path $PSScriptRoot "check-live-status-health.ps1"
$powerShellPath = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"

if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Live health script not found: $scriptPath"
}

$action = New-ScheduledTaskAction `
    -Execute $powerShellPath `
    -Argument ("-NoProfile -ExecutionPolicy Bypass -File `"{0}`" -SiteRoot `"{1}`" -Port {2} -Repair -PushConfig" -f $scriptPath, $repoRoot, $Port) `
    -WorkingDirectory $repoRoot

$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(1)

$trigger.Repetition = New-CimInstance `
    -Namespace root/Microsoft/Windows/TaskScheduler `
    -ClassName MSFT_TaskRepetitionPattern `
    -ClientOnly `
    -Property @{
        Interval = ("PT{0}M" -f $IntervalMinutes)
        Duration = "P3650D"
        StopAtDurationEnd = $false
    }

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
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

Write-Output ("installed {0}; interval {1} minutes; port {2}" -f $TaskName, $IntervalMinutes, $Port)
