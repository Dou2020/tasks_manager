/**
 * Cliente de Socket.IO para Task Manager
 * Maneja la conexión y eventos en tiempo real
 */
class SocketClient {
  constructor(options = {}) {
    this.options = {
      showNotifications: true,
      showConnectionStatus: true,
      autoReconnect: true,
      debug: true,  // Activar modo debug para ver más logs
      ...options
    };
    
    this.socket = null;
    this.projectId = null;
    this.connectedUsers = []; // Array para usuarios conectados
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    
    // Información para manejo de páginas
    this.pageVisibility = true;
    this.manualDisconnect = false;
    
    // Referencias a elementos del DOM para indicadores de estado
    this.statusIndicator = document.getElementById('connection-status');
    this.onlineUsersContainer = document.getElementById('online-users');
    this.notificationContainer = document.getElementById('notifications');
    
    // Inicializar contenedor de notificaciones si no existe
    if (this.options.showNotifications && !this.notificationContainer) {
      this.createNotificationContainer();
    }
    
    // Monitorear estado de la página
    this._setupPageVisibilityListener();
  }
  
  /**
   * Inicializa la conexión Socket.IO y configura eventos
   * @param {string} projectId - ID del proyecto al que conectarse
   */
  connect(projectId) {
    if (typeof io === 'undefined') {
      console.error('Socket.IO no está disponible. Asegúrate de incluir la biblioteca.');
      return this;
    }
    
    this.projectId = projectId;
    this.log(`Iniciando conexión Socket.IO para proyecto ${projectId}`);
    
    // Store projectId in localStorage to persist through page refreshes
    if (projectId) {
      localStorage.setItem('lastProjectId', projectId);
    }
    
    // Inicializar socket - removing forceNew to allow reconnections
    this.socket = io({
      reconnection: this.options.autoReconnect,
      reconnectionAttempts: this.maxRetries,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      // Remove forceNew to allow proper reconnection handling
      autoConnect: true
    });
    
    // Configurar eventos
    this._setupSocketEvents();
    
    // Configurar heartbeat
    this._setupHeartbeat();
    
    return this;
  }
  
  /**
   * Configura la detección de visibilidad de página para reconectar
   * automáticamente cuando el usuario vuelve a la pestaña
   */
  _setupPageVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pageVisibility = false;
        this.log('Página oculta, pausando conexión activa');
      } else {
        this.pageVisibility = true;
        this.log('Página visible de nuevo');
        
        // Verificar estado de conexión cuando la página vuelve a ser visible
        if (this.socket) {
          if (!this.isConnected && !this.manualDisconnect) {
            this.log('Reconectando automáticamente después de volver a la página');
            this.reconnect();
          } else if (this.isConnected) {
            // Verificar que seguimos en la sala del proyecto
            const projectToJoin = this.projectId || localStorage.getItem('lastProjectId');
            if (projectToJoin) {
              this.log('Verificando membresía en la sala después de volver a la página');
              this.socket.emit('verify-in-room', projectToJoin);
            }
          }
        }
      }
    });
  }
  
  /**
   * Configura un ping periódico para verificar la salud de la conexión
   */
  _setupHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
    }
    
    this._heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        // Solo enviar si la página es visible
        if (this.pageVisibility) {
          this.socket.emit('heartbeat', { projectId: this.projectId });
        }
      }
    }, 30000); // cada 30 segundos
  }
  
  /**
   * Función de logging con nivel de debug
   */
  log(message, ...args) {
    if (this.options.debug) {
      console.log(`[SocketClient] ${message}`, ...args);
    }
  }
  
  /**
   * Configura todos los eventos del socket
   * @private
   */
  _setupSocketEvents() {
    // Manejo de eventos de conexión
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.retryCount = 0;
      this._updateConnectionStatus(true);
      this.log('Conectado a Socket.IO');
      
      // Unirse a la sala del proyecto actual o recuperar de localStorage
      const projectToJoin = this.projectId || localStorage.getItem('lastProjectId');
      if (projectToJoin) {
        this.log(`Enviando petición para unirse al proyecto ${projectToJoin}`);
        this.projectId = projectToJoin; // Ensure projectId is set
        this.joinProject(projectToJoin);
      }
    });
    
    this.socket.on('connect_error', (error) => {
      this._updateConnectionStatus(false);
      console.error('Error de conexión con Socket.IO:', error);
    });
    
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this._updateConnectionStatus(false);
      this.log(`Socket desconectado: ${reason}`);
      
      // Limpiar usuarios conectados en desconexión
      this.connectedUsers = [];
      this._updateOnlineUsers();
    });
    
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.retryCount = attemptNumber;
      this.log(`Intento de reconexión #${attemptNumber}`);
      this._updateConnectionStatus(false, `Reconectando... (${attemptNumber}/${this.maxRetries})`);
    });
    
    // Eventos específicos de la aplicación
    this.socket.on('joined-project', (data) => {
      this.log('Confirmación de unión al proyecto:', data);
      this.showNotification('Conectado a actualizaciones en tiempo real', 'success');
      
      // Actualizar usuarios si viene en la respuesta
      if (data.users && Array.isArray(data.users)) {
        this.log('Usuarios en línea recibidos:', data.users);
        this.connectedUsers = data.users;
        this._updateOnlineUsers();
      } else {
        // Solicitar la lista de usuarios conectados
        this.log('Solicitando lista de usuarios conectados');
        this.socket.emit('request-online-users', this.projectId);
      }
    });
    
    // Nuevo evento cuando un usuario se une
    this.socket.on('user-joined', (data) => {
      this.log('Usuario unido:', data);
      if (data.user) {
        this.showNotification(`${data.user.name} se ha unido`, 'info');
      }
      
      // Solicitar lista actualizada de usuarios
      this.socket.emit('request-online-users', this.projectId);
    });
    
    // Evento de actualización de usuarios online
    this.socket.on('online-users', (users) => {
      this.log('Lista de usuarios en línea actualizada:', users);
      if (Array.isArray(users)) {
        this.connectedUsers = users;
        this._updateOnlineUsers();
      }
    });
    
    // Eventos para tareas
    this.socket.on('task-created', (task) => {
      this.log('Nueva tarea creada:', task);
      this.showNotification(`Nueva tarea creada: ${task.title}`, 'info');
      this._refreshTasks();
    });
    
    this.socket.on('task-updated', (task) => {
      this.log('Tarea actualizada:', task);
      this.showNotification(`Tarea actualizada: ${task.title}`, 'info');
      this._refreshTasks();
    });
    
    this.socket.on('task-deleted', (data) => {
      this.log('Tarea eliminada:', data.id);
      this.showNotification('Tarea eliminada', 'warning');
      this._refreshTasks();
    });
    
    this.socket.on('comment-added', (data) => {
      this.log('Nuevo comentario:', data);
      this.showNotification('Nuevo comentario en una tarea', 'info');
      
      // Si el modal de detalles de tarea está abierto y es la misma tarea
      this._refreshComments(data.taskId);
    });
    
    // Eventos generales
    this.socket.on('refresh-tasks', () => {
      this.log('Recibida solicitud de recarga de tareas');
      this._refreshTasks();
    });
    
    this.socket.on('notification', (data) => {
      this.showNotification(data.message, data.type);
    });

    // Manejar errores
    this.socket.on('error', (error) => {
      console.error('Error en Socket.IO:', error);
      this._updateConnectionStatus(false, 'Error de conexión');
    });
    
    // Evento de reconexión exitosa
    this.socket.on('reconnect', (attemptNumber) => {
      this.log(`Reconectado después de ${attemptNumber} intentos`);
      this.isConnected = true;
      this._updateConnectionStatus(true);
      
      // Volver a unirse al proyecto activo
      if (this.projectId) {
        this.log(`Re-uniendo al proyecto ${this.projectId} después de reconexión`);
        this.socket.emit('join-project', this.projectId);
      }
    });
    
    // Respuesta del heartbeat
    this.socket.on('heartbeat-response', (data) => {
      this.log('Heartbeat recibido', data);
    });
    
    // Evento cuando no estás en una sala pero deberías
    this.socket.on('not-in-room', (data) => {
      if (data.shouldJoin && data.projectId) {
        this.log(`Servidor indicó que no estás en la sala ${data.projectId}, uniéndose...`);
        this.joinProject(data.projectId);
      }
    });
  }
  
  /**
   * Actualiza el indicador visual del estado de conexión
   * @param {boolean} connected - Estado de conexión
   * @param {string} message - Mensaje opcional
   * @private
   */
  _updateConnectionStatus(connected, message = null) {
    if (!this.options.showConnectionStatus) return;
    
    // Si no existe el indicador de estado, créalo
    if (!this.statusIndicator) {
      this.statusIndicator = document.createElement('div');
      this.statusIndicator.id = 'connection-status';
      this.statusIndicator.className = 'fixed bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium z-50 shadow-md flex items-center transition-all';
      document.body.appendChild(this.statusIndicator);
    }
    
    if (connected) {
      this.statusIndicator.className = 'fixed bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium z-50 shadow-md flex items-center bg-green-500 text-white';
      this.statusIndicator.innerHTML = `
        <span class="w-2 h-2 bg-white rounded-full mr-1"></span>
        Conectado
      `;
      
      // Ocultar después de 3 segundos
      setTimeout(() => {
        this.statusIndicator.classList.add('opacity-50');
      }, 3000);
    } else {
      this.statusIndicator.className = 'fixed bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium z-50 shadow-md flex items-center bg-red-500 text-white';
      this.statusIndicator.innerHTML = `
        <span class="w-2 h-2 bg-white rounded-full mr-1 animate-ping"></span>
        ${message || 'Desconectado'}
      `;
      this.statusIndicator.classList.remove('opacity-50');
    }
  }
  
  /**
   * Crea el contenedor para notificaciones toast
   * @private
   */
  createNotificationContainer() {
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'notifications';
    this.notificationContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2 items-end';
    document.body.appendChild(this.notificationContainer);
  }
  
  /**
   * Muestra una notificación toast
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo: success, error, warning, info
   * @param {number} duration - Duración en ms
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (!this.options.showNotifications) return;
    
    if (!this.notificationContainer) {
      this.createNotificationContainer();
    }
    
    // Configuración según tipo de notificación
    const typeConfig = {
      success: {
        bg: 'bg-green-500',
        icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
      },
      error: {
        bg: 'bg-red-500',
        icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
      },
      warning: {
        bg: 'bg-yellow-500',
        icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
      },
      info: {
        bg: 'bg-blue-500',
        icon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
      }
    };
    
    const config = typeConfig[type] || typeConfig.info;
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `${config.bg} text-white px-4 py-2 rounded shadow-lg flex items-center space-x-2 transform transition-all duration-300 translate-x-full`;
    notification.innerHTML = `
      <div class="flex-shrink-0">
        ${config.icon}
      </div>
      <div>${message}</div>
    `;
    
    // Añadir al contenedor
    this.notificationContainer.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 10);
    
    // Remover después de duración
    setTimeout(() => {
      notification.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }
  
  /**
   * Actualiza la lista de usuarios conectados
   * @private
   */
  _updateOnlineUsers() {
    if (!this.options.showConnectionStatus || !this.onlineUsersContainer) return;
    
    // Limpiar contenedor
    this.onlineUsersContainer.innerHTML = '';
    
    // Si no hay usuarios, mostrar mensaje
    if (this.connectedUsers.length === 0) {
      this.onlineUsersContainer.innerHTML = '<span class="text-xs text-gray-500">No hay usuarios conectados</span>';
      return;
    }
    
    // Crear indicador para cada usuario
    this.connectedUsers.forEach(user => {
      const userElement = document.createElement('div');
      userElement.className = 'flex items-center space-x-1 mr-2';
      userElement.innerHTML = `
        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
        <span class="text-xs">${user.name}</span>
      `;
      this.onlineUsersContainer.appendChild(userElement);
    });
  }
  
  /**
   * Solicita actualización de datos de forma manual
   */
  refreshData() {
    if (this.socket && this.isConnected) {
      this.socket.emit('request-refresh', this.projectId);
      this.socket.emit('request-online-users', this.projectId);
    }
  }
  
  /**
   * Refresca la vista de tareas
   * @private
   */
  _refreshTasks() {
    // Intentar usar TaskManager si está disponible
    if (window.taskManager && typeof window.taskManager.loadTasks === 'function') {
      window.taskManager.loadTasks();
    } 
    // Fallback a la función legacy
    else if (typeof loadTasks === 'function') {
      loadTasks();
    }
  }
  
  /**
   * Refresca comentarios si el modal de tarea está abierto
   * @param {number} taskId - ID de la tarea
   * @private
   */
  _refreshComments(taskId) {
    if (window.taskManager && 
        window.taskManager.currentTaskId === taskId && 
        !window.taskManager.taskDetailModal.classList.contains('hidden')) {
      window.taskManager.loadComments(taskId);
    }
  }
  
  /**
   * Intenta reconectar manualmente al proyecto actual
   */
  reconnect() {
    if (this.socket) {
      // Desconectar si ya hay una conexión
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      // Limpiar eventos y crear nueva instancia
      this.socket.off();
      this.manualDisconnect = false;
      
      // Crear nueva conexión
      this.connect(this.projectId);
      
      // Mostrar notificación
      this.showNotification('Intentando reconectar...', 'info');
    }
  }
  
  /**
   * Desconecta el socket
   */
  disconnect() {
    if (this.socket) {
      this.manualDisconnect = true;
      this.socket.disconnect();
      this.isConnected = false;
      this.log('Socket desconectado manualmente');
    }
    
    // Limpiar el intervalo de heartbeat
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }
  
  /**
   * Método explícito para unirse a un proyecto
   * @param {string|number} projectId - ID del proyecto
   */
  joinProject(projectId) {
    if (!projectId || !this.socket || !this.isConnected) return;
    
    this.projectId = projectId;
    localStorage.setItem('lastProjectId', projectId);
    this.socket.emit('join-project', projectId);
    
    // Set a flag to verify join
    this._pendingJoin = true;
    
    // Set timeout to check if join was successful
    setTimeout(() => {
      if (this._pendingJoin) {
        this.log('No se recibió confirmación de unión al proyecto, reintentando...');
        this.socket.emit('join-project', projectId);
      }
    }, 3000);
  }
}

// Añadir listener para cuando la ventana se cierre o cambie
window.addEventListener('beforeunload', () => {
  if (window.socketClient && window.socketClient.socket) {
    // Marcar desconexión manual para evitar reconexión automática
    window.socketClient.manualDisconnect = true;
    window.socketClient.socket.disconnect();
  }
});

// Exportar para uso con módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketClient;
}
