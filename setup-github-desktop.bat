@echo off
echo ========================================
echo GitHub Desktop Setup - Quick Push
echo ========================================
echo.
echo This will help you push to SethDEV254/BullBear-Trading.co
echo.
pause

echo.
echo ========================================
echo Step 1: Opening GitHub Desktop Download
echo ========================================
echo.
echo Opening browser to download GitHub Desktop...
start https://desktop.github.com/
echo.
echo Please:
echo 1. Download GitHub Desktop
echo 2. Install it
echo 3. Come back here when done
echo.
pause

echo.
echo ========================================
echo Step 2: Instructions
echo ========================================
echo.
echo Once GitHub Desktop is installed:
echo.
echo 1. Open GitHub Desktop
echo 2. Sign in with SethDEV254 account
echo    - File -^> Options -^> Accounts -^> Sign in
echo.
echo 3. Add this repository:
echo    - File -^> Add Local Repository
echo    - Browse to: %CD%
echo    - Click "Add Repository"
echo.
echo 4. Push your changes:
echo    - Click "Push origin" button at top
echo    - Wait for upload (240 files)
echo.
echo 5. Verify on GitHub:
echo    - Visit: https://github.com/SethDEV254/BullBear-Trading.co
echo.
pause

echo.
echo ========================================
echo Step 3: Open GitHub Desktop (if installed)
echo ========================================
echo.
echo Trying to open GitHub Desktop...
echo.

REM Try to open GitHub Desktop
start "" "C:\Program Files\GitHub Desktop\GitHubDesktop.exe" 2>nul
if %ERRORLEVEL% NEQ 0 (
    start "" "%LOCALAPPDATA%\GitHubDesktop\GitHubDesktop.exe" 2>nul
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo GitHub Desktop not found. Please:
    echo 1. Install it from the browser window
    echo 2. Run this script again
    echo.
) else (
    echo.
    echo GitHub Desktop opened!
    echo.
    echo Now:
    echo 1. Sign in as SethDEV254
    echo 2. File -^> Add Local Repository
    echo 3. Select: %CD%
    echo 4. Click "Push origin"
    echo.
)

echo.
echo ========================================
echo Alternative: Manual Push
echo ========================================
echo.
echo If you prefer command line, you can also:
echo.
echo 1. Create Personal Access Token:
echo    https://github.com/settings/tokens
echo.
echo 2. Run this command:
echo    git push https://YOUR_TOKEN@github.com/SethDEV254/BullBear-Trading.co.git main
echo.
pause

echo.
echo ========================================
echo Quick Reference
echo ========================================
echo.
echo Repository: https://github.com/SethDEV254/BullBear-Trading.co.git
echo Files Ready: 240 files (51,385 lines)
echo.
echo What's being pushed:
echo - Mobile optimizations
echo - Clickable products fix
echo - Betting platform spec
echo - 140+ documentation files
echo - Backend updates
echo - Frontend updates
echo.
echo After push, verify at:
echo https://github.com/SethDEV254/BullBear-Trading.co
echo.
pause
