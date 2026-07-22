import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (!value.startsWith("--")) continue;
  args.set(value.slice(2), process.argv[index + 1] || "");
  index += 1;
}

const file = args.get("file");
const url = args.get("url");
const password = args.get("password") || "";
const targetRoot = path.resolve(args.get("target-root") || process.cwd());
const dryRun = args.has("dry-run");

if ((!file && !url) || !password) {
  console.error("用法：node apply-codex-update.mjs --file <.bsmf> --password <密碼> --target-root <Codex根目錄> [--dry-run]");
  console.error("或：node apply-codex-update.mjs --url <更新包網址> --password <密碼> --target-root <Codex根目錄>");
  process.exit(2);
}

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codex-apply-"));
const envelopePath = path.join(temporaryRoot, "update.bsmf");
const zipPath = path.join(temporaryRoot, "payload.zip");
const extractRoot = path.join(temporaryRoot, "payload");

function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyTree(sourcePath, destinationPath);
    else if (entry.isFile()) fs.copyFileSync(sourcePath, destinationPath);
  }
}

try {
  if (url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("無法下載更新包：HTTP " + response.status);
    fs.writeFileSync(envelopePath, Buffer.from(await response.arrayBuffer()));
  } else {
    fs.copyFileSync(path.resolve(file), envelopePath);
  }

  const envelope = JSON.parse(fs.readFileSync(envelopePath, "utf8"));
  if (envelope.format !== "bsmf-codex-update-v1") throw new Error("更新包格式不受支援。");
  const key = crypto.pbkdf2Sync(Buffer.from(password, "utf8"), Buffer.from(envelope.salt, "base64"), envelope.iterations, 32, "sha256");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.payload, "base64")), decipher.final()]);
  const digest = crypto.createHash("sha256").update(plaintext).digest("hex");
  if (digest !== envelope.payloadSha256) throw new Error("更新包完整性驗證失敗。");
  fs.writeFileSync(zipPath, plaintext);

  fs.mkdirSync(extractRoot, { recursive: true });
  execFileSync("powershell.exe", [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
    "$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath '" + zipPath.replaceAll("'", "''") + "' -DestinationPath '" + extractRoot.replaceAll("'", "''") + "' -Force"
  ], { stdio: "inherit", windowsHide: true });

  const manifestPath = path.join(extractRoot, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.format !== "bsmf-codex-update-v1") throw new Error("更新包內部標記不正確。");
  const allowedRoots = new Set(["skills", "memories", "workflows", "INSTALL_FOR_OTHER_CODEX.md"]);
  const files = (manifest.contents || []).filter((item) => item !== "manifest.json");
  for (const relative of files) {
    const normalized = relative.replaceAll("\\", "/");
    const first = normalized.split("/")[0];
    if (!allowedRoots.has(first)) throw new Error("更新包包含不允許的路徑：" + relative);
    if (normalized.includes("..") || path.isAbsolute(normalized)) throw new Error("更新包路徑不安全：" + relative);
  }

  console.log("已驗證：" + manifest.title + "（" + manifest.version + "）");
  console.log("包含檔案：" + files.length + " 個");
  console.log("目標目錄：" + targetRoot);
  if (dryRun) {
    console.log("乾跑完成，未修改檔案。");
  } else {
    for (const root of allowedRoots) {
      const source = path.join(extractRoot, root);
      if (!fs.existsSync(source)) continue;
      if (fs.statSync(source).isDirectory()) copyTree(source, path.join(targetRoot, root));
      else fs.copyFileSync(source, path.join(targetRoot, root));
    }
    console.log("更新已套用完成；請重新啟動 Codex 或目前的 Bot 以重新載入索引。");
  }
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
