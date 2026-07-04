param(
  [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot),
  [datetime]$WindowDate = (Get-Date).Date
)

$ErrorActionPreference = "Stop"

function Write-Utf8File {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Read-Text {
  param([Parameter(Mandatory = $true)][string]$Path)
  return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)][string]$Description,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )
  & git @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Description failed with exit code $LASTEXITCODE"
  }
}

function Test-WithinUpgradeWindow {
  param(
    [Parameter(Mandatory = $true)][datetime]$Timestamp,
    [Parameter(Mandatory = $true)][datetime]$AllowedDate
  )

  $windowStart = $AllowedDate.Date
  $windowEnd = $windowStart.AddHours(9)
  return $Timestamp -ge $windowStart -and $Timestamp -le $windowEnd
}

$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
$indexPath = Join-Path $RepoRoot "index.html"
$appPath = Join-Path $RepoRoot "app.js"
$autoCssPath = Join-Path $RepoRoot "auto-upgrade.css"
$statePath = Join-Path $PSScriptRoot "dashboard-auto-upgrade-state.json"
$reportDir = "C:\Users\max\Desktop\榫嶈潶瑷樻喍\dashboard-auto-upgrade-reports"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$env:PATH = "C:\Program Files\GitHub CLI;C:\Users\max\PortableGit\cmd;C:\Users\max\PortableGit\bin;C:\Users\max\PortableGit\mingw64\bin;C:\nvm4w\nodejs;C:\Users\max\AppData\Roaming\npm;" + $env:PATH
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "Never"

$now = Get-Date
$windowStart = $WindowDate.Date
$windowEnd = $windowStart.AddHours(9)
if (-not (Test-WithinUpgradeWindow -Timestamp $now -AllowedDate $WindowDate)) {
  Write-Output ("skipped outside upgrade window {0}~{1}" -f $windowStart.ToString("yyyy-MM-dd 00:00"), $windowEnd.ToString("yyyy-MM-dd HH:mm"))
  exit 0
}

$stamp = $now.ToString("yyyyMMdd-HHmmss")
$displayTime = $now.ToString("yyyy-MM-dd HH:mm")
$dateText = $now.ToString("yyyy-MM-dd")

$state = [ordered]@{ runNumber = 0 }
if (Test-Path -LiteralPath $statePath) {
  try {
    $state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    $state = [ordered]@{ runNumber = 0 }
  }
}

$runNumber = [int]($state.runNumber) + 1
$profiles = @(
  [pscustomobject]@{
    Name = "首屏焦點層次"
    Accent = "#73e8f2"
    Accent2 = "#f4cf7b"
    Summary = "強化首屏控制列、左右雙欄邊界與任務卡焦點，讓一進站就能判斷蝦咩與嵐熙狀態。"
    Css = @"
.command-strip { box-shadow: 0 18px 38px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(115, 232, 242, 0.12) inset; }
.mission-board-head { background: linear-gradient(90deg, rgba(115, 232, 242, 0.11), rgba(255,255,255,0.035), rgba(244, 207, 123, 0.08)); }
.primary-status { border-color: rgba(115, 232, 242, 0.48); }
.lanxi-primary-status { border-color: rgba(244, 207, 123, 0.44); }
"@
  },
  [pscustomobject]@{
    Name = "手機閱讀呼吸"
    Accent = "#baf5c8"
    Accent2 = "#ff8ab3"
    Summary = "壓低手機擁擠感，放大主要狀態文字的換行空間，避免小螢幕卡片互相擠壓。"
    Css = @"
@media (max-width: 640px) {
  .status-dashboard { padding: 14px; }
  .command-chip, .sync-chip, .skill-chip, .task-chip, .lanxi-task-chip, .updated-chip { flex-basis: min(80vw, 258px); }
  .agent-status-column { padding: 12px; }
  .status-card strong, .task-status-card strong { font-size: clamp(22px, 7.2vw, 32px); }
}
"@
  },
  [pscustomobject]@{
    Name = "技能區清晰化"
    Accent = "#f4cf7b"
    Accent2 = "#73e8f2"
    Summary = "提高技能入口、搜尋欄與分類卡的辨識度，讓技能包區從資訊表變成可快速操作的工作台。"
    Css = @"
.dashboard-skill-hub { box-shadow: 0 18px 44px rgba(0, 0, 0, 0.24), 0 0 42px rgba(244, 207, 123, 0.07) inset; }
.skill-search-field:focus-within { border-color: rgba(244, 207, 123, 0.58); }
.skill-card:hover { border-color: rgba(244, 207, 123, 0.45); }
"@
  },
  [pscustomobject]@{
    Name = "監控區掃描層"
    Accent = "#bea8ff"
    Accent2 = "#baf5c8"
    Summary = "讓監控區、時間軸與狀態面板有更清楚的線性掃描層，方便追蹤最近一次修改與卡點。"
    Css = @"
.dashboard-tool-panel { background: linear-gradient(160deg, rgba(190, 168, 255, 0.08), rgba(255,255,255,0.026), rgba(186,245,200,0.055)), rgba(5, 20, 23, 0.84); }
.timeline-item { border-color: rgba(190, 168, 255, 0.24); }
.timeline-item time { color: #bea8ff; }
"@
  }
)

$profile = $profiles[($runNumber - 1) % $profiles.Count]
$autoCss = @"
/* Auto visual upgrade ${stamp}: run $runNumber - $($profile.Name). */
:root {
  --auto-upgrade-accent: $($profile.Accent);
  --auto-upgrade-accent-2: $($profile.Accent2);
}

.command-strip {
  border-color: color-mix(in srgb, var(--auto-upgrade-accent) 42%, rgba(255,255,255,0.18));
}

.agent-status-column,
.status-card,
.skill-card,
.skill-more-card {
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 180ms ease;
}

$($profile.Css)
"@
Write-Utf8File -Path $autoCssPath -Content $autoCss

$index = Read-Text -Path $indexPath
$index = [regex]::Replace($index, 'styles\.css\?v=[^"]+', "styles.css?v=$stamp")
if ($index -match 'auto-upgrade\.css\?v=') {
  $index = [regex]::Replace($index, 'auto-upgrade\.css\?v=[^"]+', "auto-upgrade.css?v=$stamp")
} else {
  $index = $index -replace '(<link rel="stylesheet" href="styles\.css\?v=[^"]+">\s*)', "`$1  <link rel=`"stylesheet`" href=`"auto-upgrade.css?v=$stamp`">`r`n"
}
$index = [regex]::Replace($index, 'app\.js\?v=[^"]+', "app.js?v=$stamp")
$index = [regex]::Replace($index, 'live-status-config\.js\?v=[^"]+', "live-status-config.js?v=$stamp")
$index = [regex]::Replace($index, '視覺升級 \d{4}-\d{2}-\d{2} \d{2}:\d{2}', "視覺升級 $displayTime")
Write-Utf8File -Path $indexPath -Content $index

$app = Read-Text -Path $appPath
$entry = '  ["' + $dateText + '", "第 ' + $runNumber + ' 次半小時自動升級：' + $profile.Name + '。' + $profile.Summary + '"],'
$app = $app -replace 'const timeline = \[\s*', "const timeline = [`r`n$entry`r`n  "
Write-Utf8File -Path $appPath -Content $app

$stateOut = [ordered]@{
  runNumber = $runNumber
  lastRunAt = $now.ToString("o")
  lastProfile = $profile.Name
  lastSummary = $profile.Summary
} | ConvertTo-Json -Depth 4
Write-Utf8File -Path $statePath -Content $stateOut

$reportPath = Join-Path $reportDir ("dashboard_auto_upgrade_{0}.txt" -f $stamp)
$report = @"
儀表盤半小時自動升級報告
時間：$displayTime
輪次：第 $runNumber 次
主題：$($profile.Name)
優化：$($profile.Summary)
公開網址：https://ohyagan-crypto.github.io/owner-work-map-website/
本機路徑：$RepoRoot
"@
Write-Utf8File -Path $reportPath -Content $report

Push-Location $RepoRoot
try {
  Invoke-Git -Description "git add" -Arguments @("add", "--", "index.html", "app.js", "auto-upgrade.css", "tools/dashboard-auto-upgrade-state.json")
  & git diff --cached --quiet
  $diffExitCode = $LASTEXITCODE
  if ($diffExitCode -eq 0) {
    $hasChanges = $false
  } elseif ($diffExitCode -eq 1) {
    $hasChanges = $true
  } else {
    throw "git diff failed with exit code $diffExitCode"
  }
  if ($hasChanges) {
    Invoke-Git -Description "git commit" -Arguments @("commit", "-m", ("Auto dashboard visual upgrade {0}" -f $stamp))
    $pushHelper = "C:\Users\max\.openclaw\workspace\tools\git-push-with-github-token.ps1"
    if (Test-Path -LiteralPath $pushHelper) {
      & $pushHelper -RepoDir $RepoRoot -Remote origin -Branch main
    } else {
      Invoke-Git -Description "git push" -Arguments @("push", "origin", "main")
    }
  }
} finally {
  Pop-Location
}

Write-Output ("completed {0} run {1}" -f $stamp, $runNumber)
