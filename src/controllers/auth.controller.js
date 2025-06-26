// src/controllers/auth.controller.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Registro de usuario
const register = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name } = req.body;

    // Crear nuevo usuario
    const user = await User.create({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password_hash: password, // Se hasheará automáticamente por el hook
      first_name: first_name?.trim(),
      last_name: last_name?.trim()
    });

    // Generar tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Guardar refresh token en la base de datos
    await user.update({ refresh_token: refreshToken });

    // Log de seguridad
    console.log(`[AUTH] New user registered: ${user.username} (${user.email})`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);

    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Manejar errores de unicidad
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return res.status(400).json({
        success: false,
        message: `El ${field === 'email' ? 'email' : 'nombre de usuario'} ya está en uso`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Buscar usuario por email o username
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier.toLowerCase().trim() },
          { username: identifier.toLowerCase().trim() }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Actualizar refresh token y last_login
    await user.update({ 
      refresh_token: refreshToken,
      last_login: new Date()
    });

    // Log de seguridad
    console.log(`[AUTH] User logged in: ${user.username} (${user.email})`);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const user = req.user; // Viene del middleware verifyRefreshToken

    // Generar nuevos tokens
    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // Actualizar refresh token en la base de datos
    await user.update({ refresh_token: newRefreshToken });

    console.log(`[AUTH] Token refreshed for user: ${user.username}`);

    res.json({
      success: true,
      message: 'Token renovado exitosamente',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    console.error('Error en refresh token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const user = req.user; // Viene del middleware authenticateToken

    // Limpiar refresh token
    await user.update({ refresh_token: null });

    console.log(`[AUTH] User logged out: ${user.username}`);

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    const user = req.user; // Viene del middleware authenticateToken

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar estado del token
const verifyToken = async (req, res) => {
  try {
    const user = req.user; // Viene del middleware authenticateToken

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user: user.toJSON(),
        tokenValid: true
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  verifyToken
};