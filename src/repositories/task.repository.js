// src/repositories/task.repository.js
const { Task, Category, Priority, TaskStatus, User } = require('../models');
const { Op } = require('sequelize');

class TaskRepository {
  
  // Obtener todas las tareas con filtros y paginación
  async findAll(filters = {}, pagination = {}) {
    const {
      user_id,
      category_id,
      priority_id,
      status_id,
      search,
      tags,
      is_archived,
      due_date_from,
      due_date_to
    } = filters;

    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = pagination;

    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const whereConditions = {};

    if (user_id) whereConditions.user_id = user_id;
    if (category_id) whereConditions.category_id = category_id;
    if (priority_id) whereConditions.priority_id = priority_id;
    if (status_id) whereConditions.status_id = status_id;
    if (typeof is_archived === 'boolean') whereConditions.is_archived = is_archived;

    // Búsqueda por texto
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtro por tags
    if (tags) {
      whereConditions.tags = { [Op.like]: `%${tags}%` };
    }

    // Filtro por fechas de vencimiento
    if (due_date_from || due_date_to) {
      whereConditions.due_date = {};
      if (due_date_from) whereConditions.due_date[Op.gte] = new Date(due_date_from);
      if (due_date_to) whereConditions.due_date[Op.lte] = new Date(due_date_to);
    }

    const { count, rows } = await Task.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['category_id', 'name', 'color_hex', 'icon']
        },
        {
          model: Priority,
          as: 'priority',
          attributes: ['priority_id', 'name', 'level_number', 'color_hex']
        },
        {
          model: TaskStatus,
          as: 'status',
          attributes: ['status_id', 'name', 'color_hex', 'is_final']
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'username', 'first_name', 'last_name']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      distinct: true
    });

    return {
      tasks: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    };
  }

  // Obtener tarea por ID
  async findById(taskId, userId = null) {
    const whereCondition = { task_id: taskId };
    if (userId) whereCondition.user_id = userId;

    return await Task.findOne({
      where: whereCondition,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['category_id', 'name', 'color_hex', 'icon']
        },
        {
          model: Priority,
          as: 'priority',
          attributes: ['priority_id', 'name', 'level_number', 'color_hex']
        },
        {
          model: TaskStatus,
          as: 'status',
          attributes: ['status_id', 'name', 'color_hex', 'is_final']
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'username', 'first_name', 'last_name']
        }
      ]
    });
  }

  // Crear nueva tarea
  async create(taskData) {
    return await Task.create(taskData);
  }

  // Actualizar tarea
  async update(taskId, taskData, userId = null) {
    const whereCondition = { task_id: taskId };
    if (userId) whereCondition.user_id = userId;

    const [updatedRows] = await Task.update(taskData, {
      where: whereCondition
    });

    if (updatedRows > 0) {
      return await this.findById(taskId, userId);
    }
    return null;
  }

  // Eliminar tarea
  async delete(taskId, userId = null) {
    const whereCondition = { task_id: taskId };
    if (userId) whereCondition.user_id = userId;

    return await Task.destroy({
      where: whereCondition
    });
  }

  // Obtener estadísticas del usuario
  async getUserStats(userId) {
    const stats = await Task.findAll({
      where: { user_id: userId, is_archived: false },
      include: [
        {
          model: TaskStatus,
          as: 'status',
          attributes: ['name']
        },
        {
          model: Priority,
          as: 'priority',
          attributes: ['name', 'level_number']
        }
      ],
      attributes: ['status_id', 'priority_id']
    });

    // Agrupar por estado
    const statusStats = {};
    const priorityStats = {};
    
    stats.forEach(task => {
      const statusName = task.status?.name || 'Sin estado';
      const priorityName = task.priority?.name || 'Sin prioridad';
      
      statusStats[statusName] = (statusStats[statusName] || 0) + 1;
      priorityStats[priorityName] = (priorityStats[priorityName] || 0) + 1;
    });

    return {
      total: stats.length,
      byStatus: statusStats,
      byPriority: priorityStats
    };
  }

  // Obtener tareas próximas a vencer
  async getUpcomingTasks(userId, days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await Task.findAll({
      where: {
        user_id: userId,
        due_date: {
          [Op.between]: [new Date(), futureDate]
        },
        is_archived: false,
        status_id: { [Op.not]: 3 } // No completadas
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name', 'color_hex']
        },
        {
          model: Priority,
          as: 'priority',
          attributes: ['name', 'level_number', 'color_hex']
        }
      ],
      order: [['due_date', 'ASC']]
    });
  }
}

module.exports = new TaskRepository();