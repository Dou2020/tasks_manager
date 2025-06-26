// src/index.js
require('dotenv').config();

const { createServer } = require('./config/server');
const { testConnection, syncDatabase, closeConnection } = require('./config/database');

// Importar modelos para registrarlos
require('./models/User');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Función principal para iniciar la aplicación
const startServer = async () => {
  try {
    console.log(`🚀 Iniciando servidor en modo ${NODE_ENV}...`);

    // Verificar variables de entorno críticas
    const requiredEnvVars = [
      'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
      'JWT_SECRET', 'JWT_REFRESH_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
      console.error('💡 Revisa tu archivo .env');
      process.exit(1);
    }

    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Sincronizar modelos con la base de datos
    await syncDatabase();

    // Crear y configurar el servidor
    const app = createServer();

    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      console.log(`🌟 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌐 URL local: http://localhost:${PORT}`);
      console.log(`🔒 Modo: ${NODE_ENV}`);
      console.log(`📊 API Health: http://localhost:${PORT}/health`);
      
      if (NODE_ENV === 'development') {
        console.log(`🔐 Rutas de autenticación disponibles:`);
        console.log(`   POST /api/auth/register - Registro de usuarios`);
        console.log(`   POST /api/auth/login - Inicio de sesión`);
        console.log(`   POST /api/auth/logout - Cerrar sesión`);
        console.log(`   POST /api/auth/refresh-token - Renovar token`);
        console.log(`   GET  /api/auth/profile - Perfil del usuario`);
        console.log(`   GET  /api/protected/test - Ruta protegida de prueba`);
      }
    });

    // Manejo de señales para cierre limpio
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor...`);
      
      server.close(async () => {
        console.log('🔌 Servidor HTTP cerrado');
        await closeConnection();
        console.log('👋 Proceso terminado correctamente');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️  Forzando cierre del proceso...');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales del sistema
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa no manejada rechazada:', reason);
      console.error('En:', promise);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Excepción no capturada:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error fatal iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar la aplicación
startServer();