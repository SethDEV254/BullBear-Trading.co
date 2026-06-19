const jwt = require('jsonwebtoken');
const { getDb } = require('../lib/firebase');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'No token provided. Please login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const snap = await db.collection('users').doc(decoded.id).get();

    if (!snap.exists) {
      return res.status(401).json({ status: 'error', message: 'User not found. Please login again.' });
    }

    const { passwordHash: _, ...user } = snap.data();
    req.user = { ...user, id: decoded.id, _id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token. Please login again.' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ status: 'error', message: 'Authentication required' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Access denied. Admin privileges required.' });
  }
  next();
};

const adminAuth = [verifyToken, isAdmin];

module.exports = { verifyToken, isAdmin, adminAuth };
