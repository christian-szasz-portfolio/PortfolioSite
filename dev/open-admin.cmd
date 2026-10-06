@echo off
setlocal

rem Opens the admin tool, starting its logon task first if it is not running.

set "URL=http://127.0.0.1:5099/"

curl -s -o nul -m 2 "%URL%" && goto open

powershell -NoProfile -Command "Start-ScheduledTask -TaskName 'Analytics admin (live)'" || (
    echo The "Analytics admin (live)" task is missing. Use start-admin-prod.cmd instead.
    pause
    exit /b 1
)

rem Waits up to 3 minutes, since the first start builds the project
for /l %%i in (1,1,90) do (
    curl -s -o nul -m 1 "%URL%" && goto open
    timeout /t 2 /nobreak >nul
)

echo The admin tool did not answer within 3 minutes. See %LocalAppData%\analytics-admin\admin.log
pause
exit /b 1

:open
start "" "%URL%"
exit /b 0
