const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/firebase');

// POST /api/progress — mark/unmark a lesson watched for a user
router.post('/', async (req, res) => {
  try {
    const { userEmail, contentId, moduleId, watched } = req.body;
    if (!userEmail || !contentId) {
      return res.status(400).json({ status: 'error', message: 'userEmail and contentId are required' });
    }
    const db = getDb();
    const email = userEmail.toLowerCase().trim();
    const docId = `${email}__${contentId}`;
    await db.collection('progress').doc(docId).set({
      userEmail: email,
      contentId,
      moduleId: moduleId || null,
      watched: watched !== false,
      watchedAt: new Date().toISOString(),
    }, { merge: true });
    res.json({ status: 'success' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/progress/user/:email — a user's watched lessons
router.get('/user/:email', async (req, res) => {
  try {
    const db = getDb();
    const email = req.params.email.toLowerCase().trim();
    const snap = await db.collection('progress')
      .where('userEmail', '==', email)
      .where('watched', '==', true)
      .get();
    const items = snap.docs.map(d => {
      const x = d.data();
      return { contentId: x.contentId, moduleId: x.moduleId, watchedAt: x.watchedAt };
    });
    res.json({ status: 'success', data: { items } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
