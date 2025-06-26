'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'refresh_token', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
      after: 'password_hash' // opcional, para posicionarla justo después de password_hash
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'refresh_token');
  }
};
