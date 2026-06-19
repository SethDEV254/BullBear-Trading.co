const express = require('express');
const cors = require('cors');
const compression = require('compression');

const authRoutes = require('../routes/auth');
const courseRoutes = require('../routes/courses');
const purchaseRoutes = require('../routes/purchases');
const userRoutes = require('../routes/users');
const adminRoutes = require('../routes/admin');
const paypalRoutes = require('../routes/paypal');
const checklistRoutes = require('../routes/checklist');
const whatsappRoutes = require('../routes/whatsapp');

const app = express();

app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'BullBear Trading API is running on Vercel',
    timestamp: new Date().toISOString(),
    database: 'firebase',
    firebaseProject: 'bullbear-trading-live',
  });
});

app.get('/api', (req, res) => {
  res.json({ message: 'BullBear Trading API', tagline: 'Master the Markets', version: '2.0.0', platform: 'Vercel + Firebase' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ status: 'error', message: err.message || 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

module.exports = app;
