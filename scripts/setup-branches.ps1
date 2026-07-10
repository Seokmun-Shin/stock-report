# mtock Git branches (research + release/sale)
Set-Location (Join-Path $PSScriptRoot "..")

$sale = "release/sale"

if (-not (Test-Path ".git")) {
  Write-Error ".git not found in $(Get-Location). Run: git init"
  exit 1
}

Write-Host "Current:" (git rev-parse --abbrev-ref HEAD)

foreach ($name in @("research", $sale)) {
  git show-ref --verify --quiet "refs/heads/$name" 2>$null
  if ($LASTEXITCODE -ne 0) {
    git branch $name
    Write-Host "[+] created: $name"
  } else {
    Write-Host "[=] exists: $name"
  }
}

Write-Host "`nDone. git checkout research  OR  git checkout release/sale"
