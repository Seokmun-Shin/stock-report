@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0\.."

set "BR_SALE=release/sale"

echo.
echo mtock Git branch setup
echo   research
echo   release-sale  (release/sale)
echo.

if not exist ".git" (
  echo [X] .git not found in %CD%
  echo     Run: git init
  pause
  exit /b 1
)

for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT=%%b"
echo Current branch: %CURRENT%
echo.

git show-ref --verify --quiet "refs/heads/research"
if errorlevel 1 (
  git branch research
  echo [+] created: research
) else (
  echo [=] exists: research
)

git show-ref --verify --quiet "refs/heads/%BR_SALE%"
if errorlevel 1 (
  git branch "%BR_SALE%"
  echo [+] created: %BR_SALE%
) else (
  echo [=] exists: %BR_SALE%
)

echo.
echo Done.
echo   Research: git checkout research
echo   Sale:     git checkout "%BR_SALE%"
echo   See docs\BRANCH_WORKFLOW.md
echo.
pause
