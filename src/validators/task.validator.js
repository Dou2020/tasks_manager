// src/validators/task.validator.js
const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Validaciones para crear tarea
const validateCreateTask = [
  body('title')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 1, max: 200 })
    .withMessage('El título debe tener entre 1 y 200 caracteres')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('La descripción no puede exceder 5000 caracteres')
    .trim(),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de categoría debe ser un número entero positivo'),
  
  body('priority_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de prioridad debe ser un número entero positivo'),
  
  body('status_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de estado debe ser un número entero positivo'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('La fecha de vencimiento debe ser válida (formato ISO 8601)')
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error('La fecha de vencimiento no puede ser en el pasado');
      }
      return true;
    }),
  
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida (formato ISO 8601)'),
  
  body('estimated_hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Las horas estimadas deben ser un número positivo'),
  
  body('actual_hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Las horas reales deben ser un número positivo'),
  
  body('progress_percentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('El porcentaje de progreso debe ser entre 0 y 100'),
  
  body('tags')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Los tags no pueden exceder 500 caracteres'),
  
  body('notes')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Las notas no pueden exceder 5000 caracteres')
    .trim(),
  
  handleValidationErrors
];

// Validaciones para actualizar tarea
const validateUpdateTask = [
  body('title')
    .optional()
    .notEmpty()
    .withMessage('El título no puede estar vacío')
    .isLength({ min: 1, max: 200 })
    .withMessage('El título debe tener entre 1 y 200 caracteres')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('La descripción no puede exceder 5000 caracteres')
    .trim(),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de categoría debe ser un número entero positivo'),
  
  body('priority_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de prioridad debe ser un número entero positivo'),
  
  body('status_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de estado debe ser un número entero positivo'),
  
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('La fecha de vencimiento debe ser válida (formato ISO 8601)'),
  
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida (formato ISO 8601)'),
  
  body('estimated_hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Las horas estimadas deben ser un número positivo'),
  
  body('actual_hours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Las horas reales deben ser un número positivo'),
  
  body('progress_percentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('El porcentaje de progreso debe ser entre 0 y 100'),
  
  body('tags')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Los tags no pueden exceder 500 caracteres'),
  
  body('notes')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Las notas no pueden exceder 5000 caracteres')
    .trim(),
  
  body('is_archived')
    .optional()
    .isBoolean()
    .withMessage('is_archived debe ser un valor booleano'),
  
  handleValidationErrors
];

// Validación para parámetros de ID
const validateTaskId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID de la tarea debe ser un número entero positivo'),
  
  handleValidationErrors
];

// Validaciones para query parameters de filtros
const validateTaskFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser entre 1 y 100'),
  
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de categoría debe ser un número entero positivo'),
  
  query('priority_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de prioridad debe ser un número entero positivo'),
  
  query('status_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID de estado debe ser un número entero positivo'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('El término de búsqueda debe tener entre 1 y 200 caracteres')
    .trim(),
  
  query('tags')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Los tags deben tener entre 1 y 100 caracteres')
    .trim(),
  
  query('is_archived')
    .optional()
    .isBoolean()
    .withMessage('is_archived debe ser un valor booleano'),
  
  query('due_date_from')
    .optional()
    .isISO8601()
    .withMessage('due_date_from debe ser una fecha válida (formato ISO 8601)'),
  
  query('due_date_to')
    .optional()
    .isISO8601()
    .withMessage('due_date_to debe ser una fecha válida (formato ISO 8601)'),
  
  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at', 'title', 'due_date', 'priority_id', 'status_id'])
    .withMessage('sortBy debe ser uno de: created_at, updated_at, title, due_date, priority_id, status_id'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sortOrder debe ser ASC o DESC'),
  
  handleValidationErrors
];

// Validación para días en upcoming tasks
const validateUpcomingDays = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Los días deben ser entre 1 y 365'),
  
  handleValidationErrors
];

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateTaskId,
  validateTaskFilters,
  validateUpcomingDays,
  handleValidationErrors
};