const { Sequelize } = require('sequelize');
const dbConfig = require('./database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    dialectOptions: config.dialectOptions,
    logging: config.logging
  }
);

module.exports = sequelize;