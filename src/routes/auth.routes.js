// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

// Importar controladores y middlewares
const authController = require('../controllers/auth.controller');
const { authenticateToken, verifyRefreshToken } = require('../middleware/auth.middleware');
const { 
  authLimiter, 
  sanitizeInput, 
  securityLogger,
  antibruteforce 
} = require('../middleware/security.middleware');
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  handleValidationErrors
} = require('../validators/auth.validator');

// Aplicar middlewares de seguridad a todas las rutas
router.use(securityLogger);
router.use(sanitizeInput);

// Rutas públicas (con rate limiting)
router.post('/register', 
  authLimiter,
  registerValidation,
  handleValidationErrors,
  authController.register
);

router.post('/login',
  authLimiter,
  antibruteforce,
  loginValidation,
  handleValidationErrors,
  authController.login
);

router.post('/refresh-token',
  authLimiter,
  refreshTokenValidation,
  handleValidationErrors,
  verifyRefreshToken,
  authController.refreshToken
);

// Rutas protegidas (requieren autenticación)
router.post('/logout',
  authenticateToken,
  authController.logout
);

router.get('/profile',
  authenticateToken,
  authController.getProfile
);

router.get('/verify-token',
  authenticateToken,
  authController.verifyToken
);

// Ruta para validar el estado del servidor de autenticación
router.get('/health',
  (req, res) => {
    res.json({
      success: true,
      message: 'Servidor de autenticación funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  }
);

module.exports = router;