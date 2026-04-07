// ============================================
// USER ROUTES
// /api/users/*
// ============================================

const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  updateProfileImage,
  searchUsers,
  getAllUsers,
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All user routes require authentication
router.use(auth);

router.get('/search', searchUsers);                          // GET /api/users/search?q=query
router.get('/', getAllUsers);                                 // GET /api/users
router.get('/:id', getUserProfile);                          // GET /api/users/:id
router.put('/profile', updateProfile);                       // PUT /api/users/profile
router.put('/profile/image', upload.single('image'), updateProfileImage); // PUT /api/users/profile/image

module.exports = router;
