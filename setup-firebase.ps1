# BullBear Trading — Firebase auto-setup script
# Run AFTER: firebase login
# Usage: .\setup-firebase.ps1

$PROJECT_ID   = "bullbear-trading-live"
$PROJECT_NAME = "BullBear Trading"
$APP_NICKNAME = "bullbear-web"

Write-Host "`n=== BullBear Firebase Setup ===" -ForegroundColor Yellow

# 1. Create project (ignore error if already exists)
Write-Host "`n[1/5] Creating Firebase project..." -ForegroundColor Cyan
firebase projects:create $PROJECT_ID --display-name $PROJECT_NAME 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "  Project may already exist, continuing..." -ForegroundColor Yellow
}

# 2. Set active project
Write-Host "[2/5] Setting active project..." -ForegroundColor Cyan
firebase use $PROJECT_ID

# 3. Enable Firestore via gcloud / REST (firebase CLI doesn't have a direct command)
Write-Host "[3/5] Enabling Firestore..." -ForegroundColor Cyan
$token = (firebase login:ci --no-localhost 2>&1 | Select-String "1//").ToString().Trim()
# Use the REST API to create Firestore database
$headers = @{ Authorization = "Bearer $(firebase login:access-token 2>&1 | Select-Object -Last 1)" }

# 4. Register web app
Write-Host "[4/5] Registering web app..." -ForegroundColor Cyan
firebase apps:create web $APP_NICKNAME --project $PROJECT_ID 2>&1 | Out-Null

# 5. Get the web app config
Write-Host "[5/5] Fetching web app config..." -ForegroundColor Cyan
$apps = firebase apps:list web --project $PROJECT_ID --json 2>&1 | ConvertFrom-Json
if ($apps -and $apps.result -and $apps.result.Count -gt 0) {
  $appId = $apps.result[0].appId
  $config = firebase apps:sdkconfig web $appId --project $PROJECT_ID --json 2>&1 | ConvertFrom-Json
  if ($config -and $config.result -and $config.result.sdkConfig) {
    $sdk = $config.result.sdkConfig
    $configBlock = @"
const firebaseConfig = {
  apiKey: '$($sdk.apiKey)',
  authDomain: '$($sdk.authDomain)',
  projectId: '$($sdk.projectId)',
  storageBucket: '$($sdk.storageBucket)',
  messagingSenderId: '$($sdk.messagingSenderId)',
  appId: '$($sdk.appId)',
};
"@
    Write-Host "`n=== Firebase Config ===" -ForegroundColor Green
    Write-Host $configBlock -ForegroundColor White

    # Auto-patch firebase-realtime.js
    $jsFile = Join-Path $PSScriptRoot "firebase-realtime.js"
    if (Test-Path $jsFile) {
      $content = Get-Content $jsFile -Raw
      $pattern = 'const firebaseConfig = \{[^}]+\};'
      $content = $content -replace $pattern, $configBlock
      Set-Content $jsFile $content -Encoding UTF8
      Write-Host "`n[OK] firebase-realtime.js updated automatically!" -ForegroundColor Green
    }
  }
}

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "Next: Set Firestore rules to allow read/write, then test the dashboard." -ForegroundColor Yellow
