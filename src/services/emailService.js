const transporter = require('../config/mailer');

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
      const info = await transporter.sendMail({
        from: `"Task Manager" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Invitación al proyecto: ${projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Has sido invitado a un proyecto!</h2>
            <p>${invitedByName} te ha invitado a colaborar en el proyecto <strong>${projectName}</strong>.</p>
            <p>Para acceder al proyecto, inicia sesión en tu cuenta y ve a la sección de proyectos, o haz clic en el siguiente enlace:</p>
            <p style="margin: 20px 0;">
              <a href="${projectUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
                Ver proyecto
              </a>
            </p>
            <p>Si no tienes una cuenta en Task Manager, regístrate primero y luego podrás acceder a este proyecto.</p>
            <p>¡Gracias por usar Task Manager!</p>
          </div>
        `
      });
      
      console.log('✉️ Correo de invitación enviado: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar correo de invitación:', error);
      return false;
    }
  }
}

module.exports = EmailService;
