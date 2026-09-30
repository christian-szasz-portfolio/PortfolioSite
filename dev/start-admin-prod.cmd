@echo off
setlocal enabledelayedexpansion

rem The admin tool against the real storage account, on its own, with nothing
rem else started.
rem
rem It refuses until the connection string of a deployed storage account is
rem set, and refuses again if that string names the emulator, so a live run
rem never quietly becomes a local one.
rem
rem It is a separate script rather than a flag on start-dev.cmd because the two
rem are different acts. One is development, where the figures are seeded and the
rem site is on localhost. This one reads what the site actually collected, and
rem writes it into the archive that outlives the API's thirty days.

set "ADMIN_URL=http://127.0.0.1:5099/"

pushd "%~dp0.." || (echo Could not reach the project folder. & pause & exit /b 1)
set "ROOT=%CD%"
popd

set "ADMIN_APP=%ROOT%\admin\adminapp"
set "ADMIN_WWWROOT=%ROOT%\admin\Admin.Api\wwwroot"
set "SECRETS=%~dp0admin-live.env.cmd"

rem --- prerequisites ---------------------------------------------------------

where dotnet >nul 2>&1
if errorlevel 1 (
    echo dotnet is not on PATH, so the admin tool cannot start.
    pause
    exit /b 1
)

rem A local, gitignored file is one way to hold the connection string; an
rem environment variable set some other way is another. Either is fine, because
rem neither is a file in the repository.
if not defined Admin__AzureWebJobsStorage (
    if exist "%SECRETS%" call "%SECRETS%"
)

if not defined Admin__AzureWebJobsStorage (
    echo.
    echo Nothing to read yet.
    echo.
    echo   This mode needs the connection string of the deployed storage account.
    echo.
    echo   Either set it for the session:
    echo.
    echo       set "Admin__AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=..."
    echo.
    echo   or put that one line in "%SECRETS%", which git ignores, and run this again.
    echo.
    pause
    exit /b 1
)

rem A connection string that names the emulator is the dangerous case, not the
rem missing one: AdminOptions defaults to Azurite, so a live run against it would
rem come up wearing production's name and archive a laptop's figures into the
rem real record. run-admin.cmd refuses it too; this catches it before a tab is
rem opened to show the refusal in.
echo "%Admin__AzureWebJobsStorage%" | findstr /i /c:"UseDevelopmentStorage" /c:"devstoreaccount1" /c:"127.0.0.1" >nul
if not errorlevel 1 (
    echo.
    echo   Admin__AzureWebJobsStorage names the emulator, not a real account.
    echo   That is what start-dev.cmd is for. Refusing to call Azurite live: the
    echo   local archive and the record would mix, and there would be no telling
    echo   afterwards which figures came from where.
    echo.
    pause
    exit /b 1
)

rem The tool binds one fixed port, so a second run cannot stand beside the
rem first, and the one already there might be the local one. Refuse rather than
rem hand back whichever answers.
call "%~dp0dev-lib.cmd" probe "%ADMIN_URL%"
if not errorlevel 1 (
    echo Something is already answering on port 5099, and it may be the local one.
    echo Close that tab first: two runs of this tool cannot share the port.
    pause
    exit /b 1
)

rem The tool serves the dashboard out of its wwwroot, so an unbuilt dashboard is
rem a 404 rather than a page.
if not exist "%ADMIN_WWWROOT%\index.html" (
    if not exist "%ADMIN_APP%\node_modules" (
        echo The admin dashboard has not been built and its dependencies are missing.
        echo Run "npm install" in "%ADMIN_APP%" first.
        pause
        exit /b 1
    )
    echo Building the admin dashboard, which has not been built yet...
    pushd "%ADMIN_APP%"
    call npm run build
    set "BUILD_FAILED=!errorlevel!"
    popd
    if not "!BUILD_FAILED!"=="0" (
        echo The dashboard build failed. Nothing has been started.
        pause
        exit /b 1
    )
)

rem --- start it --------------------------------------------------------------

echo Starting the admin tool against the live account...

where wt.exe >nul 2>&1
if errorlevel 1 (
    start "admin tool (live)" cmd /k ""%~dp0run-admin.cmd" live"
) else (
    wt.exe -w landing-ng-live --title "admin tool (live)" -d "%ROOT%" cmd /k ""%~dp0run-admin.cmd" live"
)

call "%~dp0dev-lib.cmd" waitfor "%ADMIN_URL%" 180 "The admin tool"
if errorlevel 1 exit /b 1

echo.
echo   admin tool  %ADMIN_URL%  reading the live account
echo.
echo The page says which storage it is reading, in the badge beside the title.
echo A sync from here writes into the archive that is the record, so it is the
echo one place where pressing the button matters.
echo.

call "%~dp0dev-lib.cmd" openchrome "%ADMIN_URL%"
exit /b 0
