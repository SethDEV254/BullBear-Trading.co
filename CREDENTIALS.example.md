# 🔐 Admin Credentials Template

## ⚠️ SECURITY NOTICE
**DO NOT commit actual credentials to GitHub!**

This is a template file. Copy it to `CREDENTIALS.md` and fill in your actual credentials.
`CREDENTIALS.md` is in `.gitignore` and will not be pushed to GitHub.

---

## Admin Dashboard Access

### Production
- **URL**: https://your-domain.com/admin
- **Email**: [YOUR_ADMIN_EMAIL]
- **Password**: [YOUR_SECURE_PASSWORD]
- **Role**: Administrator

### Local Development
- **URL**: http://localhost:3000/admin-pro.html
- **Email**: [YOUR_ADMIN_EMAIL]
- **Password**: [YOUR_SECURE_PASSWORD]
- **Role**: Administrator

---

## Database Credentials

### MongoDB Atlas
- **Connection String**: [YOUR_MONGODB_URI]
- **Database Name**: [YOUR_DB_NAME]
- **Username**: [YOUR_DB_USERNAME]
- **Password**: [YOUR_DB_PASSWORD]

---

## API Keys

### PayPal
- **Client ID**: [YOUR_PAYPAL_CLIENT_ID]
- **Secret**: [YOUR_PAYPAL_SECRET]
- **Mode**: sandbox / live

### M-Pesa (Safaricom)
- **Consumer Key**: [YOUR_MPESA_CONSUMER_KEY]
- **Consumer Secret**: [YOUR_MPESA_CONSUMER_SECRET]
- **Shortcode**: [YOUR_SHORTCODE]
- **Passkey**: [YOUR_PASSKEY]

---

## Email Service

### SMTP Configuration
- **Host**: [YOUR_SMTP_HOST]
- **Port**: [YOUR_SMTP_PORT]
- **Username**: [YOUR_EMAIL]
- **Password**: [YOUR_EMAIL_PASSWORD]

---

## Security Best Practices

1. **Never commit CREDENTIALS.md** - It's in .gitignore
2. **Use strong passwords** - Minimum 12 characters, mixed case, numbers, symbols
3. **Change default passwords** - Immediately after first login
4. **Rotate credentials regularly** - Every 90 days
5. **Use environment variables** - For production deployments
6. **Enable 2FA** - Where available
7. **Limit access** - Only give credentials to trusted team members

---

## How to Use

1. Copy this file: `cp CREDENTIALS.example.md CREDENTIALS.md`
2. Fill in your actual credentials in `CREDENTIALS.md`
3. Never commit `CREDENTIALS.md` to version control
4. Share credentials securely (encrypted channels only)

---

**Last Updated**: [DATE]  
**Maintained By**: [YOUR_NAME]
