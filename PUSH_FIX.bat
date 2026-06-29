@echo off
cd /d "%~dp0"
echo === Git status ===
git status
echo.
echo === Last 3 commits ===
git log -3 --oneline
echo.
git add package.json tsconfig.json package-lock.json lib/calc.ts lib/supabase/portfolio.ts 2>nul
git add -A
git status
echo.
git commit -m "Fix Vercel build: TypeScript target and Set iteration"
if errorlevel 1 (
  echo.
  echo Commit failed - maybe no changes. Try empty commit:
  git commit --allow-empty -m "Trigger Vercel redeploy"
)
echo.
git push origin main
echo.
echo Check Vercel Deployments - NEW commit message should NOT be Initial commit
pause
