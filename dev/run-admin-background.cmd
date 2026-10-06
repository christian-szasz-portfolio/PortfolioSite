@echo off
rem The admin tool against the live account with no window, for the logon task. Output goes to
rem %LocalAppData%\analytics-admin\admin.log, outside the repository.

set "LOG_DIR=%LocalAppData%\analytics-admin"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
set "LOG=%LOG_DIR%\admin.log"

if not defined Admin__AzureWebJobsStorage (
    if exist "%~dp0admin-live.env.cmd" call "%~dp0admin-live.env.cmd"
)

echo ==== %date% %time% starting the admin tool >> "%LOG%"
call "%~dp0run-admin.cmd" live >> "%LOG%" 2>&1
