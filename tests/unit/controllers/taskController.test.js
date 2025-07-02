const taskController = require('../../../src/controllers/taskController');
const { Task, User, Comment, Project } = require('../../../src/models');
const socketProvider = require('../../../src/io/socketProvider');

// Mock de los modelos y servicios
jest.mock('../../../src/models', () => ({
  Task: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  User: {
    findByPk: jest.fn()
  },
  Project: {
    findByPk: jest.fn()
  },
  Comment: {
    findAll: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  }
}));

// Mock de Socket.IO
jest.mock('../../../src/io/socketProvider', () => ({
  getIO: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnValue({
      emit: jest.fn()
    })
  })
}));

// Mock de servicio de email
jest.mock('../../../src/services/emailService', () => ({
  sendTaskAssignmentNotification: jest.fn().mockResolvedValue(true)
}));

// Configuración para request y response
const mockRequest = (params = {}, body = {}, session = { userId: 1 }) => ({
  params,
  body,
  session
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('TaskController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectTasks', () => {
    it('debería retornar todas las tareas de un proyecto', async () => {
      // Preparar
      const mockTasks = [
        { id: 1, title: 'Tarea 1', projectId: 1 },
        { id: 2, title: 'Tarea 2', projectId: 1 }
      ];
      
      Task.findAll.mockResolvedValue(mockTasks);
      
      const req = mockRequest({ projectId: '1' });
      const res = mockResponse();
      
      // Ejecutar
      await taskController.getProjectTasks(req, res);
      
      // Verificar
      expect(Task.findAll).toHaveBeenCalledWith({
        where: { projectId: '1' },
        include: [expect.any(Object)],
        order: [['createdAt', 'DESC']]
      });
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });
    
    it('debería manejar errores al cargar tareas', async () => {
      // Preparar
      Task.findAll.mockRejectedValue(new Error('Error de base de datos'));
      
      const req = mockRequest({ projectId: '1' });
      const res = mockResponse();
      
      // Ejecutar
      await taskController.getProjectTasks(req, res);
      
      // Verificar
      expect(Task.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
  });
  
  // Añadir más tests para createTask, updateTask, deleteTask, etc.
});
