// ============================================
// POST CONTROLLER
// Handles creating, reading, and sharing posts
// ============================================

const { Post, User, Like, Comment, Friend, Notification } = require('../models');
const cloudinary = require('../config/cloudinary');
const { Op } = require('sequelize');

// ---- CREATE POST ----
// POST /api/posts
const createPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    let imageUrl = null;

    // If an image file was uploaded, send it to Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'social-app/posts',
            transformation: [{ width: 1200, quality: 'auto' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    // Validate: must have either text or image
    if (!content && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Post must have text content or an image.',
      });
    }

    const post = await Post.create({
      userId: req.userId,
      content: content || '',
      imageUrl,
    });

    // Fetch the post with author info
    const fullPost = await Post.findByPk(post.id, {
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
      message: 'Post created!',
      data: { post: fullPost },
    });
  } catch (error) {
    next(error);
  }
};

// ---- GET FEED ----
// GET /api/posts/feed
const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get friend IDs
    const friendships = await Friend.findAll({
      where: {
        [Op.or]: [
          { userId: req.userId },
          { friendId: req.userId },
        ],
      },
    });

    const friendIds = friendships.map(f =>
      f.userId === req.userId ? f.friendId : f.userId
    );

    // Include self + friends in feed
    const feedUserIds = [req.userId, ...friendIds];

    const { count, rows: posts } = await Post.findAndCountAll({
      where: { userId: { [Op.in]: feedUserIds } },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
        {
          model: Post,
          as: 'originalPost',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
            },
          ],
        },
        {
          model: User,
          as: 'sharedByUser',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Check which posts the current user has liked
    const postIds = posts.map(p => p.id);
    const userLikes = await Like.findAll({
      where: {
        userId: req.userId,
        postId: { [Op.in]: postIds },
      },
    });
    const likedPostIds = new Set(userLikes.map(l => l.postId));

    // Add isLiked flag to each post
    const postsWithLikeStatus = posts.map(post => ({
      ...post.toJSON(),
      isLiked: likedPostIds.has(post.id),
    }));

    res.json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
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

// ---- GET ALL POSTS (public feed) ----
// GET /api/posts
const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: posts } = await Post.findAndCountAll({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
        {
          model: Post,
          as: 'originalPost',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
            },
          ],
        },
        {
          model: User,
          as: 'sharedByUser',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Check which posts the current user has liked
    const postIds = posts.map(p => p.id);
    const userLikes = await Like.findAll({
      where: {
        userId: req.userId,
        postId: { [Op.in]: postIds },
      },
    });
    const likedPostIds = new Set(userLikes.map(l => l.postId));

    const postsWithLikeStatus = posts.map(post => ({
      ...post.toJSON(),
      isLiked: likedPostIds.has(post.id),
    }));

    res.json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
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

// ---- GET SINGLE POST ----
// GET /api/posts/:id
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
            },
          ],
          order: [['created_at', 'DESC']],
        },
        {
          model: Post,
          as: 'originalPost',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
            },
          ],
        },
      ],
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Check if current user liked this post
    const liked = await Like.findOne({
      where: { userId: req.userId, postId: post.id },
    });

    res.json({
      success: true,
      data: {
        post: { ...post.toJSON(), isLiked: !!liked },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---- GET USER'S POSTS ----
// GET /api/posts/user/:userId
const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: posts } = await Post.findAndCountAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
        {
          model: Post,
          as: 'originalPost',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    // Check likes
    const postIds = posts.map(p => p.id);
    const userLikes = await Like.findAll({
      where: { userId: req.userId, postId: { [Op.in]: postIds } },
    });
    const likedPostIds = new Set(userLikes.map(l => l.postId));

    const postsWithLikeStatus = posts.map(post => ({
      ...post.toJSON(),
      isLiked: likedPostIds.has(post.id),
    }));

    res.json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
        pagination: { total: count, page, pages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---- DELETE POST ----
// DELETE /api/posts/:id
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Only the author can delete their post
    if (post.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts.',
      });
    }

    // Delete associated likes and comments
    await Like.destroy({ where: { postId: post.id } });
    await Comment.destroy({ where: { postId: post.id } });
    await post.destroy();

    res.json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ---- SHARE POST ----
// POST /api/posts/:id/share
const sharePost = async (req, res, next) => {
  try {
    const originalPost = await Post.findByPk(req.params.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
    });

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Can't share your own post
    if (originalPost.userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: "You can't share your own post.",
      });
    }

    const { shareText } = req.body;

    // Create the shared post
    const sharedPost = await Post.create({
      userId: req.userId,
      content: originalPost.content,
      imageUrl: originalPost.imageUrl,
      originalPostId: originalPost.id,
      sharedBy: req.userId,
      shareText: shareText || '',
    });

    // Increment share count on original
    await originalPost.increment('sharesCount');

    // Notify original author
    if (originalPost.userId !== req.userId) {
      await Notification.create({
        userId: originalPost.userId,
        fromUserId: req.userId,
        type: 'post_share',
        referenceId: originalPost.id,
        message: `${req.user.username} shared your post.`,
      });
    }

    const fullPost = await Post.findByPk(sharedPost.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
        {
          model: Post,
          as: 'originalPost',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Post shared!',
      data: { post: fullPost },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getFeed,
  getAllPosts,
  getPost,
  getUserPosts,
  deletePost,
  sharePost,
};
