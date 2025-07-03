const { Sequelize } = require('sequelize');
// const path = require('path');

// Get environment-specific config
let config;

// Check if we're in test environment
if (process.env.NODE_ENV === 'test') {
  // Use SQLite for testing
  config = {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  };
} else {
  // Use regular database configuration for development/production
  config = {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mssql',
    logging: process.env.DB_LOGGING === 'true',
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true
      }
    }
  };
}

// Create Sequelize instance based on environment
let sequelize;

if (process.env.NODE_ENV === 'test') {
  // For test environment, use the config object directly
  sequelize = new Sequelize({
    dialect: config.dialect,
    storage: config.storage,
    logging: config.logging
  });
} else {
  // For development/production, use the regular configuration
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging,
      dialectOptions: config.dialectOptions,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;