'use strict';

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.bulkInsert('Task_Status', [
      { name: 'Pendiente',    description: 'Tarea pendiente',    color_hex: '#FFC107', is_final: false },
      { name: 'En Progreso',  description: 'Tarea en curso',     color_hex: '#17A2B8', is_final: false },
      { name: 'Completada',   description: 'Tarea completada',    color_hex: '#28A745', is_final: true  },
      { name: 'Cancelada',    description: 'Tarea cancelada',     color_hex: '#6C757D', is_final: true  }
    ]);
  },
  down: async (queryInterface) => {
    return queryInterface.bulkDelete('Task_Status', null, {});
  }
};
