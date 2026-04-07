// ============================================
// DATABASE SYNC SCRIPT
// Run: node scripts/syncDb.js
// Forces table recreation (CAUTION: drops data!)
// ============================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, testConnection } = require('../config/database');
require('../models');

const syncDatabase = async () => {
  try {
    await testConnection();

    console.log('⚠️  Syncing database (force mode - will recreate tables)...');
    await sequelize.sync({ force: true });

    console.log('✅ All tables created successfully!');
    console.log('📋 Tables: users, posts, comments, likes, friend_requests, friends, notifications');

    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
};

syncDatabase();
