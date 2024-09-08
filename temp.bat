@echo off
c:
cd C:\laragon\www\Temperature-Monitoring\backend

:: Get the current date in YYYY-MM-DD format
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set logdate=%%c-%%a-%%b

:: Set the log file name with the current date
set logfile="C:\laragon\www\Temperature-Monitoring\backend\logs\log_%logdate%.txt"

:: Create logs directory if it doesn’t exist
if not exist "C:\laragon\www\Temperature-Monitoring\backend\logs" (
    mkdir "C:\laragon\www\Temperature-Monitoring\backend\logs"
)

:: Run the Node.js application and write output to the log file
node main.js > %logfile% 2>&1

echo running

:: Pause the script
pause

:: Delete log files older than 7 days
forfiles /p "C:\laragon\www\Temperature-Monitoring\backend\logs" /s /m *.txt /d -7 /c "cmd /c del @path"
