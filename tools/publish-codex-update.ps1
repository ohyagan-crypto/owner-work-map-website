param(
  [Parameter(Mandatory=$true)][string]$InputFile,
  [Parameter(Mandatory=$true)][string]$Title,
  [string]$Description = "記憶、技能與工作流更新包",
  [string]$Version = (Get-Date -Format "yyyyMMdd.HHmm"),
  [string]$SiteRoot = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
)

$ErrorActionPreference = "Stop"
$updatesDir = Join-Path $SiteRoot "updates"
$manifestPath = Join-Path $SiteRoot "data\codex-updates.json"
if (-not (Test-Path -LiteralPath $InputFile -PathType Leaf)) { throw "找不到更新檔：$InputFile" }
if ([IO.Path]::GetExtension($InputFile).ToLowerInvariant() -ne ".bsmf") { throw "只接受 .bsmf 更新包。" }

$raw = Get-Content -LiteralPath $InputFile -Raw -Encoding UTF8
$envelope = $raw | ConvertFrom-Json
if ($envelope.format -ne "bsmf-codex-update-v1") { throw "更新包格式不受支援。" }
if ($envelope.manifest.format -ne "bsmf-codex-update-v1") { throw "更新包內部格式不正確。" }
if (-not $envelope.payload -or -not $envelope.tag -or -not $envelope.iv -or -not $envelope.salt) { throw "更新包缺少加密欄位。" }

$safeVersion = ($Version -replace "[^0-9A-Za-z._-]", "-")
$safeTitle = (($Title -replace "[^0-9A-Za-z._-]", "-") -replace "-+", "-").Trim("-")
if ([string]::IsNullOrWhiteSpace($safeTitle)) { $safeTitle = "codex-update" }
$fileName = "codex-update_$safeVersion.bsmf"
$destination = Join-Path $updatesDir $fileName
New-Item -ItemType Directory -Force -Path $updatesDir, (Split-Path $manifestPath) | Out-Null
Copy-Item -LiteralPath $InputFile -Destination $destination -Force

$bytes = [IO.File]::ReadAllBytes($destination)
$hash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
if (Test-Path -LiteralPath $manifestPath) {
  $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
} else {
  $manifest = [pscustomobject]@{ format = "bsmf-codex-update-v1"; updatedAt = (Get-Date -Format "yyyy-MM-dd"); notes = "公開清單只放更新包名稱、版本、大小與雜湊；更新包內容仍以 AES-256-GCM 加密。"; updates = @() }
}
$items = @($manifest.updates | Where-Object { $_.file -ne "updates/$fileName" })
$item = [pscustomobject]@{
  id = "codex-update-$safeVersion"
  version = $Version
  createdAt = (Get-Date -Format "yyyy-MM-dd")
  title = $Title
  description = $Description
  file = "updates/$fileName"
  size = $bytes.Length
  sha256 = $hash
  contents = @($envelope.manifest.contents)
}
$manifest.updatedAt = (Get-Date -Format "yyyy-MM-dd")
$manifest.updates = @($item) + $items
$manifest | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
Write-Output "已登錄更新包：$destination"
Write-Output "版本：$Version；大小：$($bytes.Length) bytes；SHA-256：$hash"

