# BullBear Trading - Updates

## Latest Changes

### Security ✅
- Removed all hardcoded admin credentials
- Added CREDENTIALS.example.md template
- Updated .gitignore to protect sensitive files

### Cleanup ✅
- Removed 81 redundant documentation files
- Removed test and debug HTML files
- Removed duplicate admin pages
- Kept only essential files

### Features
- Mobile optimization (mobile-optimizations.css)
- Clickable products fix (fix-clickable-products.css/js)
- Admin dashboards (admin-pro.html, admin-login.html)
- Backend API with MongoDB
- M-Pesa & PayPal integration

## Repository
https://github.com/SethDEV254/BullBear-Trading.co

## Quick Start
1. Clone repository
2. Copy `backend/.env.example` to `backend/.env`
3. Add your credentials
4. Run `npm install` in backend folder
5. Run `npm start`

## Admin Access
Set credentials in `backend/.env`:
```
ADMIN_EMAIL=your-email@domain.com
ADMIN_PASSWORD=your-secure-password
```

Then open `admin-pro.html` and login.
