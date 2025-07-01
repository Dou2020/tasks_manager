const socketAuth = require('./socketAuth');
const { User } = require('../models');
const socketProvider = require('./socketProvider');

/**
 * Configura Socket.IO con autenticación y gestión de eventos
 * @param {SocketIO.Server} io - Instancia de Socket.IO
 * @param {Function} sessionMiddleware - Middleware de sesión de Express
 */
module.exports = (io, sessionMiddleware) => {
  // Inicializar el proveedor con la instancia de io
  socketProvider.init(io);
  
  // Aplicar middleware de autenticación a Socket.IO
  io.use(socketAuth(sessionMiddleware));
  
  // Mapa de salas y usuarios conectados
  const projectRooms = new Map(); // projectId -> Map(userId -> userData)
  
  // Mapa de conexiones de usuario
  const userSockets = new Map(); // userId -> Set of socket.ids
  
  // Limpiar recursos periódicamente
  setInterval(() => cleanupResources(), 300000); // cada 5 minutos
  
  // Función para limpiar recursos no utilizados
  function cleanupResources() {
    console.log('🧹 Limpiando recursos de sockets no utilizados');
    
    // Limpiar userSockets
    for (const [userId, sockets] of userSockets.entries()) {
      // Verificar qué sockets siguen conectados
      const connectedSockets = Array.from(sockets).filter(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        return socket && socket.connected;
      });
      
      if (connectedSockets.length === 0) {
        userSockets.delete(userId);
        console.log(`👤 Usuario ${userId} sin sockets activos, eliminado de seguimiento`);
      } else if (connectedSockets.length !== sockets.size) {
        userSockets.set(userId, new Set(connectedSockets));
        console.log(`👤 Usuario ${userId}: eliminados ${sockets.size - connectedSockets.length} sockets desconectados`);
      }
    }
    
    // Limpiar projectRooms
    for (const [projectId, users] of projectRooms.entries()) {
      if (users.size === 0) {
        projectRooms.delete(projectId);
        console.log(`📂 Proyecto ${projectId} sin usuarios, eliminado de seguimiento`);
      }
    }
  }
  
  // Manejar conexiones de socket
  io.on('connection', async (socket) => {
    console.log(`⚡ Nueva conexión de socket [id=${socket.id}]`);
    
    try {
      // Cargar información del usuario
      const user = await User.findByPk(socket.userId);
      if (!user) {
        console.error(`❌ Usuario no encontrado para socket [id=${socket.id}, userId=${socket.userId}]`);
        socket.disconnect();
        return;
      }
      
      // Almacenar información del usuario en el objeto socket
      socket.user = {
        id: user.id,
        name: user.name || user.username,
        username: user.username
      };
      
      // Registrar el socket en el mapa de usuarios
      if (!userSockets.has(socket.user.id)) {
        userSockets.set(socket.user.id, new Set());
      }
      userSockets.get(socket.user.id).add(socket.id);
      
      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`📴 Socket desconectado [id=${socket.id}, user=${socket.user.name}]`);
        
        // Eliminar este socket del registro de usuario
        if (userSockets.has(socket.user.id)) {
          const userSocketSet = userSockets.get(socket.user.id);
          userSocketSet.delete(socket.id);
          
          // Si no quedan sockets para este usuario, eliminarlo de las salas
          if (userSocketSet.size === 0) {
            // Eliminar usuario de todas las salas a las que pertenecía
            for (const [projectId, users] of projectRooms.entries()) {
              if (users.has(socket.user.id)) {
                users.delete(socket.user.id);
                
                // Emitir actualización de usuarios en línea
                io.to(`project-${projectId}`).emit('online-users', Array.from(users.values()));
                console.log(`Usuario ${socket.user.name} eliminado de la sala project-${projectId}`);
              }
            }
          }
        }
      });
      
      // Unirse a la sala de un proyecto específico
      socket.on('join-project', (projectId) => {
        if (!projectId) {
          console.log('Se intentó unir a un proyecto sin ID');
          return;
        }
        
        console.log(`Usuario ${socket.user.name} intentando unirse al proyecto ${projectId}`);
        
        // Obtener todas las salas a las que está unido el socket actualmente
        // Variable renombrada a socketRooms para evitar conflicto con la variable global projectRooms
        const socketRooms = Array.from(socket.rooms)
          .filter(room => room !== socket.id && room.startsWith('project-'));
        
        // Verificar si ya está en la sala del proyecto
        const targetRoom = `project-${projectId}`;
        if (socketRooms.includes(targetRoom)) {
          console.log(`Usuario ${socket.user.name} ya está en la sala ${targetRoom}, reconfirmando...`);
          
          // Enviar confirmación nuevamente
          socket.emit('joined-project', { 
            projectId, 
            message: 'Ya estabas conectado a este proyecto',
            users: Array.from(projectRooms.get(projectId)?.values() || [])
          });
          return;
        }
        
        // Abandonar todas las salas de proyectos anteriores
        socketRooms.forEach(room => {
          const prevProjectId = room.replace('project-', '');
          console.log(`Abandonando sala anterior: ${room}`);
          socket.leave(room);
        });
        
        // Unirse a la sala del nuevo proyecto
        socket.join(targetRoom);
        console.log(`🔌 Usuario ${socket.user.name} se unió a la sala ${targetRoom}`);
        
        // Añadir usuario a la lista de usuarios del proyecto
        if (!projectRooms.has(projectId)) {
          projectRooms.set(projectId, new Map());
        }
        
        // Usar ID de usuario como clave para evitar duplicados
        projectRooms.get(projectId).set(socket.user.id, {
          id: socket.user.id,
          name: socket.user.name,
          socketId: socket.id
        });
        
        // Emitir lista de usuarios conectados al proyecto
        const usersInRoom = Array.from(projectRooms.get(projectId).values());
        
        // Enviar a toda la sala, incluido el socket actual
        io.to(targetRoom).emit('online-users', usersInRoom);
        
        // Notificar al usuario que se unió exitosamente
        socket.emit('joined-project', { 
          projectId, 
          message: 'Conectado a actualizaciones en tiempo real',
          users: usersInRoom
        });
        
        // Notificar a los demás usuarios
        socket.to(targetRoom).emit('user-joined', {
          user: {
            id: socket.user.id,
            name: socket.user.name
          }
        });
      });
      
      // Nuevo evento para verificar si un usuario está en la sala correcta
      socket.on('verify-in-room', (projectId) => {
        if (!projectId) return;
        
        const targetRoom = `project-${projectId}`;
        const socketRooms = Array.from(socket.rooms);
        
        if (!socketRooms.includes(targetRoom)) {
          console.log(`Usuario ${socket.user.name} no está en sala ${targetRoom} pero debería estarlo`);
          socket.emit('not-in-room', { shouldJoin: true, projectId });
        } else {
          console.log(`Usuario ${socket.user.name} verificó correctamente su presencia en sala ${targetRoom}`);
        }
      });

      // Manejar heartbeat para verificar conexiones activas
      socket.on('heartbeat', (data) => {
        socket.emit('heartbeat-response', { received: true, timestamp: Date.now() });
      });
      
      // Manejar eventos explícitos de actualizaciones
      socket.on('request-refresh', (projectId) => {
        if (!projectId) return;
        
        console.log(`Usuario ${socket.user.name} solicitó refrescar datos del proyecto ${projectId}`);
        
        // Emitir refresh a toda la sala
        const roomName = `project-${projectId}`;
        io.to(roomName).emit('refresh-tasks');
      });
      
      socket.on('request-online-users', (projectId) => {
        if (!projectId) return;
        
        console.log(`Usuario ${socket.user.name} solicitó lista de usuarios en línea del proyecto ${projectId}`);
        
        if (projectRooms.has(projectId)) {
          const usersInRoom = Array.from(projectRooms.get(projectId).values());
          socket.emit('online-users', usersInRoom);
        } else {
          socket.emit('online-users', []);
        }
      });
      
    } catch (error) {
      console.error('Error en la gestión de socket:', error);
    }
  });
  
  return io;
};
