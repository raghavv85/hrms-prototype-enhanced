const { Sequelize } = require('sequelize');
require('dotenv').config();

const usePostgres = process.env.ENABLE_POSTGRES === 'true';

// Database configuration
const config = {
  development: usePostgres ? {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'hrms_enhanced',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  } : {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  },
  production: usePostgres ? {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  } : {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = usePostgres ? new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions || {}
  }
) : new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: dbConfig.logging
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ ${usePostgres ? 'PostgreSQL' : 'SQLite (in-memory)'} database connection established successfully.`);
    return true;
  } catch (error) {
    console.error(`❌ Unable to connect to ${usePostgres ? 'PostgreSQL' : 'SQLite'} database:`, error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  config
};
