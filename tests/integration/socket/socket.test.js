const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const { createServer } = http;
const { User, Project } = require('../../../src/models');
const socketAuth = require('../../../src/io/socketAuth');

describe('Socket.IO Integration', () => {
  let io, serverSocket, clientSocket, httpServer;
  
  beforeAll(async () => {
    // Crear servidor HTTP y Socket.IO
    httpServer = createServer();
    io = new Server(httpServer);
    
    // Mock de autenticación para socket
    const mockSessionMiddleware = (req, res, next) => {
      req.session = { userId: 1 };
      next();
    };
    
    // Mock de usuario en base de datos
    await User.create({
      id: 1,
      username: 'socketuser',
      name: 'Socket User',
      email: 'socket@example.com',
      password: 'password123'
    });
    
    // Configurar autenticación de Socket.IO
    io.use((socket, next) => {
      socket.request = { headers: { cookie: 'connect.sid=test' } };
      socket.request.session = { userId: 1 };
      socket.userId = 1;
      next();
    });
    
    // Configurar eventos de Socket
    io.on('connection', async (socket) => {
      socket.user = {
        id: 1,
        name: 'Socket User'
      };
      
      socket.on('join-project', (projectId) => {
        const roomName = `project-${projectId}`;
        socket.join(roomName);
        socket.emit('joined-project', { 
          projectId, 
          message: 'Conectado a actualizaciones en tiempo real',
          users: [{ id: 1, name: 'Socket User' }]
        });
        socket.to(roomName).emit('user-joined', {
          user: { id: 1, name: 'Socket User' }
        });
      });
      
      socket.on('heartbeat', () => {
        socket.emit('heartbeat-response', { received: true, timestamp: Date.now() });
      });
    });
    
    // Iniciar servidor HTTP
    await new Promise((resolve) => {
      httpServer.listen(3002, () => {
        console.log('Test server running on port 3002');
        resolve();
      });
    });
  });
  
  afterAll(() => {
    io.close();
    httpServer.close();
    clientSocket.close();
  });
  
  beforeEach((done) => {
    // Crear cliente de Socket.IO para pruebas
    clientSocket = Client('http://localhost:3002', {
      forceNew: true,
      reconnectionDelay: 0,
      transports: ['websocket']
    });
    clientSocket.on('connect', done);
  });
  
  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });
  
  test('debería conectarse correctamente', (done) => {
    expect(clientSocket.connected).toBe(true);
    done();
  });
  
  test('debería unirse a una sala de proyecto', (done) => {
    clientSocket.emit('join-project', '1');
    
    clientSocket.on('joined-project', (data) => {
      expect(data).toHaveProperty('projectId', '1');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('users');
      expect(data.users.length).toBe(1);
      done();
    });
  });
  
  test('debería recibir respuesta de heartbeat', (done) => {
    clientSocket.emit('heartbeat');
    
    clientSocket.on('heartbeat-response', (data) => {
      expect(data).toHaveProperty('received', true);
      expect(data).toHaveProperty('timestamp');
      done();
    });
  });
});
