const { Task, Project, ProjectMember } = require('../models');

// Verifica si el usuario puede acceder a una tarea (miembro del proyecto)
const canAccessTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const userId = req.session.userId;

    // Obtener la tarea con su proyecto
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const projectId = task.projectId;

    // Verificar si el usuario es propietario del proyecto
    const project = await Project.findOne({
      where: { 
        id: projectId,
        ownerId: userId 
      }
    });

    if (project) {
      // Si es dueño del proyecto, permitir acceso
      req.task = task; // Pasar la tarea para no tener que buscarla de nuevo
      return next();
    }

    // Verificar si el usuario es miembro del proyecto
    const isMember = await ProjectMember.findOne({
      where: {
        projectId,
        userId
      }
    });

    if (!isMember) {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a esta tarea' 
      });
    }

    req.task = task; // Pasar la tarea para no tener que buscarla de nuevo
    next();
  } catch (error) {
    console.error('Error verificando acceso a tarea:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

module.exports = {
  canAccessTask
};
