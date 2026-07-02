@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo.
echo ========================================
echo   mtock 로컬 실행 (v0.1.7)
echo   폴더: %CD%
echo ========================================
echo.

if not exist "package.json" (
  echo [X] package.json 없음 — stock-report 폴더에서 실행하세요.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1] npm install...
  call npm install
)

echo [2] 이전 빌드 캐시 삭제 (.next)...
if exist ".next" rmdir /s /q ".next"

echo [3] dev 서버 시작 — 종료: 이 창에서 Ctrl+C
echo     확인: 설정 탭 하단 "mtock v0.1.7" / 성과 탭 "성과 구분"
echo.
start http://localhost:3000
call npm run dev
