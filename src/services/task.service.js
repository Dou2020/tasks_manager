// src/services/task.service.js
const taskRepository = require('../repositories/task.repository');
const { Category, Priority, TaskStatus } = require('../models');

class TaskService {

  // Obtener todas las tareas con filtros
  async getAllTasks(userId, filters = {}, pagination = {}) {
    try {
      // Agregar user_id a los filtros para seguridad
      const secureFilters = { ...filters, user_id: userId };
      
      return await taskRepository.findAll(secureFilters, pagination);
    } catch (error) {
      throw new Error(`Error al obtener tareas: ${error.message}`);
    }
  }

  // Obtener tarea por ID
  async getTaskById(taskId, userId) {
    try {
      const task = await taskRepository.findById(taskId, userId);
      
      if (!task) {
        throw new Error('Tarea no encontrada');
      }

      return task;
    } catch (error) {
      throw new Error(`Error al obtener tarea: ${error.message}`);
    }
  }

  // Crear nueva tarea
  async createTask(taskData, userId) {
    try {
      // Validar datos requeridos
      if (!taskData.title || taskData.title.trim().length === 0) {
        throw new Error('El título es requerido');
      }

      // Validar que la categoría existe y está activa (si se proporciona)
      if (taskData.category_id) {
        const category = await Category.findOne({
          where: { category_id: taskData.category_id, is_active: true }
        });
        if (!category) {
          throw new Error('Categoría no válida');
        }
      }

      // Validar que la prioridad existe (si se proporciona)
      if (taskData.priority_id) {
        const priority = await Priority.findByPk(taskData.priority_id);
        if (!priority) {
          throw new Error('Prioridad no válida');
        }
      }

      // Validar que el estado existe (si se proporciona)
      if (taskData.status_id) {
        const status = await TaskStatus.findByPk(taskData.status_id);
        if (!status) {
          throw new Error('Estado no válido');
        }
      }

      // Preparar datos para creación
      const newTaskData = {
        ...taskData,
        user_id: userId,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || null,
        notes: taskData.notes?.trim() || null
      };

      // Validar fechas
      if (taskData.due_date) {
        const dueDate = new Date(taskData.due_date);
        if (isNaN(dueDate.getTime())) {
          throw new Error('Fecha de vencimiento no válida');
        }
        newTaskData.due_date = dueDate;
      }

      if (taskData.start_date) {
        const startDate = new Date(taskData.start_date);
        if (isNaN(startDate.getTime())) {
          throw new Error('Fecha de inicio no válida');
        }
        newTaskData.start_date = startDate;
      }

      // Crear tarea
      const createdTask = await taskRepository.create(newTaskData);
      
      // Retornar tarea completa con relaciones
      return await this.getTaskById(createdTask.task_id, userId);
    } catch (error) {
      throw new Error(`Error al crear tarea: ${error.message}`);
    }
  }

  // Actualizar tarea
  async updateTask(taskId, taskData, userId) {
    try {
      // Verificar que la tarea existe
      const existingTask = await this.getTaskById(taskId, userId);

      // Validar datos si se proporcionan
      if (taskData.category_id) {
        const category = await Category.findOne({
          where: { category_id: taskData.category_id, is_active: true }
        });
        if (!category) {
          throw new Error('Categoría no válida');
        }
      }

      if (taskData.priority_id) {
        const priority = await Priority.findByPk(taskData.priority_id);
        if (!priority) {
          throw new Error('Prioridad no válida');
        }
      }

      if (taskData.status_id) {
        const status = await TaskStatus.findByPk(taskData.status_id);
        if (!status) {
          throw new Error('Estado no válido');
        }
      }

      // Preparar datos para actualización
      const updateData = { ...taskData };
      
      if (taskData.title) {
        updateData.title = taskData.title.trim();
        if (updateData.title.length === 0) {
          throw new Error('El título no puede estar vacío');
        }
      }

      if (taskData.description !== undefined) {
        updateData.description = taskData.description?.trim() || null;
      }

      if (taskData.notes !== undefined) {
        updateData.notes = taskData.notes?.trim() || null;
      }

      // Validar fechas
      if (taskData.due_date) {
        const dueDate = new Date(taskData.due_date);
        if (isNaN(dueDate.getTime())) {
          throw new Error('Fecha de vencimiento no válida');
        }
        updateData.due_date = dueDate;
      }

      if (taskData.start_date) {
        const startDate = new Date(taskData.start_date);
        if (isNaN(startDate.getTime())) {
          throw new Error('Fecha de inicio no válida');
        }
        updateData.start_date = startDate;
      }

      // Actualizar tarea
      const updatedTask = await taskRepository.update(taskId, updateData, userId);
      
      if (!updatedTask) {
        throw new Error('No se pudo actualizar la tarea');
      }

      return updatedTask;
    } catch (error) {
      throw new Error(`Error al actualizar tarea: ${error.message}`);
    }
  }

  // Eliminar tarea
  async deleteTask(taskId, userId) {
    try {
      // Verificar que la tarea existe
      await this.getTaskById(taskId, userId);

      const deleted = await taskRepository.delete(taskId, userId);
      
      if (deleted === 0) {
        throw new Error('No se pudo eliminar la tarea');
      }

      return { success: true, message: 'Tarea eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error al eliminar tarea: ${error.message}`);
    }
  }

  // Archivar tarea
  async archiveTask(taskId, userId) {
    try {
      return await this.updateTask(taskId, { is_archived: true }, userId);
    } catch (error) {
      throw new Error(`Error al archivar tarea: ${error.message}`);
    }
  }

  // Desarchivar tarea
  async unarchiveTask(taskId, userId) {
    try {
      return await this.updateTask(taskId, { is_archived: false }, userId);
    } catch (error) {
      throw new Error(`Error al desarchivar tarea: ${error.message}`);
    }
  }

  // Obtener estadísticas del usuario
  async getUserTaskStats(userId) {
    try {
      return await taskRepository.getUserStats(userId);
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Obtener tareas próximas a vencer
  async getUpcomingTasks(userId, days = 7) {
    try {
      return await taskRepository.getUpcomingTasks(userId, days);
    } catch (error) {
      throw new Error(`Error al obtener tareas próximas: ${error.message}`);
    }
  }

  // Obtener categorías activas
  async getActiveCategories() {
    try {
      return await Category.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }

  // Obtener prioridades
  async getPriorities() {
    try {
      return await Priority.findAll({
        order: [['level_number', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Error al obtener prioridades: ${error.message}`);
    }
  }

  // Obtener estados de tarea
  async getTaskStatuses() {
    try {
      return await TaskStatus.findAll({
        order: [['status_id', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Error al obtener estados: ${error.message}`);
    }
  }
}

module.exports = new TaskService();