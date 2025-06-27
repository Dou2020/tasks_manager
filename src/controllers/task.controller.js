// src/controllers/task.controller.js
const taskService = require('../services/task.service');

// Obtener todas las tareas del usuario
const getTasks = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const filters = {
      category_id: req.query.category_id,
      priority_id: req.query.priority_id,
      status_id: req.query.status_id,
      search: req.query.search,
      tags: req.query.tags,
      is_archived: req.query.is_archived === 'true' ? true : req.query.is_archived === 'false' ? false : undefined,
      due_date_from: req.query.due_date_from,
      due_date_to: req.query.due_date_to
    };

    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC'
    };

    const result = await taskService.getAllTasks(userId, filters, pagination);

    res.json({
      success: true,
      message: 'Tareas obtenidas exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Obtener tarea por ID
const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.user_id;

    const task = await taskService.getTaskById(taskId, userId);

    res.json({
      success: true,
      message: 'Tarea obtenida exitosamente',
      data: { task }
    });
  } catch (error) {
    console.error('Error obteniendo tarea:', error);
    
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Crear nueva tarea
const createTask = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const taskData = req.body;

    const newTask = await taskService.createTask(taskData, userId);

    console.log(`[TASK] Nueva tarea creada: ${newTask.title} por usuario ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: { task: newTask }
    });
  } catch (error) {
    console.error('Error creando tarea:', error);
    
    if (error.message.includes('requerido') || error.message.includes('válida')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Actualizar tarea
const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.user_id;
    const taskData = req.body;

    const updatedTask = await taskService.updateTask(taskId, taskData, userId);

    console.log(`[TASK] Tarea actualizada: ${updatedTask.title} por usuario ${req.user.username}`);

    res.json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error('Error actualizando tarea:', error);
    
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('válida') || error.message.includes('vacío')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Eliminar tarea
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.user_id;

    const result = await taskService.deleteTask(taskId, userId);

    console.log(`[TASK] Tarea eliminada: ID ${taskId} por usuario ${req.user.username}`);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error eliminando tarea:', error);
    
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Archivar tarea
const archiveTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.user_id;

    const archivedTask = await taskService.archiveTask(taskId, userId);

    console.log(`[TASK] Tarea archivada: ${archivedTask.title} por usuario ${req.user.username}`);

    res.json({
      success: true,
      message: 'Tarea archivada exitosamente',
      data: { task: archivedTask }
    });
  } catch (error) {
    console.error('Error archivando tarea:', error);
    
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Desarchivar tarea
const unarchiveTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.user_id;

    const unarchivedTask = await taskService.unarchiveTask(taskId, userId);

    console.log(`[TASK] Tarea desarchivada: ${unarchivedTask.title} por usuario ${req.user.username}`);

    res.json({
      success: true,
      message: 'Tarea desarchivada exitosamente',
      data: { task: unarchivedTask }
    });
  } catch (error) {
    console.error('Error desarchivando tarea:', error);
    
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas del usuario
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const stats = await taskService.getUserTaskStats(userId);

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: { stats }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Obtener tareas próximas a vencer
const getUpcomingTasks = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const days = req.query.days || 7;

    const upcomingTasks = await taskService.getUpcomingTasks(userId, parseInt(days));

    res.json({
      success: true,
      message: 'Tareas próximas obtenidas exitosamente',
      data: { 
        tasks: upcomingTasks,
        days: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Error obteniendo tareas próximas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Obtener categorías activas
const getCategories = async (req, res) => {
  try {
    const categories = await taskService.getActiveCategories();

    res.json({
      success: true,
      message: 'Categorías obtenidas exitosamente',
      data: { categories }
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Obtener prioridades
const getPriorities = async (req, res) => {
  try {
    const priorities = await taskService.getPriorities();

    res.json({
      success: true,
      message: 'Prioridades obtenidas exitosamente',
      data: { priorities }
    });
  } catch (error) {
    console.error('Error obteniendo prioridades:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Obtener estados de tarea
const getTaskStatuses = async (req, res) => {
  try {
    const statuses = await taskService.getTaskStatuses();

    res.json({
      success: true,
      message: 'Estados obtenidos exitosamente',
      data: { statuses }
    });
  } catch (error) {
    console.error('Error obteniendo estados:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  archiveTask,
  unarchiveTask,
  getUserStats,
  getUpcomingTasks,
  getCategories,
  getPriorities,
  getTaskStatuses
};