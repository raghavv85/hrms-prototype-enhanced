/**
 * Database Configuration Switcher
 * 
 * This module determines which database implementation to use based on environment variables.
 * It allows switching between the in-memory database and PostgreSQL.
 */

require('dotenv').config();

// Determine which database to use based on environment variable
const usePostgres = process.env.ENABLE_POSTGRES === 'true';

let database;

if (usePostgres) {
  try {
    // Use PostgreSQL database
    console.log('Using PostgreSQL database');
    database = require('./database-pg');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error.message);
    console.log('Falling back to in-memory database');
    database = require('./database');
  }
} else {
  // Use in-memory database
  console.log('Using in-memory database');
  database = require('./database');
}

module.exports = database;
