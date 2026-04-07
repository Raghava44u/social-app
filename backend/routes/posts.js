// ============================================
// POST ROUTES
// /api/posts/*
// ============================================

const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeed,
  getAllPosts,
  getPost,
  getUserPosts,
  deletePost,
  sharePost,
} = require('../controllers/postController');
const { toggleLike } = require('../controllers/likeController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All post routes require authentication
router.use(auth);

router.post('/', upload.single('image'), createPost);   // POST /api/posts
router.get('/feed', getFeed);                            // GET /api/posts/feed
router.get('/', getAllPosts);                             // GET /api/posts (public feed)
router.get('/:id', getPost);                             // GET /api/posts/:id
router.get('/user/:userId', getUserPosts);               // GET /api/posts/user/:userId
router.delete('/:id', deletePost);                       // DELETE /api/posts/:id
router.post('/:id/like', toggleLike);                    // POST /api/posts/:id/like
router.post('/:id/share', sharePost);                    // POST /api/posts/:id/share

module.exports = router;
