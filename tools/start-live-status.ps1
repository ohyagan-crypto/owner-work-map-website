param(
    [int]$Port = 4206,
    [string]$CloudflaredPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$SiteRoot = Split-Path -Parent $PSScriptRoot
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogRoot = "C:\Users\max\owner-dashboard-live-logs\owner_dashboard_live_$Stamp"
New-Item -ItemType Directory -Force -Path $LogRoot | Out-Null

function Test-PortFree {
    param([int]$CandidatePort)
    $listener = $null
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $CandidatePort)
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($listener) { $listener.Stop() }
    }
}

function Test-DashboardStatus {
    param([int]$CandidatePort)
    try {
        $status = Invoke-RestMethod -Uri "http://127.0.0.1:$CandidatePort/api/status?ts=$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())" -TimeoutSec 5
        return $null -ne $status.statusKey
    } catch {
        return $false
    }
}

$nodeOut = Join-Path $LogRoot "node.out.log"
$nodeErr = Join-Path $LogRoot "node.err.log"
$tunnelOut = Join-Path $LogRoot "cloudflared.out.log"
$tunnelErr = Join-Path $LogRoot "cloudflared.err.log"

$node = $null
$nodeMode = "existing"
if (-not (Test-DashboardStatus -CandidatePort $Port)) {
    if (-not (Test-PortFree -CandidatePort $Port)) {
        throw "Port $Port is occupied, but it is not serving the dashboard status API. Refusing to open another random port."
    }

    $env:PORT = [string]$Port
    $node = Start-Process -FilePath "node.exe" `
        -ArgumentList @("server.js") `
        -WorkingDirectory $SiteRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput $nodeOut `
        -RedirectStandardError $nodeErr `
        -PassThru
    $nodeMode = "started"

    $nodeDeadline = (Get-Date).AddSeconds(15)
    while ((Get-Date) -lt $nodeDeadline -and -not (Test-DashboardStatus -CandidatePort $Port)) {
        Start-Sleep -Milliseconds 500
    }

    if (-not (Test-DashboardStatus -CandidatePort $Port)) {
        throw "Dashboard status API did not become ready on port $Port."
    }
}

if (-not $CloudflaredPath.Trim()) {
    $candidates = @(
        "C:\Users\max\owner-dashboard-tools\cloudflared.exe",
        (Join-Path $SiteRoot "tools\cloudflared.exe")
    )
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            $CloudflaredPath = $candidate
            break
        }
    }
    if (-not $CloudflaredPath.Trim()) {
        $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
        if ($cmd) { $CloudflaredPath = $cmd.Source }
    }
}

if (-not $CloudflaredPath.Trim() -or -not (Test-Path -LiteralPath $CloudflaredPath)) {
    throw "cloudflared.exe not found. Copy it to C:\Users\max\owner-dashboard-tools\cloudflared.exe first."
}

$cloudflared = Start-Process -FilePath $CloudflaredPath `
    -ArgumentList @("tunnel", "--url", "http://127.0.0.1:$Port", "--no-autoupdate") `
    -WorkingDirectory $SiteRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $tunnelOut `
    -RedirectStandardError $tunnelErr `
    -PassThru

$deadline = (Get-Date).AddSeconds(30)
$publicUrl = $null
while ((Get-Date) -lt $deadline -and -not $publicUrl) {
    Start-Sleep -Milliseconds 500
    $text = ""
    if (Test-Path -LiteralPath $tunnelOut) { $text += Get-Content -LiteralPath $tunnelOut -Raw -ErrorAction SilentlyContinue }
    if (Test-Path -LiteralPath $tunnelErr) { $text += Get-Content -LiteralPath $tunnelErr -Raw -ErrorAction SilentlyContinue }
    $match = [regex]::Match($text, "https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    if ($match.Success) { $publicUrl = $match.Value.TrimEnd("/") }
}

if (-not $publicUrl) {
    throw "Live tunnel did not return a public URL."
}

$configPath = Join-Path $SiteRoot "live-status-config.js"
$config = "window.OWNER_LIVE_STATUS_ENDPOINT = `"$publicUrl`";"
[System.IO.File]::WriteAllText($configPath, $config + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))

$summary = [ordered]@{
    localUrl = "http://127.0.0.1:$Port/"
    liveEndpoint = $publicUrl
    nodePid = if ($node) { $node.Id } else { $null }
    nodeMode = $nodeMode
    cloudflaredPid = $cloudflared.Id
    logRoot = $LogRoot
}

$summary | ConvertTo-Json -Depth 4
