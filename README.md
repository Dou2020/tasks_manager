# Task Manager

Task Manager es una aplicación web colaborativa para la gestión de proyectos y tareas, inspirada en herramientas como Trello. Permite a los equipos organizarse, asignar responsabilidades y realizar seguimiento de actividades en tiempo real.

![Task Manager Screenshot](docs/images/screenshot.png)

## Características

- 📋 Organización de tareas en tableros Kanban (Por hacer, En progreso, Completado)
- 👥 Gestión de equipos y colaboradores
- 📱 Interfaz responsiva adaptada a dispositivos móviles y escritorio
- ⚡ Actualizaciones en tiempo real mediante Socket.IO
- 📧 Notificaciones por correo electrónico
- 🔄 Arrastrar y soltar tareas entre columnas
- 🔔 Sistema de notificaciones integrado
- 🔒 Sistema de autenticación y gestión de permisos

## Tecnologías

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript, Tailwind CSS
- **Vistas**: EJS (Embedded JavaScript)
- **Base de datos**: SQL Server (MSSQL)
- **ORM**: Sequelize
- **Tiempo Real**: Socket.IO
- **Email**: Nodemailer
- **Autenticación**: Express-session, bcrypt

## Instalación

### Requisitos previos

- Node.js (v14+)
- SQL Server
- Git

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar la base de datos

Crear una nueva base de datos en SQL Server:

```sql
CREATE DATABASE task_manager;
```

Crear un usuario con permisos o usar un usuario existente:

```sql
USE task_manager;
CREATE LOGIN task_user WITH PASSWORD = 'your_password';
CREATE USER task_user FOR LOGIN task_user;
EXEC sp_addrolemember 'db_owner', 'task_user';
```

### Paso 4: Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (MSSQL)
DB_HOST=your_server_name_or_ip
DB_PORT=1433
DB_NAME=task_manager
DB_USER=task_user
DB_PASS=your_password
DB_DIALECT=mssql

# Session
SESSION_SECRET=generate_a_random_string_here

# Email 
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
APP_URL=http://localhost:3000
```

> **Nota:** Para Gmail, necesitarás generar una "Contraseña de aplicación" desde la configuración de seguridad de tu cuenta de Google.

### Paso 5: Ejecutar migraciones de base de datos

Ejecuta el siguiente comando para crear las tablas necesarias en la base de datos:

```bash
npm run db:migrate
```

Opcionalmente, puedes cargar datos de prueba:

```bash
npm run db:seed
```

### Paso 6: Iniciar la aplicación

Modo desarrollo con recarga automática:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

---

### Estructura del Proyecto

```
task_manager/
│
├── public/             # Archivos estáticos (JS, CSS, imágenes)
│   ├── css/
│   ├── js/
│   └── images/
│
├── src/
│   ├── config/         # Configuraciones (DB, email)
│   ├── controllers/    # Controladores
│   ├── io/             # Configuración y eventos Socket.IO
│   ├── middlewares/    # Middlewares Express
│   ├── models/         # Modelos Sequelize
│   ├── routes/         # Rutas Express
│   ├── services/       # Servicios (email, etc.)
│   └── views/          # Plantillas EJS
│       ├── auth/
│       ├── partials/
│       ├── project/
│       └── user/

├── app.js              # Punto de entrada
├── sequelize.config.js # Configuración de Sequelize
└── package.json
```

---

### API REST

**Autenticación**
- `POST /auth/register` - Registrar un nuevo usuario  
- `POST /auth/login` - Iniciar sesión  
- `POST /auth/logout` - Cerrar sesión  

**Proyectos**
- `GET /projects` - Listar proyectos  
- `GET /projects/:id/view` - Ver un proyecto  
- `GET /projects/api/list` - API para listar proyectos  
- `GET /projects/api/:id` - API para obtener datos de un proyecto  
- `POST /projects` - Crear un proyecto  
- `POST /projects/:id/invite` - Invitar usuario a un proyecto  

**Tareas**
- `GET /projects/:projectId/tasks` - Listar tareas de un proyecto  
- `POST /projects/:projectId/tasks` - Crear una tarea  
- `GET /tasks/:id` - Obtener detalles de una tarea  
- `PUT /tasks/:id` - Actualizar una tarea  
- `PATCH /tasks/:id/status` - Actualizar solo el estado de una tarea  
- `DELETE /tasks/:id` - Eliminar una tarea  

**Comentarios**
- `GET /tasks/:id/comments` - Obtener comentarios de una tarea  
- `POST /tasks/:id/comments` - Añadir comentario a una tarea  

---

### Eventos Socket.IO

**Cliente → Servidor**
- `join-project` - Unirse a un proyecto para recibir actualizaciones  
- `heartbeat` - Verificación periódica de conexión activa  
- `request-refresh` - Solicitud para actualizar datos  
- `request-online-users` - Solicitar lista de usuarios en línea  

**Servidor → Cliente**
- `joined-project` - Confirmación de unión a un proyecto  
- `user-joined` - Notificación cuando otro usuario se une  
- `online-users` - Lista actualizada de usuarios en línea  
- `task-created` - Nueva tarea creada  
- `task-updated` - Tarea actualizada  
- `task-deleted` - Tarea eliminada  
- `comment-added` - Nuevo comentario añadido  
- `refresh-tasks` - Solicitud para recargar las tareas  

---

### Seguridad

- Autenticación de usuarios con sesiones  
- Contraseñas cifradas con bcrypt  
- Control de acceso basado en roles (propietario vs. miembro)  
- Validación de datos de entrada  
- Protección contra XSS  

---

### Tests
Asegurese de tener las dependecias instaladas
```
npm install
```
Para ejecutar los tests:
```
npm test
```

---
### Solución de problemas

**Error de conexión a la base de datos**  
- Asegúrate de que SQL Server está en ejecución  
- Verifica las credenciales en `.env`  
- Confirma que el puerto coincide con el de tu servidor SQL  
- Revisa que el usuario tenga permisos suficientes  

**Los correos no se envían**  
- Verifica la configuración SMTP en `.env`  
- Si usas Gmail, usa una "Contraseña de aplicación"  
- Consulta los logs del servidor  

**No se actualizan los datos en tiempo real**  
- Comprueba la conexión Socket.IO en la consola del navegador  
- Revisa errores en la consola del servidor  
- Asegura que el cliente esté unido al proyecto  

---

### Contribuir

1. Haz un fork del repositorio  
2. Crea una rama para tu funcionalidad (`git checkout -b feature/amazing-feature`)  
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)  
4. Sube la rama (`git push origin feature/amazing-feature`)  
5. Abre un Pull Request  

---

### Licencia

Este proyecto está licenciado bajo la Licencia MIT.  