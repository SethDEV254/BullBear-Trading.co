const express = require('express');
const cors = require('cors');
const compression = require('compression');

const authRoutes = require('../routes/auth');
const courseRoutes = require('../routes/courses');
const purchaseRoutes = require('../routes/purchases');
const userRoutes = require('../routes/users');
const adminRoutes = require('../routes/admin');
const paypalRoutes = require('../routes/paypal');
const checklistRoutes = require('../routes/checklist');
const axios = require('axios');

const app = express();

app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'BullBear Trading API is running on Vercel',
    timestamp: new Date().toISOString(),
    database: 'firebase',
    firebaseProject: 'bullbear-trading-live',
  });
});

app.get('/api', (req, res) => {
  res.json({ message: 'BullBear Trading API', tagline: 'Master the Markets', version: '2.0.0', platform: 'Vercel + Firebase' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/checklist', checklistRoutes);

// ── WhatsApp Bot ──────────────────────────────────────────────────────────────
let agentsOnline = false;

const WA_SYSTEM_PROMPT = `You are BullBear AI, a friendly and knowledgeable assistant for BullBear Trading (bullbearblockchain.com). You are warm, conversational, and helpful — like a smart friend who happens to know a lot about trading and finance.

PERSONALITY:
- Greet users warmly and naturally when they say hi, hello, hey, good morning, etc.
- Be friendly and engaging, not robotic
- Match the user's energy — casual if they're casual, detailed if they want depth
- Use conversational language, not stiff corporate tone

TRADING EXPERTISE — answer any question on:
- Forex: pairs, pips, spread, leverage, lot sizes, sessions (London/NY/Tokyo/Sydney), central bank policy
- Crypto: Bitcoin, Ethereum, altcoins, DeFi, NFTs, wallets, exchanges, tokenomics, on-chain analysis
- Stocks & Indices: equities, ETFs, S&P500, NASDAQ, earnings, dividends, IPOs
- Commodities: gold, oil, silver and their macro drivers
- Technical Analysis: candlesticks, support/resistance, Fibonacci, EMA/SMA, RSI, MACD, Bollinger Bands, chart patterns, Elliott Wave, Wyckoff
- Fundamental Analysis: CPI, NFP, GDP, interest rates, news trading
- Risk Management: position sizing, stop loss, take profit, risk/reward ratio, drawdown, diversification
- Trading Psychology: discipline, FOMO, revenge trading, journaling, consistency
- Order Types: market, limit, stop, OCO, trailing stop
- Trading Styles: scalping, day trading, swing trading, position trading

GENERAL QUESTIONS:
- Answer general knowledge questions helpfully — economics, finance, business, math, etc.
- If a question is completely unrelated to finance/trading, give a brief helpful answer then naturally bring it back to trading if possible

BULLBEAR TRADING PRODUCTS:
1. Trading Indicators — $30/mo: live TradingView signals, real-time alerts
2. All-Access Membership — $99/mo: all courses + indicators + live sessions + priority support (best value)
3. Crypto Trading Course — $500 one-time: full crypto curriculum

PAYMENT: PayPal and M-Pesa. WEBSITE: bullbearblockchain.com

RULES:
- Keep replies under 200 words
- Never make up specific entry/exit prices or trade signals
- For account, payment, or technical issues direct them to bullbearblockchain.com or say a human agent will follow up
- Always end with something that invites a follow-up or next step`;

function waTwiml(msg) {
  const safe = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

app.post('/api/whatsapp/webhook', async (req, res) => {
  res.set('Content-Type', 'text/xml');
  const body = (req.body.Body || '').trim();
  if (!body) return res.send(waTwiml('Hi! How can we help you with BullBear Trading today?'));
  try {
    if (agentsOnline) {
      return res.send(waTwiml('Hi! Thanks for reaching out to BullBear Trading. An agent has been notified and will reply shortly.'));
    }
    const groq = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: WA_SYSTEM_PROMPT },
          { role: 'user', content: body },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${(process.env.GROQ_API_KEY || '').trim()}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    return res.send(waTwiml(groq.data.choices[0].message.content));
  } catch (err) {
    console.error('WA bot error:', err.message);
    return res.send(waTwiml('Thanks for your message! Visit bullbearblockchain.com or our team will reply shortly.'));
  }
});

app.get('/api/whatsapp/agent-status', (req, res) => res.json({ agentsOnline }));

app.post('/api/whatsapp/agent-status', (req, res) => {
  const ADMIN_SECRET = (process.env.WHATSAPP_ADMIN_SECRET || 'bb-admin-2026').trim();
  if (req.body.secret !== ADMIN_SECRET)
    return res.status(403).json({ status: 'error', message: 'Unauthorized' });
  agentsOnline = Boolean(req.body.online);
  res.json({ status: 'success', agentsOnline });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ status: 'error', message: err.message || 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

module.exports = app;
