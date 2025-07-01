const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuth } = require('../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas de usuario
router.use(ensureAuth);

// Rutas de perfil
router.get('/profile', userController.showProfile);
router.post('/profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);

module.exports = router;
