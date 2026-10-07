@echo off
title GreenSync Microgrid EMS Launcher
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-greensync.ps1"
if errorlevel 1 (
  echo.
  echo GreenSync could not start. Read the error above and .run-logs if present.
  pause
  exit /b 1
)
