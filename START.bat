@echo off
cd /d "%~dp0"
if not exist "node_modules\@supabase\supabase-js" (
  echo Installing packages...
  call npm install
)
echo Open http://localhost:3000
start http://localhost:3000
call npm run dev
