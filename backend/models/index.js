// ============================================
// MODEL INDEX - ASSOCIATIONS
// Central file that sets up all model relationships
// ============================================

const User = require('./User');
const Post = require('./Post');
const Comment = require('./Comment');
const Like = require('./Like');
const FriendRequest = require('./FriendRequest');
const Friend = require('./Friend');
const Notification = require('./Notification');

// ---- USER <-> POST ----
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// ---- POST <-> COMMENT ----
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

// ---- USER <-> COMMENT ----
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// ---- POST <-> LIKE ----
Post.hasMany(Like, { foreignKey: 'post_id', as: 'likes', onDelete: 'CASCADE' });
Like.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

// ---- USER <-> LIKE ----
User.hasMany(Like, { foreignKey: 'user_id', as: 'likes', onDelete: 'CASCADE' });
Like.belongsTo(User, { foreignKey: 'user_id', as: 'liker' });

// ---- FRIEND REQUESTS ----
User.hasMany(FriendRequest, { foreignKey: 'sender_id', as: 'sentRequests', onDelete: 'CASCADE' });
User.hasMany(FriendRequest, { foreignKey: 'receiver_id', as: 'receivedRequests', onDelete: 'CASCADE' });
FriendRequest.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
FriendRequest.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

// ---- FRIENDS ----
User.hasMany(Friend, { foreignKey: 'user_id', as: 'friends', onDelete: 'CASCADE' });
User.hasMany(Friend, { foreignKey: 'friend_id', as: 'friendOf', onDelete: 'CASCADE' });
Friend.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Friend.belongsTo(User, { foreignKey: 'friend_id', as: 'friend' });

// ---- NOTIFICATIONS ----
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
User.hasMany(Notification, { foreignKey: 'from_user_id', as: 'sentNotifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'from_user_id', as: 'sender' });

// ---- POST SHARING ----
Post.belongsTo(Post, { foreignKey: 'original_post_id', as: 'originalPost', onDelete: 'SET NULL' });
Post.hasMany(Post, { foreignKey: 'original_post_id', as: 'shares' });
Post.belongsTo(User, { foreignKey: 'shared_by', as: 'sharedByUser' });

module.exports = {
  User,
  Post,
  Comment,
  Like,
  FriendRequest,
  Friend,
  Notification,
};
