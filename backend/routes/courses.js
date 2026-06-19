const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/firebase');

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('courses').where('isActive', '==', true).get();
    const courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ status: 'success', count: courses.length, data: { courses } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/courses/:courseId
router.get('/:courseId', async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('courses').doc(req.params.courseId).get();
    if (!snap.exists) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }
    res.json({ status: 'success', data: { course: { id: snap.id, ...snap.data() } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/courses
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { courseId, ...rest } = req.body;
    const id = courseId || req.body.id;
    if (!id) return res.status(400).json({ status: 'error', message: 'courseId is required' });
    await db.collection('courses').doc(id).set({ courseId: id, ...rest, createdAt: new Date().toISOString() });
    res.status(201).json({ status: 'success', message: 'Course created successfully', data: { course: { id, courseId: id, ...rest } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT /api/courses/:courseId
router.put('/:courseId', async (req, res) => {
  try {
    const db = getDb();
    const ref = db.collection('courses').doc(req.params.courseId);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ status: 'error', message: 'Course not found' });
    }
    await ref.update(req.body);
    const updated = (await ref.get()).data();
    res.json({ status: 'success', message: 'Course updated successfully', data: { course: { id: ref.id, ...updated } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
