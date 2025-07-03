const request = require('supertest');
const app = require('../../../app');
const { User, Project, ProjectMember } = require('../../../src/models');
const { sequelize } = require('../../../src/models');

// Mock de sesión para autenticación
jest.mock('express-session', () => {
  return () => (req, res, next) => {
    req.session = { userId: 1 };
    next();
  };
});

describe('Project Routes', () => {
  let testUser;
  let testProject;
  
  beforeAll(async () => {
    // Crear usuario y proyecto de prueba
    await sequelize.sync({ force: true });
    
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
    
    testProject = await Project.create({
      name: 'Test Project',
      description: 'Project for testing',
      ownerId: testUser.id,
      status: 'Activo'
    });
    
    await ProjectMember.create({
      projectId: testProject.id,
      userId: testUser.id,
      joinedAt: new Date()
    });
  });
  
  describe('GET /projects/api/list', () => {
    it('debería listar los proyectos del usuario', async () => {
      const response = await request(app)
        .get('/projects/api/list')
        .expect(200);
      
      expect(response.body).toHaveProperty('ownedProjects');
      expect(response.body).toHaveProperty('memberProjects');
      expect(response.body.ownedProjects.length).toBe(1);
      expect(response.body.ownedProjects[0].name).toBe('Test Project');
    });
  });
  
  describe('GET /projects/api/:id', () => {
    it('debería obtener detalles de un proyecto específico', async () => {
      const response = await request(app)
        .get(`/projects/api/${testProject.id}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', testProject.id);
      expect(response.body).toHaveProperty('name', 'Test Project');
      expect(response.body).toHaveProperty('owner');
      expect(response.body).toHaveProperty('members');
    });
    
    it('debería retornar 404 para un proyecto inexistente', async () => {
      await request(app)
        .get('/projects/api/9999')
        .expect(404);
    });
  });
  
  describe('POST /projects', () => {
    it('debería crear un nuevo proyecto', async () => {
      const newProject = {
        name: 'New Test Project',
        description: 'Created during test'
      };
      
      const response = await request(app)
        .post('/projects')
        .send(newProject)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'New Test Project');
      expect(response.body).toHaveProperty('ownerId', testUser.id);
    });
    
    it('debería validar campos requeridos', async () => {
      await request(app)
        .post('/projects')
        .send({ description: 'Missing name field' })
        .expect(400);
    });
  });
  
  // Añadir más tests para otras rutas
});
