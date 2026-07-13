# mtock 판매용 ZIP (exe 제외) — release/sale 검수 통과 후 실행
# 사용: .\scripts\pack-sale-zip.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$version = "1.0.0"
if (Test-Path "lib\appVersion.ts") {
  if ((Get-Content "lib\appVersion.ts" -Raw) -match 'APP_VERSION = "([^"]+)"') {
    $version = $Matches[1]
  }
}

$outDir = "dist"
$zipName = "mtock-sale-v$version.zip"
$staging = Join-Path $outDir "mtock-sale-staging"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$excludeDirs = @("node_modules", ".git", "dist", ".cursor", ".vscode")
$excludeFiles = @(".env.local", ".env.local.research.bak", "tsconfig.tsbuildinfo")

Get-ChildItem -Force | Where-Object {
  $_.Name -notin $excludeDirs -and $_.Name -notlike "*.zip"
} | ForEach-Object {
  if ($_.PSIsContainer) {
    Copy-Item $_.FullName -Destination (Join-Path $staging $_.Name) -Recurse -Force
  } else {
    if ($_.Name -notin $excludeFiles) {
      Copy-Item $_.FullName -Destination (Join-Path $staging $_.Name) -Force
    }
  }
}

foreach ($dir in $excludeDirs) {
  $p = Join-Path $staging $dir
  if (Test-Path $p) { Remove-Item $p -Recurse -Force }
}

Copy-Item "docs\STANDALONE_USER.md" -Destination (Join-Path $staging "USER_GUIDE_KO.md") -Force
Copy-Item ".env.sale.example" -Destination (Join-Path $staging ".env.sale.example") -Force

$zipPath = Join-Path $outDir $zipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force

Write-Host ""
Write-Host "Created: $zipPath"
Write-Host "Include: START-SALE.bat, source, .next (if built), USER_GUIDE_KO.md"
