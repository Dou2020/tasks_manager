// src/routes/protected.routes.js
const express = require('express');
const router = express.Router();

// Importar middlewares
const { authenticateToken } = require('../middleware/auth.middleware');
const { sanitizeInput, securityLogger } = require('../middleware/security.middleware');

// Aplicar middlewares de seguridad y autenticación a todas las rutas
router.use(securityLogger);
router.use(sanitizeInput);
router.use(authenticateToken);

// Ruta de prueba para verificar autenticación
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Acceso autorizado a ruta protegida',
    data: {
      user: req.user.toJSON(),
      timestamp: new Date().toISOString()
    }
  });
});

// Ruta para obtener estadísticas del usuario
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    message: 'Estadísticas del usuario',
    data: {
      user_id: req.user.user_id,
      username: req.user.username,
      member_since: req.user.created_at,
      last_login: req.user.last_login,
      // Aquí se pueden agregar más estadísticas cuando implementes las tareas
      total_tasks: 0,
      completed_tasks: 0,
      pending_tasks: 0
    }
  });
});

// Ruta para actualizar perfil básico
router.put('/profile', async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    const user = req.user;

    // Validar datos de entrada
    const updateData = {};
    if (first_name !== undefined) {
      if (first_name.trim().length < 2 || first_name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'El nombre debe tener entre 2 y 50 caracteres'
        });
      }
      updateData.first_name = first_name.trim();
    }

    if (last_name !== undefined) {
      if (last_name.trim().length < 2 || last_name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'El apellido debe tener entre 2 y 50 caracteres'
        });
      }
      updateData.last_name = last_name.trim();
    }

    // Actualizar usuario
    await user.update(updateData);

    console.log(`[AUTH] Profile updated for user: ${user.username}`);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;