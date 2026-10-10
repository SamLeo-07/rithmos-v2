@echo off
title RITHMOS Dev Server (Port 5045)
cd /d "%~dp0"
echo Starting RITHMOS dev server on http://localhost:5045 ...
node ./node_modules/vite/bin/vite.js
pause
