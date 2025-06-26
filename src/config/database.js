// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la base de datos
const sequelize = new Sequelize({
  dialect: 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 1433,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  dialectOptions: {
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true' || false,
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || true,
      enableArithAbort: true,
      connectionTimeout: 60000,
      requestTimeout: 60000,
    },
  },
  
  pool: {
    max: 10,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  define: {
    timestamps: false,
    freezeTableName: true,
  },
  
  retry: {
    max: 3,
  },
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

// Función para sincronizar modelos (solo en desarrollo)
const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // En desarrollo, verificar que las tablas existan
      await sequelize.sync({ alter: false });
      console.log('✅ Modelos sincronizados con la base de datos');
    }
  } catch (error) {
    console.error('❌ Error sincronizando la base de datos:', error.message);
    throw error;
  }
};

// Función para cerrar la conexión
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('🔌 Conexión a la base de datos cerrada');
  } catch (error) {
    console.error('❌ Error cerrando la conexión:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection
};