// ============================================
// FRIEND MODEL
// Stores confirmed friendships between users
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Friend = sequelize.define('Friend', {
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
  friendId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'friend_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'friends',
  indexes: [
    // Prevent duplicate friendships
    { fields: ['user_id', 'friend_id'], unique: true },
  ],
});

module.exports = Friend;
