@echo off
rem Helpers shared by the launchers in this folder, so a fix to one of them is a
rem fix everywhere rather than in whichever copy was remembered.
rem
rem     call "%~dp0dev-lib.cmd" probe "<url>"
rem     call "%~dp0dev-lib.cmd" waitfor "<url>" <seconds> "<what to call it>"
rem     call "%~dp0dev-lib.cmd" sleep
rem     call "%~dp0dev-lib.cmd" openchrome "<url>" ["<url>"]
rem
rem No setlocal: these are called from inside the callers' own blocks, and the
rem only thing they hand back is an exit code.

if /i "%~1"=="probe" goto probe
if /i "%~1"=="waitfor" goto waitfor
if /i "%~1"=="sleep" goto sleep
if /i "%~1"=="openchrome" goto openchrome

echo dev-lib: no such helper "%~1".
exit /b 2

rem Succeeds when the address returns any HTTP response at all, refusals
rem included: a 403 from Azurite is still Azurite answering, and answering is
rem all that "it is listening" means.
rem
rem An HTTP GET rather than a TCP connect, because ng serve binds the IPv6
rem loopback only, and a socket that connects on ::1 says nothing about whether
rem the address handed to the browser will load.
:probe
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try { Invoke-WebRequest -Uri '%~2' -UseBasicParsing -TimeoutSec 3 | Out-Null; exit 0 }" ^
    "catch { if ($_.Exception.Response) { exit 0 } else { exit 1 } }" >nul 2>&1
exit /b %errorlevel%

rem Waits for an address to answer. %~2 url, %~3 seconds, %~4 what to call it.
:waitfor
set /a WAITED=0
:waitloop
call "%~f0" probe "%~2"
if not errorlevel 1 exit /b 0
set /a WAITED+=1
if %WAITED% geq %~3 (
    echo.
    echo %~4 did not answer within %~3 seconds: %~2
    echo Check its terminal tab for the error.
    pause
    exit /b 1
)
call :sleep
goto waitloop

rem A second, whether or not stdin is a console. `timeout` refuses to run when
rem input is redirected, which turns a polite wait into a spin, so ping stands
rem in for it there: -n 2 is one second between two packets to the loopback.
:sleep
timeout /t 1 /nobreak >nul 2>&1 || ping -n 2 127.0.0.1 >nul 2>&1
exit /b 0

rem Chrome by preference; the default browser only if Chrome is not installed.
rem `ng serve --open` is deliberately not used: it opens whatever the default
rem browser is, and this is asked to open Chrome.
rem
rem Takes one address or two, and opens them in a single launch. Two launches
rem close together race Chrome's singleton lock when it is not already running:
rem the second one starts a browser of its own, then finds the lock and forwards
rem its address to the first, and that address opens twice. Chrome takes as many
rem addresses as you give it and makes a tab of each, so there is no reason to
rem call it twice.
:openchrome
set "CHROME="
where chrome.exe >nul 2>&1 && set "CHROME=chrome.exe"

if not defined CHROME (
    for %%P in (
        "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
        "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
        "%LocalAppData%\Google\Chrome\Application\chrome.exe"
    ) do (
        if not defined CHROME if exist "%%~P" set "CHROME=%%~P"
    )
)

if not defined CHROME (
    echo Chrome was not found, opening the default browser instead.
    start "" "%~2"
    if not "%~3"=="" start "" "%~3"
    exit /b 0
)

if "%~3"=="" (
    start "" "%CHROME%" "%~2"
) else (
    start "" "%CHROME%" "%~2" "%~3"
)
exit /b 0
