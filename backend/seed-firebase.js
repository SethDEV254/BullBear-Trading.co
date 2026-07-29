// Seed Firebase Firestore with admin user + courses
// Run with: FIREBASE_REFRESH_TOKEN=... node seed-firebase.js
require('dotenv').config();
const { initializeApp, getApps, refreshToken } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const bcrypt = require('bcryptjs');

async function seed() {
  if (!getApps().length) {
    const { cert } = require('firebase-admin/app');
    const credential = process.env.FIREBASE_SERVICE_ACCOUNT
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
      : refreshToken({
          type: 'authorized_user',
          client_id: process.env.FIREBASE_CLIENT_ID,
          client_secret: process.env.FIREBASE_CLIENT_SECRET,
          refresh_token: process.env.FIREBASE_REFRESH_TOKEN,
        });
    initializeApp({ credential, projectId: 'bullbear-trading-live' });
  }

  const db = getFirestore();

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bullbeartrading.com';
  const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@2025!';
  const adminRef   = db.collection('users').doc(adminEmail);
  const adminSnap  = await adminRef.get();

  if (!adminSnap.exists) {
    const passwordHash = await bcrypt.hash(adminPass, 10);
    await adminRef.set({
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'BullBear',
      phone: '',
      role: 'admin',
      isVerified: true,
      purchases: [],
      lastLogin: null,
      createdAt: new Date().toISOString(),
    });
    console.log('✅ Admin user created:', adminEmail, '/', adminPass);
  } else {
    console.log('⚠️  Admin user already exists:', adminEmail);
  }

  // ── Courses ─────────────────────────────────────────────────────────────────
  const courses = [
    {
      courseId: 'crypto-trading-course',
      title: 'Crypto Trading Mastery Course',
      description: 'Master the art of cryptocurrency trading with our comprehensive video course.',
      price: 500, currency: 'USD', category: 'trading', level: 'intermediate',
      duration: '12 hours', isActive: true, totalPurchases: 0,
    },
    {
      courseId: 'defi-fundamentals',
      title: 'DeFi Fundamentals: Complete Guide',
      description: 'Dive deep into Decentralized Finance.',
      price: 350, currency: 'USD', category: 'crypto', level: 'beginner',
      duration: '8 hours', isActive: true, totalPurchases: 0,
    },
    {
      courseId: 'nft-masterclass',
      title: 'NFT Masterclass: Create & Profit',
      description: 'Learn everything about NFTs - from creation to selling.',
      price: 299, currency: 'USD', category: 'crypto', level: 'beginner',
      duration: '6 hours', isActive: true, totalPurchases: 0,
    },
    {
      courseId: 'blockchain-development',
      title: 'Blockchain Development Bootcamp',
      description: 'Become a blockchain developer. Learn Solidity and smart contracts.',
      price: 799, currency: 'USD', category: 'web3', level: 'advanced',
      duration: '20 hours', isActive: true, totalPurchases: 0,
    },
    {
      courseId: 'crypto-portfolio-management',
      title: 'Crypto Portfolio Management Pro',
      description: 'Build and manage a profitable crypto portfolio.',
      price: 399, currency: 'USD', category: 'trading', level: 'intermediate',
      duration: '10 hours', isActive: true, totalPurchases: 0,
    },
    {
      courseId: 'crypto-security-essentials',
      title: 'Crypto Security Essentials',
      description: 'Protect your crypto assets like a pro.',
      price: 199, currency: 'USD', category: 'crypto', level: 'beginner',
      duration: '5 hours', isActive: true, totalPurchases: 0,
    },
  ];

  for (const course of courses) {
    const ref = db.collection('courses').doc(course.courseId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({ ...course, createdAt: new Date().toISOString() });
      console.log('✅ Course created:', course.title);
    } else {
      console.log('⚠️  Course exists:', course.courseId);
    }
  }

  console.log('\nSeed complete!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
