/**
 * BullBear Trading — Firebase Realtime Database Layer
 * Handles real-time sync of users, purchases, and activity events.
 *
 * SETUP:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a project named "bullbear-trading"
 * 3. Add a Web app, copy the firebaseConfig below
 * 4. Firestore Database → Create database → Start in test mode
 * 5. Replace the placeholder config values below
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  increment,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ─── CONFIG (replace with your Firebase project values) ───────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyCHEXr31LGXB8FYhDAsF2nEGa9aKzNGqU4',
  authDomain: 'bullbear-trading-live.firebaseapp.com',
  projectId: 'bullbear-trading-live',
  storageBucket: 'bullbear-trading-live.firebasestorage.app',
  messagingSenderId: '712055152506',
  appId: '1:712055152506:web:cedb559ac9d2d040b700c3',
};
// ─────────────────────────────────────────────────────────────────────────────

let app, db;

function init() {
  if (app) return;
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function rtSaveUser(userData) {
  init();
  const id = userData.email.replace(/[.#$[\]]/g, '_');
  const ref = doc(db, 'users', id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, { lastLogin: serverTimestamp() });
    return;
  }

  await setDoc(ref, {
    name: userData.name || '',
    email: userData.email,
    source: userData.source || 'signup',
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    purchases: 0,
  });

  await rtLogEvent('signup', {
    email: userData.email,
    name: userData.name || '',
    source: userData.source || 'signup',
  });

  await rtUpdateCounter('totalUsers', 1);
}

export async function rtUpdateLogin(email) {
  init();
  const id = email.replace(/[.#$[\]]/g, '_');
  const ref = doc(db, 'users', id);
  await updateDoc(ref, { lastLogin: serverTimestamp() }).catch(() => {});
  await rtLogEvent('login', { email });
}

// ─── PURCHASES ────────────────────────────────────────────────────────────────

export async function rtSavePurchase(purchaseData) {
  init();
  const ref = await addDoc(collection(db, 'purchases'), {
    userId: purchaseData.email.replace(/[.#$[\]]/g, '_'),
    email: purchaseData.email,
    productId: purchaseData.productId || 'unknown',
    productName: purchaseData.productName || 'Unknown Product',
    amount: purchaseData.amount || 0,
    currency: purchaseData.currency || 'USD',
    paymentMethod: purchaseData.paymentMethod || 'paypal',
    status: purchaseData.status || 'completed',
    createdAt: serverTimestamp(),
  });

  const userId = purchaseData.email.replace(/[.#$[\]]/g, '_');
  await updateDoc(doc(db, 'users', userId), {
    purchases: increment(1),
  }).catch(() => {});

  await rtLogEvent('purchase', {
    email: purchaseData.email,
    productName: purchaseData.productName,
    amount: purchaseData.amount,
    paymentMethod: purchaseData.paymentMethod,
  });

  await rtUpdateCounter('totalRevenue', purchaseData.amount || 0);
  await rtUpdateCounter('totalPurchases', 1);

  return ref.id;
}

// ─── CHECKLIST DOWNLOADS ──────────────────────────────────────────────────────

export async function rtLogChecklistDownload(email, name) {
  init();
  await rtLogEvent('checklist_download', { email, name });
  await rtUpdateCounter('checklistDownloads', 1);
  await rtSaveUser({ email, name, source: 'checklist' });
}

// ─── EVENTS FEED ─────────────────────────────────────────────────────────────

export async function rtLogEvent(type, data) {
  init();
  await addDoc(collection(db, 'events'), {
    type,
    data,
    timestamp: serverTimestamp(),
    page: typeof window !== 'undefined' ? window.location.pathname : '/',
  });
}

// ─── COUNTERS ────────────────────────────────────────────────────────────────

async function rtUpdateCounter(field, delta) {
  const ref = doc(db, 'stats', 'global');
  await updateDoc(ref, { [field]: increment(delta) }).catch(async () => {
    await setDoc(ref, { [field]: delta }, { merge: true });
  });
}

// ─── REAL-TIME LISTENERS (for admin dashboard) ────────────────────────────────

export function rtListenStats(callback) {
  init();
  return onSnapshot(doc(db, 'stats', 'global'), (snap) => {
    callback(snap.exists() ? snap.data() : {});
  });
}

export function rtListenRecentEvents(callback, maxItems = 20) {
  init();
  const q = query(
    collection(db, 'events'),
    orderBy('timestamp', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function rtListenRecentUsers(callback, maxItems = 50) {
  init();
  const q = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function rtListenRecentPurchases(callback, maxItems = 50) {
  init();
  const q = query(
    collection(db, 'purchases'),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── ONE-TIME READS ───────────────────────────────────────────────────────────

export async function rtGetAllUsers() {
  init();
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function rtGetStats() {
  init();
  const snap = await getDoc(doc(db, 'stats', 'global'));
  return snap.exists() ? snap.data() : {};
}

export { db, init as rtInit };
