// Mock the mailer configuration
jest.mock('../../../src/config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
}));

// Import after mocking
const EmailService = require('../../../src/services/emailService');
const transporter = require('../../../src/config/mailer');

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTaskAssignmentNotification', () => {
    it('debería enviar una notificación de asignación de tarea', async () => {
      // Setup
      const options = {
        to: 'user@example.com',
        assignedBy: 'Test Manager',
        taskTitle: 'Test Task',
        projectName: 'Test Project',
        projectId: 1,
        taskId: 2,
        priority: 'Alta',
        dueDate: '2023-12-31'
      };
      
      // Execute
      const result = await EmailService.sendTaskAssignmentNotification(options);
      
      // Verify
      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Test Task')
        })
      );
      expect(result).toBe(true);
    });
  });

  // Add tests for other EmailService methods
});
