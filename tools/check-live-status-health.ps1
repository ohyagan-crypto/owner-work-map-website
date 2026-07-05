param(
    [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot),
    [int]$Port = 4206,
    [switch]$Repair,
    [switch]$PushConfig
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$SiteRoot = (Resolve-Path -LiteralPath $SiteRoot).Path
$configPath = Join-Path $SiteRoot "live-status-config.js"
$startScript = Join-Path $PSScriptRoot "start-live-status.ps1"
$powerShellPath = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"
$reportDir = "C:\Users\max\owner-dashboard-live-logs\health"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

function Read-LiveEndpoint {
    if (-not (Test-Path -LiteralPath $configPath)) { return $null }
    $content = [System.IO.File]::ReadAllText($configPath, [System.Text.Encoding]::UTF8)
    $match = [regex]::Match($content, 'OWNER_LIVE_STATUS_ENDPOINT\s*=\s*"([^"]+)"')
    if ($match.Success) { return $match.Groups[1].Value.TrimEnd("/") }
    return $null
}

function Test-StatusEndpoint {
    param(
        [Parameter(Mandatory = $true)][string]$BaseUrl,
        [int]$TimeoutSeconds = 8
    )

    try {
        $response = $null
        $reader = $null
        $uri = "$BaseUrl/api/status?ts=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
        $request = [System.Net.WebRequest]::Create($uri)
        $request.Timeout = $TimeoutSeconds * 1000
        $request.ReadWriteTimeout = $TimeoutSeconds * 1000
        $response = $request.GetResponse()
        try {
            $stream = $response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
            $content = $reader.ReadToEnd()
        } finally {
            if ($reader) { $reader.Dispose() }
            if ($response) { $response.Dispose() }
        }
        $status = $content | ConvertFrom-Json
        return [ordered]@{
            ok = $true
            baseUrl = $BaseUrl
            statusKey = [string]$status.statusKey
            statusLabel = [string]$status.statusLabel
            heartbeatAgeSeconds = if ($status.heartbeat) { $status.heartbeat.ageSeconds } else { $null }
            checkedAt = (Get-Date).ToString("o")
        }
    } catch {
        return [ordered]@{
            ok = $false
            baseUrl = $BaseUrl
            statusKey = "blocked"
            statusLabel = "unreachable"
            heartbeatAgeSeconds = $null
            checkedAt = (Get-Date).ToString("o")
            error = $_.Exception.Message
        }
    }
}

function Invoke-GitIfConfigChanged {
    $changed = (& git -C $SiteRoot status --short -- live-status-config.js) -join "`n"
    if (-not $changed.Trim()) { return $false }

    & git -C $SiteRoot add -- live-status-config.js
    if ($LASTEXITCODE -ne 0) { throw "git add live-status-config.js failed" }

    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    & git -C $SiteRoot commit -m "Refresh dashboard live endpoint $stamp"
    if ($LASTEXITCODE -ne 0) { throw "git commit live-status-config.js failed" }

    $pushHelper = "C:\Users\max\.openclaw\workspace\tools\git-push-with-github-token.ps1"
    if (Test-Path -LiteralPath $pushHelper) {
        & $pushHelper -RepoDir $SiteRoot -Remote origin -Branch main
    } else {
        & git -C $SiteRoot push origin main
    }
    if ($LASTEXITCODE -ne 0) { throw "git push live-status-config.js failed" }
    return $true
}

$localBase = "http://127.0.0.1:$Port"
$endpoint = Read-LiveEndpoint
$local = Test-StatusEndpoint -BaseUrl $localBase -TimeoutSeconds 6
$public = if ($endpoint) {
    Test-StatusEndpoint -BaseUrl $endpoint -TimeoutSeconds 10
} else {
    [ordered]@{
        ok = $false
        baseUrl = ""
        statusKey = "blocked"
        statusLabel = "missing live-status-config"
        heartbeatAgeSeconds = $null
        checkedAt = (Get-Date).ToString("o")
    }
}

$repairRan = $false
$pushedConfig = $false
if ($Repair -and (-not $local.ok -or -not $public.ok)) {
    if (-not (Test-Path -LiteralPath $startScript)) {
        throw "start-live-status.ps1 not found"
    }
    & $powerShellPath -NoProfile -ExecutionPolicy Bypass -File $startScript -Port $Port | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "start-live-status.ps1 failed" }
    $repairRan = $true

    $endpoint = Read-LiveEndpoint
    $local = Test-StatusEndpoint -BaseUrl $localBase -TimeoutSeconds 6
    $public = Test-StatusEndpoint -BaseUrl $endpoint -TimeoutSeconds 10

    if ($PushConfig) {
        $pushedConfig = Invoke-GitIfConfigChanged
    }
}

$result = [ordered]@{
    ok = [bool]($local.ok -and $public.ok)
    checkedAt = (Get-Date).ToString("o")
    local = $local
    public = $public
    repairRan = $repairRan
    pushedConfig = $pushedConfig
}

$reportPath = Join-Path $reportDir ("live_health_{0}.json" -f (Get-Date -Format "yyyyMMdd_HHmmss"))
$latestPath = Join-Path $reportDir "live_health_latest.json"
$json = $result | ConvertTo-Json -Depth 8
$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($reportPath, $json + [Environment]::NewLine, $utf8Bom)
[System.IO.File]::WriteAllText($latestPath, $json + [Environment]::NewLine, $utf8Bom)

$json
