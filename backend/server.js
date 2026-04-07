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

// Create Express app
const app = express();

// ---- MIDDLEWARE ----

// 1. Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// 2. Prevent HTTP Parameter Pollution
app.use(hpp());

// 3. CORS configuration
app.use(cors({
  origin: [
    "https://social-app-eosin-three.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
}));

// 4. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP.' }
});
app.use('/api', apiLimiter);

// 5. Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- API ROUTES ----

const routes = require('./routes/index');
app.use('/api', routes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Social Media API is running!',
    timestamp: new Date().toISOString(),
  });
});



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
