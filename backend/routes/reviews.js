const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/firebase');

// POST /api/reviews — submit or update a review (one per user per course, verified buyers only)
router.post('/', async (req, res) => {
  try {
    const { userEmail, userName, courseId, rating, text } = req.body;
    const ratingNum = parseInt(rating, 10);
    if (!userEmail || !courseId || !ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ status: 'error', message: 'userEmail, courseId and a rating (1-5) are required' });
    }

    const db = getDb();
    const email = userEmail.toLowerCase().trim();

    const purchaseSnap = await db.collection('purchases')
      .where('userId', '==', email)
      .where('courseId', '==', courseId)
      .where('status', '==', 'approved')
      .limit(1)
      .get();
    if (purchaseSnap.empty) {
      return res.status(403).json({ status: 'error', message: 'Only verified buyers can leave a review' });
    }

    const docId = `${email}__${courseId}`;
    await db.collection('reviews').doc(docId).set({
      userEmail: email,
      userName: (userName || '').trim() || email.split('@')[0],
      courseId,
      rating: ratingNum,
      text: (text || '').trim(),
      createdAt: new Date().toISOString(),
    }, { merge: true });

    res.json({ status: 'success' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/reviews/:courseId — public reviews + average rating for a course
router.get('/:courseId', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('reviews').where('courseId', '==', req.params.courseId).get();
    const reviews = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const average = reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;
    res.json({ status: 'success', data: { reviews, average, count: reviews.length } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
