// ============================================
// NOTIFICATION ROUTES
// /api/notifications/*
// ============================================

const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All notification routes require authentication
router.use(auth);

router.get('/', getNotifications);              // GET /api/notifications
router.get('/unread-count', getUnreadCount);    // GET /api/notifications/unread-count
router.put('/read-all', markAllAsRead);         // PUT /api/notifications/read-all
router.put('/:id/read', markAsRead);            // PUT /api/notifications/:id/read

module.exports = router;
