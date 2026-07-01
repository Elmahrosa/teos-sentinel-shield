@echo off
setlocal enabledelayedexpansion

set TOOL_NAME=TEOS Sentinel Shield CLI
set SCRIPT_DIR=%~dp0
set SCRIPT=teos.js

where node >nul 2>nul
if errorlevel 1 (
    echo %TOOL_NAME%
    echo.
    echo This script requires Node.js to run.
    echo.
    echo Download Node.js: https://nodejs.org/
    echo.
    echo After installation, run:
    echo   node "%SCRIPT_DIR%%SCRIPT%" scan ^<file^>
    echo.
    pause
    exit /b 1
)

node "%SCRIPT_DIR%%SCRIPT%" %*
exit /b %errorlevel%
