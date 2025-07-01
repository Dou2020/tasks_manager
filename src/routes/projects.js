const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { ensureAuth } = require('../middlewares/auth');
const { isProjectMember, isProjectOwner } = require('../middlewares/projectMiddleware');

// Aplicar middleware de autenticación a todas las rutas de proyectos
router.use(ensureAuth);

// ===== RUTAS DE VISTA (HTML) =====

// Vista de dashboard de proyectos
router.get('/', async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.session.userId);
    
    if (!user) {
      req.session.destroy();
      return res.redirect('/auth/login');
    }
    
    res.render('project/dashboard', { 
      user: user,
      currentPage: 'projects'
    });
  } catch (error) {
    console.error('Error al cargar vista de proyectos:', error);
    res.status(500).send('Error al cargar la página');
  }
});

// Vista de proyecto individual
router.get('/:id/view', isProjectMember, async (req, res) => {
  try {
    const { Project, User } = require('../models');
    const user = await User.findByPk(req.session.userId);
    const project = await Project.findByPk(req.params.id, {
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
      return res.status(404).send('Proyecto no encontrado');
    }
    
    // Verificar si el usuario es el propietario
    const isOwner = project.ownerId === req.session.userId;
    
    res.render('project/project', { 
      user: user,
      project: project,
      isOwner: isOwner,
      currentPage: 'projects'
    });
  } catch (error) {
    console.error('Error al cargar proyecto:', error);
    res.status(500).send('Error al cargar el proyecto');
  }
});

// ===== RUTAS DE API (JSON) =====
router.get('/api/list', projectController.getAllProjects);
router.post('/', projectController.createProject);
router.get('/api/:id', isProjectMember, projectController.getProjectById);
router.post('/:id/invite', isProjectOwner, projectController.inviteUserToProject);

module.exports = router;
router.get('/:projectId/tasks', isProjectMember, (req, res, next) => {
  req.url = `/projects/${req.params.projectId}/tasks`;
  next('route');
});

module.exports = router;
