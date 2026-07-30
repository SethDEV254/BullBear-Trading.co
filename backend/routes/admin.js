const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const { getDb, getBucket } = require('../lib/firebase');
const { adminAuth } = require('../middleware/auth');
const { sendPurchaseFulfillment } = require('../utils/purchaseFulfillment');
const { sendPasswordResetEmail } = require('../utils/emailService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'));
    }
    cb(null, true);
  },
});

// POST /api/admin/upload-image
router.post('/upload-image', adminAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ status: 'error', message: err.message });
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No file provided' });
    try {
      const bucket = getBucket();
      const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
      const filename = `module-backgrounds/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
      const fileRef = bucket.file(filename);
      await fileRef.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
        public: true,
      });
      await fileRef.makePublic();
      res.json({ status: 'success', data: { url: `https://storage.googleapis.com/${bucket.name}/${filename}` } });
    } catch (e) {
      res.status(500).json({ status: 'error', message: e.message });
    }
  });
});

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
    const verifiedAt = new Date().toISOString();
    await ref.update({ status: 'approved', verifiedAt, verifiedBy: req.user.email });
    sendPurchaseFulfillment({ ...snap.data(), verifiedAt });
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

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const ref = db.collection('users').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ status: 'error', message: 'User not found' });
    if (snap.data().role === 'admin') return res.status(403).json({ status: 'error', message: 'Cannot delete admin accounts' });
    await ref.delete();
    res.json({ status: 'success', message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── Content / Video management ────────────────────────────────────────────────

// GET /api/admin/content
router.get('/content', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('content').get();
    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ status: 'success', data: { items } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// POST /api/admin/content
router.post('/content', adminAuth, async (req, res) => {
  try {
    const { title, description, url, thumbnail, type, category, accessLevel, order, duration, moduleId } = req.body;
    if (!title || !url) return res.status(400).json({ status: 'error', message: 'title and url are required' });
    const db = getDb();
    const countSnap = await db.collection('content').get();
    const ref = await db.collection('content').add({
      title: title.trim(),
      description: (description || '').trim(),
      url: url.trim(),
      thumbnail: (thumbnail || '').trim(),
      type: type || 'video',
      category: category || 'general',
      accessLevel: accessLevel || 'paid',
      duration: (duration || '').trim(),
      order: parseInt(order) || countSnap.size + 1,
      moduleId: moduleId || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: req.user && req.user.email ? req.user.email : 'admin',
    });
    res.json({ status: 'success', data: { id: ref.id } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// PUT /api/admin/content/:id
router.put('/content/:id', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const allowed = ['title', 'description', 'url', 'thumbnail', 'type', 'category', 'accessLevel', 'order', 'isActive', 'moduleId'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    update.updatedAt = new Date().toISOString();
    await db.collection('content').doc(id).update(update);
    res.json({ status: 'success' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// DELETE /api/admin/content/:id
router.delete('/content/:id', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('content').doc(req.params.id).delete();
    res.json({ status: 'success' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── Course Modules management ─────────────────────────────────────────────────

// GET /api/admin/modules
router.get('/modules', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('modules').get();
    const modules = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ status: 'success', data: { modules } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// POST /api/admin/modules
router.post('/modules', adminAuth, async (req, res) => {
  try {
    const { name, description, order, imageUrl } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'name is required' });
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      return res.status(400).json({ status: 'error', message: 'imageUrl must be a valid http(s) URL' });
    }
    const db = getDb();
    const countSnap = await db.collection('modules').get();
    const ref = await db.collection('modules').add({
      name: name.trim(),
      description: (description || '').trim(),
      imageUrl: (imageUrl || '').trim(),
      order: parseInt(order) || countSnap.size + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: req.user && req.user.email ? req.user.email : 'admin',
    });
    res.json({ status: 'success', data: { id: ref.id } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// PUT /api/admin/modules/:id
router.put('/modules/:id', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const allowed = ['name', 'description', 'order', 'isActive', 'imageUrl'];
    if (req.body.imageUrl && !/^https?:\/\//i.test(req.body.imageUrl)) {
      return res.status(400).json({ status: 'error', message: 'imageUrl must be a valid http(s) URL' });
    }
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    update.updatedAt = new Date().toISOString();
    await db.collection('modules').doc(id).update(update);
    res.json({ status: 'success' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// DELETE /api/admin/modules/:id
router.delete('/modules/:id', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('modules').doc(req.params.id).delete();
    res.json({ status: 'success' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// POST /api/admin/users/:userId/reset-password — sends the user a reset link
router.post('/users/:userId/reset-password', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const userRef = db.collection('users').doc(req.params.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ status: 'error', message: 'User not found' });
    const user = userSnap.data();

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000;
    await userRef.update({ resetTokenHash, resetTokenExpiry });

    const resetUrl = `${process.env.FRONTEND_URL || 'https://bullbearblockchain.com'}/index.html?resetToken=${resetToken}&email=${encodeURIComponent(user.email)}`;
    const result = await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
    if (!result || result.success === false) {
      return res.status(500).json({ status: 'error', message: 'Failed to send reset email' + (result && result.error ? ': ' + result.error : '') });
    }
    res.json({ status: 'success', message: 'Password reset link sent to ' + user.email });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// PUT /api/admin/product-prices — { prices: { [productId]: number } }
router.put('/product-prices', adminAuth, async (req, res) => {
  try {
    const { prices } = req.body;
    if (!prices || typeof prices !== 'object') {
      return res.status(400).json({ status: 'error', message: 'prices object required' });
    }
    const clean = {};
    for (const [id, price] of Object.entries(prices)) {
      const n = parseFloat(price);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ status: 'error', message: `Invalid price for ${id}` });
      }
      clean[id] = n;
    }
    const db = getDb();
    await db.collection('settings').doc('productPrices').set(clean, { merge: true });
    res.json({ status: 'success', data: { prices: clean } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// ── Grant / Revoke access ─────────────────────────────────────────────────────

// POST /api/admin/users/:userId/grant-access
router.post('/users/:userId/grant-access', adminAuth, async (req, res) => {
  try {
    const { productId, productName, amount } = req.body;
    if (!productId) return res.status(400).json({ status: 'error', message: 'productId required' });
    const db = getDb();
    const userRef = db.collection('users').doc(req.params.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ status: 'error', message: 'User not found' });
    const user = userSnap.data();

    const purchaseData = {
      userId: req.params.userId,
      userEmail: (user.email || req.params.userId).toLowerCase(),
      courseId: productId,
      courseName: productName || productId,
      amount: parseFloat(amount) || 0,
      paymentMethod: 'admin-grant',
      orderId: 'admin-' + Date.now(),
      status: 'approved',
      grantedByAdmin: true,
      grantedBy: req.user.email,
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    };
    const purchaseRef = await db.collection('purchases').add(purchaseData);
    sendPurchaseFulfillment(purchaseData);
    res.json({ status: 'success', data: { purchaseId: purchaseRef.id } });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// DELETE /api/admin/users/:userId/revoke-access/:productId
router.delete('/users/:userId/revoke-access/:productId', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('purchases')
      .where('userId', '==', req.params.userId)
      .where('courseId', '==', req.params.productId)
      .get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    res.json({ status: 'success', message: `Revoked ${snap.size} access record(s)` });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// POST /api/admin/bulk-email
router.post('/bulk-email', adminAuth, async (req, res) => {
  const { subject, message, recipients, customEmails } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ status: 'error', message: 'Subject and message are required' });
  }

  try {
    const db = getDb();
    const { sendEmail } = require('../utils/resendEmail');

    let emailList = [];

    if (recipients === 'custom') {
      emailList = (customEmails || '').split(',').map(e => ({ email: e.trim(), name: '' })).filter(e => e.email);
    } else {
      const [usersSnap, leadsSnap, purchasesSnap] = await Promise.all([
        db.collection('users').where('role', '!=', 'admin').get(),
        db.collection('checklist_leads').get(),
        db.collection('purchases').where('status', 'in', ['approved', 'completed']).get(),
      ]);

      // Registered users (signed up via the site)
      if (recipients === 'all' || recipients === 'users') {
        usersSnap.docs.forEach(d => {
          const data = d.data();
          if (data.email) emailList.push({ email: data.email, name: data.firstName || data.name || '' });
        });
      }

      // Checklist subscribers
      if (recipients === 'all' || recipients === 'checklist') {
        leadsSnap.docs.forEach(d => {
          const data = d.data();
          if (data.email && !emailList.find(e => e.email === data.email)) {
            emailList.push({ email: data.email, name: data.name || '' });
          }
        });
      }

      // Buyers only
      if (recipients === 'buyers') {
        const buyerEmails = new Set(purchasesSnap.docs.map(d => d.data().userEmail).filter(Boolean));
        usersSnap.docs.forEach(d => {
          const data = d.data();
          if (data.email && buyerEmails.has(data.email) && !emailList.find(e => e.email === data.email)) {
            emailList.push({ email: data.email, name: data.firstName || data.name || '' });
          }
        });
      }
    }

    // Deduplicate
    const seen = new Set();
    emailList = emailList.filter(e => {
      if (seen.has(e.email)) return false;
      seen.add(e.email);
      return true;
    });

    if (!emailList.length) {
      return res.status(400).json({ status: 'error', message: 'No recipients found' });
    }

    // Filter unsubscribed
    const crypto = require('crypto');
    const unsubSnap = await db.collection('email_unsubscribes').get();
    const unsubSet = new Set(unsubSnap.docs.map(d => d.id.toLowerCase()));
    emailList = emailList.filter(e => !unsubSet.has(e.email.toLowerCase()));

    if (!emailList.length) {
      return res.status(400).json({ status: 'error', message: 'All recipients have unsubscribed' });
    }

    const year = new Date().getFullYear();
    const bodyLines = message.split('\n').map(line => `<p style="margin:0 0 12px;line-height:1.6;">${line}</p>`).join('');

    const makeUnsubToken = (email) =>
      crypto.createHmac('sha256', process.env.JWT_SECRET || 'bullbear-unsub').update(email.toLowerCase()).digest('hex');

    const plainBody = message.split('\n').join('\n');

    const buildHtml = (name, email, unsubUrl) => {
      const firstName = (name || '').split(' ')[0] || 'Trader';
      return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0d;color:#e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#D4AF37,#8a6d1f);padding:28px 32px;text-align:center;">
          <img src="https://bullbearblockchain.com/images/bullbear-logo.png" alt="BullBear Trading" style="height:48px;width:auto;display:block;margin:0 auto 10px;">
          <h1 style="margin:0;color:#04140a;font-size:1.4rem;">BullBear Trading</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 20px;font-size:1rem;font-weight:600;color:#e2e8f0;">Hello ${firstName},</p>
          ${bodyLines}
          <p style="margin:20px 0 0;line-height:1.6;">Warm regards,<br><strong style="color:#3DFF6E;">BullBear Trading Team</strong></p>
        </div>
        <div style="padding:24px 32px;border-top:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02);">
          <p style="margin:0 0 16px;font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;text-align:center;">Get Started With Seth's Links</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <a href="https://www.tradingview.com/?aff_id=152391" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;text-decoration:none;border-radius:8px;font-size:.84rem;font-weight:700;">📈 TradingView</a>
            <a href="https://partner.blofin.com/d/CryptoLord" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,#064e3b,#059669);color:#fff;text-decoration:none;border-radius:8px;font-size:.84rem;font-weight:700;">🔗 Join BloFin</a>
          </div>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,.08);text-align:center;font-size:.78rem;color:#64748b;">
          © ${year} BullBear Trading · <a href="https://bullbearblockchain.com" style="color:#3DFF6E;">bullbearblockchain.com</a>
          <br><br><a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
        </div>
      </div>`;
    };

    const buildText = (name, unsubUrl) => {
      const firstName = (name || '').split(' ')[0] || 'Trader';
      return `Hello ${firstName},\n\n${plainBody}\n\nWarm regards,\nBullBear Trading Team\n\n© ${year} BullBear Trading · https://bullbearblockchain.com\nUnsubscribe: ${unsubUrl}`;
    };

    // Create the campaign doc up front so recipient tracking records can
    // reference its id, and so read status is visible mid-send if needed.
    const campaignRef = await db.collection('email_campaigns').add({
      subject,
      message,
      recipients,
      totalSent: 0,
      errors: 0,
      sentBy: req.user.email,
      sentAt: new Date().toISOString(),
    });

    let sent = 0;
    const errors = [];
    const recipientBatch = db.batch();
    for (const recipient of emailList) {
      try {
        const unsubUrl = `https://backend-tawny-nu-33.vercel.app/api/unsubscribe?email=${encodeURIComponent(recipient.email)}&token=${makeUnsubToken(recipient.email)}`;
        const result = await sendEmail({
          to: recipient.email,
          subject,
          html: buildHtml(recipient.name, recipient.email, unsubUrl),
          text: buildText(recipient.name, unsubUrl),
          headers: {
            'List-Unsubscribe': `<mailto:info@bullbearblockchain.com?subject=unsubscribe>, <${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });
        sent++;
        if (result && result.id) {
          const recRef = db.collection('email_campaign_recipients').doc();
          recipientBatch.set(recRef, {
            campaignId: campaignRef.id,
            resendEmailId: result.id,
            email: recipient.email,
            status: 'sent',
            sentAt: new Date().toISOString(),
            openedAt: null,
          });
        }
        // Small delay between sends so this reads as normal transactional
        // traffic to receiving mail servers, not a burst/blast pattern.
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        errors.push(recipient.email);
      }
    }
    await recipientBatch.commit();

    await campaignRef.update({ totalSent: sent, errors: errors.length });

    res.json({ status: 'success', message: `Email sent to ${sent} recipient(s)`, sent, errors: errors.length });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/admin/email-campaigns
router.get('/email-campaigns', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('email_campaigns').orderBy('sentAt', 'desc').limit(20).get();
    const campaigns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ status: 'success', data: campaigns });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/admin/email-campaigns/:id/recipients — read/unread breakdown
router.get('/email-campaigns/:id/recipients', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('email_campaign_recipients')
      .where('campaignId', '==', req.params.id).get();
    const recipients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const opened = recipients.filter(r => r.status === 'opened').length;
    res.json({
      status: 'success',
      data: { recipients, total: recipients.length, opened, notOpened: recipients.length - opened },
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/admin/recipient-counts
router.get('/recipient-counts', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const [usersSnap, leadsSnap, purchasesSnap] = await Promise.all([
      db.collection('users').where('role', '!=', 'admin').get(),
      db.collection('checklist_leads').get(),
      db.collection('purchases').where('status', 'in', ['approved', 'completed']).get(),
    ]);
    const userEmails = new Set(usersSnap.docs.map(d => d.data().email).filter(Boolean));
    const leadEmails = new Set(leadsSnap.docs.map(d => d.data().email).filter(Boolean));
    const buyerEmails = new Set(purchasesSnap.docs.map(d => d.data().userEmail).filter(Boolean));
    // all = union of registered users + checklist leads (no double count)
    const allEmails = new Set([...userEmails, ...leadEmails]);
    res.json({
      status: 'success',
      data: {
        all: allEmails.size,
        users: userEmails.size,
        buyers: buyerEmails.size,
        checklist: leadEmails.size,
      },
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/admin/email-replies
router.get('/email-replies', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('email_replies').orderBy('receivedAt', 'desc').limit(50).get();
    const replies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ status: 'success', data: replies, unread: replies.filter(r => !r.read).length });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// PUT /api/admin/email-replies/:id/read
router.put('/email-replies/:id/read', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('email_replies').doc(req.params.id).update({ read: true });
    res.json({ status: 'success' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// DELETE /api/admin/email-replies/:id
router.delete('/email-replies/:id', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('email_replies').doc(req.params.id).delete();
    res.json({ status: 'success' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// GET /api/admin/reviews
router.get('/reviews', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection('reviews').get();
    const reviews = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ status: 'success', data: reviews });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('reviews').doc(req.params.id).delete();
    res.json({ status: 'success' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

module.exports = router;
