require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./src/models');
//const cookie = require('cookie');
const cookieParser = require('cookie-parser');

// Inicialización
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Creamos un módulo centralizado para socket.io
const socketModule = {
  io: io,
  init: function(sessionMiddleware) {
    require('./src/io/socket')(this.io, sessionMiddleware);
    return this.io;
  },
  getIO: function() {
    if (!this.io) {
      throw new Error('Socket.IO not initialized!');
    }
    return this.io;
  }
};

// Configuración de sesión y middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
const sessionStore = new SequelizeStore({ db: sequelize });

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 día
});

app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'public')));
sessionStore.sync();

// View engine
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'ejs');

// Configuración de Socket.IO con autenticación
socketModule.init(sessionMiddleware);

// Import routes
const authRoutes = require('./src/routes/auth');
const projectRoutes = require('./src/routes/projects');
const taskRoutes = require('./src/routes/tasks');
const userRoutes = require('./src/routes/users');  // Importar las nuevas rutas de usuario

// Registramos las rutas - el orden es importante
app.use('/auth', authRoutes);
app.use('/', taskRoutes);  // Primero registramos las rutas de tareas
app.use('/projects', projectRoutes); // Después las de proyectos
app.use('/', userRoutes); // Registrar rutas de usuario

// Protect dashboard
const { ensureAuth } = require('./src/middlewares/auth');
app.get('/dashboard', ensureAuth, async (req, res) => {
  try {
    const { User } = require('./src/models');
    const user = await User.findByPk(req.session.userId);
    
    if (!user) {
      req.session.destroy();
      return res.redirect('/auth/login');
    }
    
    res.render('dashboard', {
      title: 'Dashboard',
      user: user
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.render('dashboard', {
      title: 'Dashboard',
      user: { name: 'Usuario' },
      error: 'No se pudo cargar la información del usuario'
    });
  }
});

// Arranque del servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// Exportar módulo de socket
module.exports = app;
module.exports.socketModule = socketModule;
