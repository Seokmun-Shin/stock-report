@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo.
echo ========================================
echo   mtock 연구용 (research)
echo   npm run dev — 핫 리로드
echo ========================================
echo.

if not exist "package.json" (
  echo [X] package.json 없음
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo npm install...
  call npm install
)

if not exist ".env.local" (
  echo.
  echo [!] .env.local 없음 — .env.research.example 을 참고하세요.
  echo     판매용 STANDALONE=true 는 연구용에 넣지 마세요.
  echo.
)

echo 브랜치: research 권장 · docs/BRANCH_WORKFLOW.md
echo http://localhost:3000
echo.
start http://localhost:3000
call npm run dev
