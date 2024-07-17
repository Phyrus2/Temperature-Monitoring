@echo off
setlocal enabledelayedexpansion

REM Path to your HTML file
set file_path=C:\laragon\www\Temperature-Monitoring\index.html

REM Open the HTML file in the default browser
start "" "%file_path%"

REM Infinite loop to refresh the browser every 5 seconds
:loop
timeout /t 5 > nul
REM Refresh the browser by re-opening the HTML file
start "" "%file_path%"
goto loop
