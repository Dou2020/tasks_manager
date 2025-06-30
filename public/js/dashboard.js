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

  // Abrir modal
  if (createProjectBtn) {
    createProjectBtn.addEventListener('click', function() {
      projectModal.classList.remove('hidden');
    });
  }

  // Cerrar modal (con cualquier botón de cierre)
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      projectModal.classList.add('hidden');
      projectForm.reset(); // Resetear formulario al cerrar
      document.getElementById('name-error').classList.add('hidden');
    });
  });

  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', function(event) {
    if (event.target === projectModal) {
      projectModal.classList.add('hidden');
      projectForm.reset();
      document.getElementById('name-error').classList.add('hidden');
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
        return;
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
        submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creando...';
        
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
        
        // Cerrar modal y resetear formulario
        projectModal.classList.add('hidden');
        projectForm.reset();
        
        // Redireccionar a la página del proyecto o recargar para ver cambios
        window.location.href = `/projects/${project.id}/view`;
        
      } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al crear el proyecto');
      } finally {
        // Restaurar botón
        const submitBtn = projectForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
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
        <div class="p-4 border border-red-200 bg-red-50 rounded-lg text-center">
          <p class="text-red-600">Error al cargar proyectos.</p>
          <button class="mt-2 text-blue-600 hover:underline" onclick="loadProjects()">
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
        <div class="p-4 border rounded-lg text-center bg-gray-50">
          <p class="text-gray-500">No hay proyectos disponibles.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    projects.forEach(project => {
      const date = new Date(project.createdAt).toLocaleDateString();
      
      container.innerHTML += `
        <div class="p-4 border rounded-lg hover:shadow-md transition-shadow">
          <h3 class="font-bold text-lg mb-1">${escapeHtml(project.name)}</h3>
          <div class="text-sm text-gray-500 mb-2">
            Creado el ${date}
          </div>
          <p class="text-gray-700 mb-3 text-sm line-clamp-2">
            ${project.description ? escapeHtml(project.description) : 'Sin descripción'}
          </p>
          <a href="/projects/${project.id}/view" class="text-blue-600 hover:underline inline-flex items-center text-sm">
            Ver detalles
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
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
});
