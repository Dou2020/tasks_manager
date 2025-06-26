'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Aquí puedes crear todas las tablas propuestas en tu DDL
    await queryInterface.createTable('Users', {
      user_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      first_name: { type: Sequelize.STRING(50) },
      last_name: { type: Sequelize.STRING(50) },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') },
      last_login: { type: Sequelize.DATE }
    });

    // Repite para Categories, Priorities, Task_Status, Tasks, Task_Comments, Task_Attachments, Task_History, User_Sessions
    // Por brevedad sólo dejo un ejemplo más:
    await queryInterface.createTable('Categories', {
      category_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(50), allowNull: false },
      description: { type: Sequelize.STRING(200) },
      color_hex: { type: Sequelize.STRING(7), defaultValue: '#007ACC' },
      icon: { type: Sequelize.STRING(50) },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') },
    });

    await queryInterface.createTable('Priorities', {
      priority_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(50), allowNull: false },
      level_number: { type: Sequelize.INTEGER, allowNull: false },
      color_hex: { type: Sequelize.STRING(7), defaultValue: '#FFA500' },
    });

    await queryInterface.createTable('Task_Status', {
      status_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(30), allowNull: false },
      description: { type: Sequelize.STRING(100) },
      color_hex: { type: Sequelize.STRING(7), defaultValue: '#28A745' },
      is_final: { type: Sequelize.BOOLEAN, defaultValue: false }, // Indica si es un estado final (Completada/Cancelada)
    });

    await queryInterface.createTable('Tasks', {
      task_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
        description: { type: Sequelize.TEXT },
        user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'user_id' }, onDelete: 'CASCADE' },
        category_id: { type: Sequelize.INTEGER, references: { model: 'Categories', key: 'category_id' }, onDelete: 'SET NULL' },
        priority_id: { type: Sequelize.INTEGER, defaultValue: 3, references: { model: 'Priorities', key: 'priority_id' }, onDelete: 'SET DEFAULT' },
        status_id: { type: Sequelize.INTEGER, defaultValue: 1, references: { model: 'Task_Status', key: 'status_id' }, onDelete: 'SET DEFAULT' },
        due_date: { type: Sequelize.DATE },
        start_date: { type: Sequelize.DATE },
        completed_date: { type: Sequelize.DATE },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') },
        estimated_hours: { type: Sequelize.DECIMAL(5, 2) },
        actual_hours: { type: Sequelize.DECIMAL(5, 2) },
        progress_percentage: { type: Sequelize.INTEGER, defaultValue: 0, validate: { min: 0, max: 100 } },
        tags: { type: Sequelize.STRING(500) }, // Tags separados por comas
        notes: { type: Sequelize.TEXT },
        is_archived: { type: Sequelize.BOOLEAN, defaultValue: false }
    });

    
    await queryInterface.createTable('Task_Comments', {
      comment_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      task_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Tasks', key: 'task_id' }, onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'user_id' }, onDelete: 'NO ACTION' },
      comment_text: { type: Sequelize.TEXT, allowNull: false },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') },
        is_edited: { type: Sequelize.BOOLEAN, defaultValue: false }
    });

    
    await queryInterface.createTable('Task_Attachments', {
      attachment_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      task_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Tasks', key: 'task_id' }, onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'user_id' }, onDelete: 'NO ACTION' },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      file_path: { type: Sequelize.STRING(500), allowNull: false },
      file_size: { type: Sequelize.BIGINT }, // Tamaño en bytes
      file_type: { type: Sequelize.STRING(50) }, // MIME type
      uploaded_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') }
    });

    
    await queryInterface.createTable('Task_History', {
      history_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      task_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Tasks', key: 'task_id' }, onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'user_id' }, onDelete: 'NO ACTION' },
      action_type: { type: Sequelize.STRING(50), allowNull: false }, // 'CREATED', 'UPDATED', 'STATUS_CHANGED', 'DELETED'
      field_name: { type: Sequelize.STRING(50) }, // Campo que cambió
      old_value: { type: Sequelize.TEXT }, // Valor anterior
      new_value: { type: Sequelize.TEXT }, // Nuevo valor
      change_description: { type: Sequelize.STRING(500) },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') }
    });

    /* CREATE TABLE User_Sessions (
    session_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    socket_id NVARCHAR(100) NOT NULL,
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(500),
    connected_at DATETIME2 DEFAULT GETDATE(),
    disconnected_at DATETIME2,
    is_active BIT DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    
    -- �ndices
    INDEX IX_UserSessions_UserId (user_id),
    INDEX IX_UserSessions_SocketId (socket_id),
    INDEX IX_UserSessions_Active (is_active)
);*/

    await queryInterface.createTable('User_Sessions', {
      session_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'user_id' }, onDelete: 'CASCADE' },
      socket_id: { type: Sequelize.STRING(100), allowNull: false }, 
        ip_address: { type: Sequelize.STRING(45) }, // IPv4 o IPv6
        user_agent: { type: Sequelize.STRING(500) },
        connected_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('GETDATE') },
        disconnected_at: { type: Sequelize.DATE },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true }
    });



    // ... demás tablas
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('User_Sessions');
    await queryInterface.dropTable('Task_History');
    await queryInterface.dropTable('Task_Attachments');
    await queryInterface.dropTable('Task_Comments');
    await queryInterface.dropTable('Tasks');
    await queryInterface.dropTable('Task_Status');
    await queryInterface.dropTable('Priorities');
    await queryInterface.dropTable('Categories');
    await queryInterface.dropTable('Users');
  }
};
