'use strict';

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.bulkInsert('Categories', [
      { name: 'Desarrollo', description: 'Tareas de desarrollo', color_hex: '#28A745', icon: 'code', is_active: true, created_at: new Date() },
      { name: 'Diseño',      description: 'Tareas de diseño',    color_hex: '#17A2B8', icon: 'brush', is_active: true, created_at: new Date() },
      { name: 'Marketing',   description: 'Tareas de marketing', color_hex: '#FFC107', icon: 'bullhorn', is_active: true, created_at: new Date() }
    ]);
  },
  down: async (queryInterface) => {
    return queryInterface.bulkDelete('Categories', null, {});
  }
};
