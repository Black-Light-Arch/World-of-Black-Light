@echo off
echo.
echo  ====================================
echo   WORLD OF BLACKLIGHT — SERVER 2.0
echo  ====================================
echo.
echo  Starting server on http://localhost:3000
echo.
echo  Admin Login:  admin / Admin@1234
echo  Test Player:  shadowblade / Player@123
echo.
cd /d "%~dp0blacklight-server"
node --experimental-sqlite server.js
pause
