# Deploy Backend - Quick Steps

## Vercel Page Opened

Follow these steps in the Vercel page that just opened:

### Step 1: Import Repository
1. Click **"Import Git Repository"**
2. Select: `SethDEV254/BullBear-Trading.co`
3. Click **"Import"**

### Step 2: Configure Project
- **Project Name:** `bullbear-trading-api`
- **Framework Preset:** Other
- **Root Directory:** `backend` ← IMPORTANT!
- **Build Command:** `npm install`
- **Output Directory:** Leave empty

### Step 3: Deploy
Click **"Deploy"**

Wait 2-3 minutes for build to complete.

---

## After Deployment

### Your Backend URL:
```
https://bullbear-trading-api.vercel.app
```

### Add Environment Variables:
1. Go to project Settings → Environment Variables
2. Add these:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-random-secret-key
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
MPESA_CONSUMER_KEY=your-mpesa-key
MPESA_CONSUMER_SECRET=your-mpesa-secret
MPESA_SHORTCODE=your-shortcode
MPESA_PASSKEY=your-passkey
FRONTEND_URL=https://sethdev254.github.io/BullBear-Trading.co
PORT=5000
NODE_ENV=production
```

### Redeploy:
After adding environment variables, click **"Redeploy"** in Deployments tab.

---

## Test Backend

Visit: `https://bullbear-trading-api.vercel.app/api/health`

Should return: `{"status":"ok"}`

---

## Update Frontend

After backend is live, update these files to use backend URL:

1. `admin-pro.html`
2. `admin-login.html`  
3. `admin-dashboard.html`

Change:
```javascript
const API_URL = 'http://localhost:5000/api';
```

To:
```javascript
const API_URL = 'https://bullbear-trading-api.vercel.app/api';
```

---

## Complete Setup

**Frontend:** https://sethdev254.github.io/BullBear-Trading.co  
**Backend:** https://bullbear-trading-api.vercel.app  
**Database:** MongoDB Atlas

All connected and working!
