require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  process.env.DB_DIALECT || 'mssql',
    dialectOptions: { options: { encrypt: true } },
    logging: false
  },
  production: {
    // tu config de producción
  }
};
