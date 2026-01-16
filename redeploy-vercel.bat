@echo off
echo ========================================
echo Redeploy BullBear Trading to Vercel
echo ========================================
echo.
echo This will create a fresh deployment
echo.
pause

echo.
echo Checking Vercel CLI...
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing Vercel CLI...
    npm install -g vercel
)

echo.
echo ========================================
echo Deploying to Vercel
echo ========================================
echo.
echo Project will be named: bullbear-trading
echo.

vercel --prod --name bullbear-trading

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your site should be live at:
echo https://bullbear-trading.vercel.app
echo.
echo Or check your Vercel dashboard:
echo https://vercel.com/dashboard
echo.
pause
