// src/routes/task.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { sanitizeInput, securityLogger } = require('../middleware/security.middleware');

// Aplicar middlewares de seguridad y autenticación a todas las rutas
router.use(securityLogger);
router.use(sanitizeInput);
router.use(authenticateToken);

// Ruta temporal para verificar que funciona
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API de tareas funcionando correctamente',
    user: req.user.toJSON()
  });
});

// Aquí implementarás las rutas para CRUD de tareas después

module.exports = router;