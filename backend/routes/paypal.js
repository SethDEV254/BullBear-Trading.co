const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getDb } = require('../lib/firebase');
const { sendPurchaseFulfillment } = require('../utils/purchaseFulfillment');

const PAYPAL_CLIENT_ID = (process.env.PAYPAL_CLIENT_ID || '').trim();
const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
const PAYPAL_BASE = (process.env.PAYPAL_MODE || 'live') === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const res = await axios.post(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      auth: { username: PAYPAL_CLIENT_ID, password: PAYPAL_CLIENT_SECRET },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );
  return res.data.access_token;
}

// GET /api/paypal/config — client ID for frontend SDK
router.get('/config', (req, res) => {
  res.json({ status: 'success', clientId: PAYPAL_CLIENT_ID, mode: process.env.PAYPAL_MODE || 'live' });
});

// POST /api/paypal/create-order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, courseId, currency = 'USD' } = req.body;
    if (!amount || !courseId) {
      return res.status(400).json({ status: 'error', message: 'amount and courseId required' });
    }

    const token = await getAccessToken();
    const order = await axios.post(
      `${PAYPAL_BASE}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: currency, value: parseFloat(amount).toFixed(2) },
          description: `BullBear Trading - ${courseId}`,
        }],
      },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    res.json({ status: 'success', orderId: order.data.id });
  } catch (err) {
    console.error('Create order error:', err.response?.data || err.message);
    res.status(500).json({ status: 'error', message: 'Failed to create PayPal order' });
  }
});

// POST /api/paypal/capture-order/:orderId
router.post('/capture-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userEmail, courseId, amount, shippingName, shippingPhone, shippingAddress, shippingCity } = req.body;

    const token = await getAccessToken();
    const capture = await axios.post(
      `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    if (capture.data.status !== 'COMPLETED') {
      return res.status(400).json({ status: 'error', message: 'Payment not completed' });
    }

    const transactionId = capture.data.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId;

    if (userEmail && courseId) {
      const db = getDb();
      const courseSnap = await db.collection('courses').doc(courseId).get();
      const courseName = courseSnap.exists ? (courseSnap.data().title || courseId) : courseId;

      const purchaseData = {
        userId: userEmail.toLowerCase(),
        userEmail: userEmail.toLowerCase(),
        courseId,
        courseName,
        amount: parseFloat(amount) || 0,
        paymentMethod: 'paypal',
        orderId,
        transactionId,
        status: 'approved',
        createdAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        ...(shippingName ? { shippingName, shippingPhone, shippingAddress, shippingCity } : {}),
      };
      await db.collection('purchases').add(purchaseData);
      sendPurchaseFulfillment(purchaseData);

      if (courseSnap.exists) {
        const d = courseSnap.data();
        await courseSnap.ref.update({ totalPurchases: (d.totalPurchases || 0) + 1 });
      }
    }

    res.json({ status: 'success', message: 'Payment verified and access granted', transactionId });
  } catch (err) {
    console.error('Capture error:', err.response?.data || err.message);
    res.status(500).json({ status: 'error', message: 'Failed to capture payment' });
  }
});

module.exports = router;
