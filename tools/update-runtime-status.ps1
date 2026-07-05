param(
    [string]$SiteRoot,
    [string]$BotRoot = "C:\Users\max\tg-openai-bot",
    [string]$Date = (Get-Date).ToString("yyyy-MM-dd"),
    [string]$CurrentTask = "",
    [string]$LanxiTask = "",
    [string]$NextAction = "",
    [string]$OutputPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom

if (-not $SiteRoot) {
    $SiteRoot = Split-Path -Parent $PSScriptRoot
}

$HeartbeatPath = Join-Path $BotRoot "codex_bot_heartbeat.json"
$RequestStatusPath = Join-Path $BotRoot "telegram_request_status.json"
$RecentUploadsPath = Join-Path $BotRoot "telegram_recent_uploads.json"
$ConversationHistoryPath = Join-Path $BotRoot "telegram_conversation_history.json"
$UsagePath = Join-Path $BotRoot "codex_token_usage.jsonl"
$DashboardTaskOverridePath = Join-Path $SiteRoot "dashboard-task-override.json"
$StateDb = "C:\Users\max\.codex\state_5.sqlite"
$OpenClawRunsDb = "C:\Users\max\.openclaw\tasks\runs.sqlite"
$ControlActionRoot = "C:\Users\max\Desktop\龍蝦記憶\dashboard-control-actions"
$LanxiBotUsername = "嵐熙"
if (-not $OutputPath.Trim()) {
    $OutputPath = Join-Path $SiteRoot "runtime-status.json"
}

function Protect-PublicText {
    param([AllowNull()][string]$Text)
    if ($null -eq $Text) { return "" }
    return ([string]$Text) -replace '@[A-Za-z0-9_]{5,}', '嵐熙'
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

function Quote-ProcessArgument {
    param([AllowNull()][string]$Value)
    if ($null -eq $Value) { return '""' }
    return '"' + ([string]$Value).Replace('\', '\\').Replace('"', '\"') + '"'
}

function Invoke-ExternalTextWithTimeout {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [int]$TimeoutMilliseconds = 5000
    )
    if (-not $FilePath) { return $null }
    try {
        $psi = [System.Diagnostics.ProcessStartInfo]::new()
        $psi.FileName = $FilePath
        $psi.UseShellExecute = $false
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.CreateNoWindow = $true
        $psi.StandardOutputEncoding = [System.Text.UTF8Encoding]::new($false)
        $psi.StandardErrorEncoding = [System.Text.UTF8Encoding]::new($false)
        $psi.Arguments = (($Arguments | ForEach-Object { Quote-ProcessArgument -Value $_ }) -join " ")

        $process = [System.Diagnostics.Process]::new()
        $process.StartInfo = $psi
        [void]$process.Start()
        if (-not $process.WaitForExit($TimeoutMilliseconds)) {
            try { $process.Kill() } catch {}
            return $null
        }
        if ($process.ExitCode -ne 0) { return $null }
        return $process.StandardOutput.ReadToEnd()
    } catch {
        return $null
    }
}

function Invoke-SqliteSingleLine {
    param([string]$SqliteExe, [string]$DbPath, [string]$Sql)
    if (-not $SqliteExe -or -not (Test-Path -LiteralPath $DbPath)) { return $null }
    try {
        $result = Invoke-ExternalTextWithTimeout -FilePath $SqliteExe -Arguments @("-readonly", $DbPath, $Sql)
        if (-not $result) { return $null }
        return (($result -split "\r?\n") | Where-Object { $_.Trim() } | Select-Object -First 1)
    } catch {
        return $null
    }
}

function Invoke-SqliteJsonRows {
    param([string]$SqliteExe, [string]$DbPath, [string]$Sql)
    if (-not $SqliteExe -or -not (Test-Path -LiteralPath $DbPath)) { return @() }
    try {
        $text = (Invoke-ExternalTextWithTimeout -FilePath $SqliteExe -Arguments @("-readonly", "-json", $DbPath, $Sql)).Trim()
        if (-not $text) { return @() }
        return @($text | ConvertFrom-Json)
    } catch {
        return @()
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

function Get-ObjectPropertyValue {
    param($Object, [string]$Name)
    if ($null -eq $Object) { return $null }
    $prop = $Object.PSObject.Properties.Item($Name)
    if ($null -eq $prop) { return $null }
    return $prop.Value
}

function Get-RequestTaskInstruction {
    param($RequestRecord)
    if ($null -eq $RequestRecord -or -not $RequestRecord.task) { return "" }
    $raw = ([string]$RequestRecord.task).Trim()
    if ($raw -match "^(讀取照片|讀取文件|安裝文件|安裝檔案)(\s|$)") { return "" }
    $repaired = Repair-MojibakeText -Text $raw
    if (-not $repaired -or (Test-MojibakeText -Text $repaired)) { return "" }
    return Normalize-TaskText -Text $repaired
}

function Test-MojibakeText {
    param([string]$Text)
    if (-not $Text) { return $false }
    return $Text -match "[涓锛熼闂荤冧]"
}

function Repair-MojibakeText {
    param([string]$Text)
    if (-not $Text) { return "" }
    if (-not (Test-MojibakeText -Text $Text)) { return $Text }

    try {
        $gbk = [System.Text.Encoding]::GetEncoding(936)
        $utf8Strict = [System.Text.UTF8Encoding]::new($false, $true)
        $candidate = $utf8Strict.GetString($gbk.GetBytes($Text))
        if ($candidate -and -not (Test-MojibakeText -Text $candidate)) {
            return $candidate
        }
    } catch {
        return $Text
    }

    return $Text
}

function Normalize-TaskText {
    param([string]$Text, [int]$Limit = 180)
    if (-not $Text) { return "" }
    $clean = ($Text -replace "\s+", " ").Trim()
    if ($clean.Length -gt $Limit) {
        return $clean.Substring(0, $Limit).Trim() + "..."
    }
    return $clean
}

function Clean-TelegramInstructionText {
    param([string]$Text, [int]$Limit = 180)
    if (-not $Text) { return "" }

    $clean = $Text -replace "`r`n", "`n"
    $newMessageMarker = "使用者新訊息："
    $newMessageIndex = $clean.LastIndexOf($newMessageMarker, [StringComparison]::Ordinal)
    if ($newMessageIndex -ge 0) {
        $clean = $clean.Substring($newMessageIndex + $newMessageMarker.Length)
    }

    $uploadLine = ""
    foreach ($marker in @("TELEGRAM UPLOADED PHOTO:", "TELEGRAM UPLOADED DOCUMENT:")) {
        $markerIndex = $clean.IndexOf($marker, [StringComparison]::Ordinal)
        if ($markerIndex -ge 0) {
            $lineEnd = $clean.IndexOf("`n", $markerIndex)
            if ($lineEnd -lt 0) { $lineEnd = $clean.Length }
            $uploadLine = $clean.Substring($markerIndex, $lineEnd - $markerIndex).Trim()
            break
        }
    }

    $instruction = $clean
    foreach ($marker in @("TELEGRAM UPLOADED PHOTO:", "TELEGRAM UPLOADED DOCUMENT:", "RULE:")) {
        $markerIndex = $instruction.IndexOf($marker, [StringComparison]::Ordinal)
        if ($markerIndex -ge 0) {
            $instruction = $instruction.Substring(0, $markerIndex)
        }
    }

    $parts = @()
    if ($uploadLine) { $parts += $uploadLine }
    if ($instruction.Trim()) { $parts += $instruction.Trim() }
    $clean = ($parts -join " | ")
    $clean = Repair-MojibakeText -Text $clean
    $clean = Normalize-TaskText -Text $clean -Limit $Limit
    if (Test-MojibakeText -Text $clean) { return "" }
    return $clean
}

function Format-OpenClawTaskStatus {
    param([string]$Status)
    switch ($Status) {
        "queued" { return "排隊中" }
        "running" { return "執行中" }
        "started" { return "執行中" }
        "in_progress" { return "執行中" }
        "succeeded" { return "已完成" }
        "failed" { return "失敗" }
        "cancelled" { return "已取消" }
        "canceled" { return "已取消" }
        default {
            if ($Status) { return $Status }
            return "未取得"
        }
    }
}

function Get-LocalTimeTextFromUnixMs {
    param($Milliseconds)
    try {
        if ($null -eq $Milliseconds) { return "" }
        $ms = [int64]$Milliseconds
        if ($ms -le 0) { return "" }
        return ([DateTimeOffset]::FromUnixTimeMilliseconds($ms).ToLocalTime()).ToString("MM/dd HH:mm")
    } catch {
        return ""
    }
}

function Get-OpenClawTaskSummary {
    $sqliteExe = Resolve-SqliteExe
    if (-not $sqliteExe -or -not (Test-Path -LiteralPath $OpenClawRunsDb)) {
        return [pscustomobject]@{
            detail = ""
            source = "OpenClaw task database"
            statusKey = "watch"
            statusLabel = "未同步"
        }
    }

    $activeSql = @"
select label, task, status, coalesce(progress_summary, terminal_summary, '') as summary, coalesce(last_event_at, started_at, created_at) as event_ms
from task_runs
where status not in ('succeeded','failed','cancelled','canceled')
order by coalesce(last_event_at, started_at, created_at) desc
limit 1;
"@
    $latestSql = @"
select label, task, status, coalesce(progress_summary, terminal_summary, '') as summary, coalesce(last_event_at, started_at, created_at) as event_ms
from task_runs
order by coalesce(last_event_at, started_at, created_at) desc
limit 1;
"@

    $active = Invoke-SqliteJsonRows -SqliteExe $sqliteExe -DbPath $OpenClawRunsDb -Sql $activeSql | Select-Object -First 1
    $isActive = $null -ne $active
    $row = if ($isActive) { $active } else { Invoke-SqliteJsonRows -SqliteExe $sqliteExe -DbPath $OpenClawRunsDb -Sql $latestSql | Select-Object -First 1 }
    if ($null -eq $row) {
        return [pscustomobject]@{
            detail = "目前沒有可同步的 OpenClaw 任務紀錄。"
            source = "OpenClaw task database"
            statusKey = "watch"
            statusLabel = "無任務紀錄"
        }
    }

    $title = ""
    foreach ($candidate in @($row.label, $row.task, $row.summary)) {
        if ($candidate -and -not (Test-MojibakeText ([string]$candidate))) {
            $title = Normalize-TaskText -Text ([string]$candidate) -Limit 90
            break
        }
    }
    if (-not $title) { $title = "未命名任務" }

    $statusText = Format-OpenClawTaskStatus -Status ([string]$row.status)
    $timeText = Get-LocalTimeTextFromUnixMs -Milliseconds $row.event_ms
    $suffix = if ($timeText) { "，最後更新 $timeText" } else { "" }

    if ($isActive) {
        return [pscustomobject]@{
            detail = "嵐熙目前任務：$title（$statusText$suffix）。"
            source = "OpenClaw task_runs.sqlite"
            statusKey = "running"
            statusLabel = $statusText
        }
    }

    $latestStatusKey = if ($row.status -eq "failed") { "watch" } else { "running" }
    return [pscustomobject]@{
        detail = "目前沒有執行中的 OpenClaw 任務；最近任務：$title（$statusText$suffix）。"
        source = "OpenClaw task_runs.sqlite"
        statusKey = $latestStatusKey
        statusLabel = "最近$statusText"
    }
}

function Get-NewestUploadCaption {
    $data = Read-JsonFile -Path $RecentUploadsPath
    if ($null -eq $data) { return "" }
    $records = @()
    foreach ($property in $data.PSObject.Properties) {
        if ($property.Value) { $records += $property.Value }
    }
    if ($records.Count -eq 0) { return "" }

    $latest = $records |
        Where-Object { $_.caption -and -not (Test-MojibakeText ([string]$_.caption)) } |
        Sort-Object { if ($_.ts) { [double]$_.ts } else { 0 } } |
        Select-Object -Last 1

    if (-not $latest) { return "" }
    return Normalize-TaskText -Text ([string]$latest.caption)
}

function Get-LatestConversationInstruction {
    $data = Read-JsonFile -Path $ConversationHistoryPath
    if ($null -eq $data) { return "" }

    $records = @()
    foreach ($property in $data.PSObject.Properties) {
        foreach ($item in @($property.Value)) {
            if (-not $item -or $item.role -ne "user" -or -not $item.content) { continue }
            $text = Clean-TelegramInstructionText -Text ([string]$item.content)
            if (-not $text) { continue }
            $records += [pscustomobject]@{
                ts = if ($item.ts) { [double]$item.ts } else { 0 }
                text = $text
            }
        }
    }

    if ($records.Count -eq 0) { return "" }
    return ($records | Sort-Object ts | Select-Object -Last 1).text
}

function Get-DashboardTaskOverride {
    $data = Read-JsonFile -Path $DashboardTaskOverridePath
    if ($null -eq $data -or -not $data.currentTaskInstruction) { return $null }

    $updatedAt = $null
    try {
        if ($data.updatedAt) { $updatedAt = [DateTimeOffset]::Parse([string]$data.updatedAt) }
    } catch {
        $updatedAt = $null
    }

    if ($updatedAt -and (($now - $updatedAt.LocalDateTime).TotalHours -gt 24)) { return $null }

    $current = Clean-TelegramInstructionText -Text ([string]$data.currentTaskInstruction)
    if (-not $current) { return $null }

    $lanxi = ""
    if ($data.lanxiTaskInstruction) {
        $lanxi = Clean-TelegramInstructionText -Text ([string]$data.lanxiTaskInstruction)
    }
    if (-not $lanxi) { $lanxi = $current }

    return [pscustomobject]@{
        currentTaskInstruction = $current
        lanxiTaskInstruction = $lanxi
        source = if ($data.source) { [string]$data.source } else { "dashboard-task-override.json" }
    }
}

function Get-LatestDashboardControlAction {
    $paths = @(
        (Join-Path $ControlActionRoot "dashboard_rescue_latest.json"),
        (Join-Path $ControlActionRoot "dashboard_force_stop_latest.json")
    )
    $items = @()
    foreach ($path in $paths) {
        if (-not (Test-Path -LiteralPath $path)) { continue }
        $data = Read-JsonFile -Path $path
        if ($null -eq $data) { continue }
        $createdAt = $null
        try {
            if ($data.createdAt) { $createdAt = [DateTimeOffset]::Parse([string]$data.createdAt) }
        } catch {
            $createdAt = $null
        }
        if ($null -eq $createdAt) {
            try { $createdAt = [DateTimeOffset](Get-Item -LiteralPath $path).LastWriteTime } catch { $createdAt = [DateTimeOffset]::MinValue }
        }
        $items += [pscustomobject]@{
            createdAt = $createdAt
            path = $path
            data = $data
        }
    }
    if ($items.Count -eq 0) { return $null }
    return ($items | Sort-Object createdAt | Select-Object -Last 1)
}

function Get-OpenClawSummary {
    $processCount = $null
    try {
        $query = "SELECT ProcessId,CommandLine FROM Win32_Process WHERE CommandLine LIKE '%openclaw%' OR CommandLine LIKE '%gateway --port 18789%'"
        $rows = Get-CimInstance -Query $query -ErrorAction Stop |
            Where-Object { $_.ProcessId -ne $PID }
        $processCount = @($rows).Count
    } catch {
        $processCount = $null
    }

    $watchdogState = "未取得"
    try {
        $task = Get-ScheduledTask -TaskName "OpenClaw Watchdog" -ErrorAction SilentlyContinue
        if ($task) { $watchdogState = [string]$task.State }
    } catch {
        $watchdogState = "未取得"
    }

    if ($null -eq $processCount) {
        return [pscustomobject]@{
            name = "嵐熙"
            botUsername = $LanxiBotUsername
            statusKey = "watch"
            statusLabel = "未確認"
            processCount = $null
            watchdogState = $watchdogState
        }
    }

    if ($processCount -gt 0) {
        return [pscustomobject]@{
            name = "嵐熙"
            botUsername = $LanxiBotUsername
            statusKey = "running"
            statusLabel = "正常"
            processCount = $processCount
            watchdogState = $watchdogState
        }
    }

    return [pscustomobject]@{
        name = "嵐熙"
        botUsername = $LanxiBotUsername
        statusKey = "watch"
        statusLabel = "未偵測到進程"
        processCount = 0
        watchdogState = $watchdogState
    }
}

$now = Get-Date
$heartbeat = Read-JsonFile -Path $HeartbeatPath
$request = Get-NewestRequestRecord
$existingStatus = Read-JsonFile -Path $OutputPath
$siteRuntimeStatusPath = Join-Path $SiteRoot "runtime-status.json"
$siteRuntimeStatus = if ($siteRuntimeStatusPath -ne $OutputPath) { Read-JsonFile -Path $siteRuntimeStatusPath } else { $null }
if (
    $siteRuntimeStatus -and
    $siteRuntimeStatus.currentTaskInstruction -and
    (
        -not $existingStatus -or
        -not $existingStatus.currentTaskInstruction -or
        ([string]$existingStatus.currentTaskInstruction).Trim() -ne ([string]$siteRuntimeStatus.currentTaskInstruction).Trim()
    )
) {
    $existingStatus = $siteRuntimeStatus
}
$uploadCaption = Get-NewestUploadCaption
$conversationInstruction = Get-LatestConversationInstruction
$dashboardTaskOverride = Get-DashboardTaskOverride
$token = Get-TokenSummary -TargetDate $Date
$openclaw = Get-OpenClawSummary
$openclawTask = Get-OpenClawTaskSummary
$dashboardControlAction = Get-LatestDashboardControlAction
$explicitLanxiTask = $LanxiTask.Trim()
$currentInstructionSource = ""
$lanxiTaskInstruction = ""
$lanxiTaskSource = ""
$lanxiTaskStatusKey = $openclawTask.statusKey
$lanxiTaskStatusLabel = $openclawTask.statusLabel
$headlineFromDashboardOverride = $false
$requestTaskInstruction = Get-RequestTaskInstruction -RequestRecord $request

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
    $currentInstructionSource = "手動指定目前任務"
} elseif ($requestTaskInstruction) {
    $headline = $requestTaskInstruction
    $currentInstructionSource = "telegram_request_status.json"
} elseif ($dashboardTaskOverride) {
    $headline = $dashboardTaskOverride.currentTaskInstruction
    $currentInstructionSource = $dashboardTaskOverride.source
    $headlineFromDashboardOverride = $true
} elseif (
    $existingStatus -and
    $existingStatus.currentTaskInstruction -and
    $request -and
    $request.task -and
    ([string]$request.task).Trim() -match "^(讀取照片|讀取文件|安裝文件|安裝檔案)(\s|$)" -and
    $conversationInstruction -and
    ([string]$existingStatus.currentTaskInstruction).Trim() -ne $conversationInstruction
) {
    $headline = Normalize-TaskText -Text ([string]$existingStatus.currentTaskInstruction)
    $currentInstructionSource = "runtime-status.json 最新指令保留"
} elseif ($conversationInstruction) {
    $headline = $conversationInstruction
    $currentInstructionSource = "telegram_conversation_history.json"
} elseif (
    $uploadCaption -and
    $request -and
    $request.task -and
    ([string]$request.task).Trim() -match "^(讀取照片|讀取文件|安裝文件|安裝檔案)(\s|$)"
) {
    $headline = $uploadCaption
    $currentInstructionSource = "telegram_recent_uploads.json"
}

if (-not $NextAction.Trim()) {
    $NextAction = $defaultNext
}

$headline = Protect-PublicText -Text $headline
$blocker = Protect-PublicText -Text $blocker
$NextAction = Protect-PublicText -Text $NextAction

if ($explicitLanxiTask) {
    $lanxiTaskInstruction = Protect-PublicText -Text $explicitLanxiTask
    $lanxiTaskSource = "手動指定嵐熙任務 / $LanxiBotUsername"
    $lanxiTaskStatusKey = "running"
    $lanxiTaskStatusLabel = "手動同步"
} elseif ($headlineFromDashboardOverride -and $dashboardTaskOverride) {
    $lanxiTaskInstruction = Protect-PublicText -Text $dashboardTaskOverride.lanxiTaskInstruction
    $lanxiTaskSource = "$($dashboardTaskOverride.source) + $LanxiBotUsername 狀態"
    $lanxiTaskStatusKey = $statusKey
    $lanxiTaskStatusLabel = "同步目前指令"
} elseif ($currentInstructionSource) {
    $lanxiTaskInstruction = $headline
    $lanxiTaskSource = "$currentInstructionSource + $LanxiBotUsername 狀態"
    $lanxiTaskStatusKey = $statusKey
    $lanxiTaskStatusLabel = "同步目前指令"
} elseif ($dashboardTaskOverride) {
    $lanxiTaskInstruction = Protect-PublicText -Text $dashboardTaskOverride.lanxiTaskInstruction
    $lanxiTaskSource = "$($dashboardTaskOverride.source) + $LanxiBotUsername 狀態"
    $lanxiTaskStatusKey = $statusKey
    $lanxiTaskStatusLabel = "同步目前指令"
} elseif ($openclawTask.detail) {
    $lanxiTaskInstruction = Protect-PublicText -Text $openclawTask.detail
    $lanxiTaskSource = Protect-PublicText -Text $openclawTask.source
} elseif ($null -ne $openclaw.processCount -and $openclaw.processCount -gt 0) {
    $lanxiTaskInstruction = "嵐熙 $LanxiBotUsername 自動化任務：瀏覽器流程、排程與本機進程監控正常；看門排程 $($openclaw.watchdogState)。"
    $lanxiTaskSource = "$LanxiBotUsername 本機狀態"
} elseif ($null -eq $openclaw.processCount) {
    $lanxiTaskInstruction = "嵐熙 $LanxiBotUsername 自動化任務：進程數尚未取得，保留排程與瀏覽器流程監控。"
    $lanxiTaskSource = "$LanxiBotUsername 本機狀態"
} else {
    $lanxiTaskInstruction = "嵐熙 $LanxiBotUsername 自動化任務：目前未偵測到相關進程，需要檢查嵐熙自動化服務。"
    $lanxiTaskSource = "$LanxiBotUsername 本機狀態"
}

$lanxiTaskInstruction = Protect-PublicText -Text $lanxiTaskInstruction
$lanxiTaskSource = Protect-PublicText -Text $lanxiTaskSource

$heartbeatMonitorKey = if ($heartbeatAge -le 120) { "running" } else { "watch" }
$heartbeatMonitorLabel = if ($heartbeatAge -le 120) { "正常" } else { "待確認" }
$activeRequestsText = if ($heartbeat -and $heartbeat.PSObject.Properties.Item("active_requests")) { [string]$heartbeat.active_requests } else { "未取得" }

$openclawProcessCount = $openclaw.processCount
$openclawProcessKey = if ($null -ne $openclawProcessCount -and $openclawProcessCount -gt 0) { "running" } else { "watch" }
$openclawProcessLabel = if ($null -ne $openclawProcessCount -and $openclawProcessCount -gt 0) { "正常" } elseif ($null -eq $openclawProcessCount) { "未確認" } else { "未偵測到" }
$openclawProcessDetail = if ($null -ne $openclawProcessCount) { "偵測到 $openclawProcessCount 個相關進程" } else { "尚未取得進程數" }

$watchdogKey = if ($openclaw.watchdogState -eq "Running") { "running" } else { "watch" }
$tokenKey = if ($null -ne $token.totalTokens) { "running" } else { "watch" }
$tokenLabel = if ($null -ne $token.totalTokens) { "已讀取" } else { "未取得" }
$tokenDetail = if ($null -ne $token.totalTokens) { "$($token.totalTokens) tokens，任務 $($token.taskCount)" } else { "尚未讀到精確 token 統計" }

$controlActionMonitor = $null
if ($dashboardControlAction) {
    $actionData = $dashboardControlAction.data
    $action = [string](Get-ObjectPropertyValue -Object $actionData -Name "action")
    $target = [string](Get-ObjectPropertyValue -Object $actionData -Name "target")
    $actionName = switch ($action) {
        "rescue" { "卡點救援" }
        "force-stop" { "強制停止" }
        default { if ($action) { $action } else { "控制動作" } }
    }
    $targetName = if ($target -eq "shami") { "蝦咩" } else { "嵐熙" }
    $changedParts = @()
    $startedTasks = Get-ObjectPropertyValue -Object $actionData -Name "startedTasks"
    $enabledTasks = Get-ObjectPropertyValue -Object $actionData -Name "enabledTasks"
    $stoppedTasks = Get-ObjectPropertyValue -Object $actionData -Name "stoppedTasks"
    $disabledTasks = Get-ObjectPropertyValue -Object $actionData -Name "disabledTasks"
    $interruptedTelegramRequests = Get-ObjectPropertyValue -Object $actionData -Name "interruptedTelegramRequests"
    $stoppedCodexWorkers = Get-ObjectPropertyValue -Object $actionData -Name "stoppedCodexWorkers"
    $pauseUntil = Get-ObjectPropertyValue -Object $actionData -Name "pauseUntil"
    $alreadyRunning = Get-ObjectPropertyValue -Object $actionData -Name "alreadyRunning"
    if ($startedTasks) { $changedParts += "啟動排程 " + (@($startedTasks) -join "、") }
    if ($enabledTasks) { $changedParts += "恢復排程 " + (@($enabledTasks) -join "、") }
    if ($stoppedTasks) { $changedParts += "停止排程 " + (@($stoppedTasks) -join "、") }
    if ($disabledTasks) { $changedParts += "停用排程 " + (@($disabledTasks) -join "、") }
    if ($null -ne $interruptedTelegramRequests) { $changedParts += "中斷 Telegram 任務 $interruptedTelegramRequests 筆" }
    if ($null -ne $stoppedCodexWorkers) { $changedParts += "停止 Codex 子工作 $stoppedCodexWorkers 個" }
    if ($pauseUntil) { $changedParts += "TGBOT 暫停訊號有效至 $pauseUntil" }
    if ($changedParts.Count -eq 0 -and $alreadyRunning) { $changedParts += "可續作排程已在運作中" }
    if ($changedParts.Count -eq 0) { $changedParts += "已寫入控制訊號" }
    $controlActionMonitor = [ordered]@{
        id = "dashboard-control-action"
        label = "最近控制動作"
        statusKey = "running"
        statusLabel = "$actionName：$targetName"
        detail = (($changedParts | Select-Object -Unique) -join "；")
        source = "dashboard-control-actions"
    }
}

$monitors = @(
    [ordered]@{
        id = "telegram-heartbeat"
        label = "蝦咩心跳"
        statusKey = $heartbeatMonitorKey
        statusLabel = $heartbeatMonitorLabel
        detail = "心跳 $heartbeatAge 秒前，執行中任務 $activeRequestsText"
        source = "codex_bot_heartbeat.json"
    },
    [ordered]@{
        id = "telegram-request"
        label = "Telegram 任務佇列"
        statusKey = $statusKey
        statusLabel = $statusLabel
        detail = $headline
        source = "telegram_request_status.json"
    },
    [ordered]@{
        id = "openclaw-task"
        label = "嵐熙任務"
        statusKey = $lanxiTaskStatusKey
        statusLabel = $lanxiTaskStatusLabel
        detail = $lanxiTaskInstruction
        source = $lanxiTaskSource
    },
    [ordered]@{
        id = "openclaw-process"
        label = "嵐熙進程"
        statusKey = $openclawProcessKey
        statusLabel = $openclawProcessLabel
        detail = $openclawProcessDetail
        source = "Win32_Process"
    },
    [ordered]@{
        id = "openclaw-watchdog"
        label = "嵐熙看門排程"
        statusKey = $watchdogKey
        statusLabel = $openclaw.watchdogState
        detail = "OpenClaw Watchdog 排程目前狀態"
        source = "Scheduled Task"
    },
    [ordered]@{
        id = "codex-token"
        label = "Codex token 統計"
        statusKey = $tokenKey
        statusLabel = $tokenLabel
        detail = $tokenDetail
        source = $token.source
    },
    $controlActionMonitor,
    [ordered]@{
        id = "runtime-generator"
        label = "狀態產生器"
        statusKey = "running"
        statusLabel = "已更新"
        detail = "產生時間 $($now.ToString("yyyy-MM-dd HH:mm:ss"))"
        source = "tools/update-runtime-status.ps1"
    },
    [ordered]@{
        id = "pages-snapshot"
        label = "GitHub Pages 快照"
        statusKey = "running"
        statusLabel = "可讀取"
        detail = "runtime-status.json 提供公開頁備援狀態"
        source = "runtime-status.json"
    },
    [ordered]@{
        id = "deliverable-check"
        label = "交付結果追蹤"
        statusKey = "running"
        statusLabel = "已列入"
        detail = "公開網址、狀態資料與網站更新會列入交付結果"
        source = "dashboard deliverables"
    }
)

$payload = [ordered]@{
    statusKey = $statusKey
    statusLabel = $statusLabel
    headline = $headline
    currentTaskInstruction = $headline
    lanxiTaskInstruction = $lanxiTaskInstruction
    blocker = $blocker
    nextAction = $NextAction.Trim()
    updatedAt = $now.ToString("yyyy-MM-ddTHH:mm:sszzz")
    checkedAt = $now.ToString("yyyy-MM-ddTHH:mm:sszzz")
    sourceType = "local-generator"
    sourceLabel = "本機即時狀態產生器"
    refreshSeconds = 1
    token = [ordered]@{
        totalTokens = $token.totalTokens
        taskCount = $token.taskCount
        source = $token.source
    }
    heartbeat = [ordered]@{
        name = "蝦咩"
        ageSeconds = $heartbeatAge
        activeRequests = if ($heartbeat -and $heartbeat.PSObject.Properties.Item("active_requests")) { $heartbeat.active_requests } else { $null }
    }
    openclaw = [ordered]@{
        name = $openclaw.name
        botUsername = $LanxiBotUsername
        statusKey = $openclaw.statusKey
        statusLabel = $openclaw.statusLabel
        processCount = $openclaw.processCount
        watchdogState = $openclaw.watchdogState
        currentTaskInstruction = $lanxiTaskInstruction
        currentTaskSource = $lanxiTaskSource
    }
    monitors = $monitors
    deliverables = @(
        "公開總控台：GitHub Pages",
        "狀態資料：runtime-status.json",
        "監控項目：9 項",
        "嵐熙任務：獨立欄位",
        "功能鍵：卡點救援 / 強制停止",
        "技能包清單：功能與使用場景"
    )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath) | Out-Null
$json = $payload | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($OutputPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Write-Output "已更新：$OutputPath"
