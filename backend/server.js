const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./utils/database');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const purchaseRoutes = require('./routes/purchases');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const paypalRoutes = require('./routes/paypal');
const checklistRoutes = require('./routes/checklist');
const mpesaRoutes = require('./routes/mpesa');

// Initialize Express app
const app = express();

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(compression()); // Enable gzip compression
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter); // Apply rate limiting to API routes

// Serve static files from parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));

// Database connection with clean messaging
const initializeDatabase = async () => {
    if (process.env.USE_MOCK_DB === 'true') {
        console.log('📦 Using in-memory database for development');
    } else {
        try {
            console.log('🔗 Connecting to MongoDB...');
            await connectDB();
            console.log('✅ MongoDB connected successfully!');
        } catch (err) {
            console.log('📦 Using in-memory database (MongoDB unavailable)');
            process.env.USE_MOCK_DB = 'true';
        }
    }
};

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/mpesa', mpesaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'BullBear Trading API is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint — serve the live dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'realtime-dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Bull Bear Trading API running on port ${PORT}`);
    console.log(`🎙️ Master the Markets`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
