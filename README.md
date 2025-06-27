# tasks_manager

# 🗂️ Task Manager API

Una API RESTful segura para la gestión de usuarios y tareas, construida con **Node.js**, **Express**, **Sequelize** y **JWT**.

---

## 📦 Requisitos Previos

- Node.js >= 16.x
- npm >= 8.x
- MySQL o MariaDB
- Git (opcional)

---

## ⚙️ Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/task_manager.git
cd task_manager
```

### 2. Instalar dependencias

```bash
npm install
```

---

## 🛠️ Configuración de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita los valores del `.env` según tu configuración local:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_manager_db
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

JWT_SECRET=tu_secreto
JWT_REFRESH_SECRET=tu_refresh_secreto
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 🧾 Configurar la base de datos

### 1. Crear la base de datos MSSQL SERVER

```sql
CREATE DATABASE task_manager_db 
```

> 💡 Asegúrate de que el usuario y contraseña coincidan con los valores de tu `.env`.

---

## 📂 Estructura del proyecto

```
task_manager/
├── src/
│   ├── config/
│   │   └── server.js
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── middleware/
│   │   └── security.middleware.js
│   ├── models/
│   │   ├── index.js
│   │   └── User.js
│   ├── routes/
│   │   └── auth.routes.js
│   ├── validators/
│   │   └── auth.validator.js
│   └── public/
│       ├── register.html
│       ├── login.html
│       └── home.html
├── migrations/
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 📤 Ejecutar migraciones

Asegúrate de tener configurado Sequelize CLI.

```bash
npm run db:migrate
```

Si no tienes `sequelize-cli` instalado globalmente:

```bash
npm install --save-dev sequelize-cli
```

---

## 🚀 Levantar el servidor

```bash
npm run dev
```

> Abre tu navegador en: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Endpoints disponibles

| Método | Ruta                    | Protegido | Descripción                         |
|--------|-------------------------|-----------|-------------------------------------|
| POST   | `/api/auth/register`    | ❌        | Registro de usuario                 |
| POST   | `/api/auth/login`       | ❌        | Inicio de sesión                    |
| POST   | `/api/auth/logout`      | ✅        | Cierra sesión                       |
| GET    | `/api/auth/profile`     | ✅        | Perfil del usuario autenticado      |
| GET    | `/api/auth/verify-token`| ✅        | Verifica si el token aún es válido  |
| POST   | `/api/auth/refresh-token` | ❌     | Renueva el token de acceso         |

---

## 📄 Notas adicionales

- El sistema usa JWT (access y refresh tokens).
- Seguridad incluida: Rate limiting, helmet, CORS estricto, XSS protection, HPP, validaciones y sanitización.
- Los formularios HTML están disponibles en `public/`.

---

## 📚 Scripts útiles

```bash
# Ejecutar en desarrollo
npm run dev

# Ejecutar migraciones
npx sequelize-cli db:migrate

# Crear una nueva migración
npx sequelize-cli migration:generate --name nombre_migracion

# Revertir última migración
npx sequelize-cli db:migrate:undo
```

---

## 🧪 Testeo rápido con curl

```bash
curl -X POST http://localhost:3000/api/auth/register \
 -H "Content-Type: application/json" \
 -d '{"username":"usuario1","email":"correo@example.com","password":"Test1234","confirmPassword":"Test1234"}'
```

---

## 📝 Licencia

Este proyecto está licenciado bajo la MIT License.
