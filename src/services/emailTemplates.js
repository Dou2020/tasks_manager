/**
 * Plantillas HTML para correos electrónicos
 */
const EmailTemplates = {
  /**
   * Genera el HTML para una notificación de tarea asignada
   */
  taskAssignment: function(data) {
    const { assignedBy, taskTitle, projectName, taskUrl, priority, dueDateFormatted, priorityColor } = data;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4F46E5; margin-bottom: 5px;">Nueva Tarea Asignada</h1>
          <p style="color: #6B7280; font-size: 16px;">${assignedBy} te ha asignado una tarea</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-left: 4px solid ${priorityColor}; margin: 20px 0; border-radius: 4px;">
          <h2 style="margin-top: 0; color: #111827;">${taskTitle}</h2>
          <p style="color: #4B5563; margin-bottom: 15px;">Proyecto: <strong>${projectName}</strong></p>
          
          <div style="display: flex; margin-bottom: 10px;">
            <div style="width: 50%; padding-right: 10px;">
              <p style="color: #4B5563; margin: 0;">
                <strong>Prioridad:</strong><br>
                <span style="color: ${priorityColor};">${priority || 'No definida'}</span>
              </p>
            </div>
            <div style="width: 50%; padding-left: 10px;">
              <p style="color: #4B5563; margin: 0;">
                <strong>Fecha límite:</strong><br>
                ${dueDateFormatted}
              </p>
            </div>
          </div>
        </div>
        
        <p style="color: #4B5563; text-align: center; margin-bottom: 25px;">
          Para ver los detalles de la tarea y empezar a trabajar en ella, haz clic en el siguiente enlace:
        </p>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${taskUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Ver detalles de la tarea
          </a>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #9CA3AF; font-size: 12px;">
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          <p>© ${new Date().getFullYear()} Task Manager. Todos los derechos reservados.</p>
        </div>
      </div>
    `;
  },
  
  /**
   * Genera el HTML para una invitación a un proyecto
   */
  projectInvitation: function(data) {
    const { invitedByName, projectName, projectUrl } = data;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4F46E5; margin-bottom: 5px;">Invitación a Proyecto</h1>
          <p style="color: #6B7280; font-size: 16px;">Has sido invitado a colaborar en un proyecto</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; border-radius: 4px;">
          <h2 style="margin-top: 0; color: #111827;">${projectName}</h2>
          <p style="color: #4B5563;">${invitedByName} te ha invitado a colaborar en este proyecto.</p>
        </div>
        
        <p style="color: #4B5563; text-align: center; margin-bottom: 25px;">
          Para acceder al proyecto, inicia sesión en tu cuenta y ve a la sección de proyectos, o haz clic en el siguiente enlace:
        </p>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${projectUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Ver proyecto
          </a>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #9CA3AF; font-size: 12px;">
          <p>Si no tienes una cuenta en Task Manager, regístrate primero y luego podrás acceder a este proyecto.</p>
          <p>© ${new Date().getFullYear()} Task Manager. Todos los derechos reservados.</p>
        </div>
      </div>
    `;
  }
};

module.exports = EmailTemplates;
