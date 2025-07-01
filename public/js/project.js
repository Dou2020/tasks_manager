document.addEventListener('DOMContentLoaded', function() {
  // Referencias a elementos DOM - Invitar usuario
  const inviteBtn = document.getElementById('invite-btn');
  const inviteModal = document.getElementById('invite-modal');
  const inviteForm = document.getElementById('invite-form');

  // Referencias a elementos DOM - Crear tarea
  const createTaskBtn = document.getElementById('create-task-btn');
  const taskModal = document.getElementById('task-modal');
  const taskForm = document.getElementById('task-form');
  
  // Referencias a columnas de tareas
  const todoTasksContainer = document.getElementById('todo-tasks');
  const inProgressTasksContainer = document.getElementById('inprogress-tasks');
  const completedTasksContainer = document.getElementById('completed-tasks');
  
  // Botones para cerrar modales
  const closeModalBtns = document.querySelectorAll('.close-modal');

  // Eventos para abrir modales
  if (inviteBtn) {
    inviteBtn.addEventListener('click', function() {
      inviteModal.classList.remove('hidden');
    });
  }
  
  if (createTaskBtn) {
    createTaskBtn.addEventListener('click', function() {
      taskModal.classList.remove('hidden');
      loadProjectMembers(); // Cargar miembros para asignar tarea
    });
  }

  // Cerrar modales
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      inviteModal.classList.add('hidden');
      taskModal.classList.add('hidden');
      inviteForm.reset();
      taskForm.reset();
    });
  });

  // Cerrar modales al hacer clic fuera
  window.addEventListener('click', function(event) {
    if (event.target === inviteModal) {
      inviteModal.classList.add('hidden');
      inviteForm.reset();
    }
    if (event.target === taskModal) {
      taskModal.classList.add('hidden');
      taskForm.reset();
    }
  });

  // Formulario para invitar usuarios
  if (inviteForm) {
    inviteForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const emailInput = document.getElementById('invite-email');
      
      if (!emailInput.value.trim()) {
        alert('El email es obligatorio');
        return;
      }
      
      try {
        // Mostrar estado de carga
        const submitBtn = inviteForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Invitando...';
        
        // Enviar solicitud a la API
        const response = await fetch(`/projects/${projectId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: emailInput.value.trim() })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al invitar al usuario');
        }
        
        // Éxito
        alert('Usuario invitado exitosamente');
        inviteModal.classList.add('hidden');
        inviteForm.reset();
        
        // Opcional: recargar la página para mostrar el nuevo miembro
        window.location.reload();
        
      } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al invitar al usuario');
      } finally {
        // Restaurar botón
        const submitBtn = inviteForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // Formulario para crear tareas
  if (taskForm) {
    taskForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const titleInput = document.getElementById('task-title');
      
      if (!titleInput.value.trim()) {
        alert('El título de la tarea es obligatorio');
        return;
      }
      
      try {
        // Mostrar estado de carga
        const submitBtn = taskForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML; // Guardar el texto original
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Creando...';
        
        // Preparar datos del formulario
        const formData = {
          title: titleInput.value.trim(),
          description: document.getElementById('task-description').value.trim(),
          assignedTo: document.getElementById('task-assigned').value || null,
          priority: document.getElementById('task-priority').value,
          dueDate: document.getElementById('task-due-date').value || null
        };
        
        // Enviar solicitud a la API
        const response = await fetch(`/projects/${projectId}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear la tarea');
        }
        
        // Éxito
        taskModal.classList.add('hidden');
        taskForm.reset();
        
        // Cargar tareas para mostrar la nueva
        loadTasks();
        
      } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al crear la tarea');
      } finally {
        // Restaurar botón - corregimos el error de referencia
        const submitBtn = taskForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        // Si no existe originalBtnText, usamos un texto por defecto
        submitBtn.innerHTML = 'Crear Tarea';
      }
    });
  }
  
  // Cargar las tareas del proyecto
  loadTasks();

  // Función para cargar los miembros del proyecto para el selector de asignación
  async function loadProjectMembers() {
    try {
      const response = await fetch(`/projects/api/${projectId}`);
      if (!response.ok) throw new Error('Error al cargar miembros del proyecto');
      
      const project = await response.json();
      const assignedSelect = document.getElementById('task-assigned');
      
      // Mantener la opción por defecto y "Yo"
      const defaultOptions = Array.from(assignedSelect.options).slice(0, 2);
      assignedSelect.innerHTML = '';
      
      // Restaurar opciones por defecto
      defaultOptions.forEach(option => {
        assignedSelect.appendChild(option);
      });
      
      // Añadir miembros del proyecto
      if (project.members && project.members.length > 0) {
        project.members.forEach(member => {
          // Evitar duplicar "Yo"
          if (member.id.toString() !== defaultOptions[1].value) {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            assignedSelect.appendChild(option);
          }
        });
      }
      
    } catch (error) {
      console.error('Error cargando miembros:', error);
    }
  }

  // Función para cargar tareas desde la API
  async function loadTasks() {
    try {
      console.log('Cargando tareas del proyecto:', projectId);
      const response = await fetch(`/projects/${projectId}/tasks`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar tareas');
      }
      
      const tasks = await response.json();
      console.log('Tareas cargadas:', tasks);
      
      // Agrupar por estado
      const todoTasks = tasks.filter(task => task.status === 'Por hacer');
      const inProgressTasks = tasks.filter(task => task.status === 'En progreso');
      const completedTasks = tasks.filter(task => task.status === 'Completado');
      
      // Renderizar las tareas en sus columnas
      renderTasks(todoTasksContainer, todoTasks);
      renderTasks(inProgressTasksContainer, inProgressTasks);
      renderTasks(completedTasksContainer, completedTasks);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      const errorMessage = `
        <div class="p-4 border border-red-200 bg-red-50 rounded-lg text-center">
          <p class="text-red-600">Error al cargar tareas: ${error.message}</p>
          <button type="button" class="mt-2 text-blue-600 hover:underline" onclick="loadTasks()">
            Reintentar
          </button>
        </div>
      `;
      todoTasksContainer.innerHTML = errorMessage;
      inProgressTasksContainer.innerHTML = errorMessage;
      completedTasksContainer.innerHTML = errorMessage;
    }
  }

  // Función para renderizar tareas
  function renderTasks(container, tasks) {
    if (!tasks || !tasks.length) {
      container.innerHTML = `
        <p class="text-center text-gray-500 py-4">No hay tareas en esta columna</p>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    tasks.forEach(task => {
      const priorityColors = {
        'Alta': 'bg-red-100 text-red-800',
        'Media': 'bg-yellow-100 text-yellow-800',
        'Baja': 'bg-green-100 text-green-800'
      };
      
      const priorityClass = priorityColors[task.priority] || 'bg-gray-100 text-gray-800';
      const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Sin fecha límite';
      
      container.innerHTML += `
        <div class="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow" data-task-id="${task.id}">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-medium">${escapeHtml(task.title)}</h4>
            <span class="px-2 py-1 text-xs rounded-full ${priorityClass}">${task.priority}</span>
          </div>
          <p class="text-sm text-gray-600 mb-3">${escapeHtml(task.description) || 'Sin descripción'}</p>
          <div class="flex justify-between text-xs text-gray-500">
            <div>Fecha límite: ${dueDate}</div>
            ${task.assignee ? 
              `<div class="flex items-center">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.name)}&size=16&background=random" class="w-4 h-4 rounded-full mr-1">
                ${escapeHtml(task.assignee.name)}
              </div>` : 
              '<div>Sin asignar</div>'
            }
          </div>
        </div>
      `;
    });
  }

  // Función utilitaria para escapar HTML
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Configuración de Socket.IO para actualizaciones en tiempo real
  setupSocketIO();
  
  // Función para configurar Socket.IO
  function setupSocketIO() {
    // Verificar si Socket.IO está disponible
    if (typeof io === 'undefined') {
      console.warn('Socket.IO no está disponible');
      return;
    }
    
    // Conectar al servidor Socket.IO
    const socket = io();
    
    // Manejar errores de conexión
    socket.on('connect_error', (error) => {
      console.error('Error de conexión con Socket.IO:', error);
    });
    
    // Cuando la conexión está lista
    socket.on('connect', () => {
      console.log('Conectado a Socket.IO');
      
      // Unirse a la sala del proyecto actual
      socket.emit('join-project', projectId);
    });
    
    // Confirmar unión a proyecto
    socket.on('joined-project', (data) => {
      console.log(`Unido al proyecto ${data.projectId} para actualizaciones en tiempo real`);
    });
    
    // Eventos de tareas
    
    // Nueva tarea creada
    socket.on('task-created', (task) => {
      console.log('Nueva tarea creada:', task);
      
      // Recargar solo la columna correspondiente
      if (window.taskManager) {
        window.taskManager.loadTasks();
      } else {
        loadTasks();  // Función legacy
      }
    });
    
    // Tarea actualizada
    socket.on('task-updated', (task) => {
      console.log('Tarea actualizada:', task);
      
      // Recargar solo la columna correspondiente
      if (window.taskManager) {
        window.taskManager.loadTasks();
      } else {
        loadTasks();  // Función legacy
      }
    });
    
    // Tarea eliminada
    socket.on('task-deleted', (data) => {
      console.log('Tarea eliminada:', data.id);
      
      // Recargar tareas
      if (window.taskManager) {
        window.taskManager.loadTasks();
      } else {
        loadTasks();  // Función legacy
      }
    });
    
    // Nuevo comentario
    socket.on('comment-added', (data) => {
      console.log('Comentario agregado a tarea:', data);
      
      // Si el modal de detalles de tarea está abierto y es la misma tarea
      if (window.taskManager && 
          window.taskManager.currentTaskId === data.taskId && 
          !window.taskManager.taskDetailModal.classList.contains('hidden')) {
        window.taskManager.loadComments(data.taskId);
      }
    });
    
    // Forzar recarga de tareas
    socket.on('refresh-tasks', () => {
      console.log('Forzando recarga de tareas...');
      if (window.taskManager) {
        window.taskManager.loadTasks();
      } else {
        loadTasks();  // Función legacy
      }
    });
  }
  
  // Añadir botón de recarga manual y reconexión
  const onlineUsersContainer = document.getElementById('online-users');
  if (onlineUsersContainer) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = "flex items-center ml-2";
    
    // Botón de refrescar datos
    const refreshButton = document.createElement('button');
    refreshButton.className = "text-xs text-blue-600 hover:text-blue-800 mr-2";
    refreshButton.title = "Refrescar datos";
    refreshButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>`;
    refreshButton.addEventListener('click', function() {
      if (window.socketClient) {
        window.socketClient.refreshData();
      }
    });
    
    // Botón de reconexión
    const reconnectButton = document.createElement('button');
    reconnectButton.className = "text-xs text-green-600 hover:text-green-800";
    reconnectButton.title = "Forzar reconexión";
    reconnectButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>`;
    reconnectButton.addEventListener('click', function() {
      if (window.socketClient) {
        window.socketClient.reconnect();
      }
    });
    
    controlsDiv.appendChild(refreshButton);
    controlsDiv.appendChild(reconnectButton);
    
    const parentDiv = onlineUsersContainer.parentElement;
    parentDiv.appendChild(controlsDiv);
  }
  
  // Inicializar Socket.IO con verificación
  window.addEventListener('load', function() {
    // Verificar si tenemos un socket client inicializado
    if (window.socketClient) {
      // Asegurarnos de que está conectado al proyecto correcto
      if (window.socketClient.projectId != projectId) {
        console.log('Detectado cambio de proyecto, actualizando conexión');
        window.socketClient.joinProject(projectId);
      } else if (!window.socketClient.isConnected) {
        console.log('Socket client no conectado, reconectando');
        window.socketClient.reconnect();
      }
    }
  });
});
