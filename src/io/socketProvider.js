/**
 * Proveedor centralizado para acceder al objeto IO
 * Evita problemas de dependencia circular
 */

let io;

module.exports = {
  init: function(socketIO) {
    io = socketIO;
    return io;
  },
  getIO: function() {
    if (!io) {
      throw new Error('Socket.IO not initialized!');
    }
    return io;
  }
};
