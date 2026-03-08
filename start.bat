@echo off
echo Starting YouTube Automation Studio...
echo.

:: Start backend server
echo [1/2] Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0server && npm start"

:: Small delay to let backend initialize
timeout /t 2 /nobreak >nul

:: Start frontend dev server
echo [2/2] Starting frontend dev server...
start "Frontend Dev" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both servers are running in separate windows.
echo Close this window or press any key to exit.
pause >nul
