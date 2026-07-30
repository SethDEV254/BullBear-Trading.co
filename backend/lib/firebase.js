const { initializeApp, getApps, cert, refreshToken } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const STORAGE_BUCKET = 'bullbear-trading-live.firebasestorage.app';

// Cached instance — reused across requests in the same function instance
let _db = null;
let _bucket = null;

function ensureApp() {
  if (getApps().length) return;
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  } else if (process.env.FIREBASE_REFRESH_TOKEN) {
    credential = refreshToken({
      type: 'authorized_user',
      client_id: process.env.FIREBASE_CLIENT_ID,
      client_secret: process.env.FIREBASE_CLIENT_SECRET,
      refresh_token: process.env.FIREBASE_REFRESH_TOKEN,
    });
  } else {
    throw new Error('Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_REFRESH_TOKEN.');
  }
  initializeApp({ credential, projectId: 'bullbear-trading-live', storageBucket: STORAGE_BUCKET });
}

function getDb() {
  if (_db) return _db;
  ensureApp();
  _db = getFirestore();
  return _db;
}

function getBucket() {
  if (_bucket) return _bucket;
  ensureApp();
  _bucket = getStorage().bucket();
  return _bucket;
}

module.exports = { getDb, getBucket };
