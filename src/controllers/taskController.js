const { Task, User, Comment, Project } = require('../models');
const socketProvider = require('../io/socketProvider');
const EmailService = require('../services/emailService');

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
    
    // Si hay un usuario asignado, enviar notificación por correo
    if (assignedTo) {
      try {
        const assignedUser = await User.findByPk(assignedTo);
        const project = await Project.findByPk(projectId);
        const assigningUser = await User.findByPk(req.session.userId);
        
        if (assignedUser && assignedUser.email) {
          await EmailService.sendTaskAssignmentNotification({
            to: assignedUser.email,
            assignedBy: assigningUser.name || assigningUser.username,
            taskTitle: task.title,
            projectName: project.name,
            projectId: projectId,
            taskId: task.id,
            priority: priority,
            dueDate: dueDate
          });
        }
      } catch (emailError) {
        console.error('Error al enviar notificación por correo:', emailError);
        // No interrumpir el flujo si falla el correo
      }
    }
    
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
    
    // Emitir evento de Socket.IO
    try {
      const io = socketProvider.getIO();
      if (io) {
        console.log(`Emitiendo evento task-created para proyecto ${projectId}`);
        const roomName = `project-${projectId}`;
        io.to(roomName).emit('task-created', taskWithDetails);
      }
    } catch (socketError) {
      console.error('Error al emitir evento socket:', socketError);
    }
    
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
    
    // Guardar el estado original para comparar después
    const originalAssignedTo = task.assignedTo;
    
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
    
    // Enviar notificación por correo si se cambió la asignación
    if (assignedTo !== undefined && assignedTo !== originalAssignedTo && assignedTo !== null) {
      try {
        const assignedUser = await User.findByPk(assignedTo);
        const project = await Project.findByPk(task.projectId);
        const assigningUser = await User.findByPk(req.session.userId);
        
        if (assignedUser && assignedUser.email) {
          await EmailService.sendTaskAssignmentNotification({
            to: assignedUser.email,
            assignedBy: assigningUser.name || assigningUser.username,
            taskTitle: task.title,
            projectName: project.name,
            projectId: task.projectId,
            taskId: task.id,
            priority: task.priority,
            dueDate: task.dueDate
          });
        }
      } catch (emailError) {
        console.error('Error al enviar notificación por correo:', emailError);
        // No interrumpir el flujo si falla el correo
      }
    }
    
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
    
    // Emitir evento de Socket.IO
    try {
      const io = socketProvider.getIO();
      if (io) {
        console.log(`Emitiendo evento task-updated para proyecto ${task.projectId}`);
        const roomName = `project-${task.projectId}`;
        io.to(roomName).emit('task-updated', updatedTask);
      }
    } catch (socketError) {
      console.error('Error al emitir evento socket:', socketError);
    }
    
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
    
    // Emitir evento de Socket.IO
    try {
      const io = socketProvider.getIO();
      if (io) {
        const updatedTask = await Task.findByPk(taskId, {
          include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'username'] }]
        });
        
        console.log(`Emitiendo evento task-updated (status) para proyecto ${task.projectId}`);
        const roomName = `project-${task.projectId}`;
        io.to(roomName).emit('task-updated', updatedTask);
      }
    } catch (socketError) {
      console.error('Error al emitir evento socket:', socketError);
    }
    
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
    
    const projectId = task.projectId; // Guardar el projectId antes de eliminar
    
    await task.destroy();
    
    // Emitir evento de Socket.IO
    try {
      const io = socketProvider.getIO();
      if (io) {
        console.log(`Emitiendo evento task-deleted para proyecto ${projectId}`);
        const roomName = `project-${projectId}`;
        io.to(roomName).emit('task-deleted', { id: taskId });
      }
    } catch (socketError) {
      console.error('Error al emitir evento socket:', socketError);
    }
    
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
    
    // Emitir evento de Socket.IO
    try {
      const io = socketProvider.getIO();
      if (io) {
        console.log(`Emitiendo evento comment-added para proyecto ${task.projectId} y tarea ${taskId}`);
        const roomName = `project-${task.projectId}`;
        io.to(roomName).emit('comment-added', { taskId, comment: commentWithAuthor });
      }
    } catch (socketError) {
      console.error('Error al emitir evento socket:', socketError);
    }
    
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
