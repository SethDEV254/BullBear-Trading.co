const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('../lib/firebase');
const { sendFreePdfEmail } = require('../utils/emailService');

const generateToken = (email) =>
  jwt.sign({ id: email }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const db = getDb();
    const userRef = db.collection('users').doc(email.toLowerCase().trim());
    const snap = await userRef.get();

    if (snap.exists) {
      return res.status(400).json({ status: 'error', message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const userData = {
      email: email.toLowerCase().trim(),
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      role: role === 'admin' ? 'user' : (role || 'user'),
      isVerified: false,
      purchases: [],
      lastLogin: null,
      createdAt: now,
    };

    await userRef.set(userData);
    const token = generateToken(userData.email);
    const { passwordHash: _, ...safeUser } = userData;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { user: { ...safeUser, id: userData.email }, token },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    const db = getDb();
    const snap = await db.collection('users').doc(email.toLowerCase().trim()).get();
    if (!snap.exists) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const user = snap.data();
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    await snap.ref.update({ lastLogin: new Date().toISOString() });
    const token = generateToken(user.email);
    const { passwordHash: _, ...safeUser } = user;

    res.json({
      status: 'success',
      message: 'Login successful',
      data: { user: { ...safeUser, id: user.email }, token },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ status: 'error', message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const snap = await db.collection('users').doc(decoded.id).get();
    if (!snap.exists) return res.status(404).json({ status: 'error', message: 'User not found' });

    const { passwordHash: _, ...safeUser } = snap.data();
    res.json({ status: 'success', data: { user: { ...safeUser, id: decoded.id } } });
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
});

// POST /api/auth/send-free-pdf
router.post('/send-free-pdf', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ status: 'error', message: 'Email and name are required' });
    }

    const result = await sendFreePdfEmail(email, name);
    if (result.success) {
      res.json({ status: 'success', message: 'PDF sent to your email successfully!' });
    } else {
      res.status(500).json({ status: 'error', message: 'Failed to send email. Please try again later.' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
