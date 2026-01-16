@echo off
echo ========================================
echo Push to SethDEV254/BullBear-Trading.co
echo ========================================
echo.
echo This will push your updates to the correct repository:
echo https://github.com/SethDEV254/BullBear-Trading.co.git
echo.
echo IMPORTANT: You need to authenticate as SethDEV254
echo.
pause

echo.
echo ========================================
echo Step 1: Verify Remote URL
echo ========================================
git remote -v
echo.
pause

echo.
echo ========================================
echo Step 2: Update Git Config
echo ========================================
echo.
set /p USERNAME="Enter GitHub username (SethDEV254): "
set /p EMAIL="Enter GitHub email: "

git config user.name "%USERNAME%"
git config user.email "%EMAIL%"

echo.
echo Updated config:
git config user.name
git config user.email
echo.
pause

echo.
echo ========================================
echo Step 3: Push to GitHub
echo ========================================
echo.
echo You will be prompted for credentials.
echo Use your Personal Access Token (NOT password)
echo.
echo To create a token:
echo 1. Go to: https://github.com/settings/tokens
echo 2. Generate new token (classic)
echo 3. Select 'repo' scope
echo 4. Copy the token
echo.
pause

echo.
echo Pushing to SethDEV254/BullBear-Trading.co...
echo.
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Push Successful!
    echo ========================================
    echo.
    echo Your updates are now on GitHub:
    echo https://github.com/SethDEV254/BullBear-Trading.co
    echo.
    echo Next steps:
    echo 1. Visit the repository to verify
    echo 2. Check deployment status
    echo 3. Test live site
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Push Failed
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Wrong credentials - Use Personal Access Token
    echo 2. No repository access - Check permissions
    echo 3. Repository doesn't exist - Create it first
    echo.
    echo Solutions:
    echo 1. Clear credentials: cmdkey /delete:LegacyGeneric:target=git:https://github.com
    echo 2. Try GitHub Desktop: https://desktop.github.com/
    echo 3. Read: FIX_GITHUB_ACCOUNT.md
    echo.
)

pause
