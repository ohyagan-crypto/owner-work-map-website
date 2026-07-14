const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const root = __dirname;
const port = Number(process.env.PORT || 4206);
const statusScript = path.join(root, "tools", "update-runtime-status.ps1");
const rescueScript = path.join(root, "tools", "rescue-dashboard-blocker.ps1");
const forceStopScript = path.join(root, "tools", "force-stop-dashboard-work.ps1");
const liveRuntimeStatusPath = path.join(process.env.TEMP || root, "owner-work-map-live-runtime-status.json");
const windowsPowerShellPath = path.join(
  process.env.SystemRoot || "C:\\Windows",
  "System32",
  "WindowsPowerShell",
  "v1.0",
  "powershell.exe"
);
const pwshPath = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
const powershellExe = fs.existsSync(pwshPath)
  ? pwshPath
  : (fs.existsSync(windowsPowerShellPath) ? windowsPowerShellPath : "powershell.exe");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Dashboard-Target",
    "Cache-Control": "no-store, max-age=0",
    ...extra
  };
}

function refreshRuntimeStatus() {
  return new Promise((resolve, reject) => {
    execFile(
      powershellExe,
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        statusScript,
        "-SiteRoot",
        root,
        "-OutputPath",
        liveRuntimeStatusPath
      ],
      {
        windowsHide: true,
        timeout: 15000,
        maxBuffer: 1024 * 1024
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }
    );
  });
}

function normalizeTarget(value) {
  if (value === "shami") return "shami";
  if (value === "mengzi") return "mengzi";
  if (value === "tg3") return "tg3";
  return "shami";
}

function targetFromRequest(req, url) {
  const queryTarget = url.searchParams.get("target");
  if (queryTarget) return normalizeTarget(queryTarget);
  const headerTarget = req.headers["x-dashboard-target"];
  return normalizeTarget(Array.isArray(headerTarget) ? headerTarget[0] : headerTarget);
}

function runPowerShellScript(scriptPath, target) {
  return new Promise((resolve, reject) => {
    execFile(
      powershellExe,
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-SiteRoot",
        root,
        "-Target",
        normalizeTarget(target)
      ],
      {
        windowsHide: true,
        timeout: 60000,
        maxBuffer: 1024 * 1024
      },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout.trim());
      }
    );
  });
}

async function handleStatusApi(res) {
  try {
    await refreshRuntimeStatus();
    const status = JSON.parse(fs.readFileSync(liveRuntimeStatusPath, "utf8"));
    const payload = {
      ...status,
      sourceType: "live-api",
      sourceLabel: "本機即時狀態 API",
      checkedAt: new Date().toISOString()
    };
    res.writeHead(200, corsHeaders({ "Content-Type": "application/json; charset=utf-8" }));
    res.end(JSON.stringify(payload));
  } catch {
    res.writeHead(503, corsHeaders({ "Content-Type": "application/json; charset=utf-8" }));
    res.end(JSON.stringify({ statusKey: "blocked", statusLabel: "即時狀態讀取失敗" }));
  }
}

async function handleActionApi(res, scriptPath, successLabel, target) {
  try {
    if (!fs.existsSync(scriptPath)) throw new Error("action script missing");
    const output = await runPowerShellScript(scriptPath, target);
    res.writeHead(200, corsHeaders({ "Content-Type": "application/json; charset=utf-8" }));
    res.end(JSON.stringify({
      ok: true,
      target: target,
      message: output || successLabel,
      checkedAt: new Date().toISOString()
    }));
  } catch {
    res.writeHead(503, corsHeaders({ "Content-Type": "application/json; charset=utf-8" }));
    res.end(JSON.stringify({ ok: false, message: "本機操作沒有完成，請檢查即時服務或排程權限。" }));
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (url.pathname === "/api/status") {
    handleStatusApi(res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/action/rescue") {
    handleActionApi(res, rescueScript, "已送出卡點救援，正在嘗試恢復續作。", targetFromRequest(req, url));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/action/force-stop") {
    handleActionApi(res, forceStopScript, "已送出強制停止。", targetFromRequest(req, url));
    return;
  }

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

server.listen(port, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${port}/`);
});
