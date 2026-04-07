// ============================================
// COMMENT ROUTES
// /api/comments/*
// ============================================

const express = require('express');
const router = express.Router();
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

// All comment routes require authentication
router.use(auth);

router.post('/:postId', addComment);       // POST /api/comments/:postId
router.get('/:postId', getComments);       // GET /api/comments/:postId
router.delete('/:id', deleteComment);      // DELETE /api/comments/:id

module.exports = router;
