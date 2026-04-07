// ============================================
// AUTH CONTROLLER
// Handles user registration and login
// ============================================

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Generate JWT token for a user
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }  // Token valid for 7 days
  );
};

// ---- REGISTER ----
// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Check if username is taken
    const existingUsername = await User.findOne({
      where: { username },
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken.',
      });
    }

    // Create new user (password is hashed by the model hook)
    const user = await User.create({
      username,
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        token,
        user: user.toSafeJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---- LOGIN ----
// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update online status
    await user.update({ isOnline: true, lastSeen: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        token,
        user: user.toSafeJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---- GET CURRENT USER ----
// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { user: req.user.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// ---- LOGOUT ----
// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await req.user.update({ isOnline: false, lastSeen: new Date() });

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, logout };
