// ============================================
// SOCKET.IO UTILITY
// Manages real-time connections and user mapping
// ============================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
// Map to track Online Users: { userId: socketId }
const userSockets = new Map();

module.exports = {
  // Initialize Socket.io server
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    // Authentication Middleware
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication Error'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
      } catch (err) {
        next(new Error('Invalid or Expired Token'));
      }
    });

    // Connection Handler
    io.on('connection', (socket) => {
      console.log(`🔌 Client connected: UserID ${socket.userId} - Socket ${socket.id}`);
      
      // Map user ID to socket block
      userSockets.set(socket.userId, socket.id);

      // Join personal room for targeted events
      socket.join(`user_${socket.userId}`);

      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: UserID ${socket.userId}`);
        userSockets.delete(socket.userId);
      });
    });

    return io;
  },

  // Get io instance (Singleton)
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },

  // Target a specific user room
  getUserRoom: (userId) => {
    return `user_${userId}`;
  }
};
