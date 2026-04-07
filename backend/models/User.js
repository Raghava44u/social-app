// ============================================
// USER MODEL
// Stores user account information
// ============================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],           // Min 3, max 50 characters
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,          // Must be valid email format
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255],          // Min 6 characters
    },
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'first_name',
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'last_name',
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
  },
  profileImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: '',
    field: 'profile_image',
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: '',
    field: 'cover_image',
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_online',
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_seen',
  },
}, {
  tableName: 'users',
  hooks: {
    // Hash password before saving to database
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash password before updating (if changed)
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
  ],
});

// Instance method to check password
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to return safe user data (no password)
User.prototype.toSafeJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
