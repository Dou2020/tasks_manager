const transporter = require('../config/mailer');
const EmailTemplates = require('./emailTemplates');

class EmailService {
  /**
   * Envía un correo de invitación a un proyecto
   * @param {Object} options - Opciones del correo
   * @param {string} options.to - Email del destinatario
   * @param {string} options.invitedByName - Nombre de quien invita
   * @param {string} options.projectName - Nombre del proyecto
   * @param {number} options.projectId - ID del proyecto
   */
  static async sendProjectInvitation(options) {
    const { to, invitedByName, projectName, projectId } = options;
    
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const projectUrl = `${appUrl}/projects/${projectId}/view`;
    
    try {
      const html = EmailTemplates.projectInvitation({
        invitedByName,
        projectName,
        projectUrl
      });
      
      const info = await transporter.sendMail({
        from: `"Task Manager" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Invitación al proyecto: ${projectName}`,
        html
      });
      
      console.log('✉️ Correo de invitación enviado: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar correo de invitación:', error);
      return false;
    }
  }
  
  /**
   * Envía un correo de notificación de tarea asignada
   * @param {Object} options - Opciones del correo
   * @param {string} options.to - Email del destinatario
   * @param {string} options.assignedBy - Nombre de quien asigna
   * @param {string} options.taskTitle - Título de la tarea
   * @param {string} options.projectName - Nombre del proyecto
   * @param {number} options.projectId - ID del proyecto
   * @param {number} options.taskId - ID de la tarea
   * @param {string} [options.priority] - Prioridad de la tarea
   * @param {string} [options.dueDate] - Fecha límite de la tarea
   */
  static async sendTaskAssignmentNotification(options) {
    const { to, assignedBy, taskTitle, projectName, projectId, taskId, priority, dueDate } = options;
    
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const taskUrl = `${appUrl}/projects/${projectId}/view?task=${taskId}`;
    
    // Determinar color de prioridad
    let priorityColor = '#4F46E5'; // Azul por defecto
    if (priority === 'Alta') priorityColor = '#DC2626'; // Rojo
    else if (priority === 'Media') priorityColor = '#F59E0B'; // Ámbar
    else if (priority === 'Baja') priorityColor = '#10B981'; // Verde
    
    // Formatear fecha límite si existe
    const dueDateFormatted = dueDate ? new Date(dueDate).toLocaleDateString() : 'No definida';
    
    try {
      const html = EmailTemplates.taskAssignment({
        assignedBy,
        taskTitle,
        projectName,
        taskUrl,
        priority,
        dueDateFormatted,
        priorityColor
      });
      
      const info = await transporter.sendMail({
        from: `"Task Manager" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Te han asignado una tarea: ${taskTitle}`,
        html
      });
      
      console.log('✉️ Correo de notificación de tarea enviado: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar correo de notificación de tarea:', error);
      return false;
    }
  }
}

module.exports = EmailService;