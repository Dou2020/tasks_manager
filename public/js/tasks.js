/**
 * Gestor de Tareas Mejorado
 * Script para manejar la interacción con tareas en el proyecto
 * Incluye funcionalidad de Drag & Drop y mejores cards de tareas
 * CORREGIDO: Event listeners dinámicos para tareas nuevas
 */

class TaskManager {
  constructor(projectId) {
    this.projectId = projectId;
    this.currentTaskId = null;
    this.isEditing = false;
    this.draggedTask = null;
    this.draggedElement = null;

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

    // Contadores para estadísticas
    this.taskCounts = {
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0
    };

    this.init();
  }

  init() {
    // Configurar manejadores de eventos
    this.setupEventListeners();
    
    // Configurar drag and drop
    this.setupDragAndDrop();
    
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
      // Ver detalles de una tarea (solo si no es el botón de estado)
      if (e.target.closest('.task-card') && !e.target.closest('.task-status-select')) {
        const taskCard = e.target.closest('.task-card');
        this.openTaskDetails(taskCard.dataset.taskId);
      }
    });

    // Evento para cambios de estado en las tareas desde el dropdown
    document.addEventListener('change', (e) => {
      if (e.target.matches('.task-status-select')) {
        e.stopPropagation();
        const taskId = e.target.closest('.task-card').dataset.taskId;
        this.updateTaskStatus(taskId, e.target.value);
      }
    });
  }

  setupDragAndDrop() {
    // Configurar eventos de drag and drop para las columnas
    const columns = [this.todoTasksContainer, this.inProgressTasksContainer, this.completedTasksContainer];
    
    columns.forEach(column => {
      column.addEventListener('dragover', this.handleDragOver.bind(this));
      column.addEventListener('drop', this.handleDrop.bind(this));
      column.addEventListener('dragenter', this.handleDragEnter.bind(this));
      column.addEventListener('dragleave', this.handleDragLeave.bind(this));
    });
  }

  // NUEVO: Configurar event listeners para una tarea específica
  setupTaskEventListeners(taskCard) {
    // Configurar drag and drop
    taskCard.addEventListener('dragstart', this.handleDragStart.bind(this));
    taskCard.addEventListener('dragend', this.handleDragEnd.bind(this));
  }

  handleDragStart(e) {
    this.draggedElement = e.target;
    this.draggedTask = {
      id: e.target.dataset.taskId,
      originalStatus: e.target.closest('[data-column]').dataset.column
    };
    
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  }

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    this.draggedElement = null;
    this.draggedTask = null;
    
    // Limpiar efectos visuales de las columnas
    document.querySelectorAll('.task-column').forEach(col => {
      col.classList.remove('drag-over');
    });
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDragEnter(e) {
    e.preventDefault();
    if (e.target.closest('.task-column')) {
      e.target.closest('.task-column').classList.add('drag-over');
    }
  }

  handleDragLeave(e) {
    if (e.target.closest('.task-column') && !e.target.closest('.task-column').contains(e.relatedTarget)) {
      e.target.closest('.task-column').classList.remove('drag-over');
    }
  }

  async handleDrop(e) {
    e.preventDefault();
    
    if (!this.draggedTask) return;
    
    const column = e.target.closest('.task-column');
    if (!column) return;
    
    const newStatus = column.dataset.status;
    
    // Limpiar efectos visuales
    column.classList.remove('drag-over');
    
    // Si es el mismo estado, no hacer nada
    if (newStatus === this.draggedTask.originalStatus) return;
    
    // Actualizar el estado de la tarea
    try {
      await this.updateTaskStatus(this.draggedTask.id, newStatus);
    } catch (error) {
      console.error('Error en drag and drop:', error);
      // Recargar tareas si hay error
      this.loadTasks();
    }
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
      
      // Actualizar contadores
      this.updateTaskCounts(tasks);
      
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
        <div class="p-4 border border-red-200 bg-red-50 rounded-xl text-center">
          <div class="flex items-center justify-center mb-2">
            <i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
          </div>
          <p class="text-red-600 font-medium">Error al cargar tareas</p>
          <p class="text-red-500 text-sm">${error.message}</p>
          <button type="button" class="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200" onclick="taskManager.loadTasks()">
            <i class="fas fa-redo mr-1"></i>
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

  // Actualizar contadores de tareas
  updateTaskCounts(tasks) {
    this.taskCounts = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completado').length,
      inProgress: tasks.filter(t => t.status === 'En progreso').length,
      todo: tasks.filter(t => t.status === 'Por hacer').length
    };

    // Actualizar UI
    const totalTasksElement = document.getElementById('total-tasks');
    if (totalTasksElement) {
      totalTasksElement.textContent = this.taskCounts.total;
    }

    const progressElement = document.getElementById('progress-percentage');
    if (progressElement) {
      const percentage = this.taskCounts.total > 0 ? 
        Math.round((this.taskCounts.completed / this.taskCounts.total) * 100) : 0;
      progressElement.textContent = `${percentage}%`;
    }
  }

  // Renderizar tareas en una columna con diseño mejorado
  renderTasks(container, tasks) {
    if (!tasks || !tasks.length) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-gray-400">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <i class="fas fa-clipboard-list text-2xl"></i>
          </div>
          <p class="text-center font-medium">No hay tareas aquí</p>
          <p class="text-center text-sm">Arrastra una tarea o crea una nueva</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    tasks.forEach((task, index) => {
      const taskCard = this.createTaskCard(task, index);
      container.appendChild(taskCard);
      
      // IMPORTANTE: Configurar event listeners para cada tarea nueva
      this.setupTaskEventListeners(taskCard);
    });
  }

  // Crear una card de tarea mejorada
  createTaskCard(task, index) {
    const priorityConfig = {
      'Alta': { color: 'border-red-500 bg-red-50', badge: 'bg-red-100 text-red-800', icon: '🔴' },
      'Media': { color: 'border-yellow-500 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      'Baja': { color: 'border-green-500 bg-green-50', badge: 'bg-green-100 text-green-800', icon: '🟢' }
    };
    
    const config = priorityConfig[task.priority] || priorityConfig['Media'];
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && task.status !== 'Completado';
    const dueDateText = dueDate ? dueDate.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    }) : 'Sin fecha';

    const taskCard = document.createElement('div');
    taskCard.className = `task-card bg-white border-l-4 ${config.color} rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group fade-in-up`;
    taskCard.style.animationDelay = `${index * 0.1}s`;
    taskCard.dataset.taskId = task.id;
    taskCard.draggable = true;

    // NOTA: Los event listeners se configuran en renderTasks() después de crear la card

    taskCard.innerHTML = `
      <!-- Encabezado de la tarea -->
      <div class="flex justify-between items-start mb-3">
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-200">
            ${this.escapeHtml(task.title)}
          </h4>
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${config.badge} flex items-center gap-1">
              ${config.icon} ${task.priority}
            </span>
            ${isOverdue ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">⏰ Vencida</span>' : ''}
          </div>
        </div>
        
        <!-- Menú de estado -->
        <div class="relative">
          <select class="task-status-select text-xs border border-gray-200 rounded-lg py-1 px-2 bg-white hover:border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200" 
                  data-original="${task.status}" onclick="event.stopPropagation()">
            <option value="Por hacer" ${task.status === 'Por hacer' ? 'selected' : ''}>📋 Por hacer</option>
            <option value="En progreso" ${task.status === 'En progreso' ? 'selected' : ''}>⚡ En progreso</option>
            <option value="Completado" ${task.status === 'Completado' ? 'selected' : ''}>✅ Completado</option>
          </select>
        </div>
      </div>
      
      <!-- Descripción -->
      ${task.description ? `
        <p class="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          ${this.escapeHtml(task.description)}
        </p>
      ` : ''}
      
      <!-- Información de la tarea -->
      <div class="space-y-2">
        <!-- Fecha límite -->
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-1 text-gray-500">
            <i class="fas fa-calendar-alt"></i>
            <span class="${isOverdue ? 'text-red-600 font-medium' : ''}">
              ${dueDateText}
            </span>
          </div>
          
          <!-- Assignee -->
          ${task.assignee ? `
            <div class="flex items-center gap-1">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.name)}&size=20&background=10b981&color=ffffff&bold=true" 
                   class="w-5 h-5 rounded-full ring-2 ring-white shadow-sm">
              <span class="text-gray-600 font-medium">${this.escapeHtml(task.assignee.name)}</span>
            </div>
          ` : `
            <div class="flex items-center gap-1 text-gray-400">
              <i class="fas fa-user-slash text-xs"></i>
              <span class="text-xs">Sin asignar</span>
            </div>
          `}
        </div>
        
        <!-- Indicadores adicionales -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100">
          
          <!-- Drag handle -->
          <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <i class="fas fa-grip-vertical text-gray-300 cursor-grab"></i>
          </div>
        </div>
      </div>
      
      <!-- Barra de progreso visual (solo para en progreso) -->
      ${task.status === 'En progreso' ? `
        <div class="mt-3 pt-2 border-t border-gray-100">
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-200 rounded-full h-1.5">
              <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full" style="width: ${task.progress || 30}%"></div>
            </div>
            <span class="text-xs text-gray-500">${task.progress || 30}%</span>
          </div>
        </div>
      ` : ''}
      
      <!-- Estado completado -->
      ${task.status === 'Completado' ? `
        <div class="mt-3 pt-2 border-t border-gray-100">
          <div class="flex items-center gap-2 text-emerald-600">
            <i class="fas fa-check-circle"></i>
            <span class="text-xs font-medium">Completada</span>
            ${task.completedAt ? `<span class="text-xs text-gray-500">• ${new Date(task.completedAt).toLocaleDateString()}</span>` : ''}
          </div>
        </div>
      ` : ''}
    `;

    return taskCard;
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
      this.showNotification('Error al cargar detalles de la tarea', 'error');
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
        commentsList.innerHTML = `
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-comments text-3xl mb-2"></i>
            <p>No hay comentarios aún</p>
            <p class="text-sm">Sé el primero en comentar</p>
          </div>
        `;
        return;
      }
      
      commentsList.innerHTML = '';
      
      comments.forEach(comment => {
        const date = new Date(comment.createdAt).toLocaleString('es-ES', { 
          day: 'numeric', 
          month: 'short', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        const commentElement = document.createElement('div');
        commentElement.className = 'comment bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-blue-200';
        commentElement.innerHTML = `
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&size=24&background=10b981&color=ffffff&bold=true" 
                   class="w-6 h-6 rounded-full ring-2 ring-white shadow-sm">
              <span class="font-medium text-sm text-gray-800">${this.escapeHtml(comment.author.name)}</span>
            </div>
            <span class="text-xs text-gray-500">${date}</span>
          </div>
          <p class="text-sm text-gray-700 leading-relaxed">${this.escapeHtml(comment.content)}</p>
        `;
        
        commentsList.appendChild(commentElement);
      });
      
    } catch (error) {
      console.error('Error cargando comentarios:', error);
      document.querySelector('.comments-list').innerHTML = `
        <div class="text-red-600 text-center py-4">
          <i class="fas fa-exclamation-triangle mb-2"></i>
          <p>Error al cargar comentarios</p>
        </div>
      `;
    }
  }

  // Mostrar/ocultar sección de comentarios
  toggleComments() {
    const isHidden = this.commentsContainer.classList.contains('hidden');
    
    if (isHidden) {
      this.commentsContainer.classList.remove('hidden');
      this.toggleCommentsBtn.querySelector('span').textContent = 'Ocultar comentarios';
      this.toggleCommentsBtn.querySelector('i').className = 'fas fa-chevron-up';
    } else {
      this.commentsContainer.classList.add('hidden');
      this.toggleCommentsBtn.querySelector('span').textContent = 'Mostrar comentarios';
      this.toggleCommentsBtn.querySelector('i').className = 'fas fa-chevron-down';
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
      this.showNotification('El título es obligatorio', 'error');
      return;
    }
    
    try {
      const submitBtn = this.taskDetailForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
      
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
      await this.loadTasks(); // IMPORTANTE: Esperar a que se recarguen las tareas
      this.showNotification(
        this.isEditing ? 'Tarea actualizada correctamente' : 'Tarea creada correctamente', 
        'success'
      );
      
    } catch (error) {
      console.error('Error guardando tarea:', error);
      this.showNotification(error.message || 'Error al guardar la tarea', 'error');
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
      this.showNotification('El comentario no puede estar vacío', 'error');
      return;
    }
    
    try {
      const submitBtn = this.commentForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
      
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
      this.showNotification('Comentario añadido', 'success');
      
    } catch (error) {
      console.error('Error añadiendo comentario:', error);
      this.showNotification(error.message || 'Error al añadir comentario', 'error');
    } finally {
      const submitBtn = this.commentForm.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Enviar comentario';
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
      this.showNotification('Tarea eliminada correctamente', 'success');
      
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      this.showNotification(error.message || 'Error al eliminar la tarea', 'error');
    }
  }

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