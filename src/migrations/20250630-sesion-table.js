// src/migrations/YYYYMMDD-create-sessions.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Sessions', {
      sid: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      expires: Sequelize.DATE,
      data: Sequelize.TEXT,
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('getdate')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('getdate')
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Sessions');
  }
};