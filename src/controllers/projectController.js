const { Project, User, ProjectMember } = require('../models');
const EmailService = require('../services/emailService');

// Lista todos los proyectos del usuario (tanto propios como miembro)
const getAllProjects = async (req, res) => {
  try {
    // Buscar proyectos donde el usuario es propietario
    const ownedProjects = await Project.findAll({
      where: { ownerId: req.session.userId },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'name'] }
      ]
    });

    // Buscar proyectos donde el usuario es miembro
    const user = await User.findByPk(req.session.userId, {
      include: [
        { 
          model: Project, 
          as: 'projects',
          through: { attributes: [] }, // No incluir atributos de la tabla intermedia
          include: [
            { model: User, as: 'owner', attributes: ['id', 'username', 'name'] }
          ]
        }
      ]
    });

    const memberProjects = user ? user.projects : [];

    res.json({
      ownedProjects,
      memberProjects
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener los proyectos' });
  }
};

// Obtiene un proyecto específico por ID
const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'name'] },
        { 
          model: User, 
          as: 'members', 
          attributes: ['id', 'username', 'name', 'email'],
          through: { attributes: ['joinedAt'] }
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error al obtener el proyecto:', error);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
};

// Crea un nuevo proyecto
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
    }

    const project = await Project.create({
      name,
      description,
      ownerId: req.session.userId,
      status: 'Activo'
    });

    // Automáticamente hacer al creador miembro del proyecto
    await ProjectMember.create({
      projectId: project.id,
      userId: req.session.userId,
      joinedAt: new Date()
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error al crear el proyecto' });
  }
};

// Invita a un usuario al proyecto por email
const inviteUserToProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }

    // Verificar que el proyecto existe
    const project = await Project.findByPk(projectId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'name'] }]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar que el usuario a invitar existe
    const userToInvite = await User.findOne({ where: { email } });
    if (!userToInvite) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el usuario no sea ya miembro del proyecto
    const existingMember = await ProjectMember.findOne({
      where: {
        projectId,
        userId: userToInvite.id
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'El usuario ya es miembro de este proyecto' });
    }

    // Obtener información del usuario que invita
    const invitingUser = await User.findByPk(req.session.userId);
    
    // Añadir al usuario como miembro del proyecto
    await ProjectMember.create({
      projectId,
      userId: userToInvite.id,
      joinedAt: new Date()
    });

    // Enviar correo electrónico de invitación
    await EmailService.sendProjectInvitation({
      to: userToInvite.email,
      invitedByName: invitingUser.name,
      projectName: project.name,
      projectId: project.id
    });

    res.status(201).json({ message: 'Usuario invitado exitosamente y se ha enviado un correo de notificación' });
  } catch (error) {
    console.error('Error al invitar usuario:', error);
    res.status(500).json({ error: 'Error al invitar al usuario' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  inviteUserToProject
};
