// ============================================
// SOCIAL MEDIA APP - BACKEND SERVER
// Main entry point for the Express application
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Import config
const { sequelize, testConnection } = require('./config/database');

// Import models (this sets up associations)
require('./models');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const friendRoutes = require('./routes/friends');
const notificationRoutes = require('./routes/notifications');

// Create Express app
const app = express();

// ---- MIDDLEWARE ----

// ---- SECURITY MIDDLEWARE ----
// 1. Set robust security headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Required for Cloudinary images
}));

// 2. API Rate Limiting to prevent brute-force & DDoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 250 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', apiLimiter);

// 3. Prevent HTTP Parameter Pollution vulnerabilities
app.use(hpp());

// CORS - allow frontend to make requests
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ---- API ROUTES ----

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Social Media API is running!',
    timestamp: new Date().toISOString(),
  });
});

// ---- SERVE FRONTEND IN PRODUCTION ----
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
  });
}

// ---- ERROR HANDLER (must be last) ----
app.use(errorHandler);

// ---- START SERVER ----
const PORT = process.env.PORT || 5000;
const http = require('http');
const socketUtils = require('./utils/socket');

const server = http.createServer(app);
// Initialize Socket.IO
socketUtils.init(server);

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Database tables synced.');

    // Start listening on the wrapped HTTP server, NOT raw app
    server.listen(PORT, () => {
      console.log(`\n🚀 Server and Socket.io running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🏥 Health check at http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
