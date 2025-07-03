// Set environment variable before requiring any other files
process.env.NODE_ENV = 'test';

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

const { sequelize } = require('../src/models');

// Aumentar el tiempo de espera para las pruebas
jest.setTimeout(15000);

// Configurar el entorno de prueba
beforeAll(async () => {
  try {
    // Sincronizar la base de datos de prueba (forzar reconstrucción)
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos de prueba sincronizada');
  } catch (error) {
    console.error('❌ Error sincronizando base de datos de prueba:', error);
  }
});

// Limpiar después de todas las pruebas
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('✅ Conexión a base de datos cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar conexión:', error);
  }
});
