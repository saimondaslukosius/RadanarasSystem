@echo off
cd /d C:\Users\saimo\radanaras-frontend
start cmd /k "npm run dev"
timeout /t 5 >nul
start http://localhost:5173/
