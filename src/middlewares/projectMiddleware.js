const { Project, ProjectMember } = require('../models');

// Verifica si el usuario es miembro del proyecto
const isProjectMember = async (req, res, next) => {
  try {
    // Usar projectId si está disponible, de lo contrario usar id
    const projectId = req.params.projectId || req.params.id;
    const userId = req.session.userId;

    if (!projectId) {
      return res.status(400).json({ error: 'ID de proyecto no proporcionado' });
    }

    // Verificar si el usuario es dueño del proyecto
    const project = await Project.findOne({
      where: { 
        id: projectId,
        ownerId: userId 
      }
    });

    if (project) {
      return next(); // Si es dueño, permitir acceso
    }

    // Si no es dueño, verificar si es miembro
    const membership = await ProjectMember.findOne({
      where: {
        projectId,
        userId
      }
    });

    if (!membership) {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a este proyecto' 
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando membresía en proyecto:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

// Verifica si el usuario es propietario del proyecto
const isProjectOwner = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.session.userId;

    const project = await Project.findByPk(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (project.ownerId !== userId) {
      return res.status(403).json({ 
        error: 'Solo el propietario del proyecto puede realizar esta acción' 
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando propiedad del proyecto:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

module.exports = {
  isProjectMember,
  isProjectOwner
};
