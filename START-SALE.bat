@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo.
echo ========================================
echo   mtock 판매용 (release/sale)
echo   docs/SALE_QA_CHECKLIST.md 검수 후 사용
echo ========================================
echo.

if not exist "package.json" (
  echo [X] package.json 없음
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1] npm install...
  call npm install
)

if not exist ".env.local" (
  echo [2] .env.sale.example ^→ .env.local
  copy /Y ".env.sale.example" ".env.local" >nul
) else (
  findstr /C:"NEXT_PUBLIC_STANDALONE=true" ".env.local" >nul 2>&1
  if errorlevel 1 (
    echo [!] .env.local 에 NEXT_PUBLIC_STANDALONE=true 가 없습니다.
    echo     판매용 검수는 .env.sale.example 기준으로 맞추세요.
    pause
  )
)

if not exist ".next\BUILD_ID" (
  echo [3] build...
  call npm run build:sale
  if errorlevel 1 pause & exit /b 1
)

echo [4] start — Ctrl+C 종료
start http://localhost:3000
call npm run start
