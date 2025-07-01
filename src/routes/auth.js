const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuth, ensureGuest } = require('../middlewares/auth');

// Registro
router.get('/register', ensureGuest, authController.registerForm);
router.post('/register', ensureGuest, authController.registerUser);

// Login
router.get('/login', ensureGuest, authController.loginForm);
router.post('/login', ensureGuest, authController.loginUser);

// Logout
router.post('/logout', ensureAuth, authController.logout);
router.get('/logout', ensureAuth, authController.logout);

module.exports = router;