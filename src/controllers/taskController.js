const { Task, User, Comment, Project } = require('../models');

// Obtener todas las tareas de un proyecto
const getProjectTasks = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    const tasks = await Task.findAll({
      where: { projectId },
      include: [
        { 
          model: User, 
          as: 'assignee', 
          attributes: ['id', 'name', 'username'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ error: 'Error al cargar las tareas' });
  }
};

// Crear una nueva tarea
const createTask = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    
    // Validar campos requeridos
    if (!title) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    
    // Verificar que el proyecto existe
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Validar que el usuario asignado (si se proporciona) existe
    if (assignedTo) {
      const assignedUser = await User.findByPk(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ error: 'Usuario asignado no existe' });
      }
    }
    
    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      priority: priority || 'Media',
      dueDate: dueDate || null,
      status: 'Por hacer',
      createdAt: new Date()
    });
    
    // Cargar la tarea con el usuario asignado
    const taskWithDetails = await Task.findByPk(task.id, {
      include: [
        { 
          model: User, 
          as: 'assignee', 
          attributes: ['id', 'name', 'username'] 
        }
      ]
    });
    
    res.status(201).json(taskWithDetails);
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
};

// Obtener detalles de una tarea específica
const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const task = await Task.findByPk(taskId, {
      include: [
        { 
          model: User, 
          as: 'assignee', 
          attributes: ['id', 'name', 'username'] 
        },
        { 
          model: Comment, 
          as: 'comments',
          include: [
            { 
              model: User, 
              as: 'author', 
              attributes: ['id', 'name', 'username'] 
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({ error: 'Error al cargar la tarea' });
  }
};

// Actualizar una tarea
const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Validar que el usuario asignado (si se proporciona) existe
    if (assignedTo) {
      const assignedUser = await User.findByPk(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ error: 'Usuario asignado no existe' });
      }
    }
    
    // Actualizar solo los campos proporcionados
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (status) task.status = status;
    
    await task.save();
    
    // Devolver la tarea actualizada con sus relaciones
    const updatedTask = await Task.findByPk(taskId, {
      include: [
        { 
          model: User, 
          as: 'assignee', 
          attributes: ['id', 'name', 'username'] 
        }
      ]
    });
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
};

// Actualizar solo el estado de una tarea
const updateTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    
    if (!status || !['Por hacer', 'En progreso', 'Completado'].includes(status)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    task.status = status;
    await task.save();
    
    res.json({ id: task.id, status: task.status });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar el estado de la tarea' });
  }
};

// Eliminar una tarea
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    await task.destroy();
    
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
};

// Agregar un comentario a una tarea
const addComment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { content } = req.body;
    const userId = req.session.userId;
    
    // Validar campos
    if (!content) {
      return res.status(400).json({ error: 'El contenido del comentario es obligatorio' });
    }
    
    // Verificar que la tarea existe
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    const comment = await Comment.create({
      taskId,
      userId,
      content,
      createdAt: new Date()
    });
    
    // Cargar el comentario con el autor
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['id', 'name', 'username'] 
        }
      ]
    });
    
    res.status(201).json(commentWithAuthor);
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ error: 'Error al agregar el comentario' });
  }
};

// Obtener comentarios de una tarea
const getTaskComments = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const comments = await Comment.findAll({
      where: { taskId },
      include: [
        { 
          model: User, 
          as: 'author', 
          attributes: ['id', 'name', 'username'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(comments);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al cargar los comentarios' });
  }
};

module.exports = {
  getProjectTasks,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  getTaskComments
};
