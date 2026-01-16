# 🚀 Deploy to Vercel

## Quick Deploy (3 Steps)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
# Deploy frontend
vercel --prod

# Deploy backend (in backend folder)
cd backend
vercel --prod
```

## Or Use Vercel Dashboard

### Option 1: Import from GitHub (Recommended)
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select: `SethDEV254/BullBear-Trading.co`
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (for frontend) or `./backend` (for backend)
5. Add Environment Variables (see below)
6. Click "Deploy"

### Option 2: Deploy via CLI
Run the deployment script:
```bash
deploy-vercel.bat
```

## Environment Variables

### Frontend (Optional)
- `NEXT_PUBLIC_API_URL` - Backend API URL

### Backend (Required)
Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# Database
MONGODB_URI=your-mongodb-connection-string

# JWT
JWT_SECRET=your-jwt-secret-key

# Admin
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
PAYPAL_MODE=sandbox

# M-Pesa
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_SHORTCODE=your-shortcode
MPESA_PASSKEY=your-passkey

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# URLs
FRONTEND_URL=https://your-frontend.vercel.app
```

## Deployment URLs

After deployment, you'll get:
- **Frontend:** `https://bull-bear-trading.vercel.app`
- **Backend:** `https://bull-bear-trading-api.vercel.app`

Update your frontend to use the backend URL.

## Verify Deployment

1. Visit your frontend URL
2. Check admin login works
3. Test API endpoints
4. Verify database connection

## Troubleshooting

### Build Failed
- Check `vercel.json` configuration
- Verify all dependencies in `package.json`
- Check build logs in Vercel dashboard

### Environment Variables Not Working
- Make sure they're added in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly

### Database Connection Failed
- Verify MongoDB URI is correct
- Check MongoDB Atlas allows Vercel IPs (0.0.0.0/0)
- Test connection string locally first

## Repository
https://github.com/SethDEV254/BullBear-Trading.co
