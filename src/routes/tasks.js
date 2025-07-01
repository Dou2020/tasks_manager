const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { ensureAuth } = require('../middlewares/auth');
const { isProjectMember } = require('../middlewares/projectMiddleware');
const { canAccessTask } = require('../middlewares/taskMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(ensureAuth);

// Rutas para tareas dentro de proyectos
// Esta es la ruta que está siendo buscada por el frontend
router.get('/projects/:projectId/tasks', isProjectMember, taskController.getProjectTasks);
router.post('/projects/:projectId/tasks', isProjectMember, taskController.createTask);

// Rutas para tareas individuales
router.get('/tasks/:id', canAccessTask, taskController.getTaskById);
router.put('/tasks/:id', canAccessTask, taskController.updateTask);
router.patch('/tasks/:id/status', canAccessTask, taskController.updateTaskStatus);
router.delete('/tasks/:id', canAccessTask, taskController.deleteTask);

// Rutas para comentarios
router.post('/tasks/:id/comments', canAccessTask, taskController.addComment);
router.get('/tasks/:id/comments', canAccessTask, taskController.getTaskComments);

module.exports = router;
