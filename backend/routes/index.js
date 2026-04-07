const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./users');
const postRoutes = require('./posts');
const commentRoutes = require('./comments');
const friendRoutes = require('./friends');
const notificationRoutes = require('./notifications');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/friends', friendRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
