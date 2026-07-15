param(
    [string]$TaskName = "OwnerWorkMapDashboardLiveHealthHourly",
    [int]$IntervalMinutes = 60,
    [int]$MinuteOfHour = 27,
    [int]$Port = 4206,
    [string]$PublicSiteUrl = "https://ohyagan-crypto.github.io/owner-work-map-website/"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Split-Path -Parent $PSScriptRoot)).Path
$scriptPath = Join-Path $PSScriptRoot "check-public-site-health.ps1"
$powerShellPath = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"

if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Live health script not found: $scriptPath"
}

$action = New-ScheduledTaskAction `
    -Execute $powerShellPath `
    -Argument ("-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"{0}`" -SiteRoot `"{1}`" -PublicSiteUrl `"{2}`" -Port {3} -Repair" -f $scriptPath, $repoRoot, $PublicSiteUrl, $Port) `
    -WorkingDirectory $repoRoot

$now = Get-Date
$nextRun = Get-Date -Year $now.Year -Month $now.Month -Day $now.Day -Hour $now.Hour -Minute $MinuteOfHour -Second 0
if ($nextRun -le $now) { $nextRun = $nextRun.AddHours(1) }

$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At $nextRun

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

Write-Output ("installed {0}; every hour at minute {1}; port {2}; site {3}" -f $TaskName, $MinuteOfHour, $Port, $PublicSiteUrl)
