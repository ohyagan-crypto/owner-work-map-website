const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const root = __dirname;
const port = Number(process.env.PORT || 4179);
const statusScript = path.join(root, "tools", "update-runtime-status.ps1");
const liveRuntimeStatusPath = path.join(process.env.TEMP || root, "owner-work-map-live-runtime-status.json");

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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, max-age=0",
    ...extra
  };
}

function refreshRuntimeStatus() {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
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
