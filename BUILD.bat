@echo off
setlocal EnableExtensions EnableDelayedExpansion
title SoundBlazerr — Windows Build
cd /d "%~dp0"

echo.
echo  ============================================
echo    SoundBlazerr  -  one-click Windows build
echo  ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] Node.js is not installed or not on PATH.
  echo          Install the LTS build from https://nodejs.org/ and run BUILD.bat again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] npm was not found. Reinstall Node.js and ensure npm is on PATH.
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODEVER=%%v
for /f "delims=" %%v in ('npm -v') do set NPMVER=%%v
echo  [ok] Node %NODEVER%
echo  [ok] npm  %NPMVER%
echo.

echo  [1/4] Installing dependencies (skipped if already present)...
if not exist "node_modules\" (
  call npm install
) else (
  call npm install --no-audit --no-fund
)
if errorlevel 1 (
  echo.
  echo  [ERROR] npm install failed.
  pause
  exit /b 1
)

echo.
echo  [2/4] Building the frontend...
call npm run build
if errorlevel 1 (
  echo.
  echo  [ERROR] Frontend build failed.
  pause
  exit /b 1
)

echo.
echo  [3/4] Packaging Windows installer and portable EXE...
call npx --yes electron-builder --win --x64
if errorlevel 1 (
  echo.
  echo  [ERROR] Electron Builder failed. On a clean Windows PC this should produce:
  echo          dist\SoundBlazerr-Setup.exe
  echo          dist\SoundBlazerr.exe
  pause
  exit /b 1
)

echo.
echo  [4/4] Verifying dist\ filenames...
if not exist "dist" mkdir dist

if exist "dist\SoundBlazerr-Setup.exe" (
  echo  [ok] dist\SoundBlazerr-Setup.exe
) else (
  echo  [warn] SoundBlazerr-Setup.exe not found yet — searching for NSIS artifact...
  for %%f in (dist\*Setup*.exe dist\*.exe) do (
    if /I not "%%~nxf"=="SoundBlazerr.exe" (
      copy /Y "%%f" "dist\SoundBlazerr-Setup.exe" >nul
      echo  [ok] Copied %%~nxf -^> SoundBlazerr-Setup.exe
      goto :foundSetup
    )
  )
)
:foundSetup

if exist "dist\SoundBlazerr.exe" (
  echo  [ok] dist\SoundBlazerr.exe
) else (
  echo  [warn] Portable SoundBlazerr.exe not found yet — searching...
  for %%f in (dist\*portable*.exe dist\SoundBlazerr*.exe) do (
    if /I not "%%~nxf"=="SoundBlazerr-Setup.exe" (
      if /I not "%%~nxf"=="SoundBlazerr.exe" (
        copy /Y "%%f" "dist\SoundBlazerr.exe" >nul
        echo  [ok] Copied %%~nxf -^> SoundBlazerr.exe
        goto :foundPortable
      )
    )
  )
)
:foundPortable

if not exist "dist\SoundBlazerr-Setup.exe" (
  echo.
  echo  [ERROR] dist\SoundBlazerr-Setup.exe is missing.
  pause
  exit /b 1
)
if not exist "dist\SoundBlazerr.exe" (
  echo.
  echo  [ERROR] dist\SoundBlazerr.exe is missing.
  pause
  exit /b 1
)

echo.
echo  Build complete.
echo    dist\SoundBlazerr-Setup.exe
echo    dist\SoundBlazerr.exe
echo.
pause
endlocal
exit /b 0
