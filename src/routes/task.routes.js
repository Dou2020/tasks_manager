// src/routes/task.routes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  validateCreateTask,
  validateUpdateTask,
  validateTaskId,
  validateTaskFilters,
  validateUpcomingDays
} = require('../validators/task.validator');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Rutas para obtener datos de referencia (no requieren validación especial)
router.get('/categories', taskController.getCategories);
router.get('/priorities', taskController.getPriorities);
router.get('/statuses', taskController.getTaskStatuses);

// Rutas para estadísticas y reportes
router.get('/stats', taskController.getUserStats);
router.get('/upcoming', validateUpcomingDays, taskController.getUpcomingTasks);

// CRUD de tareas
router.get('/', validateTaskFilters, taskController.getTasks);
router.get('/:id', validateTaskId, taskController.getTaskById);
router.post('/', validateCreateTask, taskController.createTask);
router.put('/:id', validateTaskId, validateUpdateTask, taskController.updateTask);
router.delete('/:id', validateTaskId, taskController.deleteTask);

// Rutas específicas para archivado
router.patch('/:id/archive', validateTaskId, taskController.archiveTask);
router.patch('/:id/unarchive', validateTaskId, taskController.unarchiveTask);

module.exports = router;