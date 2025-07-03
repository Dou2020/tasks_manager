// Common mocks for models used across tests

const mockUser = {
  id: 1,
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', // mock bcrypt hash
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

const mockTask = {
  id: 1,
  title: 'Test Task',
  description: 'Task for testing',
  status: 'Por hacer',
  priority: 'Media',
  projectId: 1,
  assignedTo: 1,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

const mockProject = {
  id: 1,
  name: 'Test Project',
  description: 'Project for testing',
  ownerId: 1,
  status: 'Activo',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

module.exports = {
  mockUser,
  mockTask,
  mockProject
};
