// ============================================
// LIKE CONTROLLER
// Handles liking and unliking posts
// ============================================

const { Like, Post, User, Notification } = require('../models');
const { getIO, getUserRoom } = require('../utils/socket');

// ---- TOGGLE LIKE ----
// POST /api/posts/:id/like
const toggleLike = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      where: { postId, userId: req.userId },
    });

    if (existingLike) {
      // Unlike: remove the like
      await existingLike.destroy();
      await post.decrement('likesCount');

      // Broadly emit post interaction
      try {
        getIO().emit('post_interaction', { postId, type: 'unlike', likesCount: post.likesCount - 1 });
      } catch(ioErr) {}

      return res.json({
        success: true,
        message: 'Post unliked.',
        data: { liked: false, likesCount: post.likesCount - 1 },
      });
    } else {
      // Like: add a new like
      await Like.create({ postId, userId: req.userId });
      await post.increment('likesCount');

      // Notify post author (if different from liker)
      if (post.userId !== req.userId) {
        const notification = await Notification.create({
          userId: post.userId,
          fromUserId: req.userId,
          type: 'post_like',
          referenceId: postId,
          message: `${req.user.username} liked your post.`,
        });

        // EMIT EVENT
        try {
          getIO().to(getUserRoom(post.userId)).emit('new_notification', notification);
        } catch(ioErr) {
          console.error("Socket emit failed", ioErr);
        }
      }

      // Broadly emit post interaction to all active sockets 
      try {
        getIO().emit('post_interaction', { postId, type: 'like', likesCount: post.likesCount + 1 });
      } catch(ioErr) {}

      return res.json({
        success: true,
        message: 'Post liked!',
        data: { liked: true, likesCount: post.likesCount + 1 },
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleLike };
