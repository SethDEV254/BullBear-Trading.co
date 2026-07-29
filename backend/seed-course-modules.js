// Seed the Crypto Trading Course modules + lesson placeholders (video URLs added later via admin panel)
// Run with: node seed-course-modules.js
require('dotenv').config();
const { initializeApp, getApps, cert, refreshToken } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const MODULES = [
  {
    name: 'Module 1: Building Your Crypto Trading Foundation',
    lessons: [
      { title: 'Fund Your Trading Account the Right Way & Avoid Costly Beginner Mistakes', description: 'One of the most important lessons in the entire course — fund your trading account the right way and avoid costly beginner mistakes that cost most new traders money before they even place a trade.', type: 'video' },
      { title: 'Favorite TradingView Tools', description: 'Learn how to set up and navigate TradingView, the essential charting platform for every serious trader.', type: 'video' },
      { title: 'Blofin Demo Account', description: 'Learn how to set up and use your BloFin demo trading account the right way before risking real capital.', type: 'video' },
      { title: 'Custom EMA Ribbons for Trend Analysis', description: 'Optimize your entry and exit points using a stacked EMA ribbon setup for cleaner trend reads.', type: 'video' },
      { title: "EMA's, SMMA 50, UT-Bot and Custom Templates", description: 'Combine powerful indicators like EMAs, SMMA 50, and UT-Bot alerts into one custom template.', type: 'video' },
      { title: 'Short, Medium, and Long-Term Trading Strategies', description: 'Develop a strategy that aligns with your goals, timeframe, and risk tolerance.', type: 'video' },
    ],
  },
  {
    name: 'Module 2: Mastering Market Structure & Risk Management',
    lessons: [
      { title: 'Understanding Candlesticks', description: 'Candlesticks reveal critical market sentiment — whether buyers or sellers are in control.', type: 'video' },
      { title: 'Understanding Support and Resistance', description: 'Support and resistance levels are the foundation of technical analysis.', type: 'video' },
      { title: 'Understanding Trend Lines', description: 'Trend lines help traders identify market direction and spot breakout opportunities.', type: 'video' },
      { title: 'Custom Fibonacci Setups', description: 'Fibonacci retracement is a powerful tool for predicting price reversals and key entry points.', type: 'video' },
      { title: 'Macro Fibonacci Pricing', description: 'Understand macro Fibonacci levels to analyze long-term price movements and major zones.', type: 'video' },
      { title: 'Fibonacci Profit & Stop Losses', description: 'Use Fibonacci correctly to optimize your stop-loss and take-profit placements.', type: 'video' },
      { title: 'Proper Use of Fibonacci', description: 'Not all Fibonacci setups are created equal — the right and wrong ways to draw them.', type: 'video' },
      { title: 'Sniper Money Fibonacci', description: 'An advanced technique designed to pinpoint high-accuracy entries using Fibonacci confluence.', type: 'video' },
    ],
  },
  {
    name: 'Module 3: Advanced Trading Strategies & Scaling Up',
    lessons: [
      { title: 'Favorite Assets, Futures & Spot', description: 'Choosing the right assets is critical to your trading success — which to trade and why.', type: 'video' },
      { title: 'Trade Windows & Isolation', description: 'Not all trading sessions are created equal — identify the best windows to trade.', type: 'video' },
      { title: 'Leverage Trading Explained', description: 'Leverage can amplify gains but also magnify risks — how leverage actually works.', type: 'video' },
      { title: 'Market & Limit Orders', description: 'The difference between market and limit orders, and when to use each for effective execution.', type: 'video' },
      { title: 'Stop Loss & Take Profit Settings', description: 'Mastering stop-loss and take-profit orders to protect profits while limiting risk.', type: 'video' },
      { title: 'Trade Execution', description: 'Knowing when and how to execute a trade is just as important as your overall strategy.', type: 'video' },
      { title: '$100K Trading Strategy', description: 'A structured blueprint for growing a six-figure trading portfolio.', type: 'video' },
      { title: 'Scaling Up Trades', description: 'Scale your trades effectively to increase profits without overexposing your capital.', type: 'video' },
      { title: 'Crypto Chart Patterns Playbook', description: 'The beginner-friendly cheat sheet guide to understanding market structure and chart patterns.', type: 'document' },
    ],
  },
];

async function seed() {
  if (!getApps().length) {
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
  const now = new Date().toISOString();

  for (let i = 0; i < MODULES.length; i++) {
    const mod = MODULES[i];
    const moduleRef = await db.collection('modules').add({
      name: mod.name,
      description: '',
      order: i + 1,
      isActive: true,
      createdAt: now,
      createdBy: 'seed-script',
    });
    console.log('Module created:', mod.name, '->', moduleRef.id);

    for (let j = 0; j < mod.lessons.length; j++) {
      const lesson = mod.lessons[j];
      const contentRef = await db.collection('content').add({
        title: lesson.title,
        description: lesson.description,
        url: 'PENDING',
        thumbnail: '',
        type: lesson.type,
        category: 'Crypto Trading Course',
        accessLevel: 'paid',
        duration: '',
        order: j + 1,
        moduleId: moduleRef.id,
        isActive: false, // hidden from students until a real URL is set via the admin panel
        createdAt: now,
        createdBy: 'seed-script',
      });
      console.log('  Lesson created:', lesson.title, '->', contentRef.id);
    }
  }

  console.log('\nSeed complete! All lessons are in Draft (isActive:false) with url "PENDING".');
  console.log('Add real video links and flip each to Active from the admin panel Content Library.');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
