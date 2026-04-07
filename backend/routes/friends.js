// ============================================
// FRIEND ROUTES
// /api/friends/*
// ============================================

const express = require('express');
const router = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
} = require('../controllers/friendController');
const auth = require('../middleware/auth');

// All friend routes require authentication
router.use(auth);

router.get('/', getFriends);                           // GET /api/friends
router.get('/requests', getPendingRequests);            // GET /api/friends/requests
router.post('/request/:userId', sendFriendRequest);    // POST /api/friends/request/:userId
router.put('/accept/:requestId', acceptFriendRequest); // PUT /api/friends/accept/:requestId
router.put('/reject/:requestId', rejectFriendRequest); // PUT /api/friends/reject/:requestId
router.delete('/:friendId', removeFriend);             // DELETE /api/friends/:friendId

module.exports = router;
