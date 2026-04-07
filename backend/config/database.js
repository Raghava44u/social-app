// ============================================
// DATABASE CONFIGURATION
// Connects to MySQL using Sequelize ORM
// All credentials loaded from .env file
// ============================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance with MySQL connection
const sequelize = new Sequelize(
  process.env.DB_NAME,       // Database name
  process.env.DB_USER,       // Username
  process.env.DB_PASSWORD,   // Password
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,           // Set to console.log for SQL debugging
    pool: {
      max: 10,               // Max number of connections in pool
      min: 0,
      acquire: 30000,        // Max time (ms) to get connection
      idle: 10000            // Max time (ms) connection can be idle
    },
    define: {
      timestamps: true,       // Adds createdAt & updatedAt to all models
      underscored: true,      // Uses snake_case for auto-generated fields
    }
  }
);

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
