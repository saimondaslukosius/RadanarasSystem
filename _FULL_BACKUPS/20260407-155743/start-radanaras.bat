start cmd /k C:\Users\saimo\RadanarasSystem\start-backend.bat
start cmd /k "cd /d C:\Users\saimo\RadanarasSystem\frontend && npm run dev"
start cmd /k "cd /d C:\Users\saimo\RadanarasSystem\backend && codex"
timeout /t 3
start http://localhost:5173
