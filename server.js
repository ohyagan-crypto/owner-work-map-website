const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");

const root = __dirname;
const port = Number(process.env.PORT || 4206);
const statusScript = path.join(root, "tools", "update-runtime-status.ps1");
const rescueScript = path.join(root, "tools", "rescue-dashboard-blocker.ps1");
const forceStopScript = path.join(root, "tools", "force-stop-dashboard-work.ps1");
const restartScript = path.join(root, "tools", "restart-dashboard-bot.ps1");
const outputDir = path.join(root, "output");
const secretPath = path.join(outputDir, "dashboard-control-secret.json");
const auditPath = path.join(outputDir, "dashboard-action-history.json");
const restartQueuePath = path.join(outputDir, "dashboard-restart-queue.json");
const liveRuntimeStatusPath = path.join(process.env.TEMP || root, "owner-work-map-live-runtime-status.json");
const windowsPowerShellPath = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
const pwshPath = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
const powershellExe = fs.existsSync(pwshPath) ? pwshPath : (fs.existsSync(windowsPowerShellPath) ? windowsPowerShellPath : "powershell.exe");
const allowedOrigins = new Set([
  "https://ohyagan-crypto.github.io",
  `http://127.0.0.1:${port}`,
  `http://localhost:${port}`
]);
const sessions = new Map();
const failedUnlocks = new Map();
const eventClients = new Set();
let cachedStatus = null;
let cachedStatusAt = 0;
let statusRefreshPromise = null;
let queueProcessorBusy = false;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

fs.mkdirSync(outputDir, { recursive: true });

function requestOrigin(req) {
  const origin = String(req.headers.origin || "");
  return allowedOrigins.has(origin) ? origin : "";
}

function corsHeaders(req, extra = {}) {
  const origin = requestOrigin(req);
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Dashboard-Target, X-Dashboard-Session",
    "Cache-Control": "no-store, max-age=0",
    ...extra
  };
}

function sendJson(req, res, statusCode, payload) {
  res.writeHead(statusCode, corsHeaders(req, { "Content-Type": "application/json; charset=utf-8" }));
  res.end(JSON.stringify(payload));
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureControlSecret() {
  const existing = readJson(secretPath, null);
  if (existing?.code && existing?.salt && existing?.hash) return existing;
  const code = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(code, salt, 32).toString("hex");
  const secret = { code, salt, hash, createdAt: new Date().toISOString(), note: "公開控制頁操作碼；請勿提交版本庫或傳給他人。" };
  writeJson(secretPath, secret);
  return secret;
}

const controlSecret = ensureControlSecret();

function safeEqualHex(left, right) {
  try {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

function verifyControlCode(code) {
  if (!/^\d{6}$/.test(String(code || ""))) return false;
  const hash = crypto.scryptSync(String(code), controlSecret.salt, 32).toString("hex");
  return safeEqualHex(hash, controlSecret.hash);
}

function clientKey(req) {
  return String(req.headers["cf-connecting-ip"] || req.socket.remoteAddress || "unknown");
}

function createSession() {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 30 * 60 * 1000;
  sessions.set(token, expiresAt);
  return { token, expiresAt };
}

function sessionToken(req) {
  const auth = String(req.headers.authorization || "");
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return String(req.headers["x-dashboard-session"] || "").trim();
}

function hasValidSession(req) {
  const token = sessionToken(req);
  const expiresAt = sessions.get(token) || 0;
  if (!token || expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return false;
  }
  return true;
}

function requireControlSession(req, res) {
  if (hasValidSession(req)) return true;
  sendJson(req, res, 401, { ok: false, code: "CONTROL_LOCKED", message: "控制功能已鎖定，請先輸入本機操作碼。" });
  return false;
}

function readBody(req, limit = 8192) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > limit) reject(new Error("body too large"));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeTarget(value) {
  if (value === "shami" || value === "mengzi" || value === "tg3") return value;
  return "shami";
}

function targetLabel(target) {
  return target === "mengzi" ? "林孟姿（TG2）" : target === "tg3" ? "嵐熙（TG3）" : "蝦咩（TG1）";
}

function targetFromRequest(req, url) {
  return normalizeTarget(url.searchParams.get("target") || req.headers["x-dashboard-target"]);
}

function runPowerShellScript(scriptPath, target, extraArgs = []) {
  return new Promise((resolve, reject) => {
    execFile(powershellExe, [
      "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath,
      "-SiteRoot", root, "-Target", normalizeTarget(target), ...extraArgs
    ], { windowsHide: true, timeout: 60000, maxBuffer: 1024 * 1024 }, (error, stdout) => {
      if (error) return reject(error);
      resolve(stdout.trim());
    });
  });
}

function refreshRuntimeStatus() {
  if (statusRefreshPromise) return statusRefreshPromise;
  statusRefreshPromise = new Promise((resolve, reject) => {
    execFile(powershellExe, [
      "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", statusScript,
      "-SiteRoot", root, "-OutputPath", liveRuntimeStatusPath
    ], { windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024 }, (error) => {
      statusRefreshPromise = null;
      if (error) return reject(error);
      try {
        const status = JSON.parse(fs.readFileSync(liveRuntimeStatusPath, "utf8"));
        cachedStatus = { ...status, sourceType: "live-api", sourceLabel: "本機即時狀態 API", checkedAt: new Date().toISOString() };
        cachedStatusAt = Date.now();
        resolve(cachedStatus);
      } catch (readError) {
        reject(readError);
      }
    });
  });
  return statusRefreshPromise;
}

async function getFreshStatus(maxAgeMs = 1500) {
  if (cachedStatus && Date.now() - cachedStatusAt <= maxAgeMs) return cachedStatus;
  return refreshRuntimeStatus();
}

function activeRequestsFor(status, target) {
  if (target === "mengzi") return Number(status?.tgbot2?.activeRequests || 0);
  if (target === "tg3") return Number(status?.tgbot3?.activeRequests || 0);
  return Number(status?.heartbeat?.activeRequests || 0);
}

function readAuditHistory() {
  const value = readJson(auditPath, []);
  return Array.isArray(value) ? value : [];
}

function appendAudit(entry) {
  const history = readAuditHistory();
  history.unshift(entry);
  writeJson(auditPath, history.slice(0, 100));
  broadcastEvent("action", { history: sanitizeAudit(history.slice(0, 20)) });
}

function updateAudit(id, changes) {
  const history = readAuditHistory();
  const index = history.findIndex((item) => item.id === id);
  if (index >= 0) history[index] = { ...history[index], ...changes };
  writeJson(auditPath, history.slice(0, 100));
  broadcastEvent("action", { history: sanitizeAudit(history.slice(0, 20)) });
}

function sanitizeAudit(history) {
  return history.map(({ oldPid, newPid, ...item }) => item);
}

function readRestartQueue() {
  const value = readJson(restartQueuePath, []);
  return Array.isArray(value) ? value : [];
}

function writeRestartQueue(queue) {
  writeJson(restartQueuePath, queue);
}

function queueRestart(target, reason, auditId) {
  const queue = readRestartQueue().filter((item) => item.target !== target);
  queue.push({ target, reason, auditId, queuedAt: new Date().toISOString() });
  writeRestartQueue(queue);
}

async function executeRestart(target, mode, reason, auditId) {
  updateAudit(auditId, { status: "running", startedAt: new Date().toISOString(), message: `${targetLabel(target)}正在重啟。` });
  try {
    const output = await runPowerShellScript(restartScript, target, ["-Mode", mode, "-Reason", reason || "網站控制台操作"]);
    const detail = readJson(path.join(outputDir, `restart-${target}-latest.json`), {});
    updateAudit(auditId, {
      status: "completed",
      completedAt: new Date().toISOString(),
      message: output || `${targetLabel(target)}已重啟完成。`,
      oldPid: detail.oldPid,
      newPid: detail.newPid,
      heartbeatAt: detail.heartbeatAt
    });
    await refreshAndBroadcastStatus();
    return output;
  } catch {
    updateAudit(auditId, { status: "failed", completedAt: new Date().toISOString(), message: `${targetLabel(target)}重啟未完成。` });
    throw new Error("restart failed");
  }
}

async function processRestartQueue() {
  if (queueProcessorBusy) return;
  const queue = readRestartQueue();
  if (!queue.length) return;
  queueProcessorBusy = true;
  try {
    const status = await getFreshStatus(0);
    const remaining = [];
    for (const item of queue) {
      if (activeRequestsFor(status, item.target) > 0) {
        remaining.push(item);
        continue;
      }
      await executeRestart(item.target, "safe", item.reason, item.auditId).catch(() => {});
    }
    writeRestartQueue(remaining);
  } catch {
    // Keep the queue for the next verified pass.
  } finally {
    queueProcessorBusy = false;
  }
}

function broadcastEvent(name, payload) {
  const data = `event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of eventClients) {
    try { client.write(data); } catch { eventClients.delete(client); }
  }
}

async function refreshAndBroadcastStatus() {
  try {
    const previous = cachedStatus ? JSON.stringify(cachedStatus) : "";
    const status = await refreshRuntimeStatus();
    if (JSON.stringify(status) !== previous) broadcastEvent("status", status);
    return status;
  } catch {
    return null;
  }
}

async function handleStatusApi(req, res) {
  try {
    sendJson(req, res, 200, await getFreshStatus());
  } catch {
    sendJson(req, res, 503, { statusKey: "blocked", statusLabel: "即時狀態讀取失敗" });
  }
}

async function handleUnlock(req, res) {
  const key = clientKey(req);
  const current = failedUnlocks.get(key) || { count: 0, blockedUntil: 0 };
  if (current.blockedUntil > Date.now()) {
    sendJson(req, res, 429, { ok: false, message: "操作碼嘗試次數過多，請稍後再試。" });
    return;
  }
  try {
    const body = await readBody(req);
    if (!verifyControlCode(body.code)) {
      const count = current.count + 1;
      failedUnlocks.set(key, { count, blockedUntil: count >= 5 ? Date.now() + 10 * 60 * 1000 : 0 });
      sendJson(req, res, 401, { ok: false, message: "操作碼不正確。" });
      return;
    }
    failedUnlocks.delete(key);
    const session = createSession();
    sendJson(req, res, 200, { ok: true, ...session, message: "控制功能已解鎖 30 分鐘。" });
  } catch {
    sendJson(req, res, 400, { ok: false, message: "操作碼格式不正確。" });
  }
}

async function handleActionApi(req, res, action, scriptPath, successLabel, target, url) {
  if (!requireControlSession(req, res)) return;
  const mode = url.searchParams.get("mode") === "force" ? "force" : "safe";
  const reason = String(url.searchParams.get("reason") || "網站控制台操作").slice(0, 120);
  const auditId = crypto.randomUUID();
  const audit = {
    id: auditId, action, mode, target, targetLabel: targetLabel(target), reason,
    requestedAt: new Date().toISOString(), status: "requested", message: "操作已送出。"
  };
  appendAudit(audit);

  try {
    if (!fs.existsSync(scriptPath)) throw new Error("missing action script");
    if (action === "restart") {
      const status = await getFreshStatus(0);
      const activeRequests = activeRequestsFor(status, target);
      if (mode === "safe" && activeRequests > 0) {
        queueRestart(target, reason, auditId);
        updateAudit(auditId, { status: "queued", message: `${targetLabel(target)}目前有 ${activeRequests} 個任務，已排定任務完成後自動重啟。` });
        sendJson(req, res, 202, { ok: true, queued: true, target, mode, message: `${targetLabel(target)}目前有任務，已排定完成後安全重啟。` });
        return;
      }
      const output = await executeRestart(target, mode, reason, auditId);
      sendJson(req, res, 200, { ok: true, target, mode, message: output || successLabel, checkedAt: new Date().toISOString() });
      return;
    }

    updateAudit(auditId, { status: "running", startedAt: new Date().toISOString() });
    const output = await runPowerShellScript(scriptPath, target);
    updateAudit(auditId, { status: "completed", completedAt: new Date().toISOString(), message: output || successLabel });
    sendJson(req, res, 200, { ok: true, target, mode, message: output || successLabel, checkedAt: new Date().toISOString() });
    await refreshAndBroadcastStatus();
  } catch {
    updateAudit(auditId, { status: "failed", completedAt: new Date().toISOString(), message: "本機操作沒有完成。" });
    sendJson(req, res, 503, { ok: false, message: "本機操作沒有完成，請檢查即時服務或排程權限。" });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  if (url.pathname === "/api/status") return void handleStatusApi(req, res);

  if (url.pathname === "/api/events") {
    res.writeHead(200, corsHeaders(req, {
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }));
    res.write("retry: 5000\n\n");
    eventClients.add(res);
    if (cachedStatus) res.write(`event: status\ndata: ${JSON.stringify(cachedStatus)}\n\n`);
    res.write(`event: action\ndata: ${JSON.stringify({ history: sanitizeAudit(readAuditHistory().slice(0, 20)) })}\n\n`);
    req.on("close", () => eventClients.delete(res));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/control/unlock") return void handleUnlock(req, res);
  if (url.pathname === "/api/control/status") return void sendJson(req, res, 200, { required: true, unlocked: hasValidSession(req), expiresAt: sessions.get(sessionToken(req)) || null });
  if (url.pathname === "/api/action-history") {
    const history = readAuditHistory().slice(0, 20);
    return void sendJson(req, res, 200, { history: hasValidSession(req) ? history : sanitizeAudit(history), queue: readRestartQueue() });
  }

  if (req.method === "POST" && url.pathname === "/api/action/rescue") return void handleActionApi(req, res, "rescue", rescueScript, "已送出卡點救援。", targetFromRequest(req, url), url);
  if (req.method === "POST" && url.pathname === "/api/action/force-stop") return void handleActionApi(req, res, "force-stop", forceStopScript, "已送出強制停止。", targetFromRequest(req, url), url);
  if (req.method === "POST" && url.pathname === "/api/action/restart") return void handleActionApi(req, res, "restart", restartScript, "指定機器人已重啟並恢復心跳。", targetFromRequest(req, url), url);

  const safePath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const target = path.resolve(root, `.${safePath}`);
  if (!target.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(target, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(target)] || "application/octet-stream",
      "Cache-Control": target.endsWith("runtime-status.json") ? "no-store, max-age=0" : "public, max-age=30"
    });
    res.end(data);
  });
});

setInterval(() => {
  if (eventClients.size) refreshAndBroadcastStatus();
}, 2000).unref();
setInterval(processRestartQueue, 5000).unref();
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of sessions) if (expiresAt <= now) sessions.delete(token);
  for (const client of eventClients) {
    try { client.write(": keep-alive\n\n"); } catch { eventClients.delete(client); }
  }
}, 15000).unref();

server.listen(port, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${port}/`);
});
