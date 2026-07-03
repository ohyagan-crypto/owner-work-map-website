param(
    [string]$SiteRoot,
    [string]$BotRoot = "C:\Users\max\tg-openai-bot",
    [string]$Date = (Get-Date).ToString("yyyy-MM-dd"),
    [string]$CurrentTask = "",
    [string]$NextAction = "",
    [string]$OutputPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $SiteRoot) {
    $SiteRoot = Split-Path -Parent $PSScriptRoot
}

$HeartbeatPath = Join-Path $BotRoot "codex_bot_heartbeat.json"
$RequestStatusPath = Join-Path $BotRoot "telegram_request_status.json"
$UsagePath = Join-Path $BotRoot "codex_token_usage.jsonl"
$StateDb = "C:\Users\max\.codex\state_5.sqlite"
if (-not $OutputPath.Trim()) {
    $OutputPath = Join-Path $SiteRoot "runtime-status.json"
}

function Read-JsonFile {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    try {
        return Get-Content -LiteralPath $Path -Encoding UTF8 -Raw | ConvertFrom-Json
    } catch {
        return $null
    }
}

function Resolve-SqliteExe {
    $candidates = @(
        "C:\Users\max\freeway-charging-stations\tools\android-sdk\platform-tools\sqlite3.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    $cmd = Get-Command sqlite3 -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

function Invoke-SqliteSingleLine {
    param([string]$SqliteExe, [string]$DbPath, [string]$Sql)
    if (-not $SqliteExe -or -not (Test-Path -LiteralPath $DbPath)) { return $null }
    try {
        $result = & $SqliteExe -readonly $DbPath $Sql 2>$null
        if ($LASTEXITCODE -ne 0) { return $null }
        return ($result | Select-Object -First 1)
    } catch {
        return $null
    }
}

function Get-JsonInt64 {
    param($Object, [string]$Name)
    if ($null -eq $Object) { return $null }
    $prop = $Object.PSObject.Properties.Item($Name)
    if ($null -eq $prop -or $null -eq $prop.Value) { return $null }
    try { return [int64]$prop.Value } catch { return $null }
}

function Get-TokenSummary {
    param([string]$TargetDate)

    $sqliteExe = Resolve-SqliteExe
    $dbTaskCount = 0
    $dbTotalTokens = $null
    $sqlDate = $TargetDate.Replace("'", "''")
    $sql = "select coalesce(count(*),0) || '|' || coalesce(sum(tokens_used),0) from threads where tokens_used > 0 and date(updated_at,'unixepoch','localtime') = '$sqlDate';"
    $dbLine = Invoke-SqliteSingleLine -SqliteExe $sqliteExe -DbPath $StateDb -Sql $sql
    if ($dbLine) {
        $parts = $dbLine -split "\|"
        if ($parts.Count -ge 2) {
            try { $dbTaskCount = [int]$parts[0] } catch { $dbTaskCount = 0 }
            try { $dbTotalTokens = [int64]$parts[1] } catch { $dbTotalTokens = $null }
        }
    }

    if ($null -ne $dbTotalTokens -and $dbTaskCount -gt 0) {
        return [pscustomobject]@{
            totalTokens = $dbTotalTokens
            taskCount = $dbTaskCount
            source = "本機 Codex 執行緒紀錄"
        }
    }

    $jsonRecords = 0
    $jsonTotal = [int64]0
    if (Test-Path -LiteralPath $UsagePath) {
        foreach ($line in Get-Content -LiteralPath $UsagePath -Encoding UTF8) {
            $trimmed = $line.Trim()
            if (-not $trimmed) { continue }
            try { $item = $trimmed | ConvertFrom-Json } catch { continue }
            $dateProp = $item.PSObject.Properties.Item("date")
            if ($null -eq $dateProp -or $dateProp.Value -ne $TargetDate) { continue }
            $value = Get-JsonInt64 -Object $item -Name "total_tokens"
            if ($null -ne $value) {
                $jsonRecords += 1
                $jsonTotal += $value
            }
        }
    }

    return [pscustomobject]@{
        totalTokens = $jsonTotal
        taskCount = $jsonRecords
        source = if ($jsonRecords -gt 0) { "本機 Codex token 紀錄" } else { "本機未抓到精確 token 紀錄" }
    }
}

function Get-NewestRequestRecord {
    $data = Read-JsonFile -Path $RequestStatusPath
    if ($null -eq $data) { return $null }
    $records = @()
    foreach ($property in $data.PSObject.Properties) {
        if ($property.Value) { $records += $property.Value }
    }
    if ($records.Count -eq 0) { return $null }
    return $records | Sort-Object { if ($_.updated_at) { [double]$_.updated_at } else { 0 } } | Select-Object -Last 1
}

function Test-MojibakeText {
    param([string]$Text)
    if (-not $Text) { return $false }
    return $Text -match "[涓锛熼闂荤冧]"
}

$now = Get-Date
$heartbeat = Read-JsonFile -Path $HeartbeatPath
$request = Get-NewestRequestRecord
$token = Get-TokenSummary -TargetDate $Date

$statusKey = "standby"
$statusLabel = "正常待命"
$headline = "心跳正常，目前沒有可見卡點。"
$blocker = "沒有卡點"
$defaultNext = "有新任務時會更新 Telegram 狀態與本頁快照。"

if ($heartbeat -and $heartbeat.timestamp) {
    $heartbeatAge = [Math]::Max(0, [int]([DateTimeOffset]$now).ToUnixTimeSeconds() - [int64]$heartbeat.timestamp)
} else {
    $heartbeatAge = 999999
}

if ($heartbeatAge -gt 120) {
    $statusKey = "disconnected"
    $statusLabel = "疑似斷線"
    $headline = "超過 2 分鐘沒有讀到新心跳。"
    $blocker = "心跳過舊"
    $defaultNext = "需要檢查 Telegram bot 或 Codex 執行程序。"
} elseif ($request -and ($request.status -in @("ready_to_send", "sending"))) {
    $requestAge = if ($request.updated_at) {
        [Math]::Max(0, [int]([DateTimeOffset]$now).ToUnixTimeSeconds() - [int64]$request.updated_at)
    } else {
        0
    }
    $statusKey = "ready"
    if ($request.status -eq "sending") {
        $statusLabel = "答案正在送出"
        $headline = "答案已產出，正在送回 Telegram。"
        $blocker = "等待 Telegram 送出確認"
        $defaultNext = "若超過 10 秒仍未完成，會顯示為待回覆卡點。"
    } elseif ($requestAge -gt 10) {
        $statusLabel = "答案已產出待回覆"
        $headline = "答案已產出，但 Telegram 回覆尚未確認完成。"
        $blocker = "答案待送出"
        $defaultNext = "檢查 Telegram 回覆送出狀態。"
    } else {
        $statusLabel = "答案已產出"
        $headline = "答案已產出，正在準備回覆 Telegram。"
        $blocker = "沒有卡點"
        $defaultNext = "即將送出 Telegram 回覆。"
    }
} elseif ($request -and ($request.status -in @("queued", "running"))) {
    $requestAge = if ($request.updated_at) {
        [Math]::Max(0, [int]([DateTimeOffset]$now).ToUnixTimeSeconds() - [int64]$request.updated_at)
    } else {
        0
    }
    $heartbeatPhase = if ($heartbeat -and $heartbeat.PSObject.Properties.Item("phase")) { [string]$heartbeat.phase } else { "" }
    if ($heartbeatPhase -eq "codex_done" -and $requestAge -gt 10) {
        $statusKey = "ready"
        $statusLabel = "答案已產出待回覆"
        $headline = "Codex 已產出答案，但 Telegram 任務狀態尚未標記完成。"
        $blocker = "等待回覆送出確認"
        $defaultNext = "檢查 Telegram 回覆送出與任務完成標記。"
    } elseif ($requestAge -gt 1800) {
        $statusKey = "blocked"
        $statusLabel = "疑似卡點"
        $headline = "有任務維持執行超過 30 分鐘，需要檢查是否真的卡住。"
        $blocker = "任務執行時間過長"
        $defaultNext = "檢查最近任務狀態，必要時清楚回報卡點。"
    } else {
        $statusKey = "running"
        $statusLabel = "運作中"
        $headline = "目前有 Telegram 任務正在處理。"
        $blocker = "沒有卡點"
        $defaultNext = "完成後更新交付結果、網址、檔案路徑或明確卡點。"
    }
} elseif ($request -and ($request.status -in @("failed", "blocked", "interrupted"))) {
    $statusKey = "blocked"
    $statusLabel = "卡點"
    $headline = "最近任務沒有正常完成，需要處理卡點。"
    $blocker = "最近任務異常"
    $defaultNext = "查看最近任務，修復後再回報。"
} elseif ($request -and $request.status -eq "completed") {
    $completedAge = if ($request.updated_at) {
        [Math]::Max(0, [int]([DateTimeOffset]$now).ToUnixTimeSeconds() - [int64]$request.updated_at)
    } else {
        0
    }
    if ($completedAge -le 600) {
        $statusKey = "completed"
        $statusLabel = "已回覆完成"
        $headline = "最近任務已產出答案並完成 Telegram 回覆。"
        $blocker = "沒有卡點"
        $defaultNext = "可直接查看 Telegram 回覆結果。"
    }
}

if ($CurrentTask.Trim()) {
    $headline = $CurrentTask.Trim()
} elseif ($request -and $request.task -and -not (Test-MojibakeText ([string]$request.task))) {
    $headline = [string]$request.task
}

if (-not $NextAction.Trim()) {
    $NextAction = $defaultNext
}

$payload = [ordered]@{
    statusKey = $statusKey
    statusLabel = $statusLabel
    headline = $headline
    blocker = $blocker
    nextAction = $NextAction.Trim()
    updatedAt = $now.ToString("yyyy-MM-ddTHH:mm:sszzz")
    checkedAt = $now.ToString("yyyy-MM-ddTHH:mm:sszzz")
    sourceType = "local-generator"
    sourceLabel = "本機即時狀態產生器"
    refreshSeconds = 5
    workload = [ordered]@{
        taskCount = $token.taskCount
        source = if ($token.taskCount -gt 0) { "本機任務量摘要" } else { "尚未抓到今日任務量摘要" }
    }
    heartbeat = [ordered]@{
        ageSeconds = $heartbeatAge
        activeRequests = if ($heartbeat -and $heartbeat.PSObject.Properties.Item("active_requests")) { $heartbeat.active_requests } else { $null }
    }
    deliverables = @(
        "tgbot 儀表盤網站：GitHub Pages",
        "公開摘要：技能與記憶統計",
        "狀態資料：runtime-status.json"
    )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath) | Out-Null
$json = $payload | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($OutputPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Write-Output "已更新：$OutputPath"
