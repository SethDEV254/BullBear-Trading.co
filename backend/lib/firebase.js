const { initializeApp, getApps, cert, refreshToken } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function getDb() {
  if (!getApps().length) {
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

    initializeApp({ credential, projectId: 'bullbear-trading-live' });
  }

  return getFirestore();
}

module.exports = { getDb };
