@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo.
echo ========================================
echo   mtock 단독 실행판
echo   폴더: %CD%
echo ========================================
echo.

if not exist "package.json" (
echo   mtock 판매용 — START-SALE.bat 과 동일
echo   연구용은 DEV.bat
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1] npm install...
  call npm install
  if errorlevel 1 (
    echo [X] npm install 실패 — Node.js 20+ 설치 후 다시 시도하세요.
    pause
    exit /b 1
  )
)

if not exist ".env.local" (
  echo [2] .env.standalone ^→ .env.local 복사...
  copy /Y ".env.standalone" ".env.local" >nul
)

if not exist ".next\BUILD_ID" (
  echo [3] 프로덕션 빌드 중 ^(최초 1회, 2~5분^)...
  call npm run build
  if errorlevel 1 (
    echo [X] 빌드 실패 — 위 오류 메시지를 확인하세요.
    pause
    exit /b 1
  )
)

echo [4] 서버 시작 — 종료: 이 창에서 Ctrl+C
echo     브라우저: http://localhost:3000
echo.
start http://localhost:3000
call npm run start
