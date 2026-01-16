@echo off
echo ========================================
echo Deploy Backend to Vercel
echo ========================================
echo.
echo This will deploy your backend API
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
echo Deploying Backend
echo ========================================
echo.
cd backend
vercel --prod
cd ..

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your backend is now live!
echo.
echo Next steps:
echo 1. Copy your backend URL from above
echo 2. Add environment variables in Vercel dashboard
echo 3. Update frontend to use backend URL
echo.
echo Environment variables needed:
echo - MONGODB_URI
echo - JWT_SECRET
echo - ADMIN_EMAIL
echo - ADMIN_PASSWORD
echo - PAYPAL_CLIENT_ID
echo - PAYPAL_SECRET
echo - MPESA_CONSUMER_KEY
echo - MPESA_CONSUMER_SECRET
echo.
pause
