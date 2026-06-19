const express = require('express');
const axios = require('axios');

const router = express.Router();

// In-memory agent status (persists per instance, resets on cold start)
let agentsOnline = true;

const SYSTEM_PROMPT = `You are a helpful support assistant for BullBear Trading (bullbearblockchain.com), a professional trading education platform.

ABOUT BULLBEAR TRADING:
- A trading education platform for beginners and intermediate traders
- Covers crypto, forex, stocks, and general market trading

PRODUCTS & PRICING:
1. Trading Indicators — $30/month: Live TradingView charts, real-time signals, cancel anytime
2. All-Access Membership — $99/month: Everything in Indicators + all courses + priority support + live sessions + new content monthly (saves $1,649+ vs buying separately)
3. Crypto Trading Course — $500 one-time: Full crypto trading course
4. DeFi & Blockchain Courses — $1,149 value: Included in All-Access

WEBSITE: bullbearblockchain.com
SIGN UP: bullbearblockchain.com/?modal=signup
LOGIN: bullbearblockchain.com/?modal=login

PAYMENT: PayPal and M-Pesa accepted

YOUR BEHAVIOR:
- Be friendly, concise, and professional
- Answer questions about trading, courses, pricing, and how to get started
- For account issues, payments, or complex problems, tell the client an agent will follow up
- Keep replies under 200 words
- Do not make up prices or features not listed above
- End responses with a helpful next step (e.g., "Visit bullbearblockchain.com to sign up")`;

function isAgentActive() {
  return agentsOnline;
}

async function askGemini(userMessage) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
    },
    { headers: { 'content-type': 'application/json' }, timeout: 15000 }
  );
  return res.data.candidates[0].content.parts[0].text;
}

function twiml(message) {
  // Escape XML special chars
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

// POST /api/whatsapp/webhook  — Twilio calls this on every incoming message
router.post('/webhook', async (req, res) => {
  res.set('Content-Type', 'text/xml');

  const body = (req.body.Body || '').trim();
  const from = req.body.From || '';

  if (!body) {
    return res.send(twiml('Hi! How can we help you today? Ask us anything about BullBear Trading.'));
  }

  try {
    if (isAgentActive()) {
      // Agent is online — acknowledge and let agent reply manually
      return res.send(twiml(
        'Hi! Thanks for reaching out to BullBear Trading. An agent has been notified and will reply shortly. Our hours are Mon–Sat, 8am–8pm EAT.'
      ));
    }

    // Agent offline — Claude auto-replies
    const reply = await askGemini(body);
    return res.send(twiml(reply));

  } catch (err) {
    console.error('WhatsApp webhook error:', err.message);
    return res.send(twiml(
      'Thanks for your message! Our team will get back to you shortly. You can also visit bullbearblockchain.com for more info.'
    ));
  }
});

// POST /api/whatsapp/agent-status  — toggle agents on/off (admin only)
router.post('/agent-status', (req, res) => {
  const { secret, online } = req.body;

  if (secret !== process.env.WHATSAPP_ADMIN_SECRET) {
    return res.status(403).json({ status: 'error', message: 'Unauthorized' });
  }

  agentsOnline = Boolean(online);
  res.json({ status: 'success', agentsOnline });
});

// GET /api/whatsapp/agent-status  — check current status
router.get('/agent-status', (req, res) => {
  res.json({ agentsOnline, businessHoursActive: isAgentActive() });
});

module.exports = router;
