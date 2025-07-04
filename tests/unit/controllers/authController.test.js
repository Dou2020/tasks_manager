const authController = require('../../../src/controllers/authController');
const bcrypt = require('bcrypt');

// Mock request and response
const mockRequest = (body = {}, session = {}, params = {}) => ({
  body,
  session,
  params
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

// Mock User model
jest.mock('../../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  }
}));

// Import mocked models after mocking
const { User } = require('../../../src/models');

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('loginUser', () => {
    it('debería devolver un error cuando las credenciales son incorrectas', async () => {
      // Setup
      User.findOne.mockResolvedValue(null);
      const req = mockRequest({ username: 'nonexistentuser', password: 'wrongpassword' });
      const res = mockResponse();
      
      // Execute
      await authController.loginUser(req, res);
      
      // Verify
      //expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'nonexistentuser' } });
      expect(res.render).toHaveBeenCalledWith('auth/login', expect.objectContaining({
        error: expect.any(String)
      }));
    });
    
  });
  
  // Añadir más tests para registerUser, logout, etc.
});
