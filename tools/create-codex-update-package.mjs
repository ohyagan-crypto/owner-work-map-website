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

const inputRoot = path.resolve(args.get("input") || "");
const outputFile = path.resolve(args.get("output") || "");
const title = args.get("title") || "Codex 更新包";
const description = args.get("description") || "記憶、技能與工作流更新包";
const password = args.get("password") || "";
const version = args.get("version") || new Date().toISOString().slice(0, 10).replaceAll("-", "");

if (!inputRoot || !outputFile || !password || !fs.existsSync(inputRoot)) {
  console.error("用法：node create-codex-update-package.mjs --input <資料夾> --output <.bsmf> --password <密碼> [--title <標題>] [--description <說明>] [--version <版本>]");
  process.exit(2);
}

const blockedNames = [
  ".env", ".env.", "cookie", "credential", "browser-profile", "auth", "token", "secret",
  ".jsonl", ".sqlite", ".db", ".pem", ".key", ".pfx", ".session"
];

function isBlocked(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/").toLowerCase();
  return blockedNames.some((item) => normalized.includes(item));
}

function listFiles(root, current = root) {
  const entries = [];
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    const relative = path.relative(root, absolute);
    if (isBlocked(relative)) continue;
    if (entry.isDirectory()) entries.push(...listFiles(root, absolute));
    else if (entry.isFile()) entries.push(relative);
  }
  return entries;
}

function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyTree(sourcePath, destinationPath);
    else if (entry.isFile()) fs.copyFileSync(sourcePath, destinationPath);
  }
}

const files = listFiles(inputRoot).sort();
if (!files.length) {
  console.error("更新包沒有可交付檔案；只允許放入 skills、memories、workflows 或文件。");
  process.exit(3);
}

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codex-update-"));
const zipPath = path.join(temporaryRoot, "payload.zip");
const stagingRoot = path.join(temporaryRoot, "payload");
copyTree(inputRoot, stagingRoot);

const manifest = {
  format: "bsmf-codex-update-v1",
  id: "codex-update-" + version,
  version,
  createdAt: new Date().toISOString(),
  title,
  description,
  contents: files,
  apply: "將 skills、memories、workflows 合併到接收端指定的 Codex 根目錄；先驗證再覆蓋。"
};
fs.writeFileSync(path.join(stagingRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

execFileSync("powershell.exe", [
  "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
  "$ErrorActionPreference='Stop'; Compress-Archive -Path '" + stagingRoot.replaceAll("'", "''") + "\\*' -DestinationPath '" + zipPath.replaceAll("'", "''") + "' -Force"
], { stdio: "inherit", windowsHide: true });

const plaintext = fs.readFileSync(zipPath);
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(Buffer.from(password, "utf8"), salt, 310000, 32, "sha256");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const tag = cipher.getAuthTag();
const envelope = {
  format: "bsmf-codex-update-v1",
  kdf: "PBKDF2-SHA256",
  iterations: 310000,
  cipher: "AES-256-GCM",
  manifest,
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  tag: tag.toString("base64"),
  payloadSha256: crypto.createHash("sha256").update(plaintext).digest("hex"),
  payload: ciphertext.toString("base64")
};

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(envelope), "utf8");
fs.rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({ output: outputFile, manifest, bytes: fs.statSync(outputFile).size }, null, 2));
