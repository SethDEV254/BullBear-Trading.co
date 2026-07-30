const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/firebase');
const { sendPurchaseConfirmation, sendAdminNotification } = require('../utils/emailService');

// POST /api/purchases
router.post('/', async (req, res) => {
  try {
    const {
      userEmail, courseId, amount, paymentMethod, orderId, transactionId, status,
      shippingName, shippingPhone, shippingAddress, shippingCity,
    } = req.body;
    if (!userEmail || !courseId || !orderId) {
      return res.status(400).json({ status: 'error', message: 'userEmail, courseId, and orderId are required' });
    }

    const db = getDb();

    // courseId may reference a store product (not every product has a
    // 'courses' doc) — use the title if one exists, otherwise fall back
    // to the id itself rather than 404ing and silently dropping the purchase.
    const courseSnap = await db.collection('courses').doc(courseId).get();
    const course = courseSnap.exists ? courseSnap.data() : null;

    const purchaseData = {
      userId: userEmail.toLowerCase(),
      userEmail: userEmail.toLowerCase(),
      courseId,
      courseName: (course && course.title) || courseId,
      amount: parseFloat(amount) || 0,
      paymentMethod: paymentMethod || 'manual',
      orderId,
      transactionId: transactionId || '',
      status: status || 'pending',
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      ...(shippingName ? { shippingName, shippingPhone, shippingAddress, shippingCity } : {}),
    };

    const docRef = await db.collection('purchases').add(purchaseData);

    if (course) {
      await courseSnap.ref.update({ totalPurchases: (course.totalPurchases || 0) + 1 });
    }

    if (process.env.EMAIL_USER) {
      await sendAdminNotification(
        userEmail.split('@')[0],
        userEmail,
        course.title,
        amount,
        orderId
      ).catch(() => {});
    }

    res.status(201).json({
      status: 'success',
      message: 'Purchase created successfully',
      data: { purchase: { id: docRef.id, ...purchaseData } },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/purchases/user/:email
router.get('/user/:email', async (req, res) => {
  try {
    const db = getDb();
    const email = req.params.email.toLowerCase();
    const snap = await db.collection('purchases')
      .where('userEmail', '==', email)
      .get();
    const purchases = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ status: 'success', count: purchases.length, data: { purchases } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/purchases/:orderId
router.get('/:orderId', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('purchases')
      .where('orderId', '==', req.params.orderId)
      .limit(1)
      .get();
    if (snap.empty) {
      return res.status(404).json({ status: 'error', message: 'Purchase not found' });
    }
    const doc = snap.docs[0];
    res.json({ status: 'success', data: { purchase: { id: doc.id, ...doc.data() } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT /api/purchases/:orderId/verify
router.put('/:orderId/verify', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('purchases')
      .where('orderId', '==', req.params.orderId)
      .limit(1)
      .get();
    if (snap.empty) {
      return res.status(404).json({ status: 'error', message: 'Purchase not found' });
    }
    const doc = snap.docs[0];
    await doc.ref.update({ status: 'completed', verifiedAt: new Date().toISOString() });
    const updated = { id: doc.id, ...doc.data(), status: 'completed' };
    res.json({ status: 'success', message: 'Purchase verified successfully', data: { purchase: updated } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/purchases
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const db = getDb();
    let query = db.collection('purchases').orderBy('createdAt', 'desc');
    if (status) query = query.where('status', '==', status);
    const snap = await query.get();
    const purchases = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ status: 'success', count: purchases.length, data: { purchases } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT /api/purchases/:id/approve
router.put('/:id/approve', async (req, res) => {
  try {
    const db = getDb();
    const ref = db.collection('purchases').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ status: 'error', message: 'Purchase not found' });
    await ref.update({ status: 'approved', verifiedAt: new Date().toISOString() });
    res.json({ status: 'success', message: 'Purchase approved successfully', data: { purchase: { id: ref.id, ...snap.data(), status: 'approved' } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT /api/purchases/:id/reject
router.put('/:id/reject', async (req, res) => {
  try {
    const db = getDb();
    const ref = db.collection('purchases').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ status: 'error', message: 'Purchase not found' });
    await ref.update({ status: 'rejected', rejectedAt: new Date().toISOString() });
    res.json({ status: 'success', message: 'Purchase rejected', data: { purchase: { id: ref.id, ...snap.data(), status: 'rejected' } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
