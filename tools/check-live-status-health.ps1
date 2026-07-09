param(
  [string]$SiteRoot = (Split-Path -Parent $PSScriptRoot),
  [string]$LogRoot = "C:\Users\max\owner-dashboard-live-logs",
  [string]$HealthRoot = "C:\Users\max\owner-dashboard-live-logs\health",
  [int]$TimeoutSec = 12
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom

New-Item -ItemType Directory -Force -Path $HealthRoot | Out-Null

$configPath = Join-Path $SiteRoot "live-status-config.js"
$repairScript = Join-Path $SiteRoot "tools\start-live-status.ps1"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$latestHealthPath = Join-Path $HealthRoot "live_health_latest.json"
$historyHealthPath = Join-Path $HealthRoot ("live_health_{0}.json" -f $stamp)

function Read-TextFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return "" }
  try {
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
  } catch {
    return ""
  }
}

function Get-LatestLogRoot {
  if (-not (Test-Path -LiteralPath $LogRoot)) { return $null }
  Get-ChildItem -LiteralPath $LogRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "owner_dashboard_live_*" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

function Get-LiveUrlsFromArtifacts {
  $result = [ordered]@{
    localUrl = ""
    publicUrl = ""
    logRoot = ""
  }

  $latest = Get-LatestLogRoot
  if ($latest) {
    $result.logRoot = $latest.FullName
    $nodeOut = Join-Path $latest.FullName "node.out.log"
    $cloudflaredErr = Join-Path $latest.FullName "cloudflared.err.log"
    $nodeText = Read-TextFile -Path $nodeOut
    $tunnelText = Read-TextFile -Path $cloudflaredErr

    if ($nodeText -match 'http://127\.0\.0\.1:\d+/') {
      $result.localUrl = $Matches[0].TrimEnd("/")
    }
    if ($tunnelText -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
      $result.publicUrl = $Matches[0].TrimEnd("/")
    }
  }

  if (-not $result.publicUrl -and (Test-Path -LiteralPath $configPath)) {
    $configText = Read-TextFile -Path $configPath
    if ($configText -match 'OWNER_LIVE_STATUS_ENDPOINT\s*=\s*["'']([^"'']+)["'']') {
      $result.publicUrl = $Matches[1].TrimEnd("/")
    }
  }

  if (-not $result.localUrl) {
    $result.localUrl = "http://127.0.0.1:4190"
  }

  return [pscustomobject]$result
}

function Test-Endpoint {
  param([string]$BaseUrl)
  if (-not $BaseUrl) {
    return [pscustomobject]@{
      ok = $false
      statusKey = "blocked"
      statusLabel = "missing"
      error = "missing base url"
    }
  }

  try {
    $response = Invoke-WebRequest -UseBasicParsing ("{0}/api/status" -f $BaseUrl.TrimEnd("/")) -TimeoutSec $TimeoutSec
    $body = $null
    try { $body = $response.Content | ConvertFrom-Json } catch { $body = $null }
    return [pscustomobject]@{
      ok = ($response.StatusCode -eq 200)
      statusKey = if ($body -and $body.statusKey) { [string]$body.statusKey } else { "running" }
      statusLabel = if ($body -and $body.statusLabel) { [string]$body.statusLabel } else { "正常" }
      error = ""
    }
  } catch {
    return [pscustomobject]@{
      ok = $false
      statusKey = "blocked"
      statusLabel = "unreachable"
      error = $_.Exception.Message
    }
  }
}

function Start-Repair {
  if (-not (Test-Path -LiteralPath $repairScript)) {
    throw "Repair script missing: $repairScript"
  }

  $raw = & $repairScript
  $jsonText = if ($raw -is [string]) { $raw } else { ($raw | Out-String) }
  $jsonText = $jsonText.Trim()
  if ($jsonText) {
    try { return $jsonText | ConvertFrom-Json } catch { }
  }
  return $null
}

$urlsBefore = Get-LiveUrlsFromArtifacts
$localBefore = Test-Endpoint -BaseUrl $urlsBefore.localUrl
$publicBefore = Test-Endpoint -BaseUrl $urlsBefore.publicUrl
$repairRan = $false
$repairSummary = $null

if (-not ($localBefore.ok -and $publicBefore.ok)) {
  $repairRan = $true
  $repairSummary = Start-Repair
  Start-Sleep -Seconds 3
}

$urlsAfter = Get-LiveUrlsFromArtifacts
$localAfter = Test-Endpoint -BaseUrl $urlsAfter.localUrl
$publicAfter = Test-Endpoint -BaseUrl $urlsAfter.publicUrl

$overallOk = $localAfter.ok -and $publicAfter.ok
$payload = [ordered]@{
  ok = $overallOk
  checkedAt = (Get-Date).ToString("o")
  local = [ordered]@{
    ok = $localAfter.ok
    baseUrl = $urlsAfter.localUrl
    statusKey = $localAfter.statusKey
    statusLabel = $localAfter.statusLabel
    checkedAt = (Get-Date).ToString("o")
    error = $localAfter.error
  }
  public = [ordered]@{
    ok = $publicAfter.ok
    baseUrl = $urlsAfter.publicUrl
    statusKey = $publicAfter.statusKey
    statusLabel = $publicAfter.statusLabel
    checkedAt = (Get-Date).ToString("o")
    error = $publicAfter.error
  }
  repairRan = $repairRan
  repairSummary = if ($repairSummary) { $repairSummary } else { $null }
  configPath = $configPath
  logRoot = $urlsAfter.logRoot
}

$json = $payload | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($historyHealthPath, $json + [Environment]::NewLine, $utf8NoBom)
[System.IO.File]::WriteAllText($latestHealthPath, $json + [Environment]::NewLine, $utf8NoBom)

Write-Output $json
