const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/firebase');

// GET /api/users/:email
router.get('/:email', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('users').doc(req.params.email.toLowerCase()).get();
    if (!snap.exists) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    const { passwordHash: _, ...user } = snap.data();
    res.json({ status: 'success', data: { user: { ...user, id: snap.id } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT /api/users/:email
router.put('/:email', async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const db = getDb();
    const ref = db.collection('users').doc(req.params.email.toLowerCase());
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    await ref.update({ firstName, lastName });
    const updated = (await ref.get()).data();
    const { passwordHash: _, ...user } = updated;
    res.json({ status: 'success', message: 'Profile updated successfully', data: { user: { ...user, id: ref.id } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
