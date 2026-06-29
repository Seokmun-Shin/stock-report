@echo off
chcp 65001 >nul 2>&1
cd /d "C:\Users\신석문\Desktop\stock-report"

echo.
echo ===== 1. Git 상태 =====
git status
echo.
echo ===== 2. 최근 커밋 (로컬) =====
git log -3 --oneline
echo.
echo ===== 3. 원격과 비교 =====
git fetch origin 2>&1
git status -sb
echo.

set /p DO_PUSH=지금 GitHub에 push 하시겠습니까? (Y/N): 
if /i not "%DO_PUSH%"=="Y" goto :end

git add lib/calc.ts lib/seed.ts lib/supabase package.json tsconfig.json
git commit -m "Fix seed.ts createdAt type for Vercel build" 2>nul
if errorlevel 1 echo (커밋할 변경 없음 - 이미 커밋됐을 수 있음)

echo.
echo ===== 4. Push 중... (GitHub 로그인 창이 뜰 수 있음) =====
git push origin main
echo.
if errorlevel 1 (
  echo.
  echo [실패] push 가 안 됐습니다. GitHub 로그인/2FA 를 완료해 주세요.
  echo 브라우저: https://github.com/Seokmun-Shin/stock-report/commits/main
) else (
  echo.
  echo [성공] 1~2분 후 Vercel Deployments 맨 위에 새 줄이 생깁니다.
  echo        F5 새로고침 하세요.
)

:end
echo.
pause
