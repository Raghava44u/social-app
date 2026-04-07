// ============================================
// POST MODEL
// Stores user posts (text + optional image)
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: true,          // Can be empty if image is provided
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image_url',
  },
  // For shared/reposted posts - references the original post
  originalPostId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'original_post_id',
    references: {
      model: 'posts',
      key: 'id',
    },
  },
  // Who shared it (null if original post)
  sharedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'shared_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  shareText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'share_text',
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'likes_count',
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'comments_count',
  },
  sharesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'shares_count',
  },
}, {
  tableName: 'posts',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['created_at'] },
    { fields: ['original_post_id'] },
  ],
});

module.exports = Post;
