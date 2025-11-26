// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');
const fs = require('fs');


const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const indexRoutes = require('./routes/index');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const franchiseRoutes = require('./routes/franchiseRoutes');
const allowedOrigins = [
    "http://localhost:3000",
    'https://abacus.careerreadyjk.live',
    'https://careerreadyjk.live',
    'https://wizard.smepay.in',
];

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const ASSETS_DIR = process.env.ASSETS_DIR || 'assets';

// ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });


// Initialize express app
const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// Routes
app.use('/', indexRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/franchise', franchiseRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), UPLOADS_DIR)));
app.use('/assets', express.static(path.join(process.cwd(), ASSETS_DIR)));


// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    Server running in ${process.env.NODE_ENV || 'development'} mode
    Port: ${PORT}
    URL: http://localhost:${PORT}
     Started: ${new Date().toLocaleString()}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;