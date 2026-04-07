// ============================================
// FRIEND REQUEST MODEL
// Tracks pending friend requests between users
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FriendRequest = sequelize.define('FriendRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'receiver_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'friend_requests',
  indexes: [
    { fields: ['sender_id', 'receiver_id'], unique: true },
    { fields: ['status'] },
  ],
});

module.exports = FriendRequest;
