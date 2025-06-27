
        // Configuración de la aplicación
        const API_BASE_URL = '/api';
        
        // Variables globales
        let currentUser = null;
        let userStats = null;
        
        // Inicializar la aplicación
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });
        
        // Función principal de inicialización
        async function initializeApp() {
            try {
                // Verificar autenticación
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    redirectToLogin();
                    return;
                }
                
                // Obtener datos del usuario
                await loadUserData();
                
                // Cargar estadísticas
                await loadUserStats();
                
                // Cargar tareas próximas
                await loadUpcomingTasks();
                
                // Configurar event listeners
                setupEventListeners();
                
            } catch (error) {
                console.error('Error inicializando aplicación:', error);
                handleAuthError();
            }
        }
        
        // Cargar datos del usuario
        async function loadUserData() {
            const userData = localStorage.getItem('userData');
            if (userData) {
                currentUser = JSON.parse(userData);
                updateUserDisplay();
            }
        }
        
        // Actualizar la información del usuario en la UI
        function updateUserDisplay() {
            if (currentUser) {
                document.getElementById('username').textContent = currentUser.username;
                document.getElementById('welcomeUsername').textContent = currentUser.first_name || currentUser.username;
            }
        }
        
        // Cargar estadísticas del usuario
        async function loadUserStats() {
            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/tasks/stats`);
                const data = await response.json();
                
                if (data.success) {
                    userStats = data.data.stats;
                    updateStatsDisplay();
                }
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
            }
        }
        
        // Actualizar estadísticas en la UI
        function updateStatsDisplay() {
            if (userStats) {
                document.getElementById('totalTasks').textContent = userStats.total || 0;
                document.getElementById('pendingTasks').textContent = userStats.pending || 0;
                document.getElementById('completedTasks').textContent = userStats.completed || 0;
                document.getElementById('overdueTasks').textContent = userStats.overdue || 0;
            }
        }
        
        // Cargar tareas próximas
        async function loadUpcomingTasks() {
            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/tasks/upcoming?days=7`);
                const data = await response.json();
                
                if (data.success) {
                    displayUpcomingTasks(data.data.tasks);
                }
            } catch (error) {
                console.error('Error cargando tareas próximas:', error);
                document.getElementById('upcomingTasks').innerHTML = `
                    <p class="text-muted text-center">
                        <i class="bi bi-exclamation-circle me-2"></i>
                        Error cargando tareas
                    </p>
                `;
            }
        }
        
        // Mostrar tareas próximas
        function displayUpcomingTasks(tasks) {
            const container = document.getElementById('upcomingTasks');
            
            if (!tasks || tasks.length === 0) {
                container.innerHTML = `
                    <p class="text-muted text-center">
                        <i class="bi bi-check-circle me-2"></i>
                        No hay tareas próximas
                    </p>
                `;
                return;
            }
            
            const tasksHtml = tasks.slice(0, 3).map(task => {
                const dueDate = new Date(task.due_date);
                const isOverdue = dueDate < new Date();
                const dateColor = isOverdue ? 'text-danger' : 'text-warning';
                
                return `
                    <div class="d-flex justify-content-between align-items-center mb-2 p-2 border-start border-3" 
                         style="border-color: ${isOverdue ? '#dc3545' : '#ffc107'} !important;">
                        <div>
                            <small class="fw-bold">${task.title}</small><br>
                            <small class="${dateColor}">
                                <i class="bi bi-calendar me-1"></i>
                                ${formatDate(task.due_date)}
                            </small>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = tasksHtml;
        }
        
        // Configurar event listeners
        function setupEventListeners() {
            // Botón de crear tarea
            document.getElementById('createTaskBtn').addEventListener('click', function() {
                window.location.href = '/task.html?action=create';
            });
            
            // Botón de ver tareas
            document.getElementById('viewTasksBtn').addEventListener('click', function() {
                window.location.href = '/task.html';
            });
            
            // Botón de logout
            document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        }
        
        // Manejar logout
        async function handleLogout() {
            try {
                // Llamar al endpoint de logout si existe
                await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Error en logout:', error);
            } finally {
                // Limpiar storage y redirigir
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userData');
                redirectToLogin();
            }
        }
        
        // Función para hacer peticiones autenticadas
        async function fetchWithAuth(url, options = {}) {
            const token = localStorage.getItem('accessToken');
            
            const config = {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                }
            };
            
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                handleAuthError();
                throw new Error('No autorizado');
            }
            
            return response;
        }
        
        // Manejar errores de autenticación
        function handleAuthError() {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            redirectToLogin();
        }
        
        // Redirigir al login
        function redirectToLogin() {
            window.location.href = '/login.html';
        }
        
        // Formatear fecha
        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = date - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                return `Vencida hace ${Math.abs(diffDays)} días`;
            } else if (diffDays === 0) {
                return 'Vence hoy';
            } else if (diffDays === 1) {
                return 'Vence mañana';
            } else {
                return `Vence en ${diffDays} días`;
            }
        }


/*document.addEventListener('DOMContentLoaded', async () => {
  const userInfoDiv = document.getElementById('userInfo');
  const logoutBtn   = document.getElementById('logoutBtn');

  const token = localStorage.getItem('accessToken');
  if (!token) {
    // No hay token: redirigir a login
    return window.location.href = '/login.html';
  }

  try {
    // Obtener perfil
    const res = await fetch('/api/auth/profile', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'No autorizado');

    const { username, email, first_name, last_name } = data.data.user;
    userInfoDiv.innerHTML = `
      <p><strong>Usuario:</strong> ${username}</p>
      <p><strong>Nombre:</strong> ${first_name || '-'} ${last_name || ''}</p>
      <p><strong>Email:</strong> ${email}</p>
    `;
  } catch (err) {
    console.error(err);
    // Token inválido o expirado → logout
    return doLogout();
  }

  logoutBtn.addEventListener('click', doLogout);

  async function doLogout() {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken  = localStorage.getItem('accessToken');
    // Llamar al endpoint de logout para limpiar en servidor
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken }
    }).catch(() => { /* ignore errors *//* });

   /* // Limpiar almacenamiento y redirigir
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login.html';
  }
});*/