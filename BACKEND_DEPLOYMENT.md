# Backend Deployment Guide

## Current Setup

**Frontend:** https://sethdev254.github.io/BullBear-Trading.co  
**Backend:** Needs to be deployed separately

---

## Option 1: Deploy Backend to Vercel (Recommended)

### Step 1: Deploy Backend
```bash
cd backend
vercel --prod
```

Or use Vercel Dashboard:
1. Go to: https://vercel.com/new
2. Import your repository
3. Set **Root Directory:** `backend`
4. Deploy

### Step 2: Your Backend URL
After deployment, you'll get:
```
https://bullbear-trading-api.vercel.app
```

### Step 3: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
```
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-password
PAYPAL_CLIENT_ID=your-paypal-id
PAYPAL_SECRET=your-paypal-secret
MPESA_CONSUMER_KEY=your-mpesa-key
MPESA_CONSUMER_SECRET=your-mpesa-secret
FRONTEND_URL=https://sethdev254.github.io/BullBear-Trading.co
```

---

## Option 2: Deploy Backend to Render (Free)

### Step 1: Create Account
Go to: https://render.com

### Step 2: New Web Service
1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name:** bullbear-trading-api
   - **Root Directory:** backend
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Step 3: Add Environment Variables
Same as above

### Your Backend URL:
```
https://bullbear-trading-api.onrender.com
```

---

## Option 3: Deploy Backend to Railway (Free)

### Step 1: Create Account
Go to: https://railway.app

### Step 2: New Project
1. Click "New Project"
2. Deploy from GitHub repo
3. Select `backend` folder

### Your Backend URL:
```
https://bullbear-trading-api.up.railway.app
```

---

## Update Frontend to Use Backend

After deploying backend, update your frontend files to use the backend URL.

### Files to Update:
1. `admin-pro.html`
2. `admin-login.html`
3. `admin-dashboard.html`
4. Any other files that call API

### Change:
```javascript
// From:
const API_URL = 'http://localhost:5000/api';

// To:
const API_URL = 'https://your-backend-url.vercel.app/api';
```

---

## Quick Deploy Script

I'll create a script to deploy your backend to Vercel:

```bash
deploy-backend.bat
```

---

## Architecture

```
Frontend (GitHub Pages)
https://sethdev254.github.io/BullBear-Trading.co
         ↓
         ↓ API Calls
         ↓
Backend (Vercel/Render/Railway)
https://bullbear-trading-api.vercel.app
         ↓
         ↓ Database
         ↓
MongoDB Atlas
```

---

## Recommended Setup

**Frontend:** GitHub Pages (Free, Fast)  
**Backend:** Vercel (Free, Easy)  
**Database:** MongoDB Atlas (Free tier)

**Total Cost:** $0/month

---

## Next Steps

1. Deploy backend to Vercel
2. Get backend URL
3. Update frontend API calls
4. Test everything works
5. Done!
