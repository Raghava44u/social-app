// ============================================
// FRIEND CONTROLLER
// Handles friend requests and friend management
// ============================================

const { FriendRequest, Friend, User, Notification } = require('../models');
const { Op } = require('sequelize');
const { getIO, getUserRoom } = require('../utils/socket');

// ---- SEND FRIEND REQUEST ----
// POST /api/friends/request/:userId
const sendFriendRequest = async (req, res, next) => {
  try {
    const receiverId = parseInt(req.params.userId);

    // Can't friend yourself
    if (receiverId === req.userId) {
      return res.status(400).json({
        success: false,
        message: "You can't send a friend request to yourself.",
      });
    }

    // Check if receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if already friends
    const existingFriend = await Friend.findOne({
      where: {
        [Op.or]: [
          { userId: req.userId, friendId: receiverId },
          { userId: receiverId, friendId: req.userId },
        ],
      },
    });

    if (existingFriend) {
      return res.status(400).json({
        success: false,
        message: 'You are already friends with this user.',
      });
    }

    // Check for existing request
    const existingRequest = await FriendRequest.findOne({
      where: {
        [Op.or]: [
          { senderId: req.userId, receiverId },
          { senderId: receiverId, receiverId: req.userId },
        ],
        status: 'pending',
      },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'A friend request already exists between you two.',
      });
    }

    // Create the request
    const request = await FriendRequest.create({
      senderId: req.userId,
      receiverId,
    });

    // Notify the receiver
    const notification = await Notification.create({
      userId: receiverId,
      fromUserId: req.userId,
      type: 'friend_request',
      referenceId: request.id,
      message: `${req.user.username} sent you a friend request.`,
    });

    try {
      getIO().to(getUserRoom(receiverId)).emit('new_notification', notification);
    } catch(ioErr) {
      console.error(ioErr);
    }

    res.status(201).json({
      success: true,
      message: 'Friend request sent!',
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

// ---- ACCEPT FRIEND REQUEST ----
// PUT /api/friends/accept/:requestId
const acceptFriendRequest = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.requestId);

    const request = await FriendRequest.findByPk(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found.',
      });
    }

    // Only the receiver can accept
    if (request.receiverId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept requests sent to you.',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed.',
      });
    }

    // Update request status
    await request.update({ status: 'accepted' });

    // Create bidirectional friendship
    await Friend.bulkCreate([
      { userId: request.senderId, friendId: request.receiverId },
      { userId: request.receiverId, friendId: request.senderId },
    ]);

    // Notify the sender
    const notification = await Notification.create({
      userId: request.senderId,
      fromUserId: req.userId,
      type: 'friend_accept',
      referenceId: request.id,
      message: `${req.user.username} accepted your friend request!`,
    });

    try {
      getIO().to(getUserRoom(request.senderId)).emit('new_notification', notification);
    } catch(ioErr) {
      console.error(ioErr);
    }

    res.json({
      success: true,
      message: 'Friend request accepted!',
    });
  } catch (error) {
    next(error);
  }
};

// ---- REJECT FRIEND REQUEST ----
// PUT /api/friends/reject/:requestId
const rejectFriendRequest = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.requestId);

    const request = await FriendRequest.findByPk(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found.',
      });
    }

    if (request.receiverId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject requests sent to you.',
      });
    }

    await request.update({ status: 'rejected' });

    res.json({
      success: true,
      message: 'Friend request rejected.',
    });
  } catch (error) {
    next(error);
  }
};

// ---- GET PENDING REQUESTS ----
// GET /api/friends/requests
const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await FriendRequest.findAll({
      where: {
        receiverId: req.userId,
        status: 'pending',
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    next(error);
  }
};

// ---- GET FRIENDS LIST ----
// GET /api/friends
const getFriends = async (req, res, next) => {
  try {
    const userId = parseInt(req.query.userId) || req.userId;

    const friendships = await Friend.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'friend',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'bio', 'isOnline'],
        },
      ],
    });

    const friends = friendships.map(f => f.friend);

    res.json({
      success: true,
      data: { friends },
    });
  } catch (error) {
    next(error);
  }
};

// ---- REMOVE FRIEND ----
// DELETE /api/friends/:friendId
const removeFriend = async (req, res, next) => {
  try {
    const friendId = parseInt(req.params.friendId);

    // Remove both directions of friendship
    await Friend.destroy({
      where: {
        [Op.or]: [
          { userId: req.userId, friendId },
          { userId: friendId, friendId: req.userId },
        ],
      },
    });

    // Also clean up the accepted friend request
    await FriendRequest.destroy({
      where: {
        [Op.or]: [
          { senderId: req.userId, receiverId: friendId },
          { senderId: friendId, receiverId: req.userId },
        ],
      },
    });

    res.json({
      success: true,
      message: 'Friend removed.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
};
