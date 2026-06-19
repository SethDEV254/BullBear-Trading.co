const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('../lib/firebase');
const { adminAuth } = require('../middleware/auth');

const generateToken = (email) =>
  jwt.sign({ id: email }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const db = getDb();
    const snap = await db.collection('users').doc(email.toLowerCase().trim()).get();
    if (!snap.exists) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    const user = snap.data();
    if (user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Access denied. Admin privileges required.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    await snap.ref.update({ lastLogin: new Date().toISOString() });
    const token = generateToken(user.email);

    res.json({
      status: 'success',
      message: 'Admin login successful',
      data: {
        user: { id: user.email, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/admin/verify
router.get('/verify', adminAuth, (req, res) => {
  res.json({
    status: 'success',
    message: 'Token is valid',
    data: { user: { id: req.user.id, email: req.user.email, firstName: req.user.firstName, lastName: req.user.lastName, role: req.user.role } },
  });
});

// GET /api/admin/stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const db = getDb();

    const [purchasesSnap, usersSnap, leadsSnap] = await Promise.all([
      db.collection('purchases').get(),
      db.collection('users').get(),
      db.collection('checklist_leads').get(),
    ]);

    const purchases = purchasesSnap.docs.map(d => d.data());
    const users = usersSnap.docs.map(d => d.data());

    const totalPurchases = purchases.length;
    const pendingApprovals = purchases.filter(p => p.status === 'pending').length;
    const totalUsers = users.filter(u => u.role !== 'admin').length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;
    const checklistLeads = leadsSnap.size;

    const completedPurchases = purchases.filter(p => ['completed', 'approved'].includes(p.status));
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const recentPurchases = purchases
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({
      status: 'success',
      data: { totalRevenue, totalUsers, totalAdmins, totalPurchases, pendingApprovals, checklistLeads, recentPurchases },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/admin/purchases
router.get('/purchases', adminAuth, async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const db = getDb();

    let query = db.collection('purchases').orderBy('createdAt', 'desc');
    if (status) query = query.where('status', '==', status);

    const snap = await query.limit(parseInt(limit) * parseInt(page)).get();
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const purchases = all.slice(offset, offset + parseInt(limit));

    res.json({
      status: 'success',
      count: purchases.length,
      total: all.length,
      page: parseInt(page),
      data: { purchases },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/admin/users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role, limit = 50, page = 1 } = req.query;
    const db = getDb();

    let query = db.collection('users').orderBy('createdAt', 'desc');
    if (role) query = query.where('role', '==', role);

    const snap = await query.get();
    const all = snap.docs.map(d => {
      const { passwordHash: _, ...u } = d.data();
      return { id: d.id, ...u };
    });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const users = all.slice(offset, offset + parseInt(limit));

    res.json({
      status: 'success',
      count: users.length,
      total: all.length,
      page: parseInt(page),
      data: { users },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT /api/admin/purchases/:id/approve
router.put('/purchases/:id/approve', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const ref = db.collection('purchases').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ status: 'error', message: 'Purchase not found' });
    await ref.update({ status: 'approved', verifiedAt: new Date().toISOString(), verifiedBy: req.user.email });
    res.json({ status: 'success', message: 'Purchase approved successfully', data: { purchase: { id: ref.id, ...snap.data(), status: 'approved' } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT /api/admin/purchases/:id/reject
router.put('/purchases/:id/reject', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const db = getDb();
    const ref = db.collection('purchases').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ status: 'error', message: 'Purchase not found' });
    await ref.update({ status: 'rejected', rejectionReason: reason || 'Payment verification failed', rejectedAt: new Date().toISOString() });
    res.json({ status: 'success', message: 'Purchase rejected', data: { purchase: { id: ref.id, ...snap.data(), status: 'rejected' } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Invalid role. Must be "user" or "admin"' });
    }
    const db = getDb();
    const ref = db.collection('users').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ status: 'error', message: 'User not found' });
    await ref.update({ role });
    const { passwordHash: _, ...u } = snap.data();
    res.json({ status: 'success', message: `User role updated to ${role}`, data: { user: { id: ref.id, ...u, role } } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
