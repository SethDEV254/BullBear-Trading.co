const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { getDb } = require('../lib/firebase');

const API_KEY = (process.env.PAYWAVE_API_KEY || '').trim();
const ACCOUNT_EMAIL = (process.env.PAYWAVE_EMAIL || '').trim();
const BASE = 'https://paywavexpress.co.ke';

function formatPhone(raw) {
  let p = String(raw).replace(/\D/g, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (p.startsWith('+')) p = p.slice(1);
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

/* POST /api/paywave/stkpush */
router.post('/stkpush', async (req, res) => {
  try {
    if (!API_KEY || !ACCOUNT_EMAIL) {
      return res.status(500).json({ success: false, message: 'Paywave Express is not configured' });
    }
    const { phoneNumber, amount, reference, accountNumber } = req.body;
    if (!phoneNumber || !amount) {
      return res.status(400).json({ success: false, message: 'phoneNumber and amount required' });
    }

    const orderId = 'PW-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');

    const payload = {
      api_key: API_KEY,
      email: ACCOUNT_EMAIL,
      amount: String(Math.ceil(Number(amount))),
      msisdn: formatPhone(phoneNumber),
      reference: orderId,
    };
    if (accountNumber) payload.account_number = accountNumber;

    const pwRes = await axios.post(`${BASE}/v1/stkpush`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });

    const { ResponseCode, message, transaction_request_id, CheckoutRequestID } = pwRes.data;
    if (String(ResponseCode) !== '0') {
      return res.status(400).json({ success: false, message: message || 'Failed to send prompt' });
    }

    // Stored so /status can verify directly with Paywave if their webhook never arrives
    const db = getDb();
    await db.collection('paywave_transactions').doc(orderId).set({
      transaction_request_id,
      CheckoutRequestID,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: { orderId, transaction_request_id, CheckoutRequestID, message },
    });
  } catch (err) {
    console.error('Paywave STK push error:', err.response?.data || err.message);
    const detail = err.response?.data?.errorMessage || err.response?.data?.message;
    res.status(500).json({ success: false, message: detail || 'Failed to initiate M-Pesa payment. Please try again.' });
  }
});

/* GET /api/paywave/webhook — respond OK to any dashboard verification ping */
router.get('/webhook', (req, res) => res.json({ status: 'ok' }));

/* POST /api/paywave/webhook — Paywave Express calls this on completion/failure */
router.post('/webhook', async (req, res) => {
  res.json({ status: 'success' });

  try {
    const { ResponseCode, TransactionReference, TransactionID, TransactionReceipt, TransactionAmount, Msisdn } = req.body || {};
    if (!TransactionReference) return;

    const db = getDb();
    const snap = await db.collection('purchases')
      .where('orderId', '==', TransactionReference)
      .limit(1).get();

    if (snap.empty) {
      console.log('Paywave webhook: no matching purchase for', TransactionReference);
      return;
    }

    if (Number(ResponseCode) === 0) {
      await snap.docs[0].ref.update({
        status: 'approved',
        verifiedAt: new Date().toISOString(),
        transactionId: TransactionID || TransactionReference,
        mpesaReceipt: TransactionReceipt || '',
        mpesaPhone: String(Msisdn || ''),
      });
      console.log('Paywave purchase approved:', TransactionReference, TransactionReceipt);
    } else {
      await snap.docs[0].ref.update({
        status: 'rejected',
        verifiedAt: new Date().toISOString(),
      });
      console.log('Paywave payment failed/cancelled:', TransactionReference, ResponseCode);
    }
  } catch (err) {
    console.error('Paywave webhook error:', err.message);
  }
});

/* GET /api/paywave/status/:orderId — frontend polls for completion.
   Falls back to asking Paywave directly in case their webhook never
   arrives (observed in practice — webhook delivery isn't reliable). */
router.get('/status/:orderId', async (req, res) => {
  try {
    const db = getDb();
    const orderId = req.params.orderId;
    const snap = await db.collection('purchases').where('orderId', '==', orderId).limit(1).get();
    if (snap.empty) return res.json({ status: 'pending' });

    const purchaseDoc = snap.docs[0];
    const currentStatus = purchaseDoc.data().status;
    if (currentStatus !== 'pending') return res.json({ status: currentStatus });

    // Still pending locally — check with Paywave directly
    const txSnap = await db.collection('paywave_transactions').doc(orderId).get();
    if (!txSnap.exists || !API_KEY || !ACCOUNT_EMAIL) return res.json({ status: 'pending' });

    const { transaction_request_id } = txSnap.data();
    const pwRes = await axios.post(`${BASE}/v1/tstatus`, {
      api_key: API_KEY,
      email: ACCOUNT_EMAIL,
      transaction_request_id,
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });

    const { TransactionStatus, TransactionCode, TransactionReceipt, Msisdn } = pwRes.data;
    if (TransactionStatus === 'Completed' && String(TransactionCode) === '0') {
      await purchaseDoc.ref.update({
        status: 'approved',
        verifiedAt: new Date().toISOString(),
        transactionId: transaction_request_id,
        mpesaReceipt: TransactionReceipt || '',
        mpesaPhone: String(Msisdn || ''),
      });
      return res.json({ status: 'approved' });
    }
    if (TransactionStatus === 'Failed' || TransactionStatus === 'Cancelled') {
      await purchaseDoc.ref.update({ status: 'rejected', verifiedAt: new Date().toISOString() });
      return res.json({ status: 'rejected' });
    }
    res.json({ status: 'pending' });
  } catch (err) {
    // Paywave lookup failing shouldn't break polling — just report pending
    res.json({ status: 'pending' });
  }
});

module.exports = router;
