// ============================================
// NOTIFICATION MODEL
// Stores user notifications for various events
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'from_user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM(
      'friend_request',    // Someone sent you a friend request
      'friend_accept',     // Someone accepted your friend request
      'post_like',         // Someone liked your post
      'post_comment',      // Someone commented on your post
      'post_share'         // Someone shared your post
    ),
    allowNull: false,
  },
  // Reference to the related entity (postId, requestId, etc.)
  referenceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reference_id',
  },
  message: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] },
    { fields: ['created_at'] },
  ],
});

module.exports = Notification;
