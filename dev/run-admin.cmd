@echo off
setlocal

rem The admin tool, in one of its two modes. This is what a terminal tab runs;
rem the launchers beside it decide which mode and then get out of the way.
rem
rem The two modes differ in three things and nothing else: the environment name,
rem which storage the figures are synced from, and which archive folder they are
rem kept in. That last one matters most. The archive is the record, so seeded and
rem made-up figures from local development must not be written into the folder
rem that holds what the site actually collected.
rem
rem     run-admin.cmd local     Azurite, and an archive of its own
rem     run-admin.cmd live      the real account, and the real archive

set "MODE=%~1"

if /i "%MODE%"=="local" goto local
if /i "%MODE%"=="live" goto live

echo Usage: run-admin.cmd local^|live
exit /b 2

:local
set "ASPNETCORE_ENVIRONMENT=Development"
set "Admin__AzureWebJobsStorage=UseDevelopmentStorage=true"
set "Admin__DataRoot=%LocalAppData%\analytics-admin-dev"

rem The local API, for the health panel. It is the only thing the tool asks over
rem HTTP, and only when somebody presses the button.
if not defined Admin__AnalyticsApiUrl set "Admin__AnalyticsApiUrl=http://localhost:5080"

echo Admin tool, local: Azurite, archiving to "%Admin__DataRoot%".
goto run

:live
set "ASPNETCORE_ENVIRONMENT=Production"

rem The connection string is a secret, so it arrives in the environment and is
rem never written down here. The launcher checks for it too, but this is the
rem file that would actually start a host against nothing, so it checks again.
if not defined Admin__AzureWebJobsStorage (
    echo No Admin__AzureWebJobsStorage in the environment, so there is nothing to read.
    echo Start this through start-admin-prod.cmd, which explains how to set it.
    exit /b 1
)

rem Without this, a missing connection string is not an error: AdminOptions
rem defaults to the emulator, so the tool would come up wearing production's
rem name, read Azurite, and archive a laptop's figures into the real record.
echo "%Admin__AzureWebJobsStorage%" | findstr /i /c:"UseDevelopmentStorage" /c:"devstoreaccount1" /c:"127.0.0.1" >nul
if not errorlevel 1 (
    echo Admin__AzureWebJobsStorage names the emulator, not a real account.
    echo Refusing to run in live mode against Azurite: the two archives would mix.
    exit /b 1
)

rem DataRoot is deliberately not set: the default is the real archive.

rem The deployed demos, for the health panel. Public addresses, not secrets.
if not defined Admin__TasklyUrl set "Admin__TasklyUrl=https://taskly.christianszasz.dev"
if not defined Admin__Stack86Url set "Admin__Stack86Url=https://stack86.christianszasz.dev"

rem Empty is a working state: the health panel says it has no API to ask rather
rem than failing, and everything else on the page comes off local disk.
if not defined Admin__AnalyticsApiUrl (
    echo No Admin__AnalyticsApiUrl set, so the health panel has nothing to ask.
)

echo Admin tool, live. Anything synced here goes into the archive that is the record.
goto run

:run
pushd "%~dp0.." || (echo Could not reach the project folder. & exit /b 1)
dotnet run --project admin\Admin.Api
set "RESULT=%errorlevel%"
popd
exit /b %RESULT%
