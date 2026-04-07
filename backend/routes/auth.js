// ============================================
// AUTH ROUTES
// /api/auth/*
// ============================================

const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);    // POST /api/auth/register
router.post('/login', login);          // POST /api/auth/login

// Protected routes (require login)
router.get('/me', auth, getMe);        // GET /api/auth/me
router.post('/logout', auth, logout);  // POST /api/auth/logout

module.exports = router;
