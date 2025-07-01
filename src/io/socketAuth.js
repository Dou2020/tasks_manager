const cookie = require('cookie');

/**
 * Middleware de autenticación para Socket.IO
 * Verifica que el usuario tenga una sesión válida
 */
const socketAuth = (sessionMiddleware) => async (socket, next) => {
  try {
    // Parsear la cookie de la solicitud del socket
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      console.log('Socket sin cookie de sesión');
      return next(new Error('No hay sesión'));
    }

    const cookies = cookie.parse(cookieHeader);
    if (!cookies['connect.sid']) {
      console.log('Socket sin connect.sid en cookies');
      return next(new Error('No hay token de sesión'));
    }
    
    // Usar el middleware de sesión para adjuntar la información de sesión al socket
    socket.request = { headers: { cookie: cookieHeader } };
    
    sessionMiddleware(socket.request, {}, () => {
      if (!socket.request.session) {
        console.log('Socket sin objeto de sesión');
        return next(new Error('Sesión no disponible'));
      }
      
      if (!socket.request.session.userId) {
        console.log('Socket con sesión pero sin userId');
        return next(new Error('No autenticado'));
      }
      
      // Guardar el userId en el objeto socket para usarlo más adelante
      socket.userId = socket.request.session.userId;
      
      // Registrar en la consola
      console.log(`👤 Usuario autenticado en socket [id=${socket.id}, userId=${socket.userId}]`);
      
      next();
    });
  } catch (error) {
    console.error('Error en autenticación de socket:', error);
    next(new Error('Error en autenticación'));
  }
};

module.exports = socketAuth;
