@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo.
echo ========================================
echo   주식 매매 리포트 - Vercel 배포 준비
echo ========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo [X] Git이 없습니다. https://git-scm.com 에서 설치 후 다시 실행하세요.
  pause
  exit /b 1
)

if not exist .env.local (
  echo [X] .env.local 파일이 없습니다. Supabase 키를 먼저 설정하세요.
  pause
  exit /b 1
)

if not exist .git (
  echo [1] Git 저장소 초기화...
  git init
  git branch -M main
) else (
  echo [1] Git 저장소 있음
)

echo [2] 파일 스테이징...
git add .
git status

echo.
echo [3] 커밋...
git commit -m "Deploy: stock report with Supabase sync" 2>nul
if errorlevel 1 (
  echo     ^(변경 없거나 이미 커밋됨^)
)

echo.
echo ========================================
echo   다음: GitHub + Vercel ^(수동 5분^)
echo ========================================
echo.
echo A. GitHub 저장소 만들기
echo    1^) https://github.com/new 접속
echo    2^) Repository name: stock-report
echo    3^) Private 선택 ^(권장^)
echo    4^) README 추가 안 함 - Create repository
echo.
echo B. 아래 명령을 YOUR_GITHUB_ID 를 본인 ID로 바꿔 실행:
echo.
echo    git remote add origin https://github.com/YOUR_GITHUB_ID/stock-report.git
echo    git push -u origin main
echo.
echo C. Vercel 배포
echo    1^) https://vercel.com/new 접속
echo    2^) GitHub 연결 후 stock-report Import
echo    3^) Environment Variables 추가:
echo       NEXT_PUBLIC_SUPABASE_URL
echo       NEXT_PUBLIC_SUPABASE_ANON_KEY
echo       ^(.env.local 내용 복사^)
echo    4^) Deploy
echo.
echo D. Supabase URL 설정 ^(배포 URL 받은 후^)
echo    Authentication - URL Configuration
echo    Site URL: https://your-app.vercel.app
echo    Redirect URLs: https://your-app.vercel.app/**
echo.
echo 자세한 설명: VERCEL_배포.md
echo.
pause
