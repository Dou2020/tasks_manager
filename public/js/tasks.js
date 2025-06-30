/**
 * Gestor de Tareas
 * Script para manejar la interacción con tareas en el proyecto
 */

class TaskManager {
  constructor(projectId) {
    this.projectId = projectId;
    this.currentTaskId = null;
    this.isEditing = false;

    // Referencias DOM
    this.taskDetailModal = document.getElementById('task-detail-modal');
    this.taskDetailForm = document.getElementById('task-detail-form');
    this.taskModalTitle = document.getElementById('task-modal-title');
    this.deleteTaskBtn = document.getElementById('delete-task-btn');
    this.commentsContainer = document.getElementById('comments-container');
    this.toggleCommentsBtn = document.getElementById('toggle-comments');
    this.commentForm = document.getElementById('comment-form');
    
    this.todoTasksContainer = document.getElementById('todo-tasks');
    this.inProgressTasksContainer = document.getElementById('inprogress-tasks');
    this.completedTasksContainer = document.getElementById('completed-tasks');

    this.closeModalButtons = document.querySelectorAll('.close-task-modal');

    this.init();
  }

  init() {
    // Configurar manejadores de eventos
    this.setupEventListeners();
    
    // Cargar tareas iniciales
    this.loadTasks();
  }

  setupEventListeners() {
    // Cerrar modal
    this.closeModalButtons.forEach(btn => {
      btn.addEventListener('click', () => this.closeTaskModal());
    });

    // Click fuera del modal para cerrar
    window.addEventListener('click', (e) => {
      if (e.target === this.taskDetailModal) {
        this.closeTaskModal();
      }
    });

    // Submit del formulario de tareas
    this.taskDetailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTask();
    });

    // Eliminar tarea
    if (this.deleteTaskBtn) {
      this.deleteTaskBtn.addEventListener('click', () => this.confirmDeleteTask());
    }

    // Toggle de comentarios
    if (this.toggleCommentsBtn) {
      this.toggleCommentsBtn.addEventListener('click', () => this.toggleComments());
    }

    // Submit de comentarios
    if (this.commentForm) {
      this.commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addComment();
      });
    }

    // Delegación de eventos para tareas
    document.addEventListener('click', (e) => {
      // Ver detalles de una tarea
      if (e.target.closest('.task-card')) {
        const taskCard = e.target.closest('.task-card');
        this.openTaskDetails(taskCard.dataset.taskId);
      }
      
      // Drag and drop (placeholder)
      // Implementación futura
    });

    // Evento para cambios de estado en las tareas desde el dropdown
    document.addEventListener('change', (e) => {
      if (e.target.matches('.task-status-select')) {
        const taskId = e.target.closest('.task-card').dataset.taskId;
        this.updateTaskStatus(taskId, e.target.value);
      }
    });
  }

  // Cargar tareas del proyecto
  async loadTasks() {
    try {
      console.log('Cargando tareas del proyecto:', this.projectId);
      const response = await fetch(`/projects/${this.projectId}/tasks`);
      
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
      this.renderTasks(this.todoTasksContainer, todoTasks);
      this.renderTasks(this.inProgressTasksContainer, inProgressTasks);
      this.renderTasks(this.completedTasksContainer, completedTasks);
      
      return tasks;
    } catch (error) {
      console.error('Error cargando tareas:', error);
      const errorMessage = `
        <div class="p-4 border border-red-200 bg-red-50 rounded-lg text-center">
          <p class="text-red-600">Error al cargar tareas: ${error.message}</p>
          <button type="button" class="mt-2 text-blue-600 hover:underline" onclick="taskManager.loadTasks()">
            Reintentar
          </button>
        </div>
      `;
      
      this.todoTasksContainer.innerHTML = errorMessage;
      this.inProgressTasksContainer.innerHTML = errorMessage;
      this.completedTasksContainer.innerHTML = errorMessage;
      
      return [];
    }
  }

  // Renderizar tareas en una columna
  renderTasks(container, tasks) {
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
        <div class="task-card bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer" data-task-id="${task.id}">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-medium">${this.escapeHtml(task.title)}</h4>
            <div class="flex items-center">
              <span class="px-2 py-1 text-xs rounded-full ${priorityClass} mr-2">${task.priority}</span>
              <select class="task-status-select text-xs border rounded py-1 px-1" data-original="${task.status}">
                <option value="Por hacer" ${task.status === 'Por hacer' ? 'selected' : ''}>Por hacer</option>
                <option value="En progreso" ${task.status === 'En progreso' ? 'selected' : ''}>En progreso</option>
                <option value="Completado" ${task.status === 'Completado' ? 'selected' : ''}>Completado</option>
              </select>
            </div>
          </div>
          <p class="text-sm text-gray-600 mb-3 line-clamp-2">${this.escapeHtml(task.description) || 'Sin descripción'}</p>
          <div class="flex justify-between text-xs text-gray-500">
            <div>Fecha límite: ${dueDate}</div>
            ${task.assignee ? 
              `<div class="flex items-center">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.name)}&size=16&background=random" class="w-4 h-4 rounded-full mr-1">
                ${this.escapeHtml(task.assignee.name)}
              </div>` : 
              '<div>Sin asignar</div>'
            }
          </div>
        </div>
      `;
    });
  }

  // Abrir modal con detalles de una tarea existente
  async openTaskDetails(taskId) {
    this.currentTaskId = taskId;
    this.isEditing = true;
    
    try {
      this.taskModalTitle.textContent = 'Detalles de la Tarea';
      this.deleteTaskBtn.classList.remove('hidden');
      
      // Cargar datos de la tarea
      const response = await fetch(`/tasks/${taskId}`);
      if (!response.ok) throw new Error('Error al cargar detalles de la tarea');
      
      const task = await response.json();
      
      // Rellenar el formulario
      document.getElementById('task-id').value = task.id;
      document.getElementById('detail-title').value = task.title;
      document.getElementById('detail-description').value = task.description || '';
      document.getElementById('detail-status').value = task.status;
      document.getElementById('detail-priority').value = task.priority;
      
      const dueDateInput = document.getElementById('detail-dueDate');
      dueDateInput.value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
      
      // Cargar asignados
      await this.loadProjectMembers('detail-assignedTo');
      document.getElementById('detail-assignedTo').value = task.assignedTo || '';
      
      // Cargar comentarios
      this.loadComments(taskId);
      
      // Mostrar modal
      this.taskDetailModal.classList.remove('hidden');
      
    } catch (error) {
      console.error('Error al cargar detalles de la tarea:', error);
      alert('Error al cargar detalles de la tarea');
    }
  }

  // Cargar los miembros del proyecto para el selector
  async loadProjectMembers(selectId) {
    try {
      const response = await fetch(`/projects/api/${this.projectId}`);
      if (!response.ok) throw new Error('Error al cargar miembros del proyecto');
      
      const project = await response.json();
      const assignedSelect = document.getElementById(selectId);
      
      // Mantener la opción por defecto
      assignedSelect.innerHTML = '<option value="">Sin asignar</option>';
      
      // Añadir propietario
      if (project.owner) {
        const option = document.createElement('option');
        option.value = project.owner.id;
        option.textContent = `${project.owner.name} (Propietario)`;
        assignedSelect.appendChild(option);
      }
      
      // Añadir miembros del proyecto
      if (project.members && project.members.length > 0) {
        project.members.forEach(member => {
          // Evitar duplicar propietario si también es miembro
          if (project.owner && member.id === project.owner.id) return;
          
          const option = document.createElement('option');
          option.value = member.id;
          option.textContent = member.name;
          assignedSelect.appendChild(option);
        });
      }
      
    } catch (error) {
      console.error('Error cargando miembros:', error);
    }
  }

  // Cargar comentarios de la tarea
  async loadComments(taskId) {
    try {
      const response = await fetch(`/tasks/${taskId}/comments`);
      if (!response.ok) throw new Error('Error al cargar comentarios');
      
      const comments = await response.json();
      const commentsList = document.querySelector('.comments-list');
      
      if (!comments || !comments.length) {
        commentsList.innerHTML = '<p class="text-gray-500 text-center">No hay comentarios aún.</p>';
        return;
      }
      
      commentsList.innerHTML = '';
      
      comments.forEach(comment => {
        const date = new Date(comment.createdAt).toLocaleString();
        commentsList.innerHTML += `
          <div class="comment border-l-4 border-blue-200 pl-3 py-2">
            <div class="flex justify-between items-center mb-1">
              <div class="flex items-center">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&size=20&background=random" class="w-5 h-5 rounded-full mr-2">
                <span class="font-medium text-sm">${this.escapeHtml(comment.author.name)}</span>
              </div>
              <span class="text-xs text-gray-500">${date}</span>
            </div>
            <p class="text-sm">${this.escapeHtml(comment.content)}</p>
          </div>
        `;
      });
      
    } catch (error) {
      console.error('Error cargando comentarios:', error);
      document.querySelector('.comments-list').innerHTML = `
        <div class="text-red-600 text-center">Error al cargar comentarios</div>
      `;
    }
  }

  // Mostrar/ocultar sección de comentarios
  toggleComments() {
    const isHidden = this.commentsContainer.classList.contains('hidden');
    
    if (isHidden) {
      this.commentsContainer.classList.remove('hidden');
      this.toggleCommentsBtn.querySelector('span').textContent = 'Ocultar';
    } else {
      this.commentsContainer.classList.add('hidden');
      this.toggleCommentsBtn.querySelector('span').textContent = 'Mostrar';
    }
  }

  // Guardar una tarea (crear nueva o actualizar existente)
  async saveTask() {
    const formData = {
      title: document.getElementById('detail-title').value.trim(),
      description: document.getElementById('detail-description').value.trim(),
      status: document.getElementById('detail-status').value,
      assignedTo: document.getElementById('detail-assignedTo').value || null,
      priority: document.getElementById('detail-priority').value,
      dueDate: document.getElementById('detail-dueDate').value || null
    };
    
    if (!formData.title) {
      alert('El título es obligatorio');
      return;
    }
    
    try {
      const submitBtn = this.taskDetailForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
      
      let response;
      
      if (this.isEditing) {
        // Actualizar tarea existente
        response = await fetch(`/tasks/${this.currentTaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        // Crear nueva tarea
        formData.projectId = this.projectId;
        response = await fetch(`/projects/${this.projectId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la tarea');
      }
      
      // Cerrar modal y recargar tareas
      this.closeTaskModal();
      this.loadTasks();
      
    } catch (error) {
      console.error('Error guardando tarea:', error);
      alert(error.message || 'Error al guardar la tarea');
    } finally {
      const submitBtn = this.taskDetailForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar';
    }
  }

  // Añadir un comentario a la tarea actual
  async addComment() {
    const contentInput = document.getElementById('comment-content');
    const content = contentInput.value.trim();
    
    if (!content) {
      alert('El comentario no puede estar vacío');
      return;
    }
    
    try {
      const submitBtn = this.commentForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      
      const response = await fetch(`/tasks/${this.currentTaskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al añadir comentario');
      }
      
      // Limpiar campo y recargar comentarios
      contentInput.value = '';
      this.loadComments(this.currentTaskId);
      
    } catch (error) {
      console.error('Error añadiendo comentario:', error);
      alert(error.message || 'Error al añadir comentario');
    } finally {
      const submitBtn = this.commentForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar comentario';
    }
  }

  // Confirmar y eliminar una tarea
  confirmDeleteTask() {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) {
      this.deleteTask(this.currentTaskId);
    }
  }

  // Eliminar una tarea
  async deleteTask(taskId) {
    try {
      const response = await fetch(`/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la tarea');
      }
      
      // Cerrar modal y recargar tareas
      this.closeTaskModal();
      this.loadTasks();
      
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      alert(error.message || 'Error al eliminar la tarea');
    }
  }

  // Actualizar el estado de una tarea
  async updateTaskStatus(taskId, newStatus) {
    try {
      const response = await fetch(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el estado');
      }
      
      // Recargar tareas para actualizar la vista
      this.loadTasks();
      
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert(error.message || 'Error al actualizar el estado de la tarea');
      
      // Revertir el cambio en el select
      const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
      if (taskCard) {
        const statusSelect = taskCard.querySelector('.task-status-select');
        const originalStatus = statusSelect.dataset.original;
        statusSelect.value = originalStatus;
      }
    }
  }

  // Cerrar modal de tarea
  closeTaskModal() {
    this.taskDetailModal.classList.add('hidden');
    this.taskDetailForm.reset();
    this.currentTaskId = null;
    this.isEditing = false;
    this.commentsContainer.classList.add('hidden');
    this.toggleCommentsBtn.querySelector('span').textContent = 'Mostrar';
  }

  // Función utilitaria para escapar HTML
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
