'use strict';

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.bulkInsert('Priorities', [
      { name: 'Crítica', level_number: 1, color_hex: '#DC3545' },
      { name: 'Alta', level_number: 2, color_hex: '#FD7E14' },
      { name: 'Media', level_number: 3, color_hex: '#FFC107' },
      { name: 'Baja', level_number: 4, color_hex: '#6C757D' }
    ]);
  },
  down: async (queryInterface) => {
    return queryInterface.bulkDelete('Priorities', null, {});
  }
};
