param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d{4}$')]
    [string]$Code
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$siteRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $siteRoot 'output'
$secretPath = Join-Path $outputDir 'dashboard-control-secret.json'

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$env:DASHBOARD_CONTROL_CODE = $Code
$env:DASHBOARD_CONTROL_SECRET_PATH = $secretPath

@'
const crypto = require('crypto');
const fs = require('fs');

const code = process.env.DASHBOARD_CONTROL_CODE;
const secretPath = process.env.DASHBOARD_CONTROL_SECRET_PATH;
if (!/^\d{4}$/.test(code || '')) throw new Error('Control code must contain exactly four digits.');

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(code, salt, 32).toString('hex');
const secret = {
  code,
  salt,
  hash,
  createdAt: new Date().toISOString(),
  note: 'Local dashboard control code. Do not commit or share this file.'
};

fs.writeFileSync(secretPath, JSON.stringify(secret, null, 2) + '\n', 'utf8');
'@ | node.exe -

Remove-Item Env:DASHBOARD_CONTROL_CODE -ErrorAction SilentlyContinue
Remove-Item Env:DASHBOARD_CONTROL_SECRET_PATH -ErrorAction SilentlyContinue

Write-Output "Dashboard control code updated; restart the service to apply it."
