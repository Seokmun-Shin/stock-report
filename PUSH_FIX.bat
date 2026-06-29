@echo off
cd /d "%~dp0"
echo GitHub push - Vercel rebuild
echo.
git add -A
git status
echo.
git commit -m "Fix TypeScript build for Vercel deploy"
if errorlevel 1 (
  echo No changes or commit failed.
)
git push origin main
echo.
echo Done. Check Vercel Deployments in 1-2 minutes.
pause
