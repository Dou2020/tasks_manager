'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Create Users table first
      await queryInterface.createTable('Users', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        username: { type: Sequelize.STRING, allowNull: false, unique: true },
        name: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: false },
        first_name: { type: Sequelize.STRING },
        last_name: { type: Sequelize.STRING },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') }
      });
      
      console.log('Users table created successfully');

      // Create Projects table
      await queryInterface.createTable('Projects', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING, allowNull: false },
        description: { type: Sequelize.TEXT },
        ownerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
        status: { type: Sequelize.ENUM('Activo', 'Completado'), defaultValue: 'Activo' },
        createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') },
        updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') }
      });
      
      console.log('Projects table created successfully');

      // Improved error handling for ProjectMembers table
      try {
        // Create ProjectMembers table
        await queryInterface.createTable('ProjectMembers', {
          projectId: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false, references: { model: 'Projects', key: 'id' }, onDelete: 'CASCADE' },
          userId: { type: Sequelize.INTEGER, primaryKey:true ,allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'NO ACTION' },
          joinedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') },
          updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') }
        });
        
        console.log('ProjectMembers table created successfully');
      } catch (pmError) {
        console.error('ERROR creating ProjectMembers table:', pmError.message);
        console.error('Full error:', pmError);
        throw pmError;
      }

      // Improved error handling for Tasks table
      try {
        // Create Tasks table
        await queryInterface.createTable('Tasks', {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          title: { type: Sequelize.STRING, allowNull: false },
          description: { type: Sequelize.TEXT },
          projectId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Projects', key: 'id' }, onDelete: 'NO ACTION' },
          assignedTo: { type: Sequelize.INTEGER, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
          status: { type: Sequelize.ENUM('Por hacer', 'En progreso', 'Completado'), defaultValue: 'Por hacer' },
          priority: { type: Sequelize.ENUM('Baja', 'Media', 'Alta'), defaultValue: 'Media' },
          dueDate: { type: Sequelize.DATE },
          createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') },
          updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') }
        });
        
        console.log('Tasks table created successfully');
      } catch (tasksError) {
        console.error('ERROR creating Tasks table:', tasksError.message);
        console.error('Full error:', tasksError);
        throw tasksError;
      }

      // Improved error handling for Comments table
      try {
        // Create Comments table
        await queryInterface.createTable('Comments', {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          taskId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Tasks', key: 'id' }, onDelete: 'CASCADE' },
          userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
          content: { type: Sequelize.TEXT, allowNull: false },
          createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') },
          updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('getdate') }
        });
        
        console.log('Comments table created successfully');
      } catch (commentsError) {
        console.error('ERROR creating Comments table:', commentsError.message);
        console.error('Full error:', commentsError);
        throw commentsError;
      }
      
    } catch (error) {
      // Improved error logging
      console.error('MIGRATION ERROR:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  down: async (queryInterface) => {
    try {
      // Drop in reverse order to handle dependencies
      await queryInterface.dropTable('Comments');
      await queryInterface.dropTable('Tasks');
      await queryInterface.dropTable('ProjectMembers');
      await queryInterface.dropTable('Projects');
      await queryInterface.dropTable('Users');
      console.log('All tables dropped successfully');
    } catch (error) {
      console.error('Rollback error:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
};