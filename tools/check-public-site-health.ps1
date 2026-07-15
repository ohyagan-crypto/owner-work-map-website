param(
    [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$PublicSiteUrl = "https://ohyagan-crypto.github.io/owner-work-map-website/",
    [int]$Port = 4206,
    [switch]$Repair
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$env:PATH = "C:\Users\max\PortableGit\cmd;C:\Users\max\PortableGit\bin;" + $env:PATH
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "Never"

$SiteRoot = (Resolve-Path -LiteralPath $SiteRoot).Path
$liveHealthScript = Join-Path $PSScriptRoot "check-live-status-health.ps1"
$runtimeStatusScript = Join-Path $PSScriptRoot "update-runtime-status.ps1"
$runtimeStatusPath = Join-Path $SiteRoot "runtime-status.json"
$redeployMarkerPath = Join-Path $SiteRoot "site-health-redeploy.txt"
$reportDir = "C:\Users\max\owner-dashboard-live-logs\public-health"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

function Invoke-WebCheck {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [string[]]$RequiredText = @(),
        [int]$TimeoutSeconds = 15,
        [int]$Attempts = 2
    )

    $lastError = ""
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        try {
            $separator = if ($Url.Contains("?")) { "&" } else { "?" }
            $requestUrl = "{0}{1}health={2}" -f $Url, $separator, [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            $response = Invoke-WebRequest -Uri $requestUrl -UseBasicParsing -TimeoutSec $TimeoutSeconds
            $missing = @($RequiredText | Where-Object { $response.Content -notmatch [regex]::Escape($_) })
            if ([int]$response.StatusCode -eq 200 -and $missing.Count -eq 0 -and $response.Content.Length -gt 50) {
                return [ordered]@{
                    ok = $true
                    url = $Url
                    statusCode = [int]$response.StatusCode
                    contentLength = $response.Content.Length
                    missingText = @()
                    checkedAt = (Get-Date).ToString("o")
                }
            }
            $lastError = "HTTP $($response.StatusCode); missing: $($missing -join ', ')"
        } catch {
            $lastError = $_.Exception.Message
        }

        if ($attempt -lt $Attempts) { Start-Sleep -Seconds 3 }
    }

    return [ordered]@{
        ok = $false
        url = $Url
        statusCode = $null
        contentLength = 0
        missingText = @()
        checkedAt = (Get-Date).ToString("o")
        error = $lastError
    }
}

function Test-RuntimeSnapshot {
    param([Parameter(Mandatory = $true)][string]$Url)

    $webResult = Invoke-WebCheck -Url $Url -RequiredText @('"statusKey"', '"heartbeat"', '"tgbot2"', '"tgbot3"')
    if (-not $webResult.ok) { return $webResult }

    try {
        $separator = if ($Url.Contains("?")) { "&" } else { "?" }
        $content = (Invoke-WebRequest -Uri ("{0}{1}parse={2}" -f $Url, $separator, [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) -UseBasicParsing -TimeoutSec 15).Content.TrimStart([char]0xFEFF)
        $status = $content | ConvertFrom-Json
        $valid = $null -ne $status.heartbeat -and $null -ne $status.tgbot2 -and $null -ne $status.tgbot3
        return [ordered]@{
            ok = [bool]$valid
            url = $Url
            statusKey = [string]$status.statusKey
            tg1Name = [string]$status.heartbeat.name
            tg2Name = [string]$status.tgbot2.name
            tg3Name = [string]$status.tgbot3.name
            tg3Task = [string]$status.tgbot3.currentTaskInstruction
            checkedAt = (Get-Date).ToString("o")
            error = if ($valid) { "" } else { "TG1/TG2/TG3 status fields are incomplete" }
        }
    } catch {
        return [ordered]@{
            ok = $false
            url = $Url
            checkedAt = (Get-Date).ToString("o")
            error = $_.Exception.Message
        }
    }
}

function Test-PublicSite {
    $baseUrl = $PublicSiteUrl.TrimEnd("/") + "/"
    $index = Invoke-WebCheck -Url $baseUrl -RequiredText @("TG1", "TG2", "TG3", "data-dashboard-action=`"rescue`"", "data-dashboard-action=`"force-stop`"")
    $app = Invoke-WebCheck -Url ($baseUrl + "app.js") -RequiredText @("TG3_BOT_NAME", "tgbot3", "runtime-status.json")
    $styles = Invoke-WebCheck -Url ($baseUrl + "styles.css")
    $runtime = Test-RuntimeSnapshot -Url ($baseUrl + "runtime-status.json")

    return [ordered]@{
        ok = [bool]($index.ok -and $app.ok -and $styles.ok -and $runtime.ok)
        index = $index
        app = $app
        styles = $styles
        runtime = $runtime
    }
}

function Push-RepairChanges {
    $allowedPaths = @("live-status-config.js", "runtime-status.json", "site-health-redeploy.txt")
    & git -C $SiteRoot add -- $allowedPaths
    if ($LASTEXITCODE -ne 0) { throw "git add failed during site repair" }

    & git -C $SiteRoot diff --cached --quiet -- $allowedPaths
    if ($LASTEXITCODE -eq 0) { return $false }

    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    & git -C $SiteRoot commit -m "Repair dashboard health $stamp" -- $allowedPaths
    if ($LASTEXITCODE -ne 0) { throw "git commit failed during site repair" }
    $branch = (& git -C $SiteRoot branch --show-current).Trim()
    if (-not $branch) { throw "unable to determine deployment branch" }

    $pushHelper = "C:\Users\max\.openclaw\workspace\tools\git-push-with-github-token.ps1"
    if (Test-Path -LiteralPath $pushHelper) {
        & $pushHelper -RepoDir $SiteRoot -Remote origin -Branch $branch
    } else {
        & git -C $SiteRoot push origin $branch
    }
    if ($LASTEXITCODE -ne 0) { throw "git push failed during site repair" }
    return $true
}

$liveResult = $null
if (Test-Path -LiteralPath $liveHealthScript) {
    $liveJson = & $liveHealthScript -SiteRoot $SiteRoot -Port $Port -Repair -PushConfig
    try { $liveResult = (($liveJson -join "`n").TrimStart([char]0xFEFF) | ConvertFrom-Json) } catch { $liveResult = $null }
}

$publicBefore = Test-PublicSite
$repairRan = $false
$pushedRepair = $false
$publicAfter = $publicBefore

if ($Repair -and (-not $publicBefore.ok -or ($liveResult -and -not $liveResult.ok))) {
    $repairRan = $true
    if (Test-Path -LiteralPath $runtimeStatusScript) {
        & $runtimeStatusScript -SiteRoot $SiteRoot -OutputPath $runtimeStatusPath | Out-Null
    }
    [System.IO.File]::WriteAllText($redeployMarkerPath, (Get-Date).ToString("o") + [Environment]::NewLine, $utf8NoBom)
    $pushedRepair = Push-RepairChanges

    for ($attempt = 1; $attempt -le 4; $attempt++) {
        Start-Sleep -Seconds 15
        $publicAfter = Test-PublicSite
        if ($publicAfter.ok) { break }
    }
}

$result = [ordered]@{
    ok = [bool]($publicAfter.ok -and ($null -eq $liveResult -or $liveResult.ok))
    checkedAt = (Get-Date).ToString("o")
    publicSiteUrl = $PublicSiteUrl
    publicBefore = $publicBefore
    publicAfter = $publicAfter
    live = $liveResult
    repairRan = $repairRan
    pushedRepair = $pushedRepair
}

$reportPath = Join-Path $reportDir ("public_site_health_{0}.json" -f (Get-Date -Format "yyyyMMdd_HHmmss"))
$latestPath = Join-Path $reportDir "public_site_health_latest.json"
$json = $result | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($reportPath, $json + [Environment]::NewLine, $utf8NoBom)
[System.IO.File]::WriteAllText($latestPath, $json + [Environment]::NewLine, $utf8NoBom)
$json

if (-not $result.ok) { exit 1 }
