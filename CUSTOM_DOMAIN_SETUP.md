# 🌐 Custom Domain Setup - bullbeartrading.co

## Current Vercel URL
https://company-website-74sfye9uc-sethdev254hs-projects.vercel.app

## Target Domain
bullbeartrading.co

---

## Step 1: Add Domain in Vercel

1. Go to your Vercel project: https://vercel.com/sethdev254hs-projects/company-website
2. Click **Settings** → **Domains**
3. Add domain: `bullbeartrading.co`
4. Also add: `www.bullbeartrading.co`

---

## Step 2: Configure DNS Records

Go to your domain registrar (where you bought bullbeartrading.co) and add these DNS records:

### For Root Domain (bullbeartrading.co)

**Option A: Using A Record (Recommended)**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Option B: Using CNAME (if A record not supported)**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

### For WWW Subdomain (www.bullbeartrading.co)

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

---

## Step 3: Verify Domain

1. After adding DNS records, go back to Vercel
2. Click **Refresh** or **Verify**
3. Wait 5-10 minutes for DNS propagation
4. Vercel will automatically issue SSL certificate

---

## Common Domain Registrars

### Namecheap
1. Login to Namecheap
2. Go to Domain List → Manage
3. Advanced DNS → Add New Record
4. Add the records above

### GoDaddy
1. Login to GoDaddy
2. My Products → DNS
3. Add records as shown above

### Cloudflare
1. Login to Cloudflare
2. Select your domain
3. DNS → Add record
4. Add the records above
5. **Important:** Set Proxy status to "DNS only" (gray cloud)

### Google Domains
1. Login to Google Domains
2. My domains → Manage
3. DNS → Custom records
4. Add the records above

---

## Step 4: Set Primary Domain

In Vercel:
1. Go to Settings → Domains
2. Find `bullbeartrading.co`
3. Click the three dots (...)
4. Select **Set as Primary Domain**

This will redirect all other URLs to bullbeartrading.co

---

## Verification

After setup (wait 5-10 minutes):
1. Visit: https://bullbeartrading.co
2. Visit: https://www.bullbeartrading.co
3. Both should work and show your site
4. Check SSL certificate (padlock icon)

---

## Troubleshooting

### Domain Not Verifying
- Wait longer (DNS can take up to 48 hours)
- Check DNS records are correct
- Use DNS checker: https://dnschecker.org

### SSL Certificate Error
- Wait for Vercel to issue certificate (automatic)
- Usually takes 5-10 minutes after domain verification

### WWW Not Working
- Make sure CNAME record for www is added
- Check it points to: cname.vercel-dns.com

### Old Vercel URL Still Shows
- Clear browser cache
- Try incognito/private mode
- Wait for DNS propagation

---

## Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Project:** https://vercel.com/sethdev254hs-projects/company-website
- **DNS Checker:** https://dnschecker.org
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html

---

## After Domain is Live

Update these in your code:
1. Update API URLs in frontend
2. Update CORS settings in backend
3. Update environment variables
4. Test all features on live domain

---

**Need help?** Contact your domain registrar's support or Vercel support.
