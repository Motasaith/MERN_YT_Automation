@echo off
echo Starting CreatorFlow Mobile App...
echo.

:: Start backend server (needed for API)
echo [1/2] Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0server && npm start"

:: Small delay to let backend initialize
timeout /t 3 /nobreak >nul

:: Start Expo mobile dev server
echo [2/2] Starting Expo Mobile Dev Server...
start "Mobile App" cmd /k "cd /d %~dp0mobile && npx expo start"

echo.
echo Backend + Mobile Expo servers are running in separate windows.
echo Scan the QR code with Expo Go app on your phone.
echo Press any key to exit.
pause >nul
