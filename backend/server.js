/**
 * Express Server
 * Main entry point for the Attendance System Backend
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB
connectDB();

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS for cross-origin requests
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// API root endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Attendance System API',
        version: '1.0.0',
        endpoints: {
            students: '/api/students',
            attendance: '/api/attendance',
        },
    });
});

// Student routes
app.use('/api/students', require('./routes/students'));

// Attendance routes
app.use('/api/attendance', require('./routes/attendance'));

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Attendance System Backend Server');
    console.log('='.repeat(50));
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});
