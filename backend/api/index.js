const express = require('express');
const cors = require('cors');
const compression = require('compression');

const authRoutes = require('../routes/auth');
const courseRoutes = require('../routes/courses');
const purchaseRoutes = require('../routes/purchases');
const userRoutes = require('../routes/users');
const adminRoutes = require('../routes/admin');
const paypalRoutes = require('../routes/paypal');
const mpesaRoutes = require('../routes/mpesa');
const paywaveRoutes = require('../routes/paywave');
const checklistRoutes = require('../routes/checklist');
const inboundRoutes = require('../routes/inbound');
const progressRoutes = require('../routes/progress');
const reviewRoutes = require('../routes/reviews');
const axios = require('axios');

const app = express();

app.use(compression());
const corsOptions = {
  origin: function (origin, callback) { callback(null, true); },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true }));

// Fast warmup — no DB
app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

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
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/paywave', paywaveRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reviews', reviewRoutes);

// ── Unsubscribe ───────────────────────────────────────────────────────────────
const crypto = require('crypto');

function makeUnsubToken(email) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET || 'bullbear-unsub').update(email.toLowerCase()).digest('hex');
}

app.get('/api/unsubscribe', async (req, res) => {
  const { email, token } = req.query;
  if (!email || !token || token !== makeUnsubToken(email)) {
    return res.status(400).send('<h2>Invalid unsubscribe link.</h2>');
  }
  try {
    const db = getDb();
    await db.collection('email_unsubscribes').doc(email.toLowerCase()).set({ email: email.toLowerCase(), unsubscribedAt: new Date().toISOString() });
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title><style>body{font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}.box{max-width:420px;padding:40px 32px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px}h1{font-size:1.4rem;margin-bottom:12px}p{color:#94a3b8;line-height:1.6;margin:0}a{color:#a78bfa}</style></head><body><div class="box"><h1>You've been unsubscribed</h1><p>You won't receive any more bulk emails from BullBear Trading.<br><br><a href="https://bullbearblockchain.com">Return to site</a></p></div></body></html>`);
  } catch (e) {
    res.status(500).send('<h2>Something went wrong. Please try again.</h2>');
  }
});

// ── Public content library ────────────────────────────────────────────────────
const { getDb } = require('../lib/firebase');

// GET /api/content — returns all active content items
app.get('/api/content', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('content').get();
    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ status: 'success', data: { items } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/modules — returns all active course modules
app.get('/api/modules', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('modules').get();
    const modules = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ status: 'success', data: { modules } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/purchases/user/:email — check user's approved purchases
app.get('/api/purchases/user/:email', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('purchases')
      .where('userId', '==', req.params.email.toLowerCase())
      .where('status', '==', 'approved')
      .get();
    const purchases = snap.docs.map(d => ({ id: d.id, courseId: d.data().courseId, courseName: d.data().courseName }));
    res.json({ status: 'success', data: { purchases } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

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

LIVE AGENT HANDOFF:
- If the user asks to speak to a live agent, a human, or a real person, or reports a technical issue (site not working, payment/access problems, bugs), give them Agent 2's number: 0702000987
- Never use real staff names — always refer to them as "Agent 2"
- Only share this number when the user actually asks to speak to someone or reports a technical problem — don't volunteer it otherwise

RULES:
- Keep replies under 200 words
- Never make up specific entry/exit prices or trade signals
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
