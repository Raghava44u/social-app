// ============================================
// USER CONTROLLER
// Handles user profile operations
// ============================================

const { User, Friend, FriendRequest } = require('../models');
const cloudinary = require('../config/cloudinary');
const { Op } = require('sequelize');

// ---- GET USER PROFILE ----
// GET /api/users/:id
const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check friendship status with current user
    let friendshipStatus = 'none';

    if (req.userId !== parseInt(id)) {
      // Check if they're friends
      const friendship = await Friend.findOne({
        where: {
          [Op.or]: [
            { userId: req.userId, friendId: id },
            { userId: id, friendId: req.userId },
          ],
        },
      });

      if (friendship) {
        friendshipStatus = 'friends';
      } else {
        // Check for pending request
        const request = await FriendRequest.findOne({
          where: {
            [Op.or]: [
              { senderId: req.userId, receiverId: id, status: 'pending' },
              { senderId: id, receiverId: req.userId, status: 'pending' },
            ],
          },
        });

        if (request) {
          friendshipStatus = request.senderId === req.userId ? 'request_sent' : 'request_received';
        }
      }
    }

    // Count friends
    const friendsCount = await Friend.count({
      where: {
        [Op.or]: [
          { userId: id },
          { friendId: id },
        ],
      },
    });

    res.json({
      success: true,
      data: {
        user: user.toSafeJSON(),
        friendshipStatus,
        friendsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---- UPDATE PROFILE ----
// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, bio } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;

    await req.user.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: req.user.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// ---- UPDATE PROFILE IMAGE ----
// PUT /api/users/profile/image
const updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided.',
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'social-app/profiles',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    await req.user.update({ profileImage: result.secure_url });

    res.json({
      success: true,
      message: 'Profile image updated.',
      data: {
        profileImage: result.secure_url,
        user: req.user.toSafeJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---- SEARCH USERS ----
// GET /api/users/search?q=query
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters.',
      });
    }

    const users = await User.findAll({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: req.userId } }, // Exclude self
          {
            [Op.or]: [
              { username: { [Op.like]: `%${q}%` } },
              { firstName: { [Op.like]: `%${q}%` } },
              { lastName: { [Op.like]: `%${q}%` } },
            ],
          },
        ],
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
      limit: 20,
    });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

// ---- GET ALL USERS (for discovering people) ----
// GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where: { id: { [Op.ne]: req.userId } },
      attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'bio'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        users,
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

module.exports = {
  getUserProfile,
  updateProfile,
  updateProfileImage,
  searchUsers,
  getAllUsers,
};
