@echo off
echo Starting Ad Ops Command Center servers...
cd /d %~dp0\..
npx pm2 start ecosystem.config.js
npx pm2 save
echo.
echo Servers started! Dashboard: http://localhost:3002 Landing: http://localhost:3003