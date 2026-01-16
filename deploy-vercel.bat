@echo off
echo ========================================
echo Deploy BullBear Trading to Vercel
echo ========================================
echo.
echo This will deploy your application to Vercel
echo.
pause

echo.
echo ========================================
echo Step 1: Check Vercel CLI
echo ========================================
echo.
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI not found. Installing...
    npm install -g vercel
) else (
    echo Vercel CLI is installed
)
echo.
pause

echo.
echo ========================================
echo Step 2: Login to Vercel
echo ========================================
echo.
echo Opening Vercel login...
vercel login
echo.
pause

echo.
echo ========================================
echo Step 3: Deploy Frontend
echo ========================================
echo.
echo Deploying frontend to Vercel...
vercel --prod
echo.
echo Frontend deployed!
echo.
pause

echo.
echo ========================================
echo Step 4: Deploy Backend
echo ========================================
echo.
set /p DEPLOY_BACKEND="Deploy backend? (y/n): "
if /i "%DEPLOY_BACKEND%"=="y" (
    echo.
    echo Deploying backend...
    cd backend
    vercel --prod
    cd ..
    echo.
    echo Backend deployed!
)
echo.
pause

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Go to https://vercel.com/dashboard
echo 2. Find your deployments
echo 3. Add environment variables in Settings
echo 4. Test your live site
echo.
echo Don't forget to add:
echo - MONGODB_URI
echo - JWT_SECRET
echo - ADMIN_EMAIL
echo - ADMIN_PASSWORD
echo - PayPal credentials
echo - M-Pesa credentials
echo.
pause
