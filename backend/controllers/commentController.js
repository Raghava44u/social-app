// ============================================
// COMMENT CONTROLLER
// Handles adding and deleting comments on posts
// ============================================

const { Comment, Post, User, Notification } = require('../models');
const { getIO, getUserRoom } = require('../utils/socket');

// ---- ADD COMMENT ----
// POST /api/comments/:postId
const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required.',
      });
    }

    // Check if post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Create comment
    const comment = await Comment.create({
      postId: parseInt(postId),
      userId: req.userId,
      content: content.trim(),
    });

    // Increment comment count on post
    await post.increment('commentsCount');

    // Notify post author (if different from commenter)
    if (post.userId !== req.userId) {
      const notification = await Notification.create({
        userId: post.userId,
        fromUserId: req.userId,
        type: 'post_comment',
        referenceId: parseInt(postId),
        message: `${req.user.username} commented on your post.`,
      });

      // EMIT EVENT
      try {
        getIO().to(getUserRoom(post.userId)).emit('new_notification', notification);
      } catch(ioErr) {
        console.error("Socket emit failed", ioErr);
      }
    }

    try {
      getIO().emit('post_interaction', { postId, type: 'comment_add', commentsCount: post.commentsCount + 1 });
    } catch(ioErr) {}

    // Fetch comment with author info
    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Comment added!',
      data: { comment: fullComment },
    });
  } catch (error) {
    next(error);
  }
};

// ---- GET COMMENTS FOR A POST ----
// GET /api/comments/:postId
const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: comments } = await Comment.findAndCountAll({
      where: { postId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---- DELETE COMMENT ----
// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    // Only the comment author can delete it
    if (comment.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments.',
      });
    }

    // Decrement comment count on post
    const post = await Post.findByPk(comment.postId);
    if (post) {
      await post.decrement('commentsCount');
    }

    try {
      if(post) getIO().emit('post_interaction', { postId: comment.postId, type: 'comment_remove', commentsCount: post.commentsCount - 1 });
    } catch(ioErr) {}

    await comment.destroy();

    res.json({
      success: true,
      message: 'Comment deleted.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments, deleteComment };
