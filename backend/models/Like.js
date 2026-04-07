// ============================================
// LIKE MODEL
// Tracks which users liked which posts
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'post_id',
    references: {
      model: 'posts',
      key: 'id',
    },
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
}, {
  tableName: 'likes',
  indexes: [
    // Prevent duplicate likes (one like per user per post)
    { fields: ['post_id', 'user_id'], unique: true },
  ],
});

module.exports = Like;
