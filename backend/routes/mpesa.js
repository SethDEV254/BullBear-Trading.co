const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getDb } = require('../lib/firebase');

const MPESA_BASE = (process.env.MPESA_ENV || 'sandbox') === 'live'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

const CONSUMER_KEY    = (process.env.MPESA_CONSUMER_KEY || '').trim();
const CONSUMER_SECRET = (process.env.MPESA_CONSUMER_SECRET || '').trim();
const SHORTCODE       = (process.env.MPESA_SHORTCODE || '174379').trim();
const PASSKEY         = (process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919').trim();
const CALLBACK_URL    = (process.env.MPESA_CALLBACK_URL || 'https://backend-tawny-nu-33.vercel.app/api/mpesa/callback').trim();

async function getAccessToken() {
  const creds = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await axios.get(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
    timeout: 10000,
  });
  return res.data.access_token;
}

function getTimestamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function formatPhone(raw) {
  let p = String(raw).replace(/\D/g, '');
  if (p.startsWith('0'))    p = '254' + p.slice(1);
  if (p.startsWith('+'))    p = p.slice(1);
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

/* POST /api/mpesa/stkpush */
router.post('/stkpush', async (req, res) => {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc } = req.body;
    if (!phoneNumber || !amount) {
      return res.status(400).json({ success: false, message: 'phoneNumber and amount required' });
    }

    const phone  = formatPhone(phoneNumber);
    const ts     = getTimestamp();
    const token  = await getAccessToken();
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${ts}`).toString('base64');

    const mpesaRes = await axios.post(
      `${MPESA_BASE}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: ts,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(Number(amount)),
        PartyA: phone,
        PartyB: SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_URL,
        AccountReference: accountReference || 'BullBear',
        TransactionDesc: transactionDesc || 'BullBear Trading Payment',
      },
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );

    const { CheckoutRequestID, ResponseCode, ResponseDescription } = mpesaRes.data;

    if (ResponseCode !== '0') {
      return res.status(400).json({ success: false, message: ResponseDescription });
    }

    res.json({ success: true, data: { CheckoutRequestID, ResponseDescription } });
  } catch (err) {
    console.error('STK Push error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to initiate M-Pesa payment. Please try again.' });
  }
});

/* POST /api/mpesa/callback — Safaricom calls this after payment */
router.post('/callback', async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const cb = req.body?.Body?.stkCallback;
    if (!cb) return;

    const { ResultCode, CheckoutRequestID } = cb;
    if (ResultCode !== 0) {
      console.log('M-Pesa payment failed/cancelled:', CheckoutRequestID, ResultCode);
      return;
    }

    const items   = cb.CallbackMetadata?.Item || [];
    const get     = name => items.find(i => i.Name === name)?.Value;
    const receipt = get('MpesaReceiptNumber');
    const phone   = get('PhoneNumber');

    const db   = getDb();
    const snap = await db.collection('purchases')
      .where('orderId', '==', CheckoutRequestID)
      .limit(1).get();

    if (!snap.empty) {
      await snap.docs[0].ref.update({
        status: 'approved',
        verifiedAt: new Date().toISOString(),
        transactionId: receipt || CheckoutRequestID,
        mpesaPhone: String(phone || ''),
      });
      console.log('Purchase approved:', CheckoutRequestID, receipt);
    }
  } catch (err) {
    console.error('M-Pesa callback error:', err.message);
  }
});

/* GET /api/mpesa/status/:checkoutRequestId — frontend polls for completion */
router.get('/status/:checkoutRequestId', async (req, res) => {
  try {
    const db   = getDb();
    const snap = await db.collection('purchases')
      .where('orderId', '==', req.params.checkoutRequestId)
      .limit(1).get();

    if (snap.empty) return res.json({ status: 'pending' });
    res.json({ status: snap.docs[0].data().status });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
