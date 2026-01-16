# BullBear Trading Platform

A modern crypto trading education platform with integrated payment systems (M-Pesa, PayPal) and premium content management.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SethDEV254/BullBear-Trading.co)

[📖 Deployment Guide](DEPLOY_VERCEL.md)

## 🚀 Features

- **Trading Education** - Video courses, indicators, and resources
- **M-Pesa Integration** - Seamless Kenyan mobile payments
- **PayPal Support** - International payment processing
- **Premium Content Lock** - Subscription-based access control
- **Admin Dashboard** - User and content management
- **Responsive Design** - Mobile-first dark theme

## 📦 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Payments**: M-Pesa API, PayPal API
- **Authentication**: JWT, localStorage

## 🛠️ Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- M-Pesa Developer Account (Safaricom)
- PayPal Business Account

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/sethdev254/bullbear-trading.git
cd bullbear-trading
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# M-Pesa
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey

# PayPal
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret

# JWT
JWT_SECRET=your_jwt_secret
```

4. **Start the backend server**
```bash
npm start
```

5. **Open the frontend**
```bash
# Open index.html in your browser
# Or use a local server:
npx http-server
```

## 📱 M-Pesa Integration

The platform supports M-Pesa STK Push for:
- Course purchases (KES 50,000)
- Indicator subscriptions (KES 3,900)
- Monthly memberships

### M-Pesa Setup
1. Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create an app and get credentials
3. Configure callback URL in `.env`
4. Test with sandbox before production

## 💳 Payment Options

| Product | USD | KES | Payment Methods |
|---------|-----|-----|----------------|
| Video Course | $500 | 50,000 | M-Pesa, PayPal, Card |
| Indicators | $30/mo | 3,900/mo | M-Pesa, PayPal |
| Membership | $500 | 50,000 | M-Pesa, PayPal |

## 📄 Pages

- `index.html` - Homepage with featured products
- `crypto-trading-course.html` - Video course page
- `trading-indicators.html` - Premium indicators (locked)
- `my-library.html` - User's purchased content
- `checklist-signup.html` - Free checklist download
- `admin-dashboard.html` - Admin panel

## 🔐 Admin Access

Default credentials (change in production):
```
Email: admin@bullbear.com
Password: admin123
```

## 🚀 Deployment

### Vercel (Recommended for Frontend)
```bash
npm i -g vercel
vercel
```

### Heroku (Backend)
```bash
heroku create bullbear-api
git push heroku main
```

### Environment Variables
Set all `.env` variables in your hosting platform's dashboard.

## 📝 API Endpoints

### M-Pesa
- `POST /api/mpesa/stkpush` - Initiate payment
- `POST /api/mpesa/callback` - Payment callback

### PayPal
- `POST /api/paypal/create-order` - Create order
- `POST /api/paypal/capture-order` - Capture payment

### Auth
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues and questions:
- Email: support@bullbear.com
- Twitter: [@starico](https://twitter.com/starico)

## 📜 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Developed by [@starico](https://twitter.com/starico)**

---

⭐ Star this repo if you find it helpful!
