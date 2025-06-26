// src/validators/auth.validator.js
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Validaciones para registro
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .isAlphanumeric()
    .withMessage('El nombre de usuario solo puede contener letras y números')
    .custom(async (value) => {
      const user = await User.findByUsername(value);
      if (user) {
        throw new Error('El nombre de usuario ya está en uso');
      }
      return true;
    }),
  
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres')
    .custom(async (value) => {
      const user = await User.findByEmail(value);
      if (user) {
        throw new Error('El email ya está registrado');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('La contraseña debe tener entre 6 y 50 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
  
  
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras'),
  
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras')
];

// Validaciones para login
const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Debe proporcionar un email o nombre de usuario')
    .isLength({ min: 3, max: 100 })
    .withMessage('El identificador debe tener entre 3 y 100 caracteres'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6, max: 50 })
    .withMessage('La contraseña debe tener entre 6 y 50 caracteres')
];

// Validación para refresh token
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('El refresh token es requerido')
    .isJWT()
    .withMessage('El refresh token debe ser un JWT válido')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  handleValidationErrors
};