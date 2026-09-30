@echo off
setlocal enabledelayedexpansion

rem Double-click launcher for the whole local stack: the storage emulator, the
rem analytics API, the local-only admin tool and the site, each in its own
rem Windows Terminal tab, then Chrome on the two that have a page to look at.
rem
rem Everything here is local. The site is on localhost, the storage is Azurite,
rem and the figures are whatever this machine has seeded or clicked. The admin
rem tool is started in its local mode and archives to a folder of its own, so
rem nothing made up here lands in the archive that holds what the site actually
rem collected. For that one, see start-admin-prod.cmd.
rem
rem The order is deliberate. The site goes first because its build is the
rem longest and it depends on nothing here. Azurite is waited for next, because
rem both .NET hosts open a TableClient on the way up and a table endpoint that
rem is not listening yet is a startup failure rather than a retry. The two .NET
rem hosts then start one after the other rather than together: they share
rem Analytics.Domain and Analytics.Infrastructure, and two builds writing the
rem same obj and bin folders at once is how you get a locked file instead of a
rem host.

set "SITE_PORT=4200"
set "SITE_URL=http://localhost:%SITE_PORT%/"
set "API_URL=http://localhost:5080/health"
set "ADMIN_URL=http://127.0.0.1:5099/"
set "AZURITE_URL=http://127.0.0.1:10002/devstoreaccount1"

rem Azurite's own files. Outside the repository, because they are a local
rem database rather than anything to commit, and losing them costs nothing.
set "AZURITE_DIR=%LocalAppData%\landing-ng-azurite"

rem The repository root is this script's parent.
pushd "%~dp0.." || (echo Could not reach the project folder. & pause & exit /b 1)
set "ROOT=%CD%"
popd

set "SITE_DIR=%ROOT%\landingpage"
set "ADMIN_APP=%ROOT%\admin\adminapp"
set "ADMIN_WWWROOT=%ROOT%\admin\Admin.Api\wwwroot"
rem DEV_LIB rather than LIB. Everything set here is inherited by what these tabs
rem start, and csc reads LIB as a library search path: a path to a .cmd file in
rem it makes every build warn CS1668.
set "DEV_LIB=%~dp0dev-lib.cmd"

rem --- prerequisites ---------------------------------------------------------

if not exist "%SITE_DIR%\package.json" (
    echo Could not find package.json in "%SITE_DIR%".
    pause
    exit /b 1
)

if not exist "%SITE_DIR%\node_modules" (
    echo Dependencies are not installed yet.
    echo Run "npm install" in "%SITE_DIR%" first.
    pause
    exit /b 1
)

where dotnet >nul 2>&1
if errorlevel 1 (
    echo dotnet is not on PATH, so the analytics API and the admin tool cannot start.
    pause
    exit /b 1
)

where azurite >nul 2>&1
if errorlevel 1 (
    echo Azurite is not on PATH. Install it once with:
    echo     npm install -g azurite
    pause
    exit /b 1
)

rem The admin tool serves the dashboard out of its wwwroot, so an unbuilt
rem dashboard is a 404 rather than a page. Build it once rather than letting
rem the tool open on nothing.
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

if not exist "%AZURITE_DIR%" mkdir "%AZURITE_DIR%"

rem Windows Terminal groups the four tabs into one named window, so a second
rem run adds to the window the first one made instead of scattering tabs.
set "TERMINAL=1"
where wt.exe >nul 2>&1
if errorlevel 1 set "TERMINAL=0"

rem --- the site --------------------------------------------------------------

rem First: the longest build, and the only one that needs nothing else up.
set "SITE_STARTED=0"
call :resolve
if not errorlevel 1 (
    echo The site is already serving on port %SITE_PORT%.
) else (
    set "SITE_STARTED=1"
    echo Starting the dev server...
    if "%TERMINAL%"=="1" (
        wt.exe -w landing-ng --title "landing-ng" -d "%SITE_DIR%" cmd /k npm start
    ) else (
        start "landing-ng dev server" cmd /k "cd /d "%SITE_DIR%" && npm start"
    )
)

rem --- azurite ---------------------------------------------------------------

call "%DEV_LIB%" probe "%AZURITE_URL%"
if not errorlevel 1 (
    echo Azurite is already listening on port 10002.
) else (
    echo Starting Azurite...
    if "%TERMINAL%"=="1" (
        wt.exe -w landing-ng new-tab --title "azurite" -d "%AZURITE_DIR%" cmd /k azurite --silent --location "%AZURITE_DIR%"
    ) else (
        start "azurite" cmd /k "azurite --silent --location "%AZURITE_DIR%""
    )
    call "%DEV_LIB%" waitfor "%AZURITE_URL%" 60 "Azurite"
    if errorlevel 1 exit /b 1
)

rem --- analytics API ---------------------------------------------------------

call "%DEV_LIB%" probe "%API_URL%"
if not errorlevel 1 (
    echo The analytics API is already answering on port 5080.
) else (
    echo Starting the analytics API...
    if "%TERMINAL%"=="1" (
        wt.exe -w landing-ng new-tab --title "analytics api" -d "%ROOT%" cmd /k dotnet run --project analytics\Analytics.Api
    ) else (
        start "analytics api" cmd /k "cd /d "%ROOT%" && dotnet run --project analytics\Analytics.Api"
    )
    call "%DEV_LIB%" waitfor "%API_URL%" 180 "The analytics API"
    if errorlevel 1 exit /b 1
)

rem --- admin tool, local mode ------------------------------------------------

call "%DEV_LIB%" probe "%ADMIN_URL%"
if not errorlevel 1 (
    echo The admin tool is already answering on port 5099.
) else (
    echo Starting the admin tool in local mode...
    if "%TERMINAL%"=="1" (
        wt.exe -w landing-ng new-tab --title "admin tool" -d "%ROOT%" cmd /k ""%~dp0run-admin.cmd" local"
    ) else (
        start "admin tool" cmd /k ""%~dp0run-admin.cmd" local"
    )
    call "%DEV_LIB%" waitfor "%ADMIN_URL%" 180 "The admin tool"
    if errorlevel 1 exit /b 1
)

rem --- the site, once it has caught up ---------------------------------------

if "!SITE_STARTED!"=="1" echo Waiting for the first Angular build to finish...
set /a TRIES=0
:wait
set /a TRIES+=1
call :resolve
if not errorlevel 1 goto ready
if !TRIES! geq 180 (
    echo.
    echo The site did not answer on port %SITE_PORT% within three minutes.
    echo Check its terminal tab for build errors.
    pause
    exit /b 1
)
call "%DEV_LIB%" sleep
goto wait

:ready
echo.
echo   site        !SITE_URL!
echo   admin tool  %ADMIN_URL%  reading Azurite, archiving to analytics-admin-dev
echo   analytics   http://localhost:5080/  (health at /health^)
echo   azurite     table endpoint on 10002, files in "%AZURITE_DIR%"
echo.
echo Opening Chrome on the site and the dashboard.

rem Both addresses in one call, because two launches milliseconds apart race
rem Chrome's singleton lock: the second starts its own process, then finds the
rem lock and forwards its address to the first, and the page opens twice.
call "%DEV_LIB%" openchrome "!SITE_URL!" "%ADMIN_URL%"
exit /b 0

rem --- helpers ---------------------------------------------------------------

rem Finds an address that actually serves the site, and leaves it in SITE_URL.
rem Local, rather than in dev-lib, because it is the one helper that answers
rem with a value instead of an exit code. localhost first, because that is what
rem belongs in a bookmark.
:resolve
for %%H in ("localhost" "127.0.0.1" "[::1]") do (
    call "%DEV_LIB%" probe "http://%%~H:%SITE_PORT%/" && (
        set "SITE_URL=http://%%~H:%SITE_PORT%/"
        exit /b 0
    )
)
exit /b 1
