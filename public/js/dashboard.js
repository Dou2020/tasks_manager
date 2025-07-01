document.addEventListener('DOMContentLoaded', function() {
  // Referencias a elementos DOM
  const createProjectBtn = document.getElementById('create-project-btn');
  const projectModal = document.getElementById('project-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const projectForm = document.getElementById('project-form');
  
  // Elementos opcionales que pueden no estar presentes en todas las páginas
  const ownedProjectsContainer = document.getElementById('owned-projects');
  const memberProjectsContainer = document.getElementById('member-projects');
  const recentProjectsContainer = document.getElementById('recent-projects-container');

  // Abrir modal con animación
  if (createProjectBtn) {
    createProjectBtn.addEventListener('click', function() {
      projectModal.classList.remove('hidden');
      // Pequeño delay para la animación
      setTimeout(() => {
        const modalContent = projectModal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.classList.remove('scale-95', 'opacity-0');
          modalContent.classList.add('scale-100', 'opacity-100');
        }
      }, 10);
    });
  }

  // Cerrar modal con animación
  function closeModal() {
    const modalContent = projectModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.classList.remove('scale-100', 'opacity-100');
      modalContent.classList.add('scale-95', 'opacity-0');
    }
    
    setTimeout(() => {
      projectModal.classList.add('hidden');
      projectForm.reset();
      const nameError = document.getElementById('name-error');
      if (nameError) nameError.classList.add('hidden');
    }, 200);
  }

  // Cerrar modal (con cualquier botón de cierre)
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', function(event) {
    if (event.target === projectModal) {
      closeModal();
    }
  });

  // Cerrar modal con Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !projectModal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Validación y envío del formulario
  if (projectForm) {
    projectForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Validación básica
      const nameInput = document.getElementById('project-name');
      const nameError = document.getElementById('name-error');
      
      if (!nameInput.value.trim()) {
        nameError.classList.remove('hidden');
        nameInput.focus();
        nameInput.classList.add('border-red-300');
        return;
      } else {
        nameError.classList.add('hidden');
        nameInput.classList.remove('border-red-300');
      }
      
      // Recoger datos del formulario
      const formData = {
        name: nameInput.value.trim(),
        description: document.getElementById('project-description').value.trim()
      };
      
      try {
        // Mostrar indicador de carga
        const submitBtn = projectForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin h-5 w-5 mr-3 inline" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creando...
        `;
        
        // Enviar solicitud a la API
        const response = await fetch('/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear el proyecto');
        }
        
        const project = await response.json();
        
        // Mostrar notificación de éxito
        showNotification('Proyecto creado exitosamente', 'success');
        
        // Cerrar modal y resetear formulario
        closeModal();
        
        // Redireccionar a la página del proyecto o recargar para ver cambios
        setTimeout(() => {
          window.location.href = `/projects/${project.id}/view`;
        }, 1000);
        
      } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'Error al crear el proyecto', 'error');
      } finally {
        // Restaurar botón
        const submitBtn = projectForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  // Cargar proyectos si estamos en la página de proyectos
  if (ownedProjectsContainer || memberProjectsContainer || recentProjectsContainer) {
    loadProjects();
  }

  // Función para cargar proyectos desde la API
  async function loadProjects() {
    try {
      const response = await fetch('/projects/api/list');
      if (!response.ok) {
        throw new Error('Error al cargar proyectos');
      }
      
      const data = await response.json();
      
      // Renderizar proyectos propios
      if (ownedProjectsContainer && data.ownedProjects) {
        renderProjects(ownedProjectsContainer, data.ownedProjects);
      }
      
      // Renderizar proyectos como miembro
      if (memberProjectsContainer && data.memberProjects) {
        renderProjects(memberProjectsContainer, data.memberProjects);
      }
      
      // Renderizar proyectos recientes en el dashboard
      if (recentProjectsContainer) {
        // Combinar y ordenar por fecha
        const allProjects = [
          ...(data.ownedProjects || []), 
          ...(data.memberProjects || [])
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Mostrar solo los 3 más recientes
        renderProjects(recentProjectsContainer, allProjects.slice(0, 3));
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      const message = `
        <div class="p-6 border-2 border-red-200 bg-red-50 rounded-xl text-center">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-exclamation-triangle text-red-600"></i>
          </div>
          <p class="text-red-600 font-medium mb-3">Error al cargar proyectos</p>
          <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors" onclick="location.reload()">
            <i class="fas fa-redo mr-2"></i>
            Reintentar
          </button>
        </div>
      `;
      
      if (ownedProjectsContainer) ownedProjectsContainer.innerHTML = message;
      if (memberProjectsContainer) memberProjectsContainer.innerHTML = message;
      if (recentProjectsContainer) recentProjectsContainer.innerHTML = message;
    }
  }

  // Función para renderizar proyectos en un contenedor
  function renderProjects(container, projects) {
    if (!projects.length) {
      container.innerHTML = `
        <div class="col-span-full p-8 border-2 border-dashed border-gray-200 rounded-xl text-center bg-gray-50">
          <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-folder-open text-gray-400 text-xl"></i>
          </div>
          <p class="text-gray-500 font-medium mb-2">No hay proyectos disponibles</p>
          <p class="text-gray-400 text-sm">Crea tu primer proyecto para comenzar</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    projects.forEach(project => {
      const date = new Date(project.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const projectCard = document.createElement('div');
      projectCard.className = 'bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 transform hover:-translate-y-1';
      
      projectCard.innerHTML = `
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-project-diagram text-emerald-600"></i>
          </div>
          <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">${date}</span>
        </div>
        
        <h3 class="font-bold text-lg mb-2 text-gray-800 line-clamp-1">${escapeHtml(project.name)}</h3>
        
        <p class="text-gray-600 mb-4 text-sm line-clamp-2 min-h-10">
          ${project.description ? escapeHtml(project.description) : 'Sin descripción disponible'}
        </p>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center text-xs text-gray-500">
            <i class="fas fa-calendar mr-1"></i>
            <span>Creado ${date}</span>
          </div>
          
          <a href="/projects/${project.id}/view" class="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors duration-200">
            <span>Ver detalles</span>
            <i class="fas fa-arrow-right ml-2"></i>
          </a>
        </div>
      `;
      
      container.appendChild(projectCard);
    });
  }

  // Función utilitaria para escapar HTML
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Función para mostrar notificaciones
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 
                   type === 'error' ? 'bg-red-100 border-red-500 text-red-700' : 
                   'bg-blue-100 border-blue-500 text-blue-700';
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    notification.className = `fixed top-4 right-4 ${bgColor} border-l-4 p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${icon} mr-3"></i>
        <span class="font-medium">${message}</span>
        <button class="ml-4 text-current opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 5000);
  }
});