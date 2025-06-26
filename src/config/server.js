// src/config/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar middlewares de seguridad
const { 
  helmetConfig, 
  corsOptions, 
  generalLimiter,
  xss,
  hpp 
} = require('../middleware/security.middleware');

// Importar rutas
const authRoutes = require('../routes/auth.routes');
const protectedRoutes = require('../routes/protected.routes');
const taskRoutes = require('../routes/task.routes');

const createServer = () => {
  const app = express();

  // Configurar proxy trust para obtener IPs reales
  app.set('trust proxy', 1);

  // Middlewares de seguridad básicos
  app.use(helmetConfig);
  app.use(cors(corsOptions));
  app.use(generalLimiter);

  // Middlewares para parsing de datos
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Middlewares de limpieza y sanitización
  app.use(xss);
  app.use(hpp);

  // Servir archivos estáticos
  app.use(express.static(path.join(__dirname, '../public')));

  // Middleware de logging para desarrollo
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
      next();
    });
  }

  // Rutas de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/protected', protectedRoutes);
  app.use('/api/tasks', taskRoutes);

  // Ruta raíz - servir página principal
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // Ruta de health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Manejo de rutas no encontradas
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Ruta no encontrada',
      path: req.originalUrl
    });
  });

  // Middleware global de manejo de errores
  app.use((error, req, res, next) => {
    console.error('Error global:', error);

    // Error de validación JSON
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({
        success: false,
        message: 'JSON inválido en el cuerpo de la solicitud'
      });
    }

    // Error de payload demasiado grande
    if (error.type === 'entity.too.large') {
      return res.status(413).json({
        success: false,
        message: 'Payload demasiado grande'
      });
    }

    // Error genérico
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  });

  return app;
};

module.exports = { createServer };