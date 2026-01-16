# 🔒 Security Notice - Credentials Removed

## ⚠️ Important Security Update

All hardcoded credentials have been removed from the repository for security reasons.

## What Was Removed

### Admin Files with Hardcoded Credentials
- admin-auto-login.html
- admin-auto.html
- admin-simple.html
- admin-mongodb-final.html
- CREDENTIALS.md (old file with exposed credentials)

### Documentation Files Updated
Multiple documentation files previously contained example credentials. These have been removed.

## How to Set Up Admin Access

### Step 1: Create Your Credentials File
```bash
cp CREDENTIALS.example.md CREDENTIALS.md
```

### Step 2: Fill in Your Credentials
Edit `CREDENTIALS.md` with your actual credentials. This file is in `.gitignore` and won't be pushed to GitHub.

### Step 3: Configure Environment Variables
Create `backend/.env` file:
```env
# Admin Configuration
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password

# Database
MONGODB_URI=your-mongodb-connection-string

# JWT
JWT_SECRET=your-jwt-secret-key

# Other configurations...
```

### Step 4: Use Secure Admin Pages
Use these admin pages that don't have hardcoded credentials:
- `admin-pro.html` - Full-featured admin dashboard
- `admin-login.html` - Simple login page
- `admin-dashboard.html` - Main dashboard

## Security Best Practices

### ✅ DO:
- Store credentials in `.env` files (not committed to Git)
- Use `CREDENTIALS.md` locally (in .gitignore)
- Use strong, unique passwords
- Change default passwords immediately
- Use environment variables in production
- Enable 2FA where available
- Rotate credentials regularly

### ❌ DON'T:
- Commit credentials to Git
- Use default passwords in production
- Share credentials in plain text
- Hardcode credentials in source files
- Use the same password across services
- Store credentials in documentation

## Files Protected by .gitignore

```
.env
backend/.env
CREDENTIALS.md
*credentials*.md
*CREDENTIALS*.md
```

## For Production Deployment

### Use Environment Variables
Set these in your hosting platform (Vercel, Netlify, etc.):
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `MONGODB_URI`
- `JWT_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`

### Never Expose:
- Database connection strings
- API keys
- Admin passwords
- JWT secrets
- Payment gateway credentials

## If Credentials Were Exposed

If you previously pushed credentials to GitHub:

1. **Change all passwords immediately**
2. **Rotate all API keys**
3. **Generate new JWT secrets**
4. **Update database passwords**
5. **Review access logs for unauthorized access**
6. **Consider using GitHub's secret scanning**

## Need Help?

- Review: `CREDENTIALS.example.md` for template
- Check: `backend/.env.example` for environment variables
- Read: `DEPLOYMENT_CHECKLIST.md` for production setup

---

**Security is everyone's responsibility. Keep credentials safe!** 🔒
