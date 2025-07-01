require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  process.env.DB_DIALECT || 'mssql',
    logging:  process.env.DB_LOGGING === 'true',
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    // misma configuración o variables distintas
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  process.env.DB_DIALECT || 'mssql',
    logging:  false,
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true
      }
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 20000
    }
  }
};