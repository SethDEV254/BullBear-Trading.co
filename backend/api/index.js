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
let agentsOnline = true;

const WA_SYSTEM_PROMPT = `You are a helpful support assistant for BullBear Trading (bullbearblockchain.com), a professional trading education platform.
Products: Trading Indicators $30/mo, All-Access Membership $99/mo (includes all courses), Crypto Trading Course $500 one-time.
Payment: PayPal and M-Pesa. Website: bullbearblockchain.com
Be friendly, concise, under 150 words. End with a helpful next step.`;

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
